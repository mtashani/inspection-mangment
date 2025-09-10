"""Tests for Prediction Tracker Service"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from app.domains.rbi.services.prediction_tracker import (
    PredictionTracker,
    PredictionRecord,
    PredictionOutcome,
    AccuracyMetric,
    AccuracyAssessment,
    SystemAccuracyReport
)
from app.domains.rbi.models.core import (
    RBICalculationResult,
    EquipmentData,
    InspectionFinding,
    ThicknessMeasurement,
    RBILevel,
    RiskLevel,
    EquipmentType,
    ServiceType
)


class TestPredictionTracker:
    """Test cases for PredictionTracker"""
    
    @pytest.fixture
    def tracker(self):
        """Create prediction tracker instance"""
        return PredictionTracker()
    
    @pytest.fixture
    def sample_calculation_result(self):
        """Create sample calculation result"""
        return RBICalculationResult(
            equipment_id="EQ-001",
            calculation_level=RBILevel.LEVEL_2,
            requested_level=RBILevel.LEVEL_2,
            fallback_occurred=False,
            next_inspection_date=datetime.now() + timedelta(days=730),
            risk_level=RiskLevel.MEDIUM,
            pof_score=0.6,
            cof_scores={"safety": 0.7, "environmental": 0.5, "economic": 0.8},
            confidence_score=0.85,
            data_quality_score=0.9,
            calculation_timestamp=datetime.now(),
            inspection_interval_months=24,
            missing_data=[],
            estimated_parameters=[]
        )
    
    @pytest.fixture
    def sample_equipment_data(self):
        """Create sample equipment data"""
        return EquipmentData(
            equipment_id="EQ-001",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime.now() - timedelta(days=15*365),
            design_pressure=50.0,
            design_temperature=200.0,
            material="Carbon Steel",
            criticality_level="High"
        )
    
    @pytest.fixture
    def sample_inspection_findings(self):
        """Create sample inspection findings"""
        return [
            InspectionFinding(
                finding_type="Corrosion",
                severity="Medium",
                description="General corrosion observed",
                location="Bottom section",
                recommendation="Monitor closely",
                finding_date=datetime.now()
            ),
            InspectionFinding(
                finding_type="Pitting",
                severity="Low",
                description="Minor pitting detected",
                location="Top section",
                recommendation="Continue monitoring",
                finding_date=datetime.now()
            )
        ]

    def test_record_prediction(self, tracker, sample_calculation_result, sample_equipment_data):
        """Test recording a new prediction"""
        
        prediction_id = tracker.record_prediction(
            calculation_result=sample_calculation_result,
            equipment_data=sample_equipment_data,
            prediction_context={"inspector": "John Doe", "weather": "clear"}
        )
        
        assert prediction_id.startswith("PRED_EQ-001_")
        assert len(tracker._prediction_records) == 1
        assert prediction_id in tracker._prediction_records
        assert "EQ-001" in tracker._equipment_predictions
        assert prediction_id in tracker._equipment_predictions["EQ-001"]
        
        # Check prediction record details
        prediction = tracker._prediction_records[prediction_id]
        assert prediction.equipment_id == "EQ-001"
        assert prediction.predicted_risk_level == RiskLevel.MEDIUM
        assert prediction.predicted_interval_months == 24
        assert prediction.confidence_score == 0.85
        assert prediction.data_quality_score == 0.9
        assert prediction.input_parameters["equipment_type"] == "pressure_vessel"
        assert prediction.input_parameters["inspector"] == "John Doe"

    def test_update_actual_outcome(self, tracker, sample_calculation_result, 
                                 sample_equipment_data, sample_inspection_findings):
        """Test updating prediction with actual outcomes"""
        
        # Record prediction first
        prediction_id = tracker.record_prediction(
            sample_calculation_result, sample_equipment_data
        )
        
        # Update with actual outcomes
        actual_inspection_date = datetime.now() + timedelta(days=700)
        success = tracker.update_actual_outcome(
            prediction_id=prediction_id,
            actual_inspection_date=actual_inspection_date,
            inspection_findings=sample_inspection_findings,
            actual_risk_assessment=RiskLevel.MEDIUM
        )
        
        assert success is True
        
        # Check updated prediction
        prediction = tracker._prediction_records[prediction_id]
        assert prediction.actual_inspection_date == actual_inspection_date
        assert len(prediction.actual_findings) == 2
        assert prediction.actual_risk_assessment == RiskLevel.MEDIUM
        assert prediction.outcome_classification == PredictionOutcome.ACCURATE
        assert AccuracyMetric.RISK_LEVEL_ACCURACY.value in prediction.accuracy_scores
        assert prediction.accuracy_scores[AccuracyMetric.RISK_LEVEL_ACCURACY.value] == 1.0

    def test_update_nonexistent_prediction(self, tracker):
        """Test updating non-existent prediction"""
        
        success = tracker.update_actual_outcome(
            prediction_id="NONEXISTENT",
            actual_inspection_date=datetime.now(),
            inspection_findings=[],
            actual_risk_assessment=RiskLevel.LOW
        )
        
        assert success is False

    def test_classify_prediction_outcome_accurate(self, tracker):
        """Test accurate prediction classification"""
        
        prediction = PredictionRecord(
            prediction_id="TEST_001",
            equipment_id="EQ-001",
            prediction_date=datetime.now(),
            predicted_risk_level=RiskLevel.HIGH,
            predicted_interval_months=12,
            predicted_next_inspection=datetime.now() + timedelta(days=365),
            calculation_level=RBILevel.LEVEL_2,
            confidence_score=0.8,
            data_quality_score=0.9
        )
        prediction.actual_risk_assessment = RiskLevel.HIGH
        
        outcome = tracker._classify_prediction_outcome(prediction)
        assert outcome == PredictionOutcome.ACCURATE

    def test_classify_prediction_outcome_over_predicted(self, tracker):
        """Test over-predicted classification"""
        
        prediction = PredictionRecord(
            prediction_id="TEST_002",
            equipment_id="EQ-001",
            prediction_date=datetime.now(),
            predicted_risk_level=RiskLevel.VERY_HIGH,
            predicted_interval_months=6,
            predicted_next_inspection=datetime.now() + timedelta(days=180),
            calculation_level=RBILevel.LEVEL_2,
            confidence_score=0.7,
            data_quality_score=0.8
        )
        prediction.actual_risk_assessment = RiskLevel.MEDIUM
        
        outcome = tracker._classify_prediction_outcome(prediction)
        assert outcome == PredictionOutcome.OVER_PREDICTED

    def test_classify_prediction_outcome_under_predicted(self, tracker):
        """Test under-predicted classification"""
        
        prediction = PredictionRecord(
            prediction_id="TEST_003",
            equipment_id="EQ-001",
            prediction_date=datetime.now(),
            predicted_risk_level=RiskLevel.LOW,
            predicted_interval_months=36,
            predicted_next_inspection=datetime.now() + timedelta(days=1095),
            calculation_level=RBILevel.LEVEL_1,
            confidence_score=0.6,
            data_quality_score=0.7
        )
        prediction.actual_risk_assessment = RiskLevel.HIGH
        
        outcome = tracker._classify_prediction_outcome(prediction)
        assert outcome == PredictionOutcome.UNDER_PREDICTED

    def test_assess_risk_from_findings_critical(self, tracker):
        """Test risk assessment from critical findings"""
        
        critical_findings = [
            InspectionFinding(
                finding_type="Crack",
                severity="Critical",
                description="Critical crack detected",
                location="Weld seam"
            )
        ]
        
        risk_level = tracker._assess_risk_from_findings(critical_findings)
        assert risk_level == RiskLevel.VERY_HIGH

    def test_assess_risk_from_findings_multiple_high(self, tracker):
        """Test risk assessment from multiple high severity findings"""
        
        high_findings = [
            InspectionFinding(
                finding_type="Corrosion",
                severity="High",
                description="Severe corrosion",
                location="Bottom"
            ),
            InspectionFinding(
                finding_type="Pitting",
                severity="High",
                description="Deep pitting",
                location="Side"
            ),
            InspectionFinding(
                finding_type="Erosion",
                severity="High",
                description="Erosion damage",
                location="Inlet"
            )
        ]
        
        risk_level = tracker._assess_risk_from_findings(high_findings)
        assert risk_level == RiskLevel.VERY_HIGH

    def test_assess_risk_from_findings_no_findings(self, tracker):
        """Test risk assessment with no findings"""
        
        risk_level = tracker._assess_risk_from_findings([])
        assert risk_level == RiskLevel.LOW

    def test_calculate_accuracy_scores(self, tracker):
        """Test accuracy score calculation"""
        
        prediction = PredictionRecord(
            prediction_id="TEST_004",
            equipment_id="EQ-001",
            prediction_date=datetime.now() - timedelta(days=30),
            predicted_risk_level=RiskLevel.MEDIUM,
            predicted_interval_months=24,
            predicted_next_inspection=datetime.now() + timedelta(days=700),
            calculation_level=RBILevel.LEVEL_2,
            confidence_score=0.8,
            data_quality_score=0.9
        )
        
        # Set actual outcomes
        prediction.actual_inspection_date = datetime.now() + timedelta(days=720)
        prediction.actual_risk_assessment = RiskLevel.MEDIUM
        prediction.actual_findings = [
            InspectionFinding(
                finding_type="Corrosion",
                severity="Medium",
                description="Moderate corrosion"
            )
        ]
        
        scores = tracker._calculate_accuracy_scores(prediction)
        
        assert AccuracyMetric.RISK_LEVEL_ACCURACY.value in scores
        assert scores[AccuracyMetric.RISK_LEVEL_ACCURACY.value] == 1.0
        assert AccuracyMetric.INTERVAL_ACCURACY.value in scores
        assert scores[AccuracyMetric.INTERVAL_ACCURACY.value] > 0.9  # Should be high accuracy
        assert AccuracyMetric.FAILURE_PREDICTION.value in scores

    def test_get_equipment_accuracy_no_predictions(self, tracker):
        """Test equipment accuracy with no predictions"""
        
        assessment = tracker.get_equipment_accuracy("EQ-NONEXISTENT")
        
        assert assessment.equipment_id == "EQ-NONEXISTENT"
        assert assessment.total_predictions == 0
        assert assessment.verified_predictions == 0
        assert "Insufficient verified predictions" in assessment.recommendations[0]

    def test_get_equipment_accuracy_with_predictions(self, tracker, sample_calculation_result, 
                                                   sample_equipment_data):
        """Test equipment accuracy with verified predictions"""
        
        # Create multiple predictions with outcomes
        for i in range(3):
            calc_result = sample_calculation_result
            calc_result.calculation_timestamp = datetime.now() - timedelta(days=30*i)
            
            prediction_id = tracker.record_prediction(calc_result, sample_equipment_data)
            
            # Update with actual outcomes
            tracker.update_actual_outcome(
                prediction_id=prediction_id,
                actual_inspection_date=datetime.now() + timedelta(days=700-30*i),
                inspection_findings=[
                    InspectionFinding(
                        finding_type="Corrosion",
                        severity="Medium",
                        description=f"Finding {i}"
                    )
                ],
                actual_risk_assessment=RiskLevel.MEDIUM
            )
        
        assessment = tracker.get_equipment_accuracy("EQ-001")
        
        assert assessment.equipment_id == "EQ-001"
        assert assessment.total_predictions == 3
        assert assessment.verified_predictions == 3
        assert "risk_level_accuracy" in assessment.accuracy_metrics
        assert assessment.accuracy_metrics["risk_level_accuracy"] == 1.0  # All accurate
        assert len(assessment.recommendations) > 0

    def test_get_system_accuracy_report_no_data(self, tracker):
        """Test system accuracy report with no data"""
        
        report = tracker.get_system_accuracy_report()
        
        assert report.total_equipment_tracked == 0
        assert report.total_predictions == 0
        assert report.verified_predictions == 0
        assert "Insufficient verified predictions" in report.areas_for_improvement[0]

    def test_get_system_accuracy_report_with_data(self, tracker, sample_equipment_data):
        """Test system accuracy report with data"""
        
        # Create predictions for multiple equipment
        equipment_ids = ["EQ-001", "EQ-002", "EQ-003"]
        
        for eq_id in equipment_ids:
            for i in range(2):
                calc_result = RBICalculationResult(
                    equipment_id=eq_id,
                    calculation_level=RBILevel.LEVEL_2,
                    requested_level=RBILevel.LEVEL_2,
                    fallback_occurred=False,
                    next_inspection_date=datetime.now() + timedelta(days=730),
                    risk_level=RiskLevel.MEDIUM,
                    pof_score=0.6,
                    cof_scores={"safety": 0.7},
                    confidence_score=0.8,
                    data_quality_score=0.9,
                    calculation_timestamp=datetime.now() - timedelta(days=30*i),
                    inspection_interval_months=24,
                    missing_data=[],
                    estimated_parameters=[]
                )
                
                equipment_data = sample_equipment_data
                equipment_data.equipment_id = eq_id
                
                prediction_id = tracker.record_prediction(calc_result, equipment_data)
                
                # Update with outcomes
                tracker.update_actual_outcome(
                    prediction_id=prediction_id,
                    actual_inspection_date=datetime.now() + timedelta(days=700),
                    inspection_findings=[],
                    actual_risk_assessment=RiskLevel.MEDIUM
                )
        
        report = tracker.get_system_accuracy_report()
        
        assert report.total_equipment_tracked == 3
        assert report.total_predictions == 6
        assert report.verified_predictions == 6
        assert "overall_accuracy" in report.overall_accuracy_metrics
        assert "pressure_vessel" in report.accuracy_by_equipment_type
        assert "Level_2" in report.accuracy_by_calculation_level

    def test_get_prediction_history_no_filters(self, tracker, sample_calculation_result, 
                                             sample_equipment_data):
        """Test getting prediction history without filters"""
        
        # Create multiple predictions
        for i in range(3):
            calc_result = sample_calculation_result
            calc_result.calculation_timestamp = datetime.now() - timedelta(days=i*10)
            tracker.record_prediction(calc_result, sample_equipment_data)
        
        history = tracker.get_prediction_history()
        
        assert len(history) == 3
        # Should be sorted by date (newest first)
        assert history[0].prediction_date >= history[1].prediction_date >= history[2].prediction_date

    def test_get_prediction_history_with_filters(self, tracker, sample_equipment_data):
        """Test getting prediction history with filters"""
        
        # Create predictions for different equipment
        for eq_id in ["EQ-001", "EQ-002"]:
            for i in range(2):
                calc_result = RBICalculationResult(
                    equipment_id=eq_id,
                    calculation_level=RBILevel.LEVEL_2,
                    requested_level=RBILevel.LEVEL_2,
                    fallback_occurred=False,
                    next_inspection_date=datetime.now() + timedelta(days=730),
                    risk_level=RiskLevel.MEDIUM,
                    pof_score=0.6,
                    cof_scores={"safety": 0.7},
                    confidence_score=0.8,
                    data_quality_score=0.9,
                    calculation_timestamp=datetime.now() - timedelta(days=i*10),
                    inspection_interval_months=24,
                    missing_data=[],
                    estimated_parameters=[]
                )
                
                equipment_data = sample_equipment_data
                equipment_data.equipment_id = eq_id
                tracker.record_prediction(calc_result, equipment_data)
        
        # Filter by equipment
        eq1_history = tracker.get_prediction_history(equipment_id="EQ-001")
        assert len(eq1_history) == 2
        assert all(p.equipment_id == "EQ-001" for p in eq1_history)
        
        # Filter by date
        recent_history = tracker.get_prediction_history(
            start_date=datetime.now() - timedelta(days=5)
        )
        assert len(recent_history) == 2  # Only recent predictions

    def test_export_prediction_data_json(self, tracker, sample_calculation_result, 
                                       sample_equipment_data):
        """Test exporting prediction data as JSON"""
        
        prediction_id = tracker.record_prediction(sample_calculation_result, sample_equipment_data)
        
        json_data = tracker.export_prediction_data(format_type="json")
        
        assert prediction_id in json_data
        assert "EQ-001" in json_data
        assert "Medium" in json_data

    def test_export_prediction_data_csv(self, tracker, sample_calculation_result, 
                                      sample_equipment_data):
        """Test exporting prediction data as CSV"""
        
        prediction_id = tracker.record_prediction(sample_calculation_result, sample_equipment_data)
        
        csv_data = tracker.export_prediction_data(format_type="csv")
        
        lines = csv_data.split('\n')
        assert len(lines) >= 2  # Header + at least one data row
        assert "prediction_id" in lines[0]  # Header
        assert prediction_id in lines[1]  # Data row

    def test_export_prediction_data_invalid_format(self, tracker):
        """Test exporting with invalid format"""
        
        with pytest.raises(ValueError, match="Unsupported export format"):
            tracker.export_prediction_data(format_type="xml")

    def test_cleanup_old_predictions(self, tracker, sample_calculation_result, 
                                   sample_equipment_data):
        """Test cleaning up old predictions"""
        
        # Create old and new predictions
        old_calc_result = sample_calculation_result
        old_calc_result.calculation_timestamp = datetime.now() - timedelta(days=400)
        old_prediction_id = tracker.record_prediction(old_calc_result, sample_equipment_data)
        
        new_calc_result = sample_calculation_result
        new_calc_result.calculation_timestamp = datetime.now() - timedelta(days=10)
        new_prediction_id = tracker.record_prediction(new_calc_result, sample_equipment_data)
        
        assert len(tracker._prediction_records) == 2
        
        # Cleanup with 365 day retention
        removed_count = tracker.cleanup_old_predictions(retention_days=365)
        
        assert removed_count == 1
        assert len(tracker._prediction_records) == 1
        assert old_prediction_id not in tracker._prediction_records
        assert new_prediction_id in tracker._prediction_records

    def test_generate_prediction_id_uniqueness(self, tracker):
        """Test prediction ID generation uniqueness"""
        
        equipment_id = "EQ-TEST"
        timestamp = datetime.now()
        
        # Generate multiple IDs
        ids = set()
        for _ in range(10):
            pred_id = tracker._generate_prediction_id(equipment_id, timestamp)
            ids.add(pred_id)
        
        # All IDs should be unique (even with same timestamp)
        assert len(ids) == 10
        assert all(pred_id.startswith(f"PRED_{equipment_id}_") for pred_id in ids)

    def test_confidence_correlation_calculation(self, tracker):
        """Test confidence correlation calculation"""
        
        # Create predictions with varying confidence and accuracy
        predictions = []
        
        for i in range(5):
            prediction = PredictionRecord(
                prediction_id=f"TEST_{i}",
                equipment_id="EQ-001",
                prediction_date=datetime.now(),
                predicted_risk_level=RiskLevel.MEDIUM,
                predicted_interval_months=24,
                predicted_next_inspection=datetime.now() + timedelta(days=730),
                calculation_level=RBILevel.LEVEL_2,
                confidence_score=0.5 + (i * 0.1),  # Increasing confidence
                data_quality_score=0.8
            )
            
            # Set accuracy scores (increasing with confidence)
            prediction.accuracy_scores = {
                AccuracyMetric.RISK_LEVEL_ACCURACY.value: i * 0.2,
                AccuracyMetric.INTERVAL_ACCURACY.value: i * 0.2,
                AccuracyMetric.FAILURE_PREDICTION.value: i * 0.2
            }
            
            predictions.append(prediction)
        
        correlation = tracker._calculate_confidence_correlation(predictions)
        
        # Should be positive correlation
        assert correlation > 0.5

    def test_data_quality_impact_analysis(self, tracker):
        """Test data quality impact analysis"""
        
        # Create predictions with different data quality levels
        predictions = []
        
        quality_levels = [0.9, 0.7, 0.5]  # High, medium, low
        accuracy_levels = [0.9, 0.7, 0.5]  # Corresponding accuracy
        
        for i, (quality, accuracy) in enumerate(zip(quality_levels, accuracy_levels)):
            prediction = PredictionRecord(
                prediction_id=f"TEST_{i}",
                equipment_id="EQ-001",
                prediction_date=datetime.now(),
                predicted_risk_level=RiskLevel.MEDIUM,
                predicted_interval_months=24,
                predicted_next_inspection=datetime.now() + timedelta(days=730),
                calculation_level=RBILevel.LEVEL_2,
                confidence_score=0.8,
                data_quality_score=quality
            )
            
            # Set accuracy scores
            prediction.accuracy_scores = {
                AccuracyMetric.RISK_LEVEL_ACCURACY.value: accuracy,
                AccuracyMetric.INTERVAL_ACCURACY.value: accuracy,
                AccuracyMetric.FAILURE_PREDICTION.value: accuracy
            }
            
            predictions.append(prediction)
        
        impact_analysis = tracker._analyze_data_quality_impact(predictions)
        
        assert "high_quality_accuracy" in impact_analysis
        assert "low_quality_accuracy" in impact_analysis
        assert "quality_impact_score" in impact_analysis
        
        # High quality should have better accuracy
        assert impact_analysis["high_quality_accuracy"] > impact_analysis["low_quality_accuracy"]
        assert impact_analysis["quality_impact_score"] > 0

    def test_accuracy_trends_analysis(self, tracker):
        """Test accuracy trends analysis"""
        
        # Create predictions with improving accuracy over time
        predictions = []
        
        for i in range(5):
            prediction = PredictionRecord(
                prediction_id=f"TEST_{i}",
                equipment_id="EQ-001",
                prediction_date=datetime.now() - timedelta(days=(4-i)*30),  # Chronological order
                predicted_risk_level=RiskLevel.MEDIUM,
                predicted_interval_months=24,
                predicted_next_inspection=datetime.now() + timedelta(days=730),
                calculation_level=RBILevel.LEVEL_2,
                confidence_score=0.8,
                data_quality_score=0.8
            )
            
            # Improving accuracy over time
            accuracy = 0.4 + (i * 0.15)
            prediction.accuracy_scores = {
                AccuracyMetric.RISK_LEVEL_ACCURACY.value: accuracy,
                AccuracyMetric.INTERVAL_ACCURACY.value: accuracy,
                AccuracyMetric.FAILURE_PREDICTION.value: accuracy
            }
            
            predictions.append(prediction)
        
        trend_analysis = tracker._analyze_accuracy_trends(predictions)
        
        assert "trend" in trend_analysis
        assert "slope" in trend_analysis
        assert "correlation" in trend_analysis
        
        # Should detect improving trend
        assert trend_analysis["trend"] == "improving"
        assert trend_analysis["slope"] > 0

    def test_prediction_record_serialization(self):
        """Test prediction record serialization"""
        
        prediction = PredictionRecord(
            prediction_id="TEST_001",
            equipment_id="EQ-001",
            prediction_date=datetime.now(),
            predicted_risk_level=RiskLevel.HIGH,
            predicted_interval_months=12,
            predicted_next_inspection=datetime.now() + timedelta(days=365),
            calculation_level=RBILevel.LEVEL_2,
            confidence_score=0.8,
            data_quality_score=0.9,
            input_parameters={"test_param": "test_value"}
        )
        
        prediction_dict = prediction.to_dict()
        
        assert prediction_dict["prediction_id"] == "TEST_001"
        assert prediction_dict["equipment_id"] == "EQ-001"
        assert prediction_dict["predicted_risk_level"] == "High"
        assert prediction_dict["calculation_level"] == "Level_2"
        assert prediction_dict["input_parameters"]["test_param"] == "test_value"

    @patch('app.domains.rbi.services.prediction_tracker.datetime')
    def test_prediction_timestamp_handling(self, mock_datetime, tracker, 
                                         sample_calculation_result, sample_equipment_data):
        """Test proper timestamp handling in predictions"""
        
        base_time = datetime(2024, 1, 1, 12, 0, 0)
        mock_datetime.now.return_value = base_time
        
        prediction_id = tracker.record_prediction(sample_calculation_result, sample_equipment_data)
        
        prediction = tracker._prediction_records[prediction_id]
        assert prediction.prediction_date == sample_calculation_result.calculation_timestamp

    def test_multiple_equipment_tracking(self, tracker, sample_equipment_data):
        """Test tracking predictions for multiple equipment"""
        
        equipment_ids = ["EQ-001", "EQ-002", "EQ-003"]
        
        for eq_id in equipment_ids:
            calc_result = RBICalculationResult(
                equipment_id=eq_id,
                calculation_level=RBILevel.LEVEL_2,
                requested_level=RBILevel.LEVEL_2,
                fallback_occurred=False,
                next_inspection_date=datetime.now() + timedelta(days=730),
                risk_level=RiskLevel.MEDIUM,
                pof_score=0.6,
                cof_scores={"safety": 0.7},
                confidence_score=0.8,
                data_quality_score=0.9,
                calculation_timestamp=datetime.now(),
                inspection_interval_months=24,
                missing_data=[],
                estimated_parameters=[]
            )
            
            equipment_data = sample_equipment_data
            equipment_data.equipment_id = eq_id
            
            tracker.record_prediction(calc_result, equipment_data)
        
        assert len(tracker._equipment_predictions) == 3
        assert all(eq_id in tracker._equipment_predictions for eq_id in equipment_ids)
        assert len(tracker._prediction_records) == 3
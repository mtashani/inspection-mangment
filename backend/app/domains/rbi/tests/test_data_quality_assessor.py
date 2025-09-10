"""Tests for data quality assessor service"""

import pytest
from datetime import datetime, timedelta
from app.domains.rbi.services.data_quality_assessor import (
    DataQualityAssessor,
    DataQualityScore,
    DataQualityLevel,
    EstimatedData
)
from app.domains.rbi.models.core import (
    ServiceType,
    EquipmentType,
    ThicknessMeasurement
)


class TestDataQualityAssessor:
    """Test DataQualityAssessor"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.assessor = DataQualityAssessor()
    
    def test_assess_data_completeness_excellent(self):
        """Test completeness assessment with excellent data"""
        complete_data = {
            "equipment_id": "V-101",
            "equipment_type": EquipmentType.PRESSURE_VESSEL,
            "service_type": ServiceType.SOUR_GAS,
            "installation_date": datetime(2010, 1, 1),
            "design_pressure": 25.0,
            "design_temperature": 150.0,
            "material": "CS",
            "corrosion_rate": 0.15,
            "thickness_measurements": [ThicknessMeasurement(
                location="Shell", thickness=12.0, measurement_date=datetime.now(),
                minimum_required=10.0
            )],
            "coating_condition": "moderate",
            "damage_mechanisms": ["General Corrosion"],
            "inspection_findings": [],
            "last_inspection_date": datetime.now() - timedelta(days=30)
        }
        
        score = self.assessor.assess_data_completeness(complete_data)
        
        assert score.parameter == "completeness"
        assert score.completeness >= 0.9
        assert score.quality_level == DataQualityLevel.EXCELLENT
        assert len(score.issues) == 0
    
    def test_assess_data_completeness_poor(self):
        """Test completeness assessment with poor data"""
        incomplete_data = {
            "equipment_id": "V-102",
            "equipment_type": EquipmentType.PRESSURE_VESSEL
            # Missing most required and optional fields
        }
        
        score = self.assessor.assess_data_completeness(incomplete_data)
        
        assert score.parameter == "completeness"
        assert score.completeness < 0.4
        assert score.quality_level == DataQualityLevel.CRITICAL
        assert len(score.issues) > 0
        assert any("Missing required fields" in issue for issue in score.issues)
    
    def test_assess_data_accuracy_good(self):
        """Test accuracy assessment with good data"""
        accurate_data = {
            "design_pressure": 25.0,  # Reasonable
            "design_temperature": 150.0,  # Reasonable
            "corrosion_rate": 0.15,  # Reasonable
            "installation_date": datetime(2010, 1, 1),  # Reasonable age
            "thickness_measurements": [
                ThicknessMeasurement(
                    location="Shell", thickness=12.0, measurement_date=datetime.now(),
                    minimum_required=10.0  # Reasonable thickness
                )
            ]
        }
        
        score = self.assessor.assess_data_accuracy(accurate_data)
        
        assert score.parameter == "accuracy"
        assert score.accuracy >= 0.9
        assert score.quality_level in [DataQualityLevel.EXCELLENT, DataQualityLevel.GOOD]
    
    def test_assess_data_accuracy_poor(self):
        """Test accuracy assessment with poor data"""
        inaccurate_data = {
            "design_pressure": -10.0,  # Impossible
            "design_temperature": 1500.0,  # Unreasonable
            "corrosion_rate": 50.0,  # Extremely high
            "installation_date": datetime(2050, 1, 1),  # Future date
            "thickness_measurements": [
                ThicknessMeasurement(
                    location="Shell", thickness=6.0, measurement_date=datetime.now(),
                    minimum_required=10.0  # Low but not critically low
                )
            ]
        }
        
        score = self.assessor.assess_data_accuracy(inaccurate_data)
        
        assert score.parameter == "accuracy"
        assert score.accuracy < 0.5
        assert score.quality_level in [DataQualityLevel.POOR, DataQualityLevel.CRITICAL]
        assert len(score.issues) > 0
    
    def test_assess_data_timeliness_current(self):
        """Test timeliness assessment with current data"""
        current_data = {
            "last_inspection_date": datetime.now() - timedelta(days=30),  # Recent
            "thickness_measurements": [
                ThicknessMeasurement(
                    location="Shell", thickness=12.0, 
                    measurement_date=datetime.now() - timedelta(days=60),  # Recent
                    minimum_required=10.0
                )
            ]
        }
        
        score = self.assessor.assess_data_timeliness(current_data)
        
        assert score.parameter == "timeliness"
        assert score.timeliness >= 0.9
        assert score.quality_level == DataQualityLevel.EXCELLENT
    
    def test_assess_data_timeliness_old(self):
        """Test timeliness assessment with old data"""
        old_data = {
            "last_inspection_date": datetime.now() - timedelta(days=1500),  # Very old
            "thickness_measurements": [
                ThicknessMeasurement(
                    location="Shell", thickness=12.0,
                    measurement_date=datetime.now() - timedelta(days=1200),  # Old
                    minimum_required=10.0
                )
            ]
        }
        
        score = self.assessor.assess_data_timeliness(old_data)
        
        assert score.parameter == "timeliness"
        assert score.timeliness < 0.5
        assert score.quality_level in [DataQualityLevel.POOR, DataQualityLevel.CRITICAL]
        assert len(score.issues) > 0
    
    def test_assess_data_consistency_good(self):
        """Test consistency assessment with consistent data"""
        consistent_data = {
            "operating_pressure": 20.0,
            "design_pressure": 25.0,  # Operating < Design
            "operating_temperature": 140.0,
            "design_temperature": 150.0,  # Operating < Design
            "corrosion_rate": 0.15,
            "service_type": ServiceType.SOUR_GAS,  # Consistent with corrosion rate
            "thickness_measurements": [
                ThicknessMeasurement(
                    location="Shell", thickness=12.0, measurement_date=datetime.now(),
                    minimum_required=10.0
                ),
                ThicknessMeasurement(
                    location="Shell", thickness=12.1, measurement_date=datetime.now(),
                    minimum_required=10.0
                )
            ]
        }
        
        score = self.assessor.assess_data_consistency(consistent_data)
        
        assert score.parameter == "consistency"
        assert score.consistency >= 0.8
        assert score.quality_level in [DataQualityLevel.EXCELLENT, DataQualityLevel.GOOD]
    
    def test_assess_data_consistency_poor(self):
        """Test consistency assessment with inconsistent data"""
        inconsistent_data = {
            "operating_pressure": 30.0,
            "design_pressure": 25.0,  # Operating > Design (inconsistent)
            "operating_temperature": 200.0,
            "design_temperature": 150.0,  # Operating >> Design (inconsistent)
            "corrosion_rate": 0.01,
            "service_type": ServiceType.SOUR_GAS,  # Too low for sour gas
            "thickness_measurements": [
                ThicknessMeasurement(
                    location="Shell", thickness=10.0, measurement_date=datetime.now(),
                    minimum_required=10.0
                ),
                ThicknessMeasurement(
                    location="Shell", thickness=15.0, measurement_date=datetime.now(),
                    minimum_required=10.0  # High variation
                )
            ]
        }
        
        score = self.assessor.assess_data_consistency(inconsistent_data)
        
        assert score.parameter == "consistency"
        assert score.consistency < 0.8
        assert len(score.issues) > 0
    
    def test_estimate_corrosion_rate(self):
        """Test corrosion rate estimation"""
        data_with_service = {
            "service_type": ServiceType.SOUR_GAS,
            "installation_date": datetime(2010, 1, 1),
            "coating_condition": "moderate"
        }
        
        estimates = self.assessor.estimate_missing_parameters(data_with_service)
        
        # Should estimate corrosion rate
        corrosion_estimates = [e for e in estimates if e.parameter == "corrosion_rate"]
        assert len(corrosion_estimates) == 1
        
        estimate = corrosion_estimates[0]
        assert estimate.estimated_value > 0
        assert estimate.confidence > 0
        assert estimate.estimation_method == "service_type_based"
        assert estimate.uncertainty_range is not None
    
    def test_estimate_coating_condition(self):
        """Test coating condition estimation"""
        data_with_age = {
            "installation_date": datetime(2015, 1, 1),  # ~9 years old
            "service_type": ServiceType.SWEET_GAS
        }
        
        estimates = self.assessor.estimate_missing_parameters(data_with_age)
        
        # Should estimate coating condition
        coating_estimates = [e for e in estimates if e.parameter == "coating_condition"]
        assert len(coating_estimates) == 1
        
        estimate = coating_estimates[0]
        assert estimate.estimated_value in ["excellent", "moderate", "none"]
        assert estimate.confidence > 0
        assert estimate.estimation_method == "age_and_service_based"
    
    def test_estimate_inspection_quality(self):
        """Test inspection quality estimation"""
        data_with_indicators = {
            "thickness_measurements": [
                ThicknessMeasurement(
                    location="Shell", thickness=12.0, measurement_date=datetime.now(),
                    minimum_required=10.0
                )
            ],
            "inspection_findings": ["Some finding"],
            "damage_mechanisms": ["General Corrosion"],
            "last_inspection_date": datetime.now() - timedelta(days=100)
        }
        
        estimates = self.assessor.estimate_missing_parameters(data_with_indicators)
        
        # Should estimate inspection quality
        quality_estimates = [e for e in estimates if e.parameter == "inspection_quality"]
        assert len(quality_estimates) == 1
        
        estimate = quality_estimates[0]
        assert estimate.estimated_value in ["good", "average", "poor"]
        assert estimate.confidence > 0
        assert estimate.estimation_method == "data_completeness_based"
    
    def test_generate_data_improvement_recommendations(self):
        """Test data improvement recommendations generation"""
        # Create some assessments with issues
        assessments = [
            DataQualityScore(
                parameter="completeness",
                completeness=0.5,
                accuracy=1.0,
                timeliness=1.0,
                consistency=1.0,
                overall_score=0.5,
                quality_level=DataQualityLevel.POOR,
                issues=["Missing data"],
                recommendations=["Collect missing data"]
            ),
            DataQualityScore(
                parameter="timeliness",
                completeness=1.0,
                accuracy=1.0,
                timeliness=0.3,
                consistency=1.0,
                overall_score=0.3,
                quality_level=DataQualityLevel.CRITICAL,
                issues=["Data too old"],
                recommendations=["Update inspection data"]
            )
        ]
        
        recommendations = self.assessor.generate_data_improvement_recommendations(assessments)
        
        assert len(recommendations) > 0
        assert "URGENT: Critical data quality issues require immediate attention" in recommendations
        assert "Collect missing data" in recommendations
        assert "Update inspection data" in recommendations
    
    def test_calculate_overall_data_quality(self):
        """Test overall data quality calculation"""
        assessments = [
            DataQualityScore(
                parameter="completeness",
                completeness=0.9,
                accuracy=1.0,
                timeliness=1.0,
                consistency=1.0,
                overall_score=0.9,
                quality_level=DataQualityLevel.EXCELLENT,
                issues=[],
                recommendations=[]
            ),
            DataQualityScore(
                parameter="accuracy",
                completeness=1.0,
                accuracy=0.8,
                timeliness=1.0,
                consistency=1.0,
                overall_score=0.8,
                quality_level=DataQualityLevel.GOOD,
                issues=["Minor accuracy issue"],
                recommendations=["Verify data"]
            )
        ]
        
        overall = self.assessor.calculate_overall_data_quality(assessments)
        
        assert overall.parameter == "overall"
        assert 0.8 <= overall.overall_score <= 1.0  # Allow for weighted calculation
        assert overall.quality_level in [DataQualityLevel.GOOD, DataQualityLevel.EXCELLENT]
        assert "Minor accuracy issue" in overall.issues
        assert "Verify data" in overall.recommendations
    
    def test_calculate_overall_data_quality_empty(self):
        """Test overall data quality calculation with no assessments"""
        overall = self.assessor.calculate_overall_data_quality([])
        
        assert overall.parameter == "overall"
        assert overall.overall_score == 0.0
        assert overall.quality_level == DataQualityLevel.CRITICAL
        assert len(overall.issues) > 0
        assert len(overall.recommendations) > 0
    
    def test_estimate_missing_parameters_comprehensive(self):
        """Test comprehensive parameter estimation"""
        partial_data = {
            "service_type": ServiceType.AMINE,
            "installation_date": datetime(2018, 1, 1),
            "thickness_measurements": [
                ThicknessMeasurement(
                    location="Shell", thickness=8.0, measurement_date=datetime.now(),
                    minimum_required=6.0
                )
            ],
            "last_inspection_date": datetime.now() - timedelta(days=200)
        }
        
        estimates = self.assessor.estimate_missing_parameters(partial_data)
        
        # Should estimate multiple parameters
        parameter_names = [e.parameter for e in estimates]
        assert "corrosion_rate" in parameter_names
        assert "coating_condition" in parameter_names
        assert "inspection_quality" in parameter_names
        
        # All estimates should have reasonable confidence
        for estimate in estimates:
            assert 0 < estimate.confidence <= 1
            assert estimate.estimation_method is not None
            assert estimate.basis is not None
    
    def test_data_quality_levels_progression(self):
        """Test that data quality levels progress logically"""
        # Test different completeness levels
        test_cases = [
            ({"equipment_id": "test"}, DataQualityLevel.CRITICAL),  # Very incomplete
            ({"equipment_id": "test", "equipment_type": EquipmentType.PUMP, 
              "service_type": ServiceType.WATER}, DataQualityLevel.POOR),  # Somewhat incomplete
            ({"equipment_id": "test", "equipment_type": EquipmentType.PUMP,
              "service_type": ServiceType.WATER, "installation_date": datetime(2020, 1, 1),
              "design_pressure": 10.0, "design_temperature": 80.0, 
              "material": "CS"}, DataQualityLevel.FAIR),  # Basic complete
        ]
        
        for data, expected_level in test_cases:
            score = self.assessor.assess_data_completeness(data)
            assert score.quality_level == expected_level or \
                   (score.quality_level.value in ["poor", "critical"] and 
                    expected_level.value in ["poor", "critical"])
    
    def test_industry_standards_usage(self):
        """Test that industry standards are used correctly"""
        # Test with different service types
        for service_type in [ServiceType.SOUR_GAS, ServiceType.SWEET_GAS, ServiceType.AMINE]:
            data = {"service_type": service_type}
            estimates = self.assessor.estimate_missing_parameters(data)
            
            corrosion_estimates = [e for e in estimates if e.parameter == "corrosion_rate"]
            if corrosion_estimates:
                estimate = corrosion_estimates[0]
                # Should be within reasonable range for service type
                assert 0.001 <= estimate.estimated_value <= 1.0
                assert estimate.uncertainty_range is not None
                min_val, max_val = estimate.uncertainty_range
                assert min_val <= estimate.estimated_value <= max_val
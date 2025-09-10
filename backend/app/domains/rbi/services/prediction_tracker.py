"""Prediction Tracker Service - Track RBI predictions and compare with actual inspection findings"""

import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import statistics
from collections import defaultdict

from app.domains.rbi.models.core import (
    RBICalculationResult,
    EquipmentData,
    RiskLevel,
    RBILevel,
    InspectionFinding
)


class PredictionOutcome(str, Enum):
    """Prediction outcome classification"""
    ACCURATE = "accurate"
    OVER_PREDICTED = "over_predicted"
    UNDER_PREDICTED = "under_predicted"
    INSUFFICIENT_DATA = "insufficient_data"


class AccuracyMetric(str, Enum):
    """Types of accuracy metrics"""
    RISK_LEVEL_ACCURACY = "risk_level_accuracy"
    INTERVAL_ACCURACY = "interval_accuracy"
    FAILURE_PREDICTION = "failure_prediction"
    DEGRADATION_RATE = "degradation_rate"


@dataclass
class PredictionRecord:
    """Individual prediction record for tracking"""
    prediction_id: str
    equipment_id: str
    prediction_date: datetime
    predicted_risk_level: RiskLevel
    predicted_interval_months: int
    predicted_next_inspection: datetime
    calculation_level: RBILevel
    confidence_score: float
    data_quality_score: float
    input_parameters: Dict[str, Any] = field(default_factory=dict)
    
    # Actual outcomes (filled when inspection occurs)
    actual_inspection_date: Optional[datetime] = None
    actual_findings: List[InspectionFinding] = field(default_factory=list)
    actual_risk_assessment: Optional[RiskLevel] = None
    outcome_classification: Optional[PredictionOutcome] = None
    accuracy_scores: Dict[str, float] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert prediction record to dictionary"""
        return {
            "prediction_id": self.prediction_id,
            "equipment_id": self.equipment_id,
            "prediction_date": self.prediction_date.isoformat(),
            "predicted_risk_level": self.predicted_risk_level.value,
            "predicted_interval_months": self.predicted_interval_months,
            "predicted_next_inspection": self.predicted_next_inspection.isoformat(),
            "calculation_level": self.calculation_level.value,
            "confidence_score": self.confidence_score,
            "data_quality_score": self.data_quality_score,
            "input_parameters": self.input_parameters,
            "actual_inspection_date": self.actual_inspection_date.isoformat() if self.actual_inspection_date else None,
            "actual_findings": [finding.__dict__ for finding in self.actual_findings],
            "actual_risk_assessment": self.actual_risk_assessment.value if self.actual_risk_assessment else None,
            "outcome_classification": self.outcome_classification.value if self.outcome_classification else None,
            "accuracy_scores": self.accuracy_scores
        }


@dataclass
class AccuracyAssessment:
    """Comprehensive accuracy assessment results"""
    equipment_id: str
    assessment_period: Dict[str, datetime]
    total_predictions: int
    verified_predictions: int
    accuracy_metrics: Dict[str, float]
    outcome_distribution: Dict[str, int]
    trend_analysis: Dict[str, Any]
    recommendations: List[str]
    confidence_correlation: float
    data_quality_impact: Dict[str, float]


@dataclass
class SystemAccuracyReport:
    """System-wide accuracy report"""
    report_date: datetime
    total_equipment_tracked: int
    total_predictions: int
    verified_predictions: int
    overall_accuracy_metrics: Dict[str, float]
    accuracy_by_equipment_type: Dict[str, float]
    accuracy_by_calculation_level: Dict[str, float]
    accuracy_by_risk_level: Dict[str, float]
    improvement_trends: Dict[str, List[float]]
    top_performing_parameters: List[str]
    areas_for_improvement: List[str]


class PredictionTracker:
    """Service for tracking RBI predictions and assessing accuracy"""
    
    def __init__(self):
        """Initialize prediction tracker"""
        self.logger = logging.getLogger(__name__)
        self._prediction_records: Dict[str, PredictionRecord] = {}
        self._equipment_predictions: Dict[str, List[str]] = defaultdict(list)
        self._accuracy_cache: Dict[str, AccuracyAssessment] = {}
        self._system_metrics: Dict[str, Any] = {}
    
    def record_prediction(
        self,
        calculation_result: RBICalculationResult,
        equipment_data: EquipmentData,
        prediction_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Record a new RBI prediction for tracking"""
        
        prediction_id = self._generate_prediction_id(
            calculation_result.equipment_id,
            calculation_result.calculation_timestamp
        )
        
        # Create prediction record
        prediction_record = PredictionRecord(
            prediction_id=prediction_id,
            equipment_id=calculation_result.equipment_id,
            prediction_date=calculation_result.calculation_timestamp,
            predicted_risk_level=calculation_result.risk_level,
            predicted_interval_months=calculation_result.inspection_interval_months,
            predicted_next_inspection=calculation_result.next_inspection_date,
            calculation_level=calculation_result.calculation_level,
            confidence_score=calculation_result.confidence_score,
            data_quality_score=calculation_result.data_quality_score,
            input_parameters={
                **calculation_result.input_parameters,
                "equipment_type": equipment_data.equipment_type.value,
                "service_type": equipment_data.service_type.value,
                "equipment_age": equipment_data.age_years,
                "design_pressure": equipment_data.design_pressure,
                "criticality": equipment_data.criticality_level,
                **(prediction_context or {})
            }
        )
        
        # Store prediction record
        self._prediction_records[prediction_id] = prediction_record
        self._equipment_predictions[calculation_result.equipment_id].append(prediction_id)
        
        self.logger.info(f"Recorded prediction {prediction_id} for equipment {calculation_result.equipment_id}")
        
        return prediction_id
    
    def update_actual_outcome(
        self,
        prediction_id: str,
        actual_inspection_date: datetime,
        inspection_findings: List[InspectionFinding],
        actual_risk_assessment: Optional[RiskLevel] = None
    ) -> bool:
        """Update prediction record with actual inspection outcomes"""
        
        if prediction_id not in self._prediction_records:
            self.logger.error(f"Prediction {prediction_id} not found")
            return False
        
        prediction = self._prediction_records[prediction_id]
        
        # Update actual outcomes
        prediction.actual_inspection_date = actual_inspection_date
        prediction.actual_findings = inspection_findings
        prediction.actual_risk_assessment = actual_risk_assessment or self._assess_risk_from_findings(inspection_findings)
        
        # Classify prediction outcome
        prediction.outcome_classification = self._classify_prediction_outcome(prediction)
        
        # Calculate accuracy scores
        prediction.accuracy_scores = self._calculate_accuracy_scores(prediction)
        
        # Clear accuracy cache for this equipment
        if prediction.equipment_id in self._accuracy_cache:
            del self._accuracy_cache[prediction.equipment_id]
        
        self.logger.info(f"Updated prediction {prediction_id} with actual outcomes")
        
        return True
    
    def get_equipment_accuracy(
        self,
        equipment_id: str,
        assessment_period_days: int = 365
    ) -> AccuracyAssessment:
        """Get accuracy assessment for specific equipment"""
        
        # Check cache first
        cache_key = f"{equipment_id}_{assessment_period_days}"
        if cache_key in self._accuracy_cache:
            cached_assessment = self._accuracy_cache[cache_key]
            # Return cached result if less than 24 hours old
            if (datetime.now() - cached_assessment.assessment_period["end"]).days < 1:
                return cached_assessment
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=assessment_period_days)
        
        # Get predictions for equipment in period
        equipment_predictions = []
        for pred_id in self._equipment_predictions.get(equipment_id, []):
            prediction = self._prediction_records[pred_id]
            if start_date <= prediction.prediction_date <= end_date:
                equipment_predictions.append(prediction)
        
        # Filter verified predictions (those with actual outcomes)
        verified_predictions = [p for p in equipment_predictions if p.actual_inspection_date is not None]
        
        if not verified_predictions:
            return AccuracyAssessment(
                equipment_id=equipment_id,
                assessment_period={"start": start_date, "end": end_date},
                total_predictions=len(equipment_predictions),
                verified_predictions=0,
                accuracy_metrics={},
                outcome_distribution={},
                trend_analysis={},
                recommendations=["Insufficient verified predictions for accuracy assessment"],
                confidence_correlation=0.0,
                data_quality_impact={}
            )
        
        # Calculate accuracy metrics
        accuracy_metrics = self._calculate_equipment_accuracy_metrics(verified_predictions)
        
        # Analyze outcome distribution
        outcome_distribution = self._analyze_outcome_distribution(verified_predictions)
        
        # Perform trend analysis
        trend_analysis = self._analyze_accuracy_trends(verified_predictions)
        
        # Generate recommendations
        recommendations = self._generate_accuracy_recommendations(
            verified_predictions, accuracy_metrics, trend_analysis
        )
        
        # Calculate confidence correlation
        confidence_correlation = self._calculate_confidence_correlation(verified_predictions)
        
        # Analyze data quality impact
        data_quality_impact = self._analyze_data_quality_impact(verified_predictions)
        
        assessment = AccuracyAssessment(
            equipment_id=equipment_id,
            assessment_period={"start": start_date, "end": end_date},
            total_predictions=len(equipment_predictions),
            verified_predictions=len(verified_predictions),
            accuracy_metrics=accuracy_metrics,
            outcome_distribution=outcome_distribution,
            trend_analysis=trend_analysis,
            recommendations=recommendations,
            confidence_correlation=confidence_correlation,
            data_quality_impact=data_quality_impact
        )
        
        # Cache the assessment
        self._accuracy_cache[cache_key] = assessment
        
        return assessment
    
    def get_system_accuracy_report(
        self,
        assessment_period_days: int = 365
    ) -> SystemAccuracyReport:
        """Generate system-wide accuracy report"""
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=assessment_period_days)
        
        # Collect all predictions in period
        all_predictions = []
        equipment_ids = set()
        
        for prediction in self._prediction_records.values():
            if start_date <= prediction.prediction_date <= end_date:
                all_predictions.append(prediction)
                equipment_ids.add(prediction.equipment_id)
        
        verified_predictions = [p for p in all_predictions if p.actual_inspection_date is not None]
        
        if not verified_predictions:
            return SystemAccuracyReport(
                report_date=datetime.now(),
                total_equipment_tracked=len(equipment_ids),
                total_predictions=len(all_predictions),
                verified_predictions=0,
                overall_accuracy_metrics={},
                accuracy_by_equipment_type={},
                accuracy_by_calculation_level={},
                accuracy_by_risk_level={},
                improvement_trends={},
                top_performing_parameters=[],
                areas_for_improvement=["Insufficient verified predictions for system analysis"]
            )
        
        # Calculate overall accuracy metrics
        overall_metrics = self._calculate_system_accuracy_metrics(verified_predictions)
        
        # Analyze accuracy by different dimensions
        accuracy_by_equipment_type = self._analyze_accuracy_by_dimension(
            verified_predictions, lambda p: p.input_parameters.get("equipment_type", "unknown")
        )
        
        accuracy_by_calculation_level = self._analyze_accuracy_by_dimension(
            verified_predictions, lambda p: p.calculation_level.value
        )
        
        accuracy_by_risk_level = self._analyze_accuracy_by_dimension(
            verified_predictions, lambda p: p.predicted_risk_level.value
        )
        
        # Analyze improvement trends
        improvement_trends = self._analyze_system_improvement_trends(verified_predictions)
        
        # Identify top performing parameters
        top_performing_parameters = self._identify_top_performing_parameters(verified_predictions)
        
        # Identify areas for improvement
        areas_for_improvement = self._identify_improvement_areas(
            verified_predictions, overall_metrics
        )
        
        return SystemAccuracyReport(
            report_date=datetime.now(),
            total_equipment_tracked=len(equipment_ids),
            total_predictions=len(all_predictions),
            verified_predictions=len(verified_predictions),
            overall_accuracy_metrics=overall_metrics,
            accuracy_by_equipment_type=accuracy_by_equipment_type,
            accuracy_by_calculation_level=accuracy_by_calculation_level,
            accuracy_by_risk_level=accuracy_by_risk_level,
            improvement_trends=improvement_trends,
            top_performing_parameters=top_performing_parameters,
            areas_for_improvement=areas_for_improvement
        )
    
    def get_prediction_history(
        self,
        equipment_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        include_unverified: bool = True
    ) -> List[PredictionRecord]:
        """Get prediction history with optional filtering"""
        
        predictions = list(self._prediction_records.values())
        
        # Apply filters
        if equipment_id:
            predictions = [p for p in predictions if p.equipment_id == equipment_id]
        
        if start_date:
            predictions = [p for p in predictions if p.prediction_date >= start_date]
        
        if end_date:
            predictions = [p for p in predictions if p.prediction_date <= end_date]
        
        if not include_unverified:
            predictions = [p for p in predictions if p.actual_inspection_date is not None]
        
        # Sort by prediction date (newest first)
        predictions.sort(key=lambda x: x.prediction_date, reverse=True)
        
        return predictions
    
    def export_prediction_data(
        self,
        format_type: str = "json",
        equipment_id: Optional[str] = None,
        verified_only: bool = False
    ) -> str:
        """Export prediction data in specified format"""
        
        predictions = self.get_prediction_history(
            equipment_id=equipment_id,
            include_unverified=not verified_only
        )
        
        if format_type.lower() == "json":
            return json.dumps([p.to_dict() for p in predictions], indent=2, ensure_ascii=False)
        
        elif format_type.lower() == "csv":
            # Simple CSV export
            csv_lines = [
                "prediction_id,equipment_id,prediction_date,predicted_risk,actual_risk,"
                "predicted_interval,confidence_score,outcome_classification"
            ]
            
            for prediction in predictions:
                csv_lines.append(
                    f"{prediction.prediction_id},{prediction.equipment_id},"
                    f"{prediction.prediction_date.isoformat()},{prediction.predicted_risk_level.value},"
                    f"{prediction.actual_risk_assessment.value if prediction.actual_risk_assessment else ''},"
                    f"{prediction.predicted_interval_months},{prediction.confidence_score},"
                    f"{prediction.outcome_classification.value if prediction.outcome_classification else ''}"
                )
            
            return "\n".join(csv_lines)
        
        else:
            raise ValueError(f"Unsupported export format: {format_type}")
    
    def cleanup_old_predictions(self, retention_days: int = 1095) -> int:
        """Clean up old prediction records beyond retention period"""
        
        cutoff_date = datetime.now() - timedelta(days=retention_days)
        
        # Find predictions to remove
        predictions_to_remove = []
        for pred_id, prediction in self._prediction_records.items():
            if prediction.prediction_date < cutoff_date:
                predictions_to_remove.append(pred_id)
        
        # Remove old predictions
        for pred_id in predictions_to_remove:
            prediction = self._prediction_records[pred_id]
            
            # Remove from equipment predictions list
            if prediction.equipment_id in self._equipment_predictions:
                if pred_id in self._equipment_predictions[prediction.equipment_id]:
                    self._equipment_predictions[prediction.equipment_id].remove(pred_id)
            
            # Remove prediction record
            del self._prediction_records[pred_id]
        
        # Clear accuracy cache
        self._accuracy_cache.clear()
        
        if predictions_to_remove:
            self.logger.info(
                f"Cleaned up {len(predictions_to_remove)} prediction records "
                f"older than {retention_days} days"
            )
        
        return len(predictions_to_remove) 
   
    # Helper methods for prediction tracking
    
    def _generate_prediction_id(self, equipment_id: str, timestamp: datetime) -> str:
        """Generate unique prediction ID"""
        import hashlib
        import uuid
        
        # Use UUID for guaranteed uniqueness
        unique_component = str(uuid.uuid4())[:8]
        timestamp_str = timestamp.strftime('%Y%m%d_%H%M%S_%f')
        unique_string = f"{equipment_id}_{timestamp_str}_{unique_component}"
        hash_suffix = hashlib.md5(unique_string.encode()).hexdigest()[:8].upper()
        return f"PRED_{equipment_id}_{hash_suffix}"
    
    def _assess_risk_from_findings(self, findings: List[InspectionFinding]) -> RiskLevel:
        """Assess risk level from inspection findings"""
        
        if not findings:
            return RiskLevel.LOW
        
        # Count findings by severity
        severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
        
        for finding in findings:
            severity_counts[finding.severity] = severity_counts.get(finding.severity, 0) + 1
        
        # Determine risk level based on findings
        if severity_counts["Critical"] > 0:
            return RiskLevel.VERY_HIGH
        elif severity_counts["High"] > 2:
            return RiskLevel.VERY_HIGH
        elif severity_counts["High"] > 0:
            return RiskLevel.HIGH
        elif severity_counts["Medium"] > 3:
            return RiskLevel.HIGH
        elif severity_counts["Medium"] > 0:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def _classify_prediction_outcome(self, prediction: PredictionRecord) -> PredictionOutcome:
        """Classify prediction outcome based on actual vs predicted"""
        
        if not prediction.actual_risk_assessment:
            return PredictionOutcome.INSUFFICIENT_DATA
        
        # Map risk levels to numeric values for comparison
        risk_values = {
            RiskLevel.LOW: 1,
            RiskLevel.MEDIUM: 2,
            RiskLevel.HIGH: 3,
            RiskLevel.VERY_HIGH: 4
        }
        
        predicted_value = risk_values[prediction.predicted_risk_level]
        actual_value = risk_values[prediction.actual_risk_assessment]
        
        # Classification logic
        if predicted_value == actual_value:
            return PredictionOutcome.ACCURATE
        elif predicted_value > actual_value:
            return PredictionOutcome.OVER_PREDICTED
        else:
            return PredictionOutcome.UNDER_PREDICTED
    
    def _calculate_accuracy_scores(self, prediction: PredictionRecord) -> Dict[str, float]:
        """Calculate various accuracy scores for a prediction"""
        
        scores = {}
        
        if not prediction.actual_risk_assessment:
            return scores
        
        # Risk level accuracy (exact match)
        scores[AccuracyMetric.RISK_LEVEL_ACCURACY.value] = (
            1.0 if prediction.predicted_risk_level == prediction.actual_risk_assessment else 0.0
        )
        
        # Interval accuracy (based on actual inspection timing)
        if prediction.actual_inspection_date:
            predicted_days = (prediction.predicted_next_inspection - prediction.prediction_date).days
            actual_days = (prediction.actual_inspection_date - prediction.prediction_date).days
            
            # Calculate accuracy as inverse of relative error (capped at 1.0)
            if predicted_days > 0:
                relative_error = abs(actual_days - predicted_days) / predicted_days
                scores[AccuracyMetric.INTERVAL_ACCURACY.value] = max(0.0, 1.0 - relative_error)
            else:
                scores[AccuracyMetric.INTERVAL_ACCURACY.value] = 0.0
        
        # Failure prediction accuracy (based on critical findings)
        critical_findings = [f for f in prediction.actual_findings if f.severity == "Critical"]
        predicted_high_risk = prediction.predicted_risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH]
        actual_high_risk = len(critical_findings) > 0
        
        if predicted_high_risk == actual_high_risk:
            scores[AccuracyMetric.FAILURE_PREDICTION.value] = 1.0
        else:
            scores[AccuracyMetric.FAILURE_PREDICTION.value] = 0.0
        
        return scores
    
    def _calculate_equipment_accuracy_metrics(
        self, 
        predictions: List[PredictionRecord]
    ) -> Dict[str, float]:
        """Calculate accuracy metrics for equipment predictions"""
        
        if not predictions:
            return {}
        
        metrics = {}
        
        # Risk level accuracy
        risk_accurate = sum(
            1 for p in predictions 
            if p.accuracy_scores.get(AccuracyMetric.RISK_LEVEL_ACCURACY.value, 0) == 1.0
        )
        metrics["risk_level_accuracy"] = risk_accurate / len(predictions)
        
        # Interval accuracy (average)
        interval_scores = [
            p.accuracy_scores.get(AccuracyMetric.INTERVAL_ACCURACY.value, 0)
            for p in predictions
        ]
        metrics["interval_accuracy"] = statistics.mean(interval_scores) if interval_scores else 0.0
        
        # Failure prediction accuracy
        failure_accurate = sum(
            1 for p in predictions 
            if p.accuracy_scores.get(AccuracyMetric.FAILURE_PREDICTION.value, 0) == 1.0
        )
        metrics["failure_prediction_accuracy"] = failure_accurate / len(predictions)
        
        # Overall accuracy (weighted average)
        weights = {"risk_level": 0.4, "interval": 0.3, "failure_prediction": 0.3}
        overall_accuracy = (
            metrics["risk_level_accuracy"] * weights["risk_level"] +
            metrics["interval_accuracy"] * weights["interval"] +
            metrics["failure_prediction_accuracy"] * weights["failure_prediction"]
        )
        metrics["overall_accuracy"] = overall_accuracy
        
        # Confidence-weighted accuracy
        confidence_weighted_scores = []
        for prediction in predictions:
            overall_pred_accuracy = (
                prediction.accuracy_scores.get(AccuracyMetric.RISK_LEVEL_ACCURACY.value, 0) * weights["risk_level"] +
                prediction.accuracy_scores.get(AccuracyMetric.INTERVAL_ACCURACY.value, 0) * weights["interval"] +
                prediction.accuracy_scores.get(AccuracyMetric.FAILURE_PREDICTION.value, 0) * weights["failure_prediction"]
            )
            confidence_weighted_scores.append(overall_pred_accuracy * prediction.confidence_score)
        
        total_confidence = sum(p.confidence_score for p in predictions)
        if total_confidence > 0:
            metrics["confidence_weighted_accuracy"] = sum(confidence_weighted_scores) / total_confidence
        else:
            metrics["confidence_weighted_accuracy"] = 0.0
        
        return metrics
    
    def _analyze_outcome_distribution(
        self, 
        predictions: List[PredictionRecord]
    ) -> Dict[str, int]:
        """Analyze distribution of prediction outcomes"""
        
        distribution = {outcome.value: 0 for outcome in PredictionOutcome}
        
        for prediction in predictions:
            if prediction.outcome_classification:
                distribution[prediction.outcome_classification.value] += 1
        
        return distribution
    
    def _analyze_accuracy_trends(
        self, 
        predictions: List[PredictionRecord]
    ) -> Dict[str, Any]:
        """Analyze accuracy trends over time"""
        
        if len(predictions) < 3:
            return {"trend": "insufficient_data", "slope": 0.0, "correlation": 0.0}
        
        # Sort predictions by date
        sorted_predictions = sorted(predictions, key=lambda x: x.prediction_date)
        
        # Calculate accuracy scores over time
        accuracy_scores = []
        time_points = []
        
        for i, prediction in enumerate(sorted_predictions):
            overall_accuracy = prediction.accuracy_scores.get("overall_accuracy", 0.0)
            if overall_accuracy == 0.0:  # Calculate if not stored
                risk_acc = prediction.accuracy_scores.get(AccuracyMetric.RISK_LEVEL_ACCURACY.value, 0)
                interval_acc = prediction.accuracy_scores.get(AccuracyMetric.INTERVAL_ACCURACY.value, 0)
                failure_acc = prediction.accuracy_scores.get(AccuracyMetric.FAILURE_PREDICTION.value, 0)
                overall_accuracy = (risk_acc * 0.4 + interval_acc * 0.3 + failure_acc * 0.3)
            
            accuracy_scores.append(overall_accuracy)
            time_points.append(i)
        
        # Calculate trend slope using simple linear regression
        n = len(accuracy_scores)
        sum_x = sum(time_points)
        sum_y = sum(accuracy_scores)
        sum_xy = sum(x * y for x, y in zip(time_points, accuracy_scores))
        sum_x2 = sum(x * x for x in time_points)
        
        if n * sum_x2 - sum_x * sum_x != 0:
            slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
        else:
            slope = 0.0
        
        # Determine trend direction
        if slope > 0.01:
            trend = "improving"
        elif slope < -0.01:
            trend = "declining"
        else:
            trend = "stable"
        
        # Calculate correlation coefficient
        if len(set(accuracy_scores)) > 1 and len(set(time_points)) > 1:
            try:
                correlation = statistics.correlation(time_points, accuracy_scores)
            except:
                correlation = 0.0
        else:
            correlation = 0.0
        
        return {
            "trend": trend,
            "slope": slope,
            "correlation": correlation,
            "recent_accuracy": statistics.mean(accuracy_scores[-3:]) if len(accuracy_scores) >= 3 else 0.0,
            "early_accuracy": statistics.mean(accuracy_scores[:3]) if len(accuracy_scores) >= 3 else 0.0
        }
    
    def _generate_accuracy_recommendations(
        self,
        predictions: List[PredictionRecord],
        accuracy_metrics: Dict[str, float],
        trend_analysis: Dict[str, Any]
    ) -> List[str]:
        """Generate recommendations based on accuracy analysis"""
        
        recommendations = []
        
        # Overall accuracy recommendations
        overall_accuracy = accuracy_metrics.get("overall_accuracy", 0.0)
        if overall_accuracy < 0.6:
            recommendations.append("Overall prediction accuracy is below acceptable threshold - review calculation parameters")
        elif overall_accuracy > 0.85:
            recommendations.append("Excellent prediction accuracy - current methodology is performing well")
        
        # Risk level accuracy recommendations
        risk_accuracy = accuracy_metrics.get("risk_level_accuracy", 0.0)
        if risk_accuracy < 0.7:
            recommendations.append("Risk level predictions need improvement - consider adjusting risk matrix thresholds")
        
        # Interval accuracy recommendations
        interval_accuracy = accuracy_metrics.get("interval_accuracy", 0.0)
        if interval_accuracy < 0.6:
            recommendations.append("Inspection interval predictions are inaccurate - review degradation rate models")
        
        # Failure prediction recommendations
        failure_accuracy = accuracy_metrics.get("failure_prediction_accuracy", 0.0)
        if failure_accuracy < 0.8:
            recommendations.append("Critical failure prediction needs improvement - enhance damage mechanism modeling")
        
        # Trend-based recommendations
        trend = trend_analysis.get("trend", "stable")
        if trend == "declining":
            recommendations.append("Prediction accuracy is declining over time - investigate recent changes in methodology or data quality")
        elif trend == "improving":
            recommendations.append("Prediction accuracy is improving - continue current practices and monitor progress")
        
        # Confidence correlation recommendations
        confidence_weighted = accuracy_metrics.get("confidence_weighted_accuracy", 0.0)
        if confidence_weighted < overall_accuracy * 0.9:
            recommendations.append("High-confidence predictions are not significantly more accurate - review confidence scoring algorithm")
        
        # Data quality recommendations
        low_quality_predictions = [p for p in predictions if p.data_quality_score < 0.7]
        if len(low_quality_predictions) > len(predictions) * 0.3:
            recommendations.append("High proportion of low data quality predictions - focus on improving data collection processes")
        
        return recommendations or ["Continue monitoring prediction accuracy and maintain current practices"]
    
    def _calculate_confidence_correlation(self, predictions: List[PredictionRecord]) -> float:
        """Calculate correlation between confidence scores and accuracy"""
        
        if len(predictions) < 3:
            return 0.0
        
        confidence_scores = [p.confidence_score for p in predictions]
        accuracy_scores = []
        
        for prediction in predictions:
            # Calculate overall accuracy for each prediction
            risk_acc = prediction.accuracy_scores.get(AccuracyMetric.RISK_LEVEL_ACCURACY.value, 0)
            interval_acc = prediction.accuracy_scores.get(AccuracyMetric.INTERVAL_ACCURACY.value, 0)
            failure_acc = prediction.accuracy_scores.get(AccuracyMetric.FAILURE_PREDICTION.value, 0)
            overall_acc = (risk_acc * 0.4 + interval_acc * 0.3 + failure_acc * 0.3)
            accuracy_scores.append(overall_acc)
        
        # Calculate correlation
        if len(set(confidence_scores)) > 1 and len(set(accuracy_scores)) > 1:
            try:
                return statistics.correlation(confidence_scores, accuracy_scores)
            except:
                return 0.0
        else:
            return 0.0
    
    def _analyze_data_quality_impact(self, predictions: List[PredictionRecord]) -> Dict[str, float]:
        """Analyze impact of data quality on prediction accuracy"""
        
        if not predictions:
            return {}
        
        # Group predictions by data quality ranges
        high_quality = [p for p in predictions if p.data_quality_score >= 0.8]
        medium_quality = [p for p in predictions if 0.6 <= p.data_quality_score < 0.8]
        low_quality = [p for p in predictions if p.data_quality_score < 0.6]
        
        impact_analysis = {}
        
        # Calculate accuracy for each quality group
        for quality_group, name in [(high_quality, "high"), (medium_quality, "medium"), (low_quality, "low")]:
            if quality_group:
                group_metrics = self._calculate_equipment_accuracy_metrics(quality_group)
                impact_analysis[f"{name}_quality_accuracy"] = group_metrics.get("overall_accuracy", 0.0)
                impact_analysis[f"{name}_quality_count"] = len(quality_group)
            else:
                impact_analysis[f"{name}_quality_accuracy"] = 0.0
                impact_analysis[f"{name}_quality_count"] = 0
        
        # Calculate quality impact score
        high_acc = impact_analysis.get("high_quality_accuracy", 0.0)
        low_acc = impact_analysis.get("low_quality_accuracy", 0.0)
        impact_analysis["quality_impact_score"] = high_acc - low_acc
        
        return impact_analysis
    
    def _calculate_system_accuracy_metrics(self, predictions: List[PredictionRecord]) -> Dict[str, float]:
        """Calculate system-wide accuracy metrics"""
        return self._calculate_equipment_accuracy_metrics(predictions)
    
    def _analyze_accuracy_by_dimension(
        self, 
        predictions: List[PredictionRecord], 
        dimension_extractor
    ) -> Dict[str, float]:
        """Analyze accuracy by a specific dimension (equipment type, calculation level, etc.)"""
        
        dimension_groups = defaultdict(list)
        
        # Group predictions by dimension
        for prediction in predictions:
            dimension_value = dimension_extractor(prediction)
            dimension_groups[dimension_value].append(prediction)
        
        # Calculate accuracy for each group
        dimension_accuracy = {}
        for dimension_value, group_predictions in dimension_groups.items():
            if group_predictions:
                group_metrics = self._calculate_equipment_accuracy_metrics(group_predictions)
                dimension_accuracy[dimension_value] = group_metrics.get("overall_accuracy", 0.0)
        
        return dimension_accuracy
    
    def _analyze_system_improvement_trends(self, predictions: List[PredictionRecord]) -> Dict[str, List[float]]:
        """Analyze system-wide improvement trends over time"""
        
        if len(predictions) < 6:
            return {"monthly_accuracy": [], "quarterly_accuracy": []}
        
        # Sort predictions by date
        sorted_predictions = sorted(predictions, key=lambda x: x.prediction_date)
        
        # Group by month and calculate monthly accuracy
        monthly_groups = defaultdict(list)
        for prediction in sorted_predictions:
            month_key = prediction.prediction_date.strftime("%Y-%m")
            monthly_groups[month_key].append(prediction)
        
        monthly_accuracy = []
        for month_key in sorted(monthly_groups.keys()):
            month_predictions = monthly_groups[month_key]
            if len(month_predictions) >= 3:  # Minimum predictions for meaningful accuracy
                month_metrics = self._calculate_equipment_accuracy_metrics(month_predictions)
                monthly_accuracy.append(month_metrics.get("overall_accuracy", 0.0))
        
        # Group by quarter for quarterly trends
        quarterly_groups = defaultdict(list)
        for prediction in sorted_predictions:
            quarter = (prediction.prediction_date.month - 1) // 3 + 1
            quarter_key = f"{prediction.prediction_date.year}-Q{quarter}"
            quarterly_groups[quarter_key].append(prediction)
        
        quarterly_accuracy = []
        for quarter_key in sorted(quarterly_groups.keys()):
            quarter_predictions = quarterly_groups[quarter_key]
            if len(quarter_predictions) >= 5:  # Minimum predictions for meaningful accuracy
                quarter_metrics = self._calculate_equipment_accuracy_metrics(quarter_predictions)
                quarterly_accuracy.append(quarter_metrics.get("overall_accuracy", 0.0))
        
        return {
            "monthly_accuracy": monthly_accuracy,
            "quarterly_accuracy": quarterly_accuracy
        }
    
    def _identify_top_performing_parameters(self, predictions: List[PredictionRecord]) -> List[str]:
        """Identify parameters that correlate with high prediction accuracy"""
        
        if len(predictions) < 10:
            return ["Insufficient data for parameter analysis"]
        
        # Analyze correlation between input parameters and accuracy
        parameter_correlations = {}
        
        # Get all unique parameter names
        all_parameters = set()
        for prediction in predictions:
            all_parameters.update(prediction.input_parameters.keys())
        
        for param_name in all_parameters:
            if param_name in ["equipment_type", "service_type", "criticality"]:
                continue  # Skip categorical parameters
            
            param_values = []
            accuracy_values = []
            
            for prediction in predictions:
                if param_name in prediction.input_parameters:
                    try:
                        param_value = float(prediction.input_parameters[param_name])
                        # Calculate overall accuracy
                        risk_acc = prediction.accuracy_scores.get(AccuracyMetric.RISK_LEVEL_ACCURACY.value, 0)
                        interval_acc = prediction.accuracy_scores.get(AccuracyMetric.INTERVAL_ACCURACY.value, 0)
                        failure_acc = prediction.accuracy_scores.get(AccuracyMetric.FAILURE_PREDICTION.value, 0)
                        overall_acc = (risk_acc * 0.4 + interval_acc * 0.3 + failure_acc * 0.3)
                        
                        param_values.append(param_value)
                        accuracy_values.append(overall_acc)
                    except (ValueError, TypeError):
                        continue
            
            if len(param_values) >= 5 and len(set(param_values)) > 1:
                try:
                    correlation = abs(statistics.correlation(param_values, accuracy_values))
                    parameter_correlations[param_name] = correlation
                except:
                    continue
        
        # Sort parameters by correlation strength
        sorted_params = sorted(
            parameter_correlations.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        # Return top 5 parameters
        top_params = [param for param, corr in sorted_params[:5] if corr > 0.3]
        
        return top_params or ["No strongly correlated parameters identified"]
    
    def _identify_improvement_areas(
        self, 
        predictions: List[PredictionRecord], 
        overall_metrics: Dict[str, float]
    ) -> List[str]:
        """Identify areas that need improvement based on accuracy analysis"""
        
        improvement_areas = []
        
        # Check individual metric performance
        risk_accuracy = overall_metrics.get("risk_level_accuracy", 0.0)
        interval_accuracy = overall_metrics.get("interval_accuracy", 0.0)
        failure_accuracy = overall_metrics.get("failure_prediction_accuracy", 0.0)
        
        if risk_accuracy < 0.7:
            improvement_areas.append("Risk level classification accuracy")
        
        if interval_accuracy < 0.6:
            improvement_areas.append("Inspection interval prediction accuracy")
        
        if failure_accuracy < 0.8:
            improvement_areas.append("Critical failure prediction capability")
        
        # Check calculation level performance
        level_accuracy = defaultdict(list)
        for prediction in predictions:
            overall_acc = (
                prediction.accuracy_scores.get(AccuracyMetric.RISK_LEVEL_ACCURACY.value, 0) * 0.4 +
                prediction.accuracy_scores.get(AccuracyMetric.INTERVAL_ACCURACY.value, 0) * 0.3 +
                prediction.accuracy_scores.get(AccuracyMetric.FAILURE_PREDICTION.value, 0) * 0.3
            )
            level_accuracy[prediction.calculation_level.value].append(overall_acc)
        
        for level, accuracies in level_accuracy.items():
            if accuracies and statistics.mean(accuracies) < 0.65:
                improvement_areas.append(f"{level} calculation methodology")
        
        # Check over/under prediction patterns
        outcome_counts = defaultdict(int)
        for prediction in predictions:
            if prediction.outcome_classification:
                outcome_counts[prediction.outcome_classification.value] += 1
        
        total_predictions = sum(outcome_counts.values())
        if total_predictions > 0:
            over_pred_rate = outcome_counts[PredictionOutcome.OVER_PREDICTED.value] / total_predictions
            under_pred_rate = outcome_counts[PredictionOutcome.UNDER_PREDICTED.value] / total_predictions
            
            if over_pred_rate > 0.4:
                improvement_areas.append("Systematic over-prediction bias")
            elif under_pred_rate > 0.4:
                improvement_areas.append("Systematic under-prediction bias")
        
        return improvement_areas or ["No significant improvement areas identified"]
"""Data quality assessment service for RBI calculations"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import statistics
from app.domains.rbi.models.core import (
    ExtractedRBIData,
    EquipmentData,
    ServiceType,
    EquipmentType
)


class DataQualityLevel(str, Enum):
    """Data quality levels"""
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    CRITICAL = "critical"


@dataclass
class DataQualityScore:
    """Data quality assessment result"""
    parameter: str
    completeness: float  # 0-1
    accuracy: float      # 0-1
    timeliness: float    # 0-1
    consistency: float   # 0-1
    overall_score: float # 0-1
    quality_level: DataQualityLevel
    issues: List[str]
    recommendations: List[str]


@dataclass
class EstimatedData:
    """Estimated parameter data"""
    parameter: str
    estimated_value: Any
    confidence: float  # 0-1
    estimation_method: str
    basis: str
    uncertainty_range: Optional[Tuple[float, float]] = None


class DataQualityAssessor:
    """Service for assessing and improving data quality"""
    
    def __init__(self):
        """Initialize data quality assessor"""
        # Industry standard values for estimation
        self.industry_standards = {
            "corrosion_rates": {
                ServiceType.SOUR_GAS: {"mean": 0.2, "std": 0.1, "range": (0.1, 0.5)},
                ServiceType.SWEET_GAS: {"mean": 0.05, "std": 0.02, "range": (0.02, 0.1)},
                ServiceType.AMINE: {"mean": 0.08, "std": 0.04, "range": (0.04, 0.15)},
                ServiceType.WATER: {"mean": 0.03, "std": 0.01, "range": (0.01, 0.08)},
                ServiceType.STEAM: {"mean": 0.02, "std": 0.01, "range": (0.01, 0.05)}
            },
            "coating_lifespans": {
                "excellent": {"years": 15, "degradation_rate": 0.05},
                "moderate": {"years": 8, "degradation_rate": 0.12},
                "none": {"years": 0, "degradation_rate": 1.0}
            }
        }
    
    def assess_data_completeness(self, data: Dict[str, Any]) -> DataQualityScore:
        """Assess completeness of data"""
        required_fields = [
            "equipment_id", "equipment_type", "service_type", "installation_date",
            "design_pressure", "design_temperature", "material"
        ]
        
        optional_fields = [
            "corrosion_rate", "thickness_measurements", "coating_condition",
            "damage_mechanisms", "inspection_findings", "last_inspection_date"
        ]
        
        # Calculate completeness scores
        required_present = sum(1 for field in required_fields if data.get(field) is not None)
        required_completeness = required_present / len(required_fields)
        
        optional_present = sum(1 for field in optional_fields if data.get(field) is not None)
        optional_completeness = optional_present / len(optional_fields)
        
        # Overall completeness (weighted)
        overall_completeness = (required_completeness * 0.7) + (optional_completeness * 0.3)
        
        # Identify issues
        issues = []
        missing_required = [field for field in required_fields if data.get(field) is None]
        missing_optional = [field for field in optional_fields if data.get(field) is None]
        
        if missing_required:
            issues.append(f"Missing required fields: {', '.join(missing_required)}")
        if len(missing_optional) > len(optional_fields) * 0.5:
            issues.append(f"Many optional fields missing: {', '.join(missing_optional[:3])}...")
        
        # Generate recommendations
        recommendations = []
        if required_completeness < 1.0:
            recommendations.append("Complete all required equipment data fields")
        if optional_completeness < 0.5:
            recommendations.append("Collect additional inspection and operational data")
        
        # Determine quality level
        if overall_completeness >= 0.9:
            quality_level = DataQualityLevel.EXCELLENT
        elif overall_completeness >= 0.75:
            quality_level = DataQualityLevel.GOOD
        elif overall_completeness >= 0.6:
            quality_level = DataQualityLevel.FAIR
        elif overall_completeness >= 0.4:
            quality_level = DataQualityLevel.POOR
        else:
            quality_level = DataQualityLevel.CRITICAL
        
        return DataQualityScore(
            parameter="completeness",
            completeness=overall_completeness,
            accuracy=1.0,  # Completeness doesn't affect accuracy
            timeliness=1.0,  # Completeness doesn't affect timeliness
            consistency=1.0,  # Completeness doesn't affect consistency
            overall_score=overall_completeness,
            quality_level=quality_level,
            issues=issues,
            recommendations=recommendations
        )
    
    def assess_data_accuracy(self, data: Dict[str, Any]) -> DataQualityScore:
        """Assess accuracy of data values"""
        accuracy_scores = []
        issues = []
        recommendations = []
        
        # Check numerical values for reasonableness
        if "design_pressure" in data and data["design_pressure"] is not None:
            pressure = data["design_pressure"]
            if pressure <= 0 or pressure > 1000:  # Unreasonable pressure values
                accuracy_scores.append(0.0)
                issues.append(f"Unreasonable design pressure: {pressure} bar")
                recommendations.append("Verify design pressure value")
            else:
                accuracy_scores.append(1.0)
        
        if "design_temperature" in data and data["design_temperature"] is not None:
            temperature = data["design_temperature"]
            if temperature < -50 or temperature > 800:  # Unreasonable temperature values
                accuracy_scores.append(0.0)
                issues.append(f"Unreasonable design temperature: {temperature}°C")
                recommendations.append("Verify design temperature value")
            else:
                accuracy_scores.append(1.0)
        
        # Check corrosion rate reasonableness
        if "corrosion_rate" in data and data["corrosion_rate"] is not None:
            rate = data["corrosion_rate"]
            if rate < 0 or rate > 10:  # Unreasonable corrosion rate
                accuracy_scores.append(0.0)
                issues.append(f"Unreasonable corrosion rate: {rate} mm/year")
                recommendations.append("Verify corrosion rate calculation")
            else:
                accuracy_scores.append(1.0)
        
        # Check equipment age consistency
        if "installation_date" in data and data["installation_date"] is not None:
            install_date = data["installation_date"]
            if isinstance(install_date, datetime):
                age_years = (datetime.now() - install_date).days / 365.25
                if age_years < 0 or age_years > 100:
                    accuracy_scores.append(0.0)
                    issues.append(f"Unreasonable equipment age: {age_years:.1f} years")
                    recommendations.append("Verify installation date")
                else:
                    accuracy_scores.append(1.0)
        
        # Check thickness measurements consistency
        if "thickness_measurements" in data and data["thickness_measurements"]:
            measurements = data["thickness_measurements"]
            for measurement in measurements:
                if hasattr(measurement, 'thickness') and hasattr(measurement, 'minimum_required'):
                    if measurement.thickness < measurement.minimum_required * 0.3:
                        accuracy_scores.append(0.5)  # Questionable but possible
                        issues.append(f"Very low thickness at {measurement.location}")
                        recommendations.append("Verify thickness measurements accuracy")
                    else:
                        accuracy_scores.append(1.0)
        
        # Calculate overall accuracy
        if accuracy_scores:
            overall_accuracy = statistics.mean(accuracy_scores)
        else:
            overall_accuracy = 0.5  # No data to assess
            issues.append("Insufficient data for accuracy assessment")
        
        # Determine quality level
        if overall_accuracy >= 0.9:
            quality_level = DataQualityLevel.EXCELLENT
        elif overall_accuracy >= 0.75:
            quality_level = DataQualityLevel.GOOD
        elif overall_accuracy >= 0.6:
            quality_level = DataQualityLevel.FAIR
        elif overall_accuracy >= 0.4:
            quality_level = DataQualityLevel.POOR
        else:
            quality_level = DataQualityLevel.CRITICAL
        
        return DataQualityScore(
            parameter="accuracy",
            completeness=1.0,  # Accuracy doesn't affect completeness
            accuracy=overall_accuracy,
            timeliness=1.0,  # Accuracy doesn't affect timeliness
            consistency=1.0,  # Accuracy doesn't affect consistency
            overall_score=overall_accuracy,
            quality_level=quality_level,
            issues=issues,
            recommendations=recommendations
        )
    
    def assess_data_timeliness(self, data: Dict[str, Any]) -> DataQualityScore:
        """Assess timeliness of data"""
        timeliness_scores = []
        issues = []
        recommendations = []
        current_date = datetime.now()
        
        # Check last inspection date
        if "last_inspection_date" in data and data["last_inspection_date"] is not None:
            last_inspection = data["last_inspection_date"]
            if isinstance(last_inspection, datetime):
                days_since = (current_date - last_inspection).days
                
                if days_since <= 365:  # Within 1 year
                    timeliness_scores.append(1.0)
                elif days_since <= 730:  # Within 2 years
                    timeliness_scores.append(0.8)
                elif days_since <= 1095:  # Within 3 years
                    timeliness_scores.append(0.6)
                    issues.append("Inspection data is getting old (>2 years)")
                    recommendations.append("Schedule updated inspection")
                else:  # Older than 3 years
                    timeliness_scores.append(0.3)
                    issues.append("Inspection data is very old (>3 years)")
                    recommendations.append("Urgent inspection required")
        
        # Check thickness measurement dates
        if "thickness_measurements" in data and data["thickness_measurements"]:
            measurements = data["thickness_measurements"]
            measurement_ages = []
            
            for measurement in measurements:
                if hasattr(measurement, 'measurement_date'):
                    days_since = (current_date - measurement.measurement_date).days
                    measurement_ages.append(days_since)
            
            if measurement_ages:
                avg_age = statistics.mean(measurement_ages)
                if avg_age <= 365:
                    timeliness_scores.append(1.0)
                elif avg_age <= 730:
                    timeliness_scores.append(0.8)
                elif avg_age <= 1095:
                    timeliness_scores.append(0.6)
                else:
                    timeliness_scores.append(0.3)
                    issues.append("Thickness measurements are very old")
        
        # Calculate overall timeliness
        if timeliness_scores:
            overall_timeliness = statistics.mean(timeliness_scores)
        else:
            overall_timeliness = 0.0
            issues.append("No dated information available")
            recommendations.append("Collect current inspection data")
        
        # Determine quality level
        if overall_timeliness >= 0.9:
            quality_level = DataQualityLevel.EXCELLENT
        elif overall_timeliness >= 0.75:
            quality_level = DataQualityLevel.GOOD
        elif overall_timeliness >= 0.6:
            quality_level = DataQualityLevel.FAIR
        elif overall_timeliness >= 0.4:
            quality_level = DataQualityLevel.POOR
        else:
            quality_level = DataQualityLevel.CRITICAL
        
        return DataQualityScore(
            parameter="timeliness",
            completeness=1.0,  # Timeliness doesn't affect completeness
            accuracy=1.0,  # Timeliness doesn't affect accuracy
            timeliness=overall_timeliness,
            consistency=1.0,  # Timeliness doesn't affect consistency
            overall_score=overall_timeliness,
            quality_level=quality_level,
            issues=issues,
            recommendations=recommendations
        )
    
    def assess_data_consistency(self, data: Dict[str, Any]) -> DataQualityScore:
        """Assess consistency of data"""
        consistency_scores = []
        issues = []
        recommendations = []
        
        # Check operating vs design conditions
        if all(key in data and data[key] is not None for key in 
               ["operating_pressure", "design_pressure"]):
            op_pressure = data["operating_pressure"]
            design_pressure = data["design_pressure"]
            
            if op_pressure > design_pressure * 1.1:  # 10% tolerance
                consistency_scores.append(0.0)
                issues.append("Operating pressure exceeds design pressure")
                recommendations.append("Verify pressure values for consistency")
            else:
                consistency_scores.append(1.0)
        
        if all(key in data and data[key] is not None for key in 
               ["operating_temperature", "design_temperature"]):
            op_temp = data["operating_temperature"]
            design_temp = data["design_temperature"]
            
            if op_temp > design_temp + 50:  # 50°C tolerance
                consistency_scores.append(0.0)
                issues.append("Operating temperature significantly exceeds design temperature")
                recommendations.append("Verify temperature values for consistency")
            else:
                consistency_scores.append(1.0)
        
        # Check corrosion rate vs service type consistency
        if all(key in data and data[key] is not None for key in 
               ["corrosion_rate", "service_type"]):
            rate = data["corrosion_rate"]
            service = data["service_type"]
            
            if isinstance(service, ServiceType):
                expected_range = self.industry_standards["corrosion_rates"].get(service)
                if expected_range:
                    min_rate, max_rate = expected_range["range"]
                    if rate < min_rate * 0.1 or rate > max_rate * 3:  # Wide tolerance
                        consistency_scores.append(0.5)
                        issues.append(f"Corrosion rate unusual for {service.value} service")
                        recommendations.append("Verify corrosion rate for service type")
                    else:
                        consistency_scores.append(1.0)
        
        # Check thickness measurements consistency
        if "thickness_measurements" in data and data["thickness_measurements"]:
            measurements = data["thickness_measurements"]
            location_thicknesses = {}
            
            for measurement in measurements:
                if hasattr(measurement, 'location') and hasattr(measurement, 'thickness'):
                    location = measurement.location
                    if location not in location_thicknesses:
                        location_thicknesses[location] = []
                    location_thicknesses[location].append(measurement.thickness)
            
            # Check for consistency within locations
            for location, thicknesses in location_thicknesses.items():
                if len(thicknesses) > 1:
                    thickness_range = max(thicknesses) - min(thicknesses)
                    avg_thickness = statistics.mean(thicknesses)
                    
                    if thickness_range > avg_thickness * 0.2:  # 20% variation
                        consistency_scores.append(0.7)
                        issues.append(f"High thickness variation at {location}")
                        recommendations.append("Review thickness measurement procedures")
                    else:
                        consistency_scores.append(1.0)
        
        # Calculate overall consistency
        if consistency_scores:
            overall_consistency = statistics.mean(consistency_scores)
        else:
            overall_consistency = 1.0  # No inconsistencies found
        
        # Determine quality level
        if overall_consistency >= 0.9:
            quality_level = DataQualityLevel.EXCELLENT
        elif overall_consistency >= 0.75:
            quality_level = DataQualityLevel.GOOD
        elif overall_consistency >= 0.6:
            quality_level = DataQualityLevel.FAIR
        elif overall_consistency >= 0.4:
            quality_level = DataQualityLevel.POOR
        else:
            quality_level = DataQualityLevel.CRITICAL
        
        return DataQualityScore(
            parameter="consistency",
            completeness=1.0,  # Consistency doesn't affect completeness
            accuracy=1.0,  # Consistency doesn't affect accuracy
            timeliness=1.0,  # Consistency doesn't affect timeliness
            consistency=overall_consistency,
            overall_score=overall_consistency,
            quality_level=quality_level,
            issues=issues,
            recommendations=recommendations
        )
    
    def estimate_missing_parameters(self, partial_data: Dict[str, Any]) -> List[EstimatedData]:
        """Estimate missing parameters based on available data"""
        estimates = []
        
        # Estimate corrosion rate if missing
        if "corrosion_rate" not in partial_data or partial_data["corrosion_rate"] is None:
            corrosion_estimate = self._estimate_corrosion_rate(partial_data)
            if corrosion_estimate:
                estimates.append(corrosion_estimate)
        
        # Estimate coating condition if missing
        if "coating_condition" not in partial_data or partial_data["coating_condition"] is None:
            coating_estimate = self._estimate_coating_condition(partial_data)
            if coating_estimate:
                estimates.append(coating_estimate)
        
        # Estimate inspection quality if missing
        if "inspection_quality" not in partial_data or partial_data["inspection_quality"] is None:
            inspection_estimate = self._estimate_inspection_quality(partial_data)
            if inspection_estimate:
                estimates.append(inspection_estimate)
        
        return estimates
    
    def _estimate_corrosion_rate(self, data: Dict[str, Any]) -> Optional[EstimatedData]:
        """Estimate corrosion rate based on service type and age"""
        if "service_type" not in data or data["service_type"] is None:
            return None
        
        service_type = data["service_type"]
        if isinstance(service_type, ServiceType):
            standards = self.industry_standards["corrosion_rates"].get(service_type)
            if standards:
                base_rate = standards["mean"]
                
                # Adjust for equipment age if available
                if "installation_date" in data and data["installation_date"]:
                    age_years = (datetime.now() - data["installation_date"]).days / 365.25
                    age_factor = 1.0 + (age_years - 10) * 0.02  # 2% increase per year after 10 years
                    age_factor = max(0.5, min(2.0, age_factor))  # Limit factor
                    estimated_rate = base_rate * age_factor
                else:
                    estimated_rate = base_rate
                
                # Adjust for coating condition if available
                if "coating_condition" in data and data["coating_condition"]:
                    coating_factors = {"excellent": 0.5, "moderate": 1.0, "none": 2.0}
                    coating_factor = coating_factors.get(data["coating_condition"], 1.0)
                    estimated_rate *= coating_factor
                
                min_rate, max_rate = standards["range"]
                uncertainty_range = (max(min_rate, estimated_rate * 0.5), 
                                   min(max_rate, estimated_rate * 1.5))
                
                return EstimatedData(
                    parameter="corrosion_rate",
                    estimated_value=round(estimated_rate, 3),
                    confidence=0.6,  # Moderate confidence for service-based estimation
                    estimation_method="service_type_based",
                    basis=f"Industry standard for {service_type.value} service",
                    uncertainty_range=uncertainty_range
                )
        
        return None
    
    def _estimate_coating_condition(self, data: Dict[str, Any]) -> Optional[EstimatedData]:
        """Estimate coating condition based on age and service"""
        if "installation_date" not in data or data["installation_date"] is None:
            return None
        
        age_years = (datetime.now() - data["installation_date"]).days / 365.25
        
        # Estimate based on typical coating lifespan
        if age_years < 5:
            estimated_condition = "excellent"
            confidence = 0.7
        elif age_years < 12:
            estimated_condition = "moderate"
            confidence = 0.6
        else:
            estimated_condition = "none"
            confidence = 0.5
        
        # Adjust for service severity
        if "service_type" in data and data["service_type"]:
            service = data["service_type"]
            if isinstance(service, ServiceType):
                if service in [ServiceType.SOUR_GAS, ServiceType.H2S]:
                    # Harsh service degrades coating faster
                    if estimated_condition == "excellent" and age_years > 3:
                        estimated_condition = "moderate"
                    elif estimated_condition == "moderate" and age_years > 8:
                        estimated_condition = "none"
        
        return EstimatedData(
            parameter="coating_condition",
            estimated_value=estimated_condition,
            confidence=confidence,
            estimation_method="age_and_service_based",
            basis=f"Equipment age ({age_years:.1f} years) and service conditions"
        )
    
    def _estimate_inspection_quality(self, data: Dict[str, Any]) -> Optional[EstimatedData]:
        """Estimate inspection quality based on available data"""
        quality_indicators = 0
        total_indicators = 4
        
        # Check for thickness measurements
        if "thickness_measurements" in data and data["thickness_measurements"]:
            quality_indicators += 1
        
        # Check for inspection findings
        if "inspection_findings" in data and data["inspection_findings"]:
            quality_indicators += 1
        
        # Check for damage mechanisms
        if "damage_mechanisms" in data and data["damage_mechanisms"]:
            quality_indicators += 1
        
        # Check for recent inspection
        if "last_inspection_date" in data and data["last_inspection_date"]:
            days_since = (datetime.now() - data["last_inspection_date"]).days
            if days_since <= 730:  # Within 2 years
                quality_indicators += 1
        
        quality_ratio = quality_indicators / total_indicators
        
        if quality_ratio >= 0.75:
            estimated_quality = "good"
            confidence = 0.8
        elif quality_ratio >= 0.5:
            estimated_quality = "average"
            confidence = 0.7
        else:
            estimated_quality = "poor"
            confidence = 0.6
        
        return EstimatedData(
            parameter="inspection_quality",
            estimated_value=estimated_quality,
            confidence=confidence,
            estimation_method="data_completeness_based",
            basis=f"Based on {quality_indicators}/{total_indicators} quality indicators"
        )
    
    def generate_data_improvement_recommendations(
        self, 
        assessment: List[DataQualityScore]
    ) -> List[str]:
        """Generate comprehensive data improvement recommendations"""
        recommendations = []
        
        # Collect all recommendations from assessments
        for score in assessment:
            recommendations.extend(score.recommendations)
        
        # Add general recommendations based on quality levels
        quality_levels = [score.quality_level for score in assessment]
        
        if DataQualityLevel.CRITICAL in quality_levels:
            recommendations.append("URGENT: Critical data quality issues require immediate attention")
        
        if DataQualityLevel.POOR in quality_levels:
            recommendations.append("Implement data quality improvement program")
        
        # Remove duplicates while preserving order
        unique_recommendations = []
        for rec in recommendations:
            if rec not in unique_recommendations:
                unique_recommendations.append(rec)
        
        return unique_recommendations
    
    def calculate_overall_data_quality(
        self, 
        assessments: List[DataQualityScore]
    ) -> DataQualityScore:
        """Calculate overall data quality score"""
        if not assessments:
            return DataQualityScore(
                parameter="overall",
                completeness=0.0,
                accuracy=0.0,
                timeliness=0.0,
                consistency=0.0,
                overall_score=0.0,
                quality_level=DataQualityLevel.CRITICAL,
                issues=["No data available for assessment"],
                recommendations=["Collect basic equipment and inspection data"]
            )
        
        # Calculate weighted averages
        weights = {"completeness": 0.3, "accuracy": 0.3, "timeliness": 0.2, "consistency": 0.2}
        
        avg_completeness = statistics.mean([a.completeness for a in assessments])
        avg_accuracy = statistics.mean([a.accuracy for a in assessments])
        avg_timeliness = statistics.mean([a.timeliness for a in assessments])
        avg_consistency = statistics.mean([a.consistency for a in assessments])
        
        overall_score = (
            avg_completeness * weights["completeness"] +
            avg_accuracy * weights["accuracy"] +
            avg_timeliness * weights["timeliness"] +
            avg_consistency * weights["consistency"]
        )
        
        # Determine overall quality level
        if overall_score >= 0.9:
            quality_level = DataQualityLevel.EXCELLENT
        elif overall_score >= 0.75:
            quality_level = DataQualityLevel.GOOD
        elif overall_score >= 0.6:
            quality_level = DataQualityLevel.FAIR
        elif overall_score >= 0.4:
            quality_level = DataQualityLevel.POOR
        else:
            quality_level = DataQualityLevel.CRITICAL
        
        # Collect all issues and recommendations
        all_issues = []
        all_recommendations = []
        for assessment in assessments:
            all_issues.extend(assessment.issues)
            all_recommendations.extend(assessment.recommendations)
        
        return DataQualityScore(
            parameter="overall",
            completeness=avg_completeness,
            accuracy=avg_accuracy,
            timeliness=avg_timeliness,
            consistency=avg_consistency,
            overall_score=overall_score,
            quality_level=quality_level,
            issues=list(set(all_issues)),  # Remove duplicates
            recommendations=list(set(all_recommendations))  # Remove duplicates
        )
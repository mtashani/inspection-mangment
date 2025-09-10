"""RBI Level Manager - Determines appropriate calculation level based on data availability"""

from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from app.domains.rbi.models.core import (
    EquipmentData,
    ExtractedRBIData,
    RBILevel,
    ServiceType,
    EquipmentType
)
from app.domains.rbi.models.config import RBIConfig


class RBILevelManager:
    """Manages RBI calculation level determination and fallback logic"""
    
    def __init__(self, config: Optional[RBIConfig] = None):
        """Initialize RBI level manager"""
        self.config = config or RBIConfig()
    
    def determine_calculation_level(
        self,
        equipment_data: EquipmentData,
        extracted_data: ExtractedRBIData,
        requested_level: Optional[RBILevel] = None
    ) -> Tuple[RBILevel, bool, List[str]]:
        """
        Determine appropriate RBI calculation level based on data availability
        
        Returns:
            Tuple of (actual_level, fallback_occurred, reasons)
        """
        
        # Assess data availability for each level
        level3_assessment = self._assess_level3_capability(equipment_data, extracted_data)
        level2_assessment = self._assess_level2_capability(equipment_data, extracted_data)
        level1_assessment = self._assess_level1_capability(equipment_data, extracted_data)
        
        # If no specific level requested, determine optimal level
        if requested_level is None:
            return self._determine_optimal_level(level3_assessment, level2_assessment, level1_assessment)
        
        # Check if requested level is achievable
        if requested_level == RBILevel.LEVEL_3:
            if level3_assessment["capable"]:
                return RBILevel.LEVEL_3, False, []
            elif level2_assessment["capable"]:
                return RBILevel.LEVEL_2, True, level3_assessment["missing_requirements"]
            else:
                return RBILevel.LEVEL_1, True, level3_assessment["missing_requirements"] + level2_assessment["missing_requirements"]
        
        elif requested_level == RBILevel.LEVEL_2:
            if level2_assessment["capable"]:
                return RBILevel.LEVEL_2, False, []
            else:
                return RBILevel.LEVEL_1, True, level2_assessment["missing_requirements"]
        
        else:  # Level 1 requested or fallback
            if level1_assessment["capable"]:
                return RBILevel.LEVEL_1, False, []
            else:
                # This should rarely happen as Level 1 has minimal requirements
                return RBILevel.LEVEL_1, True, level1_assessment["missing_requirements"]
    
    def _assess_level3_capability(self, equipment_data: EquipmentData, extracted_data: ExtractedRBIData) -> Dict:
        """Assess capability for Level 3 calculation"""
        
        assessment = {
            "capable": True,
            "missing_requirements": [],
            "data_quality_score": 0.0,
            "confidence_factors": []
        }
        
        # Required equipment data
        if not equipment_data.equipment_id:
            assessment["missing_requirements"].append("equipment_id")
            assessment["capable"] = False
        
        if not equipment_data.equipment_type:
            assessment["missing_requirements"].append("equipment_type")
            assessment["capable"] = False
        
        if not equipment_data.service_type:
            assessment["missing_requirements"].append("service_type")
            assessment["capable"] = False
        
        if not equipment_data.installation_date:
            assessment["missing_requirements"].append("installation_date")
            assessment["capable"] = False
        
        if equipment_data.design_pressure is None:
            assessment["missing_requirements"].append("design_pressure")
            assessment["capable"] = False
        
        if equipment_data.design_temperature is None:
            assessment["missing_requirements"].append("design_temperature")
            assessment["capable"] = False
        
        # Required extracted data for Level 3
        if extracted_data.corrosion_rate is None:
            assessment["missing_requirements"].append("corrosion_rate")
            assessment["capable"] = False
        
        if not extracted_data.thickness_measurements:
            assessment["missing_requirements"].append("thickness_measurements")
            assessment["capable"] = False
        elif len(extracted_data.thickness_measurements) < 3:
            assessment["missing_requirements"].append("minimum_3_thickness_measurements")
            assessment["capable"] = False
        
        if not extracted_data.last_inspection_date:
            assessment["missing_requirements"].append("last_inspection_date")
            assessment["capable"] = False
        elif self._is_data_too_old(extracted_data.last_inspection_date, max_age_years=2):
            assessment["missing_requirements"].append("recent_inspection_data")
            assessment["capable"] = False
        
        # Quality assessments
        if assessment["capable"]:
            assessment["data_quality_score"] = self._calculate_level3_data_quality(extracted_data)
            assessment["confidence_factors"] = self._get_level3_confidence_factors(equipment_data, extracted_data)
        
        return assessment
    
    def _assess_level2_capability(self, equipment_data: EquipmentData, extracted_data: ExtractedRBIData) -> Dict:
        """Assess capability for Level 2 calculation"""
        
        assessment = {
            "capable": True,
            "missing_requirements": [],
            "data_quality_score": 0.0,
            "confidence_factors": []
        }
        
        # Required equipment data (less stringent than Level 3)
        if not equipment_data.equipment_id:
            assessment["missing_requirements"].append("equipment_id")
            assessment["capable"] = False
        
        if not equipment_data.equipment_type:
            assessment["missing_requirements"].append("equipment_type")
            assessment["capable"] = False
        
        if not equipment_data.service_type:
            assessment["missing_requirements"].append("service_type")
            assessment["capable"] = False
        
        if not equipment_data.installation_date:
            assessment["missing_requirements"].append("installation_date")
            assessment["capable"] = False
        
        # Level 2 can work with some missing data but needs basic inspection info
        if not extracted_data.last_inspection_date:
            assessment["missing_requirements"].append("last_inspection_date")
            assessment["capable"] = False
        elif self._is_data_too_old(extracted_data.last_inspection_date, max_age_years=5):
            assessment["missing_requirements"].append("reasonably_recent_inspection_data")
            assessment["capable"] = False
        
        # Prefer to have some thickness or corrosion data
        has_thickness = bool(extracted_data.thickness_measurements)
        has_corrosion = extracted_data.corrosion_rate is not None
        
        if not has_thickness and not has_corrosion:
            assessment["missing_requirements"].append("thickness_or_corrosion_data")
            assessment["capable"] = False
        
        # Quality assessments
        if assessment["capable"]:
            assessment["data_quality_score"] = self._calculate_level2_data_quality(extracted_data)
            assessment["confidence_factors"] = self._get_level2_confidence_factors(equipment_data, extracted_data)
        
        return assessment
    
    def _assess_level1_capability(self, equipment_data: EquipmentData, extracted_data: ExtractedRBIData) -> Dict:
        """Assess capability for Level 1 calculation"""
        
        assessment = {
            "capable": True,
            "missing_requirements": [],
            "data_quality_score": 0.0,
            "confidence_factors": []
        }
        
        # Minimal requirements for Level 1
        if not equipment_data.equipment_id:
            assessment["missing_requirements"].append("equipment_id")
            assessment["capable"] = False
        
        if not equipment_data.equipment_type:
            assessment["missing_requirements"].append("equipment_type")
            assessment["capable"] = False
        
        if not equipment_data.service_type:
            assessment["missing_requirements"].append("service_type")
            assessment["capable"] = False
        
        # Level 1 can work with very minimal data
        if assessment["capable"]:
            assessment["data_quality_score"] = self._calculate_level1_data_quality(equipment_data, extracted_data)
            assessment["confidence_factors"] = self._get_level1_confidence_factors(equipment_data, extracted_data)
        
        return assessment   
 
    def _determine_optimal_level(self, level3_assessment: Dict, level2_assessment: Dict, level1_assessment: Dict) -> Tuple[RBILevel, bool, List[str]]:
        """Determine optimal calculation level based on data availability"""
        
        # Prefer highest level possible
        if level3_assessment["capable"]:
            # Check if Level 3 data quality is sufficient
            if level3_assessment["data_quality_score"] >= 0.7:
                return RBILevel.LEVEL_3, False, []
            elif level2_assessment["capable"]:
                # Level 3 data quality too low, fallback to Level 2
                return RBILevel.LEVEL_2, True, ["Level 3 data quality insufficient"]
        
        if level2_assessment["capable"]:
            # Check if Level 2 data quality is sufficient
            if level2_assessment["data_quality_score"] >= 0.5:
                return RBILevel.LEVEL_2, False, []
            elif level1_assessment["capable"]:
                # Level 2 data quality too low, fallback to Level 1
                return RBILevel.LEVEL_1, True, ["Level 2 data quality insufficient"]
        
        # Fallback to Level 1
        if level1_assessment["capable"]:
            return RBILevel.LEVEL_1, False, []
        else:
            # This should be very rare
            return RBILevel.LEVEL_1, True, level1_assessment["missing_requirements"]
    
    def _is_data_too_old(self, inspection_date: datetime, max_age_years: float) -> bool:
        """Check if inspection data is too old"""
        age_days = (datetime.now() - inspection_date).days
        max_age_days = max_age_years * 365.25
        return age_days > max_age_days
    
    def _calculate_level3_data_quality(self, extracted_data: ExtractedRBIData) -> float:
        """Calculate data quality score for Level 3"""
        quality_factors = []
        
        # Corrosion rate quality
        if extracted_data.corrosion_rate is not None:
            if 0 <= extracted_data.corrosion_rate <= 2.0:  # Reasonable range
                quality_factors.append(0.9)
            else:
                quality_factors.append(0.6)  # Suspicious value
        else:
            quality_factors.append(0.0)
        
        # Thickness measurements quality
        if extracted_data.thickness_measurements:
            thickness_count = len(extracted_data.thickness_measurements)
            if thickness_count >= 5:
                quality_factors.append(1.0)
            elif thickness_count >= 3:
                quality_factors.append(0.8)
            else:
                quality_factors.append(0.4)
        else:
            quality_factors.append(0.0)
        
        # Damage mechanisms
        if extracted_data.damage_mechanisms:
            quality_factors.append(0.8)
        else:
            quality_factors.append(0.5)
        
        # Inspection quality
        quality_scores = {"good": 0.9, "average": 0.7, "poor": 0.4}
        quality_factors.append(quality_scores.get(extracted_data.inspection_quality, 0.5))
        
        # Data recency
        if extracted_data.last_inspection_date:
            days_since = (datetime.now() - extracted_data.last_inspection_date).days
            if days_since <= 180:  # 6 months
                quality_factors.append(1.0)
            elif days_since <= 365:  # 1 year
                quality_factors.append(0.8)
            elif days_since <= 730:  # 2 years
                quality_factors.append(0.6)
            else:
                quality_factors.append(0.3)
        else:
            quality_factors.append(0.0)
        
        return sum(quality_factors) / len(quality_factors)
    
    def _calculate_level2_data_quality(self, extracted_data: ExtractedRBIData) -> float:
        """Calculate data quality score for Level 2"""
        quality_factors = []
        
        # Corrosion or thickness data
        has_corrosion = extracted_data.corrosion_rate is not None
        has_thickness = bool(extracted_data.thickness_measurements)
        
        if has_corrosion and has_thickness:
            quality_factors.append(0.9)
        elif has_corrosion or has_thickness:
            quality_factors.append(0.7)
        else:
            quality_factors.append(0.3)
        
        # Damage mechanisms
        if extracted_data.damage_mechanisms:
            quality_factors.append(0.8)
        else:
            quality_factors.append(0.6)
        
        # Inspection quality
        quality_scores = {"good": 0.8, "average": 0.6, "poor": 0.4}
        quality_factors.append(quality_scores.get(extracted_data.inspection_quality, 0.5))
        
        # Data recency (more lenient than Level 3)
        if extracted_data.last_inspection_date:
            days_since = (datetime.now() - extracted_data.last_inspection_date).days
            if days_since <= 365:  # 1 year
                quality_factors.append(0.9)
            elif days_since <= 1095:  # 3 years
                quality_factors.append(0.7)
            elif days_since <= 1825:  # 5 years
                quality_factors.append(0.5)
            else:
                quality_factors.append(0.2)
        else:
            quality_factors.append(0.0)
        
        return sum(quality_factors) / len(quality_factors)
    
    def _calculate_level1_data_quality(self, equipment_data: EquipmentData, extracted_data: ExtractedRBIData) -> float:
        """Calculate data quality score for Level 1"""
        quality_factors = []
        
        # Equipment master data completeness
        completeness = 0.0
        if equipment_data.equipment_id:
            completeness += 0.2
        if equipment_data.equipment_type:
            completeness += 0.2
        if equipment_data.service_type:
            completeness += 0.2
        if equipment_data.installation_date:
            completeness += 0.2
        if equipment_data.criticality_level:
            completeness += 0.2
        
        quality_factors.append(completeness)
        
        # Any inspection data is bonus for Level 1
        if extracted_data.last_inspection_date:
            quality_factors.append(0.6)
        else:
            quality_factors.append(0.4)
        
        return sum(quality_factors) / len(quality_factors)
    
    def _get_level3_confidence_factors(self, equipment_data: EquipmentData, extracted_data: ExtractedRBIData) -> List[str]:
        """Get confidence factors for Level 3 calculation"""
        factors = []
        
        if extracted_data.corrosion_rate is not None:
            factors.append("Measured corrosion rate available")
        
        if len(extracted_data.thickness_measurements) >= 5:
            factors.append("Comprehensive thickness measurements")
        elif len(extracted_data.thickness_measurements) >= 3:
            factors.append("Adequate thickness measurements")
        
        if extracted_data.damage_mechanisms:
            factors.append("Damage mechanisms identified")
        
        if extracted_data.inspection_quality == "good":
            factors.append("High quality inspection data")
        
        if extracted_data.last_inspection_date:
            days_since = (datetime.now() - extracted_data.last_inspection_date).days
            if days_since <= 365:
                factors.append("Recent inspection data")
        
        return factors
    
    def _get_level2_confidence_factors(self, equipment_data: EquipmentData, extracted_data: ExtractedRBIData) -> List[str]:
        """Get confidence factors for Level 2 calculation"""
        factors = []
        
        if extracted_data.corrosion_rate is not None:
            factors.append("Corrosion rate data available")
        
        if extracted_data.thickness_measurements:
            factors.append("Thickness measurement data available")
        
        if extracted_data.damage_mechanisms:
            factors.append("Some damage mechanism information")
        
        if extracted_data.inspection_quality in ["good", "average"]:
            factors.append("Reasonable inspection quality")
        
        return factors
    
    def _get_level1_confidence_factors(self, equipment_data: EquipmentData, extracted_data: ExtractedRBIData) -> List[str]:
        """Get confidence factors for Level 1 calculation"""
        factors = []
        
        factors.append("Equipment master data available")
        
        if equipment_data.criticality_level:
            factors.append("Equipment criticality defined")
        
        if extracted_data.last_inspection_date:
            factors.append("Some inspection history available")
        
        return factors
    
    def get_level_requirements(self, level: RBILevel) -> Dict[str, List[str]]:
        """Get data requirements for specific RBI level"""
        
        if level == RBILevel.LEVEL_3:
            return {
                "required_equipment_data": [
                    "equipment_id",
                    "equipment_type", 
                    "service_type",
                    "installation_date",
                    "design_pressure",
                    "design_temperature",
                    "material",
                    "criticality_level"
                ],
                "required_inspection_data": [
                    "corrosion_rate",
                    "thickness_measurements (minimum 3 points)",
                    "last_inspection_date (within 2 years)",
                    "damage_mechanisms",
                    "inspection_quality"
                ],
                "recommended_data": [
                    "coating_condition",
                    "inspection_findings",
                    "thickness_measurements (5+ points preferred)"
                ]
            }
        
        elif level == RBILevel.LEVEL_2:
            return {
                "required_equipment_data": [
                    "equipment_id",
                    "equipment_type",
                    "service_type", 
                    "installation_date",
                    "criticality_level"
                ],
                "required_inspection_data": [
                    "last_inspection_date (within 5 years)",
                    "thickness_measurements OR corrosion_rate"
                ],
                "recommended_data": [
                    "damage_mechanisms",
                    "coating_condition",
                    "inspection_quality",
                    "design_pressure",
                    "design_temperature"
                ]
            }
        
        else:  # Level 1
            return {
                "required_equipment_data": [
                    "equipment_id",
                    "equipment_type",
                    "service_type"
                ],
                "required_inspection_data": [],
                "recommended_data": [
                    "installation_date",
                    "criticality_level",
                    "last_inspection_date"
                ]
            }
    
    def get_level_capabilities(self) -> Dict[RBILevel, Dict[str, Any]]:
        """Get capabilities and characteristics of each RBI level"""
        
        return {
            RBILevel.LEVEL_1: {
                "name": "Level 1 - Static/Qualitative",
                "description": "Basic RBI calculation using equipment type and service classification",
                "confidence_range": "0.4-0.6",
                "data_requirements": "Minimal - equipment master data only",
                "calculation_method": "Fixed intervals based on equipment type and service",
                "typical_use_cases": [
                    "Equipment with no inspection history",
                    "New equipment without degradation data",
                    "Quick screening assessments"
                ],
                "limitations": [
                    "Conservative intervals",
                    "No consideration of actual condition",
                    "Limited accuracy"
                ]
            },
            
            RBILevel.LEVEL_2: {
                "name": "Level 2 - Semi-Quantitative", 
                "description": "RBI calculation using scoring tables and weighted factors",
                "confidence_range": "0.6-0.85",
                "data_requirements": "Moderate - inspection data and some condition assessment",
                "calculation_method": "Scoring tables with PoF and CoF factors",
                "typical_use_cases": [
                    "Equipment with inspection history",
                    "Standard RBI assessments",
                    "Equipment with moderate data availability"
                ],
                "limitations": [
                    "Relies on scoring table accuracy",
                    "Limited precision in risk quantification"
                ]
            },
            
            RBILevel.LEVEL_3: {
                "name": "Level 3 - Fully Quantitative",
                "description": "Advanced RBI calculation using quantitative degradation modeling",
                "confidence_range": "0.8-0.95", 
                "data_requirements": "Comprehensive - detailed inspection data and measurements",
                "calculation_method": "Quantitative models with degradation kinetics and remaining life",
                "typical_use_cases": [
                    "Critical equipment with comprehensive data",
                    "High-value assets requiring precise assessment",
                    "Equipment with detailed measurement history"
                ],
                "limitations": [
                    "Requires high-quality data",
                    "More complex calculation",
                    "Higher data maintenance requirements"
                ]
            }
        }
    
    def validate_level_transition(self, from_level: RBILevel, to_level: RBILevel, equipment_data: EquipmentData, extracted_data: ExtractedRBIData) -> Dict[str, Any]:
        """Validate if transition between RBI levels is possible"""
        
        target_assessment = None
        if to_level == RBILevel.LEVEL_3:
            target_assessment = self._assess_level3_capability(equipment_data, extracted_data)
        elif to_level == RBILevel.LEVEL_2:
            target_assessment = self._assess_level2_capability(equipment_data, extracted_data)
        else:
            target_assessment = self._assess_level1_capability(equipment_data, extracted_data)
        
        return {
            "transition_possible": target_assessment["capable"],
            "missing_requirements": target_assessment["missing_requirements"],
            "data_quality_score": target_assessment["data_quality_score"],
            "confidence_factors": target_assessment["confidence_factors"],
            "recommendations": self._get_transition_recommendations(from_level, to_level, target_assessment)
        }
    
    def _get_transition_recommendations(self, from_level: RBILevel, to_level: RBILevel, assessment: Dict) -> List[str]:
        """Get recommendations for improving data to enable level transition"""
        
        recommendations = []
        
        if not assessment["capable"]:
            recommendations.append(f"Cannot transition from {from_level.value} to {to_level.value}")
            
            for missing in assessment["missing_requirements"]:
                if missing == "corrosion_rate":
                    recommendations.append("Obtain corrosion rate data from thickness trend analysis")
                elif missing == "thickness_measurements":
                    recommendations.append("Conduct thickness measurements at multiple locations")
                elif missing == "minimum_3_thickness_measurements":
                    recommendations.append("Increase thickness measurement points to at least 3 locations")
                elif missing == "last_inspection_date":
                    recommendations.append("Conduct inspection to establish baseline data")
                elif missing == "recent_inspection_data":
                    recommendations.append("Update inspection data - current data is too old")
                elif missing == "design_pressure":
                    recommendations.append("Obtain design pressure from equipment documentation")
                elif missing == "design_temperature":
                    recommendations.append("Obtain design temperature from equipment documentation")
        
        else:
            recommendations.append(f"Transition from {from_level.value} to {to_level.value} is possible")
            
            if assessment["data_quality_score"] < 0.8:
                recommendations.append("Consider improving data quality for better calculation confidence")
        
        return recommendations
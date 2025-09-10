"""Level 1 RBI calculator - Static calculation based on equipment type and service"""

from typing import Dict, Optional
from datetime import datetime, timedelta
from app.domains.rbi.models.core import (
    RBICalculationResult,
    EquipmentData,
    RiskLevel,
    RBILevel,
    EquipmentType,
    ServiceType
)
from app.domains.rbi.models.config import RBIConfig


class Level1Calculator:
    """Level 1 RBI calculator using static intervals and simple risk categorization"""
    
    def __init__(self, config: Optional[RBIConfig] = None):
        """Initialize Level 1 calculator"""
        self.config = config or RBIConfig()
        
        # Use configurable settings from config
        self.level1_settings = self.config.level1_settings
    
    def calculate(
        self, 
        equipment_data: EquipmentData, 
        last_inspection_date: Optional[datetime] = None,
        apply_safety_factors: bool = False,
        data_quality_issues: Optional[list] = None
    ) -> RBICalculationResult:
        """Calculate Level 1 RBI result"""
        
        # Get base interval for equipment type
        base_interval = self.level1_settings.base_intervals.get(
            equipment_data.equipment_type.value, 
            48  # Default 4 years
        )
        
        # Apply service modifier
        service_modifier = self.level1_settings.service_modifiers.get(
            equipment_data.service_type.value, 
            1.0
        )
        
        # Apply criticality modifier
        criticality_modifier = self.level1_settings.criticality_modifiers.get(
            equipment_data.criticality_level, 
            1.0
        )
        
        # Calculate adjusted interval
        adjusted_interval = int(base_interval * service_modifier * criticality_modifier)
        
        # Apply safety factors if requested (for fallback scenarios)
        if apply_safety_factors:
            safety_factor = self._get_safety_factor(data_quality_issues or [])
            adjusted_interval = int(adjusted_interval / safety_factor)
        
        # Ensure minimum and maximum bounds
        adjusted_interval = max(6, min(adjusted_interval, 120))  # 6 months to 10 years
        
        # Calculate next inspection date
        if last_inspection_date:
            next_inspection_date = last_inspection_date + timedelta(days=adjusted_interval * 30)
        else:
            # If no last inspection date, assume it's due now
            next_inspection_date = datetime.now()
        
        # Determine risk level based on simple categorization
        risk_level = self._determine_risk_level(
            equipment_data, 
            adjusted_interval
        )
        
        # Calculate simple PoF and CoF scores
        pof_score = self._calculate_simple_pof(equipment_data)
        cof_scores = self._calculate_simple_cof(equipment_data)
        
        # Level 1 has lower confidence due to limited data
        confidence_score = 0.5
        data_quality_score = 0.4  # Static calculation has limited data quality
        
        return RBICalculationResult(
            equipment_id=equipment_data.equipment_id,
            calculation_level=RBILevel.LEVEL_1,
            requested_level=RBILevel.LEVEL_1,
            fallback_occurred=False,
            next_inspection_date=next_inspection_date,
            risk_level=risk_level,
            pof_score=pof_score,
            cof_scores=cof_scores,
            confidence_score=confidence_score,
            data_quality_score=data_quality_score,
            calculation_timestamp=datetime.now(),
            input_parameters={
                "equipment_type": equipment_data.equipment_type.value,
                "service_type": equipment_data.service_type.value,
                "criticality_level": equipment_data.criticality_level,
                "base_interval": base_interval,
                "service_modifier": service_modifier,
                "criticality_modifier": criticality_modifier
            },
            missing_data=[],
            estimated_parameters=[],
            inspection_interval_months=adjusted_interval
        )
    
    def _determine_risk_level(
        self, 
        equipment_data: EquipmentData, 
        interval_months: int
    ) -> RiskLevel:
        """Determine risk level based on equipment characteristics and interval"""
        
        # Start with medium risk as baseline
        risk_score = 3
        
        # Adjust based on service type
        aggressive_services = [
            ServiceType.SOUR_GAS, 
            ServiceType.H2S, 
            ServiceType.SULFUR_VAPOR,
            ServiceType.MERCAPTANS
        ]
        
        if equipment_data.service_type in aggressive_services:
            risk_score += 1
        elif equipment_data.service_type in [ServiceType.NITROGEN, ServiceType.WATER]:
            risk_score -= 1
        
        # Adjust based on equipment type
        high_risk_equipment = [
            EquipmentType.PRESSURE_VESSEL,
            EquipmentType.COMPRESSOR
        ]
        
        if equipment_data.equipment_type in high_risk_equipment:
            risk_score += 1
        
        # Adjust based on criticality
        if equipment_data.criticality_level == "Critical":
            risk_score += 2
        elif equipment_data.criticality_level == "High":
            risk_score += 1
        elif equipment_data.criticality_level == "Low":
            risk_score -= 1
        
        # Adjust based on age
        age_years = equipment_data.age_years
        if age_years > 25:
            risk_score += 2
        elif age_years > 15:
            risk_score += 1
        elif age_years < 5:
            risk_score -= 1
        
        # Convert score to risk level
        if risk_score <= 2:
            return RiskLevel.LOW
        elif risk_score <= 4:
            return RiskLevel.MEDIUM
        elif risk_score <= 6:
            return RiskLevel.HIGH
        else:
            return RiskLevel.VERY_HIGH
    
    def _calculate_simple_pof(self, equipment_data: EquipmentData) -> float:
        """Calculate simple PoF score based on equipment characteristics"""
        
        pof_score = 2.5  # Start with medium score
        
        # Age factor
        age_years = equipment_data.age_years
        if age_years > 25:
            pof_score += 1.5
        elif age_years > 15:
            pof_score += 1.0
        elif age_years > 10:
            pof_score += 0.5
        elif age_years < 5:
            pof_score -= 0.5
        
        # Service type factor
        service_factors = {
            ServiceType.SOUR_GAS: 1.0,
            ServiceType.H2S: 1.5,
            ServiceType.AMINE: 0.5,
            ServiceType.SWEET_GAS: 0.0,
            ServiceType.WATER: -0.5,
            ServiceType.STEAM: -0.3,
            ServiceType.NITROGEN: -1.0,
            ServiceType.SULFUR_VAPOR: 1.5,
            ServiceType.MERCAPTANS: 1.0,
            ServiceType.CONDENSATE: 0.3,
            ServiceType.NGL: 0.2,
            ServiceType.METHANOL: 0.3,
            ServiceType.GLYCOL: 0.2
        }
        
        service_factor = service_factors.get(equipment_data.service_type, 0.0)
        pof_score += service_factor
        
        # Equipment type factor
        equipment_factors = {
            EquipmentType.PRESSURE_VESSEL: 0.5,
            EquipmentType.PIPING: 0.3,
            EquipmentType.HEAT_EXCHANGER: 0.7,
            EquipmentType.PUMP: 0.2,
            EquipmentType.COMPRESSOR: 0.8,
            EquipmentType.TANK: 0.1
        }
        
        equipment_factor = equipment_factors.get(equipment_data.equipment_type, 0.0)
        pof_score += equipment_factor
        
        # Ensure score is within bounds
        return max(1.0, min(5.0, pof_score))
    
    def _calculate_simple_cof(self, equipment_data: EquipmentData) -> Dict[str, float]:
        """Calculate simple CoF scores based on equipment characteristics"""
        
        # Safety CoF
        safety_score = 2.0  # Base score
        
        # Pressure factor
        if equipment_data.design_pressure > 50:
            safety_score += 1.5
        elif equipment_data.design_pressure > 20:
            safety_score += 1.0
        elif equipment_data.design_pressure > 10:
            safety_score += 0.5
        
        # Fluid hazard factor
        hazardous_fluids = [
            ServiceType.SOUR_GAS, 
            ServiceType.H2S, 
            ServiceType.SULFUR_VAPOR,
            ServiceType.MERCAPTANS
        ]
        
        if equipment_data.service_type in hazardous_fluids:
            safety_score += 1.0
        elif equipment_data.service_type in [ServiceType.NITROGEN, ServiceType.WATER]:
            safety_score -= 0.5
        
        # Location factor
        if equipment_data.location == "near_sensitive":
            safety_score += 1.0
        elif equipment_data.location == "safe":
            safety_score -= 0.5
        
        # Environmental CoF
        environmental_score = 2.0  # Base score
        
        # Fluid environmental impact
        high_impact_fluids = [
            ServiceType.SOUR_GAS,
            ServiceType.H2S,
            ServiceType.AMINE,
            ServiceType.CONDENSATE,
            ServiceType.NGL,
            ServiceType.METHANOL,
            ServiceType.SULFUR_VAPOR,
            ServiceType.MERCAPTANS
        ]
        
        if equipment_data.service_type in high_impact_fluids:
            environmental_score += 1.0
        elif equipment_data.service_type in [ServiceType.NITROGEN, ServiceType.WATER, ServiceType.STEAM]:
            environmental_score -= 0.5
        
        # Inventory size factor
        if equipment_data.inventory_size > 100:
            environmental_score += 1.0
        elif equipment_data.inventory_size > 50:
            environmental_score += 0.5
        
        # Economic CoF
        economic_score = 2.0  # Base score
        
        # Criticality factor
        if equipment_data.criticality_level == "Critical":
            economic_score += 2.0
        elif equipment_data.criticality_level == "High":
            economic_score += 1.0
        elif equipment_data.criticality_level == "Low":
            economic_score -= 0.5
        
        # Equipment type factor (replacement cost and downtime)
        expensive_equipment = [
            EquipmentType.COMPRESSOR,
            EquipmentType.HEAT_EXCHANGER
        ]
        
        if equipment_data.equipment_type in expensive_equipment:
            economic_score += 0.5
        
        # Ensure scores are within bounds
        safety_score = max(1.0, min(5.0, safety_score))
        environmental_score = max(1.0, min(5.0, environmental_score))
        economic_score = max(1.0, min(5.0, economic_score))
        
        return {
            "safety": safety_score,
            "environmental": environmental_score,
            "economic": economic_score
        }
    
    def get_calculation_summary(self) -> Dict[str, any]:
        """Get summary of Level 1 calculation methodology"""
        return {
            "level": "Level 1 - Static",
            "description": "Basic RBI calculation using fixed intervals and simple risk categorization",
            "data_requirements": [
                "Equipment type",
                "Service type", 
                "Criticality level",
                "Installation date",
                "Last inspection date (optional)"
            ],
            "methodology": {
                "pof_calculation": "Based on equipment age, service type, and equipment type",
                "cof_calculation": "Based on pressure, fluid hazard, location, and criticality",
                "risk_determination": "Simple scoring algorithm",
                "interval_calculation": "Base interval × service modifier × criticality modifier"
            },
            "confidence_level": "Low to Medium (0.4-0.6)",
            "typical_use_cases": [
                "Initial risk assessment",
                "Equipment with limited inspection history",
                "Fallback when detailed data unavailable"
            ]
        }
    
    def validate_input_data(self, equipment_data: EquipmentData) -> Dict[str, list]:
        """Validate input data for Level 1 calculation"""
        validation_results = {
            "missing_required": [],
            "invalid_values": [],
            "warnings": []
        }
        
        # Check required fields
        if not equipment_data.equipment_id:
            validation_results["missing_required"].append("equipment_id")
        
        if not equipment_data.equipment_type:
            validation_results["missing_required"].append("equipment_type")
        
        if not equipment_data.service_type:
            validation_results["missing_required"].append("service_type")
        
        if not equipment_data.installation_date:
            validation_results["missing_required"].append("installation_date")
        
        # Check for reasonable values
        if equipment_data.design_pressure and equipment_data.design_pressure <= 0:
            validation_results["invalid_values"].append("design_pressure must be positive")
        
        if equipment_data.design_pressure and equipment_data.design_pressure > 1000:
            validation_results["warnings"].append("Very high design pressure - verify value")
        
        # Check age
        if equipment_data.installation_date:
            age = equipment_data.age_years
            if age < 0:
                validation_results["invalid_values"].append("Installation date cannot be in the future")
            elif age > 100:
                validation_results["warnings"].append("Very old equipment - verify installation date")
        
        return validation_results
    
    def _get_safety_factor(self, data_quality_issues: list) -> float:
        """Calculate safety factor based on data quality issues"""
        base_factor = 1.0
        
        # Apply conservative factors based on data issues
        issue_factors = {
            "missing_corrosion_rate": 1.3,
            "missing_thickness_data": 1.2,
            "old_inspection_data": 1.2,
            "limited_inspection_history": 1.15,
            "unknown_damage_mechanisms": 1.1,
            "poor_data_quality": 1.25
        }
        
        for issue in data_quality_issues:
            factor = issue_factors.get(issue, 1.05)  # Default 5% conservative factor
            base_factor *= factor
        
        # Cap the maximum safety factor
        return min(base_factor, 2.0)
    
    def calculate_emergency_fallback(
        self, 
        equipment_data: EquipmentData,
        reason: str = "insufficient_data"
    ) -> RBICalculationResult:
        """Calculate emergency fallback when even basic Level 1 data is insufficient"""
        
        # Use emergency intervals
        emergency_interval = self.level1_settings.emergency_intervals.get(
            equipment_data.equipment_type.value,
            self.config.fallback_settings.emergency_interval
        )
        
        # Apply maximum conservative factor
        emergency_interval = max(3, int(emergency_interval / 2.0))  # Very conservative
        
        # Next inspection should be immediate or very soon
        next_inspection_date = datetime.now() + timedelta(days=emergency_interval * 30)
        
        # Assign high risk due to uncertainty
        risk_level = RiskLevel.HIGH
        
        # Conservative PoF and CoF scores
        pof_score = 4.0  # High due to uncertainty
        cof_scores = {
            "safety": 3.0,
            "environmental": 3.0,
            "economic": 3.0
        }
        
        # Very low confidence
        confidence_score = 0.2
        data_quality_score = 0.1
        
        return RBICalculationResult(
            equipment_id=equipment_data.equipment_id,
            calculation_level=RBILevel.LEVEL_1,
            requested_level=RBILevel.LEVEL_1,
            fallback_occurred=True,
            next_inspection_date=next_inspection_date,
            risk_level=risk_level,
            pof_score=pof_score,
            cof_scores=cof_scores,
            confidence_score=confidence_score,
            data_quality_score=data_quality_score,
            calculation_timestamp=datetime.now(),
            input_parameters={
                "calculation_type": "emergency_fallback",
                "reason": reason,
                "emergency_interval": emergency_interval,
                "safety_factor": 2.0
            },
            missing_data=["most_required_data"],
            estimated_parameters=["all_parameters"],
            inspection_interval_months=emergency_interval
        )
    
    def calculate_with_fallback_protection(
        self,
        equipment_data: EquipmentData,
        last_inspection_date: Optional[datetime] = None,
        data_completeness_score: float = 1.0,
        data_quality_issues: Optional[list] = None
    ) -> RBICalculationResult:
        """Calculate with automatic fallback protection based on data quality"""
        
        # Determine if we need to apply safety factors
        apply_safety = data_completeness_score < 0.8 or (data_quality_issues and len(data_quality_issues) > 0)
        
        # If data is extremely poor, use emergency fallback
        if data_completeness_score < 0.3:
            return self.calculate_emergency_fallback(
                equipment_data, 
                "extremely_poor_data_quality"
            )
        
        # Otherwise, calculate normally with safety factors if needed
        result = self.calculate(
            equipment_data,
            last_inspection_date,
            apply_safety_factors=apply_safety,
            data_quality_issues=data_quality_issues
        )
        
        # Mark as fallback if safety factors were applied
        if apply_safety:
            result.fallback_occurred = True
            result.missing_data = data_quality_issues or ["data_quality_issues"]
            
            # Reduce confidence based on data quality
            result.confidence_score *= data_completeness_score
            result.data_quality_score = data_completeness_score
        
        return result
    
    def get_recommended_actions(self, result: RBICalculationResult) -> list:
        """Get recommended actions based on calculation result"""
        recommendations = []
        
        if result.fallback_occurred:
            recommendations.append("Improve data quality for more accurate RBI assessment")
            
            if result.data_quality_score < 0.3:
                recommendations.append("URGENT: Collect basic equipment and inspection data")
                recommendations.append("Schedule immediate inspection to establish baseline")
            elif result.data_quality_score < 0.6:
                recommendations.append("Collect missing inspection and operational data")
                recommendations.append("Implement regular inspection program")
        
        if result.risk_level == RiskLevel.VERY_HIGH:
            recommendations.append("CRITICAL: Immediate inspection required")
            recommendations.append("Consider temporary operational restrictions")
        elif result.risk_level == RiskLevel.HIGH:
            recommendations.append("Schedule inspection within recommended interval")
            recommendations.append("Monitor equipment closely")
        
        if result.inspection_interval_months <= 6:
            recommendations.append("Consider more frequent monitoring between inspections")
        
        # Equipment-specific recommendations
        if "sour" in str(result.input_parameters.get("service_type", "")):
            recommendations.append("Pay special attention to H2S corrosion mechanisms")
        
        if result.input_parameters.get("equipment_type") == "compressor":
            recommendations.append("Include vibration analysis in inspection program")
        
        return recommendations
    
    def compare_with_industry_standards(
        self, 
        result: RBICalculationResult
    ) -> Dict[str, any]:
        """Compare result with industry standards"""
        
        equipment_type = result.input_parameters.get("equipment_type")
        service_type = result.input_parameters.get("service_type")
        
        # Industry standard intervals (conservative estimates)
        industry_standards = {
            "pressure_vessel": {"sour_gas": 24, "sweet_gas": 48, "water": 60},
            "piping": {"sour_gas": 36, "sweet_gas": 60, "water": 72},
            "heat_exchanger": {"sour_gas": 18, "sweet_gas": 36, "water": 48},
            "pump": {"sour_gas": 12, "sweet_gas": 24, "water": 36},
            "compressor": {"sour_gas": 12, "sweet_gas": 18, "water": 24},
            "tank": {"sour_gas": 36, "sweet_gas": 60, "water": 84}
        }
        
        standard_interval = None
        if equipment_type in industry_standards:
            service_standards = industry_standards[equipment_type]
            # Try to find matching service, fallback to sour_gas (conservative)
            standard_interval = service_standards.get(
                service_type, 
                service_standards.get("sour_gas", 24)
            )
        
        comparison = {
            "calculated_interval": result.inspection_interval_months,
            "industry_standard": standard_interval,
            "comparison": "unknown"
        }
        
        if standard_interval:
            if result.inspection_interval_months < standard_interval * 0.8:
                comparison["comparison"] = "more_conservative"
            elif result.inspection_interval_months > standard_interval * 1.2:
                comparison["comparison"] = "less_conservative"
            else:
                comparison["comparison"] = "aligned"
        
        return comparison
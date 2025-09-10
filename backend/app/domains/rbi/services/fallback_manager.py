"""Fallback Manager - Handles intelligent fallback between RBI calculation levels"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from app.domains.rbi.models.core import (
    RBICalculationResult,
    EquipmentData,
    ExtractedRBIData,
    RBILevel,
    RiskLevel
)
from app.domains.rbi.models.config import RBIConfig
from app.domains.rbi.services.rbi_level_manager import RBILevelManager
from app.domains.rbi.services.level1_calculator import Level1Calculator
from app.domains.rbi.services.level2_calculator import Level2Calculator
from app.domains.rbi.services.level3_calculator import Level3Calculator


class FallbackManager:
    """Manages intelligent fallback between RBI calculation levels"""
    
    def __init__(self, config: Optional[RBIConfig] = None):
        """Initialize fallback manager"""
        self.config = config or RBIConfig()
        self.level_manager = RBILevelManager(self.config)
        self.level1_calculator = Level1Calculator(self.config)
        self.level2_calculator = Level2Calculator(self.config)
        self.level3_calculator = Level3Calculator(self.config)
    
    def calculate_with_fallback(
        self,
        equipment_data: EquipmentData,
        extracted_data: ExtractedRBIData,
        requested_level: Optional[RBILevel] = None,
        last_inspection_date: Optional[datetime] = None
    ) -> RBICalculationResult:
        """
        Perform RBI calculation with intelligent fallback
        
        Args:
            equipment_data: Equipment master data
            extracted_data: Extracted inspection data
            requested_level: Desired calculation level (None for auto-determination)
            last_inspection_date: Date of last inspection
            
        Returns:
            RBICalculationResult with fallback information
        """
        
        # Determine appropriate calculation level
        actual_level, fallback_occurred, fallback_reasons = self.level_manager.determine_calculation_level(
            equipment_data, extracted_data, requested_level
        )
        
        # Perform calculation at determined level
        try:
            if actual_level == RBILevel.LEVEL_3:
                result = self.level3_calculator.calculate(equipment_data, extracted_data, last_inspection_date)
            elif actual_level == RBILevel.LEVEL_2:
                result = self.level2_calculator.calculate(equipment_data, extracted_data, last_inspection_date)
            else:
                result = self.level1_calculator.calculate(equipment_data, last_inspection_date)
            
            # Apply conservative adjustments if fallback occurred
            if fallback_occurred:
                result = self._apply_conservative_adjustments(result, requested_level, actual_level, fallback_reasons)
            
            # Update result with fallback information (after adjustments)
            from dataclasses import replace
            result = replace(
                result,
                requested_level=requested_level or actual_level,
                fallback_occurred=fallback_occurred
            )
            
            return result
            
        except Exception as e:
            # If calculation fails, try fallback to lower level
            return self._handle_calculation_failure(
                equipment_data, extracted_data, actual_level, last_inspection_date, str(e)
            )
    
    def _apply_conservative_adjustments(
        self,
        result: RBICalculationResult,
        requested_level: Optional[RBILevel],
        actual_level: RBILevel,
        fallback_reasons: List[str]
    ) -> RBICalculationResult:
        """Apply conservative adjustments when fallback occurs"""
        
        # Calculate adjustment factors based on fallback severity
        adjustment_factor = self._calculate_adjustment_factor(requested_level, actual_level, fallback_reasons)
        
        # Apply conservative adjustment to inspection interval
        original_interval = result.inspection_interval_months
        adjusted_interval = max(3, int(original_interval * adjustment_factor))
        
        # Adjust next inspection date accordingly
        adjusted_next_date = result.next_inspection_date
        if result.next_inspection_date:
            from datetime import timedelta
            days_adjustment = (adjusted_interval - original_interval) * 30
            adjusted_next_date = result.next_inspection_date - timedelta(days=days_adjustment)
        
        # Reduce confidence score due to fallback
        confidence_reduction = self._calculate_confidence_reduction(requested_level, actual_level)
        adjusted_confidence = max(0.1, result.confidence_score - confidence_reduction)
        
        # Add fallback information to input parameters
        updated_params = result.input_parameters.copy()
        updated_params.update({
            "fallback_occurred": True,
            "fallback_reasons": fallback_reasons,
            "requested_level": requested_level.value if requested_level else None,
            "actual_level": actual_level.value,
            "adjustment_factor": adjustment_factor,
            "confidence_reduction": confidence_reduction
        })
        
        # Create new result with adjustments
        from dataclasses import replace
        return replace(
            result,
            inspection_interval_months=adjusted_interval,
            next_inspection_date=adjusted_next_date,
            confidence_score=adjusted_confidence,
            input_parameters=updated_params
        )
    
    def _calculate_adjustment_factor(
        self,
        requested_level: Optional[RBILevel],
        actual_level: RBILevel,
        fallback_reasons: List[str]
    ) -> float:
        """Calculate conservative adjustment factor based on fallback severity"""
        
        if not requested_level:
            return 1.0  # No adjustment if no specific level was requested
        
        # Base adjustment factors for level differences
        level_adjustments = {
            (RBILevel.LEVEL_3, RBILevel.LEVEL_2): 0.8,  # 20% more conservative
            (RBILevel.LEVEL_3, RBILevel.LEVEL_1): 0.6,  # 40% more conservative
            (RBILevel.LEVEL_2, RBILevel.LEVEL_1): 0.7,  # 30% more conservative
        }
        
        base_factor = level_adjustments.get((requested_level, actual_level), 1.0)
        
        # Additional adjustments based on specific missing data
        critical_missing_data = [
            "corrosion_rate",
            "thickness_measurements",
            "recent_inspection_data"
        ]
        
        critical_missing_count = sum(1 for reason in fallback_reasons 
                                   if any(critical in reason for critical in critical_missing_data))
        
        # Additional 10% conservative adjustment per critical missing data type
        additional_factor = 1.0 - (critical_missing_count * 0.1)
        
        return max(0.4, base_factor * additional_factor)  # Minimum 40% of original interval
    
    def _calculate_confidence_reduction(
        self,
        requested_level: Optional[RBILevel],
        actual_level: RBILevel
    ) -> float:
        """Calculate confidence score reduction due to fallback"""
        
        if not requested_level:
            return 0.0
        
        # Confidence reductions for level differences
        confidence_reductions = {
            (RBILevel.LEVEL_3, RBILevel.LEVEL_2): 0.15,  # 15% reduction
            (RBILevel.LEVEL_3, RBILevel.LEVEL_1): 0.30,  # 30% reduction
            (RBILevel.LEVEL_2, RBILevel.LEVEL_1): 0.20,  # 20% reduction
        }
        
        return confidence_reductions.get((requested_level, actual_level), 0.0)
    
    def _handle_calculation_failure(
        self,
        equipment_data: EquipmentData,
        extracted_data: ExtractedRBIData,
        failed_level: RBILevel,
        last_inspection_date: Optional[datetime],
        error_message: str
    ) -> RBICalculationResult:
        """Handle calculation failure by attempting fallback to lower level"""
        
        fallback_reasons = [f"Calculation failed at {failed_level.value}: {error_message}"]
        
        # Try fallback to lower levels
        if failed_level == RBILevel.LEVEL_3:
            try:
                result = self.level2_calculator.calculate(equipment_data, extracted_data, last_inspection_date)
                result.requested_level = RBILevel.LEVEL_3
                result.fallback_occurred = True
                return self._apply_conservative_adjustments(result, RBILevel.LEVEL_3, RBILevel.LEVEL_2, fallback_reasons)
            except Exception:
                # Try Level 1
                pass
        
        if failed_level in [RBILevel.LEVEL_3, RBILevel.LEVEL_2]:
            try:
                result = self.level1_calculator.calculate(equipment_data, last_inspection_date)
                result.requested_level = failed_level
                result.fallback_occurred = True
                return self._apply_conservative_adjustments(result, failed_level, RBILevel.LEVEL_1, fallback_reasons)
            except Exception as e:
                # If even Level 1 fails, create emergency result
                return self._create_emergency_result(equipment_data, str(e))
        
        # Should not reach here, but create emergency result as last resort
        return self._create_emergency_result(equipment_data, error_message)
    
    def _create_emergency_result(self, equipment_data: EquipmentData, error_message: str) -> RBICalculationResult:
        """Create emergency result when all calculation levels fail"""
        
        from datetime import datetime, timedelta
        
        return RBICalculationResult(
            equipment_id=equipment_data.equipment_id,
            calculation_level=RBILevel.LEVEL_1,
            requested_level=RBILevel.LEVEL_1,
            fallback_occurred=True,
            next_inspection_date=datetime.now() + timedelta(days=90),  # Very conservative 3 months
            risk_level=RiskLevel.HIGH,  # Conservative assumption
            pof_score=4.0,  # Conservative high score
            cof_scores={"safety": 3.0, "environmental": 3.0, "economic": 3.0},  # Conservative scores
            confidence_score=0.1,  # Very low confidence
            data_quality_score=0.1,  # Very low quality
            calculation_timestamp=datetime.now(),
            input_parameters={
                "emergency_calculation": True,
                "error_message": error_message,
                "fallback_reasons": ["All calculation levels failed"]
            },
            missing_data=["All required data"],
            estimated_parameters=["All parameters estimated"],
            inspection_interval_months=3  # Very conservative interval
        )
    
    def get_fallback_summary(
        self,
        equipment_data: EquipmentData,
        extracted_data: ExtractedRBIData,
        requested_level: Optional[RBILevel] = None
    ) -> Dict[str, Any]:
        """Get summary of fallback analysis without performing calculation"""
        
        # Assess all levels
        level3_assessment = self.level_manager._assess_level3_capability(equipment_data, extracted_data)
        level2_assessment = self.level_manager._assess_level2_capability(equipment_data, extracted_data)
        level1_assessment = self.level_manager._assess_level1_capability(equipment_data, extracted_data)
        
        # Determine what would happen
        actual_level, fallback_occurred, fallback_reasons = self.level_manager.determine_calculation_level(
            equipment_data, extracted_data, requested_level
        )
        
        return {
            "requested_level": requested_level.value if requested_level else "auto",
            "recommended_level": actual_level.value,
            "fallback_required": fallback_occurred,
            "fallback_reasons": fallback_reasons,
            "level_assessments": {
                "level_3": {
                    "capable": level3_assessment["capable"],
                    "missing_requirements": level3_assessment["missing_requirements"],
                    "data_quality_score": level3_assessment["data_quality_score"],
                    "confidence_factors": level3_assessment["confidence_factors"]
                },
                "level_2": {
                    "capable": level2_assessment["capable"],
                    "missing_requirements": level2_assessment["missing_requirements"],
                    "data_quality_score": level2_assessment["data_quality_score"],
                    "confidence_factors": level2_assessment["confidence_factors"]
                },
                "level_1": {
                    "capable": level1_assessment["capable"],
                    "missing_requirements": level1_assessment["missing_requirements"],
                    "data_quality_score": level1_assessment["data_quality_score"],
                    "confidence_factors": level1_assessment["confidence_factors"]
                }
            },
            "adjustment_factor": self._calculate_adjustment_factor(requested_level, actual_level, fallback_reasons) if fallback_occurred else 1.0,
            "confidence_reduction": self._calculate_confidence_reduction(requested_level, actual_level) if fallback_occurred else 0.0,
            "recommendations": self._get_fallback_recommendations(level3_assessment, level2_assessment, level1_assessment, requested_level)
        }
    
    def _get_fallback_recommendations(
        self,
        level3_assessment: Dict,
        level2_assessment: Dict,
        level1_assessment: Dict,
        requested_level: Optional[RBILevel]
    ) -> List[str]:
        """Get recommendations for improving data to avoid fallback"""
        
        recommendations = []
        
        if requested_level == RBILevel.LEVEL_3 and not level3_assessment["capable"]:
            recommendations.append("To enable Level 3 calculation:")
            for missing in level3_assessment["missing_requirements"]:
                if missing == "corrosion_rate":
                    recommendations.append("- Obtain corrosion rate from thickness trend analysis")
                elif missing == "thickness_measurements":
                    recommendations.append("- Conduct thickness measurements at multiple locations")
                elif missing == "minimum_3_thickness_measurements":
                    recommendations.append("- Increase thickness measurement points to at least 3 locations")
                elif missing == "recent_inspection_data":
                    recommendations.append("- Conduct recent inspection (within 2 years)")
                elif missing == "design_pressure":
                    recommendations.append("- Obtain design pressure from equipment documentation")
                elif missing == "design_temperature":
                    recommendations.append("- Obtain design temperature from equipment documentation")
        
        elif requested_level == RBILevel.LEVEL_2 and not level2_assessment["capable"]:
            recommendations.append("To enable Level 2 calculation:")
            for missing in level2_assessment["missing_requirements"]:
                if missing == "thickness_or_corrosion_data":
                    recommendations.append("- Obtain either thickness measurements or corrosion rate data")
                elif missing == "reasonably_recent_inspection_data":
                    recommendations.append("- Conduct inspection (within 5 years)")
        
        # General data quality improvements
        if level3_assessment["capable"] and level3_assessment["data_quality_score"] < 0.8:
            recommendations.append("To improve Level 3 data quality:")
            recommendations.append("- Increase number of thickness measurement points")
            recommendations.append("- Ensure inspection data is recent and comprehensive")
            recommendations.append("- Document damage mechanisms thoroughly")
        
        if not recommendations:
            if level3_assessment["capable"]:
                recommendations.append("Data is sufficient for Level 3 calculation")
            elif level2_assessment["capable"]:
                recommendations.append("Data is sufficient for Level 2 calculation")
            else:
                recommendations.append("Only Level 1 calculation possible with current data")
        
        return recommendations
    
    def validate_fallback_strategy(
        self,
        equipment_data: EquipmentData,
        extracted_data: ExtractedRBIData,
        requested_level: RBILevel
    ) -> Dict[str, Any]:
        """Validate fallback strategy for specific equipment and data"""
        
        # Get fallback summary
        summary = self.get_fallback_summary(equipment_data, extracted_data, requested_level)
        
        # Perform actual calculation to test
        try:
            result = self.calculate_with_fallback(equipment_data, extracted_data, requested_level)
            calculation_successful = True
            calculation_error = None
        except Exception as e:
            calculation_successful = False
            calculation_error = str(e)
            result = None
        
        return {
            "validation_successful": calculation_successful,
            "calculation_error": calculation_error,
            "fallback_summary": summary,
            "result_preview": {
                "actual_level": result.calculation_level.value if result else None,
                "fallback_occurred": result.fallback_occurred if result else None,
                "confidence_score": result.confidence_score if result else None,
                "inspection_interval": result.inspection_interval_months if result else None
            } if result else None,
            "validation_timestamp": datetime.now()
        }
"""RBI Calculation Engine - Main orchestration engine for RBI calculations"""

from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
import logging
from dataclasses import asdict

from app.domains.rbi.models.core import (
    RBICalculationResult,
    EquipmentData,
    ExtractedRBIData,
    RBILevel,
    RiskLevel
)
from app.domains.rbi.models.config import RBIConfig
from app.domains.rbi.services.equipment_data_service import EquipmentDataService
from app.domains.rbi.services.report_data_extractor import ReportDataExtractor
from app.domains.rbi.services.data_quality_assessor import DataQualityAssessor
from app.domains.rbi.services.rbi_level_manager import RBILevelManager
from app.domains.rbi.services.level1_calculator import Level1Calculator
from app.domains.rbi.services.level2_calculator import Level2Calculator
from app.domains.rbi.services.level3_calculator import Level3Calculator
from app.domains.rbi.services.fallback_manager import FallbackManager
from app.domains.rbi.services.fallback_reporter import FallbackReporter


logger = logging.getLogger(__name__)


class RBICalculationEngine:
    """Main orchestration engine for RBI calculations"""
    
    def __init__(self, config: Optional[RBIConfig] = None):
        """Initialize RBI calculation engine"""
        self.config = config or RBIConfig()
        
        # Initialize services
        self.equipment_service = EquipmentDataService()
        self.data_extractor = ReportDataExtractor()
        self.data_quality_assessor = DataQualityAssessor()
        self.level_manager = RBILevelManager(self.config)
        self.fallback_manager = FallbackManager()
        self.fallback_reporter = FallbackReporter(self.fallback_manager)
        
        # Initialize calculators
        self.level1_calculator = Level1Calculator(self.config)
        self.level2_calculator = Level2Calculator(self.config)
        self.level3_calculator = Level3Calculator(self.config)
        
        # Calculator mapping
        self.calculators = {
            RBILevel.LEVEL_1: self.level1_calculator,
            RBILevel.LEVEL_2: self.level2_calculator,
            RBILevel.LEVEL_3: self.level3_calculator
        }
    
    def calculate_next_inspection_date(
        self,
        equipment_id: str,
        requested_level: Optional[RBILevel] = None,
        force_recalculation: bool = False
    ) -> RBICalculationResult:
        """
        Calculate next inspection date for equipment using RBI methodology
        
        Args:
            equipment_id: Unique equipment identifier
            requested_level: Desired RBI calculation level (defaults to Level 3)
            force_recalculation: Force recalculation even if recent result exists
            
        Returns:
            RBICalculationResult with calculation details and next inspection date
        """
        
        logger.info(f"Starting RBI calculation for equipment {equipment_id}")
        
        try:
            # Step 1: Gather equipment data
            equipment_data = self._gather_equipment_data(equipment_id)
            
            # Step 2: Extract inspection data
            extracted_data = self._extract_inspection_data(equipment_id)
            
            # Step 3: Assess data quality
            data_quality = self._assess_data_quality(equipment_data, extracted_data)
            
            # Step 4: Determine feasible calculation level
            requested_level = requested_level or RBILevel.LEVEL_3
            feasible_level = self._determine_calculation_level(
                requested_level, equipment_data, extracted_data, data_quality
            )
            
            # Step 5: Execute calculation
            calculation_result = self._execute_calculation(
                feasible_level, equipment_data, extracted_data, requested_level
            )
            
            # Step 6: Apply fallback adjustments if needed
            if calculation_result.fallback_occurred:
                calculation_result = self._apply_fallback_adjustments(
                    calculation_result, equipment_data, extracted_data
                )
            
            # Step 7: Generate calculation summary
            calculation_result = self._finalize_calculation_result(
                calculation_result, equipment_data, extracted_data, data_quality
            )
            
            logger.info(
                f"RBI calculation completed for {equipment_id}: "
                f"Level {calculation_result.calculation_level.value}, "
                f"Risk {calculation_result.risk_level.value}, "
                f"Interval {calculation_result.inspection_interval_months} months"
            )
            
            return calculation_result
            
        except Exception as e:
            logger.error(f"RBI calculation failed for equipment {equipment_id}: {str(e)}")
            # Return emergency fallback result
            return self._create_emergency_fallback_result(equipment_id, str(e))
    
    def calculate_batch(
        self,
        equipment_ids: List[str],
        requested_level: Optional[RBILevel] = None,
        max_parallel: int = 5,
        **kwargs
    ) -> List[RBICalculationResult]:
        """
        Calculate RBI for multiple equipment items in batch (legacy method)
        
        This method provides backward compatibility. For advanced batch processing,
        use BatchCalculationService directly.
        
        Args:
            equipment_ids: List of equipment identifiers
            requested_level: Desired RBI calculation level for all equipment
            max_parallel: Maximum number of parallel calculations
            **kwargs: Additional arguments passed to batch service
            
        Returns:
            List of RBICalculationResult objects
        """
        
        logger.info(f"Starting legacy batch RBI calculation for {len(equipment_ids)} equipment items")
        
        # Import here to avoid circular imports
        from app.domains.rbi.services.batch_calculation_service import (
            BatchCalculationService,
            BatchCalculationRequest
        )
        
        # Create batch service
        batch_service = BatchCalculationService(self.config)
        
        # Create batch request
        request = BatchCalculationRequest(
            equipment_ids=equipment_ids,
            requested_level=requested_level,
            max_parallel=max_parallel,
            cache_enabled=kwargs.get('cache_enabled', True),
            error_handling=kwargs.get('error_handling', 'continue'),
            priority_equipment=kwargs.get('priority_equipment', [])
        )
        
        # Execute batch calculation
        batch_result = batch_service.calculate_batch(request)
        
        logger.info(
            f"Legacy batch RBI calculation completed: "
            f"{batch_result.successful_calculations} successful, "
            f"{batch_result.failed_calculations} failed"
        )
        
        return batch_result.results
    
    def _gather_equipment_data(self, equipment_id: str) -> EquipmentData:
        """Gather equipment master data"""
        
        logger.debug(f"Gathering equipment data for {equipment_id}")
        
        try:
            equipment_data = self.equipment_service.get_equipment_data(equipment_id)
            if not equipment_data:
                raise ValueError(f"Equipment {equipment_id} not found")
            
            return equipment_data
            
        except Exception as e:
            logger.error(f"Failed to gather equipment data for {equipment_id}: {str(e)}")
            raise
    
    def _extract_inspection_data(self, equipment_id: str) -> ExtractedRBIData:
        """Extract RBI-relevant data from inspection reports"""
        
        logger.debug(f"Extracting inspection data for {equipment_id}")
        
        try:
            extracted_data = self.data_extractor.extract_rbi_data(equipment_id)
            return extracted_data
            
        except Exception as e:
            logger.error(f"Failed to extract inspection data for {equipment_id}: {str(e)}")
            # Return minimal data structure to allow fallback
            return ExtractedRBIData(
                equipment_id=equipment_id,
                thickness_measurements=[],
                corrosion_rate=None,
                coating_condition=None,
                damage_mechanisms=[],
                inspection_findings=[],
                last_inspection_date=None,
                inspection_quality="poor"
            )
    
    def _assess_data_quality(
        self, 
        equipment_data: EquipmentData, 
        extracted_data: ExtractedRBIData
    ) -> Dict[str, Any]:
        """Assess overall data quality for calculation"""
        
        logger.debug(f"Assessing data quality for {equipment_data.equipment_id}")
        
        try:
            quality_assessment = self.data_quality_assessor.assess_data_quality(
                equipment_data, extracted_data
            )
            return quality_assessment
            
        except Exception as e:
            logger.error(f"Data quality assessment failed: {str(e)}")
            # Return minimal quality assessment
            return {
                "overall_score": 0.3,
                "completeness_score": 0.3,
                "accuracy_score": 0.5,
                "timeliness_score": 0.2,
                "issues": ["Data quality assessment failed"],
                "recommendations": ["Review data collection procedures"]
            }
    
    def _determine_calculation_level(
        self,
        requested_level: RBILevel,
        equipment_data: EquipmentData,
        extracted_data: ExtractedRBIData,
        data_quality: Dict[str, Any]
    ) -> RBILevel:
        """Determine the feasible calculation level based on available data"""
        
        logger.debug(f"Determining calculation level for {equipment_data.equipment_id}")
        
        try:
            level_determination = self.level_manager.determine_calculation_level(
                equipment_data, extracted_data, requested_level
            )
            
            feasible_level = level_determination["recommended_level"]
            
            if feasible_level != requested_level:
                logger.info(
                    f"Level fallback for {equipment_data.equipment_id}: "
                    f"{requested_level.value} -> {feasible_level.value}"
                )
            
            return feasible_level
            
        except Exception as e:
            logger.error(f"Level determination failed: {str(e)}")
            # Default to Level 1 as ultimate fallback
            return RBILevel.LEVEL_1
    
    def _execute_calculation(
        self,
        calculation_level: RBILevel,
        equipment_data: EquipmentData,
        extracted_data: ExtractedRBIData,
        requested_level: RBILevel
    ) -> RBICalculationResult:
        """Execute the actual RBI calculation using appropriate calculator"""
        
        logger.debug(
            f"Executing {calculation_level.value} calculation for {equipment_data.equipment_id}"
        )
        
        try:
            calculator = self.calculators[calculation_level]
            
            # Execute calculation
            result = calculator.calculate(equipment_data, extracted_data)
            
            # Set fallback information
            result.requested_level = requested_level
            result.fallback_occurred = (calculation_level != requested_level)
            
            return result
            
        except Exception as e:
            logger.error(f"Calculation execution failed: {str(e)}")
            # Try fallback to lower level
            if calculation_level != RBILevel.LEVEL_1:
                fallback_level = self._get_fallback_level(calculation_level)
                logger.info(f"Attempting fallback to {fallback_level.value}")
                return self._execute_calculation(
                    fallback_level, equipment_data, extracted_data, requested_level
                )
            else:
                # Ultimate fallback - create minimal result
                raise ValueError(f"All calculation levels failed: {str(e)}")
    
    def _get_fallback_level(self, current_level: RBILevel) -> RBILevel:
        """Get the next lower calculation level for fallback"""
        
        fallback_map = {
            RBILevel.LEVEL_3: RBILevel.LEVEL_2,
            RBILevel.LEVEL_2: RBILevel.LEVEL_1,
            RBILevel.LEVEL_1: RBILevel.LEVEL_1  # No further fallback
        }
        
        return fallback_map[current_level]
    
    def _apply_fallback_adjustments(
        self,
        calculation_result: RBICalculationResult,
        equipment_data: EquipmentData,
        extracted_data: ExtractedRBIData
    ) -> RBICalculationResult:
        """Apply conservative adjustments when fallback occurred"""
        
        logger.debug(f"Applying fallback adjustments for {equipment_data.equipment_id}")
        
        try:
            # Get fallback adjustments
            adjustments = self.fallback_manager.get_fallback_adjustments(
                equipment_data, extracted_data, calculation_result.requested_level
            )
            
            # Apply adjustment factor to inspection interval
            if "adjustment_factor" in adjustments:
                original_interval = calculation_result.inspection_interval_months
                adjustment_factor = adjustments["adjustment_factor"]
                
                calculation_result.inspection_interval_months = int(
                    original_interval * adjustment_factor
                )
                
                # Update next inspection date
                if calculation_result.next_inspection_date:
                    days_adjustment = int(
                        (original_interval - calculation_result.inspection_interval_months) * 30
                    )
                    calculation_result.next_inspection_date += timedelta(days=days_adjustment)
            
            # Apply confidence reduction
            if "confidence_reduction" in adjustments:
                confidence_reduction = adjustments["confidence_reduction"]
                calculation_result.confidence_score = max(
                    0.1, calculation_result.confidence_score - confidence_reduction
                )
            
            # Store adjustment information
            if not calculation_result.input_parameters:
                calculation_result.input_parameters = {}
            
            calculation_result.input_parameters.update({
                "fallback_adjustments": adjustments,
                "original_interval_months": original_interval if "adjustment_factor" in adjustments else None
            })
            
            return calculation_result
            
        except Exception as e:
            logger.error(f"Failed to apply fallback adjustments: {str(e)}")
            return calculation_result
    
    def _finalize_calculation_result(
        self,
        calculation_result: RBICalculationResult,
        equipment_data: EquipmentData,
        extracted_data: ExtractedRBIData,
        data_quality: Dict[str, Any]
    ) -> RBICalculationResult:
        """Finalize calculation result with additional metadata"""
        
        # Add data quality score
        calculation_result.data_quality_score = data_quality.get("overall_score", 0.5)
        
        # Add calculation timestamp
        calculation_result.calculation_timestamp = datetime.now()
        
        # Add workflow metadata
        if not calculation_result.input_parameters:
            calculation_result.input_parameters = {}
        
        calculation_result.input_parameters.update({
            "workflow_metadata": {
                "engine_version": "1.0.0",
                "calculation_timestamp": calculation_result.calculation_timestamp.isoformat(),
                "data_quality_score": calculation_result.data_quality_score,
                "equipment_age_years": equipment_data.age_years,
                "last_inspection_days_ago": (
                    (datetime.now() - extracted_data.last_inspection_date).days
                    if extracted_data.last_inspection_date else None
                )
            }
        })
        
        return calculation_result
    
    def _create_emergency_fallback_result(
        self, 
        equipment_id: str, 
        error_message: str
    ) -> RBICalculationResult:
        """Create emergency fallback result when all calculations fail"""
        
        logger.warning(f"Creating emergency fallback result for {equipment_id}")
        
        return RBICalculationResult(
            equipment_id=equipment_id,
            calculation_level=RBILevel.LEVEL_1,
            requested_level=RBILevel.LEVEL_3,
            fallback_occurred=True,
            next_inspection_date=datetime.now() + timedelta(days=180),  # 6 months default
            risk_level=RiskLevel.HIGH,  # Conservative assumption
            pof_score=4.0,  # Conservative assumption
            cof_scores={"safety": 4.0, "environmental": 3.0, "economic": 3.0},
            confidence_score=0.1,  # Very low confidence
            data_quality_score=0.1,
            calculation_timestamp=datetime.now(),
            input_parameters={
                "emergency_fallback": True,
                "error_message": error_message,
                "fallback_reason": "All calculation methods failed"
            },
            missing_data=["All required data"],
            estimated_parameters=["All parameters estimated"],
            inspection_interval_months=6  # Conservative 6-month interval
        )
    
    def get_calculation_summary(
        self, 
        equipment_id: str
    ) -> Dict[str, Any]:
        """Get summary of calculation capabilities for equipment"""
        
        try:
            # Gather data
            equipment_data = self._gather_equipment_data(equipment_id)
            extracted_data = self._extract_inspection_data(equipment_id)
            data_quality = self._assess_data_quality(equipment_data, extracted_data)
            
            # Check level capabilities
            level_capabilities = {}
            for level in [RBILevel.LEVEL_1, RBILevel.LEVEL_2, RBILevel.LEVEL_3]:
                try:
                    determination = self.level_manager.determine_calculation_level(
                        equipment_data, extracted_data, level
                    )
                    level_capabilities[level.value] = {
                        "capable": determination["recommended_level"] == level,
                        "missing_requirements": determination.get("missing_requirements", []),
                        "data_quality_score": determination.get("data_quality_score", 0.0)
                    }
                except Exception as e:
                    level_capabilities[level.value] = {
                        "capable": False,
                        "error": str(e)
                    }
            
            return {
                "equipment_id": equipment_id,
                "equipment_type": equipment_data.equipment_type.value,
                "service_type": equipment_data.service_type.value,
                "age_years": equipment_data.age_years,
                "data_quality": data_quality,
                "level_capabilities": level_capabilities,
                "recommended_level": max(
                    [level for level, cap in level_capabilities.items() if cap.get("capable", False)],
                    default="Level_1"
                )
            }
            
        except Exception as e:
            logger.error(f"Failed to generate calculation summary for {equipment_id}: {str(e)}")
            return {
                "equipment_id": equipment_id,
                "error": str(e),
                "recommended_level": "Level_1"
            }
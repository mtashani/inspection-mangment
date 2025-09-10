"""Level 2 RBI calculator - Semi-quantitative calculation using scoring tables"""

from typing import Dict, Optional, List, Any
from datetime import datetime, timedelta
from app.domains.rbi.models.core import (
    RBICalculationResult,
    EquipmentData,
    ExtractedRBIData,
    RiskLevel,
    RBILevel,
    ServiceType
)
from app.domains.rbi.models.config import RBIConfig
from app.domains.rbi.services.scoring_tables_service import ScoringTablesService


class Level2Calculator:
    """Level 2 RBI calculator using scoring tables and weighted factors"""
    
    def __init__(self, config: Optional[RBIConfig] = None):
        """Initialize Level 2 calculator"""
        self.config = config or RBIConfig()
        self.scoring_service = ScoringTablesService(self.config.scoring_tables)
    
    def calculate(
        self,
        equipment_data: EquipmentData,
        extracted_data: ExtractedRBIData,
        last_inspection_date: Optional[datetime] = None
    ) -> RBICalculationResult:
        """Calculate Level 2 RBI result using scoring tables"""
        
        # Calculate PoF score using scoring tables
        pof_score = self._calculate_pof_score(equipment_data, extracted_data)
        
        # Calculate CoF scores for each dimension
        cof_scores = self._calculate_cof_scores(equipment_data, extracted_data)
        
        # Determine overall risk level
        risk_level = self._determine_risk_level(pof_score, cof_scores)
        
        # Calculate inspection interval based on risk level
        inspection_interval = self._calculate_inspection_interval(risk_level)
        
        # Calculate next inspection date
        if last_inspection_date:
            next_inspection_date = last_inspection_date + timedelta(days=inspection_interval * 30)
        else:
            next_inspection_date = datetime.now() + timedelta(days=inspection_interval * 30)
        
        # Calculate confidence and data quality scores
        confidence_score = self._calculate_confidence_score(equipment_data, extracted_data)
        data_quality_score = self._calculate_data_quality_score(extracted_data)
        
        # Prepare input parameters for documentation
        input_parameters = self._prepare_input_parameters(equipment_data, extracted_data)
        
        # Identify missing and estimated data
        missing_data = self._identify_missing_data(extracted_data)
        estimated_parameters = self._identify_estimated_parameters(extracted_data)
        
        return RBICalculationResult(
            equipment_id=equipment_data.equipment_id,
            calculation_level=RBILevel.LEVEL_2,
            requested_level=RBILevel.LEVEL_2,
            fallback_occurred=False,
            next_inspection_date=next_inspection_date,
            risk_level=risk_level,
            pof_score=pof_score,
            cof_scores=cof_scores,
            confidence_score=confidence_score,
            data_quality_score=data_quality_score,
            calculation_timestamp=datetime.now(),
            input_parameters=input_parameters,
            missing_data=missing_data,
            estimated_parameters=estimated_parameters,
            inspection_interval_months=inspection_interval
        )
    
    def _calculate_pof_score(
        self, 
        equipment_data: EquipmentData, 
        extracted_data: ExtractedRBIData
    ) -> float:
        """Calculate PoF score using scoring tables and weighted factors"""
        
        # Prepare parameter values for scoring
        parameter_values = {
            "corrosion_rate": extracted_data.corrosion_rate or 0.1,  # Default if missing
            "equipment_age": equipment_data.age_years,
            "damage_mechanisms": len(extracted_data.damage_mechanisms),
            "coating_quality": extracted_data.coating_condition or "moderate",
            "inspection_coverage": extracted_data.inspection_quality
        }
        
        # Calculate weighted PoF score
        total_score = 0.0
        total_weight = 0.0
        
        weights = self.config.weighting_factors.pof_weights
        
        for param_name, value in parameter_values.items():
            if param_name in weights:
                table = self.scoring_service.get_pof_table(param_name)
                if table:
                    score = self._get_parameter_score(table, param_name, value)
                    weight = weights[param_name]
                    
                    total_score += score * weight
                    total_weight += weight
        
        # Calculate final PoF score
        if total_weight > 0:
            pof_score = total_score / total_weight
        else:
            pof_score = 3.0  # Default medium score
        
        # Ensure score is within bounds
        return max(1.0, min(5.0, pof_score))
    
    def _calculate_cof_scores(
        self, 
        equipment_data: EquipmentData, 
        extracted_data: ExtractedRBIData
    ) -> Dict[str, float]:
        """Calculate CoF scores for each dimension using scoring tables"""
        
        cof_scores = {}
        
        # Safety CoF
        safety_params = {
            "location": equipment_data.location,
            "pressure": equipment_data.design_pressure,
            "fluid": equipment_data.service_type.value
        }
        cof_scores["safety"] = self.scoring_service.calculate_cof_score("safety", safety_params)
        
        # Environmental CoF
        environmental_params = {
            "fluid": equipment_data.service_type.value,
            "containment": self._assess_containment_system(equipment_data)
        }
        cof_scores["environmental"] = self.scoring_service.calculate_cof_score("environmental", environmental_params)
        
        # Economic CoF
        economic_params = {
            "downtime": self._estimate_downtime(equipment_data),
            "production_impact": equipment_data.criticality_level.lower(),
            "repair_cost": self._estimate_repair_cost(equipment_data)
        }
        cof_scores["economic"] = self.scoring_service.calculate_cof_score("economic", economic_params)
        
        # Ensure all scores are within bounds
        for dimension in cof_scores:
            cof_scores[dimension] = max(1.0, min(5.0, cof_scores[dimension]))
        
        return cof_scores
    
    def _get_parameter_score(self, table, param_name: str, value: Any) -> int:
        """Get score for a parameter value from scoring table"""
        
        if param_name == "corrosion_rate":
            return self._get_corrosion_rate_score(value)
        elif param_name == "equipment_age":
            return self._get_age_score(value)
        elif param_name == "damage_mechanisms":
            return self._get_damage_mechanisms_score(value)
        elif param_name in ["coating_quality", "inspection_coverage"]:
            return table.get_score(str(value))
        else:
            return table.get_score(str(value))
    
    def _get_corrosion_rate_score(self, rate: float) -> int:
        """Get score for corrosion rate"""
        if rate <= 0.05:
            return 1
        elif rate <= 0.1:
            return 2
        elif rate <= 0.2:
            return 3
        elif rate <= 0.5:
            return 4
        else:
            return 5
    
    def _get_age_score(self, age: float) -> int:
        """Get score for equipment age"""
        if age < 5:
            return 1
        elif age < 10:
            return 2
        elif age < 15:
            return 3
        elif age < 25:
            return 4
        else:
            return 5
    
    def _get_damage_mechanisms_score(self, count: int) -> int:
        """Get score for number of damage mechanisms"""
        if count == 0:
            return 1
        elif count == 1:
            return 2
        elif count == 2:
            return 3
        elif count == 3:
            return 4
        else:
            return 5
    
    def _assess_containment_system(self, equipment_data: EquipmentData) -> str:
        """Assess containment system quality"""
        # Simple assessment based on equipment type and location
        if equipment_data.location == "safe":
            return "good"
        elif equipment_data.location == "open_area":
            return "moderate"
        else:
            return "poor"
    
    def _estimate_downtime(self, equipment_data: EquipmentData) -> str:
        """Estimate expected downtime for equipment failure"""
        # Based on equipment type and criticality
        if equipment_data.criticality_level == "Critical":
            return ">3d"
        elif equipment_data.criticality_level == "High":
            return "1-3d"
        else:
            return "<1d"
    
    def _estimate_repair_cost(self, equipment_data: EquipmentData) -> str:
        """Estimate repair cost category"""
        # Based on equipment type and size
        from app.domains.rbi.models.core import EquipmentType
        
        expensive_equipment = [
            EquipmentType.COMPRESSOR,
            EquipmentType.HEAT_EXCHANGER
        ]
        
        if equipment_data.equipment_type in expensive_equipment:
            if equipment_data.design_pressure > 50:
                return ">100k"
            else:
                return "10k-100k"
        else:
            if equipment_data.design_pressure > 30:
                return "10k-100k"
            else:
                return "<10k"
    
    def _determine_risk_level(self, pof_score: float, cof_scores: Dict[str, float]) -> RiskLevel:
        """Determine overall risk level using risk matrix"""
        
        # Calculate overall CoF score (weighted average)
        cof_weights = self.config.weighting_factors.cof_weights
        overall_cof = 0.0
        total_weight = 0.0
        
        for dimension, score in cof_scores.items():
            if dimension in cof_weights:
                weight = cof_weights[dimension]
                overall_cof += score * weight
                total_weight += weight
        
        if total_weight > 0:
            overall_cof /= total_weight
        else:
            overall_cof = sum(cof_scores.values()) / len(cof_scores)
        
        # Convert scores to categorical levels
        pof_level = self._score_to_level(pof_score)
        cof_level = self._score_to_level(overall_cof)
        
        # Use risk matrix to determine final risk level
        return self.config.risk_matrix.get_risk_level(pof_level, cof_level)
    
    def _score_to_level(self, score: float) -> str:
        """Convert numerical score to categorical level"""
        if score <= 2.0:
            return "Low"
        elif score <= 3.5:
            return "Medium"
        else:
            return "High"
    
    def _calculate_inspection_interval(self, risk_level: RiskLevel) -> int:
        """Calculate inspection interval based on risk level"""
        return self.config.risk_matrix.inspection_intervals.get(risk_level, 24)
    
    def _calculate_confidence_score(
        self, 
        equipment_data: EquipmentData, 
        extracted_data: ExtractedRBIData
    ) -> float:
        """Calculate confidence score based on data availability and quality"""
        
        confidence_factors = []
        
        # Data completeness factor
        required_data = [
            extracted_data.corrosion_rate,
            extracted_data.coating_condition,
            extracted_data.inspection_quality,
            extracted_data.last_inspection_date
        ]
        
        completeness = sum(1 for item in required_data if item is not None) / len(required_data)
        confidence_factors.append(completeness)
        
        # Inspection recency factor
        if extracted_data.last_inspection_date:
            days_since = (datetime.now() - extracted_data.last_inspection_date).days
            if days_since <= 365:
                recency_factor = 1.0
            elif days_since <= 730:
                recency_factor = 0.8
            elif days_since <= 1095:
                recency_factor = 0.6
            else:
                recency_factor = 0.4
            confidence_factors.append(recency_factor)
        else:
            confidence_factors.append(0.3)
        
        # Thickness data quality factor
        if extracted_data.thickness_measurements:
            thickness_factor = min(1.0, len(extracted_data.thickness_measurements) / 3)
            confidence_factors.append(thickness_factor)
        else:
            confidence_factors.append(0.2)
        
        # Calculate overall confidence
        confidence = sum(confidence_factors) / len(confidence_factors)
        
        # Level 2 has higher confidence than Level 1 but lower than Level 3
        return min(0.85, max(0.6, confidence))
    
    def _calculate_data_quality_score(self, extracted_data: ExtractedRBIData) -> float:
        """Calculate data quality score"""
        
        quality_factors = []
        
        # Corrosion rate quality
        if extracted_data.corrosion_rate is not None:
            if 0.001 <= extracted_data.corrosion_rate <= 2.0:  # Reasonable range
                quality_factors.append(1.0)
            else:
                quality_factors.append(0.5)  # Questionable value
        else:
            quality_factors.append(0.0)
        
        # Inspection findings quality
        if extracted_data.inspection_findings:
            quality_factors.append(0.8)
        else:
            quality_factors.append(0.3)
        
        # Damage mechanisms quality
        if extracted_data.damage_mechanisms:
            quality_factors.append(0.9)
        else:
            quality_factors.append(0.4)
        
        # Thickness measurements quality
        if extracted_data.thickness_measurements:
            if len(extracted_data.thickness_measurements) >= 3:
                quality_factors.append(1.0)
            else:
                quality_factors.append(0.6)
        else:
            quality_factors.append(0.2)
        
        return sum(quality_factors) / len(quality_factors)
    
    def _prepare_input_parameters(
        self, 
        equipment_data: EquipmentData, 
        extracted_data: ExtractedRBIData
    ) -> Dict[str, Any]:
        """Prepare input parameters for documentation"""
        
        return {
            "calculation_method": "Level 2 - Semi-Quantitative",
            "equipment_type": equipment_data.equipment_type.value,
            "service_type": equipment_data.service_type.value,
            "equipment_age": equipment_data.age_years,
            "design_pressure": equipment_data.design_pressure,
            "criticality_level": equipment_data.criticality_level,
            "corrosion_rate": extracted_data.corrosion_rate,
            "coating_condition": extracted_data.coating_condition,
            "damage_mechanisms_count": len(extracted_data.damage_mechanisms),
            "inspection_quality": extracted_data.inspection_quality,
            "thickness_measurements_count": len(extracted_data.thickness_measurements),
            "last_inspection_date": extracted_data.last_inspection_date.isoformat() if extracted_data.last_inspection_date else None
        }
    
    def _identify_missing_data(self, extracted_data: ExtractedRBIData) -> List[str]:
        """Identify missing data that could improve calculation accuracy"""
        
        missing = []
        
        if extracted_data.corrosion_rate is None:
            missing.append("corrosion_rate")
        
        if not extracted_data.coating_condition:
            missing.append("coating_condition")
        
        if not extracted_data.thickness_measurements:
            missing.append("thickness_measurements")
        
        if not extracted_data.damage_mechanisms:
            missing.append("damage_mechanisms")
        
        if not extracted_data.inspection_findings:
            missing.append("inspection_findings")
        
        if not extracted_data.last_inspection_date:
            missing.append("last_inspection_date")
        
        return missing
    
    def _identify_estimated_parameters(self, extracted_data: ExtractedRBIData) -> List[str]:
        """Identify parameters that were estimated rather than measured"""
        
        estimated = []
        
        # In a real implementation, this would track which parameters were estimated
        # For now, we'll make some assumptions based on data quality
        
        if extracted_data.corrosion_rate and len(extracted_data.thickness_measurements) < 2:
            estimated.append("corrosion_rate")
        
        if not extracted_data.coating_condition:
            estimated.append("coating_condition")
        
        return estimated
    
    def get_calculation_summary(self) -> Dict[str, Any]:
        """Get summary of Level 2 calculation methodology"""
        
        return {
            "level": "Level 2 - Semi-Quantitative",
            "description": "RBI calculation using scoring tables and weighted factors",
            "data_requirements": [
                "Equipment master data",
                "Corrosion rate or thickness measurements",
                "Coating condition assessment",
                "Inspection findings and quality",
                "Damage mechanism identification",
                "Recent inspection date"
            ],
            "methodology": {
                "pof_calculation": "Weighted scoring based on corrosion rate, age, damage mechanisms, coating, and inspection quality",
                "cof_calculation": "Separate scoring for safety, environmental, and economic consequences",
                "risk_determination": "Risk matrix combining PoF and weighted CoF scores",
                "interval_calculation": "Based on risk level from configuration"
            },
            "confidence_level": "Medium to High (0.6-0.85)",
            "typical_use_cases": [
                "Equipment with moderate inspection history",
                "Standard RBI assessments",
                "Equipment with known corrosion rates",
                "Routine risk-based planning"
            ],
            "advantages": [
                "More accurate than Level 1",
                "Uses actual inspection data",
                "Considers multiple risk factors",
                "Configurable scoring tables"
            ],
            "limitations": [
                "Requires quality inspection data",
                "Semi-quantitative approach",
                "Limited by scoring table accuracy"
            ]
        }
    
    def validate_input_data(
        self, 
        equipment_data: EquipmentData, 
        extracted_data: ExtractedRBIData
    ) -> Dict[str, List[str]]:
        """Validate input data for Level 2 calculation"""
        
        validation_results = {
            "missing_required": [],
            "missing_recommended": [],
            "data_quality_issues": [],
            "warnings": []
        }
        
        # Check required equipment data
        if not equipment_data.equipment_id:
            validation_results["missing_required"].append("equipment_id")
        
        if not equipment_data.equipment_type:
            validation_results["missing_required"].append("equipment_type")
        
        if not equipment_data.service_type:
            validation_results["missing_required"].append("service_type")
        
        # Check recommended data for better accuracy
        if extracted_data.corrosion_rate is None:
            validation_results["missing_recommended"].append("corrosion_rate")
        
        if not extracted_data.coating_condition:
            validation_results["missing_recommended"].append("coating_condition")
        
        if not extracted_data.thickness_measurements:
            validation_results["missing_recommended"].append("thickness_measurements")
        
        if not extracted_data.damage_mechanisms:
            validation_results["missing_recommended"].append("damage_mechanisms")
        
        # Check data quality
        if extracted_data.corrosion_rate is not None:
            if extracted_data.corrosion_rate < 0 or extracted_data.corrosion_rate > 5:
                validation_results["data_quality_issues"].append("Corrosion rate outside reasonable range")
        
        if extracted_data.last_inspection_date:
            days_since = (datetime.now() - extracted_data.last_inspection_date).days
            if days_since > 1095:  # 3 years
                validation_results["warnings"].append("Last inspection data is very old (>3 years)")
            elif days_since > 730:  # 2 years
                validation_results["warnings"].append("Last inspection data is old (>2 years)")
        
        if len(extracted_data.thickness_measurements) == 1:
            validation_results["warnings"].append("Only one thickness measurement available - trend analysis limited")
        
        return validation_results
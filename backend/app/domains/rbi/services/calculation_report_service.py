"""Calculation Report Service - Detailed reporting for RBI calculations"""

from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from dataclasses import dataclass, field
import json

from app.domains.rbi.models.core import (
    RBICalculationResult,
    EquipmentData,
    ExtractedRBIData,
    RBILevel,
    RiskLevel
)
from app.domains.rbi.models.config import RBIConfig


@dataclass
class CalculationReportSection:
    """Individual section of calculation report"""
    title: str
    content: Dict[str, Any]
    subsections: List['CalculationReportSection'] = field(default_factory=list)
    importance: str = "normal"  # "critical", "high", "normal", "low"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert section to dictionary"""
        return {
            "title": self.title,
            "content": self.content,
            "subsections": [sub.to_dict() for sub in self.subsections],
            "importance": self.importance
        }


@dataclass
class DetailedCalculationReport:
    """Comprehensive calculation report"""
    report_id: str
    equipment_id: str
    generation_timestamp: datetime
    report_type: str
    calculation_result: RBICalculationResult
    sections: List[CalculationReportSection] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert report to dictionary"""
        return {
            "report_id": self.report_id,
            "equipment_id": self.equipment_id,
            "generation_timestamp": self.generation_timestamp.isoformat(),
            "report_type": self.report_type,
            "calculation_summary": {
                "calculation_level": self.calculation_result.calculation_level.value,
                "requested_level": self.calculation_result.requested_level.value if self.calculation_result.requested_level else None,
                "risk_level": self.calculation_result.risk_level.value,
                "inspection_interval_months": self.calculation_result.inspection_interval_months,
                "next_inspection_date": self.calculation_result.next_inspection_date.isoformat() if self.calculation_result.next_inspection_date else None,
                "confidence_score": self.calculation_result.confidence_score,
                "fallback_occurred": self.calculation_result.fallback_occurred
            },
            "sections": [section.to_dict() for section in self.sections],
            "metadata": self.metadata
        }
    
    def to_json(self, indent: int = 2) -> str:
        """Convert report to JSON string"""
        return json.dumps(self.to_dict(), indent=indent, ensure_ascii=False)


class CalculationReportService:
    """Service for generating detailed calculation reports"""
    
    def __init__(self, config: Optional[RBIConfig] = None):
        """Initialize report service"""
        self.config = config or RBIConfig()
    
    def generate_detailed_report(
        self,
        calculation_result: RBICalculationResult,
        equipment_data: Optional[EquipmentData] = None,
        extracted_data: Optional[ExtractedRBIData] = None,
        include_intermediate_calculations: bool = True,
        include_data_quality_analysis: bool = True,
        include_recommendations: bool = True
    ) -> DetailedCalculationReport:
        """
        Generate comprehensive calculation report
        
        Args:
            calculation_result: RBI calculation result
            equipment_data: Equipment master data
            extracted_data: Extracted inspection data
            include_intermediate_calculations: Include step-by-step calculations
            include_data_quality_analysis: Include data quality assessment
            include_recommendations: Include improvement recommendations
            
        Returns:
            DetailedCalculationReport with all sections
        """
        
        report_id = f"RBI_{calculation_result.equipment_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        report = DetailedCalculationReport(
            report_id=report_id,
            equipment_id=calculation_result.equipment_id,
            generation_timestamp=datetime.now(),
            report_type="Detailed RBI Calculation Report",
            calculation_result=calculation_result
        )
        
        # Add report sections
        report.sections.extend([
            self._create_executive_summary_section(calculation_result, equipment_data),
            self._create_input_parameters_section(calculation_result, equipment_data, extracted_data),
            self._create_calculation_methodology_section(calculation_result),
        ])
        
        if include_intermediate_calculations:
            report.sections.append(
                self._create_intermediate_calculations_section(calculation_result)
            )
        
        report.sections.extend([
            self._create_results_analysis_section(calculation_result),
            self._create_confidence_assessment_section(calculation_result),
        ])
        
        if include_data_quality_analysis and extracted_data:
            report.sections.append(
                self._create_data_quality_section(calculation_result, extracted_data)
            )
        
        if calculation_result.fallback_occurred:
            report.sections.append(
                self._create_fallback_analysis_section(calculation_result)
            )
        
        if include_recommendations:
            report.sections.append(
                self._create_recommendations_section(calculation_result, equipment_data)
            )
        
        # Add metadata
        report.metadata = self._generate_report_metadata(calculation_result, equipment_data, extracted_data)
        
        return report
    
    def _create_executive_summary_section(
        self, 
        calculation_result: RBICalculationResult,
        equipment_data: Optional[EquipmentData]
    ) -> CalculationReportSection:
        """Create executive summary section"""
        
        # Determine risk assessment
        risk_assessment = self._assess_risk_level_description(calculation_result.risk_level)
        
        # Calculate key metrics
        confidence_level = self._categorize_confidence(calculation_result.confidence_score)
        
        content = {
            "equipment_overview": {
                "equipment_id": calculation_result.equipment_id,
                "equipment_type": equipment_data.equipment_type.value if equipment_data else "Unknown",
                "service_type": equipment_data.service_type.value if equipment_data else "Unknown",
                "age_years": equipment_data.age_years if equipment_data else "Unknown",
                "criticality": equipment_data.criticality_level if equipment_data else "Unknown"
            },
            "calculation_summary": {
                "calculation_level_achieved": calculation_result.calculation_level.value,
                "calculation_level_requested": calculation_result.requested_level.value if calculation_result.requested_level else "Auto",
                "fallback_occurred": calculation_result.fallback_occurred,
                "calculation_timestamp": calculation_result.calculation_timestamp.isoformat() if calculation_result.calculation_timestamp else None
            },
            "risk_assessment": {
                "overall_risk_level": calculation_result.risk_level.value,
                "risk_description": risk_assessment,
                "pof_score": calculation_result.pof_score,
                "cof_scores": calculation_result.cof_scores
            },
            "inspection_recommendation": {
                "next_inspection_date": calculation_result.next_inspection_date.isoformat() if calculation_result.next_inspection_date else None,
                "inspection_interval_months": calculation_result.inspection_interval_months,
                "days_until_inspection": (calculation_result.next_inspection_date - datetime.now()).days if calculation_result.next_inspection_date else None
            },
            "confidence_assessment": {
                "confidence_score": calculation_result.confidence_score,
                "confidence_level": confidence_level,
                "data_quality_score": calculation_result.data_quality_score
            }
        }
        
        return CalculationReportSection(
            title="Executive Summary",
            content=content,
            importance="critical"
        )
    
    def _create_input_parameters_section(
        self,
        calculation_result: RBICalculationResult,
        equipment_data: Optional[EquipmentData],
        extracted_data: Optional[ExtractedRBIData]
    ) -> CalculationReportSection:
        """Create input parameters section"""
        
        # Equipment parameters
        equipment_params = {}
        if equipment_data:
            equipment_params = {
                "basic_information": {
                    "equipment_id": equipment_data.equipment_id,
                    "equipment_type": equipment_data.equipment_type.value,
                    "service_type": equipment_data.service_type.value,
                    "installation_date": equipment_data.installation_date.isoformat(),
                    "age_years": equipment_data.age_years
                },
                "design_parameters": {
                    "design_pressure": equipment_data.design_pressure,
                    "design_temperature": equipment_data.design_temperature,
                    "material": equipment_data.material,
                    "criticality_level": equipment_data.criticality_level
                },
                "operational_parameters": {
                    "coating_type": equipment_data.coating_type,
                    "location": equipment_data.location,
                    "inventory_size": equipment_data.inventory_size
                }
            }
        
        # Inspection parameters
        inspection_params = {}
        if extracted_data:
            inspection_params = {
                "thickness_measurements": [
                    {
                        "location": tm.location,
                        "thickness": tm.thickness,
                        "minimum_required": tm.minimum_required,
                        "measurement_date": tm.measurement_date.isoformat(),
                        "measurement_method": tm.measurement_method,
                        "inspector": tm.inspector
                    }
                    for tm in extracted_data.thickness_measurements
                ],
                "degradation_assessment": {
                    "corrosion_rate": extracted_data.corrosion_rate,
                    "coating_condition": extracted_data.coating_condition,
                    "damage_mechanisms": extracted_data.damage_mechanisms
                },
                "inspection_history": {
                    "last_inspection_date": extracted_data.last_inspection_date.isoformat() if extracted_data.last_inspection_date else None,
                    "inspection_quality": extracted_data.inspection_quality,
                    "inspection_findings_count": len(extracted_data.inspection_findings)
                }
            }
        
        # Calculation parameters
        calc_params = {
            "input_parameters": calculation_result.input_parameters or {},
            "missing_data": calculation_result.missing_data or [],
            "estimated_parameters": calculation_result.estimated_parameters or []
        }
        
        content = {
            "equipment_parameters": equipment_params,
            "inspection_parameters": inspection_params,
            "calculation_parameters": calc_params,
            "data_completeness": {
                "equipment_data_available": equipment_data is not None,
                "inspection_data_available": extracted_data is not None,
                "missing_data_count": len(calculation_result.missing_data or []),
                "estimated_parameters_count": len(calculation_result.estimated_parameters or [])
            }
        }
        
        return CalculationReportSection(
            title="Input Parameters",
            content=content,
            importance="high"
        )
    
    def _create_calculation_methodology_section(
        self, 
        calculation_result: RBICalculationResult
    ) -> CalculationReportSection:
        """Create calculation methodology section"""
        
        methodology_description = self._get_methodology_description(calculation_result.calculation_level)
        
        content = {
            "calculation_level": {
                "level": calculation_result.calculation_level.value,
                "description": methodology_description["description"],
                "approach": methodology_description["approach"],
                "data_requirements": methodology_description["data_requirements"]
            },
            "calculation_standards": {
                "standard": "API 580/581 Risk-Based Inspection",
                "methodology": methodology_description["methodology"],
                "confidence_factors": methodology_description["confidence_factors"]
            },
            "risk_matrix": {
                "pof_calculation": methodology_description["pof_calculation"],
                "cof_calculation": methodology_description["cof_calculation"],
                "risk_determination": methodology_description["risk_determination"]
            }
        }
        
        if calculation_result.fallback_occurred:
            content["fallback_information"] = {
                "fallback_occurred": True,
                "original_level": calculation_result.requested_level.value if calculation_result.requested_level else "Unknown",
                "actual_level": calculation_result.calculation_level.value,
                "fallback_reason": "Insufficient data for higher level calculation"
            }
        
        return CalculationReportSection(
            title="Calculation Methodology",
            content=content,
            importance="high"
        )
    
    def _create_intermediate_calculations_section(
        self, 
        calculation_result: RBICalculationResult
    ) -> CalculationReportSection:
        """Create intermediate calculations section"""
        
        # Extract intermediate calculations from input parameters
        input_params = calculation_result.input_parameters or {}
        
        # PoF calculations
        pof_calculations = {
            "final_pof_score": calculation_result.pof_score,
            "pof_components": self._extract_pof_components(input_params),
            "pof_methodology": self._get_pof_calculation_steps(calculation_result.calculation_level)
        }
        
        # CoF calculations
        cof_calculations = {
            "cof_scores": calculation_result.cof_scores,
            "cof_components": self._extract_cof_components(input_params),
            "cof_methodology": self._get_cof_calculation_steps(calculation_result.calculation_level)
        }
        
        # Risk determination
        risk_calculations = {
            "risk_matrix_application": {
                "pof_score": calculation_result.pof_score,
                "overall_cof": self._calculate_overall_cof(calculation_result.cof_scores),
                "risk_level": calculation_result.risk_level.value
            },
            "interval_determination": {
                "base_interval": self._get_base_interval(calculation_result.risk_level),
                "adjustment_factors": self._extract_adjustment_factors(input_params),
                "final_interval": calculation_result.inspection_interval_months
            }
        }
        
        content = {
            "pof_calculations": pof_calculations,
            "cof_calculations": cof_calculations,
            "risk_calculations": risk_calculations,
            "calculation_workflow": self._generate_calculation_workflow(calculation_result)
        }
        
        return CalculationReportSection(
            title="Intermediate Calculations",
            content=content,
            importance="normal"
        )
    
    def _create_results_analysis_section(
        self, 
        calculation_result: RBICalculationResult
    ) -> CalculationReportSection:
        """Create results analysis section"""
        
        # Risk level analysis
        risk_analysis = {
            "current_risk_level": calculation_result.risk_level.value,
            "risk_level_description": self._assess_risk_level_description(calculation_result.risk_level),
            "risk_factors": self._identify_key_risk_factors(calculation_result),
            "risk_trends": self._analyze_risk_trends(calculation_result)
        }
        
        # Inspection interval analysis
        interval_analysis = {
            "recommended_interval": calculation_result.inspection_interval_months,
            "next_inspection_date": calculation_result.next_inspection_date.isoformat() if calculation_result.next_inspection_date else None,
            "interval_justification": self._justify_inspection_interval(calculation_result),
            "interval_comparison": self._compare_with_standard_intervals(calculation_result)
        }
        
        # Performance indicators
        performance_indicators = {
            "calculation_confidence": calculation_result.confidence_score,
            "data_quality": calculation_result.data_quality_score,
            "calculation_reliability": self._assess_calculation_reliability(calculation_result),
            "result_stability": self._assess_result_stability(calculation_result)
        }
        
        content = {
            "risk_analysis": risk_analysis,
            "interval_analysis": interval_analysis,
            "performance_indicators": performance_indicators,
            "key_findings": self._generate_key_findings(calculation_result)
        }
        
        return CalculationReportSection(
            title="Results Analysis",
            content=content,
            importance="critical"
        )
    
    def _create_confidence_assessment_section(
        self, 
        calculation_result: RBICalculationResult
    ) -> CalculationReportSection:
        """Create confidence assessment section"""
        
        confidence_breakdown = {
            "overall_confidence": calculation_result.confidence_score,
            "confidence_level": self._categorize_confidence(calculation_result.confidence_score),
            "confidence_factors": self._analyze_confidence_factors(calculation_result),
            "uncertainty_sources": self._identify_uncertainty_sources(calculation_result)
        }
        
        data_quality_assessment = {
            "overall_data_quality": calculation_result.data_quality_score,
            "data_completeness": self._assess_data_completeness(calculation_result),
            "data_accuracy": self._assess_data_accuracy(calculation_result),
            "data_timeliness": self._assess_data_timeliness(calculation_result)
        }
        
        reliability_assessment = {
            "calculation_reliability": self._assess_calculation_reliability(calculation_result),
            "result_sensitivity": self._assess_result_sensitivity(calculation_result),
            "validation_status": self._assess_validation_status(calculation_result)
        }
        
        content = {
            "confidence_breakdown": confidence_breakdown,
            "data_quality_assessment": data_quality_assessment,
            "reliability_assessment": reliability_assessment,
            "improvement_potential": self._assess_improvement_potential(calculation_result)
        }
        
        return CalculationReportSection(
            title="Confidence Assessment",
            content=content,
            importance="high"
        )
    
    def _create_data_quality_section(
        self, 
        calculation_result: RBICalculationResult,
        extracted_data: ExtractedRBIData
    ) -> CalculationReportSection:
        """Create data quality section"""
        
        # Thickness data quality
        thickness_quality = {
            "measurement_count": len(extracted_data.thickness_measurements),
            "measurement_coverage": self._assess_thickness_coverage(extracted_data.thickness_measurements),
            "measurement_consistency": self._assess_thickness_consistency(extracted_data.thickness_measurements),
            "measurement_recency": self._assess_measurement_recency(extracted_data.thickness_measurements)
        }
        
        # Inspection data quality
        inspection_quality = {
            "inspection_quality_rating": extracted_data.inspection_quality,
            "last_inspection_age": self._calculate_inspection_age(extracted_data.last_inspection_date),
            "findings_completeness": self._assess_findings_completeness(extracted_data.inspection_findings),
            "damage_mechanism_identification": self._assess_damage_mechanism_quality(extracted_data.damage_mechanisms)
        }
        
        # Overall data assessment
        overall_assessment = {
            "data_sufficiency": self._assess_data_sufficiency(calculation_result, extracted_data),
            "data_reliability": self._assess_data_reliability(extracted_data),
            "data_gaps": calculation_result.missing_data or [],
            "estimated_parameters": calculation_result.estimated_parameters or []
        }
        
        content = {
            "thickness_data_quality": thickness_quality,
            "inspection_data_quality": inspection_quality,
            "overall_assessment": overall_assessment,
            "quality_score": calculation_result.data_quality_score,
            "improvement_recommendations": self._generate_data_quality_recommendations(extracted_data)
        }
        
        return CalculationReportSection(
            title="Data Quality Analysis",
            content=content,
            importance="high"
        )
    
    def _create_fallback_analysis_section(
        self, 
        calculation_result: RBICalculationResult
    ) -> CalculationReportSection:
        """Create fallback analysis section"""
        
        fallback_details = {
            "fallback_occurred": calculation_result.fallback_occurred,
            "requested_level": calculation_result.requested_level.value if calculation_result.requested_level else "Unknown",
            "achieved_level": calculation_result.calculation_level.value,
            "fallback_reasons": calculation_result.missing_data or []
        }
        
        # Extract fallback adjustments from input parameters
        input_params = calculation_result.input_parameters or {}
        fallback_adjustments = input_params.get("fallback_adjustments", {})
        
        impact_analysis = {
            "confidence_impact": {
                "confidence_reduction": fallback_adjustments.get("confidence_reduction", 0),
                "final_confidence": calculation_result.confidence_score
            },
            "interval_impact": {
                "adjustment_factor": fallback_adjustments.get("adjustment_factor", 1.0),
                "conservatism_applied": fallback_adjustments.get("adjustment_factor", 1.0) < 1.0
            },
            "calculation_impact": {
                "methodology_change": f"Fallback from {calculation_result.requested_level.value if calculation_result.requested_level else 'Unknown'} to {calculation_result.calculation_level.value}",
                "accuracy_impact": self._assess_fallback_accuracy_impact(calculation_result)
            }
        }
        
        content = {
            "fallback_details": fallback_details,
            "impact_analysis": impact_analysis,
            "mitigation_measures": self._identify_fallback_mitigation_measures(calculation_result),
            "data_improvement_path": self._suggest_data_improvement_path(calculation_result)
        }
        
        return CalculationReportSection(
            title="Fallback Analysis",
            content=content,
            importance="high"
        )
    
    def _create_recommendations_section(
        self, 
        calculation_result: RBICalculationResult,
        equipment_data: Optional[EquipmentData]
    ) -> CalculationReportSection:
        """Create recommendations section"""
        
        # Inspection recommendations
        inspection_recommendations = {
            "next_inspection": {
                "recommended_date": calculation_result.next_inspection_date.isoformat() if calculation_result.next_inspection_date else None,
                "inspection_scope": self._recommend_inspection_scope(calculation_result),
                "inspection_methods": self._recommend_inspection_methods(calculation_result, equipment_data)
            },
            "monitoring_recommendations": self._generate_monitoring_recommendations(calculation_result),
            "maintenance_considerations": self._generate_maintenance_recommendations(calculation_result, equipment_data)
        }
        
        # Data improvement recommendations
        data_recommendations = {
            "immediate_actions": self._identify_immediate_data_actions(calculation_result),
            "long_term_improvements": self._identify_long_term_data_improvements(calculation_result),
            "cost_benefit_considerations": self._assess_data_improvement_costs(calculation_result)
        }
        
        # Risk management recommendations
        risk_recommendations = {
            "risk_mitigation": self._generate_risk_mitigation_recommendations(calculation_result),
            "contingency_planning": self._generate_contingency_recommendations(calculation_result),
            "performance_monitoring": self._generate_performance_monitoring_recommendations(calculation_result)
        }
        
        content = {
            "inspection_recommendations": inspection_recommendations,
            "data_improvement_recommendations": data_recommendations,
            "risk_management_recommendations": risk_recommendations,
            "priority_actions": self._prioritize_recommendations(calculation_result)
        }
        
        return CalculationReportSection(
            title="Recommendations",
            content=content,
            importance="critical"
        )
    
    def _generate_report_metadata(
        self,
        calculation_result: RBICalculationResult,
        equipment_data: Optional[EquipmentData],
        extracted_data: Optional[ExtractedRBIData]
    ) -> Dict[str, Any]:
        """Generate report metadata"""
        
        return {
            "report_version": "1.0",
            "calculation_engine_version": "1.0.0",
            "generation_timestamp": datetime.now().isoformat(),
            "data_sources": {
                "equipment_data_available": equipment_data is not None,
                "inspection_data_available": extracted_data is not None,
                "calculation_timestamp": calculation_result.calculation_timestamp.isoformat() if calculation_result.calculation_timestamp else None
            },
            "report_statistics": {
                "total_sections": 0,  # Will be updated after sections are added
                "critical_sections": 0,
                "high_importance_sections": 0,
                "data_quality_score": calculation_result.data_quality_score,
                "confidence_score": calculation_result.confidence_score
            },
            "compliance": {
                "standards": ["API 580", "API 581"],
                "methodology": "Risk-Based Inspection",
                "calculation_level": calculation_result.calculation_level.value
            }
        } 
   
    # Helper methods for report generation
    
    def _assess_risk_level_description(self, risk_level: RiskLevel) -> str:
        """Get detailed description of risk level"""
        descriptions = {
            RiskLevel.LOW: "Low Risk - Equipment requires standard monitoring and maintenance",
            RiskLevel.MEDIUM: "Medium Risk - Equipment requires increased attention and monitoring",
            RiskLevel.HIGH: "High Risk - Equipment requires priority attention and frequent inspection",
            RiskLevel.VERY_HIGH: "Very High Risk - Equipment requires immediate attention and enhanced monitoring"
        }
        return descriptions.get(risk_level, "Unknown risk level")
    
    def _categorize_confidence(self, confidence_score: float) -> str:
        """Categorize confidence score"""
        if confidence_score >= 0.9:
            return "Very High"
        elif confidence_score >= 0.8:
            return "High"
        elif confidence_score >= 0.6:
            return "Medium"
        elif confidence_score >= 0.4:
            return "Low"
        else:
            return "Very Low"
    
    def _get_methodology_description(self, calculation_level: RBILevel) -> Dict[str, Any]:
        """Get methodology description for calculation level"""
        methodologies = {
            RBILevel.LEVEL_1: {
                "description": "Static calculation using fixed intervals from equipment master data",
                "approach": "Conservative approach with minimal data requirements",
                "data_requirements": ["Equipment type", "Service class", "Installation date"],
                "methodology": "Fixed interval assignment based on equipment classification",
                "confidence_factors": ["Equipment type reliability", "Service experience"],
                "pof_calculation": "Generic failure rates based on equipment type and age",
                "cof_calculation": "Standard consequence categories based on equipment classification",
                "risk_determination": "Simple risk matrix application"
            },
            RBILevel.LEVEL_2: {
                "description": "Semi-quantitative calculation using scoring tables and weighted factors",
                "approach": "Balanced approach using available inspection data and scoring tables",
                "data_requirements": ["Thickness measurements", "Corrosion assessment", "Damage mechanisms"],
                "methodology": "Scoring table-based calculation with weighted factor combinations",
                "confidence_factors": ["Data completeness", "Inspection quality", "Parameter accuracy"],
                "pof_calculation": "Scoring tables for corrosion rate, age, damage mechanisms, coating condition",
                "cof_calculation": "Multi-dimensional scoring for Safety, Environmental, and Economic consequences",
                "risk_determination": "Risk matrix integration with inspection interval assignment"
            },
            RBILevel.LEVEL_3: {
                "description": "Fully quantitative calculation using advanced mathematical models",
                "approach": "Sophisticated modeling using comprehensive inspection data and trend analysis",
                "data_requirements": ["Historical thickness data", "Corrosion rates", "Operating conditions"],
                "methodology": "Advanced degradation modeling using Weibull distribution and trend analysis",
                "confidence_factors": ["Data quality", "Model accuracy", "Historical validation"],
                "pof_calculation": "Advanced PoF models using historical trend analysis and degradation modeling",
                "cof_calculation": "Detailed consequence modeling including inventory effects and dispersion analysis",
                "risk_determination": "Quantitative risk calculation with optimal inspection interval determination"
            }
        }
        return methodologies.get(calculation_level, methodologies[RBILevel.LEVEL_1])
    
    def _extract_pof_components(self, input_params: Dict[str, Any]) -> Dict[str, Any]:
        """Extract PoF calculation components"""
        return {
            "base_failure_rate": input_params.get("base_failure_rate", "Not available"),
            "age_factor": input_params.get("age_factor", "Not available"),
            "corrosion_factor": input_params.get("corrosion_factor", "Not available"),
            "damage_mechanism_factor": input_params.get("damage_mechanism_factor", "Not available"),
            "inspection_effectiveness": input_params.get("inspection_effectiveness", "Not available")
        }
    
    def _extract_cof_components(self, input_params: Dict[str, Any]) -> Dict[str, Any]:
        """Extract CoF calculation components"""
        return {
            "safety_consequences": input_params.get("safety_consequences", "Not available"),
            "environmental_consequences": input_params.get("environmental_consequences", "Not available"),
            "economic_consequences": input_params.get("economic_consequences", "Not available"),
            "business_consequences": input_params.get("business_consequences", "Not available")
        }
    
    def _get_pof_calculation_steps(self, calculation_level: RBILevel) -> List[str]:
        """Get PoF calculation steps for the level"""
        steps = {
            RBILevel.LEVEL_1: [
                "1. Determine base failure rate from equipment type",
                "2. Apply age factor based on installation date",
                "3. Apply service factor based on operating conditions",
                "4. Calculate final PoF score"
            ],
            RBILevel.LEVEL_2: [
                "1. Assess corrosion rate from thickness measurements",
                "2. Evaluate damage mechanisms and their severity",
                "3. Assess coating condition and effectiveness",
                "4. Apply inspection coverage factor",
                "5. Combine factors using weighted scoring",
                "6. Calculate final PoF score"
            ],
            RBILevel.LEVEL_3: [
                "1. Analyze historical thickness trend data",
                "2. Calculate degradation rate using statistical methods",
                "3. Apply Weibull distribution for failure modeling",
                "4. Assess remaining life based on current condition",
                "5. Apply inspection effectiveness factors",
                "6. Calculate probability of failure over time"
            ]
        }
        return steps.get(calculation_level, steps[RBILevel.LEVEL_1])
    
    def _get_cof_calculation_steps(self, calculation_level: RBILevel) -> List[str]:
        """Get CoF calculation steps for the level"""
        steps = {
            RBILevel.LEVEL_1: [
                "1. Classify equipment by type and service",
                "2. Assign standard consequence categories",
                "3. Apply inventory size factors",
                "4. Calculate overall CoF score"
            ],
            RBILevel.LEVEL_2: [
                "1. Assess safety consequences using pressure and inventory",
                "2. Evaluate environmental impact based on fluid type",
                "3. Calculate economic consequences from production loss",
                "4. Assess business impact from reputation and compliance",
                "5. Combine multi-dimensional consequences"
            ],
            RBILevel.LEVEL_3: [
                "1. Model detailed consequence scenarios",
                "2. Calculate dispersion and impact zones",
                "3. Assess economic impact including repair costs",
                "4. Evaluate business continuity impacts",
                "5. Integrate all consequence dimensions"
            ]
        }
        return steps.get(calculation_level, steps[RBILevel.LEVEL_1])
    
    def _calculate_overall_cof(self, cof_scores: Dict[str, float]) -> float:
        """Calculate overall CoF from individual scores"""
        if not cof_scores:
            return 0.0
        return max(cof_scores.values())  # Use maximum consequence
    
    def _get_base_interval(self, risk_level: RiskLevel) -> int:
        """Get base inspection interval for risk level"""
        intervals = {
            RiskLevel.VERY_HIGH: 6,
            RiskLevel.HIGH: 12,
            RiskLevel.MEDIUM: 24,
            RiskLevel.LOW: 48
        }
        return intervals.get(risk_level, 24)
    
    def _extract_adjustment_factors(self, input_params: Dict[str, Any]) -> Dict[str, Any]:
        """Extract adjustment factors from input parameters"""
        return {
            "fallback_adjustment": input_params.get("fallback_adjustments", {}).get("adjustment_factor", 1.0),
            "confidence_adjustment": input_params.get("confidence_adjustment", 1.0),
            "data_quality_adjustment": input_params.get("data_quality_adjustment", 1.0)
        }
    
    def _generate_calculation_workflow(self, calculation_result: RBICalculationResult) -> List[str]:
        """Generate calculation workflow steps"""
        workflow = [
            "1. Data Collection and Validation",
            "2. Equipment Parameter Assessment",
            "3. Inspection Data Analysis",
            f"4. {calculation_result.calculation_level.value} Calculation Execution",
            "5. Risk Level Determination",
            "6. Inspection Interval Calculation",
            "7. Confidence Assessment",
            "8. Result Validation and Reporting"
        ]
        
        if calculation_result.fallback_occurred:
            workflow.insert(-2, "7a. Fallback Adjustment Application")
        
        return workflow
    
    def _identify_key_risk_factors(self, calculation_result: RBICalculationResult) -> List[str]:
        """Identify key risk factors"""
        factors = []
        
        if calculation_result.pof_score > 3.0:
            factors.append("High probability of failure")
        
        cof_scores = calculation_result.cof_scores or {}
        if any(score > 3.0 for score in cof_scores.values()):
            factors.append("High consequence of failure")
        
        if calculation_result.confidence_score < 0.6:
            factors.append("Low calculation confidence")
        
        if calculation_result.fallback_occurred:
            factors.append("Data limitations requiring fallback")
        
        if calculation_result.missing_data:
            factors.append("Missing critical data elements")
        
        return factors or ["No significant risk factors identified"]
    
    def _analyze_risk_trends(self, calculation_result: RBICalculationResult) -> Dict[str, Any]:
        """Analyze risk trends"""
        # This would typically analyze historical data
        # For now, provide basic trend analysis
        return {
            "trend_direction": "Stable",  # Would be calculated from historical data
            "trend_confidence": "Medium",
            "projected_risk_change": "No significant change expected",
            "trend_factors": ["Equipment aging", "Operating conditions"]
        }
    
    def _justify_inspection_interval(self, calculation_result: RBICalculationResult) -> str:
        """Justify the recommended inspection interval"""
        risk_level = calculation_result.risk_level
        interval = calculation_result.inspection_interval_months
        
        justifications = {
            RiskLevel.VERY_HIGH: f"Very high risk requires frequent monitoring - {interval} month interval ensures early detection",
            RiskLevel.HIGH: f"High risk level necessitates regular inspection - {interval} month interval balances safety and cost",
            RiskLevel.MEDIUM: f"Medium risk allows standard inspection frequency - {interval} month interval is appropriate",
            RiskLevel.LOW: f"Low risk permits extended intervals - {interval} month interval maintains adequate oversight"
        }
        
        return justifications.get(risk_level, f"{interval} month interval based on risk assessment")
    
    def _compare_with_standard_intervals(self, calculation_result: RBICalculationResult) -> Dict[str, Any]:
        """Compare with standard inspection intervals"""
        recommended = calculation_result.inspection_interval_months
        standard_intervals = {
            "API 510": 60,  # Standard API 510 interval
            "Company Standard": 36,  # Typical company standard
            "Regulatory Minimum": 24  # Regulatory requirement
        }
        
        comparisons = {}
        for standard, interval in standard_intervals.items():
            if recommended < interval:
                comparisons[standard] = f"More frequent than {standard} ({interval} months)"
            elif recommended > interval:
                comparisons[standard] = f"Less frequent than {standard} ({interval} months)"
            else:
                comparisons[standard] = f"Matches {standard} ({interval} months)"
        
        return comparisons
    
    def _assess_calculation_reliability(self, calculation_result: RBICalculationResult) -> str:
        """Assess calculation reliability"""
        confidence = calculation_result.confidence_score
        data_quality = calculation_result.data_quality_score
        
        if confidence >= 0.8 and data_quality >= 0.8:
            return "High reliability"
        elif confidence >= 0.6 and data_quality >= 0.6:
            return "Medium reliability"
        else:
            return "Low reliability"
    
    def _assess_result_stability(self, calculation_result: RBICalculationResult) -> str:
        """Assess result stability"""
        # This would typically analyze sensitivity to input changes
        if calculation_result.confidence_score >= 0.8:
            return "Stable results expected"
        elif calculation_result.confidence_score >= 0.6:
            return "Moderately stable results"
        else:
            return "Results may be sensitive to data changes"
    
    def _generate_key_findings(self, calculation_result: RBICalculationResult) -> List[str]:
        """Generate key findings from calculation"""
        findings = []
        
        # Risk level finding
        findings.append(f"Equipment assessed as {calculation_result.risk_level.value} risk")
        
        # Confidence finding
        confidence_level = self._categorize_confidence(calculation_result.confidence_score)
        findings.append(f"Calculation confidence is {confidence_level} ({calculation_result.confidence_score:.2f})")
        
        # Fallback finding
        if calculation_result.fallback_occurred:
            findings.append(f"Calculation required fallback to {calculation_result.calculation_level.value}")
        
        # Data quality finding
        if calculation_result.data_quality_score < 0.6:
            findings.append("Data quality improvements would enhance calculation accuracy")
        
        # Interval finding
        findings.append(f"Recommended inspection interval: {calculation_result.inspection_interval_months} months")
        
        return findings
    
    def _analyze_confidence_factors(self, calculation_result: RBICalculationResult) -> Dict[str, Any]:
        """Analyze factors affecting confidence"""
        factors = {
            "data_availability": "High" if not calculation_result.missing_data else "Medium",
            "calculation_method": calculation_result.calculation_level.value,
            "parameter_estimation": "Low" if calculation_result.estimated_parameters else "High",
            "validation_status": "Validated" if calculation_result.confidence_score > 0.8 else "Requires validation"
        }
        
        return factors
    
    def _identify_uncertainty_sources(self, calculation_result: RBICalculationResult) -> List[str]:
        """Identify sources of uncertainty"""
        sources = []
        
        if calculation_result.missing_data:
            sources.append("Missing input data")
        
        if calculation_result.estimated_parameters:
            sources.append("Parameter estimation")
        
        if calculation_result.fallback_occurred:
            sources.append("Calculation method fallback")
        
        if calculation_result.data_quality_score < 0.7:
            sources.append("Data quality limitations")
        
        return sources or ["No significant uncertainty sources identified"]
    
    def _assess_data_completeness(self, calculation_result: RBICalculationResult) -> str:
        """Assess data completeness"""
        missing_count = len(calculation_result.missing_data or [])
        
        if missing_count == 0:
            return "Complete"
        elif missing_count <= 2:
            return "Mostly complete"
        else:
            return "Incomplete"
    
    def _assess_data_accuracy(self, calculation_result: RBICalculationResult) -> str:
        """Assess data accuracy"""
        estimated_count = len(calculation_result.estimated_parameters or [])
        
        if estimated_count == 0:
            return "High accuracy"
        elif estimated_count <= 2:
            return "Medium accuracy"
        else:
            return "Low accuracy"
    
    def _assess_data_timeliness(self, calculation_result: RBICalculationResult) -> str:
        """Assess data timeliness"""
        # This would typically check inspection dates
        # For now, provide basic assessment
        return "Current" if calculation_result.confidence_score > 0.7 else "May need updating"
    
    def _assess_result_sensitivity(self, calculation_result: RBICalculationResult) -> str:
        """Assess result sensitivity to input changes"""
        if calculation_result.confidence_score >= 0.8:
            return "Low sensitivity"
        elif calculation_result.confidence_score >= 0.6:
            return "Medium sensitivity"
        else:
            return "High sensitivity"
    
    def _assess_validation_status(self, calculation_result: RBICalculationResult) -> str:
        """Assess validation status"""
        if calculation_result.confidence_score >= 0.8 and calculation_result.data_quality_score >= 0.8:
            return "Validated"
        elif calculation_result.confidence_score >= 0.6:
            return "Partially validated"
        else:
            return "Requires validation"
    
    def _assess_improvement_potential(self, calculation_result: RBICalculationResult) -> Dict[str, Any]:
        """Assess potential for improvement"""
        potential = {
            "data_improvement_potential": "High" if calculation_result.missing_data else "Low",
            "method_improvement_potential": "High" if calculation_result.fallback_occurred else "Low",
            "confidence_improvement_potential": "High" if calculation_result.confidence_score < 0.8 else "Low",
            "priority_improvements": []
        }
        
        if calculation_result.missing_data:
            potential["priority_improvements"].append("Collect missing data")
        
        if calculation_result.fallback_occurred:
            potential["priority_improvements"].append("Enable higher-level calculation")
        
        if calculation_result.confidence_score < 0.6:
            potential["priority_improvements"].append("Improve data quality")
        
        return potential    

    # Additional helper methods for data 
   
    # Additional helper methods for data quality and recommendations
    
    def _assess_thickness_coverage(self, thickness_measurements: List) -> str:
        """Assess thickness measurement coverage"""
        count = len(thickness_measurements)
        if count >= 5:
            return "Excellent coverage"
        elif count >= 3:
            return "Good coverage"
        elif count >= 1:
            return "Limited coverage"
        else:
            return "No coverage"
    
    def _assess_thickness_consistency(self, thickness_measurements: List) -> str:
        """Assess thickness measurement consistency"""
        if not thickness_measurements:
            return "No data"
        
        thicknesses = [tm.thickness for tm in thickness_measurements]
        if len(thicknesses) < 2:
            return "Single measurement"
        
        avg_thickness = sum(thicknesses) / len(thicknesses)
        max_deviation = max(abs(t - avg_thickness) for t in thicknesses)
        
        if max_deviation / avg_thickness < 0.1:
            return "Highly consistent"
        elif max_deviation / avg_thickness < 0.2:
            return "Consistent"
        else:
            return "Variable"
    
    def _assess_measurement_recency(self, thickness_measurements: List) -> str:
        """Assess recency of thickness measurements"""
        if not thickness_measurements:
            return "No measurements"
        
        latest_date = max(tm.measurement_date for tm in thickness_measurements)
        days_old = (datetime.now() - latest_date).days
        
        if days_old <= 90:
            return "Recent"
        elif days_old <= 365:
            return "Moderately recent"
        else:
            return "Old"
    
    def _calculate_inspection_age(self, last_inspection_date) -> str:
        """Calculate age of last inspection"""
        if not last_inspection_date:
            return "Unknown"
        
        days_old = (datetime.now() - last_inspection_date).days
        
        if days_old <= 90:
            return f"{days_old} days (Recent)"
        elif days_old <= 365:
            return f"{days_old} days (Moderate)"
        else:
            years_old = days_old / 365
            return f"{years_old:.1f} years (Old)"
    
    def _assess_findings_completeness(self, inspection_findings: List) -> str:
        """Assess completeness of inspection findings"""
        count = len(inspection_findings)
        if count == 0:
            return "No findings documented"
        elif count <= 3:
            return "Basic findings documented"
        else:
            return "Comprehensive findings documented"
    
    def _assess_damage_mechanism_quality(self, damage_mechanisms: List[str]) -> str:
        """Assess quality of damage mechanism identification"""
        count = len(damage_mechanisms)
        if count == 0:
            return "No damage mechanisms identified"
        elif count <= 2:
            return "Basic damage mechanism assessment"
        else:
            return "Comprehensive damage mechanism assessment"
    
    def _assess_data_sufficiency(self, calculation_result, extracted_data) -> str:
        """Assess overall data sufficiency"""
        missing_count = len(calculation_result.missing_data or [])
        has_thickness = len(extracted_data.thickness_measurements) > 0 if extracted_data else False
        has_inspection = extracted_data.last_inspection_date is not None if extracted_data else False
        
        if missing_count == 0 and has_thickness and has_inspection:
            return "Sufficient"
        elif missing_count <= 2:
            return "Mostly sufficient"
        else:
            return "Insufficient"
    
    def _assess_data_reliability(self, extracted_data) -> str:
        """Assess data reliability"""
        if not extracted_data:
            return "No data"
        
        quality_score = 0
        if extracted_data.inspection_quality == "good":
            quality_score += 2
        elif extracted_data.inspection_quality == "average":
            quality_score += 1
        
        if len(extracted_data.thickness_measurements) >= 3:
            quality_score += 2
        elif len(extracted_data.thickness_measurements) >= 1:
            quality_score += 1
        
        if extracted_data.corrosion_rate is not None:
            quality_score += 1
        
        if quality_score >= 4:
            return "High reliability"
        elif quality_score >= 2:
            return "Medium reliability"
        else:
            return "Low reliability"
    
    def _generate_data_quality_recommendations(self, extracted_data) -> List[str]:
        """Generate data quality improvement recommendations"""
        recommendations = []
        
        if not extracted_data:
            return ["Collect basic inspection data"]
        
        if len(extracted_data.thickness_measurements) < 3:
            recommendations.append("Increase thickness measurement coverage to minimum 3 points")
        
        if extracted_data.corrosion_rate is None:
            recommendations.append("Establish corrosion rate through trend analysis")
        
        if extracted_data.inspection_quality == "poor":
            recommendations.append("Improve inspection quality and documentation")
        
        if not extracted_data.damage_mechanisms:
            recommendations.append("Identify and document active damage mechanisms")
        
        if not extracted_data.last_inspection_date:
            recommendations.append("Conduct comprehensive inspection")
        
        return recommendations or ["Data quality is adequate"]
    
    def _assess_fallback_accuracy_impact(self, calculation_result) -> str:
        """Assess accuracy impact of fallback"""
        if not calculation_result.fallback_occurred:
            return "No fallback occurred"
        
        requested = calculation_result.requested_level
        actual = calculation_result.calculation_level
        
        if requested == RBILevel.LEVEL_3 and actual == RBILevel.LEVEL_2:
            return "Moderate accuracy reduction"
        elif requested == RBILevel.LEVEL_3 and actual == RBILevel.LEVEL_1:
            return "Significant accuracy reduction"
        elif requested == RBILevel.LEVEL_2 and actual == RBILevel.LEVEL_1:
            return "Moderate accuracy reduction"
        else:
            return "Unknown impact"
    
    def _identify_fallback_mitigation_measures(self, calculation_result) -> List[str]:
        """Identify measures to mitigate fallback impact"""
        if not calculation_result.fallback_occurred:
            return ["No mitigation needed"]
        
        measures = [
            "Apply conservative safety factors",
            "Increase inspection frequency",
            "Implement enhanced monitoring",
            "Plan data collection improvements"
        ]
        
        if calculation_result.confidence_score < 0.5:
            measures.append("Consider expert review")
        
        return measures
    
    def _suggest_data_improvement_path(self, calculation_result) -> List[str]:
        """Suggest path for data improvement"""
        missing_data = calculation_result.missing_data or []
        path = []
        
        if "thickness_measurements" in missing_data:
            path.append("1. Conduct thickness measurement survey")
        
        if "corrosion_rate" in missing_data:
            path.append("2. Establish corrosion rate monitoring")
        
        if "inspection_data" in missing_data:
            path.append("3. Perform comprehensive inspection")
        
        path.append("4. Validate improved data quality")
        path.append("5. Recalculate with higher-level method")
        
        return path
    
    def _recommend_inspection_scope(self, calculation_result) -> List[str]:
        """Recommend inspection scope"""
        scope = ["Visual inspection", "Thickness measurements"]
        
        if calculation_result.risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH]:
            scope.extend(["NDT examination", "Detailed condition assessment"])
        
        if calculation_result.pof_score > 3.0:
            scope.append("Damage mechanism assessment")
        
        if calculation_result.confidence_score < 0.6:
            scope.append("Enhanced data collection")
        
        return scope
    
    def _recommend_inspection_methods(self, calculation_result, equipment_data) -> List[str]:
        """Recommend inspection methods"""
        methods = ["Ultrasonic thickness measurement"]
        
        if equipment_data and equipment_data.equipment_type.name == "PRESSURE_VESSEL":
            methods.extend(["Radiographic testing", "Magnetic particle testing"])
        
        if calculation_result.risk_level == RiskLevel.VERY_HIGH:
            methods.append("Advanced NDT methods")
        
        return methods
    
    def _generate_monitoring_recommendations(self, calculation_result) -> List[str]:
        """Generate monitoring recommendations"""
        recommendations = []
        
        if calculation_result.risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH]:
            recommendations.append("Implement continuous monitoring where feasible")
        
        if calculation_result.confidence_score < 0.7:
            recommendations.append("Increase monitoring frequency")
        
        if calculation_result.fallback_occurred:
            recommendations.append("Monitor key parameters until data improves")
        
        return recommendations or ["Standard monitoring adequate"]
    
    def _generate_maintenance_recommendations(self, calculation_result, equipment_data) -> List[str]:
        """Generate maintenance recommendations"""
        recommendations = []
        
        if calculation_result.risk_level == RiskLevel.VERY_HIGH:
            recommendations.append("Consider immediate maintenance intervention")
        
        if calculation_result.pof_score > 4.0:
            recommendations.append("Evaluate repair/replacement options")
        
        cof_scores = calculation_result.cof_scores or {}
        if any(score > 4.0 for score in cof_scores.values()):
            recommendations.append("Implement risk mitigation measures")
        
        return recommendations or ["Continue standard maintenance practices"]
    
    def _identify_immediate_data_actions(self, calculation_result) -> List[str]:
        """Identify immediate data collection actions"""
        actions = []
        missing_data = calculation_result.missing_data or []
        
        if "thickness_measurements" in missing_data:
            actions.append("Schedule thickness measurement survey")
        
        if "inspection_data" in missing_data:
            actions.append("Plan comprehensive inspection")
        
        if calculation_result.confidence_score < 0.5:
            actions.append("Validate existing data accuracy")
        
        return actions or ["No immediate actions required"]
    
    def _identify_long_term_data_improvements(self, calculation_result) -> List[str]:
        """Identify long-term data improvements"""
        improvements = []
        
        if calculation_result.fallback_occurred:
            improvements.append("Establish systematic data collection program")
        
        if calculation_result.data_quality_score < 0.7:
            improvements.append("Implement data quality management system")
        
        improvements.append("Develop predictive maintenance capabilities")
        
        return improvements
    
    def _assess_data_improvement_costs(self, calculation_result) -> Dict[str, str]:
        """Assess costs of data improvements"""
        missing_count = len(calculation_result.missing_data or [])
        
        if missing_count == 0:
            return {"cost_level": "Low", "description": "Minor improvements only"}
        elif missing_count <= 2:
            return {"cost_level": "Medium", "description": "Moderate investment required"}
        else:
            return {"cost_level": "High", "description": "Significant investment needed"}
    
    def _generate_risk_mitigation_recommendations(self, calculation_result) -> List[str]:
        """Generate risk mitigation recommendations"""
        recommendations = []
        
        if calculation_result.risk_level == RiskLevel.VERY_HIGH:
            recommendations.extend([
                "Implement immediate risk controls",
                "Consider operational restrictions",
                "Develop contingency plans"
            ])
        elif calculation_result.risk_level == RiskLevel.HIGH:
            recommendations.extend([
                "Enhance monitoring and inspection",
                "Review operating procedures",
                "Prepare mitigation measures"
            ])
        
        return recommendations or ["Continue standard risk management"]
    
    def _generate_contingency_recommendations(self, calculation_result) -> List[str]:
        """Generate contingency planning recommendations"""
        recommendations = []
        
        if calculation_result.risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH]:
            recommendations.extend([
                "Develop failure response procedures",
                "Identify backup equipment/systems",
                "Train personnel on emergency procedures"
            ])
        
        return recommendations or ["Standard contingency planning adequate"]
    
    def _generate_performance_monitoring_recommendations(self, calculation_result) -> List[str]:
        """Generate performance monitoring recommendations"""
        recommendations = [
            "Track inspection interval effectiveness",
            "Monitor prediction accuracy",
            "Review calculation assumptions periodically"
        ]
        
        if calculation_result.confidence_score < 0.7:
            recommendations.append("Validate calculation results with actual performance")
        
        return recommendations
    
    def _prioritize_recommendations(self, calculation_result) -> List[Dict[str, str]]:
        """Prioritize all recommendations"""
        priorities = []
        
        if calculation_result.risk_level == RiskLevel.VERY_HIGH:
            priorities.append({
                "priority": "Critical",
                "action": "Immediate risk assessment and mitigation",
                "timeframe": "Immediate"
            })
        
        if calculation_result.fallback_occurred:
            priorities.append({
                "priority": "High",
                "action": "Data collection to enable higher-level calculation",
                "timeframe": "3-6 months"
            })
        
        if calculation_result.confidence_score < 0.6:
            priorities.append({
                "priority": "Medium",
                "action": "Data quality improvement",
                "timeframe": "6-12 months"
            })
        
        priorities.append({
            "priority": "Low",
            "action": "Continuous improvement and monitoring",
            "timeframe": "Ongoing"
        })
        
        return priorities
    
    def generate_summary_report(
        self, 
        calculation_result: RBICalculationResult,
        equipment_data: Optional[EquipmentData] = None
    ) -> Dict[str, Any]:
        """Generate a summary report for quick overview"""
        
        return {
            "equipment_id": calculation_result.equipment_id,
            "calculation_summary": {
                "risk_level": calculation_result.risk_level.value,
                "inspection_interval": calculation_result.inspection_interval_months,
                "next_inspection": calculation_result.next_inspection_date.isoformat() if calculation_result.next_inspection_date else None,
                "confidence": self._categorize_confidence(calculation_result.confidence_score)
            },
            "key_metrics": {
                "pof_score": calculation_result.pof_score,
                "cof_scores": calculation_result.cof_scores,
                "confidence_score": calculation_result.confidence_score,
                "data_quality_score": calculation_result.data_quality_score
            },
            "status_indicators": {
                "fallback_occurred": calculation_result.fallback_occurred,
                "data_complete": len(calculation_result.missing_data or []) == 0,
                "high_confidence": calculation_result.confidence_score >= 0.8,
                "requires_attention": calculation_result.risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH]
            },
            "next_actions": self._identify_immediate_data_actions(calculation_result)[:3]  # Top 3 actions
        }
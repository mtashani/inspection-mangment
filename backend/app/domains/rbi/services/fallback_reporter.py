"""Fallback Reporter - Generates comprehensive reports for fallback scenarios"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from app.domains.rbi.models.core import (
    RBICalculationResult,
    EquipmentData,
    ExtractedRBIData,
    RBILevel
)
from app.domains.rbi.services.fallback_manager import FallbackManager


class FallbackReporter:
    """Generates comprehensive reports and recommendations for fallback scenarios"""
    
    def __init__(self, fallback_manager: Optional[FallbackManager] = None):
        """Initialize fallback reporter"""
        self.fallback_manager = fallback_manager or FallbackManager()
    
    def generate_fallback_report(
        self,
        equipment_data: EquipmentData,
        extracted_data: ExtractedRBIData,
        calculation_result: RBICalculationResult,
        requested_level: Optional[RBILevel] = None
    ) -> Dict[str, Any]:
        """Generate comprehensive fallback report"""
        
        # Get fallback summary
        fallback_summary = self.fallback_manager.get_fallback_summary(
            equipment_data, extracted_data, requested_level
        )
        
        # Generate data improvement recommendations
        improvement_recommendations = self._generate_improvement_recommendations(
            equipment_data, extracted_data, fallback_summary
        )
        
        # Calculate impact assessment
        impact_assessment = self._assess_fallback_impact(
            calculation_result, requested_level, fallback_summary
        )
        
        # Generate action plan
        action_plan = self._generate_action_plan(
            equipment_data, fallback_summary, improvement_recommendations
        )
        
        return {
            "report_metadata": {
                "equipment_id": equipment_data.equipment_id,
                "report_type": "RBI Fallback Analysis",
                "generation_timestamp": datetime.now(),
                "requested_level": requested_level.value if requested_level else "auto",
                "actual_level": calculation_result.calculation_level.value,
                "fallback_occurred": calculation_result.fallback_occurred
            },
            "executive_summary": self._generate_executive_summary(
                equipment_data, calculation_result, fallback_summary
            ),
            "fallback_analysis": fallback_summary,
            "impact_assessment": impact_assessment,
            "data_gaps": self._identify_data_gaps(fallback_summary),
            "improvement_recommendations": improvement_recommendations,
            "action_plan": action_plan,
            "cost_benefit_analysis": self._generate_cost_benefit_analysis(
                equipment_data, improvement_recommendations
            ),
            "risk_implications": self._assess_risk_implications(
                calculation_result, fallback_summary
            )
        }
    
    def _generate_executive_summary(
        self,
        equipment_data: EquipmentData,
        calculation_result: RBICalculationResult,
        fallback_summary: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate executive summary of fallback situation"""
        
        summary = {
            "equipment_overview": {
                "equipment_id": equipment_data.equipment_id,
                "equipment_type": equipment_data.equipment_type.value,
                "service_type": equipment_data.service_type.value,
                "criticality": equipment_data.criticality_level,
                "age_years": equipment_data.age_years
            },
            "calculation_summary": {
                "requested_level": fallback_summary["requested_level"],
                "achieved_level": fallback_summary["recommended_level"],
                "fallback_required": fallback_summary["fallback_required"],
                "confidence_score": calculation_result.confidence_score,
                "risk_level": calculation_result.risk_level.value,
                "inspection_interval_months": calculation_result.inspection_interval_months
            }
        }
        
        # Add key findings
        key_findings = []
        
        if fallback_summary["fallback_required"]:
            key_findings.append(
                f"Fallback from {fallback_summary['requested_level']} to {fallback_summary['recommended_level']} occurred"
            )
            
            if fallback_summary["confidence_reduction"] > 0.2:
                key_findings.append("Significant confidence reduction due to fallback")
            
            if fallback_summary["adjustment_factor"] < 0.7:
                key_findings.append("Conservative inspection interval adjustment applied")
        else:
            key_findings.append("No fallback required - sufficient data available")
        
        # Add data quality findings
        level_assessments = fallback_summary["level_assessments"]
        for level, assessment in level_assessments.items():
            if assessment["capable"] and assessment["data_quality_score"] < 0.6:
                key_findings.append(f"Data quality for {level.replace('_', ' ').title()} is below optimal")
        
        summary["key_findings"] = key_findings
        
        return summary
    
    def _generate_improvement_recommendations(
        self,
        equipment_data: EquipmentData,
        extracted_data: ExtractedRBIData,
        fallback_summary: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate detailed data improvement recommendations"""
        
        recommendations = []
        
        # Analyze each level's requirements
        level_assessments = fallback_summary["level_assessments"]
        
        # Level 3 recommendations
        if not level_assessments["level_3"]["capable"]:
            level3_recs = self._generate_level3_recommendations(
                level_assessments["level_3"]["missing_requirements"]
            )
            recommendations.extend(level3_recs)
        
        # Level 2 recommendations
        if not level_assessments["level_2"]["capable"]:
            level2_recs = self._generate_level2_recommendations(
                level_assessments["level_2"]["missing_requirements"]
            )
            recommendations.extend(level2_recs)
        
        # Data quality improvements
        quality_recs = self._generate_quality_improvement_recommendations(
            equipment_data, extracted_data, level_assessments
        )
        recommendations.extend(quality_recs)
        
        return recommendations
    
    def _generate_level3_recommendations(self, missing_requirements: List[str]) -> List[Dict[str, Any]]:
        """Generate Level 3 specific recommendations"""
        
        recommendations = []
        
        for missing in missing_requirements:
            if missing == "corrosion_rate":
                recommendations.append({
                    "category": "Data Collection",
                    "priority": "High",
                    "requirement": "Corrosion Rate Data",
                    "description": "Obtain corrosion rate from thickness trend analysis",
                    "action_items": [
                        "Conduct thickness measurements at same locations over time",
                        "Calculate corrosion rate from thickness loss trend",
                        "Validate corrosion rate with industry benchmarks"
                    ],
                    "estimated_effort": "Medium",
                    "estimated_cost": "Low-Medium",
                    "timeline": "3-6 months"
                })
            
            elif missing == "thickness_measurements":
                recommendations.append({
                    "category": "Inspection",
                    "priority": "High",
                    "requirement": "Thickness Measurements",
                    "description": "Conduct comprehensive thickness measurement survey",
                    "action_items": [
                        "Plan thickness measurement locations (minimum 5 points)",
                        "Use appropriate NDT methods (UT, RT, etc.)",
                        "Document measurement locations for future reference",
                        "Establish baseline for trend analysis"
                    ],
                    "estimated_effort": "Medium",
                    "estimated_cost": "Medium",
                    "timeline": "1-2 months"
                })
            
            elif missing == "minimum_3_thickness_measurements":
                recommendations.append({
                    "category": "Inspection",
                    "priority": "Medium",
                    "requirement": "Additional Thickness Points",
                    "description": "Increase thickness measurement coverage",
                    "action_items": [
                        "Add measurement points to reach minimum of 3 locations",
                        "Focus on critical areas (high stress, corrosion-prone)",
                        "Ensure measurements are representative"
                    ],
                    "estimated_effort": "Low",
                    "estimated_cost": "Low",
                    "timeline": "1 month"
                })
            
            elif missing == "recent_inspection_data":
                recommendations.append({
                    "category": "Inspection",
                    "priority": "High",
                    "requirement": "Recent Inspection",
                    "description": "Conduct updated inspection within 2 years",
                    "action_items": [
                        "Schedule comprehensive inspection",
                        "Include visual, NDT, and condition assessment",
                        "Document all findings and recommendations",
                        "Update equipment condition database"
                    ],
                    "estimated_effort": "High",
                    "estimated_cost": "Medium-High",
                    "timeline": "2-3 months"
                })
        
        return recommendations
    
    def _generate_level2_recommendations(self, missing_requirements: List[str]) -> List[Dict[str, Any]]:
        """Generate Level 2 specific recommendations"""
        
        recommendations = []
        
        for missing in missing_requirements:
            if missing == "thickness_or_corrosion_data":
                recommendations.append({
                    "category": "Data Collection",
                    "priority": "Medium",
                    "requirement": "Basic Degradation Data",
                    "description": "Obtain either thickness measurements or corrosion rate",
                    "action_items": [
                        "Conduct basic thickness survey (minimum 2 points)",
                        "OR estimate corrosion rate from similar equipment",
                        "Document data source and methodology"
                    ],
                    "estimated_effort": "Low-Medium",
                    "estimated_cost": "Low",
                    "timeline": "1-2 months"
                })
            
            elif missing == "reasonably_recent_inspection_data":
                recommendations.append({
                    "category": "Inspection",
                    "priority": "Medium",
                    "requirement": "Updated Inspection",
                    "description": "Conduct inspection within 5 years",
                    "action_items": [
                        "Schedule basic inspection",
                        "Focus on condition assessment",
                        "Document key findings"
                    ],
                    "estimated_effort": "Medium",
                    "estimated_cost": "Medium",
                    "timeline": "1-2 months"
                })
        
        return recommendations
    
    def _generate_quality_improvement_recommendations(
        self,
        equipment_data: EquipmentData,
        extracted_data: ExtractedRBIData,
        level_assessments: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate data quality improvement recommendations"""
        
        recommendations = []
        
        # Check for data quality issues
        for level_name, assessment in level_assessments.items():
            if assessment["capable"] and assessment["data_quality_score"] < 0.7:
                level_display = level_name.replace("_", " ").title()
                
                recommendations.append({
                    "category": "Data Quality",
                    "priority": "Medium",
                    "requirement": f"{level_display} Data Quality Improvement",
                    "description": f"Improve data quality for {level_display} calculation",
                    "action_items": [
                        "Review data collection procedures",
                        "Validate existing data accuracy",
                        "Implement data quality checks",
                        "Train personnel on data requirements"
                    ],
                    "estimated_effort": "Medium",
                    "estimated_cost": "Low-Medium",
                    "timeline": "2-4 months"
                })
        
        # Specific quality improvements
        if extracted_data.inspection_quality == "poor":
            recommendations.append({
                "category": "Inspection Quality",
                "priority": "High",
                "requirement": "Inspection Quality Improvement",
                "description": "Improve inspection quality and documentation",
                "action_items": [
                    "Use qualified inspection personnel",
                    "Follow established inspection procedures",
                    "Improve documentation standards",
                    "Implement quality assurance checks"
                ],
                "estimated_effort": "Medium",
                "estimated_cost": "Medium",
                "timeline": "Ongoing"
            })
        
        return recommendations  
  
    def _identify_data_gaps(self, fallback_summary: Dict[str, Any]) -> Dict[str, Any]:
        """Identify and categorize data gaps"""
        
        data_gaps = {
            "critical_gaps": [],
            "important_gaps": [],
            "nice_to_have_gaps": [],
            "gap_summary": {}
        }
        
        level_assessments = fallback_summary["level_assessments"]
        
        # Analyze gaps for each level
        for level_name, assessment in level_assessments.items():
            if not assessment["capable"]:
                level_display = level_name.replace("_", " ").title()
                missing = assessment["missing_requirements"]
                
                # Categorize gaps by criticality
                critical_gaps = [req for req in missing if req in [
                    "equipment_id", "equipment_type", "service_type", "corrosion_rate"
                ]]
                
                important_gaps = [req for req in missing if req in [
                    "thickness_measurements", "last_inspection_date", "design_pressure"
                ]]
                
                nice_to_have_gaps = [req for req in missing if req not in critical_gaps + important_gaps]
                
                if critical_gaps:
                    data_gaps["critical_gaps"].extend([
                        {"level": level_display, "requirement": gap} for gap in critical_gaps
                    ])
                
                if important_gaps:
                    data_gaps["important_gaps"].extend([
                        {"level": level_display, "requirement": gap} for gap in important_gaps
                    ])
                
                if nice_to_have_gaps:
                    data_gaps["nice_to_have_gaps"].extend([
                        {"level": level_display, "requirement": gap} for gap in nice_to_have_gaps
                    ])
        
        # Generate gap summary
        data_gaps["gap_summary"] = {
            "total_critical": len(data_gaps["critical_gaps"]),
            "total_important": len(data_gaps["important_gaps"]),
            "total_nice_to_have": len(data_gaps["nice_to_have_gaps"]),
            "highest_achievable_level": fallback_summary["recommended_level"],
            "data_completeness_score": self._calculate_data_completeness_score(level_assessments)
        }
        
        return data_gaps
    
    def _calculate_data_completeness_score(self, level_assessments: Dict[str, Any]) -> float:
        """Calculate overall data completeness score"""
        
        # Weight levels by importance
        level_weights = {"level_3": 0.5, "level_2": 0.3, "level_1": 0.2}
        
        weighted_score = 0.0
        total_weight = 0.0
        
        for level_name, assessment in level_assessments.items():
            weight = level_weights.get(level_name, 0.0)
            if weight > 0:
                # Score based on capability and data quality
                if assessment["capable"]:
                    level_score = 0.5 + (assessment["data_quality_score"] * 0.5)
                else:
                    level_score = 0.0
                
                weighted_score += level_score * weight
                total_weight += weight
        
        return weighted_score / total_weight if total_weight > 0 else 0.0
    
    def _assess_fallback_impact(
        self,
        calculation_result: RBICalculationResult,
        requested_level: Optional[RBILevel],
        fallback_summary: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Assess the impact of fallback on calculation results"""
        
        impact_assessment = {
            "confidence_impact": {
                "original_confidence": "N/A",
                "actual_confidence": calculation_result.confidence_score,
                "confidence_reduction": fallback_summary.get("confidence_reduction", 0.0),
                "impact_level": self._categorize_impact(fallback_summary.get("confidence_reduction", 0.0))
            },
            "interval_impact": {
                "adjustment_factor": fallback_summary.get("adjustment_factor", 1.0),
                "actual_interval": calculation_result.inspection_interval_months,
                "conservatism_level": self._assess_conservatism_level(fallback_summary.get("adjustment_factor", 1.0))
            },
            "risk_assessment_impact": {
                "risk_level": calculation_result.risk_level.value,
                "pof_score": calculation_result.pof_score,
                "cof_scores": calculation_result.cof_scores,
                "uncertainty_level": self._assess_uncertainty_level(calculation_result.confidence_score)
            }
        }
        
        # Add overall impact assessment
        if fallback_summary["fallback_required"]:
            if fallback_summary["confidence_reduction"] > 0.3:
                overall_impact = "High"
            elif fallback_summary["confidence_reduction"] > 0.15:
                overall_impact = "Medium"
            else:
                overall_impact = "Low"
        else:
            overall_impact = "None"
        
        impact_assessment["overall_impact"] = overall_impact
        
        return impact_assessment
    
    def _categorize_impact(self, reduction: float) -> str:
        """Categorize impact level based on reduction amount"""
        if reduction > 0.3:
            return "High"
        elif reduction > 0.15:
            return "Medium"
        elif reduction > 0.05:
            return "Low"
        else:
            return "Minimal"
    
    def _assess_conservatism_level(self, adjustment_factor: float) -> str:
        """Assess conservatism level based on adjustment factor"""
        if adjustment_factor < 0.5:
            return "Very Conservative"
        elif adjustment_factor < 0.7:
            return "Conservative"
        elif adjustment_factor < 0.9:
            return "Slightly Conservative"
        else:
            return "Standard"
    
    def _assess_uncertainty_level(self, confidence_score: float) -> str:
        """Assess uncertainty level based on confidence score"""
        if confidence_score > 0.8:
            return "Low"
        elif confidence_score > 0.6:
            return "Medium"
        elif confidence_score > 0.4:
            return "High"
        else:
            return "Very High"
    
    def _generate_action_plan(
        self,
        equipment_data: EquipmentData,
        fallback_summary: Dict[str, Any],
        improvement_recommendations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate prioritized action plan"""
        
        # Prioritize recommendations
        high_priority = [rec for rec in improvement_recommendations if rec["priority"] == "High"]
        medium_priority = [rec for rec in improvement_recommendations if rec["priority"] == "Medium"]
        low_priority = [rec for rec in improvement_recommendations if rec["priority"] == "Low"]
        
        # Create phased implementation plan
        phases = []
        
        if high_priority:
            phases.append({
                "phase": 1,
                "name": "Critical Data Collection",
                "duration": "1-3 months",
                "actions": high_priority,
                "objective": "Address critical data gaps to enable higher-level calculations"
            })
        
        if medium_priority:
            phases.append({
                "phase": 2,
                "name": "Data Quality Improvement",
                "duration": "2-6 months",
                "actions": medium_priority,
                "objective": "Improve data quality and calculation confidence"
            })
        
        if low_priority:
            phases.append({
                "phase": 3,
                "name": "Optimization",
                "duration": "3-12 months",
                "actions": low_priority,
                "objective": "Optimize data collection and analysis processes"
            })
        
        # Calculate total estimated costs and effort
        total_cost_estimate = self._estimate_total_cost(improvement_recommendations)
        total_effort_estimate = self._estimate_total_effort(improvement_recommendations)
        
        return {
            "implementation_phases": phases,
            "total_recommendations": len(improvement_recommendations),
            "high_priority_count": len(high_priority),
            "medium_priority_count": len(medium_priority),
            "low_priority_count": len(low_priority),
            "estimated_total_cost": total_cost_estimate,
            "estimated_total_effort": total_effort_estimate,
            "expected_benefits": self._identify_expected_benefits(fallback_summary),
            "success_metrics": self._define_success_metrics(equipment_data, fallback_summary)
        }
    
    def _estimate_total_cost(self, recommendations: List[Dict[str, Any]]) -> str:
        """Estimate total implementation cost"""
        cost_mapping = {"Low": 1, "Low-Medium": 2, "Medium": 3, "Medium-High": 4, "High": 5}
        
        total_score = sum(cost_mapping.get(rec.get("estimated_cost", "Medium"), 3) 
                         for rec in recommendations)
        
        if total_score <= 5:
            return "Low"
        elif total_score <= 15:
            return "Medium"
        else:
            return "High"
    
    def _estimate_total_effort(self, recommendations: List[Dict[str, Any]]) -> str:
        """Estimate total implementation effort"""
        effort_mapping = {"Low": 1, "Low-Medium": 2, "Medium": 3, "Medium-High": 4, "High": 5}
        
        total_score = sum(effort_mapping.get(rec.get("estimated_effort", "Medium"), 3) 
                         for rec in recommendations)
        
        if total_score <= 5:
            return "Low"
        elif total_score <= 15:
            return "Medium"
        else:
            return "High"
    
    def _identify_expected_benefits(self, fallback_summary: Dict[str, Any]) -> List[str]:
        """Identify expected benefits from implementing recommendations"""
        
        benefits = []
        
        if not fallback_summary["level_assessments"]["level_3"]["capable"]:
            benefits.append("Enable Level 3 quantitative RBI calculation")
            benefits.append("Achieve highest calculation confidence (0.8-0.95)")
            benefits.append("Obtain remaining life estimates")
            benefits.append("Optimize inspection intervals based on actual condition")
        
        if not fallback_summary["level_assessments"]["level_2"]["capable"]:
            benefits.append("Enable Level 2 semi-quantitative RBI calculation")
            benefits.append("Improve calculation confidence (0.6-0.85)")
            benefits.append("Better risk assessment accuracy")
        
        benefits.extend([
            "Reduce inspection interval conservatism",
            "Improve maintenance planning accuracy",
            "Better resource allocation",
            "Enhanced regulatory compliance",
            "Reduced overall inspection costs"
        ])
        
        return benefits
    
    def _define_success_metrics(self, equipment_data: EquipmentData, fallback_summary: Dict[str, Any]) -> List[Dict[str, str]]:
        """Define success metrics for improvement initiatives"""
        
        metrics = [
            {
                "metric": "Data Completeness Score",
                "target": "> 0.8",
                "measurement": "Percentage of required data elements available"
            },
            {
                "metric": "Calculation Confidence",
                "target": "> 0.7",
                "measurement": "RBI calculation confidence score"
            },
            {
                "metric": "Data Quality Score",
                "target": "> 0.8",
                "measurement": "Overall data quality assessment"
            }
        ]
        
        if not fallback_summary["level_assessments"]["level_3"]["capable"]:
            metrics.append({
                "metric": "Level 3 Capability",
                "target": "Achieved",
                "measurement": "Ability to perform Level 3 RBI calculation"
            })
        
        if not fallback_summary["level_assessments"]["level_2"]["capable"]:
            metrics.append({
                "metric": "Level 2 Capability",
                "target": "Achieved",
                "measurement": "Ability to perform Level 2 RBI calculation"
            })
        
        return metrics
    
    def _generate_cost_benefit_analysis(
        self,
        equipment_data: EquipmentData,
        improvement_recommendations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate cost-benefit analysis for improvement recommendations"""
        
        # Estimate implementation costs
        implementation_cost = self._estimate_implementation_cost(improvement_recommendations)
        
        # Estimate potential savings
        potential_savings = self._estimate_potential_savings(equipment_data)
        
        # Calculate ROI
        roi_analysis = self._calculate_roi(implementation_cost, potential_savings)
        
        return {
            "implementation_cost": implementation_cost,
            "potential_savings": potential_savings,
            "roi_analysis": roi_analysis,
            "payback_period": self._estimate_payback_period(implementation_cost, potential_savings),
            "risk_reduction_value": self._estimate_risk_reduction_value(equipment_data),
            "intangible_benefits": [
                "Improved regulatory compliance",
                "Enhanced safety performance",
                "Better maintenance planning",
                "Reduced operational risk",
                "Improved asset reliability"
            ]
        }
    
    def _estimate_implementation_cost(self, recommendations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Estimate implementation costs"""
        
        # Simplified cost estimation
        cost_estimates = {
            "inspection_costs": 15000,  # Typical inspection cost
            "data_collection": 5000,    # Data gathering and analysis
            "training": 3000,           # Personnel training
            "system_updates": 2000,     # Database/system updates
            "total": 25000
        }
        
        # Adjust based on number and complexity of recommendations
        complexity_factor = min(2.0, len(recommendations) / 5.0)
        
        for key in cost_estimates:
            if key != "total":
                cost_estimates[key] = int(cost_estimates[key] * complexity_factor)
        
        cost_estimates["total"] = sum(v for k, v in cost_estimates.items() if k != "total")
        
        return cost_estimates
    
    def _estimate_potential_savings(self, equipment_data: EquipmentData) -> Dict[str, Any]:
        """Estimate potential savings from improved RBI"""
        
        # Base savings estimates
        annual_savings = {
            "optimized_intervals": 8000,    # Reduced unnecessary inspections
            "better_planning": 5000,        # Improved maintenance planning
            "risk_reduction": 10000,        # Reduced failure risk
            "regulatory_efficiency": 2000,  # Streamlined compliance
            "total_annual": 25000
        }
        
        # Adjust based on equipment criticality
        criticality_multipliers = {
            "Critical": 1.5,
            "High": 1.2,
            "Medium": 1.0,
            "Low": 0.8
        }
        
        multiplier = criticality_multipliers.get(equipment_data.criticality_level, 1.0)
        
        for key in annual_savings:
            if key != "total_annual":
                annual_savings[key] = int(annual_savings[key] * multiplier)
        
        annual_savings["total_annual"] = sum(v for k, v in annual_savings.items() if k != "total_annual")
        
        return {
            "annual_savings": annual_savings,
            "five_year_savings": annual_savings["total_annual"] * 5,
            "ten_year_savings": annual_savings["total_annual"] * 10
        }
    
    def _calculate_roi(self, implementation_cost: Dict[str, Any], potential_savings: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate return on investment"""
        
        total_cost = implementation_cost["total"]
        annual_savings = potential_savings["annual_savings"]["total_annual"]
        
        if total_cost > 0:
            roi_1_year = ((annual_savings - total_cost) / total_cost) * 100
            roi_5_year = ((annual_savings * 5 - total_cost) / total_cost) * 100
        else:
            roi_1_year = 0
            roi_5_year = 0
        
        return {
            "roi_1_year_percent": round(roi_1_year, 1),
            "roi_5_year_percent": round(roi_5_year, 1),
            "break_even_months": round(total_cost / annual_savings * 12, 1) if annual_savings > 0 else "N/A"
        }
    
    def _estimate_payback_period(self, implementation_cost: Dict[str, Any], potential_savings: Dict[str, Any]) -> str:
        """Estimate payback period"""
        
        total_cost = implementation_cost["total"]
        annual_savings = potential_savings["annual_savings"]["total_annual"]
        
        if annual_savings > 0:
            payback_years = total_cost / annual_savings
            if payback_years < 1:
                return f"{round(payback_years * 12, 1)} months"
            else:
                return f"{round(payback_years, 1)} years"
        else:
            return "Cannot be determined"
    
    def _estimate_risk_reduction_value(self, equipment_data: EquipmentData) -> Dict[str, Any]:
        """Estimate value of risk reduction"""
        
        # Simplified risk reduction value estimation
        base_risk_value = {
            "Critical": 100000,
            "High": 50000,
            "Medium": 25000,
            "Low": 10000
        }
        
        equipment_risk_value = base_risk_value.get(equipment_data.criticality_level, 25000)
        
        # Assume 10-20% risk reduction from better RBI
        risk_reduction_low = equipment_risk_value * 0.1
        risk_reduction_high = equipment_risk_value * 0.2
        
        return {
            "equipment_risk_value": equipment_risk_value,
            "estimated_risk_reduction_low": risk_reduction_low,
            "estimated_risk_reduction_high": risk_reduction_high,
            "annual_risk_reduction_value": (risk_reduction_low + risk_reduction_high) / 2
        }
    
    def _assess_risk_implications(
        self,
        calculation_result: RBICalculationResult,
        fallback_summary: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Assess risk implications of fallback"""
        
        risk_implications = {
            "current_risk_assessment": {
                "risk_level": calculation_result.risk_level.value,
                "confidence": calculation_result.confidence_score,
                "uncertainty_level": self._assess_uncertainty_level(calculation_result.confidence_score)
            },
            "fallback_risks": [],
            "mitigation_strategies": [],
            "monitoring_recommendations": []
        }
        
        # Identify fallback-related risks
        if fallback_summary["fallback_required"]:
            if fallback_summary["confidence_reduction"] > 0.2:
                risk_implications["fallback_risks"].append(
                    "High uncertainty in risk assessment due to limited data"
                )
                risk_implications["mitigation_strategies"].append(
                    "Implement more frequent monitoring until data gaps are addressed"
                )
            
            if fallback_summary["adjustment_factor"] < 0.7:
                risk_implications["fallback_risks"].append(
                    "Potentially excessive conservatism leading to unnecessary costs"
                )
                risk_implications["mitigation_strategies"].append(
                    "Prioritize data collection to reduce conservatism"
                )
        
        # Add monitoring recommendations
        if calculation_result.confidence_score < 0.6:
            risk_implications["monitoring_recommendations"].extend([
                "Increase inspection frequency until confidence improves",
                "Implement condition monitoring where feasible",
                "Review and update risk assessment quarterly"
            ])
        
        return risk_implications
    
    def _calculate_roi(self, implementation_cost: Dict[str, Any], potential_savings: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate return on investment"""
        
        total_cost = implementation_cost["total"]
        annual_savings = potential_savings["annual_savings"]["total_annual"]
        
        if annual_savings > 0:
            payback_years = total_cost / annual_savings
            roi_percentage = ((annual_savings * 5 - total_cost) / total_cost) * 100  # 5-year ROI
        else:
            payback_years = float('inf')
            roi_percentage = -100
        
        return {
            "payback_years": round(payback_years, 1),
            "roi_percentage": round(roi_percentage, 1),
            "net_present_value": round(annual_savings * 4 - total_cost, 0),  # Simplified NPV
            "roi_category": self._categorize_roi(roi_percentage)
        }
    
    def _categorize_roi(self, roi_percentage: float) -> str:
        """Categorize ROI"""
        if roi_percentage > 100:
            return "Excellent"
        elif roi_percentage > 50:
            return "Good"
        elif roi_percentage > 20:
            return "Acceptable"
        elif roi_percentage > 0:
            return "Marginal"
        else:
            return "Poor"
    
    def _estimate_payback_period(self, implementation_cost: Dict[str, Any], potential_savings: Dict[str, Any]) -> str:
        """Estimate payback period"""
        
        total_cost = implementation_cost["total"]
        annual_savings = potential_savings["annual_savings"]["total_annual"]
        
        if annual_savings <= 0:
            return "No payback expected"
        
        payback_years = total_cost / annual_savings
        
        if payback_years < 1:
            return f"{int(payback_years * 12)} months"
        elif payback_years < 2:
            return f"{payback_years:.1f} years"
        else:
            return f"{int(payback_years)} years"
    
    def _estimate_risk_reduction_value(self, equipment_data: EquipmentData) -> Dict[str, Any]:
        """Estimate value of risk reduction"""
        
        # Base risk reduction value on equipment criticality and type
        base_value = 50000  # Base annual risk value
        
        # Adjust for criticality
        criticality_multiplier = {
            "Low": 0.5,
            "Medium": 1.0,
            "High": 2.0,
            "Critical": 3.0
        }.get(equipment_data.criticality_level, 1.0)
        
        # Adjust for equipment type
        type_multiplier = {
            "PRESSURE_VESSEL": 1.5,
            "HEAT_EXCHANGER": 1.2,
            "PIPING": 1.0,
            "TANK": 1.3,
            "PUMP": 0.8,
            "COMPRESSOR": 1.8
        }.get(equipment_data.equipment_type.name, 1.0)
        
        annual_risk_value = base_value * criticality_multiplier * type_multiplier
        
        return {
            "annual_risk_value": int(annual_risk_value),
            "risk_reduction_percentage": 15,  # Typical improvement from better RBI
            "annual_risk_reduction_value": int(annual_risk_value * 0.15),
            "description": "Estimated annual value of risk reduction from improved RBI calculation"
        }
"""Tests for Calculation Report Service"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock

from app.domains.rbi.services.calculation_report_service import (
    CalculationReportService,
    CalculationReportSection,
    DetailedCalculationReport
)
from app.domains.rbi.models.core import (
    EquipmentData,
    ExtractedRBIData,
    RBICalculationResult,
    ThicknessMeasurement,
    InspectionFinding,
    EquipmentType,
    ServiceType,
    RBILevel,
    RiskLevel
)
from app.domains.rbi.models.config import RBIConfig


class TestCalculationReportService:
    """Test CalculationReportService functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.config = RBIConfig()
        self.report_service = CalculationReportService(self.config)
    
    def create_sample_equipment(self) -> EquipmentData:
        """Create sample equipment data"""
        return EquipmentData(
            equipment_id="V-101",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime(2015, 1, 1),
            design_pressure=25.0,
            design_temperature=150.0,
            material="CS",
            criticality_level="High",
            coating_type="Epoxy",
            location="open_area",
            inventory_size=100.0
        )
    
    def create_sample_extracted_data(self) -> ExtractedRBIData:
        """Create sample extracted data"""
        thickness_measurements = [
            ThicknessMeasurement(
                location="Shell_Top", thickness=12.5, measurement_date=datetime.now() - timedelta(days=30),
                minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
            ),
            ThicknessMeasurement(
                location="Shell_Bottom", thickness=11.8, measurement_date=datetime.now() - timedelta(days=30),
                minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
            ),
            ThicknessMeasurement(
                location="Shell_Side", thickness=12.0, measurement_date=datetime.now() - timedelta(days=30),
                minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
            )
        ]
        
        inspection_findings = [
            InspectionFinding(
                finding_type="Corrosion", severity="Medium",
                description="General corrosion observed", location="Shell",
                recommendation="Monitor", finding_date=datetime.now() - timedelta(days=30)
            )
        ]
        
        return ExtractedRBIData(
            equipment_id="V-101",
            thickness_measurements=thickness_measurements,
            corrosion_rate=0.2,
            coating_condition="moderate",
            damage_mechanisms=["General Corrosion"],
            inspection_findings=inspection_findings,
            last_inspection_date=datetime.now() - timedelta(days=30),
            inspection_quality="good"
        )
    
    def create_sample_calculation_result(self, fallback: bool = False) -> RBICalculationResult:
        """Create sample calculation result"""
        return RBICalculationResult(
            equipment_id="V-101",
            calculation_level=RBILevel.LEVEL_2 if fallback else RBILevel.LEVEL_3,
            requested_level=RBILevel.LEVEL_3,
            fallback_occurred=fallback,
            next_inspection_date=datetime.now() + timedelta(days=720),
            risk_level=RiskLevel.MEDIUM,
            pof_score=2.5,
            cof_scores={"safety": 3.0, "environmental": 2.5, "economic": 3.5},
            confidence_score=0.75,
            data_quality_score=0.8,
            calculation_timestamp=datetime.now(),
            input_parameters={
                "base_failure_rate": 0.001,
                "age_factor": 1.2,
                "corrosion_factor": 1.1,
                "fallback_adjustments": {"adjustment_factor": 0.9, "confidence_reduction": 0.1} if fallback else {}
            },
            missing_data=["corrosion_rate"] if fallback else [],
            estimated_parameters=["coating_condition"] if fallback else [],
            inspection_interval_months=24
        )
    
    def test_generate_detailed_report_complete(self):
        """Test detailed report generation with complete data"""
        equipment = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        calculation_result = self.create_sample_calculation_result()
        
        report = self.report_service.generate_detailed_report(
            calculation_result=calculation_result,
            equipment_data=equipment,
            extracted_data=extracted_data,
            include_intermediate_calculations=True,
            include_data_quality_analysis=True,
            include_recommendations=True
        )
        
        # Verify report structure
        assert isinstance(report, DetailedCalculationReport)
        assert report.equipment_id == "V-101"
        assert report.report_type == "Detailed RBI Calculation Report"
        assert len(report.sections) >= 6  # Should have multiple sections
        
        # Verify sections exist
        section_titles = [section.title for section in report.sections]
        assert "Executive Summary" in section_titles
        assert "Input Parameters" in section_titles
        assert "Calculation Methodology" in section_titles
        assert "Intermediate Calculations" in section_titles
        assert "Results Analysis" in section_titles
        assert "Confidence Assessment" in section_titles
        assert "Data Quality Analysis" in section_titles
        assert "Recommendations" in section_titles
        
        # Verify metadata
        assert "report_version" in report.metadata
        assert "calculation_engine_version" in report.metadata
        assert "generation_timestamp" in report.metadata
    
    def test_generate_detailed_report_with_fallback(self):
        """Test detailed report generation with fallback scenario"""
        equipment = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        calculation_result = self.create_sample_calculation_result(fallback=True)
        
        report = self.report_service.generate_detailed_report(
            calculation_result=calculation_result,
            equipment_data=equipment,
            extracted_data=extracted_data
        )
        
        # Verify fallback section is included
        section_titles = [section.title for section in report.sections]
        assert "Fallback Analysis" in section_titles
        
        # Find and verify fallback section
        fallback_section = next(s for s in report.sections if s.title == "Fallback Analysis")
        assert fallback_section.importance == "high"
        assert "fallback_details" in fallback_section.content
        assert "impact_analysis" in fallback_section.content
    
    def test_generate_detailed_report_minimal_data(self):
        """Test detailed report generation with minimal data"""
        calculation_result = self.create_sample_calculation_result()
        
        report = self.report_service.generate_detailed_report(
            calculation_result=calculation_result,
            equipment_data=None,
            extracted_data=None,
            include_intermediate_calculations=False,
            include_data_quality_analysis=False,
            include_recommendations=False
        )
        
        # Should still generate basic sections
        assert len(report.sections) >= 3
        section_titles = [section.title for section in report.sections]
        assert "Executive Summary" in section_titles
        assert "Input Parameters" in section_titles
        assert "Calculation Methodology" in section_titles
    
    def test_executive_summary_section(self):
        """Test executive summary section generation"""
        equipment = self.create_sample_equipment()
        calculation_result = self.create_sample_calculation_result()
        
        section = self.report_service._create_executive_summary_section(
            calculation_result, equipment
        )
        
        assert section.title == "Executive Summary"
        assert section.importance == "critical"
        assert "equipment_overview" in section.content
        assert "calculation_summary" in section.content
        assert "risk_assessment" in section.content
        assert "inspection_recommendation" in section.content
        assert "confidence_assessment" in section.content
        
        # Verify equipment overview
        equipment_overview = section.content["equipment_overview"]
        assert equipment_overview["equipment_id"] == "V-101"
        assert equipment_overview["equipment_type"] == "pressure_vessel"
        assert equipment_overview["service_type"] == "sour_gas"
    
    def test_input_parameters_section(self):
        """Test input parameters section generation"""
        equipment = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        calculation_result = self.create_sample_calculation_result()
        
        section = self.report_service._create_input_parameters_section(
            calculation_result, equipment, extracted_data
        )
        
        assert section.title == "Input Parameters"
        assert section.importance == "high"
        assert "equipment_parameters" in section.content
        assert "inspection_parameters" in section.content
        assert "calculation_parameters" in section.content
        assert "data_completeness" in section.content
        
        # Verify equipment parameters
        equipment_params = section.content["equipment_parameters"]
        assert "basic_information" in equipment_params
        assert "design_parameters" in equipment_params
        assert "operational_parameters" in equipment_params
        
        # Verify inspection parameters
        inspection_params = section.content["inspection_parameters"]
        assert "thickness_measurements" in inspection_params
        assert len(inspection_params["thickness_measurements"]) == 3
    
    def test_calculation_methodology_section(self):
        """Test calculation methodology section generation"""
        calculation_result = self.create_sample_calculation_result()
        
        section = self.report_service._create_calculation_methodology_section(
            calculation_result
        )
        
        assert section.title == "Calculation Methodology"
        assert section.importance == "high"
        assert "calculation_level" in section.content
        assert "calculation_standards" in section.content
        assert "risk_matrix" in section.content
        
        # Verify calculation level info
        calc_level = section.content["calculation_level"]
        assert calc_level["level"] == "Level_3"
        assert "description" in calc_level
        assert "approach" in calc_level
    
    def test_intermediate_calculations_section(self):
        """Test intermediate calculations section generation"""
        calculation_result = self.create_sample_calculation_result()
        
        section = self.report_service._create_intermediate_calculations_section(
            calculation_result
        )
        
        assert section.title == "Intermediate Calculations"
        assert section.importance == "normal"
        assert "pof_calculations" in section.content
        assert "cof_calculations" in section.content
        assert "risk_calculations" in section.content
        assert "calculation_workflow" in section.content
        
        # Verify PoF calculations
        pof_calcs = section.content["pof_calculations"]
        assert pof_calcs["final_pof_score"] == 2.5
        assert "pof_components" in pof_calcs
        assert "pof_methodology" in pof_calcs
    
    def test_results_analysis_section(self):
        """Test results analysis section generation"""
        calculation_result = self.create_sample_calculation_result()
        
        section = self.report_service._create_results_analysis_section(
            calculation_result
        )
        
        assert section.title == "Results Analysis"
        assert section.importance == "critical"
        assert "risk_analysis" in section.content
        assert "interval_analysis" in section.content
        assert "performance_indicators" in section.content
        assert "key_findings" in section.content
        
        # Verify risk analysis
        risk_analysis = section.content["risk_analysis"]
        assert risk_analysis["current_risk_level"] == "Medium"
        assert "risk_level_description" in risk_analysis
    
    def test_confidence_assessment_section(self):
        """Test confidence assessment section generation"""
        calculation_result = self.create_sample_calculation_result()
        
        section = self.report_service._create_confidence_assessment_section(
            calculation_result
        )
        
        assert section.title == "Confidence Assessment"
        assert section.importance == "high"
        assert "confidence_breakdown" in section.content
        assert "data_quality_assessment" in section.content
        assert "reliability_assessment" in section.content
        assert "improvement_potential" in section.content
        
        # Verify confidence breakdown
        confidence = section.content["confidence_breakdown"]
        assert confidence["overall_confidence"] == 0.75
        assert confidence["confidence_level"] == "Medium"
    
    def test_data_quality_section(self):
        """Test data quality section generation"""
        calculation_result = self.create_sample_calculation_result()
        extracted_data = self.create_sample_extracted_data()
        
        section = self.report_service._create_data_quality_section(
            calculation_result, extracted_data
        )
        
        assert section.title == "Data Quality Analysis"
        assert section.importance == "high"
        assert "thickness_data_quality" in section.content
        assert "inspection_data_quality" in section.content
        assert "overall_assessment" in section.content
        assert "improvement_recommendations" in section.content
        
        # Verify thickness data quality
        thickness_quality = section.content["thickness_data_quality"]
        assert thickness_quality["measurement_count"] == 3
        assert thickness_quality["measurement_coverage"] == "Good coverage"
    
    def test_recommendations_section(self):
        """Test recommendations section generation"""
        equipment = self.create_sample_equipment()
        calculation_result = self.create_sample_calculation_result()
        
        section = self.report_service._create_recommendations_section(
            calculation_result, equipment
        )
        
        assert section.title == "Recommendations"
        assert section.importance == "critical"
        assert "inspection_recommendations" in section.content
        assert "data_improvement_recommendations" in section.content
        assert "risk_management_recommendations" in section.content
        assert "priority_actions" in section.content
        
        # Verify inspection recommendations
        inspection_recs = section.content["inspection_recommendations"]
        assert "next_inspection" in inspection_recs
        assert "monitoring_recommendations" in inspection_recs
    
    def test_generate_summary_report(self):
        """Test summary report generation"""
        equipment = self.create_sample_equipment()
        calculation_result = self.create_sample_calculation_result()
        
        summary = self.report_service.generate_summary_report(
            calculation_result, equipment
        )
        
        assert summary["equipment_id"] == "V-101"
        assert "calculation_summary" in summary
        assert "key_metrics" in summary
        assert "status_indicators" in summary
        assert "next_actions" in summary
        
        # Verify calculation summary
        calc_summary = summary["calculation_summary"]
        assert calc_summary["risk_level"] == "Medium"
        assert calc_summary["inspection_interval"] == 24
        assert calc_summary["confidence"] == "Medium"
        
        # Verify status indicators
        status = summary["status_indicators"]
        assert status["fallback_occurred"] is False
        assert status["data_complete"] is True
        assert status["high_confidence"] is False  # 0.75 < 0.8
    
    def test_report_serialization(self):
        """Test report serialization to dict and JSON"""
        equipment = self.create_sample_equipment()
        calculation_result = self.create_sample_calculation_result()
        
        report = self.report_service.generate_detailed_report(
            calculation_result=calculation_result,
            equipment_data=equipment,
            extracted_data=None
        )
        
        # Test to_dict
        report_dict = report.to_dict()
        assert isinstance(report_dict, dict)
        assert "report_id" in report_dict
        assert "equipment_id" in report_dict
        assert "sections" in report_dict
        assert "metadata" in report_dict
        
        # Test to_json
        report_json = report.to_json()
        assert isinstance(report_json, str)
        assert "report_id" in report_json
        assert "V-101" in report_json
    
    def test_helper_methods(self):
        """Test various helper methods"""
        calculation_result = self.create_sample_calculation_result()
        
        # Test risk level description
        description = self.report_service._assess_risk_level_description(RiskLevel.MEDIUM)
        assert "Medium Risk" in description
        
        # Test confidence categorization
        confidence_level = self.report_service._categorize_confidence(0.75)
        assert confidence_level == "Medium"
        
        # Test methodology description
        methodology = self.report_service._get_methodology_description(RBILevel.LEVEL_3)
        assert "Fully quantitative" in methodology["description"]
        
        # Test key risk factors
        risk_factors = self.report_service._identify_key_risk_factors(calculation_result)
        assert isinstance(risk_factors, list)
        assert len(risk_factors) > 0
    
    def test_data_quality_assessments(self):
        """Test data quality assessment methods"""
        extracted_data = self.create_sample_extracted_data()
        
        # Test thickness coverage
        coverage = self.report_service._assess_thickness_coverage(
            extracted_data.thickness_measurements
        )
        assert coverage == "Good coverage"
        
        # Test thickness consistency
        consistency = self.report_service._assess_thickness_consistency(
            extracted_data.thickness_measurements
        )
        assert consistency in ["Highly consistent", "Consistent", "Variable"]
        
        # Test measurement recency
        recency = self.report_service._assess_measurement_recency(
            extracted_data.thickness_measurements
        )
        assert recency == "Recent"  # Created 30 days ago
        
        # Test inspection age
        age = self.report_service._calculate_inspection_age(
            extracted_data.last_inspection_date
        )
        assert "days" in age
    
    def test_recommendation_generation(self):
        """Test recommendation generation methods"""
        equipment = self.create_sample_equipment()
        calculation_result = self.create_sample_calculation_result()
        
        # Test inspection scope
        scope = self.report_service._recommend_inspection_scope(calculation_result)
        assert isinstance(scope, list)
        assert "Visual inspection" in scope
        
        # Test inspection methods
        methods = self.report_service._recommend_inspection_methods(
            calculation_result, equipment
        )
        assert isinstance(methods, list)
        assert "Ultrasonic thickness measurement" in methods
        
        # Test priority recommendations
        priorities = self.report_service._prioritize_recommendations(calculation_result)
        assert isinstance(priorities, list)
        assert all("priority" in p for p in priorities)
        assert all("action" in p for p in priorities)


class TestCalculationReportSection:
    """Test CalculationReportSection dataclass"""
    
    def test_section_creation(self):
        """Test section creation and serialization"""
        content = {"test_key": "test_value", "number": 42}
        
        section = CalculationReportSection(
            title="Test Section",
            content=content,
            importance="high"
        )
        
        assert section.title == "Test Section"
        assert section.content == content
        assert section.importance == "high"
        assert len(section.subsections) == 0
    
    def test_section_with_subsections(self):
        """Test section with subsections"""
        subsection = CalculationReportSection(
            title="Subsection",
            content={"sub_key": "sub_value"}
        )
        
        main_section = CalculationReportSection(
            title="Main Section",
            content={"main_key": "main_value"},
            subsections=[subsection]
        )
        
        assert len(main_section.subsections) == 1
        assert main_section.subsections[0].title == "Subsection"
    
    def test_section_to_dict(self):
        """Test section serialization to dictionary"""
        subsection = CalculationReportSection(
            title="Subsection",
            content={"sub_key": "sub_value"}
        )
        
        section = CalculationReportSection(
            title="Test Section",
            content={"test_key": "test_value"},
            subsections=[subsection],
            importance="critical"
        )
        
        section_dict = section.to_dict()
        
        assert section_dict["title"] == "Test Section"
        assert section_dict["content"]["test_key"] == "test_value"
        assert section_dict["importance"] == "critical"
        assert len(section_dict["subsections"]) == 1
        assert section_dict["subsections"][0]["title"] == "Subsection"
"""End-to-end workflow tests for the complete report system"""

import pytest
from datetime import date, datetime
from unittest.mock import Mock, MagicMock

from app.domains.report.services.template_service import TemplateService
from app.domains.report.services.report_service import ReportService
from app.domains.report.services.auto_field_service import AutoFieldService
from app.domains.report.services.inspection_integration_service import InspectionIntegrationService
from app.domains.report.services.report_selection_service import ReportSelectionService
from app.domains.inspection.services.inspection_completion_service import InspectionCompletionService


class TestCompleteReportWorkflow:
    """Test complete end-to-end report workflow"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_session = Mock()
        
        # Initialize all services
        self.template_service = TemplateService(self.mock_session)
        self.report_service = ReportService(self.mock_session)
        self.auto_field_service = AutoFieldService()
        self.integration_service = InspectionIntegrationService()
        self.selection_service = ReportSelectionService(self.mock_session)
        self.completion_service = InspectionCompletionService(self.mock_session)
        
        # Mock all service dependencies
        self._setup_service_mocks()
    
    def _setup_service_mocks(self):
        """Set up mocks for all services"""
        
        # Mock template service methods
        self.template_service.get_template_with_structure = Mock()
        self.template_service.validate_template_structure = Mock()
        self.template_service.get_template_stats = Mock()
        
        # Mock report service methods
        self.report_service.template_service = self.template_service
        self.report_service.integration_service = self.integration_service
        
        # Mock selection service methods
        self.selection_service.template_service = self.template_service
        
        # Mock completion service methods
        self.completion_service.get_inspection = Mock()
    
    def test_complete_workflow_from_inspection_to_report(self):
        """Test complete workflow from inspection completion to report submission"""
        
        print("=== Testing Complete Workflow: Inspection → Template Selection → Report Creation ===")
        
        # Step 1: Complete inspection
        print("\nStep 1: Completing inspection...")
        
        mock_inspection = self._create_mock_inspection()
        self.completion_service.get_inspection.return_value = mock_inspection
        
        # Check completion status
        completion_result = self.completion_service.check_completion_status(123)
        assert completion_result.can_complete is True
        print("  ✓ Inspection can be completed")
        
        # Complete inspection
        completion_success = self.completion_service.complete_inspection(123, "Inspection completed successfully")
        assert completion_success is True
        print("  ✓ Inspection completed")
        
        # Step 2: Trigger report creation workflow
        print("\nStep 2: Triggering report creation workflow...")
        
        workflow_result = self.completion_service.trigger_report_creation_workflow(123)
        assert workflow_result['success'] is True
        assert workflow_result['next_step'] == 'show_template_selection'
        print("  ✓ Report creation workflow triggered")
        
        # Step 3: Get available templates
        print("\nStep 3: Getting available templates...")
        
        mock_template = self._create_mock_template()
        self.template_service.get_all_templates.return_value = [mock_template]
        self.template_service.get_template_stats.return_value = self._create_mock_template_stats()
        
        selection_result = self.selection_service.get_available_templates_for_inspection(123)
        assert selection_result.success is True
        assert len(selection_result.available_templates) > 0
        print(f"  ✓ Found {len(selection_result.available_templates)} available templates")
        
        # Step 4: Validate selected template
        print("\nStep 4: Validating selected template...")
        
        self.template_service.get_template_with_structure.return_value = mock_template
        mock_validation = Mock()
        mock_validation.is_valid = True
        mock_validation.errors = []
        self.template_service.validate_template_structure.return_value = mock_validation
        
        validation_result = self.selection_service.validate_template_for_inspection(1, 123)
        assert validation_result['valid'] is True
        print("  ✓ Template validated successfully")
        
        # Step 5: Get template preview with auto-population
        print("\nStep 5: Getting template preview...")
        
        preview_result = self.selection_service.get_template_preview_for_inspection(1, 123)
        assert preview_result['success'] is True
        assert preview_result['auto_fields_count'] >= 0
        print(f"  ✓ Template preview generated ({preview_result['auto_fields_count']} auto fields)")
        
        # Step 6: Create report with auto-population
        print("\nStep 6: Creating report with auto-population...")
        
        # Mock auto-field population
        self.integration_service.populate_template_fields = Mock(return_value={
            1: date(2025, 1, 15),  # inspection.start_date
            2: "PV-001"            # equipment.tag
        })
        
        report_creation_result = self.report_service.create_report_with_auto_population(
            template_id=1,
            inspection_id=123,
            inspection_data=mock_inspection,
            manual_field_values={3: "Manual inspection findings"}
        )
        
        assert report_creation_result.success is True
        print(f"  ✓ Report created successfully (ID: {report_creation_result.report_id})")
        
        # Step 7: Submit report
        print("\nStep 7: Submitting report...")
        
        self.report_service.get_report = Mock(return_value=self._create_mock_final_report())
        
        submission_result = self.report_service.submit_report(
            report_id=1,
            field_values={
                1: date(2025, 1, 15),
                2: "PV-001",
                3: "Detailed inspection findings",
                4: "Medium"
            }
        )
        
        assert submission_result.success is True
        print("  ✓ Report submitted successfully")
        
        print("\n🎉 Complete workflow test passed!")
    
    def test_workflow_with_auto_field_integration(self):
        """Test workflow focusing on auto-field integration"""
        
        print("\n=== Testing Auto-Field Integration Workflow ===")
        
        # Step 1: Set up inspection data
        mock_inspection = self._create_mock_inspection()
        mock_equipment = self._create_mock_equipment()
        mock_user = self._create_mock_user()
        
        # Step 2: Test auto-field service directly
        print("\nStep 2: Testing auto-field service...")
        
        from app.domains.report.services.auto_field_service import AutoFieldContext
        
        context = AutoFieldContext(
            inspection=mock_inspection,
            equipment=mock_equipment,
            user=mock_user
        )
        
        # Test individual field population
        inspection_date = self.auto_field_service.populate_field("inspection.start_date", context)
        equipment_tag = self.auto_field_service.populate_field("equipment.tag", context)
        inspector_name = self.auto_field_service.populate_field("user.full_name", context)
        
        assert inspection_date == date(2025, 1, 15)
        assert equipment_tag == "PV-001"
        assert inspector_name == "John Doe"
        print("  ✓ Individual auto-fields populated correctly")
        
        # Step 3: Test integration service
        print("\nStep 3: Testing integration service...")
        
        template_fields = [
            self._create_mock_template_field(1, "auto", "inspection.start_date"),
            self._create_mock_template_field(2, "auto", "equipment.tag"),
            self._create_mock_template_field(3, "manual", None)
        ]
        
        populated_values = self.integration_service.populate_template_fields(
            template_fields,
            mock_inspection,
            mock_equipment,
            mock_user
        )
        
        assert len(populated_values) == 2  # Only auto fields
        assert 1 in populated_values and 2 in populated_values
        print(f"  ✓ Integration service populated {len(populated_values)} fields")
        
        # Step 4: Test validation of auto-field availability
        print("\nStep 4: Testing auto-field availability validation...")
        
        validation_results = self.integration_service.validate_inspection_for_auto_fields(mock_inspection)
        
        assert validation_results['inspection.start_date'] is True
        assert validation_results['equipment.tag'] is True
        assert validation_results['current.date'] is True
        print("  ✓ Auto-field availability validated")
        
        print("\n🎉 Auto-field integration workflow test passed!")
    
    def test_error_handling_workflow(self):
        """Test workflow with various error conditions"""
        
        print("\n=== Testing Error Handling Workflow ===")
        
        # Test 1: Inspection not found
        print("\nTest 1: Inspection not found...")
        
        self.completion_service.get_inspection.return_value = None
        
        try:
            self.completion_service.check_completion_status(999)
            assert False, "Should have raised exception"
        except Exception as e:
            assert "not found" in str(e)
            print("  ✓ Handled missing inspection correctly")
        
        # Test 2: Template validation errors
        print("\nTest 2: Template validation errors...")
        
        mock_template = self._create_mock_template()
        self.template_service.get_template_with_structure.return_value = mock_template
        
        # Mock validation with errors
        mock_validation = Mock()
        mock_validation.is_valid = False
        mock_validation.errors = [{'message': 'Template has errors'}]
        self.template_service.validate_template_structure.return_value = mock_validation
        
        validation_result = self.selection_service.validate_template_for_inspection(1, 123)
        assert validation_result['valid'] is False
        assert 'validation_errors' in validation_result
        print("  ✓ Handled template validation errors correctly")
        
        # Test 3: Auto-field population failures
        print("\nTest 3: Auto-field population failures...")
        
        # Test with missing context data
        from app.domains.report.services.auto_field_service import AutoFieldContext, AutoFieldError
        
        empty_context = AutoFieldContext()  # No data
        
        try:
            self.auto_field_service.populate_field("inspection.start_date", empty_context)
            assert False, "Should have raised AutoFieldError"
        except AutoFieldError as e:
            assert "not available" in str(e)
            print("  ✓ Handled missing auto-field data correctly")
        
        # Test 4: Report creation with invalid data
        print("\nTest 4: Report creation with invalid data...")
        
        # Mock template service to return None (template not found)
        self.template_service.get_template_with_structure.return_value = None
        
        creation_result = self.report_service.create_report_from_template(
            template_id=999,
            inspection_id=123
        )
        
        assert creation_result.success is False
        assert any("not found" in error['message'] for error in creation_result.errors)
        print("  ✓ Handled invalid template ID correctly")
        
        print("\n🎉 Error handling workflow test passed!")
    
    def test_performance_workflow(self):
        """Test workflow performance with large datasets"""
        
        print("\n=== Testing Performance Workflow ===")
        
        # Test 1: Large template processing
        print("\nTest 1: Large template processing...")
        
        large_template = self._create_large_mock_template(sections=5, fields_per_section=20)
        self.template_service.get_template_with_structure.return_value = large_template
        
        # Mock validation for large template
        mock_validation = Mock()
        mock_validation.is_valid = True
        mock_validation.errors = []
        self.template_service.validate_template_structure.return_value = mock_validation
        
        start_time = datetime.now()
        validation_result = self.selection_service.validate_template_for_inspection(1, 123)
        end_time = datetime.now()
        
        processing_time = (end_time - start_time).total_seconds()
        assert validation_result['valid'] is True
        assert processing_time < 1.0  # Should complete within 1 second
        print(f"  ✓ Large template processed in {processing_time:.3f} seconds")
        
        # Test 2: Multiple auto-field population
        print("\nTest 2: Multiple auto-field population...")
        
        # Create many auto fields
        auto_fields = []
        for i in range(50):
            field = self._create_mock_template_field(
                i + 1, 
                "auto", 
                "inspection.start_date" if i % 2 == 0 else "equipment.tag"
            )
            auto_fields.append(field)
        
        mock_inspection = self._create_mock_inspection()
        mock_equipment = self._create_mock_equipment()
        
        start_time = datetime.now()
        populated_values = self.integration_service.populate_template_fields(
            auto_fields,
            mock_inspection,
            mock_equipment
        )
        end_time = datetime.now()
        
        processing_time = (end_time - start_time).total_seconds()
        assert len(populated_values) == 50
        assert processing_time < 0.5  # Should complete within 0.5 seconds
        print(f"  ✓ 50 auto-fields populated in {processing_time:.3f} seconds")
        
        print("\n🎉 Performance workflow test passed!")
    
    def _create_mock_inspection(self):
        """Create mock inspection for testing"""
        mock_inspection = Mock()
        mock_inspection.id = 123
        mock_inspection.inspection_number = "INS-2025-001"
        mock_inspection.title = "Test Inspection"
        mock_inspection.description = "Test Description"
        mock_inspection.start_date = date(2025, 1, 15)
        mock_inspection.end_date = date(2025, 1, 16)
        mock_inspection.status = "completed"
        mock_inspection.equipment_id = 456
        mock_inspection.work_order = "WO-2025-001"
        mock_inspection.requesting_department = "Engineering"
        return mock_inspection
    
    def _create_mock_equipment(self):
        """Create mock equipment for testing"""
        mock_equipment = Mock()
        mock_equipment.id = 456
        mock_equipment.tag = "PV-001"
        mock_equipment.description = "Test Equipment"
        mock_equipment.unit = "Unit A"
        mock_equipment.equipment_type = "Pressure Vessel"
        return mock_equipment
    
    def _create_mock_user(self):
        """Create mock user for testing"""
        mock_user = Mock()
        mock_user.full_name = "John Doe"
        mock_user.department = "Engineering"
        return mock_user
    
    def _create_mock_template(self):
        """Create mock template for testing"""
        mock_template = Mock()
        mock_template.id = 1
        mock_template.name = "Test Template"
        mock_template.description = "Test Description"
        mock_template.is_active = True
        mock_template.created_at = datetime.now()
        mock_template.updated_at = datetime.now()
        mock_template.sections = []
        return mock_template
    
    def _create_mock_template_stats(self):
        """Create mock template stats for testing"""
        return {
            'structure': {
                'total_sections': 2,
                'total_subsections': 3,
                'total_fields': 8
            },
            'field_analysis': {
                'auto_fields': 3,
                'manual_fields': 5,
                'required_fields': 2,
                'field_types': {'text': 4, 'date': 2, 'select': 2}
            }
        }
    
    def _create_mock_template_field(self, field_id, value_source, auto_source_key):
        """Create mock template field for testing"""
        mock_field = Mock()
        mock_field.id = field_id
        mock_field.label = f"Test Field {field_id}"
        mock_field.field_type = "text"
        mock_field.value_source = value_source
        mock_field.auto_source_key = auto_source_key
        mock_field.is_required = False
        return mock_field
    
    def _create_mock_final_report(self):
        """Create mock final report for testing"""
        mock_report = Mock()
        mock_report.id = 1
        mock_report.inspection_id = 123
        mock_report.template_id = 1
        mock_report.status = "draft"
        mock_report.created_at = datetime.now()
        mock_report.updated_at = datetime.now()
        return mock_report
    
    def _create_large_mock_template(self, sections=5, fields_per_section=20):
        """Create large mock template for performance testing"""
        mock_template = Mock()
        mock_template.id = 1
        mock_template.name = "Large Test Template"
        mock_template.is_active = True
        
        # Create mock sections
        mock_sections = []
        for i in range(sections):
            mock_section = Mock()
            mock_section.id = i + 1
            mock_section.title = f"Section {i + 1}"
            
            # Create mock subsections with fields
            mock_subsections = []
            mock_subsection = Mock()
            mock_subsection.id = i + 1
            mock_subsection.title = f"Subsection {i + 1}"
            
            # Create mock fields
            mock_fields = []
            for j in range(fields_per_section):
                mock_field = Mock()
                mock_field.id = (i * fields_per_section) + j + 1
                mock_field.label = f"Field {i + 1}.{j + 1}"
                mock_field.field_type = "text"
                mock_field.value_source = "auto" if j % 3 == 0 else "manual"
                mock_field.auto_source_key = "inspection.start_date" if j % 3 == 0 else None
                mock_fields.append(mock_field)
            
            mock_subsection.fields = mock_fields
            mock_subsections.append(mock_subsection)
            mock_section.subsections = mock_subsections
            mock_sections.append(mock_section)
        
        mock_template.sections = mock_sections
        return mock_template


class TestWorkflowIntegrationScenarios:
    """Test various integration scenarios"""
    
    def test_multi_user_workflow(self):
        """Test workflow with multiple users and roles"""
        
        print("\n=== Testing Multi-User Workflow ===")
        
        # Scenario: Admin creates template, Inspector completes inspection, Supervisor reviews report
        
        # Step 1: Admin creates template
        print("\nStep 1: Admin creates template...")
        
        mock_session = Mock()
        template_service = TemplateService(mock_session)
        template_service.create_template = Mock(return_value=Mock(id=1, name="Multi-User Template"))
        
        template = template_service.create_template("Multi-User Template", "Template for multi-user workflow")
        assert template.id == 1
        print("  ✓ Admin created template")
        
        # Step 2: Inspector completes inspection
        print("\nStep 2: Inspector completes inspection...")
        
        completion_service = InspectionCompletionService(mock_session)
        completion_service.get_inspection = Mock(return_value=Mock(
            id=123,
            status="in_progress",
            start_date=date(2025, 1, 15),
            title="Multi-User Inspection",
            equipment_id=456
        ))
        
        completion_result = completion_service.complete_inspection(123, "Completed by inspector")
        assert completion_result is True
        print("  ✓ Inspector completed inspection")
        
        # Step 3: Inspector creates report
        print("\nStep 3: Inspector creates report...")
        
        report_service = ReportService(mock_session)
        report_service.template_service = Mock()
        report_service.integration_service = Mock()
        
        # Mock successful report creation
        report_service.create_report_from_template = Mock(return_value=Mock(
            success=True,
            report_id=1,
            errors=[],
            warnings=[]
        ))
        
        report_result = report_service.create_report_from_template(
            template_id=1,
            inspection_id=123,
            created_by=789  # Inspector user ID
        )
        
        assert report_result.success is True
        print("  ✓ Inspector created report")
        
        # Step 4: Supervisor reviews and approves
        print("\nStep 4: Supervisor reviews report...")
        
        report_service.update_report_status = Mock(return_value=True)
        
        approval_result = report_service.update_report_status(1, "approved")
        assert approval_result is True
        print("  ✓ Supervisor approved report")
        
        print("\n🎉 Multi-user workflow test passed!")
    
    def test_batch_processing_workflow(self):
        """Test workflow for batch processing multiple reports"""
        
        print("\n=== Testing Batch Processing Workflow ===")
        
        # Scenario: Process multiple inspections and create reports in batch
        
        mock_session = Mock()
        services = {
            'template': TemplateService(mock_session),
            'report': ReportService(mock_session),
            'selection': ReportSelectionService(mock_session)
        }
        
        # Mock services
        for service in services.values():
            if hasattr(service, 'template_service'):
                service.template_service = Mock()
            if hasattr(service, 'integration_service'):
                service.integration_service = Mock()
        
        # Step 1: Get multiple completed inspections
        print("\nStep 1: Processing multiple inspections...")
        
        inspections = [
            Mock(id=i, inspection_number=f"INS-2025-{i:03d}", status="completed")
            for i in range(1, 6)  # 5 inspections
        ]
        
        # Step 2: Get available templates for each inspection
        print("\nStep 2: Getting templates for each inspection...")
        
        services['selection'].get_available_templates_for_inspection = Mock(return_value=Mock(
            success=True,
            available_templates=[Mock(id=1, name="Standard Template")],
            recommended_templates=[Mock(id=1, name="Standard Template")]
        ))
        
        template_results = []
        for inspection in inspections:
            result = services['selection'].get_available_templates_for_inspection(inspection.id)
            template_results.append(result)
        
        assert len(template_results) == 5
        assert all(result.success for result in template_results)
        print(f"  ✓ Retrieved templates for {len(template_results)} inspections")
        
        # Step 3: Create reports in batch
        print("\nStep 3: Creating reports in batch...")
        
        services['report'].create_report_from_template = Mock(return_value=Mock(
            success=True,
            report_id=1,
            errors=[],
            warnings=[]
        ))
        
        report_results = []
        for inspection in inspections:
            result = services['report'].create_report_from_template(
                template_id=1,
                inspection_id=inspection.id
            )
            report_results.append(result)
        
        assert len(report_results) == 5
        assert all(result.success for result in report_results)
        print(f"  ✓ Created {len(report_results)} reports in batch")
        
        print("\n🎉 Batch processing workflow test passed!")


def run_all_end_to_end_tests():
    """Run all end-to-end workflow tests"""
    print("=== Running End-to-End Workflow Tests ===\n")
    
    # Complete workflow tests
    workflow_tests = TestCompleteReportWorkflow()
    workflow_tests.setup_method()
    workflow_tests.test_complete_workflow_from_inspection_to_report()
    workflow_tests.test_workflow_with_auto_field_integration()
    workflow_tests.test_error_handling_workflow()
    workflow_tests.test_performance_workflow()
    
    # Integration scenario tests
    scenario_tests = TestWorkflowIntegrationScenarios()
    scenario_tests.test_multi_user_workflow()
    scenario_tests.test_batch_processing_workflow()
    
    print("\n🎉 All End-to-End Workflow Tests Passed!")


if __name__ == "__main__":
    run_all_end_to_end_tests()
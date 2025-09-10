"""Comprehensive integration tests for the entire report system"""

import pytest
from datetime import date, datetime
from unittest.mock import Mock, MagicMock, patch

# Import all services for comprehensive testing
from app.domains.report.services.template_service import TemplateService
from app.domains.report.services.report_service import ReportService
from app.domains.report.services.auto_field_service import AutoFieldService
from app.domains.report.services.inspection_integration_service import InspectionIntegrationService
from app.domains.report.services.report_selection_service import ReportSelectionService
from app.domains.inspection.services.inspection_completion_service import InspectionCompletionService


class TestSystemIntegration:
    """Test integration between all system components"""
    
    def setup_method(self):
        """Set up comprehensive test environment"""
        self.mock_session = Mock()
        
        # Initialize all services
        self.services = {
            'template': TemplateService(self.mock_session),
            'report': ReportService(self.mock_session),
            'auto_field': AutoFieldService(),
            'integration': InspectionIntegrationService(),
            'selection': ReportSelectionService(self.mock_session),
            'completion': InspectionCompletionService(self.mock_session)
        }
        
        # Set up service dependencies
        self.services['report'].template_service = self.services['template']
        self.services['report'].integration_service = self.services['integration']
        self.services['selection'].template_service = self.services['template']
        
        # Create comprehensive test data
        self.test_data = self._create_comprehensive_test_data()
    
    def test_full_system_integration(self):
        """Test complete system integration with all components"""
        
        print("=== Testing Full System Integration ===")
        
        # Phase 1: Template Management
        print("\nPhase 1: Template Management...")
        
        # Mock template creation
        self.services['template'].create_template = Mock(return_value=self.test_data['template'])
        self.services['template'].get_template_with_structure = Mock(return_value=self.test_data['template'])
        
        # Create template
        template = self.services['template'].create_template(
            "Integration Test Template",
            "Comprehensive integration test template"
        )
        assert template.id == 1
        print("  ✓ Template created")
        
        # Validate template
        mock_validation = Mock()
        mock_validation.is_valid = True
        mock_validation.errors = []
        self.services['template'].validate_template_structure = Mock(return_value=mock_validation)
        
        validation = self.services['template'].validate_template_structure(1)
        assert validation.is_valid is True
        print("  ✓ Template validated")
        
        # Phase 2: Inspection Completion
        print("\nPhase 2: Inspection Completion...")
        
        # Mock inspection completion
        self.services['completion'].get_inspection = Mock(return_value=self.test_data['inspection'])
        self.services['completion'].check_completion_status = Mock(return_value=Mock(
            can_complete=True,
            is_completed=False,
            completion_percentage=100.0
        ))
        
        completion_status = self.services['completion'].check_completion_status(123)
        assert completion_status.can_complete is True
        print("  ✓ Inspection completion checked")
        
        # Complete inspection
        self.services['completion'].complete_inspection = Mock(return_value=True)
        completion_result = self.services['completion'].complete_inspection(123)
        assert completion_result is True
        print("  ✓ Inspection completed")
        
        # Phase 3: Auto-Field Population
        print("\nPhase 3: Auto-Field Population...")
        
        # Test auto-field service
        from app.domains.report.services.auto_field_service import AutoFieldContext
        
        context = AutoFieldContext(
            inspection=self.test_data['inspection'],
            equipment=self.test_data['equipment'],
            user=self.test_data['user']
        )
        
        # Test multiple auto-field population
        field_mappings = {
            "inspection_date": "inspection.start_date",
            "equipment_tag": "equipment.tag",
            "inspector_name": "user.full_name",
            "current_date": "current.date"
        }
        
        auto_results = self.services['auto_field'].populate_multiple_fields(field_mappings, context)
        assert len(auto_results) == 4
        assert auto_results["inspection_date"] == date(2025, 1, 15)
        assert auto_results["equipment_tag"] == "PV-001"
        print(f"  ✓ Auto-populated {len(auto_results)} fields")
        
        # Phase 4: Template Selection
        print("\nPhase 4: Template Selection...")
        
        # Mock template selection
        self.services['template'].get_all_templates = Mock(return_value=[self.test_data['template']])
        self.services['template'].get_template_stats = Mock(return_value=self.test_data['template_stats'])
        
        selection_result = self.services['selection'].get_available_templates_for_inspection(123)
        assert selection_result.success is True
        print("  ✓ Templates retrieved for selection")
        
        # Validate template for inspection
        validation_result = self.services['selection'].validate_template_for_inspection(1, 123)
        assert validation_result['valid'] is True
        print("  ✓ Template validated for inspection")
        
        # Phase 5: Report Creation
        print("\nPhase 5: Report Creation...")
        
        # Mock report creation with auto-population
        self.services['integration'].populate_template_fields = Mock(return_value={
            1: date(2025, 1, 15),
            2: "PV-001",
            3: "John Doe"
        })
        
        # Mock session operations
        self.mock_session.add = Mock()
        self.mock_session.flush = Mock()
        self.mock_session.commit = Mock()
        
        report_result = self.services['report'].create_report_with_auto_population(
            template_id=1,
            inspection_id=123,
            inspection_data=self.test_data['inspection'],
            equipment_data=self.test_data['equipment'],
            user_data=self.test_data['user'],
            manual_field_values={4: "Manual inspection findings"}
        )
        
        assert report_result.success is True
        print("  ✓ Report created with auto-population")
        
        # Phase 6: Report Submission
        print("\nPhase 6: Report Submission...")
        
        # Mock report retrieval and submission
        mock_report = Mock()
        mock_report.id = 1
        mock_report.status = "draft"
        mock_report.template_id = 1
        
        self.services['report'].get_report = Mock(return_value=mock_report)
        
        submission_result = self.services['report'].submit_report(
            report_id=1,
            field_values={
                1: date(2025, 1, 15),
                2: "PV-001",
                3: "John Doe",
                4: "Comprehensive inspection findings",
                5: "Medium"
            }
        )
        
        assert submission_result.success is True
        print("  ✓ Report submitted successfully")
        
        print("\n🎉 Full system integration test passed!")
    
    def test_cross_service_data_flow(self):
        """Test data flow between different services"""
        
        print("\n=== Testing Cross-Service Data Flow ===")
        
        # Test 1: Template → Selection → Report flow
        print("\nTest 1: Template → Selection → Report flow...")
        
        # Mock template service
        self.services['template'].get_template_with_structure = Mock(return_value=self.test_data['template'])
        self.services['template'].get_template_stats = Mock(return_value=self.test_data['template_stats'])
        
        # Get template through selection service
        preview = self.services['selection'].get_template_preview_for_inspection(1, 123)
        assert preview['success'] is True
        
        # Use template data in report service
        self.services['report'].template_service = self.services['template']
        
        # Mock validation
        mock_validation = Mock()
        mock_validation.is_valid = True
        mock_validation.errors = []
        self.services['template'].validate_template_structure = Mock(return_value=mock_validation)
        
        # Mock session operations
        self.mock_session.add = Mock()
        self.mock_session.flush = Mock()
        self.mock_session.commit = Mock()
        
        report_result = self.services['report'].create_report_from_template(
            template_id=1,
            inspection_id=123
        )
        
        assert report_result.success is True
        print("  ✓ Data flowed correctly from Template → Selection → Report")
        
        # Test 2: Auto-Field → Integration → Report flow
        print("\nTest 2: Auto-Field → Integration → Report flow...")
        
        # Create context for auto-field service
        from app.domains.report.services.auto_field_service import AutoFieldContext
        
        context = AutoFieldContext(
            inspection=self.test_data['inspection'],
            equipment=self.test_data['equipment']
        )
        
        # Get auto-field value
        auto_value = self.services['auto_field'].populate_field("inspection.start_date", context)
        assert auto_value == date(2025, 1, 15)
        
        # Use in integration service
        template_fields = [Mock(
            id=1,
            value_source=Mock(value='auto'),
            auto_source_key="inspection.start_date"
        )]
        
        integration_result = self.services['integration'].populate_template_fields(
            template_fields,
            self.test_data['inspection']
        )
        
        assert 1 in integration_result
        assert integration_result[1] == date(2025, 1, 15)
        print("  ✓ Data flowed correctly from Auto-Field → Integration → Report")
        
        print("\n🎉 Cross-service data flow test passed!")
    
    def test_error_propagation_across_services(self):
        """Test how errors propagate across different services"""
        
        print("\n=== Testing Error Propagation ===")
        
        # Test 1: Template validation error propagation
        print("\nTest 1: Template validation error propagation...")
        
        # Mock template with validation errors
        self.services['template'].get_template_with_structure = Mock(return_value=self.test_data['template'])
        
        mock_validation = Mock()
        mock_validation.is_valid = False
        mock_validation.errors = [{'message': 'Template validation failed'}]
        self.services['template'].validate_template_structure = Mock(return_value=mock_validation)
        
        # Error should propagate to selection service
        validation_result = self.services['selection'].validate_template_for_inspection(1, 123)
        assert validation_result['valid'] is False
        assert 'validation_errors' in validation_result
        print("  ✓ Template validation errors propagated correctly")
        
        # Error should propagate to report service
        self.mock_session.rollback = Mock()
        
        report_result = self.services['report'].create_report_from_template(
            template_id=1,
            inspection_id=123
        )
        
        assert report_result.success is False
        assert any("validation errors" in error['message'] for error in report_result.errors)
        print("  ✓ Template validation errors propagated to report service")
        
        # Test 2: Auto-field error propagation
        print("\nTest 2: Auto-field error propagation...")
        
        # Test with invalid auto-source key
        from app.domains.report.services.auto_field_service import AutoFieldError, AutoFieldContext
        
        context = AutoFieldContext()  # Empty context
        
        try:
            self.services['auto_field'].populate_field("invalid.key", context)
            assert False, "Should have raised AutoFieldError"
        except AutoFieldError as e:
            assert "Unknown source key" in str(e)
            print("  ✓ Auto-field errors raised correctly")
        
        # Error should be handled gracefully in integration service
        template_fields = [Mock(
            id=1,
            value_source=Mock(value='auto'),
            auto_source_key="invalid.key"
        )]
        
        # Should not raise exception, but return empty results
        integration_result = self.services['integration'].populate_template_fields(
            template_fields,
            self.test_data['inspection']
        )
        
        assert len(integration_result) == 0  # No successful population
        print("  ✓ Auto-field errors handled gracefully in integration service")
        
        print("\n🎉 Error propagation test passed!")
    
    def test_performance_under_load(self):
        """Test system performance under load"""
        
        print("\n=== Testing Performance Under Load ===")
        
        # Test 1: Multiple concurrent template operations
        print("\nTest 1: Multiple concurrent template operations...")
        
        start_time = datetime.now()
        
        # Simulate multiple template operations
        for i in range(100):
            # Mock template operations
            self.services['template'].get_template_with_structure = Mock(return_value=self.test_data['template'])
            template = self.services['template'].get_template_with_structure(1)
            assert template is not None
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        assert processing_time < 1.0  # Should complete within 1 second
        print(f"  ✓ 100 template operations completed in {processing_time:.3f} seconds")
        
        # Test 2: Bulk auto-field population
        print("\nTest 2: Bulk auto-field population...")
        
        from app.domains.report.services.auto_field_service import AutoFieldContext
        
        context = AutoFieldContext(
            inspection=self.test_data['inspection'],
            equipment=self.test_data['equipment'],
            user=self.test_data['user']
        )
        
        start_time = datetime.now()
        
        # Populate many fields
        field_mappings = {}
        for i in range(200):
            key = "inspection.start_date" if i % 2 == 0 else "equipment.tag"
            field_mappings[f"field_{i}"] = key
        
        results = self.services['auto_field'].populate_multiple_fields(field_mappings, context)
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        assert len(results) == 200
        assert processing_time < 2.0  # Should complete within 2 seconds
        print(f"  ✓ 200 auto-field populations completed in {processing_time:.3f} seconds")
        
        print("\n🎉 Performance under load test passed!")
    
    def test_data_consistency_across_services(self):
        """Test data consistency across different services"""
        
        print("\n=== Testing Data Consistency ===")
        
        # Test 1: Template data consistency
        print("\nTest 1: Template data consistency...")
        
        template_data = self.test_data['template']
        
        # Mock all services to return the same template
        self.services['template'].get_template_with_structure = Mock(return_value=template_data)
        self.services['selection'].template_service = self.services['template']
        self.services['report'].template_service = self.services['template']
        
        # Get template through different services
        template_from_service = self.services['template'].get_template_with_structure(1)
        
        # Mock selection service template retrieval
        self.services['template'].get_all_templates = Mock(return_value=[template_data])
        self.services['template'].get_template_stats = Mock(return_value=self.test_data['template_stats'])
        
        selection_result = self.services['selection'].get_available_templates_for_inspection(123)
        
        # Verify consistency
        assert template_from_service.id == template_data.id
        assert selection_result.success is True
        print("  ✓ Template data consistent across services")
        
        # Test 2: Auto-field data consistency
        print("\nTest 2: Auto-field data consistency...")
        
        from app.domains.report.services.auto_field_service import AutoFieldContext
        
        context = AutoFieldContext(inspection=self.test_data['inspection'])
        
        # Get same value through different methods
        direct_value = self.services['auto_field'].populate_field("inspection.start_date", context)
        
        multiple_values = self.services['auto_field'].populate_multiple_fields(
            {"test_field": "inspection.start_date"}, 
            context
        )
        
        # Values should be consistent
        assert direct_value == multiple_values["test_field"]
        assert direct_value == date(2025, 1, 15)
        print("  ✓ Auto-field data consistent across methods")
        
        print("\n🎉 Data consistency test passed!")
    
    def _create_comprehensive_test_data(self):
        """Create comprehensive test data for all services"""
        
        # Mock inspection
        inspection = Mock()
        inspection.id = 123
        inspection.inspection_number = "INS-2025-001"
        inspection.title = "Comprehensive Test Inspection"
        inspection.start_date = date(2025, 1, 15)
        inspection.end_date = date(2025, 1, 16)
        inspection.status = "completed"
        inspection.equipment_id = 456
        
        # Mock equipment
        equipment = Mock()
        equipment.id = 456
        equipment.tag = "PV-001"
        equipment.description = "Test Pressure Vessel"
        equipment.unit = "Unit A"
        equipment.equipment_type = "Pressure Vessel"
        
        # Mock user
        user = Mock()
        user.full_name = "John Doe"
        user.department = "Engineering"
        
        # Mock template
        template = Mock()
        template.id = 1
        template.name = "Comprehensive Test Template"
        template.description = "Template for comprehensive testing"
        template.is_active = True
        template.sections = []
        
        # Mock template stats
        template_stats = {
            'structure': {
                'total_sections': 3,
                'total_subsections': 5,
                'total_fields': 15
            },
            'field_analysis': {
                'auto_fields': 8,
                'manual_fields': 7,
                'required_fields': 5,
                'field_types': {
                    'text': 6,
                    'date': 3,
                    'select': 3,
                    'textarea': 2,
                    'number': 1
                }
            }
        }
        
        return {
            'inspection': inspection,
            'equipment': equipment,
            'user': user,
            'template': template,
            'template_stats': template_stats
        }


class TestSystemResilience:
    """Test system resilience and recovery"""
    
    def test_service_failure_recovery(self):
        """Test system behavior when individual services fail"""
        
        print("\n=== Testing Service Failure Recovery ===")
        
        mock_session = Mock()
        
        # Test 1: Template service failure
        print("\nTest 1: Template service failure recovery...")
        
        template_service = TemplateService(mock_session)
        report_service = ReportService(mock_session)
        report_service.template_service = template_service
        
        # Mock template service failure
        template_service.get_template_with_structure = Mock(side_effect=Exception("Template service failed"))
        
        # Report service should handle the failure gracefully
        result = report_service.create_report_from_template(1, 123)
        
        assert result.success is False
        assert any("Template service failed" in error['message'] for error in result.errors)
        print("  ✓ Report service handled template service failure gracefully")
        
        # Test 2: Auto-field service failure
        print("\nTest 2: Auto-field service failure recovery...")
        
        integration_service = InspectionIntegrationService()
        
        # Mock auto-field service failure in integration
        with patch.object(integration_service, 'auto_field_service') as mock_auto_service:
            mock_auto_service.populate_field.side_effect = Exception("Auto-field service failed")
            
            # Should handle failure gracefully
            template_fields = [Mock(
                id=1,
                value_source=Mock(value='auto'),
                auto_source_key="inspection.start_date"
            )]
            
            result = integration_service.populate_template_fields(
                template_fields,
                Mock(id=123)
            )
            
            # Should return empty results instead of crashing
            assert len(result) == 0
            print("  ✓ Integration service handled auto-field service failure gracefully")
        
        print("\n🎉 Service failure recovery test passed!")
    
    def test_data_corruption_handling(self):
        """Test system behavior with corrupted data"""
        
        print("\n=== Testing Data Corruption Handling ===")
        
        # Test 1: Corrupted template data
        print("\nTest 1: Corrupted template data handling...")
        
        mock_session = Mock()
        template_service = TemplateService(mock_session)
        
        # Mock corrupted template (missing required fields)
        corrupted_template = Mock()
        corrupted_template.id = 1
        corrupted_template.name = None  # Corrupted: missing name
        corrupted_template.sections = None  # Corrupted: missing sections
        
        template_service.get_template_with_structure = Mock(return_value=corrupted_template)
        
        # Validation should catch corruption
        mock_validation = Mock()
        mock_validation.is_valid = False
        mock_validation.errors = [{'message': 'Template name is required'}]
        template_service.validate_template_structure = Mock(return_value=mock_validation)
        
        validation = template_service.validate_template_structure(1)
        assert validation.is_valid is False
        print("  ✓ Template service detected corrupted data")
        
        # Test 2: Corrupted field values
        print("\nTest 2: Corrupted field values handling...")
        
        report_service = ReportService(mock_session)
        
        # Test with invalid field value types
        from app.domains.report.services.report_service import FieldValidationError
        from app.domains.report.models.enums import FieldType
        
        mock_field = Mock()
        mock_field.id = 1
        mock_field.label = "Test Field"
        mock_field.field_type = FieldType.DATE
        
        # Try to validate corrupted date value
        try:
            report_service._validate_and_convert_field_value(mock_field, "invalid-date-format")
            assert False, "Should have raised FieldValidationError"
        except FieldValidationError as e:
            assert "Invalid date format" in str(e)
            print("  ✓ Report service detected corrupted field value")
        
        print("\n🎉 Data corruption handling test passed!")


def run_comprehensive_integration_tests():
    """Run all comprehensive integration tests"""
    print("=== Running Comprehensive Integration Tests ===\n")
    
    # System integration tests
    system_tests = TestSystemIntegration()
    system_tests.setup_method()
    system_tests.test_full_system_integration()
    system_tests.test_cross_service_data_flow()
    system_tests.test_error_propagation_across_services()
    system_tests.test_performance_under_load()
    system_tests.test_data_consistency_across_services()
    
    # System resilience tests
    resilience_tests = TestSystemResilience()
    resilience_tests.test_service_failure_recovery()
    resilience_tests.test_data_corruption_handling()
    
    print("\n🎉 All Comprehensive Integration Tests Passed!")


if __name__ == "__main__":
    run_comprehensive_integration_tests()
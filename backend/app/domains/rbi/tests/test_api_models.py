"""Tests for RBI API Models"""

import pytest
from datetime import datetime, timedelta
from pydantic import ValidationError

from app.domains.rbi.models.api_models import (
    RBICalculationRequest,
    RBICalculationResponse,
    BatchCalculationRequest,
    ConfigurationRequest,
    ReportRequest,
    ParameterAdjustmentRequest,
    ErrorResponse,
    PaginationParams,
    FilterParams
)
from app.domains.rbi.models.core import (
    EquipmentData,
    RBICalculationResult,
    RiskLevel,
    RBILevel,
    EquipmentType,
    ServiceType
)


class TestRBICalculationRequest:
    """Test RBI calculation request model"""
    
    def test_valid_calculation_request(self):
        """Test valid calculation request"""
        
        equipment_data = EquipmentData(
            equipment_id="TEST-001",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime.now() - timedelta(days=15*365),
            design_pressure=25.0,
            design_temperature=150.0,
            material="Carbon Steel",
            criticality_level="High"
        )
        
        request = RBICalculationRequest(
            equipment_id="TEST-001",
            equipment_data=equipment_data,
            user_id="test_user"
        )
        
        assert request.equipment_id == "TEST-001"
        assert request.equipment_data.equipment_type == EquipmentType.PRESSURE_VESSEL
        assert request.user_id == "test_user"
        assert request.force_calculation_level is None
        assert request.custom_parameters is None
    
    def test_calculation_request_with_optional_fields(self):
        """Test calculation request with optional fields"""
        
        equipment_data = EquipmentData(
            equipment_id="TEST-001",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime.now() - timedelta(days=15*365),
            design_pressure=25.0,
            design_temperature=150.0,
            material="Carbon Steel",
            criticality_level="High"
        )
        
        request = RBICalculationRequest(
            equipment_id="TEST-001",
            equipment_data=equipment_data,
            force_calculation_level="level_2",
            custom_parameters={"test_param": 1.5},
            user_id="test_user",
            calculation_context={"source": "api_test"}
        )
        
        assert request.force_calculation_level == "level_2"
        assert request.custom_parameters == {"test_param": 1.5}
        assert request.calculation_context == {"source": "api_test"}
    
    def test_invalid_calculation_request_empty_equipment_id(self):
        """Test invalid calculation request with empty equipment ID"""
        
        equipment_data = EquipmentData(
            equipment_id="TEST-001",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime.now() - timedelta(days=15*365),
            design_pressure=25.0,
            design_temperature=150.0,
            material="Carbon Steel",
            criticality_level="High"
        )
        
        with pytest.raises(ValidationError):
            RBICalculationRequest(
                equipment_id="",  # Empty string should fail
                equipment_data=equipment_data
            )


class TestBatchCalculationRequest:
    """Test batch calculation request model"""
    
    def test_valid_batch_request(self):
        """Test valid batch calculation request"""
        
        equipment_list = [
            EquipmentData(
                equipment_id="TEST-001",
                equipment_type=EquipmentType.PRESSURE_VESSEL,
                service_type=ServiceType.SOUR_GAS,
                installation_date=datetime.now() - timedelta(days=15*365),
                design_pressure=25.0,
                design_temperature=150.0,
                material="Carbon Steel",
                criticality_level="High"
            ),
            EquipmentData(
                equipment_id="TEST-002",
                equipment_type=EquipmentType.TANK,
                service_type=ServiceType.WATER,
                installation_date=datetime.now() - timedelta(days=10*365),
                design_pressure=5.0,
                design_temperature=80.0,
                material="Carbon Steel",
                criticality_level="Medium"
            )
        ]
        
        request = BatchCalculationRequest(
            equipment_list=equipment_list,
            user_id="test_user"
        )
        
        assert len(request.equipment_list) == 2
        assert request.user_id == "test_user"
        assert request.inspection_data_map is None
    
    def test_batch_request_empty_list(self):
        """Test batch request with empty equipment list"""
        
        with pytest.raises(ValidationError) as exc_info:
            BatchCalculationRequest(
                equipment_list=[],  # Empty list should fail
                user_id="test_user"
            )
        
        assert "Equipment list cannot be empty" in str(exc_info.value)
    
    def test_batch_request_too_many_items(self):
        """Test batch request with too many items"""
        
        # Create list with more than 100 items
        equipment_list = []
        for i in range(101):
            equipment_list.append(
                EquipmentData(
                    equipment_id=f"TEST-{i:03d}",
                    equipment_type=EquipmentType.PRESSURE_VESSEL,
                    service_type=ServiceType.SOUR_GAS,
                    installation_date=datetime.now() - timedelta(days=15*365),
                    design_pressure=25.0,
                    design_temperature=150.0,
                    material="Carbon Steel",
                    criticality_level="High"
                )
            )
        
        with pytest.raises(ValidationError) as exc_info:
            BatchCalculationRequest(
                equipment_list=equipment_list,
                user_id="test_user"
            )
        
        assert "Maximum 100 equipment items per batch" in str(exc_info.value)


class TestConfigurationRequest:
    """Test configuration request model"""
    
    def test_valid_configuration_request(self):
        """Test valid configuration request"""
        
        request = ConfigurationRequest(
            configuration_updates={
                "scoring_tables": {
                    "pof_corrosion_rate": {
                        "low": {"min": 0, "max": 0.1, "score": 1}
                    }
                }
            },
            user_id="admin",
            update_reason="Test update"
        )
        
        assert "scoring_tables" in request.configuration_updates
        assert request.user_id == "admin"
        assert request.update_reason == "Test update"
        assert request.validate_only is False
    
    def test_configuration_request_validate_only(self):
        """Test configuration request with validate_only flag"""
        
        request = ConfigurationRequest(
            configuration_updates={"test": "config"},
            user_id="admin",
            validate_only=True
        )
        
        assert request.validate_only is True


class TestParameterAdjustmentRequest:
    """Test parameter adjustment request model"""
    
    def test_valid_parameter_adjustment_request(self):
        """Test valid parameter adjustment request"""
        
        request = ParameterAdjustmentRequest(
            equipment_id="TEST-001",
            current_parameters={
                "corrosion_rate_factor": 1.2,
                "age_factor": 1.15,
                "inspection_effectiveness": 0.75,
                "material_factor": 1.1,
                "environmental_factor": 1.3
            },
            adjustment_strategy="balanced",
            user_id="test_user"
        )
        
        assert request.equipment_id == "TEST-001"
        assert len(request.current_parameters) == 5
        assert request.adjustment_strategy == "balanced"
        assert request.force_adjustment is False
    
    def test_parameter_adjustment_request_with_force(self):
        """Test parameter adjustment request with force flag"""
        
        request = ParameterAdjustmentRequest(
            equipment_id="TEST-001",
            current_parameters={"test_param": 1.0},
            force_adjustment=True,
            user_id="test_user"
        )
        
        assert request.force_adjustment is True


class TestResponseModels:
    """Test response models"""
    
    def test_rbi_calculation_response(self):
        """Test RBI calculation response model"""
        
        calculation_result = RBICalculationResult(
            equipment_id="TEST-001",
            calculation_timestamp=datetime.now(),
            risk_level=RiskLevel.MEDIUM,
            inspection_interval_months=18,
            next_inspection_date=datetime.now() + timedelta(days=540),
            calculation_level=RBILevel.LEVEL_2,
            confidence_score=0.85,
            data_quality_score=0.80,
            calculation_successful=True,
            input_parameters={"test": "value"},
            intermediate_results={"pof_score": 3.2, "cof_score": 2.8},
            recommendations=["Monitor corrosion rate"],
            warnings=[]
        )
        
        response = RBICalculationResponse(
            success=True,
            calculation_result=calculation_result,
            message="Calculation completed successfully",
            calculation_timestamp=datetime.now()
        )
        
        assert response.success is True
        assert response.calculation_result.equipment_id == "TEST-001"
        assert response.message == "Calculation completed successfully"
        assert response.warnings is None
    
    def test_error_response(self):
        """Test error response model"""
        
        response = ErrorResponse(
            error_code=400,
            error_message="Invalid request data",
            timestamp=datetime.now()
        )
        
        assert response.success is False
        assert response.error_code == 400
        assert response.error_message == "Invalid request data"
        assert response.error_details is None


class TestUtilityModels:
    """Test utility models"""
    
    def test_pagination_params(self):
        """Test pagination parameters"""
        
        params = PaginationParams(page=2, page_size=25)
        
        assert params.page == 2
        assert params.page_size == 25
        assert params.offset == 25  # (2-1) * 25
        assert params.limit == 25
    
    def test_pagination_params_defaults(self):
        """Test pagination parameters with defaults"""
        
        params = PaginationParams()
        
        assert params.page == 1
        assert params.page_size == 20
        assert params.offset == 0
        assert params.limit == 20
    
    def test_pagination_params_validation(self):
        """Test pagination parameters validation"""
        
        # Test invalid page number
        with pytest.raises(ValidationError):
            PaginationParams(page=0)  # Should be >= 1
        
        # Test invalid page size
        with pytest.raises(ValidationError):
            PaginationParams(page_size=0)  # Should be >= 1
        
        with pytest.raises(ValidationError):
            PaginationParams(page_size=150)  # Should be <= 100
    
    def test_filter_params(self):
        """Test filter parameters"""
        
        start_date = datetime.now() - timedelta(days=30)
        end_date = datetime.now()
        
        params = FilterParams(
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            risk_level=RiskLevel.HIGH,
            calculation_level=RBILevel.LEVEL_2,
            start_date=start_date,
            end_date=end_date
        )
        
        assert params.equipment_type == EquipmentType.PRESSURE_VESSEL
        assert params.service_type == ServiceType.SOUR_GAS
        assert params.risk_level == RiskLevel.HIGH
        assert params.calculation_level == RBILevel.LEVEL_2
        assert params.start_date == start_date
        assert params.end_date == end_date
    
    def test_filter_params_invalid_date_range(self):
        """Test filter parameters with invalid date range"""
        
        start_date = datetime.now()
        end_date = datetime.now() - timedelta(days=30)  # End before start
        
        with pytest.raises(ValidationError) as exc_info:
            FilterParams(
                start_date=start_date,
                end_date=end_date
            )
        
        assert "End date must be after start date" in str(exc_info.value)


class TestModelSerialization:
    """Test model serialization and deserialization"""
    
    def test_request_model_json_serialization(self):
        """Test request model JSON serialization"""
        
        equipment_data = EquipmentData(
            equipment_id="TEST-001",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime.now() - timedelta(days=15*365),
            design_pressure=25.0,
            design_temperature=150.0,
            material="Carbon Steel",
            criticality_level="High"
        )
        
        request = RBICalculationRequest(
            equipment_id="TEST-001",
            equipment_data=equipment_data,
            user_id="test_user"
        )
        
        # Test JSON serialization
        json_data = request.json()
        assert isinstance(json_data, str)
        assert "TEST-001" in json_data
        assert "pressure_vessel" in json_data
    
    def test_response_model_dict_conversion(self):
        """Test response model dictionary conversion"""
        
        response = ErrorResponse(
            error_code=404,
            error_message="Not found",
            timestamp=datetime.now()
        )
        
        # Test dictionary conversion
        response_dict = response.dict()
        assert isinstance(response_dict, dict)
        assert response_dict["success"] is False
        assert response_dict["error_code"] == 404
        assert response_dict["error_message"] == "Not found"
        assert "timestamp" in response_dict


if __name__ == "__main__":
    pytest.main([__file__])
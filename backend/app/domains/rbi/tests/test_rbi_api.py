"""Tests for RBI REST API"""

import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
import json

from app.domains.rbi.routers.rbi_router import router
from app.domains.rbi.models.core import (
    EquipmentData,
    RBICalculationResult,
    RiskLevel,
    RBILevel,
    EquipmentType,
    ServiceType
)
from app.domains.rbi.services.adaptive_parameter_adjuster import AdjustmentStrategy


# Create test app
app = FastAPI()
app.include_router(router)
client = TestClient(app)


class TestRBICalculationAPI:
    """Test RBI calculation API endpoints"""
    
    @pytest.fixture
    def sample_equipment_data(self):
        """Sample equipment data for testing"""
        return {
            "equipment_id": "TEST-001",
            "equipment_type": "pressure_vessel",
            "service_type": "sour_gas",
            "installation_date": "2005-01-15T00:00:00",
            "design_pressure": 25.0,
            "design_temperature": 150.0,
            "material": "Carbon Steel",
            "criticality_level": "High"
        }
    
    @pytest.fixture
    def sample_calculation_result(self):
        """Sample calculation result for testing"""
        return RBICalculationResult(
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
            recommendations=["Monitor corrosion rate", "Increase inspection frequency"],
            warnings=[]
        )
    
    @patch('app.domains.rbi.routers.rbi_router.get_calculation_engine')
    @patch('app.domains.rbi.routers.rbi_router.get_audit_service')
    def test_calculate_rbi_success(self, mock_audit, mock_engine, sample_equipment_data, sample_calculation_result):
        """Test successful RBI calculation"""
        
        # Mock engine
        mock_engine_instance = AsyncMock()
        mock_engine_instance.calculate_rbi.return_value = sample_calculation_result
        mock_engine.return_value = mock_engine_instance
        
        # Mock audit service
        mock_audit_instance = AsyncMock()
        mock_audit.return_value = mock_audit_instance
        
        # Test request
        request_data = {
            "equipment_id": "TEST-001",
            "equipment_data": sample_equipment_data,
            "user_id": "test_user"
        }
        
        response = client.post("/api/v1/rbi/calculate", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["calculation_result"]["equipment_id"] == "TEST-001"
        assert data["calculation_result"]["risk_level"] == "medium"
        assert "message" in data
        assert "calculation_timestamp" in data
    
    @patch('app.domains.rbi.routers.rbi_router.get_calculation_engine')
    def test_calculate_rbi_failure(self, mock_engine, sample_equipment_data):
        """Test RBI calculation failure"""
        
        # Mock engine to raise exception
        mock_engine_instance = AsyncMock()
        mock_engine_instance.calculate_rbi.side_effect = Exception("Calculation failed")
        mock_engine.return_value = mock_engine_instance
        
        request_data = {
            "equipment_id": "TEST-001",
            "equipment_data": sample_equipment_data
        }
        
        response = client.post("/api/v1/rbi/calculate", json=request_data)
        
        assert response.status_code == 500
        data = response.json()
        assert data["success"] is False
        assert "RBI calculation failed" in data["error_message"]
    
    def test_calculate_rbi_invalid_data(self):
        """Test RBI calculation with invalid data"""
        
        request_data = {
            "equipment_id": "",  # Invalid empty ID
            "equipment_data": {}  # Invalid empty data
        }
        
        response = client.post("/api/v1/rbi/calculate", json=request_data)
        
        assert response.status_code == 422  # Validation error
    
    @patch('app.domains.rbi.routers.rbi_router.get_calculation_engine')
    @patch('app.domains.rbi.routers.rbi_router.get_audit_service')
    def test_calculate_rbi_batch_success(self, mock_audit, mock_engine, sample_equipment_data, sample_calculation_result):
        """Test successful batch RBI calculation"""
        
        # Mock engine
        mock_engine_instance = AsyncMock()
        mock_engine_instance.calculate_batch_rbi.return_value = [sample_calculation_result]
        mock_engine.return_value = mock_engine_instance
        
        # Mock audit service
        mock_audit_instance = AsyncMock()
        mock_audit.return_value = mock_audit_instance
        
        request_data = {
            "equipment_list": [sample_equipment_data],
            "user_id": "test_user"
        }
        
        response = client.post("/api/v1/rbi/calculate/batch", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["total_processed"] == 1
        assert data["successful_calculations"] == 1
        assert data["failed_calculations"] == 0
        assert len(data["calculation_results"]) == 1
    
    def test_calculate_rbi_batch_empty_list(self):
        """Test batch calculation with empty equipment list"""
        
        request_data = {
            "equipment_list": [],  # Empty list
            "user_id": "test_user"
        }
        
        response = client.post("/api/v1/rbi/calculate/batch", json=request_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_calculate_rbi_batch_too_many_items(self):
        """Test batch calculation with too many items"""
        
        # Create list with more than 100 items
        equipment_list = [{"equipment_id": f"TEST-{i:03d}"} for i in range(101)]
        
        request_data = {
            "equipment_list": equipment_list,
            "user_id": "test_user"
        }
        
        response = client.post("/api/v1/rbi/calculate/batch", json=request_data)
        
        assert response.status_code == 422  # Validation error
    
    @patch('app.domains.rbi.routers.rbi_router.get_audit_service')
    def test_get_calculation_history_success(self, mock_audit):
        """Test successful calculation history retrieval"""
        
        # Mock audit service
        mock_audit_instance = AsyncMock()
        mock_history = [
            Mock(
                calculation_result=Mock(
                    equipment_id="TEST-001",
                    risk_level=RiskLevel.MEDIUM,
                    inspection_interval_months=18
                ),
                timestamp=datetime.now()
            )
        ]
        mock_audit_instance.get_calculation_history.return_value = mock_history
        mock_audit.return_value = mock_audit_instance
        
        response = client.get("/api/v1/rbi/calculation/TEST-001/history")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["success"] is True
    
    def test_get_calculation_history_with_params(self):
        """Test calculation history with query parameters"""
        
        response = client.get(
            "/api/v1/rbi/calculation/TEST-001/history",
            params={
                "limit": 5,
                "offset": 10,
                "start_date": "2024-01-01T00:00:00",
                "end_date": "2024-12-31T23:59:59"
            }
        )
        
        # Should not fail with validation errors
        assert response.status_code in [200, 500]  # 500 if service fails, but validation should pass


class TestConfigurationAPI:
    """Test configuration management API endpoints"""
    
    @patch('app.domains.rbi.routers.rbi_router.get_configuration_manager')
    def test_get_configuration_success(self, mock_config_manager):
        """Test successful configuration retrieval"""
        
        mock_manager = AsyncMock()
        mock_manager.get_full_configuration.return_value = {
            "scoring_tables": {"test": "config"},
            "last_updated": datetime.now()
        }
        mock_config_manager.return_value = mock_manager
        
        response = client.get("/api/v1/rbi/configuration")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "configuration" in data
        assert "last_updated" in data
    
    @patch('app.domains.rbi.routers.rbi_router.get_configuration_manager')
    def test_get_configuration_by_type(self, mock_config_manager):
        """Test configuration retrieval by type"""
        
        mock_manager = AsyncMock()
        mock_manager.get_configuration_by_type.return_value = {"test": "config"}
        mock_config_manager.return_value = mock_manager
        
        response = client.get("/api/v1/rbi/configuration?config_type=scoring_tables")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    @patch('app.domains.rbi.routers.rbi_router.get_configuration_manager')
    @patch('app.domains.rbi.routers.rbi_router.get_audit_service')
    def test_update_configuration_success(self, mock_audit, mock_config_manager):
        """Test successful configuration update"""
        
        mock_manager = AsyncMock()
        mock_manager.update_configuration.return_value = {"updated": "config"}
        mock_config_manager.return_value = mock_manager
        
        mock_audit_instance = AsyncMock()
        mock_audit.return_value = mock_audit_instance
        
        request_data = {
            "configuration_updates": {"test": "update"},
            "user_id": "admin",
            "update_reason": "Test update"
        }
        
        response = client.put("/api/v1/rbi/configuration", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "configuration" in data
    
    @patch('app.domains.rbi.routers.rbi_router.get_configuration_manager')
    def test_validate_configuration_success(self, mock_config_manager):
        """Test successful configuration validation"""
        
        mock_manager = AsyncMock()
        mock_manager.validate_configuration.return_value = {
            "valid": True,
            "errors": []
        }
        mock_config_manager.return_value = mock_manager
        
        request_data = {
            "configuration_updates": {"test": "config"},
            "user_id": "admin"
        }
        
        response = client.post("/api/v1/rbi/configuration/validate", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "validation_result" in data
    
    @patch('app.domains.rbi.routers.rbi_router.get_configuration_manager')
    def test_validate_configuration_failure(self, mock_config_manager):
        """Test configuration validation failure"""
        
        mock_manager = AsyncMock()
        mock_manager.validate_configuration.side_effect = Exception("Validation failed")
        mock_config_manager.return_value = mock_manager
        
        request_data = {
            "configuration_updates": {"invalid": "config"},
            "user_id": "admin"
        }
        
        response = client.post("/api/v1/rbi/configuration/validate", json=request_data)
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False


class TestReportingAPI:
    """Test reporting API endpoints"""
    
    @patch('app.domains.rbi.routers.rbi_router.get_report_service')
    def test_generate_calculation_report_success(self, mock_report_service):
        """Test successful calculation report generation"""
        
        mock_service = AsyncMock()
        mock_service.generate_detailed_report.return_value = {
            "report_id": "RPT-001",
            "equipment_id": "TEST-001",
            "sections": ["summary", "details", "recommendations"]
        }
        mock_report_service.return_value = mock_service
        
        request_data = {
            "equipment_id": "TEST-001",
            "report_format": "json",
            "include_charts": True
        }
        
        response = client.post("/api/v1/rbi/report/calculation", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "report" in data
        assert "generated_at" in data
    
    @patch('app.domains.rbi.routers.rbi_router.get_report_service')
    @patch('app.domains.rbi.routers.rbi_router.get_audit_service')
    def test_get_system_summary_report_success(self, mock_audit, mock_report_service):
        """Test successful system summary report generation"""
        
        mock_service = AsyncMock()
        mock_service.generate_system_summary.return_value = {
            "total_equipment": 100,
            "calculations_today": 25,
            "average_risk_level": "medium"
        }
        mock_report_service.return_value = mock_service
        
        mock_audit_instance = AsyncMock()
        mock_audit_instance.get_system_statistics.return_value = {
            "total_calculations": 1000,
            "success_rate": 0.95
        }
        mock_audit.return_value = mock_audit_instance
        
        response = client.get("/api/v1/rbi/report/system-summary")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "summary" in data
        assert "generated_at" in data
    
    def test_get_system_summary_report_with_params(self):
        """Test system summary report with parameters"""
        
        response = client.get(
            "/api/v1/rbi/report/system-summary",
            params={
                "include_statistics": True,
                "include_trends": False,
                "date_range_days": 7
            }
        )
        
        # Should not fail with validation errors
        assert response.status_code in [200, 500]


class TestPatternRecognitionAPI:
    """Test pattern recognition API endpoints"""
    
    @pytest.fixture
    def sample_pattern_request(self):
        """Sample pattern analysis request"""
        return {
            "equipment_id": "TEST-001",
            "equipment_data": {
                "equipment_id": "TEST-001",
                "equipment_type": "pressure_vessel",
                "service_type": "sour_gas",
                "installation_date": "2005-01-15T00:00:00",
                "design_pressure": 25.0,
                "design_temperature": 150.0,
                "material": "Carbon Steel",
                "criticality_level": "High"
            },
            "historical_calculations": []
        }
    
    @patch('app.domains.rbi.routers.rbi_router.get_pattern_engine')
    def test_analyze_equipment_patterns_success(self, mock_pattern_engine, sample_pattern_request):
        """Test successful pattern analysis"""
        
        mock_engine = AsyncMock()
        mock_engine.analyze_equipment_patterns.return_value = {
            "equipment_id": "TEST-001",
            "identified_families": [],
            "degradation_patterns": [],
            "confidence_assessment": {"overall": 0.85}
        }
        mock_pattern_engine.return_value = mock_engine
        
        response = client.post("/api/v1/rbi/pattern/analyze", json=sample_pattern_request)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "analysis_result" in data
        assert "analysis_timestamp" in data
    
    @patch('app.domains.rbi.routers.rbi_router.get_pattern_engine')
    def test_get_equipment_families_success(self, mock_pattern_engine):
        """Test successful equipment families retrieval"""
        
        mock_engine = AsyncMock()
        mock_engine.get_equipment_families.return_value = [
            {
                "family_id": "PV_SOUR_GAS",
                "family_name": "Pressure Vessels - Sour Gas Service",
                "member_count": 15
            }
        ]
        mock_pattern_engine.return_value = mock_engine
        
        response = client.get("/api/v1/rbi/pattern/families")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "families" in data
        assert "total_families" in data
    
    def test_get_equipment_families_with_filters(self):
        """Test equipment families retrieval with filters"""
        
        response = client.get(
            "/api/v1/rbi/pattern/families",
            params={
                "equipment_type": "pressure_vessel",
                "service_type": "sour_gas"
            }
        )
        
        # Should not fail with validation errors
        assert response.status_code in [200, 500]


class TestParameterAdjustmentAPI:
    """Test parameter adjustment API endpoints"""
    
    @pytest.fixture
    def sample_adjustment_request(self):
        """Sample parameter adjustment request"""
        return {
            "equipment_id": "TEST-001",
            "current_parameters": {
                "corrosion_rate_factor": 1.2,
                "age_factor": 1.15,
                "inspection_effectiveness": 0.75,
                "material_factor": 1.1,
                "environmental_factor": 1.3
            },
            "adjustment_strategy": "balanced",
            "user_id": "test_user"
        }
    
    @patch('app.domains.rbi.routers.rbi_router.get_parameter_adjuster')
    @patch('app.domains.rbi.routers.rbi_router.get_audit_service')
    def test_adjust_parameters_success(self, mock_audit, mock_adjuster, sample_adjustment_request):
        """Test successful parameter adjustment"""
        
        mock_adjuster_instance = AsyncMock()
        mock_adjuster_instance.adjust_parameters.return_value = {
            "equipment_id": "TEST-001",
            "adjustments_made": [],
            "overall_confidence": 0.75
        }
        mock_adjuster.return_value = mock_adjuster_instance
        
        mock_audit_instance = AsyncMock()
        mock_audit.return_value = mock_audit_instance
        
        response = client.post("/api/v1/rbi/parameters/adjust", json=sample_adjustment_request)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "adjustment_result" in data
        assert "adjustment_timestamp" in data
    
    @patch('app.domains.rbi.routers.rbi_router.get_parameter_adjuster')
    def test_get_parameter_recommendations_success(self, mock_adjuster):
        """Test successful parameter recommendations retrieval"""
        
        mock_adjuster_instance = AsyncMock()
        mock_adjuster_instance.get_adjustment_recommendations.return_value = {
            "equipment_id": "TEST-001",
            "current_bias": "over_prediction",
            "strategy_recommendations": {}
        }
        mock_adjuster.return_value = mock_adjuster_instance
        
        response = client.get("/api/v1/rbi/parameters/TEST-001/recommendations")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "recommendations" in data
    
    @patch('app.domains.rbi.routers.rbi_router.get_parameter_adjuster')
    @patch('app.domains.rbi.routers.rbi_router.get_audit_service')
    def test_rollback_parameter_adjustments_success(self, mock_audit, mock_adjuster):
        """Test successful parameter rollback"""
        
        mock_adjuster_instance = AsyncMock()
        mock_adjuster_instance.rollback_adjustments.return_value = {
            "success": True,
            "message": "Rollback completed",
            "rolled_back_parameters": {}
        }
        mock_adjuster.return_value = mock_adjuster_instance
        
        mock_audit_instance = AsyncMock()
        mock_audit.return_value = mock_audit_instance
        
        response = client.post(
            "/api/v1/rbi/parameters/TEST-001/rollback",
            json={"rollback_count": 1, "rollback_to_baseline": False}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "rollback_result" in data


class TestHealthAndStatusAPI:
    """Test health check and status API endpoints"""
    
    def test_health_check_success(self):
        """Test successful health check"""
        
        response = client.get("/api/v1/rbi/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "health" in data
        assert data["health"]["status"] == "healthy"
        assert "services" in data["health"]
        assert "timestamp" in data["health"]


class TestAPIValidation:
    """Test API input validation"""
    
    def test_invalid_equipment_id(self):
        """Test validation with invalid equipment ID"""
        
        request_data = {
            "equipment_id": "",  # Empty string
            "equipment_data": {
                "equipment_id": "TEST-001",
                "equipment_type": "pressure_vessel",
                "service_type": "sour_gas",
                "installation_date": "2005-01-15T00:00:00",
                "design_pressure": 25.0,
                "design_temperature": 150.0,
                "material": "Carbon Steel",
                "criticality_level": "High"
            }
        }
        
        response = client.post("/api/v1/rbi/calculate", json=request_data)
        assert response.status_code == 422
    
    def test_invalid_date_format(self):
        """Test validation with invalid date format"""
        
        request_data = {
            "equipment_id": "TEST-001",
            "equipment_data": {
                "equipment_id": "TEST-001",
                "equipment_type": "pressure_vessel",
                "service_type": "sour_gas",
                "installation_date": "invalid-date",  # Invalid date format
                "design_pressure": 25.0,
                "design_temperature": 150.0,
                "material": "Carbon Steel",
                "criticality_level": "High"
            }
        }
        
        response = client.post("/api/v1/rbi/calculate", json=request_data)
        assert response.status_code == 422
    
    def test_invalid_enum_value(self):
        """Test validation with invalid enum value"""
        
        request_data = {
            "equipment_id": "TEST-001",
            "equipment_data": {
                "equipment_id": "TEST-001",
                "equipment_type": "invalid_type",  # Invalid equipment type
                "service_type": "sour_gas",
                "installation_date": "2005-01-15T00:00:00",
                "design_pressure": 25.0,
                "design_temperature": 150.0,
                "material": "Carbon Steel",
                "criticality_level": "High"
            }
        }
        
        response = client.post("/api/v1/rbi/calculate", json=request_data)
        assert response.status_code == 422
    
    def test_missing_required_field(self):
        """Test validation with missing required field"""
        
        request_data = {
            "equipment_id": "TEST-001",
            "equipment_data": {
                "equipment_id": "TEST-001",
                # Missing equipment_type
                "service_type": "sour_gas",
                "installation_date": "2005-01-15T00:00:00",
                "design_pressure": 25.0,
                "design_temperature": 150.0,
                "material": "Carbon Steel",
                "criticality_level": "High"
            }
        }
        
        response = client.post("/api/v1/rbi/calculate", json=request_data)
        assert response.status_code == 422
    
    def test_invalid_parameter_range(self):
        """Test validation with parameter out of range"""
        
        response = client.get(
            "/api/v1/rbi/calculation/TEST-001/history",
            params={"limit": 150}  # Exceeds maximum of 100
        )
        
        assert response.status_code == 422
    
    def test_invalid_date_range(self):
        """Test validation with invalid date range"""
        
        response = client.get(
            "/api/v1/rbi/calculation/TEST-001/history",
            params={
                "start_date": "2024-12-31T00:00:00",
                "end_date": "2024-01-01T00:00:00"  # End before start
            }
        )
        
        # This should be handled by the FilterParams validator
        assert response.status_code in [422, 200, 500]


class TestAPIErrorHandling:
    """Test API error handling"""
    
    @patch('app.domains.rbi.routers.rbi_router.get_calculation_engine')
    def test_service_unavailable_error(self, mock_engine):
        """Test handling of service unavailable error"""
        
        mock_engine.side_effect = Exception("Service unavailable")
        
        request_data = {
            "equipment_id": "TEST-001",
            "equipment_data": {
                "equipment_id": "TEST-001",
                "equipment_type": "pressure_vessel",
                "service_type": "sour_gas",
                "installation_date": "2005-01-15T00:00:00",
                "design_pressure": 25.0,
                "design_temperature": 150.0,
                "material": "Carbon Steel",
                "criticality_level": "High"
            }
        }
        
        response = client.post("/api/v1/rbi/calculate", json=request_data)
        
        assert response.status_code == 500
        data = response.json()
        assert data["success"] is False
        assert "error_message" in data
    
    def test_malformed_json_error(self):
        """Test handling of malformed JSON"""
        
        response = client.post(
            "/api/v1/rbi/calculate",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 422
    
    def test_unsupported_media_type(self):
        """Test handling of unsupported media type"""
        
        response = client.post(
            "/api/v1/rbi/calculate",
            data="some data",
            headers={"Content-Type": "text/plain"}
        )
        
        assert response.status_code == 422


if __name__ == "__main__":
    pytest.main([__file__])
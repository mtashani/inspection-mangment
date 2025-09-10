"""Tests for scoring tables service"""

import pytest
from app.domains.rbi.services.scoring_tables_service import ScoringTablesService
from app.domains.rbi.models.config import ScoringTable, ScoringTablesConfig
from app.domains.rbi.models.core import ServiceType


class TestScoringTablesService:
    """Test ScoringTablesService"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.service = ScoringTablesService()
    
    def test_get_pof_table(self):
        """Test getting PoF scoring table"""
        table = self.service.get_pof_table("corrosion_rate")
        
        assert table is not None
        assert table.parameter_name == "corrosion_rate"
        assert "0-0.05" in table.scoring_rules
        assert table.scoring_rules["0-0.05"] == 1
    
    def test_get_cof_table(self):
        """Test getting CoF scoring table"""
        table = self.service.get_cof_table("safety", "fluid")
        
        assert table is not None
        assert table.parameter_name == "fluid"
        assert "sweet_gas" in table.scoring_rules
        assert table.scoring_rules["sweet_gas"] == 1
    
    def test_add_pof_table(self):
        """Test adding PoF scoring table"""
        new_table = ScoringTable(
            parameter_name="test_param",
            scoring_rules={"low": 1, "medium": 3, "high": 5},
            description="Test parameter"
        )
        
        self.service.add_pof_table(new_table)
        
        retrieved_table = self.service.get_pof_table("test_param")
        assert retrieved_table is not None
        assert retrieved_table.parameter_name == "test_param"
        assert retrieved_table.scoring_rules["medium"] == 3
    
    def test_add_cof_table(self):
        """Test adding CoF scoring table"""
        new_table = ScoringTable(
            parameter_name="test_cof_param",
            scoring_rules={"low": 1, "high": 3},
            description="Test CoF parameter"
        )
        
        self.service.add_cof_table("safety", new_table)
        
        retrieved_table = self.service.get_cof_table("safety", "test_cof_param")
        assert retrieved_table is not None
        assert retrieved_table.parameter_name == "test_cof_param"
    
    def test_remove_pof_table(self):
        """Test removing PoF scoring table"""
        # First add a table
        new_table = ScoringTable(
            parameter_name="temp_param",
            scoring_rules={"low": 1, "high": 5}
        )
        self.service.add_pof_table(new_table)
        
        # Verify it exists
        assert self.service.get_pof_table("temp_param") is not None
        
        # Remove it
        result = self.service.remove_pof_table("temp_param")
        assert result is True
        
        # Verify it's gone
        assert self.service.get_pof_table("temp_param") is None
        
        # Try to remove non-existent table
        result = self.service.remove_pof_table("non_existent")
        assert result is False
    
    def test_calculate_pof_score(self):
        """Test PoF score calculation"""
        parameter_values = {
            "corrosion_rate": 0.15,  # Should be score 3 (0.1-0.2 range)
            "equipment_age": 12,     # Should be score 3 (10-15 range)
            "coating_quality": "moderate"  # Should be score 2
        }
        
        score = self.service.calculate_pof_score(parameter_values)
        
        # Score should be weighted average
        assert 2.0 <= score <= 4.0
        assert isinstance(score, float)
    
    def test_calculate_cof_score(self):
        """Test CoF score calculation"""
        parameter_values = {
            "fluid": "sour_gas",  # Should be score 3
            "location": "open_area",  # Should be score 2
            "pressure": 15  # Should be score 2 (10-20 range)
        }
        
        score = self.service.calculate_cof_score("safety", parameter_values)
        
        # Score should be weighted average
        assert 2.0 <= score <= 3.0
        assert isinstance(score, float)
    
    def test_numeric_score_calculation(self):
        """Test numeric value scoring"""
        # Test corrosion rate scoring
        assert self.service._get_numeric_score(
            self.service.get_pof_table("corrosion_rate"), 0.03
        ) == 1  # 0-0.05 range
        
        assert self.service._get_numeric_score(
            self.service.get_pof_table("corrosion_rate"), 0.08
        ) == 2  # 0.05-0.1 range
        
        assert self.service._get_numeric_score(
            self.service.get_pof_table("corrosion_rate"), 0.6
        ) == 5  # >0.5 range
    
    def test_value_in_range(self):
        """Test range checking logic"""
        # Test range formats
        assert self.service._value_in_range(0.03, "0-0.05") is True
        assert self.service._value_in_range(0.08, "0-0.05") is False
        assert self.service._value_in_range(0.6, ">0.5") is True
        assert self.service._value_in_range(0.3, ">0.5") is False
        assert self.service._value_in_range(8, "<10") is True
        assert self.service._value_in_range(15, "<10") is False
    
    def test_service_type_scoring(self):
        """Test scoring with ServiceType enum"""
        parameter_values = {
            "fluid": ServiceType.SOUR_GAS
        }
        
        score = self.service.calculate_cof_score("safety", parameter_values)
        assert score > 0
    
    def test_validate_configuration(self):
        """Test configuration validation"""
        errors = self.service.validate_configuration()
        
        # Default configuration should be valid
        assert len(errors) == 0
        
        # Test that invalid table creation raises error
        with pytest.raises(ValueError, match="Score for .* must be between 1 and 5"):
            ScoringTable(
                parameter_name="invalid",
                scoring_rules={"test": 10}  # Score out of range
            )
    
    def test_create_custom_fluid_table(self):
        """Test creating custom fluid scoring tables"""
        custom_mappings = {
            "safety": {
                "custom_fluid_1": 2,
                "custom_fluid_2": 4
            },
            "environmental": {
                "custom_fluid_1": 3,
                "custom_fluid_2": 5
            }
        }
        
        self.service.create_custom_fluid_table(custom_mappings)
        
        # Check safety table
        safety_table = self.service.get_cof_table("safety", "fluid")
        assert safety_table.scoring_rules["custom_fluid_1"] == 2
        
        # Check environmental table
        env_table = self.service.get_cof_table("environmental", "fluid")
        assert env_table.scoring_rules["custom_fluid_1"] == 3
    
    def test_get_available_parameters(self):
        """Test getting available parameters"""
        params = self.service.get_available_parameters()
        
        assert "pof" in params
        assert "safety" in params
        assert "environmental" in params
        assert "economic" in params
        
        assert "corrosion_rate" in params["pof"]
        assert "fluid" in params["safety"]
    
    def test_export_import_configuration(self):
        """Test configuration export and import"""
        # Export current configuration
        exported = self.service.export_configuration()
        
        assert "pof_tables" in exported
        assert "cof_tables" in exported
        assert "corrosion_rate" in exported["pof_tables"]
        
        # Create new service and import
        new_service = ScoringTablesService(ScoringTablesConfig())
        new_service.import_configuration(exported)
        
        # Verify import worked
        table = new_service.get_pof_table("corrosion_rate")
        assert table is not None
        assert table.scoring_rules["0-0.05"] == 1
    
    def test_empty_parameter_values(self):
        """Test calculation with empty parameter values"""
        score = self.service.calculate_pof_score({})
        assert score == 0.0
        
        score = self.service.calculate_cof_score("safety", {})
        assert score == 0.0
    
    def test_unknown_parameter_handling(self):
        """Test handling of unknown parameters"""
        parameter_values = {
            "unknown_param": "some_value",
            "corrosion_rate": 0.1
        }
        
        # Should ignore unknown parameter and calculate based on known ones
        score = self.service.calculate_pof_score(parameter_values)
        assert score > 0  # Should still calculate based on corrosion_rate
"""Tests for risk matrix service"""

import pytest
from app.domains.rbi.services.risk_matrix_service import RiskMatrixService
from app.domains.rbi.models.config import RiskMatrixConfig
from app.domains.rbi.models.core import RiskLevel


class TestRiskMatrixService:
    """Test RiskMatrixService"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.service = RiskMatrixService()
    
    def test_get_risk_level(self):
        """Test getting risk level from PoF and CoF"""
        # Test some known mappings
        assert self.service.get_risk_level("Low", "Low") == RiskLevel.LOW
        assert self.service.get_risk_level("High", "High") == RiskLevel.VERY_HIGH
        assert self.service.get_risk_level("Medium", "Medium") == RiskLevel.MEDIUM
    
    def test_get_inspection_interval(self):
        """Test getting inspection interval"""
        assert self.service.get_inspection_interval(RiskLevel.LOW) == 36
        assert self.service.get_inspection_interval(RiskLevel.HIGH) == 12
        assert self.service.get_inspection_interval(RiskLevel.VERY_HIGH) == 6
    
    def test_set_risk_mapping(self):
        """Test setting custom risk mapping"""
        self.service.set_risk_mapping("Low", "Low", RiskLevel.MEDIUM)
        
        # Verify the change
        assert self.service.get_risk_level("Low", "Low") == RiskLevel.MEDIUM
    
    def test_set_inspection_interval(self):
        """Test setting inspection interval"""
        self.service.set_inspection_interval(RiskLevel.LOW, 48)
        
        assert self.service.get_inspection_interval(RiskLevel.LOW) == 48
    
    def test_invalid_inspection_interval(self):
        """Test validation of inspection interval"""
        with pytest.raises(ValueError, match="Inspection interval must be positive"):
            self.service.set_inspection_interval(RiskLevel.LOW, -5)
        
        with pytest.raises(ValueError, match="Inspection interval must be positive"):
            self.service.set_inspection_interval(RiskLevel.LOW, 0)
    
    def test_set_fallback_safety_factor(self):
        """Test setting fallback safety factor"""
        self.service.set_fallback_safety_factor("Level_3_to_Level_1", 2.0)
        
        factor = self.service.get_fallback_safety_factor("Level_3_to_Level_1")
        assert factor == 2.0
    
    def test_invalid_safety_factor(self):
        """Test validation of safety factor"""
        with pytest.raises(ValueError, match="Safety factor must be positive"):
            self.service.set_fallback_safety_factor("test", -1.0)
        
        with pytest.raises(ValueError, match="Safety factor must be positive"):
            self.service.set_fallback_safety_factor("test", 0.0)
    
    def test_calculate_adjusted_interval(self):
        """Test calculation of adjusted interval with safety factors"""
        # Without fallback
        adjusted = self.service.calculate_adjusted_interval(24)
        assert adjusted == 24
        
        # With fallback (default factor 1.2)
        adjusted = self.service.calculate_adjusted_interval(24, "Level_3_to_Level_2")
        expected = int(24 / 1.2)  # Should be 20
        assert adjusted == expected
        
        # Test minimum interval enforcement
        adjusted = self.service.calculate_adjusted_interval(3, "Level_3_to_Level_1")  # factor 1.5
        assert adjusted >= 3  # Should not go below 3 months
    
    def test_get_risk_matrix_as_dict(self):
        """Test getting risk matrix as dictionary"""
        matrix_dict = self.service.get_risk_matrix_as_dict()
        
        assert "Low" in matrix_dict
        assert "Medium" in matrix_dict
        assert "High" in matrix_dict
        assert "Very High" in matrix_dict
        
        # Check that each PoF level has CoF mappings
        for pof_level in matrix_dict:
            assert "Low" in matrix_dict[pof_level]
            assert "Medium" in matrix_dict[pof_level]
            assert "High" in matrix_dict[pof_level]
    
    def test_validate_matrix_completeness(self):
        """Test matrix completeness validation"""
        errors = self.service.validate_matrix_completeness()
        
        # Default matrix should be complete
        assert len(errors) == 0
        
        # Remove a mapping to test validation
        del self.service.config.matrix[("Low", "Low")]
        errors = self.service.validate_matrix_completeness()
        assert len(errors) > 0
        assert any("Missing risk mapping" in error for error in errors)
    
    def test_validate_interval_consistency(self):
        """Test interval consistency validation"""
        errors = self.service.validate_interval_consistency()
        
        # Default intervals should be consistent
        assert len(errors) == 0
        
        # Set inconsistent intervals
        self.service.set_inspection_interval(RiskLevel.LOW, 12)  # Shorter than medium
        self.service.set_inspection_interval(RiskLevel.MEDIUM, 24)
        
        errors = self.service.validate_interval_consistency()
        assert len(errors) > 0
        assert any("Low risk interval should be longer" in error for error in errors)
    
    def test_get_risk_distribution(self):
        """Test risk distribution calculation"""
        distribution = self.service.get_risk_distribution()
        
        # Should have counts for each risk level
        assert RiskLevel.LOW in distribution
        assert RiskLevel.MEDIUM in distribution
        assert RiskLevel.HIGH in distribution
        assert RiskLevel.VERY_HIGH in distribution
        
        # Total should match matrix size
        total = sum(distribution.values())
        assert total == len(self.service.config.matrix)
    
    def test_suggest_matrix_adjustments(self):
        """Test matrix adjustment suggestions"""
        suggestions = self.service.suggest_matrix_adjustments()
        
        # Default matrix should have reasonable suggestions or none
        assert isinstance(suggestions, list)
    
    def test_create_conservative_matrix(self):
        """Test creating conservative matrix"""
        original_interval = self.service.get_inspection_interval(RiskLevel.LOW)
        
        self.service.create_conservative_matrix()
        
        # Conservative matrix should have shorter intervals
        new_interval = self.service.get_inspection_interval(RiskLevel.LOW)
        assert new_interval < original_interval
        
        # Should have more high-risk assignments
        distribution = self.service.get_risk_distribution()
        assert distribution[RiskLevel.VERY_HIGH] > 0
    
    def test_create_balanced_matrix(self):
        """Test creating balanced matrix"""
        self.service.create_balanced_matrix()
        
        # Should have reasonable intervals
        assert self.service.get_inspection_interval(RiskLevel.LOW) == 36
        assert self.service.get_inspection_interval(RiskLevel.VERY_HIGH) == 6
        
        # Validate consistency
        errors = self.service.validate_interval_consistency()
        assert len(errors) == 0
    
    def test_create_aggressive_matrix(self):
        """Test creating aggressive matrix"""
        original_interval = self.service.get_inspection_interval(RiskLevel.LOW)
        
        self.service.create_aggressive_matrix()
        
        # Aggressive matrix should have longer intervals
        new_interval = self.service.get_inspection_interval(RiskLevel.LOW)
        assert new_interval > original_interval
        
        # Should have more low-risk assignments
        distribution = self.service.get_risk_distribution()
        assert distribution[RiskLevel.LOW] > distribution[RiskLevel.VERY_HIGH]
    
    def test_export_import_configuration(self):
        """Test configuration export and import"""
        # Modify configuration
        self.service.set_inspection_interval(RiskLevel.LOW, 48)
        self.service.set_fallback_safety_factor("custom_scenario", 1.8)
        
        # Export
        exported = self.service.export_configuration()
        
        assert "matrix" in exported
        assert "inspection_intervals" in exported
        assert "fallback_safety_factors" in exported
        
        # Create new service and import
        new_service = RiskMatrixService(RiskMatrixConfig())
        new_service.import_configuration(exported)
        
        # Verify import
        assert new_service.get_inspection_interval(RiskLevel.LOW) == 48
        assert new_service.get_fallback_safety_factor("custom_scenario") == 1.8
    
    def test_get_matrix_statistics(self):
        """Test matrix statistics calculation"""
        stats = self.service.get_matrix_statistics()
        
        assert "total_combinations" in stats
        assert "risk_distribution" in stats
        assert "average_interval" in stats
        assert "interval_range" in stats
        
        # Check structure
        assert "min" in stats["interval_range"]
        assert "max" in stats["interval_range"]
        
        # Verify percentages add up to 100
        total_percentage = sum(
            level_stats["percentage"] 
            for level_stats in stats["risk_distribution"].values()
        )
        assert abs(total_percentage - 100.0) < 0.01  # Allow for floating point errors
    
    def test_unknown_fallback_scenario(self):
        """Test handling of unknown fallback scenario"""
        factor = self.service.get_fallback_safety_factor("unknown_scenario")
        assert factor == 1.0  # Should return default
    
    def test_matrix_edge_cases(self):
        """Test edge cases in matrix operations"""
        # Test with empty matrix
        empty_service = RiskMatrixService(RiskMatrixConfig())
        empty_service.config.matrix = {}
        
        # Should handle gracefully
        distribution = empty_service.get_risk_distribution()
        assert all(count == 0 for count in distribution.values())
        
        # Should return default risk level
        risk_level = empty_service.get_risk_level("Unknown", "Unknown")
        assert risk_level == RiskLevel.MEDIUM  # Default from get_risk_level
"""Tests for RBI configuration manager"""

import pytest
import tempfile
import json
from pathlib import Path
from app.domains.rbi.services.config_manager import RBIConfigManager
from app.domains.rbi.models.config import RBIConfig, WeightingFactors


class TestRBIConfigManager:
    """Test RBIConfigManager"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.manager = RBIConfigManager()
    
    def test_validate_complete_configuration(self):
        """Test complete configuration validation"""
        validation_results = self.manager.validate_complete_configuration()
        
        # Should have all categories
        expected_categories = [
            "scoring_tables", "risk_matrix", "level_requirements",
            "weighting_factors", "fallback_settings", "learning_settings"
        ]
        
        for category in expected_categories:
            assert category in validation_results
        
        # Default configuration should be valid
        assert all(len(errors) == 0 for errors in validation_results.values())
    
    def test_is_configuration_valid(self):
        """Test configuration validity check"""
        # Default configuration should be valid
        assert self.manager.is_configuration_valid() is True
        
        # Break configuration
        self.manager.config.fallback_settings.emergency_interval = -5
        
        assert self.manager.is_configuration_valid() is False
    
    def test_validate_weighting_factors(self):
        """Test weighting factors validation"""
        # Set invalid weights that don't sum to 1.0
        self.manager.config.weighting_factors.pof_weights = {
            "corrosion_rate": 0.5,
            "equipment_age": 0.3
            # Missing weights, sum = 0.8
        }
        
        errors = self.manager._validate_weighting_factors()
        assert len(errors) > 0
        assert any("sum to" in error for error in errors)
    
    def test_validate_fallback_settings(self):
        """Test fallback settings validation"""
        # Set invalid emergency interval
        self.manager.config.fallback_settings.emergency_interval = -1
        
        errors = self.manager._validate_fallback_settings()
        assert len(errors) > 0
        assert any("Emergency interval must be positive" in error for error in errors)
    
    def test_validate_learning_settings(self):
        """Test learning settings validation"""
        # Set invalid accuracy threshold
        self.manager.config.learning_settings.accuracy_threshold = 1.5
        
        errors = self.manager._validate_learning_settings()
        assert len(errors) > 0
        assert any("accuracy threshold must be between 0 and 1" in error for error in errors)
    
    def test_get_configuration_summary(self):
        """Test configuration summary generation"""
        summary = self.manager.get_configuration_summary()
        
        # Should have all main sections
        assert "scoring_tables" in summary
        assert "risk_matrix" in summary
        assert "level_requirements" in summary
        assert "settings" in summary
        
        # Check structure
        assert "pof_tables_count" in summary["scoring_tables"]
        assert "matrix_size" in summary["risk_matrix"]
        assert "fallback_enabled" in summary["settings"]
    
    def test_export_import_configuration(self):
        """Test configuration export and import"""
        # Modify configuration
        self.manager.config.fallback_settings.emergency_interval = 9
        
        # Export
        exported = self.manager.export_configuration()
        
        # Should have all sections
        assert "scoring_tables" in exported
        assert "risk_matrix" in exported
        assert "fallback_settings" in exported
        
        # Create new manager and import
        new_manager = RBIConfigManager()
        new_manager.import_configuration(exported)
        
        # Verify import
        assert new_manager.config.fallback_settings.emergency_interval == 9
    
    def test_export_import_with_file(self):
        """Test configuration export and import with file"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_path = f.name
        
        try:
            # Export to file
            self.manager.export_configuration(temp_path)
            
            # Verify file exists and has content
            assert Path(temp_path).exists()
            
            # Import from file
            new_manager = RBIConfigManager()
            new_manager.import_configuration(temp_path)
            
            # Should have same configuration
            assert new_manager.config.fallback_settings.emergency_interval == \
                   self.manager.config.fallback_settings.emergency_interval
        
        finally:
            # Cleanup
            Path(temp_path).unlink(missing_ok=True)
    
    def test_create_restore_backup(self):
        """Test backup creation and restoration"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            backup_path = f.name
        
        try:
            # Modify configuration
            original_interval = self.manager.config.fallback_settings.emergency_interval
            self.manager.config.fallback_settings.emergency_interval = 15
            
            # Create backup
            self.manager.create_backup_configuration(backup_path)
            
            # Verify backup file
            assert Path(backup_path).exists()
            
            with open(backup_path, 'r') as f:
                backup_data = json.load(f)
            
            assert "backup_metadata" in backup_data
            assert "created_at" in backup_data["backup_metadata"]
            
            # Change configuration
            self.manager.config.fallback_settings.emergency_interval = 20
            
            # Restore from backup
            self.manager.restore_from_backup(backup_path)
            
            # Should be restored
            assert self.manager.config.fallback_settings.emergency_interval == 15
        
        finally:
            Path(backup_path).unlink(missing_ok=True)
    
    def test_reset_to_defaults(self):
        """Test resetting to default configuration"""
        # Modify configuration
        self.manager.config.fallback_settings.emergency_interval = 99
        
        # Reset
        self.manager.reset_to_defaults()
        
        # Should be back to default
        assert self.manager.config.fallback_settings.emergency_interval == 6
        assert self.manager.is_configuration_valid()
    
    def test_apply_configuration_templates(self):
        """Test applying configuration templates"""
        from app.domains.rbi.models.core import RiskLevel
        
        original_interval = self.manager.risk_matrix_service.get_inspection_interval(RiskLevel.LOW)
        
        # Apply conservative template
        self.manager.apply_configuration_template("conservative")
        conservative_interval = self.manager.risk_matrix_service.get_inspection_interval(RiskLevel.LOW)
        
        # Should be shorter (more conservative)
        assert conservative_interval < original_interval
        
        # Apply aggressive template
        self.manager.apply_configuration_template("aggressive")
        aggressive_interval = self.manager.risk_matrix_service.get_inspection_interval(RiskLevel.LOW)
        
        # Should be longer (less conservative)
        assert aggressive_interval > conservative_interval
        
        # Apply balanced template
        self.manager.apply_configuration_template("balanced")
        balanced_interval = self.manager.risk_matrix_service.get_inspection_interval(RiskLevel.LOW)
        
        # Should be between conservative and aggressive
        assert conservative_interval < balanced_interval < aggressive_interval
    
    def test_invalid_template(self):
        """Test applying invalid template"""
        with pytest.raises(ValueError, match="Unknown template"):
            self.manager.apply_configuration_template("invalid_template")
    
    def test_get_configuration_health_score(self):
        """Test configuration health score calculation"""
        # Healthy configuration
        health = self.manager.get_configuration_health_score()
        
        assert "overall_health_score" in health
        assert "error_counts" in health
        assert "total_errors" in health
        assert "is_healthy" in health
        assert "recommendations" in health
        
        # Should be healthy
        assert health["is_healthy"] is True
        assert health["overall_health_score"] > 90
        
        # Break configuration
        self.manager.config.fallback_settings.emergency_interval = -1
        
        health = self.manager.get_configuration_health_score()
        assert health["is_healthy"] is False
        assert health["total_errors"] > 0
    
    def test_import_invalid_source(self):
        """Test importing from invalid source"""
        with pytest.raises(ValueError, match="Configuration source must be"):
            self.manager.import_configuration(123)  # Invalid type
    
    def test_partial_configuration_import(self):
        """Test importing partial configuration"""
        # Import only fallback settings
        partial_config = {
            "fallback_settings": {
                "enable_fallback": False,
                "emergency_interval": 18
            }
        }
        
        self.manager.import_configuration(partial_config)
        
        # Should update only fallback settings
        assert self.manager.config.fallback_settings.enable_fallback is False
        assert self.manager.config.fallback_settings.emergency_interval == 18
        
        # Other settings should remain default
        assert self.manager.config.learning_settings.enable_learning is True  # Default
    
    def test_configuration_with_custom_weights(self):
        """Test configuration with custom weighting factors"""
        # Set custom weights
        custom_weights = WeightingFactors(
            pof_weights={
                "corrosion_rate": 0.4,
                "equipment_age": 0.3,
                "damage_mechanisms": 0.3
            },
            cof_weights={
                "safety": 0.5,
                "environmental": 0.3,
                "economic": 0.2
            }
        )
        
        self.manager.config.weighting_factors = custom_weights
        
        # Should validate correctly
        errors = self.manager._validate_weighting_factors()
        assert len(errors) == 0
        
        # Export and import should preserve weights
        exported = self.manager.export_configuration()
        new_manager = RBIConfigManager()
        new_manager.import_configuration(exported)
        
        assert new_manager.config.weighting_factors.pof_weights["corrosion_rate"] == 0.4
        assert new_manager.config.weighting_factors.cof_weights["safety"] == 0.5
"""RBI configuration management service"""

import json
from typing import Dict, List, Any, Optional
from pathlib import Path
from app.domains.rbi.models.config import RBIConfig
from app.domains.rbi.services.scoring_tables_service import ScoringTablesService
from app.domains.rbi.services.risk_matrix_service import RiskMatrixService


class RBIConfigManager:
    """Service for managing complete RBI system configuration"""
    
    def __init__(self, config: Optional[RBIConfig] = None):
        """Initialize with optional configuration"""
        self.config = config or RBIConfig()
        self.scoring_service = ScoringTablesService(self.config.scoring_tables)
        self.risk_matrix_service = RiskMatrixService(self.config.risk_matrix)
    
    def validate_complete_configuration(self) -> Dict[str, List[str]]:
        """Validate entire RBI configuration"""
        validation_results = {
            "scoring_tables": [],
            "risk_matrix": [],
            "level_requirements": [],
            "weighting_factors": [],
            "fallback_settings": [],
            "learning_settings": [],
            "level1_settings": []
        }
        
        # Validate scoring tables
        scoring_errors = self.scoring_service.validate_configuration()
        validation_results["scoring_tables"] = scoring_errors
        
        # Validate risk matrix
        matrix_completeness_errors = self.risk_matrix_service.validate_matrix_completeness()
        matrix_consistency_errors = self.risk_matrix_service.validate_interval_consistency()
        validation_results["risk_matrix"] = matrix_completeness_errors + matrix_consistency_errors
        
        # Validate level requirements
        level_errors = self._validate_level_requirements()
        validation_results["level_requirements"] = level_errors
        
        # Validate weighting factors
        weight_errors = self._validate_weighting_factors()
        validation_results["weighting_factors"] = weight_errors
        
        # Validate fallback settings
        fallback_errors = self._validate_fallback_settings()
        validation_results["fallback_settings"] = fallback_errors
        
        # Validate learning settings
        learning_errors = self._validate_learning_settings()
        validation_results["learning_settings"] = learning_errors
        
        # Validate Level 1 settings
        level1_errors = self.config.level1_settings.validate_settings()
        validation_results["level1_settings"] = level1_errors
        
        return validation_results
    
    def _validate_level_requirements(self) -> List[str]:
        """Validate level requirements configuration"""
        errors = []
        
        for level, requirements in self.config.level_requirements.items():
            if not requirements.mandatory_fields:
                errors.append(f"Level {level.value} has no mandatory fields")
            
            if not 0 <= requirements.minimum_data_completeness <= 1:
                errors.append(f"Level {level.value} has invalid data completeness threshold")
            
            if not 0 <= requirements.confidence_threshold <= 1:
                errors.append(f"Level {level.value} has invalid confidence threshold")
        
        return errors
    
    def _validate_weighting_factors(self) -> List[str]:
        """Validate weighting factors configuration"""
        errors = []
        
        # Validate PoF weights
        pof_weights = self.config.weighting_factors.pof_weights
        pof_total = sum(pof_weights.values())
        if abs(pof_total - 1.0) > 0.01:
            errors.append(f"PoF weights sum to {pof_total:.3f}, should sum to 1.0")
        
        for param, weight in pof_weights.items():
            if not 0 <= weight <= 1:
                errors.append(f"PoF weight for {param} is {weight}, should be between 0 and 1")
        
        # Validate CoF weights
        cof_weights = self.config.weighting_factors.cof_weights
        cof_total = sum(cof_weights.values())
        if abs(cof_total - 1.0) > 0.01:
            errors.append(f"CoF weights sum to {cof_total:.3f}, should sum to 1.0")
        
        for dimension, weight in cof_weights.items():
            if not 0 <= weight <= 1:
                errors.append(f"CoF weight for {dimension} is {weight}, should be between 0 and 1")
        
        return errors
    
    def _validate_fallback_settings(self) -> List[str]:
        """Validate fallback settings configuration"""
        errors = []
        
        if self.config.fallback_settings.emergency_interval <= 0:
            errors.append("Emergency interval must be positive")
        
        for scenario, factor in self.config.fallback_settings.conservative_factors.items():
            if factor <= 0:
                errors.append(f"Conservative factor for {scenario} must be positive")
            if factor < 1.0:
                errors.append(f"Conservative factor for {scenario} should be >= 1.0 for safety")
        
        return errors
    
    def _validate_learning_settings(self) -> List[str]:
        """Validate learning settings configuration"""
        errors = []
        
        if not 0 <= self.config.learning_settings.accuracy_threshold <= 1:
            errors.append("Learning accuracy threshold must be between 0 and 1")
        
        if not 0 <= self.config.learning_settings.adjustment_factor <= 1:
            errors.append("Learning adjustment factor must be between 0 and 1")
        
        valid_frequencies = ["daily", "weekly", "monthly", "quarterly", "annually"]
        if self.config.learning_settings.calibration_frequency not in valid_frequencies:
            errors.append(f"Invalid calibration frequency. Must be one of: {valid_frequencies}")
        
        return errors
    
    def is_configuration_valid(self) -> bool:
        """Check if entire configuration is valid"""
        validation_results = self.validate_complete_configuration()
        
        # Check if any category has errors
        for category_errors in validation_results.values():
            if category_errors:
                return False
        
        return True
    
    def get_configuration_summary(self) -> Dict[str, Any]:
        """Get summary of current configuration"""
        return {
            "scoring_tables": {
                "pof_tables_count": len(self.config.scoring_tables.pof_tables),
                "cof_tables_count": sum(
                    len(tables) for tables in self.config.scoring_tables.cof_tables.values()
                ),
                "available_parameters": self.scoring_service.get_available_parameters()
            },
            "risk_matrix": {
                "matrix_size": len(self.config.risk_matrix.matrix),
                "risk_distribution": self.risk_matrix_service.get_risk_distribution(),
                "interval_range": {
                    "min": min(self.config.risk_matrix.inspection_intervals.values()),
                    "max": max(self.config.risk_matrix.inspection_intervals.values())
                }
            },
            "level_requirements": {
                level.value: {
                    "mandatory_fields_count": len(req.mandatory_fields),
                    "optional_fields_count": len(req.optional_fields),
                    "data_completeness_threshold": req.minimum_data_completeness,
                    "confidence_threshold": req.confidence_threshold
                }
                for level, req in self.config.level_requirements.items()
            },
            "settings": {
                "fallback_enabled": self.config.fallback_settings.enable_fallback,
                "learning_enabled": self.config.learning_settings.enable_learning,
                "emergency_interval": self.config.fallback_settings.emergency_interval
            }
        }
    
    def export_configuration(self, file_path: Optional[str] = None) -> Dict[str, Any]:
        """Export complete configuration to dictionary or file"""
        config_dict = {
            "scoring_tables": self.scoring_service.export_configuration(),
            "risk_matrix": self.risk_matrix_service.export_configuration(),
            "level_requirements": {
                level.value: {
                    "mandatory_fields": req.mandatory_fields,
                    "optional_fields": req.optional_fields,
                    "minimum_data_completeness": req.minimum_data_completeness,
                    "confidence_threshold": req.confidence_threshold
                }
                for level, req in self.config.level_requirements.items()
            },
            "weighting_factors": {
                "pof_weights": self.config.weighting_factors.pof_weights,
                "cof_weights": self.config.weighting_factors.cof_weights
            },
            "fallback_settings": {
                "enable_fallback": self.config.fallback_settings.enable_fallback,
                "conservative_factors": self.config.fallback_settings.conservative_factors,
                "emergency_interval": self.config.fallback_settings.emergency_interval
            },
            "learning_settings": {
                "enable_learning": self.config.learning_settings.enable_learning,
                "calibration_frequency": self.config.learning_settings.calibration_frequency,
                "accuracy_threshold": self.config.learning_settings.accuracy_threshold,
                "adjustment_factor": self.config.learning_settings.adjustment_factor
            },
            "level1_settings": {
                "base_intervals": self.config.level1_settings.base_intervals,
                "service_modifiers": self.config.level1_settings.service_modifiers,
                "criticality_modifiers": self.config.level1_settings.criticality_modifiers,
                "emergency_intervals": self.config.level1_settings.emergency_intervals
            }
        }
        
        if file_path:
            with open(file_path, 'w') as f:
                json.dump(config_dict, f, indent=2)
        
        return config_dict
    
    def import_configuration(self, config_source: Any) -> None:
        """Import configuration from dictionary or file"""
        if isinstance(config_source, str):
            # Assume it's a file path
            with open(config_source, 'r') as f:
                config_dict = json.load(f)
        elif isinstance(config_source, dict):
            config_dict = config_source
        else:
            raise ValueError("Configuration source must be file path or dictionary")
        
        # Import scoring tables
        if "scoring_tables" in config_dict:
            self.scoring_service.import_configuration(config_dict["scoring_tables"])
        
        # Import risk matrix
        if "risk_matrix" in config_dict:
            self.risk_matrix_service.import_configuration(config_dict["risk_matrix"])
        
        # Import level requirements
        if "level_requirements" in config_dict:
            from app.domains.rbi.models.config import LevelRequirements
            from app.domains.rbi.models.core import RBILevel
            
            self.config.level_requirements = {}
            for level_str, req_data in config_dict["level_requirements"].items():
                level = RBILevel(level_str)
                requirements = LevelRequirements(
                    mandatory_fields=req_data["mandatory_fields"],
                    optional_fields=req_data.get("optional_fields", []),
                    minimum_data_completeness=req_data.get("minimum_data_completeness", 0.8),
                    confidence_threshold=req_data.get("confidence_threshold", 0.6)
                )
                self.config.level_requirements[level] = requirements
        
        # Import weighting factors
        if "weighting_factors" in config_dict:
            from app.domains.rbi.models.config import WeightingFactors
            
            self.config.weighting_factors = WeightingFactors(
                pof_weights=config_dict["weighting_factors"].get("pof_weights", {}),
                cof_weights=config_dict["weighting_factors"].get("cof_weights", {})
            )
        
        # Import fallback settings
        if "fallback_settings" in config_dict:
            from app.domains.rbi.models.config import FallbackSettings
            
            fallback_data = config_dict["fallback_settings"]
            self.config.fallback_settings = FallbackSettings(
                enable_fallback=fallback_data.get("enable_fallback", True),
                conservative_factors=fallback_data.get("conservative_factors", {}),
                emergency_interval=fallback_data.get("emergency_interval", 6)
            )
        
        # Import learning settings
        if "learning_settings" in config_dict:
            from app.domains.rbi.models.config import LearningSettings
            
            learning_data = config_dict["learning_settings"]
            self.config.learning_settings = LearningSettings(
                enable_learning=learning_data.get("enable_learning", True),
                calibration_frequency=learning_data.get("calibration_frequency", "quarterly"),
                accuracy_threshold=learning_data.get("accuracy_threshold", 0.8),
                adjustment_factor=learning_data.get("adjustment_factor", 0.1)
            )
        
        # Import Level 1 settings
        if "level1_settings" in config_dict:
            from app.domains.rbi.models.config import Level1Settings
            
            level1_data = config_dict["level1_settings"]
            self.config.level1_settings = Level1Settings(
                base_intervals=level1_data.get("base_intervals", {}),
                service_modifiers=level1_data.get("service_modifiers", {}),
                criticality_modifiers=level1_data.get("criticality_modifiers", {}),
                emergency_intervals=level1_data.get("emergency_intervals", {})
            )
    
    def create_backup_configuration(self, backup_path: str) -> None:
        """Create backup of current configuration"""
        backup_config = self.export_configuration()
        
        # Add metadata
        from datetime import datetime
        backup_config["backup_metadata"] = {
            "created_at": datetime.now().isoformat(),
            "version": "1.0",
            "description": "RBI Configuration Backup"
        }
        
        with open(backup_path, 'w') as f:
            json.dump(backup_config, f, indent=2)
    
    def restore_from_backup(self, backup_path: str) -> None:
        """Restore configuration from backup"""
        with open(backup_path, 'r') as f:
            backup_config = json.load(f)
        
        # Remove metadata before importing
        if "backup_metadata" in backup_config:
            del backup_config["backup_metadata"]
        
        self.import_configuration(backup_config)
    
    def reset_to_defaults(self) -> None:
        """Reset configuration to default values"""
        self.config = RBIConfig()
        self.scoring_service = ScoringTablesService(self.config.scoring_tables)
        self.risk_matrix_service = RiskMatrixService(self.config.risk_matrix)
    
    def apply_configuration_template(self, template_name: str) -> None:
        """Apply predefined configuration template"""
        if template_name == "conservative":
            self._apply_conservative_template()
        elif template_name == "balanced":
            self._apply_balanced_template()
        elif template_name == "aggressive":
            self._apply_aggressive_template()
        else:
            raise ValueError(f"Unknown template: {template_name}")
    
    def _apply_conservative_template(self) -> None:
        """Apply conservative configuration template"""
        # Use conservative risk matrix
        self.risk_matrix_service.create_conservative_matrix()
        
        # Increase conservative factors
        self.config.fallback_settings.conservative_factors.update({
            "unknown_corrosion_rate": 2.0,
            "limited_inspection_data": 1.8,
            "new_service_conditions": 1.5
        })
        
        # Lower emergency interval
        self.config.fallback_settings.emergency_interval = 3
    
    def _apply_balanced_template(self) -> None:
        """Apply balanced configuration template"""
        # Use balanced risk matrix (default)
        self.risk_matrix_service.create_balanced_matrix()
        
        # Standard conservative factors
        self.config.fallback_settings.conservative_factors = {
            "unknown_corrosion_rate": 1.5,
            "limited_inspection_data": 1.3,
            "new_service_conditions": 1.2
        }
        
        # Standard emergency interval
        self.config.fallback_settings.emergency_interval = 6
    
    def _apply_aggressive_template(self) -> None:
        """Apply aggressive configuration template"""
        # Use aggressive risk matrix
        self.risk_matrix_service.create_aggressive_matrix()
        
        # Lower conservative factors
        self.config.fallback_settings.conservative_factors.update({
            "unknown_corrosion_rate": 1.2,
            "limited_inspection_data": 1.1,
            "new_service_conditions": 1.1
        })
        
        # Higher emergency interval
        self.config.fallback_settings.emergency_interval = 12
    
    def get_configuration_health_score(self) -> Dict[str, Any]:
        """Calculate configuration health score"""
        validation_results = self.validate_complete_configuration()
        
        # Count errors by category
        error_counts = {
            category: len(errors) 
            for category, errors in validation_results.items()
        }
        
        total_errors = sum(error_counts.values())
        max_possible_errors = 50  # Estimated maximum possible errors
        
        health_score = max(0, (max_possible_errors - total_errors) / max_possible_errors * 100)
        
        return {
            "overall_health_score": round(health_score, 1),
            "error_counts": error_counts,
            "total_errors": total_errors,
            "is_healthy": total_errors == 0,
            "recommendations": self._get_health_recommendations(validation_results)
        }
    
    def _get_health_recommendations(self, validation_results: Dict[str, List[str]]) -> List[str]:
        """Get recommendations based on validation results"""
        recommendations = []
        
        for category, errors in validation_results.items():
            if errors:
                if category == "scoring_tables":
                    recommendations.append("Review and fix scoring table configurations")
                elif category == "risk_matrix":
                    recommendations.append("Validate risk matrix completeness and consistency")
                elif category == "weighting_factors":
                    recommendations.append("Ensure weighting factors sum to 1.0")
                elif category == "fallback_settings":
                    recommendations.append("Review fallback safety factors")
                elif category == "learning_settings":
                    recommendations.append("Validate learning system parameters")
        
        if not recommendations:
            recommendations.append("Configuration is healthy - no issues detected")
        
        return recommendations
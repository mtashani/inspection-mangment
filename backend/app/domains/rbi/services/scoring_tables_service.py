"""Scoring tables configuration service"""

from typing import Dict, List, Optional, Any
from app.domains.rbi.models.config import ScoringTable, ScoringTablesConfig
from app.domains.rbi.models.core import ServiceType


class ScoringTablesService:
    """Service for managing RBI scoring tables configuration"""
    
    def __init__(self, config: Optional[ScoringTablesConfig] = None):
        """Initialize with optional configuration"""
        self.config = config or ScoringTablesConfig()
    
    def get_pof_table(self, parameter_name: str) -> Optional[ScoringTable]:
        """Get PoF scoring table by parameter name"""
        return self.config.pof_tables.get(parameter_name)
    
    def get_cof_table(self, dimension: str, parameter_name: str) -> Optional[ScoringTable]:
        """Get CoF scoring table by dimension and parameter name"""
        dimension_tables = self.config.cof_tables.get(dimension, {})
        return dimension_tables.get(parameter_name)
    
    def add_pof_table(self, table: ScoringTable) -> None:
        """Add or update PoF scoring table"""
        self.config.pof_tables[table.parameter_name] = table
    
    def add_cof_table(self, dimension: str, table: ScoringTable) -> None:
        """Add or update CoF scoring table"""
        if dimension not in self.config.cof_tables:
            self.config.cof_tables[dimension] = {}
        self.config.cof_tables[dimension][table.parameter_name] = table
    
    def remove_pof_table(self, parameter_name: str) -> bool:
        """Remove PoF scoring table"""
        if parameter_name in self.config.pof_tables:
            del self.config.pof_tables[parameter_name]
            return True
        return False
    
    def remove_cof_table(self, dimension: str, parameter_name: str) -> bool:
        """Remove CoF scoring table"""
        if dimension in self.config.cof_tables:
            dimension_tables = self.config.cof_tables[dimension]
            if parameter_name in dimension_tables:
                del dimension_tables[parameter_name]
                return True
        return False
    
    def get_all_pof_tables(self) -> Dict[str, ScoringTable]:
        """Get all PoF scoring tables"""
        return self.config.pof_tables.copy()
    
    def get_all_cof_tables(self) -> Dict[str, Dict[str, ScoringTable]]:
        """Get all CoF scoring tables"""
        return {
            dimension: tables.copy() 
            for dimension, tables in self.config.cof_tables.items()
        }
    
    def calculate_pof_score(self, parameter_values: Dict[str, Any]) -> float:
        """Calculate PoF score based on parameter values"""
        total_score = 0.0
        total_weight = 0.0
        
        for param_name, value in parameter_values.items():
            table = self.get_pof_table(param_name)
            if table:
                score = self._get_score_for_value(table, value)
                weight = self._get_weight_for_parameter(param_name, "pof")
                
                total_score += score * weight
                total_weight += weight
        
        return total_score / total_weight if total_weight > 0 else 0.0
    
    def calculate_cof_score(self, dimension: str, parameter_values: Dict[str, Any]) -> float:
        """Calculate CoF score for a specific dimension"""
        total_score = 0.0
        total_weight = 0.0
        
        dimension_tables = self.config.cof_tables.get(dimension, {})
        
        for param_name, value in parameter_values.items():
            table = dimension_tables.get(param_name)
            if table:
                score = self._get_score_for_value(table, value)
                weight = self._get_weight_for_parameter(param_name, dimension)
                
                total_score += score * weight
                total_weight += weight
        
        return total_score / total_weight if total_weight > 0 else 0.0
    
    def _get_score_for_value(self, table: ScoringTable, value: Any) -> int:
        """Get score for a specific value from scoring table"""
        # Handle different value types
        if isinstance(value, (int, float)):
            return self._get_numeric_score(table, value)
        elif isinstance(value, str):
            return table.get_score(value)
        elif isinstance(value, ServiceType):
            return table.get_score(value.value)
        else:
            return table.get_score(str(value))
    
    def _get_numeric_score(self, table: ScoringTable, value: float) -> int:
        """Get score for numeric value based on ranges"""
        # Handle range-based scoring (e.g., "0-0.05", "0.05-0.1")
        for condition, score in table.scoring_rules.items():
            if self._value_in_range(value, condition):
                return score
        
        # Default to medium score if no range matches
        return 3
    
    def _value_in_range(self, value: float, range_str: str) -> bool:
        """Check if value falls within specified range"""
        try:
            if range_str.startswith(">"):
                threshold = float(range_str[1:])
                return value > threshold
            elif range_str.startswith("<"):
                threshold = float(range_str[1:])
                return value < threshold
            elif "-" in range_str:
                parts = range_str.split("-")
                if len(parts) == 2:
                    min_val = float(parts[0])
                    max_val = float(parts[1])
                    return min_val <= value <= max_val
        except (ValueError, IndexError):
            pass
        
        return False
    
    def _get_weight_for_parameter(self, param_name: str, dimension: str) -> float:
        """Get weight for parameter in specific dimension"""
        # Default weights if not specified in table
        default_weights = {
            "pof": {
                "corrosion_rate": 0.25,
                "equipment_age": 0.20,
                "damage_mechanisms": 0.20,
                "coating_quality": 0.15,
                "inspection_coverage": 0.10,
                "thickness_remaining": 0.10
            },
            "safety": {
                "location": 0.4,
                "pressure": 0.3,
                "fluid": 0.3
            },
            "environmental": {
                "fluid": 0.6,
                "containment": 0.4
            },
            "economic": {
                "downtime": 0.4,
                "production_impact": 0.3,
                "repair_cost": 0.3
            }
        }
        
        dimension_weights = default_weights.get(dimension, {})
        return dimension_weights.get(param_name, 1.0)
    
    def validate_configuration(self) -> List[str]:
        """Validate scoring tables configuration"""
        errors = []
        
        # Validate PoF tables
        for param_name, table in self.config.pof_tables.items():
            try:
                # This will trigger validation in the dataclass
                ScoringTable(
                    parameter_name=table.parameter_name,
                    scoring_rules=table.scoring_rules,
                    weights=table.weights,
                    description=table.description
                )
            except ValueError as e:
                errors.append(f"PoF table '{param_name}': {str(e)}")
        
        # Validate CoF tables
        for dimension, dimension_tables in self.config.cof_tables.items():
            for param_name, table in dimension_tables.items():
                try:
                    ScoringTable(
                        parameter_name=table.parameter_name,
                        scoring_rules=table.scoring_rules,
                        weights=table.weights,
                        description=table.description
                    )
                except ValueError as e:
                    errors.append(f"CoF table '{dimension}.{param_name}': {str(e)}")
        
        return errors
    
    def create_custom_fluid_table(self, fluid_mappings: Dict[str, Dict[str, int]]) -> None:
        """Create custom fluid scoring tables for safety and environmental dimensions"""
        
        # Create safety fluid table
        if "safety" in fluid_mappings:
            safety_table = ScoringTable(
                parameter_name="fluid",
                scoring_rules=fluid_mappings["safety"],
                description="Custom fluid type safety impact scoring"
            )
            self.add_cof_table("safety", safety_table)
        
        # Create environmental fluid table
        if "environmental" in fluid_mappings:
            env_table = ScoringTable(
                parameter_name="fluid",
                scoring_rules=fluid_mappings["environmental"],
                description="Custom fluid type environmental impact scoring"
            )
            self.add_cof_table("environmental", env_table)
    
    def get_available_parameters(self) -> Dict[str, List[str]]:
        """Get list of available parameters for each dimension"""
        return {
            "pof": list(self.config.pof_tables.keys()),
            "safety": list(self.config.cof_tables.get("safety", {}).keys()),
            "environmental": list(self.config.cof_tables.get("environmental", {}).keys()),
            "economic": list(self.config.cof_tables.get("economic", {}).keys())
        }
    
    def export_configuration(self) -> Dict[str, Any]:
        """Export configuration to dictionary format"""
        return {
            "pof_tables": {
                name: {
                    "parameter_name": table.parameter_name,
                    "scoring_rules": table.scoring_rules,
                    "weights": table.weights,
                    "description": table.description
                }
                for name, table in self.config.pof_tables.items()
            },
            "cof_tables": {
                dimension: {
                    param_name: {
                        "parameter_name": table.parameter_name,
                        "scoring_rules": table.scoring_rules,
                        "weights": table.weights,
                        "description": table.description
                    }
                    for param_name, table in tables.items()
                }
                for dimension, tables in self.config.cof_tables.items()
            }
        }
    
    def import_configuration(self, config_dict: Dict[str, Any]) -> None:
        """Import configuration from dictionary format"""
        # Import PoF tables
        if "pof_tables" in config_dict:
            for name, table_data in config_dict["pof_tables"].items():
                table = ScoringTable(
                    parameter_name=table_data["parameter_name"],
                    scoring_rules=table_data["scoring_rules"],
                    weights=table_data.get("weights", {}),
                    description=table_data.get("description", "")
                )
                self.config.pof_tables[name] = table
        
        # Import CoF tables
        if "cof_tables" in config_dict:
            for dimension, dimension_tables in config_dict["cof_tables"].items():
                if dimension not in self.config.cof_tables:
                    self.config.cof_tables[dimension] = {}
                
                for param_name, table_data in dimension_tables.items():
                    table = ScoringTable(
                        parameter_name=table_data["parameter_name"],
                        scoring_rules=table_data["scoring_rules"],
                        weights=table_data.get("weights", {}),
                        description=table_data.get("description", "")
                    )
                    self.config.cof_tables[dimension][param_name] = table
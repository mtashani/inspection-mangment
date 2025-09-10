"""RBI configuration models"""

from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass, field
from .core import RiskLevel, RBILevel


@dataclass
class ScoringTable:
    """Scoring table for RBI parameters"""
    parameter_name: str
    scoring_rules: Dict[str, int]  # condition -> score
    weights: Dict[str, float] = field(default_factory=dict)
    description: str = ""
    
    def __post_init__(self):
        """Validate scoring table"""
        if not self.parameter_name:
            raise ValueError("Parameter name is required")
        
        if not self.scoring_rules:
            raise ValueError("Scoring rules cannot be empty")
        
        # Validate scores are within reasonable range
        for condition, score in self.scoring_rules.items():
            if not 1 <= score <= 5:
                raise ValueError(f"Score for '{condition}' must be between 1 and 5")
        
        # Validate weights if provided
        for weight in self.weights.values():
            if not 0 <= weight <= 1:
                raise ValueError("Weights must be between 0 and 1")
    
    def get_score(self, condition: str) -> int:
        """Get score for a given condition"""
        return self.scoring_rules.get(condition, 3)  # Default to medium score


@dataclass
class LevelRequirements:
    """Requirements for each RBI calculation level"""
    mandatory_fields: List[str]
    optional_fields: List[str] = field(default_factory=list)
    minimum_data_completeness: float = 0.8
    confidence_threshold: float = 0.6
    
    def __post_init__(self):
        """Validate level requirements"""
        if not self.mandatory_fields:
            raise ValueError("Mandatory fields cannot be empty")
        
        if not 0 <= self.minimum_data_completeness <= 1:
            raise ValueError("Minimum data completeness must be between 0 and 1")
        
        if not 0 <= self.confidence_threshold <= 1:
            raise ValueError("Confidence threshold must be between 0 and 1")


@dataclass
class ScoringTablesConfig:
    """Configuration for all scoring tables"""
    pof_tables: Dict[str, ScoringTable] = field(default_factory=dict)
    cof_tables: Dict[str, Dict[str, ScoringTable]] = field(default_factory=dict)
    
    def __post_init__(self):
        """Initialize default scoring tables if not provided"""
        if not self.pof_tables:
            self.pof_tables = self._create_default_pof_tables()
        
        if not self.cof_tables:
            self.cof_tables = self._create_default_cof_tables()
    
    def _create_default_pof_tables(self) -> Dict[str, ScoringTable]:
        """Create default PoF scoring tables"""
        return {
            "corrosion_rate": ScoringTable(
                parameter_name="corrosion_rate",
                scoring_rules={
                    "0-0.05": 1,
                    "0.05-0.1": 2,
                    "0.1-0.2": 3,
                    "0.2-0.5": 4,
                    ">0.5": 5
                },
                description="Corrosion rate scoring (mm/year)"
            ),
            "equipment_age": ScoringTable(
                parameter_name="equipment_age",
                scoring_rules={
                    "<5": 1,
                    "5-10": 2,
                    "10-15": 3,
                    "15-25": 4,
                    ">25": 5
                },
                description="Equipment age scoring (years)"
            ),
            "damage_mechanisms": ScoringTable(
                parameter_name="damage_mechanisms",
                scoring_rules={
                    "0": 1,
                    "1": 2,
                    "2": 3,
                    "3": 4,
                    ">=4": 5
                },
                description="Number of active damage mechanisms"
            ),
            "coating_quality": ScoringTable(
                parameter_name="coating_quality",
                scoring_rules={
                    "excellent": 1,
                    "moderate": 2,
                    "none": 3
                },
                description="Coating quality assessment"
            ),
            "inspection_coverage": ScoringTable(
                parameter_name="inspection_coverage",
                scoring_rules={
                    "good": 1,
                    "average": 2,
                    "poor": 3
                },
                description="Inspection coverage quality"
            )
        }
    
    def _create_default_cof_tables(self) -> Dict[str, Dict[str, ScoringTable]]:
        """Create default CoF scoring tables"""
        return {
            "safety": {
                "location": ScoringTable(
                    parameter_name="location",
                    scoring_rules={
                        "safe": 1,
                        "open_area": 2,
                        "near_sensitive": 3
                    },
                    description="Equipment location safety impact"
                ),
                "pressure": ScoringTable(
                    parameter_name="pressure",
                    scoring_rules={
                        "<10": 1,
                        "10-20": 2,
                        ">20": 3
                    },
                    description="Operating pressure safety impact (bar)"
                ),
                "fluid": ScoringTable(
                    parameter_name="fluid",
                    scoring_rules={
                        "sweet_gas": 1,
                        "amine": 2,
                        "sour_gas": 3,
                        "h2s": 3,
                        "steam": 1,
                        "water": 1,
                        "condensate": 2,
                        "sulfur_vapor": 3,
                        "elemental_sulfur": 2,
                        "ngl": 2,
                        "methanol": 2,
                        "glycol": 2,
                        "mercaptans": 3
                    },
                    description="Fluid type safety impact"
                )
            },
            "environmental": {
                "fluid": ScoringTable(
                    parameter_name="fluid",
                    scoring_rules={
                        "sweet_gas": 1,
                        "sour_gas": 2,
                        "amine": 3,
                        "steam": 1,
                        "water": 1,
                        "condensate": 3,
                        "sulfur_vapor": 3,
                        "elemental_sulfur": 3,
                        "ngl": 3,
                        "methanol": 3,
                        "glycol": 2,
                        "mercaptans": 3
                    },
                    description="Fluid type environmental impact"
                ),
                "containment": ScoringTable(
                    parameter_name="containment",
                    scoring_rules={
                        "good": 1,
                        "moderate": 2,
                        "poor": 3
                    },
                    description="Containment system effectiveness"
                )
            },
            "economic": {
                "downtime": ScoringTable(
                    parameter_name="downtime",
                    scoring_rules={
                        "<1d": 1,
                        "1-3d": 2,
                        ">3d": 3
                    },
                    description="Expected downtime duration"
                ),
                "production_impact": ScoringTable(
                    parameter_name="production_impact",
                    scoring_rules={
                        "low": 1,
                        "medium": 2,
                        "high": 3
                    },
                    description="Production impact level"
                ),
                "repair_cost": ScoringTable(
                    parameter_name="repair_cost",
                    scoring_rules={
                        "<10k": 1,
                        "10k-100k": 2,
                        ">100k": 3
                    },
                    description="Expected repair cost (USD)"
                )
            }
        }


@dataclass
class RiskMatrixConfig:
    """Risk matrix configuration"""
    matrix: Dict[Tuple[str, str], RiskLevel] = field(default_factory=dict)
    inspection_intervals: Dict[RiskLevel, int] = field(default_factory=dict)
    fallback_safety_factors: Dict[str, float] = field(default_factory=dict)
    
    def __post_init__(self):
        """Initialize default risk matrix if not provided"""
        if not self.matrix:
            self.matrix = self._create_default_risk_matrix()
        
        if not self.inspection_intervals:
            self.inspection_intervals = {
                RiskLevel.LOW: 36,
                RiskLevel.MEDIUM: 24,
                RiskLevel.HIGH: 12,
                RiskLevel.VERY_HIGH: 6
            }
        
        if not self.fallback_safety_factors:
            self.fallback_safety_factors = {
                "Level_3_to_Level_2": 1.2,
                "Level_3_to_Level_1": 1.5,
                "Level_2_to_Level_1": 1.3
            }
    
    def _create_default_risk_matrix(self) -> Dict[Tuple[str, str], RiskLevel]:
        """Create default risk matrix"""
        return {
            ("Low", "Low"): RiskLevel.LOW,
            ("Low", "Medium"): RiskLevel.LOW,
            ("Low", "High"): RiskLevel.MEDIUM,
            ("Medium", "Low"): RiskLevel.LOW,
            ("Medium", "Medium"): RiskLevel.MEDIUM,
            ("Medium", "High"): RiskLevel.HIGH,
            ("High", "Low"): RiskLevel.MEDIUM,
            ("High", "Medium"): RiskLevel.HIGH,
            ("High", "High"): RiskLevel.VERY_HIGH,
            ("Very High", "Low"): RiskLevel.HIGH,
            ("Very High", "Medium"): RiskLevel.VERY_HIGH,
            ("Very High", "High"): RiskLevel.VERY_HIGH
        }
    
    def get_risk_level(self, pof_level: str, cof_level: str) -> RiskLevel:
        """Get risk level from PoF and CoF levels"""
        return self.matrix.get((pof_level, cof_level), RiskLevel.MEDIUM)


@dataclass
class WeightingFactors:
    """Weighting factors for RBI calculations"""
    pof_weights: Dict[str, float] = field(default_factory=dict)
    cof_weights: Dict[str, float] = field(default_factory=dict)
    
    def __post_init__(self):
        """Initialize default weights if not provided"""
        if not self.pof_weights:
            self.pof_weights = {
                "corrosion_rate": 0.25,
                "equipment_age": 0.20,
                "damage_mechanisms": 0.20,
                "coating_quality": 0.15,
                "inspection_coverage": 0.10,
                "thickness_remaining": 0.10
            }
        
        if not self.cof_weights:
            self.cof_weights = {
                "safety": 0.40,
                "environmental": 0.35,
                "economic": 0.25
            }


@dataclass
class FallbackSettings:
    """Settings for fallback behavior"""
    enable_fallback: bool = True
    conservative_factors: Dict[str, float] = field(default_factory=dict)
    emergency_interval: int = 6  # months
    
    def __post_init__(self):
        """Initialize default conservative factors"""
        if not self.conservative_factors:
            self.conservative_factors = {
                "unknown_corrosion_rate": 1.5,
                "limited_inspection_data": 1.3,
                "new_service_conditions": 1.2
            }


@dataclass
class LearningSettings:
    """Settings for learning system"""
    enable_learning: bool = True
    calibration_frequency: str = "quarterly"
    accuracy_threshold: float = 0.8
    adjustment_factor: float = 0.1
    
    def __post_init__(self):
        """Validate learning settings"""
        if not 0 <= self.accuracy_threshold <= 1:
            raise ValueError("Accuracy threshold must be between 0 and 1")
        
        if not 0 <= self.adjustment_factor <= 1:
            raise ValueError("Adjustment factor must be between 0 and 1")


@dataclass
class Level1Settings:
    """Settings for Level 1 RBI calculations"""
    base_intervals: Dict[str, int] = field(default_factory=dict)  # Equipment type -> months
    service_modifiers: Dict[str, float] = field(default_factory=dict)  # Service type -> modifier
    criticality_modifiers: Dict[str, float] = field(default_factory=dict)  # Criticality -> modifier
    emergency_intervals: Dict[str, int] = field(default_factory=dict)  # Equipment type -> months
    
    def __post_init__(self):
        """Initialize default Level 1 settings"""
        if not self.base_intervals:
            self.base_intervals = {
                "pressure_vessel": 60,
                "piping": 72,
                "heat_exchanger": 48,
                "pump": 36,
                "compressor": 24,
                "tank": 84
            }
        
        if not self.service_modifiers:
            self.service_modifiers = {
                "sour_gas": 0.6,
                "h2s": 0.5,
                "amine": 0.7,
                "sweet_gas": 1.0,
                "water": 1.2,
                "steam": 1.1,
                "nitrogen": 1.5,
                "condensate": 0.8,
                "sulfur_vapor": 0.5,
                "elemental_sulfur": 0.7,
                "ngl": 0.9,
                "methanol": 0.8,
                "glycol": 0.9,
                "mercaptans": 0.6
            }
        
        if not self.criticality_modifiers:
            self.criticality_modifiers = {
                "Critical": 0.5,
                "High": 0.7,
                "Medium": 1.0,
                "Low": 1.5
            }
        
        if not self.emergency_intervals:
            self.emergency_intervals = {
                "pressure_vessel": 12,
                "piping": 18,
                "heat_exchanger": 12,
                "pump": 6,
                "compressor": 6,
                "tank": 24
            }
    
    def validate_settings(self) -> List[str]:
        """Validate Level 1 settings"""
        errors = []
        
        # Validate base intervals
        for equipment_type, interval in self.base_intervals.items():
            if interval <= 0 or interval > 240:  # 0 to 20 years
                errors.append(f"Base interval for {equipment_type} must be between 1 and 240 months")
        
        # Validate service modifiers
        for service_type, modifier in self.service_modifiers.items():
            if modifier <= 0 or modifier > 3.0:
                errors.append(f"Service modifier for {service_type} must be between 0 and 3.0")
        
        # Validate criticality modifiers
        for criticality, modifier in self.criticality_modifiers.items():
            if modifier <= 0 or modifier > 3.0:
                errors.append(f"Criticality modifier for {criticality} must be between 0 and 3.0")
        
        # Validate emergency intervals
        for equipment_type, interval in self.emergency_intervals.items():
            if interval <= 0 or interval > 36:  # 0 to 3 years
                errors.append(f"Emergency interval for {equipment_type} must be between 1 and 36 months")
        
        return errors


@dataclass
class RBIConfig:
    """Complete RBI system configuration"""
    level_requirements: Dict[RBILevel, LevelRequirements] = field(default_factory=dict)
    scoring_tables: ScoringTablesConfig = field(default_factory=ScoringTablesConfig)
    risk_matrix: RiskMatrixConfig = field(default_factory=RiskMatrixConfig)
    weighting_factors: WeightingFactors = field(default_factory=WeightingFactors)
    fallback_settings: FallbackSettings = field(default_factory=FallbackSettings)
    learning_settings: LearningSettings = field(default_factory=LearningSettings)
    level1_settings: Level1Settings = field(default_factory=Level1Settings)
    
    def __post_init__(self):
        """Initialize default level requirements if not provided"""
        if not self.level_requirements:
            self.level_requirements = {
                RBILevel.LEVEL_3: LevelRequirements(
                    mandatory_fields=[
                        "corrosion_rate", "thickness_measurements", "stress_analysis",
                        "material_properties", "operating_conditions_history"
                    ],
                    optional_fields=[
                        "fatigue_cycles", "vibration_data", "metallurgical_analysis"
                    ],
                    minimum_data_completeness=0.85,
                    confidence_threshold=0.8
                ),
                RBILevel.LEVEL_2: LevelRequirements(
                    mandatory_fields=[
                        "equipment_age", "operating_pressure", "operating_temperature",
                        "fluid_type", "last_inspection_findings"
                    ],
                    optional_fields=[
                        "coating_condition", "maintenance_history", "design_conditions"
                    ],
                    minimum_data_completeness=0.60,
                    confidence_threshold=0.6
                ),
                RBILevel.LEVEL_1: LevelRequirements(
                    mandatory_fields=[
                        "equipment_type", "service_class", "last_inspection_date"
                    ],
                    optional_fields=[],
                    minimum_data_completeness=0.30,
                    confidence_threshold=0.4
                )
            }
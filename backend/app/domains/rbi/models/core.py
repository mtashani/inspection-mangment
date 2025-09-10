"""Core RBI data models"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum


class RiskLevel(str, Enum):
    """Risk level enumeration"""
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    VERY_HIGH = "Very High"


class RBILevel(str, Enum):
    """RBI calculation level enumeration"""
    LEVEL_1 = "Level_1"
    LEVEL_2 = "Level_2"
    LEVEL_3 = "Level_3"


class EquipmentType(str, Enum):
    """Equipment type enumeration"""
    PRESSURE_VESSEL = "pressure_vessel"
    PIPING = "piping"
    HEAT_EXCHANGER = "heat_exchanger"
    PUMP = "pump"
    COMPRESSOR = "compressor"
    TANK = "tank"


class ServiceType(str, Enum):
    """Service type enumeration"""
    SOUR_GAS = "sour_gas"
    SWEET_GAS = "sweet_gas"
    AMINE = "amine"
    H2S = "h2s"
    STEAM = "steam"
    WATER = "water"
    CONDENSATE = "condensate"
    SULFUR_VAPOR = "sulfur_vapor"
    ELEMENTAL_SULFUR = "elemental_sulfur"
    NGL = "ngl"
    METHANOL = "methanol"
    GLYCOL = "glycol"
    MERCAPTANS = "mercaptans"
    NITROGEN = "nitrogen"


@dataclass
class ThicknessMeasurement:
    """Thickness measurement data"""
    location: str
    thickness: float  # mm
    measurement_date: datetime
    minimum_required: float  # mm
    measurement_method: str = "UT"  # Ultrasonic Testing
    inspector: Optional[str] = None
    
    def __post_init__(self):
        """Validate thickness measurement data"""
        if self.thickness <= 0:
            raise ValueError("Thickness must be positive")
        if self.minimum_required <= 0:
            raise ValueError("Minimum required thickness must be positive")
        if self.thickness < self.minimum_required * 0.5:
            raise ValueError("Thickness critically low - below 50% of minimum required")


@dataclass
class InspectionFinding:
    """Inspection finding data"""
    finding_type: str
    severity: str  # Low, Medium, High, Critical
    description: str
    location: Optional[str] = None
    recommendation: Optional[str] = None
    finding_date: Optional[datetime] = None
    
    def __post_init__(self):
        """Validate inspection finding"""
        valid_severities = ["Low", "Medium", "High", "Critical"]
        if self.severity not in valid_severities:
            raise ValueError(f"Severity must be one of: {valid_severities}")


@dataclass
class EquipmentData:
    """Equipment master data"""
    equipment_id: str
    equipment_type: EquipmentType
    service_type: ServiceType
    installation_date: datetime
    design_pressure: float  # bar
    design_temperature: float  # °C
    material: str
    criticality_level: str = "Medium"
    coating_type: Optional[str] = None
    location: str = "open_area"
    inventory_size: float = 0.0  # m³
    
    def __post_init__(self):
        """Validate equipment data"""
        if not self.equipment_id:
            raise ValueError("Equipment ID is required")
        if self.design_pressure <= 0:
            raise ValueError("Design pressure must be positive")
        
        valid_criticality = ["Low", "Medium", "High", "Critical"]
        if self.criticality_level not in valid_criticality:
            raise ValueError(f"Criticality level must be one of: {valid_criticality}")
    
    @property
    def age_years(self) -> float:
        """Calculate equipment age in years"""
        return (datetime.now() - self.installation_date).days / 365.25


@dataclass
class ExtractedRBIData:
    """Data extracted from inspection reports for RBI calculations"""
    equipment_id: str
    thickness_measurements: List[ThicknessMeasurement] = field(default_factory=list)
    corrosion_rate: Optional[float] = None  # mm/year
    coating_condition: Optional[str] = None  # excellent, moderate, none
    damage_mechanisms: List[str] = field(default_factory=list)
    inspection_findings: List[InspectionFinding] = field(default_factory=list)
    last_inspection_date: Optional[datetime] = None
    inspection_quality: str = "average"  # good, average, poor
    
    def __post_init__(self):
        """Validate extracted RBI data"""
        if not self.equipment_id:
            raise ValueError("Equipment ID is required")
        
        if self.corrosion_rate is not None and self.corrosion_rate < 0:
            raise ValueError("Corrosion rate cannot be negative")
        
        valid_coating_conditions = ["excellent", "moderate", "none", None]
        if self.coating_condition not in valid_coating_conditions:
            raise ValueError(f"Coating condition must be one of: {valid_coating_conditions}")
        
        valid_inspection_quality = ["good", "average", "poor"]
        if self.inspection_quality not in valid_inspection_quality:
            raise ValueError(f"Inspection quality must be one of: {valid_inspection_quality}")


@dataclass
class RBICalculationResult:
    """Complete RBI calculation result"""
    equipment_id: str
    calculation_level: RBILevel
    requested_level: RBILevel
    fallback_occurred: bool
    next_inspection_date: datetime
    risk_level: RiskLevel
    pof_score: float
    cof_scores: Dict[str, float]  # safety, environmental, economic
    confidence_score: float
    data_quality_score: float
    calculation_timestamp: datetime
    input_parameters: Dict[str, Any] = field(default_factory=dict)
    missing_data: List[str] = field(default_factory=list)
    estimated_parameters: List[str] = field(default_factory=list)
    inspection_interval_months: int = 24
    
    def __post_init__(self):
        """Validate RBI calculation result"""
        if not self.equipment_id:
            raise ValueError("Equipment ID is required")
        
        if not 0 <= self.pof_score <= 5:
            raise ValueError("PoF score must be between 0 and 5")
        
        if not 0 <= self.confidence_score <= 1:
            raise ValueError("Confidence score must be between 0 and 1")
        
        if not 0 <= self.data_quality_score <= 1:
            raise ValueError("Data quality score must be between 0 and 1")
        
        if self.inspection_interval_months <= 0:
            raise ValueError("Inspection interval must be positive")
        
        # Validate CoF scores
        for dimension, score in self.cof_scores.items():
            if not 0 <= score <= 5:
                raise ValueError(f"CoF score for {dimension} must be between 0 and 5")
    
    @property
    def overall_cof_score(self) -> float:
        """Calculate overall CoF score as weighted average"""
        if not self.cof_scores:
            return 0.0
        
        # Default weights if not specified
        weights = {
            "safety": 0.4,
            "environmental": 0.35,
            "economic": 0.25
        }
        
        total_weighted_score = 0.0
        total_weight = 0.0
        
        for dimension, score in self.cof_scores.items():
            weight = weights.get(dimension, 1.0 / len(self.cof_scores))
            total_weighted_score += score * weight
            total_weight += weight
        
        return total_weighted_score / total_weight if total_weight > 0 else 0.0
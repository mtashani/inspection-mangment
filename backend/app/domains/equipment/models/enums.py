from enum import Enum

class EquipmentCategory(str, Enum):
    """Enumeration for equipment categories"""
    Static = "Static"       # Static equipment like vessels, heat exchangers
    Rotating = "Rotating"   # Rotating equipment like pumps, compressors
    Electric = "Electric"   # Electrical equipment like motors, generators
    Instrument = "Instrument"  # Instruments like gauges, sensors
    Pipeline = "Pipeline"   # Pipeline systems
    Safety = "Safety"       # Safety equipment like fire systems
    Other = "Other"         # Other miscellaneous equipment

class EquipmentStatus(str, Enum):
    """Enumeration for equipment operational status"""
    InService = "InService"
    OutOfService = "OutOfService"
    UnderMaintenance = "UnderMaintenance"
    Standby = "Standby"
    Decommissioned = "Decommissioned"

class EquipmentCondition(str, Enum):
    """Enumeration for equipment condition"""
    New = "New"
    Good = "Good"
    Fair = "Fair"
    Poor = "Poor"
    Critical = "Critical"
    Unknown = "Unknown"

class MaintenanceType(str, Enum):
    """Enumeration for maintenance types"""
    Preventive = "Preventive"
    Corrective = "Corrective"
    Predictive = "Predictive"
    ConditionBased = "ConditionBased"
    Emergency = "Emergency"
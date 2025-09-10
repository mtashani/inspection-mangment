from enum import Enum

class CraneType(str, Enum):
    """Enumeration for different types of cranes"""
    Overhead = "Overhead"
    Mobile = "Mobile" 
    Gantry = "Gantry"
    Jib = "Jib"
    Bridge = "Bridge"

class CraneStatus(str, Enum):
    """Enumeration for crane operational status"""
    Active = "Active"
    UnderMaintenance = "UnderMaintenance"
    Decommissioned = "Decommissioned"

class InspectionResult(str, Enum):
    """Enumeration for crane inspection results"""
    Pass = "Pass"
    Fail = "Fail"
    Conditional = "Conditional"

class RiskLevel(str, Enum):
    """Enumeration for crane risk levels"""
    Low = "Low"
    Medium = "Medium"
    High = "High"
    Critical = "Critical"
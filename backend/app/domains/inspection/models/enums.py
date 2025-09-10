from enum import Enum

class InspectionStatus(str, Enum):
    """Enumeration for inspection status"""
    Planned = "Planned"
    InProgress = "InProgress"
    Completed = "Completed"
    Cancelled = "Cancelled"
    Postponed = "Postponed"

class InspectionType(str, Enum):
    """Enumeration for inspection types"""
    Visual = "Visual"
    NDT = "NDT"
    Thickness = "Thickness"
    Electrical = "Electrical"
    Instrumentation = "Instrumentation"
    Operational = "Operational"
    Regulatory = "Regulatory"
    PreCommissioning = "PreCommissioning"
    Commissioning = "Commissioning"
    Other = "Other"

class InspectionPriority(str, Enum):
    """Enumeration for inspection priority"""
    Low = "Low"
    Medium = "Medium"
    High = "High"
    Critical = "Critical"

class FindingSeverity(str, Enum):
    """Enumeration for inspection finding severity"""
    None_ = "None"
    Minor = "Minor"
    Major = "Major"
    Critical = "Critical"

class RefineryDepartment(str, Enum):
    """Enumeration for refinery departments"""
    Operations = "Operations"
    Inspection = "Inspection"
    Maintenance = "Maintenance"
    Engineering = "Engineering"
    Safety = "Safety"
    QualityControl = "QualityControl"
    ProcessEngineering = "ProcessEngineering"
    Instrumentation = "Instrumentation"
    Electrical = "Electrical"
    Mechanical = "Mechanical"

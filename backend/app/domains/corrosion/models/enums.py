from enum import Enum

class CouponStatus(str, Enum):
    Installed = "Installed"
    Removed = "Removed"
    Analyzed = "Analyzed"

class CouponType(str, Enum):
    Strip = "Strip"
    Rod = "Rod"
    Disc = "Disc"
    Cylinder = "Cylinder"
    Spiral = "Spiral"
    Electrical = "Electrical"
    Custom = "Custom"

class CouponOrientation(str, Enum):
    Flush = "Flush"
    Parallel = "Parallel"
    Perpendicular = "Perpendicular"

class CorrosionType(str, Enum):
    Uniform = "Uniform"
    Pitting = "Pitting"
    Crevice = "Crevice"
    Galvanic = "Galvanic"
    MIC = "MIC"
    Erosion = "Erosion"
    Other = "Other"

class SystemRiskCategory(str, Enum):
    High = "high_risk"
    Medium = "medium_risk"
    Low = "low_risk"

class MonitoringLevel(int, Enum):
    Basic = 1
    Advanced = 2
from enum import Enum

class PSVStatus(str, Enum):
    Main = "Main"
    Spare = "Spare"
    
class PSVSeatType(str, Enum):
    Metal = "metal"
    Soft = "soft"

class TestMedium(str, Enum):
    Nitrogen = "Nitrogen"
    Air = "Air"
    Steam = "Steam"
    Water = "Water"

class WorkMaintenance(str, Enum):
    Adjust = "Adjust"
    Cleaning = "Cleaning"
    Lapping = "Lapping"

class LeakageClass(str, Enum):
    None_ = "None"
    Minimal = "Minimal"
    Low = "Low"
    Moderate = "Moderate"
    Excessive = "Excessive"

class EnvironmentType(str, Enum):
    Clean = "Clean"
    Normal = "Normal"
    Dirty = "Dirty"
    Corrosive = "Corrosive"
    Highly_Corrosive = "Highly Corrosive"

class PSVActionType(str, Enum):
    Conventional = "Conventional"
    QuickOpening = "QuickOpening"

class PSVOperationMode(str, Enum):
    SpringLoaded = "SpringLoaded"
    PilotOperated = "PilotOperated"
    PowerActuated = "PowerActuated"
    TemperatureActuated = "TemperatureActuated"
    Deadweight = "Deadweight"

class PSVReliefService(str, Enum):
    PressureRelief = "PressureRelief"
    VacuumRelief = "VacuumRelief"

class PSVBonnetType(str, Enum):
    Open = "Open"
    Closed = "Closed"

class ServiceRiskCategory(str, Enum):
    """Service risk categories for RBI calculations"""
    A = "A"  # Highest risk
    B = "B"  # High risk
    C = "C"  # Medium risk
    D = "D"  # Low risk
    E = "E"  # Lowest risk

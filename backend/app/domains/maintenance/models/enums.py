from enum import Enum

class MaintenanceEventType(str, Enum):
    """Enumeration for maintenance event types"""
    Routine = "Routine"
    Overhaul = "Overhaul"
    Emergency = "Emergency"
    Preventive = "Preventive"
    Corrective = "Corrective"
    Custom = "Custom"

class MaintenanceEventStatus(str, Enum):
    """Enumeration for maintenance event status"""
    Planned = "Planned"
    InProgress = "InProgress"
    Completed = "Completed"
    Cancelled = "Cancelled"
    Postponed = "Postponed"

class OverhaulSubType(str, Enum):
    """Enumeration for overhaul sub-event types"""
    TotalOverhaul = "TotalOverhaul"
    TrainOverhaul = "TrainOverhaul"
    UnitOverhaul = "UnitOverhaul"
    NormalOverhaul = "NormalOverhaul"

class MaintenanceEventCategory(str, Enum):
    """Enumeration for maintenance event categories"""
    Simple = "Simple"  # Direct inspections (Normal Interval)
    Complex = "Complex"  # Has sub-events (Overhaul)
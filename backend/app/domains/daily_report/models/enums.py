from enum import Enum

class ReportStatus(str, Enum):
    """Enumeration for daily report status"""
    Draft = "Draft"
    Submitted = "Submitted"
    Approved = "Approved"
    Rejected = "Rejected"
    
class WeatherCondition(str, Enum):
    """Enumeration for weather conditions"""
    Sunny = "Sunny"
    Cloudy = "Cloudy"
    Rainy = "Rainy"
    Stormy = "Stormy"
    Foggy = "Foggy"
    Snowy = "Snowy"
    Windy = "Windy"

class InspectionType(str, Enum):
    """Enumeration for inspection types in daily reports"""
    Visual = "Visual"
    NDT = "NDT"
    Thickness = "Thickness"
    Electrical = "Electrical"
    Instrumentation = "Instrumentation"
    Mechanical = "Mechanical"
    Civil = "Civil"
    Other = "Other"

class WorkType(str, Enum):
    """Enumeration for work types"""
    Inspection = "Inspection"
    Maintenance = "Maintenance"
    Repair = "Repair"
    Installation = "Installation"
    Testing = "Testing"
    Monitoring = "Monitoring"
    Consultation = "Consultation"
    Supervision = "Supervision"
    Training = "Training"
    Documentation = "Documentation"
    Other = "Other"

class SafetyRating(str, Enum):
    """Enumeration for safety ratings"""
    Excellent = "Excellent"
    Good = "Good"
    Adequate = "Adequate"
    Poor = "Poor"
    Critical = "Critical"
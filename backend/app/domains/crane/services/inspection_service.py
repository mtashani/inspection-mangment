from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from app.domains.crane.models.crane import Crane, CraneInspection, CraneInspectionSettings
from app.domains.crane.models.enums import CraneType, RiskLevel

def calculate_next_inspection_date(
    crane: Crane,
    settings: Optional[CraneInspectionSettings] = None,
    inspection_date: Optional[datetime] = None
) -> Tuple[datetime, int]:
    """
    Calculate the next inspection date based on crane type and risk level
    
    Args:
        crane: The crane object
        settings: Optional inspection settings
        inspection_date: Optional date of inspection (defaults to current date)
        
    Returns:
        Tuple with next inspection date and interval in months
    """
    # Default intervals by crane type (in months)
    default_intervals = {
        CraneType.Overhead: 12,
        CraneType.Mobile: 12,
        CraneType.Gantry: 12,
        CraneType.Jib: 12,
        CraneType.Bridge: 12
    }
    
    # Risk level multipliers (reduces interval for higher risk)
    risk_multipliers = {
        RiskLevel.Low: 1.0,      # No change
        RiskLevel.Medium: 0.75,  # 75% of standard interval
        RiskLevel.High: 0.5,     # 50% of standard interval
        RiskLevel.Critical: 0.25  # 25% of standard interval
    }
    
    # Get base interval
    interval_months = 12  # Default fallback
    
    # Use settings if provided
    if settings is not None:
        interval_months = settings.inspection_interval_months
    else:
        # Otherwise use defaults based on crane type
        interval_months = default_intervals.get(crane.crane_type, 12)
    
    # Apply risk level multiplier
    risk_level = crane.risk_level
    multiplier = risk_multipliers.get(risk_level, 1.0)
    
    adjusted_interval = int(interval_months * multiplier)
    
    # Ensure minimum interval
    adjusted_interval = max(1, adjusted_interval)
    
    # Calculate next date
    base_date = inspection_date if inspection_date else datetime.utcnow()
    next_date = base_date + timedelta(days=int(adjusted_interval * 30.4))  # Approximate months
    
    return next_date, adjusted_interval

def get_inspection_status(crane: Crane) -> Dict:
    """
    Get inspection status for a crane
    
    Args:
        crane: The crane object
        
    Returns:
        Dict with status information
    """
    now = datetime.utcnow()
    
    if not crane.next_inspection_date:
        return {
            "status": "unknown",
            "message": "No inspection scheduled",
            "days_remaining": None
        }
    
    days_remaining = (crane.next_inspection_date - now).days
    
    if days_remaining < 0:
        return {
            "status": "overdue",
            "message": f"Inspection overdue by {abs(days_remaining)} days",
            "days_remaining": days_remaining
        }
    elif days_remaining < 30:
        return {
            "status": "due_soon",
            "message": f"Inspection due soon in {days_remaining} days",
            "days_remaining": days_remaining
        }
    else:
        return {
            "status": "on_schedule",
            "message": f"Next inspection in {days_remaining} days",
            "days_remaining": days_remaining
        }

def validate_inspection_certificate(
    inspection: CraneInspection,
    crane: Crane
) -> Dict:
    """
    Validate inspection certificate details
    
    Args:
        inspection: The inspection record
        crane: The crane being inspected
        
    Returns:
        Dict with validation results
    """
    issues = []
    
    # Check if allowed capacity is within nominal capacity
    if inspection.allowed_capacity > crane.nominal_capacity:
        issues.append(
            f"Allowed capacity ({inspection.allowed_capacity}) exceeds nominal capacity ({crane.nominal_capacity})"
        )
    
    # Check if inspection date is not in the future
    if inspection.inspection_date > datetime.utcnow():
        issues.append("Inspection date cannot be in the future")
    
    # Check if next inspection date is after inspection date
    if inspection.next_inspection_date <= inspection.inspection_date:
        issues.append("Next inspection date must be after current inspection date")
    
    # Check if certificate image is provided
    if not inspection.certificate_image_path:
        issues.append("Certificate image path not provided")
    
    return {
        "valid": len(issues) == 0,
        "issues": issues
    }
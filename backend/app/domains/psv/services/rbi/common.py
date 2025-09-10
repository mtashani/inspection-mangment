from datetime import datetime, timedelta
from typing import List
from app.domains.psv.models.psv import PSV
from app.domains.psv.models.calibration import Calibration
from app.domains.psv.models.config import RBIConfiguration

def get_reference_date(psv: PSV, calibrations: List[Calibration], config: RBIConfiguration) -> datetime:
    """
    Calculate the reference date for RBI interval calculation
    """
    # If there are calibrations, use the most recent one's date
    if calibrations:
        return calibrations[0].calibration_date
    
    # Otherwise fall back to last calibration date from PSV record
    if psv.last_calibration_date:
        return psv.last_calibration_date
    
    # If no calibration history at all, use current date
    return datetime.utcnow()

def get_interval_from_risk_score(risk_score: float, psv: PSV, config: RBIConfiguration, level: int = 2) -> int:
    """
    Determine interval based on risk score and PSV frequency
    """
    # Get level-specific settings or use defaults
    level_settings = config.settings.get(f"level{level}", {})
    
    # Get risk categories from configuration or use default
    risk_categories = level_settings.get("risk_categories", [
        {"min": 1.0, "max": 1.5, "category": "Low Risk", "interval_factor": 1.0},
        {"min": 1.5, "max": 3.0, "category": "Medium Risk", "interval_factor": 0.67},
        {"min": 3.0, "max": 5.0, "category": "High Risk", "interval_factor": 0.33}
    ])
    
    # Get base interval from configuration or use PSV frequency
    base_interval = level_settings.get("base_interval", psv.frequency)
    
    # Find the appropriate risk category for the score
    interval_factor = 1.0  # Default to 100% of interval
    for category in risk_categories:
        if category["min"] <= risk_score <= category["max"]:
            interval_factor = category.get("interval_factor", 1.0)
            break
    
    # Calculate adjusted interval
    interval = int(base_interval * interval_factor)
    
    # Ensure interval is reasonable
    max_interval = min(60, base_interval * 1.5)  # Cap at 5 years or 150% of base
    min_interval = max(6, base_interval * 0.25)   # Minimum 6 months or 25% of base
    
    return min(max_interval, max(min_interval, interval))
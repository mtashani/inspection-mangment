from typing import Dict, List, Optional, Tuple
from app.domains.corrosion.models.analysis import CorrosionAnalysisReport
from app.domains.corrosion.models.coupon import CorrosionCoupon
from app.domains.corrosion.models.location import CorrosionLocation
from app.domains.corrosion.models.enums import CorrosionType
from app.domains.corrosion.models.settings import CorrosionMonitoringSettings

def calculate_severity_score(
    analysis: CorrosionAnalysisReport, 
    coupon: CorrosionCoupon,
    location: CorrosionLocation,
    settings: Optional[CorrosionMonitoringSettings] = None
) -> Tuple[int, Dict]:
    """
    Calculate severity score for corrosion analysis based on various factors
    
    Returns:
        Tuple with severity score (1-5) and detailed calculation factors
    """
    # Default thresholds if settings not provided
    default_thresholds = {
        "corrosion_rate": {
            "low": 0.1,      # mm/year
            "medium": 0.25,  # mm/year
            "high": 0.5,     # mm/year
            "severe": 1.0    # mm/year
        },
        "pit_depth": {
            "low": 0.5,      # mm
            "medium": 1.0,   # mm
            "high": 2.0,     # mm
            "severe": 3.0    # mm
        }
    }
    
    # Use settings if provided, otherwise use defaults
    thresholds = default_thresholds
    if settings and hasattr(settings, 'severity_thresholds') and settings.severity_thresholds:
        thresholds = settings.severity_thresholds
    
    # Initialize scores for different factors
    rate_score = 1
    pitting_score = 1
    location_score = 1
    fluid_score = 1
    
    # 1. Score based on corrosion rate
    corrosion_rate = analysis.corrosion_rate
    if corrosion_rate >= thresholds["corrosion_rate"]["severe"]:
        rate_score = 5
    elif corrosion_rate >= thresholds["corrosion_rate"]["high"]:
        rate_score = 4
    elif corrosion_rate >= thresholds["corrosion_rate"]["medium"]:
        rate_score = 3
    elif corrosion_rate >= thresholds["corrosion_rate"]["low"]:
        rate_score = 2
    else:
        rate_score = 1
    
    # 2. Score based on pitting (if applicable)
    if analysis.corrosion_type == CorrosionType.Pitting and analysis.max_pit_depth:
        pit_depth = analysis.max_pit_depth
        if pit_depth >= thresholds["pit_depth"]["severe"]:
            pitting_score = 5
        elif pit_depth >= thresholds["pit_depth"]["high"]:
            pitting_score = 4
        elif pit_depth >= thresholds["pit_depth"]["medium"]:
            pitting_score = 3
        elif pit_depth >= thresholds["pit_depth"]["low"]:
            pitting_score = 2
        else:
            pitting_score = 1
    
    # 3. Score based on location risk category
    if location.system_risk_category:
        if location.system_risk_category == "high_risk":
            location_score = 5
        elif location.system_risk_category == "medium_risk":
            location_score = 3
        else:
            location_score = 1
    
    # 4. Score based on fluid type (simplified example)
    fluid_type = location.fluid_type.lower() if location.fluid_type else ""
    if "acid" in fluid_type or "h2s" in fluid_type:
        fluid_score = 5
    elif "hydrocarbon" in fluid_type or "crude" in fluid_type:
        fluid_score = 4
    elif "water" in fluid_type and "produced" in fluid_type:
        fluid_score = 3
    elif "water" in fluid_type:
        fluid_score = 2
    else:
        fluid_score = 1
    
    # Calculate weighted severity score
    # Default weights
    weights = {
        "corrosion_rate": 0.4,
        "pitting": 0.3,
        "location": 0.2,
        "fluid": 0.1
    }
    
    # Override with settings if available
    if settings and hasattr(settings, 'calculation_factors') and settings.calculation_factors.get("weights"):
        weights = settings.calculation_factors.get("weights")
    
    # Calculate weighted score
    weighted_score = (
        rate_score * weights["corrosion_rate"] +
        pitting_score * weights["pitting"] +
        location_score * weights["location"] +
        fluid_score * weights["fluid"]
    )
    
    # Round to nearest integer and ensure it's between 1-5
    final_score = max(1, min(5, round(weighted_score)))
    
    # Return score and detailed factors
    details = {
        "rate_score": rate_score,
        "pitting_score": pitting_score,
        "location_score": location_score,
        "fluid_score": fluid_score,
        "weighted_score": weighted_score,
        "final_score": final_score
    }
    
    return final_score, details

def recommend_next_inspection(
    analysis: CorrosionAnalysisReport,
    severity_score: int,
    settings: Optional[CorrosionMonitoringSettings] = None
) -> int:
    """
    Recommend next inspection interval in days based on severity score
    
    Returns:
        Recommended number of days until next inspection
    """
    # Default inspection frequencies if settings not provided
    default_frequency = {
        1: 365,  # 1 year for very low severity
        2: 240,  # 8 months for low severity
        3: 180,  # 6 months for medium severity
        4: 90,   # 3 months for high severity
        5: 30    # 1 month for very high severity
    }
    
    # Use settings if provided, otherwise use defaults
    frequency_map = default_frequency
    if settings and hasattr(settings, 'inspection_frequency') and settings.inspection_frequency:
        frequency_map = settings.inspection_frequency
    
    # Get recommended interval based on severity score
    return frequency_map.get(severity_score, 180)  # Default to 6 months if not found
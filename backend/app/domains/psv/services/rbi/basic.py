from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from app.domains.psv.models.psv import PSV
from app.domains.psv.models.calibration import Calibration
from app.domains.psv.models.config import RBIConfiguration
from app.domains.psv.models.enums import PSVOperationMode, PSVBonnetType, PSVReliefService
from app.domains.psv.services.rbi.common import (
    get_reference_date, 
    get_interval_from_risk_score
)
from app.domains.psv.services.standards.api527 import get_api527_requirements

def calculate_level_2_risk(
    psv: PSV,
    latest_cal: Calibration,
    config: RBIConfiguration
) -> Tuple[float, str, Dict]:
    """Calculate risk score for RBI Level 2 based on test results and API 527 standards"""
    # Extract level 2 specific settings
    level2_settings = config.settings.get("level2", config.settings)
    
    # Extract configuration values from level 2 settings
    pop_test_scoring = level2_settings.get("pop_test_scoring", [])
    leak_test_scoring = level2_settings.get("leak_test_scoring", [])
    parameter_weights = level2_settings.get("parameter_weights", {"pop_test": 0.6, "leak_test": 0.4})
    
    # Get API 527 requirements for this PSV
    api527_result = get_api527_requirements(psv)
    
    # Extract test values from calibration
    pre_pop_test = latest_cal.pre_repair_pop_test
    pre_leak_test = latest_cal.pre_repair_leak_test
    
    # Handle vacuum PSVs differently if possible
    if hasattr(psv, 'relief_service') and psv.relief_service == PSVReliefService.VacuumRelief and hasattr(latest_cal, 'negative_pressure_test'):
        # Use negative pressure test for vacuum PSVs
        if latest_cal.negative_pressure_test is not None:
            pre_pop_test = latest_cal.negative_pressure_test
    
    # 1. Pop Test Evaluation
    # Use CDTP as reference with fallback to set_pressure
    reference_pressure = psv.cdtp if psv.cdtp is not None else psv.set_pressure
    
    if pre_pop_test is not None and reference_pressure:
        pop_deviation_abs = abs(pre_pop_test - reference_pressure)
        pop_deviation_percent = (pop_deviation_abs / reference_pressure) * 100
    else:
        # Use post-repair as fallback
        post_repair_value = latest_cal.post_repair_pop_test
        # For vacuum PSVs, use positive pressure test if available
        if hasattr(psv, 'relief_service') and psv.relief_service == PSVReliefService.VacuumRelief and hasattr(latest_cal, 'positive_pressure_test'):
            if latest_cal.positive_pressure_test is not None:
                post_repair_value = latest_cal.positive_pressure_test
            
        pop_deviation_abs = abs(post_repair_value - reference_pressure) if post_repair_value and reference_pressure else 0
        pop_deviation_percent = (pop_deviation_abs / reference_pressure) * 100 if reference_pressure else 0
    
    # 2. Leak Test Evaluation
    # Get allowable leakage from API 527 (default to 20 if not available)
    allowed_leakage = api527_result.get("max_allowed_leakage", 20)
    
    # If PSV is a boiler PSV or pilot operated, leakage should be 0
    if hasattr(psv, 'is_boiler_psv') and psv.is_boiler_psv:
        allowed_leakage = 0
    elif hasattr(psv, 'operation_mode') and psv.operation_mode == PSVOperationMode.PilotOperated:
        allowed_leakage = 0
    
    # If PSV has open bonnet, reduce allowable leakage by half
    if hasattr(psv, 'bonnet_type') and psv.bonnet_type == PSVBonnetType.Open:
        allowed_leakage *= 0.5
    
    # Compare pre-repair leak test to allowable
    if isinstance(allowed_leakage, (int, float)):
        leak_test_value = pre_leak_test if pre_leak_test is not None else latest_cal.post_repair_leak_test
        
        if leak_test_value is not None and leak_test_value > allowed_leakage:
            leak_deviation = leak_test_value - allowed_leakage
            leak_deviation_percent = (leak_deviation / allowed_leakage) * 100 if allowed_leakage != 0 else 100
        else:
            leak_deviation_percent = 0  # No deviation if below allowable
    else:
        # For non-numeric leakage allowance (e.g., "No leakage allowed")
        leak_deviation_percent = 100 if pre_leak_test and pre_leak_test > 0 else 0
    
    # 3. Score Assignment - use configuration values
    # Find pop test score from scoring table
    pop_score = 1  # Default to lowest risk
    for range_item in pop_test_scoring:
        if range_item["min"] <= pop_deviation_percent <= range_item["max"]:
            pop_score = range_item["score"]
            break
    
    # Find leak test score from scoring table
    leak_score = 1  # Default to lowest risk
    for range_item in leak_test_scoring:
        if range_item["min"] <= leak_deviation_percent <= range_item["max"]:
            leak_score = range_item["score"]
            break
    
    # Calculate weighted risk score using weights from configuration
    pop_weight = parameter_weights.get("pop_test", 0.6)
    leak_weight = parameter_weights.get("leak_test", 0.4)
    final_score = (pop_score * pop_weight) + (leak_score * leak_weight)
    
    # Generate assessment reason
    reasons = []
    if pop_deviation_percent > 2:
        reasons.append(f"Pop test deviation {pop_deviation_percent:.1f}% exceeds 2%")
    if leak_deviation_percent > 0:
        reasons.append(f"Leak test exceeds allowable limit by {leak_deviation_percent:.1f}%")
    
    reason = " and ".join(reasons) if reasons else "All tests within acceptable limits"
    
    # Additional details
    details = {
        "api527": api527_result,
        "deviations": {
            "pop_test": {
                "value": pre_pop_test or latest_cal.post_repair_pop_test,
                "reference": reference_pressure,
                "absolute": pop_deviation_abs,
                "percent": pop_deviation_percent,
                "score": pop_score
            },
            "leak_test": {
                "value": pre_leak_test or latest_cal.post_repair_leak_test,
                "allowable": allowed_leakage,
                "percent": leak_deviation_percent,
                "score": leak_score
            }
        },
        "weights": {
            "pop_weight": pop_weight,
            "leak_weight": leak_weight
        },
        "final_score": round(final_score, 2)
    }
    
    return round(final_score, 2), reason, details

# RBI Level 1 calculation
def calculate_rbi_level_1(psv: PSV, config: RBIConfiguration) -> Tuple[int, datetime]:
    """Calculate fixed interval for RBI Level 1 using the PSV's frequency field"""
    # Use the PSV's frequency field instead of config settings
    interval = psv.frequency
    
    # Use the reference date
    base_date = get_reference_date(psv, [], config)
    next_date = base_date + timedelta(days=interval * 30)  # Approximate months
    
    return interval, next_date

def calculate_rbi_level_2(
    psv: PSV,
    calibrations: List[Calibration],
    config: RBIConfiguration
) -> Tuple[float, int, datetime, str, Dict]:
    """Calculate risk-based interval for RBI Level 2 with API 527 integration"""
    # Get reference date
    reference_date = get_reference_date(psv, calibrations, config)
    
    if not calibrations:
        # If no calibration data, use frequency as default interval
        interval = psv.frequency
        next_date = reference_date + timedelta(days=interval * 30)
        return 1.0, interval, next_date, "No calibration history, using frequency as interval", {}
    
    latest_cal = calibrations[0]
    
    # Calculate risk score and get details
    risk_score, reason, details = calculate_level_2_risk(psv, latest_cal, config)
    
    # Determine interval based on risk score and PSV frequency
    interval = get_interval_from_risk_score(risk_score, psv, config, level=2)
    
    # Calculate next calibration date from reference date
    next_date = reference_date + timedelta(days=interval * 30)
    
    return risk_score, interval, next_date, reason, details

def calculate_rbi_level_3(
    psv: PSV,
    calibrations: List[Calibration],
    config: RBIConfiguration
) -> Tuple[float, int, datetime]:
    """
    Calculate risk-based interval for RBI Level 3
    Combines Level 2 analysis with condition-based assessment
    """
    # Get reference date
    reference_date = get_reference_date(psv, calibrations, config)
    
    if not calibrations:
        # If no calibration data, use frequency as default interval
        interval = psv.frequency
        next_date = reference_date + timedelta(days=interval * 30)
        return 1.0, interval, next_date
    
    latest_cal = calibrations[0]
    
    # First calculate Level 2 risk score
    level2_risk_score, _, level2_details = calculate_level_2_risk(psv, latest_cal, config)
    
    # Then calculate condition-based score
    level3_settings = config.settings.get("level3", {})
    weights = level3_settings.get("parameter_weights", {
        "body": 0.4,
        "internal": 0.3,
        "seat": 0.3
    })
    
    # Calculate condition score
    condition_scores = [
        (latest_cal.body_condition_score or 5) * weights.get("body", 0.4),
        (latest_cal.internal_parts_score or 5) * weights.get("internal", 0.3),
        (latest_cal.seat_plug_condition_score or 5) * weights.get("seat", 0.3)
    ]
    
    # Get condition score
    condition_score = sum(condition_scores)
    
    # Combine Level 2 risk with condition score
    level3_weights = level3_settings.get("combined_weights", {
        "level2_risk": 0.6,  # 60% weight on Level 2 score
        "condition": 0.4     # 40% weight on condition score
    })
    
    # Calculate final risk score
    risk_score = (level2_risk_score * level3_weights.get("level2_risk", 0.6) + 
                condition_score * level3_weights.get("condition", 0.4))
    
    # Get interval based on risk score
    interval = get_interval_from_risk_score(risk_score, psv, config, level=3)
    
    # Calculate next calibration date
    next_date = reference_date + timedelta(days=interval * 30)
    
    return risk_score, interval, next_date
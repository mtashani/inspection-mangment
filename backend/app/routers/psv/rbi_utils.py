from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from functools import lru_cache
from ...psv_models import PSV, Calibration, RBIConfiguration, ServiceRiskCategory

@lru_cache(maxsize=128)
def calculate_level_2_risk(
    pop_deviation: float,
    leak_test_result: Optional[float],
    thresholds: Dict[str, Dict[str, float]]
) -> Tuple[float, str]:
    """Calculate risk score for RBI Level 2 based on test results"""
    pop_risk = 1.0
    leak_risk = 1.0
    reason = []
    
    # Calculate pop test risk
    if pop_deviation < thresholds["pop_test"]["min"] or pop_deviation > thresholds["pop_test"]["max"]:
        pop_risk = 4.0
        reason.append("Pop test outside thresholds")
    else:
        deviation_abs = abs(pop_deviation)
        max_allowed = max(abs(thresholds["pop_test"]["min"]), abs(thresholds["pop_test"]["max"]))
        pop_risk = 1.0 + (3.0 * deviation_abs / max_allowed)
        
    # Calculate leak test risk if available
    if leak_test_result is not None:
        if (leak_test_result < thresholds["leak_test"]["min"] or
            leak_test_result > thresholds["leak_test"]["max"]):
            leak_risk = 4.0
            reason.append("Leak test outside thresholds")
        else:
            deviation_abs = abs(leak_test_result)
            max_allowed = max(abs(thresholds["leak_test"]["min"]), abs(thresholds["leak_test"]["max"]))
            leak_risk = 1.0 + (3.0 * deviation_abs / max_allowed)
    
    # Combine risks with weighted average (60% pop test, 40% leak test)
    final_risk = round((0.6 * pop_risk + 0.4 * leak_risk), 2)
    reason_str = " and ".join(reason) if reason else "All tests within thresholds"
    
    return final_risk, reason_str

@lru_cache(maxsize=128)
def calculate_pof_score(calibration: Calibration) -> float:
    """Calculate Probability of Failure score based on condition assessments"""
    if not calibration:
        return 5.0  # Highest risk if no calibration data
    
    scores = []
    if calibration.body_condition_score:
        scores.append(calibration.body_condition_score)
    if calibration.internal_parts_score:
        scores.append(calibration.internal_parts_score)
    if calibration.seat_plug_condition_score:
        scores.append(calibration.seat_plug_condition_score)
    
    return float(sum(scores)) / len(scores) if scores else 5.0

def map_risk_to_interval(risk_score: float, config: RBIConfiguration) -> int:
    """Map risk score to calibration interval in months"""
    base_interval = config.settings.get("base_interval", 24)  # Default 2 years
    risk_factors = config.settings.get("risk_factors", {
        "1": 1.5,  # Low risk - extend interval
        "2": 1.25,
        "3": 1.0,  # Medium risk - standard interval
        "4": 0.75,
        "5": 0.5   # High risk - reduce interval
    })
    
    # Round risk score to nearest integer for factor lookup
    risk_level = min(5, max(1, round(risk_score)))
    factor = risk_factors.get(str(risk_level), 1.0)
    
    return round(base_interval * factor)

def get_risk_category(risk_score: float) -> str:
    """Get risk category based on risk score"""
    if risk_score <= 1.5:
        return "Low Risk"
    elif risk_score <= 2.5:
        return "Low-Medium Risk"
    elif risk_score <= 3.5:
        return "Medium Risk"
    elif risk_score <= 4.5:
        return "Medium-High Risk"
    else:
        return "High Risk"

def calculate_rbi_level_1(psv: PSV, config: RBIConfiguration) -> Tuple[int, datetime]:
    """Calculate fixed interval for RBI Level 1 using the PSV's frequency field"""
    # Use the PSV's frequency field instead of config settings
    interval = psv.frequency
    
    # If no calibration date exists, use current date as base
    base_date = psv.last_calibration_date if psv.last_calibration_date else datetime.utcnow()
    next_date = base_date + timedelta(days=interval * 30)  # Approximate months
    
    return interval, next_date

def calculate_rbi_level_2(
    psv: PSV,
    calibrations: List[Calibration],
    config: RBIConfiguration
) -> Tuple[float, int, datetime, str]:
    """Calculate risk-based interval for RBI Level 2"""
    if not calibrations:
        return 5.0, 12, datetime.utcnow() + timedelta(days=365), "No calibration history"
    
    latest_cal = calibrations[0]
    thresholds = {
        "pop_test": config.settings.get("pop_test_thresholds", {"min": -3, "max": 3}),
        "leak_test": config.settings.get("leak_test_thresholds", {"min": -10, "max": 10})
    }
    
    risk_score, reason = calculate_level_2_risk(
        latest_cal.post_repair_pop_test,
        latest_cal.leak_test_result,
        thresholds
    )
    
    # Update base interval based on trend analysis
    base_interval = config.settings.get("base_interval", 24)
    if len(calibrations) >= 3:
        stats = calculate_test_statistics(calibrations)
        # Reduce interval if negative trends detected
        if stats["pop_test"]["trend"] < -0.1 or stats["leak_test"]["trend"] < -0.1:
            base_interval = max(12, base_interval - 6)  # Reduce by 6 months but not below 1 year
    
    interval = map_risk_to_interval(risk_score, config)
    next_date = datetime.utcnow() + timedelta(days=interval * 30)
    
    return risk_score, interval, next_date, reason

def calculate_rbi_level_3(
    psv: PSV,
    calibrations: List[Calibration],
    config: RBIConfiguration
) -> Tuple[float, float, int, datetime]:
    """Calculate risk-based interval for RBI Level 3"""
    if not calibrations:
        return 5.0, 5.0, 12, datetime.utcnow() + timedelta(days=365)
    
    latest_cal = calibrations[0]
    weights = config.settings.get("parameter_weights", {
        "body": 0.4,
        "internal": 0.3,
        "seat": 0.3
    })
    
    # Calculate weighted condition score
    scores = [
        (latest_cal.body_condition_score or 5) * weights["body"],
        (latest_cal.internal_parts_score or 5) * weights["internal"],
        (latest_cal.seat_plug_condition_score or 5) * weights["seat"]
    ]
    
    risk_score = sum(scores)
    pof_score = calculate_pof_score(latest_cal)
    interval = map_risk_to_interval(risk_score, config)
    next_date = datetime.utcnow() + timedelta(days=interval * 30)
    
    return risk_score, pof_score, interval, next_date

def calculate_rbi_level_4(
    psv: PSV,
    calibrations: List[Calibration],
    service_risk: ServiceRiskCategory,
    config: RBIConfiguration
) -> Tuple[float, float, float, str, int, datetime]:
    """Calculate risk-based interval for RBI Level 4"""
    if not calibrations or not service_risk:
        return 5.0, 5.0, 5.0, "High Risk", 12, datetime.utcnow() + timedelta(days=365)
    
    latest_cal = calibrations[0]
    pof_score = calculate_pof_score(latest_cal)
    cof_score = float(service_risk.cof_score)
    
    # Get risk score from risk matrix or calculate
    risk_matrix = config.settings.get("risk_matrix", {})
    risk_score = float(risk_matrix.get(
        f"{int(pof_score)},{int(cof_score)}",
        pof_score * cof_score / 5  # Default calculation if matrix entry missing
    ))
    
    risk_category = get_risk_category(risk_score)
    interval = map_risk_to_interval(risk_score, config)
    next_date = datetime.utcnow() + timedelta(days=interval * 30)
    
    return risk_score, pof_score, cof_score, risk_category, interval, next_date

def calculate_rbi_distribution(
    psv: PSV,
    calibrations: List[Calibration],
    service_risk: Optional[ServiceRiskCategory],
    active_configs: Dict[int, RBIConfiguration]
) -> Dict[str, int]:
    """
    Calculate which RBI level a PSV belongs to based on available data.
    Returns a dictionary with count of 1 for the applicable level
    and 0 for others.
    """
    # Initialize distribution with all zeros
    distribution = {
        "level1": 0,
        "level2": 0,
        "level3": 0,
        "level4": 0
    }
    
    # Determine the highest applicable RBI level for this PSV
    if service_risk and active_configs.get(4) and calibrations:
        # PSV qualifies for level 4 if it has calibrations and service risk data
        distribution["level4"] = 1
    elif active_configs.get(3) and calibrations:
        # PSV qualifies for level 3 if it has calibrations
        distribution["level3"] = 1
    elif active_configs.get(2) and calibrations:
        # PSV qualifies for level 2 if it has calibrations
        distribution["level2"] = 1
    else:
        # Default to level 1 for all other cases
        distribution["level1"] = 1
    
    return distribution
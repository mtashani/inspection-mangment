from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from app.domains.psv.models.psv import PSV
from app.domains.psv.models.calibration import Calibration
from app.domains.psv.models.config import RBIConfiguration, ServiceRiskCategory
from app.domains.psv.models.enums import PSVReliefService, PSVOperationMode, PSVBonnetType
from app.domains.psv.services.rbi.common import get_reference_date, get_interval_from_risk_score
from app.domains.psv.services.rbi.basic import calculate_level_2_risk

def calculate_rbi_level_4(
    psv: PSV,
    calibrations: List[Calibration],
    service_risk: ServiceRiskCategory,
    config: RBIConfiguration
) -> Tuple[float, float, float, str, int, datetime, Dict]:
    """
    Calculate comprehensive risk-based interval for RBI Level 4 based on API 581 principles
    Integrates all data from previous levels plus service risk factors
    """
    # Get reference date
    reference_date = get_reference_date(psv, calibrations, config)
    
    if not calibrations or not service_risk:
        interval = psv.frequency
        next_date = reference_date + timedelta(days=interval * 30)
        return 1.0, 5.0, 5.0, "High Risk", interval, next_date, {}
    
    latest_cal = calibrations[0]
    
    # 1. Calculate comprehensive POF score using all available data
    pof_factors = calculate_comprehensive_pof(psv, calibrations, config, reference_date, service_risk)
    
    # 2. Calculate COF score from service risk
    cof_factors = calculate_cof_factors(psv, service_risk, config)
    
    # 3. Calculate overall risk using POF and COF
    risk_score, risk_details = calculate_api581_risk(pof_factors, cof_factors, config)
    
    # Determine risk category directly
    risk_category = "Low Risk"
    if risk_score <= 1.5:
        risk_category = "Low Risk"
    elif risk_score <= 2.5:
        risk_category = "Low-Medium Risk"
    elif risk_score <= 3.5:
        risk_category = "Medium Risk"
    elif risk_score <= 4.5:
        risk_category = "Medium-High Risk"
    else:
        risk_category = "High Risk"
    
    # Get interval based on risk score
    interval = get_interval_from_risk_score(risk_score, psv, config, level=4)
    next_date = reference_date + timedelta(days=interval * 30)
    
    return risk_score, pof_factors['overall_pof'], cof_factors['overall_cof'], risk_category, interval, next_date, risk_details

def calculate_comprehensive_pof(
    psv: PSV, 
    calibrations: List[Calibration], 
    config: RBIConfiguration, 
    reference_date: datetime, 
    service_risk: ServiceRiskCategory
) -> Dict:
    """
    Calculate comprehensive Probability of Failure using all factors from API 581 methodology
    """
    latest_cal = calibrations[0]
    level4_settings = config.settings.get("level4", {})
    
    # Get Level 2 test performance factors (pop and leak tests)
    _, _, level2_details = calculate_level_2_risk(psv, latest_cal, config)
    pop_test_score = level2_details['deviations']['pop_test']['score']
    leak_test_score = level2_details['deviations']['leak_test']['score']
    
    # Get physical condition factors
    body_score = latest_cal.body_condition_score or 5
    internal_score = latest_cal.internal_parts_score or 5
    seat_score = latest_cal.seat_plug_condition_score or 5
    
    # Get age and service time factors
    age_factor = calculate_age_factor(psv, reference_date, config)
    
    # Get maintenance history factors
    maint_factor = calculate_maintenance_factor(calibrations, config)
    
    # Calculate operational factors
    operational_factor = calculate_operational_factors(psv, latest_cal, config)
    
    # Calculate environmental/service factors
    env_factor = calculate_environment_factors(psv, service_risk, config)
    
    # Define weights from configuration or use defaults
    weights = level4_settings.get("pof_weights", {
        "test_results": 0.25,
        "physical_condition": 0.30,
        "age": 0.15,
        "maintenance": 0.15,
        "operational": 0.10,
        "environment": 0.05
    })
    
    # Normalize weights if they don't sum to 1
    total_weight = sum(weights.values())
    if abs(total_weight - 1.0) > 0.001:
        weights = {k: v/total_weight for k, v in weights.items()}
    
    # Test results component
    test_component = (pop_test_score * 0.6 + leak_test_score * 0.4)
    
    # Physical condition component 
    condition_component = (body_score * 0.4 + internal_score * 0.3 + seat_score * 0.3)
    
    # Calculate weighted overall POF
    overall_pof = (
        test_component * weights["test_results"] +
        condition_component * weights["physical_condition"] +
        age_factor * weights["age"] +
        maint_factor * weights["maintenance"] +
        operational_factor * weights["operational"] +
        env_factor * weights["environment"]
    )
    
    # Ensure POF is within 1-5 range
    overall_pof = min(5.0, max(1.0, overall_pof))
    
    return {
        "overall_pof": overall_pof,
        "test_component": test_component,
        "condition_component": condition_component,
        "age_factor": age_factor,
        "maintenance_factor": maint_factor,
        "operational_factor": operational_factor,
        "environment_factor": env_factor,
        "weights": weights
    }

def calculate_cof_factors(psv: PSV, service_risk: ServiceRiskCategory, config: RBIConfiguration) -> Dict:
    """
    Calculate Consequences of Failure according to API 581 methodology
    """
    level4_settings = config.settings.get("level4", {})
    
    # Base COF from service risk category
    base_cof = float(service_risk.cof_score)
    
    # Get additional fluid properties
    fluid_type = service_risk.fluid_type or "Unknown"
    
    # Adjust COF based on fluid properties
    fluid_multipliers = level4_settings.get("fluid_multipliers", {
        "Steam": 1.0,
        "Natural Gas": 1.2,
        "Hydrogen": 1.5,
        "Toxic": 1.3,
        "Flammable Liquid": 1.1,
        "Corrosive": 1.2,
        "Water": 0.8,
        "Air": 0.7,
        "Unknown": 1.0
    })
    
    fluid_multiplier = fluid_multipliers.get(fluid_type, 1.0)
    
    # Adjust for PSV size (larger PSVs can release more fluid)
    psv_size = psv.nps or psv.inlet_size or 1.0  # Default to 1 inch if no size data available
    size_factor = min(1.5, max(0.8, psv_size / 2.0))
    
    # Adjust for PSV set pressure (higher pressure means more energy)
    reference_pressure = psv.cdtp if psv.cdtp is not None else psv.set_pressure
    
    # Use appropriate pressure field for vacuum PSVs
    if hasattr(psv, 'relief_service') and psv.relief_service == PSVReliefService.VacuumRelief:
        if hasattr(psv, 'positive_pressure') and psv.positive_pressure is not None:
            reference_pressure = psv.positive_pressure
    
    pressure_factor = min(1.3, max(0.9, reference_pressure / 10.0)) if reference_pressure else 1.0
    
    # Calculate overall COF
    overall_cof = base_cof * fluid_multiplier * size_factor * pressure_factor
    
    # Ensure COF is within 1-5 range
    overall_cof = min(5.0, max(1.0, overall_cof))
    
    return {
        "overall_cof": overall_cof,
        "base_cof": base_cof,
        "fluid_multiplier": fluid_multiplier,
        "size_factor": size_factor,
        "pressure_factor": pressure_factor
    }

def calculate_api581_risk(pof_factors: Dict, cof_factors: Dict, config: RBIConfiguration) -> Tuple[float, Dict]:
    """
    Calculate final risk score using API 581 methodology
    """
    level4_settings = config.settings.get("level4", {})
    
    pof = pof_factors["overall_pof"]
    cof = cof_factors["overall_cof"]
    
    # Look up in risk matrix (rounded to integer for lookup)
    pof_index = min(5, max(1, round(pof)))
    cof_index = min(5, max(1, round(cof)))
    
    risk_matrix = level4_settings.get("risk_matrix", {})
    risk_key = f"{pof_index},{cof_index}"
    
    # Get risk from matrix or calculate if not in matrix
    if risk_key in risk_matrix:
        risk_score = float(risk_matrix[risk_key])
    else:
        # API 581 typically uses a multiplication approach with scaling
        risk_score = (pof * cof) / 5.0
        risk_score = min(5.0, max(1.0, risk_score))  # Bound to 1-5
    
    return risk_score, {
        "pof": pof,
        "cof": cof,
        "risk_matrix_key": risk_key,
        "risk_score": risk_score
    }

# Helper functions for POF calculation
def calculate_age_factor(psv: PSV, reference_date: datetime, config: RBIConfiguration) -> float:
    """Calculate age factor based on time since installation"""
    # Get settings from configuration or use defaults
    level4_settings = config.settings.get("level4", {})
    age_thresholds = level4_settings.get("age_thresholds", {
        "new": 2,       # years
        "recent": 5,    # years
        "moderate": 10, # years
        "aging": 15     # years
        # older than 15 years = old
    })
    
    age_scores = level4_settings.get("age_scores", {
        "new": 1.0,
        "recent": 2.0,
        "moderate": 3.0,
        "aging": 4.0,
        "old": 5.0
    })
    
    if not hasattr(psv, 'installation_date') or not psv.installation_date:
        return age_scores["moderate"]  # Default moderate risk if no installation date
        
    years_in_service = (reference_date - psv.installation_date).days / 365.25
    
    if years_in_service < age_thresholds["new"]:
        return age_scores["new"]  # New
    elif years_in_service < age_thresholds["recent"]:
        return age_scores["recent"]  # Recent
    elif years_in_service < age_thresholds["moderate"]:
        return age_scores["moderate"]  # Moderate age
    elif years_in_service < age_thresholds["aging"]:
        return age_scores["aging"]  # Aging
    else:
        return age_scores["old"]  # Old

def calculate_maintenance_factor(calibrations: List[Calibration], config: RBIConfiguration) -> float:
    """Calculate maintenance factor based on calibration history"""
    level4_settings = config.settings.get("level4", {})
    
    # Get maintenance factor settings or use defaults
    maintenance_config = level4_settings.get("maintenance_factors", {
        "limited_history_score": 3.5,
        "repair_weight": 3.0,
        "replacement_weight": 2.0,
        "max_score": 5.0,
        "min_score": 1.0
    })
    
    if len(calibrations) <= 1:
        return maintenance_config["limited_history_score"]  # Limited history
        
    # Check frequency of repairs needed
    repairs_needed = sum(1 for cal in calibrations 
                         if hasattr(cal, 'repairs_required') and cal.repairs_required)
    repair_ratio = repairs_needed / len(calibrations)
    
    # Check parts replacement history
    parts_replaced = sum(1 for cal in calibrations 
                         if hasattr(cal, 'change_parts') and cal.change_parts)
    replacement_ratio = parts_replaced / len(calibrations)
    
    # Return weighted score with min/max bounds
    score = repair_ratio * maintenance_config["repair_weight"] + replacement_ratio * maintenance_config["replacement_weight"]
    return min(maintenance_config["max_score"], max(maintenance_config["min_score"], score))

def calculate_operational_factors(psv: PSV, latest_cal: Calibration, config: RBIConfiguration) -> float:
    """Calculate operational risk factors"""
    level4_settings = config.settings.get("level4", {})
    
    # Get operational factor settings or use defaults
    operational_config = level4_settings.get("operational_factors", {
        "pressure_ratio_thresholds": {
            "very_low": 0.5,
            "low": 0.7,
            "moderate": 0.85,
            "high": 0.95
            # very high >0.95
        },
        "scores": {
            "very_low": 1.0,
            "low": 2.0,
            "moderate": 3.0,
            "high": 4.0,
            "very_high": 5.0
        },
        "default_score": 3.0  # Default moderate
    })
    
    # Default score
    operating_score = operational_config["default_score"]
    
    # Check operating vs. design conditions
    if hasattr(psv, 'operating_pressure') and psv.operating_pressure is not None:
        # Use cdtp with fallback to set_pressure
        reference_pressure = psv.cdtp if psv.cdtp is not None else psv.set_pressure
        
        # For vacuum PSVs, use appropriate pressure field
        if hasattr(psv, 'relief_service') and psv.relief_service == PSVReliefService.VacuumRelief:
            if hasattr(psv, 'negative_pressure') and psv.negative_pressure is not None:
                reference_pressure = abs(psv.negative_pressure)  # Use absolute value for comparison
        
        if reference_pressure and reference_pressure > 0:  # Avoid division by zero
            pressure_ratio = psv.operating_pressure / reference_pressure
            thresholds = operational_config["pressure_ratio_thresholds"]
            
            if pressure_ratio < thresholds["very_low"]:
                operating_score = operational_config["scores"]["very_low"]
            elif pressure_ratio < thresholds["low"]:
                operating_score = operational_config["scores"]["low"]
            elif pressure_ratio < thresholds["moderate"]:
                operating_score = operational_config["scores"]["moderate"]
            elif pressure_ratio < thresholds["high"]:
                operating_score = operational_config["scores"]["high"]
            else:
                operating_score = operational_config["scores"]["very_high"]
                
    return operating_score

def calculate_environment_factors(psv: PSV, service_risk: ServiceRiskCategory, config: RBIConfiguration) -> float:
    """Calculate environmental and service-specific risk factors"""
    level4_settings = config.settings.get("level4", {})
    
    # Get environment scores from configuration or use defaults
    environment_scores = level4_settings.get("environment_scores", {
        "Clean": 1.0,
        "Normal": 2.0,
        "Dirty": 3.0,
        "Corrosive": 4.0,
        "Highly Corrosive": 5.0
    })
    
    # Default score if not in settings
    default_score = 3.0
    
    # Get environment type from service risk or default to "Normal"
    environment_type = "Normal"
    if service_risk and hasattr(service_risk, "environment_type") and service_risk.environment_type:
        environment_type = service_risk.environment_type.value
        
    return environment_scores.get(environment_type, default_score)
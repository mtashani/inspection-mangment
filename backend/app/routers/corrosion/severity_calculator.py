from typing import Dict, Any, Optional
from ...corrosion_models import (
    CorrosionCoupon, 
    CorrosionAnalysisReport,
    CorrosionMonitoringSettings,
    CorrosionType
)

def calculate_severity(
    report_data: Dict[str, Any],
    coupon: CorrosionCoupon,
    settings: CorrosionMonitoringSettings
) -> Dict[str, Any]:
    """
    Calculate the severity level based on analysis data, coupon information, and monitoring settings.
    
    Args:
        report_data: Analysis report data
        coupon: Coupon information
        settings: Corrosion monitoring settings
        
    Returns:
        Dictionary containing the calculated severity level and factors used
    """
    # Get material correction factor
    material_type = coupon.material_type
    material_factor = settings.material_factors.get(material_type, {}).get('severity_multiplier', 1.0)
    
    # Calculate base severity from corrosion rate
    corrosion_rate = report_data.get('corrosion_rate', 0)
    rate_severity = 1
    
    corrosion_rate_thresholds = settings.severity_thresholds.get('corrosion_rate', {})
    if corrosion_rate >= corrosion_rate_thresholds.get('level5', float('inf')):
        rate_severity = 5
    elif corrosion_rate >= corrosion_rate_thresholds.get('level4', float('inf')):
        rate_severity = 4
    elif corrosion_rate >= corrosion_rate_thresholds.get('level3', float('inf')):
        rate_severity = 3
    elif corrosion_rate >= corrosion_rate_thresholds.get('level2', float('inf')):
        rate_severity = 2
    
    # Adjust for pitting
    pitting_severity = 1
    corrosion_type = report_data.get('corrosion_type')
    if corrosion_type == CorrosionType.Pitting:
        pitting_density = report_data.get('pitting_density')
        max_pit_depth = report_data.get('max_pit_depth')
        
        if pitting_density is not None:
            pitting_density_thresholds = settings.severity_thresholds.get('pitting_density', {})
            if pitting_density >= pitting_density_thresholds.get('level5', float('inf')):
                pitting_severity = 5
            elif pitting_density >= pitting_density_thresholds.get('level4', float('inf')):
                pitting_severity = 4
            elif pitting_density >= pitting_density_thresholds.get('level3', float('inf')):
                pitting_severity = 3
            elif pitting_density >= pitting_density_thresholds.get('level2', float('inf')):
                pitting_severity = 2
        
        if max_pit_depth is not None:
            depth_severity = 1
            pit_depth_thresholds = settings.severity_thresholds.get('pit_depth', {})
            if max_pit_depth >= pit_depth_thresholds.get('level5', float('inf')):
                depth_severity = 5
            elif max_pit_depth >= pit_depth_thresholds.get('level4', float('inf')):
                depth_severity = 4
            elif max_pit_depth >= pit_depth_thresholds.get('level3', float('inf')):
                depth_severity = 3
            elif max_pit_depth >= pit_depth_thresholds.get('level2', float('inf')):
                depth_severity = 2
            
            # Use the higher value between pitting density and pit depth severity
            pitting_severity = max(pitting_severity, depth_severity)
    
    # Adjust based on corrosion type
    type_factor = 1.0
    if corrosion_type == CorrosionType.Pitting:
        type_factor = 1.5
    elif corrosion_type == CorrosionType.Crevice:
        type_factor = 1.3
    elif corrosion_type == CorrosionType.MIC:
        type_factor = 1.4
    elif corrosion_type == CorrosionType.Galvanic:
        type_factor = 1.2
    elif corrosion_type == CorrosionType.Erosion:
        type_factor = 1.1
    
    # Visual inspection factor - could be extracted from visual findings
    visual_factor = 1.0
    
    # Calculate final severity - weighted average approach
    calculated_severity = round(
        (rate_severity * 0.4 +  # 40% weight on corrosion rate
        pitting_severity * 0.3 +  # 30% weight on pitting
        rate_severity * type_factor * 0.3) *  # 30% weight on type-adjusted rate
        material_factor  # Overall material factor adjustment
    )
    
    # Ensure severity is between 1-5
    calculated_severity = max(1, min(5, calculated_severity))
    
    # Create calculation factors for transparency
    calculation_factors = {
        "rate_factor": rate_severity,
        "type_factor": type_factor,
        "pitting_factor": pitting_severity,
        "material_factor": material_factor,
        "visual_factor": visual_factor
    }
    
    return {
        "calculated_severity": calculated_severity,
        "calculation_factors": calculation_factors
    }
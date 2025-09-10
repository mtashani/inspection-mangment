from datetime import datetime, timedelta
from typing import List, Dict, Optional
from app.domains.equipment.models.equipment import Equipment, MaintenanceRecord, SparePart
from app.domains.equipment.models.enums import EquipmentStatus, EquipmentCondition

def calculate_next_inspection_date(
    equipment: Equipment,
    from_date: Optional[datetime] = None
) -> datetime:
    """
    Calculate the next inspection date based on equipment's inspection interval
    
    Args:
        equipment: The equipment object
        from_date: Optional date to calculate from (defaults to current date)
        
    Returns:
        Datetime object for the next inspection
    """
    # Default to now if no date provided
    base_date = from_date if from_date else datetime.utcnow()
    
    # If there's no interval set, default to 12 months
    interval_months = equipment.inspection_interval_months or 12
    
    # Calculate based on criticality - reduce interval for more critical equipment
    if equipment.criticality_level >= 5:  # Most critical
        interval_months = max(1, int(interval_months * 0.5))  # 50% of standard interval
    elif equipment.criticality_level == 4:
        interval_months = max(2, int(interval_months * 0.75))  # 75% of standard interval
    
    # Calculate next date
    next_date = base_date + timedelta(days=int(interval_months * 30.4))  # Approximate months
    
    return next_date

def get_equipment_due_for_inspection(
    equipment_list: List[Equipment],
    days_threshold: int = 30
) -> List[Dict]:
    """
    Get equipment that are due for inspection within a specified time period
    
    Args:
        equipment_list: List of equipment to check
        days_threshold: Days threshold for upcoming inspections
        
    Returns:
        List of equipment with inspection details
    """
    now = datetime.utcnow()
    threshold_date = now + timedelta(days=days_threshold)
    
    due_equipment = []
    for equipment in equipment_list:
        if equipment.next_inspection_date and equipment.next_inspection_date <= threshold_date:
            # Calculate days remaining or overdue
            days_remaining = (equipment.next_inspection_date - now).days
            
            due_equipment.append({
                "equipment": equipment,
                "days_remaining": days_remaining,
                "status": "overdue" if days_remaining < 0 else "upcoming",
                "priority": "high" if days_remaining < 0 or equipment.criticality_level >= 4 else "normal"
            })
    
    # Sort by priority (overdue and high criticality first)
    due_equipment.sort(key=lambda x: (
        0 if x["status"] == "overdue" else 1,
        0 if x["priority"] == "high" else 1,
        x["days_remaining"]
    ))
    
    return due_equipment

def check_spare_parts_inventory(
    equipment: Equipment
) -> Dict:
    """
    Check spare parts inventory status for equipment
    
    Args:
        equipment: The equipment to check
        
    Returns:
        Dict with spare parts inventory status
    """
    if not equipment.spare_parts:
        return {
            "status": "unknown",
            "low_stock_items": [],
            "out_of_stock_items": [],
            "healthy_stock_items": []
        }
    
    low_stock = []
    out_of_stock = []
    healthy_stock = []
    
    for part in equipment.spare_parts:
        if part.quantity_in_stock <= 0:
            out_of_stock.append({
                "id": part.id,
                "name": part.name,
                "part_number": part.part_number,
                "quantity": part.quantity_in_stock,
                "min_required": part.min_stock_level
            })
        elif part.quantity_in_stock < part.min_stock_level:
            low_stock.append({
                "id": part.id,
                "name": part.name,
                "part_number": part.part_number,
                "quantity": part.quantity_in_stock,
                "min_required": part.min_stock_level,
                "shortage": part.min_stock_level - part.quantity_in_stock
            })
        else:
            healthy_stock.append({
                "id": part.id,
                "name": part.name,
                "part_number": part.part_number,
                "quantity": part.quantity_in_stock,
                "min_required": part.min_stock_level
            })
    
    status = "healthy"
    if out_of_stock:
        status = "critical"
    elif low_stock:
        status = "warning"
    
    return {
        "status": status,
        "low_stock_items": low_stock,
        "out_of_stock_items": out_of_stock,
        "healthy_stock_items": healthy_stock
    }

def calculate_equipment_health_score(
    equipment: Equipment,
    maintenance_records: List[MaintenanceRecord] = None
) -> Dict:
    """
    Calculate a health score for equipment based on condition and maintenance history
    
    Args:
        equipment: The equipment to evaluate
        maintenance_records: Optional list of maintenance records (if not provided in equipment)
        
    Returns:
        Dict with health score and details
    """
    # Base score from equipment condition
    condition_scores = {
        EquipmentCondition.New: 100,
        EquipmentCondition.Good: 85,
        EquipmentCondition.Fair: 70,
        EquipmentCondition.Poor: 40,
        EquipmentCondition.Critical: 20,
        EquipmentCondition.Unknown: 50
    }
    
    base_score = condition_scores.get(equipment.condition, 50)
    
    # Get maintenance records if not provided
    records = maintenance_records or equipment.maintenance_records
    
    # Factors that affect score
    factors = []
    
    # Check if inspections are up to date
    if equipment.next_inspection_date and equipment.next_inspection_date < datetime.utcnow():
        days_overdue = (datetime.utcnow() - equipment.next_inspection_date).days
        overdue_penalty = min(30, days_overdue // 30 * 5)  # 5 points per month overdue, max 30
        base_score -= overdue_penalty
        factors.append({
            "name": "overdue_inspection",
            "impact": -overdue_penalty,
            "description": f"Inspection overdue by {days_overdue} days"
        })
    
    # Check maintenance history
    if records:
        # Recent maintenance is good
        last_maintenance = max(records, key=lambda x: x.maintenance_date)
        days_since_maintenance = (datetime.utcnow() - last_maintenance.maintenance_date).days
        
        if days_since_maintenance < 90:  # Within last 3 months
            base_score += 5
            factors.append({
                "name": "recent_maintenance",
                "impact": 5,
                "description": "Recent maintenance performed"
            })
        
        # Check corrective vs preventive ratio
        corrective_count = sum(1 for r in records if r.maintenance_type == "Corrective")
        total_count = len(records)
        
        if total_count > 0:
            corrective_ratio = corrective_count / total_count
            if corrective_ratio > 0.7:  # More than 70% corrective is bad
                base_score -= 15
                factors.append({
                    "name": "high_corrective_ratio",
                    "impact": -15,
                    "description": f"High ratio of corrective maintenance ({int(corrective_ratio * 100)}%)"
                })
    else:
        # No maintenance records is concerning
        base_score -= 10
        factors.append({
            "name": "no_maintenance_history",
            "impact": -10,
            "description": "No maintenance history available"
        })
    
    # Check age impact if installation date is available
    if equipment.installation_date:
        years_in_service = (datetime.utcnow().date() - equipment.installation_date).days / 365.25
        if years_in_service > 15:  # Significantly aged equipment
            age_penalty = min(20, (years_in_service - 15) * 2)  # 2 points per year over 15 years
            base_score -= age_penalty
            factors.append({
                "name": "equipment_age",
                "impact": -age_penalty,
                "description": f"Equipment age: {int(years_in_service)} years"
            })
    
    # Ensure score is between 0-100
    final_score = max(0, min(100, base_score))
    
    # Determine health category
    if final_score >= 85:
        health_category = "Excellent"
    elif final_score >= 70:
        health_category = "Good"
    elif final_score >= 50:
        health_category = "Fair"
    elif final_score >= 30:
        health_category = "Poor"
    else:
        health_category = "Critical"
    
    return {
        "equipment_id": equipment.id,
        "equipment_code": equipment.equipment_code,
        "health_score": final_score,
        "health_category": health_category,
        "factors": factors,
        "last_updated": datetime.utcnow().isoformat()
    }
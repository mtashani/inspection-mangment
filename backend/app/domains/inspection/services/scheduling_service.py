from datetime import datetime, date, timedelta
from typing import List, Dict, Optional
from app.domains.inspection.models.inspection import (
    Inspection, 
    InspectionSchedule, 
    InspectionStatus
)
from app.domains.inspection.models.enums import InspectionPriority

def calculate_next_inspection_date(
    schedule: InspectionSchedule,
    from_date: Optional[datetime] = None
) -> date:
    """
    Calculate the next inspection date based on the schedule's frequency
    
    Args:
        schedule: The inspection schedule 
        from_date: Optional date to calculate from (defaults to current date)
        
    Returns:
        Date object for the next inspection
    """
    # Default to now if no date provided
    base_date = from_date.date() if from_date else datetime.utcnow().date()
    
    # If there's a last inspection date, use that as the base
    if schedule.last_inspection_date:
        base_date = schedule.last_inspection_date
    
    # Calculate based on frequency in months
    next_date = add_months(base_date, schedule.frequency_months)
    
    # Adjust based on priority
    if schedule.priority == InspectionPriority.Critical:
        # Critical inspections happen 25% sooner
        days_between = (next_date - base_date).days
        next_date = base_date + timedelta(days=int(days_between * 0.75))
    elif schedule.priority == InspectionPriority.High:
        # High priority inspections happen 10% sooner
        days_between = (next_date - base_date).days
        next_date = base_date + timedelta(days=int(days_between * 0.9))
    
    return next_date

def add_months(source_date: date, months: int) -> date:
    """
    Add months to a date, handling month/year transitions
    
    Args:
        source_date: Starting date
        months: Number of months to add
        
    Returns:
        New date after adding months
    """
    month = source_date.month - 1 + months
    year = source_date.year + month // 12
    month = month % 12 + 1
    day = min(source_date.day, [31, 29 if is_leap_year(year) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month-1])
    return date(year, month, day)

def is_leap_year(year: int) -> bool:
    """Check if a year is a leap year"""
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)

def get_upcoming_inspections(
    schedules: List[InspectionSchedule],
    days_ahead: int = 30
) -> List[Dict]:
    """
    Get list of upcoming inspections from schedules
    
    Args:
        schedules: List of inspection schedules to check
        days_ahead: How many days to look ahead
        
    Returns:
        List of upcoming inspections with details
    """
    now = datetime.utcnow().date()
    upcoming_date = now + timedelta(days=days_ahead)
    upcoming = []
    
    for schedule in schedules:
        if schedule.active and schedule.next_inspection_date <= upcoming_date:
            days_remaining = (schedule.next_inspection_date - now).days
            
            upcoming.append({
                "schedule_id": schedule.id,
                "equipment_type": schedule.equipment_type,
                "equipment_tag": schedule.equipment_tag,
                "location": schedule.location,
                "inspection_type": schedule.inspection_type,
                "next_date": schedule.next_inspection_date,
                "days_remaining": days_remaining,
                "priority": schedule.priority,
                "assigned_inspector": schedule.assigned_inspector,
                "status": "overdue" if days_remaining < 0 else "upcoming"
            })
    
    # Sort by date (closest first)
    upcoming.sort(key=lambda x: x["next_date"])
    
    return upcoming

def create_inspection_from_schedule(
    schedule: InspectionSchedule,
    inspection_number: str,
    planned_date: Optional[date] = None
) -> Inspection:
    """
    Create a new inspection from a schedule
    
    Args:
        schedule: The schedule to create inspection from
        inspection_number: Unique inspection identifier
        planned_date: Optional planned date (defaults to schedule's next date)
        
    Returns:
        New Inspection object (not saved to database)
    """
    if not planned_date:
        planned_date = schedule.next_inspection_date
    
    # Create title from available information
    title_parts = []
    if schedule.inspection_type:
        title_parts.append(f"{schedule.inspection_type.value}")
    if schedule.equipment_type:
        title_parts.append(f"of {schedule.equipment_type}")
    if schedule.equipment_tag:
        title_parts.append(f"({schedule.equipment_tag})")
    if schedule.location:
        title_parts.append(f"at {schedule.location}")
        
    title = " ".join(title_parts) if title_parts else "Scheduled Inspection"
    
    # Create inspection
    inspection = Inspection(
        inspection_number=inspection_number,
        title=title,
        description=f"Scheduled inspection from schedule #{schedule.id}",
        inspection_type=schedule.inspection_type,
        priority=schedule.priority,
        status=InspectionStatus.Planned,
        equipment_id=schedule.equipment_tag,
        location=schedule.location or "",
        unit=schedule.location or "",  # Default to location if unit not available
        planned_date=planned_date,
        lead_inspector_id=None  # This will need to be assigned
    )
    
    return inspection

def update_schedule_after_inspection(
    schedule: InspectionSchedule,
    inspection: Inspection
) -> InspectionSchedule:
    """
    Update schedule after an inspection is completed
    
    Args:
        schedule: The schedule to update
        inspection: The completed inspection
        
    Returns:
        Updated schedule (not saved to database)
    """
    if inspection.status != InspectionStatus.Completed:
        raise ValueError("Only completed inspections can update schedules")
    
    # Update last inspection date
    schedule.last_inspection_date = inspection.actual_end_date or datetime.utcnow().date()
    
    # Calculate new next inspection date
    schedule.next_inspection_date = calculate_next_inspection_date(schedule)
    
    # Update timestamp
    schedule.updated_at = datetime.utcnow()
    
    return schedule
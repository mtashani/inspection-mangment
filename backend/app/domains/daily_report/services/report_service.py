from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from collections import Counter, defaultdict
from app.domains.daily_report.models.report import (
    DailyReport,
    InspectionLog,
    SafetyObservation,
    PersonnelLog
)
from app.domains.daily_report.models.enums import (
    ReportStatus, 
    WorkType, 
    InspectionType
)

def generate_weekly_summary(reports: List[DailyReport]) -> Dict[str, Any]:
    """
    Generate weekly summary statistics from daily reports
    
    Args:
        reports: List of daily reports to analyze
        
    Returns:
        Dictionary with summary statistics
    """
    if not reports:
        return {"error": "No reports provided"}
    
    # Sort by date first
    sorted_reports = sorted(reports, key=lambda x: x.report_date)
    
    # Date range of the reports
    start_date = sorted_reports[0].report_date
    end_date = sorted_reports[-1].report_date
    
    # Initialize counters
    total_hours_worked = 0
    inspection_count_by_type = Counter()
    work_count_by_type = Counter()
    issues_by_area = defaultdict(int)
    safety_observations_by_severity = Counter()
    safety_status_counts = Counter()
    
    # Personnel metrics
    personnel_hours = defaultdict(float)
    personnel_work_types = defaultdict(Counter)
    
    # Total inspection logs and observations
    inspection_logs_count = 0
    safety_observations_count = 0
    
    for report in reports:
        # Add work hours
        if report.total_hours_worked:
            total_hours_worked += report.total_hours_worked
            
        # Process inspection logs
        for log in report.inspection_logs:
            inspection_logs_count += 1
            inspection_count_by_type[log.inspection_type.value] += 1
            work_count_by_type[log.work_type.value] += 1
            
            if log.issues_identified and log.location_detail:
                issues_by_area[log.location_detail] += 1
                
        # Process safety observations
        for obs in report.safety_observations:
            safety_observations_count += 1
            safety_observations_by_severity[obs.severity] += 1
            safety_status_counts[obs.status] += 1
                
        # Process personnel logs
        for personnel in report.personnel_logs:
            name = personnel.name
            personnel_hours[name] += personnel.hours_worked
            personnel_work_types[name][personnel.work_type.value] += 1
    
    # Calculate completion rate
    completed_reports = sum(1 for r in reports if r.status == ReportStatus.Approved or r.status == ReportStatus.Submitted)
    completion_rate = (completed_reports / len(reports)) * 100 if reports else 0
    
    # Create summary
    return {
        "date_range": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": (end_date - start_date).days + 1
        },
        "reports_summary": {
            "total_reports": len(reports),
            "completed_reports": completed_reports,
            "completion_rate": completion_rate,
            "status_counts": {status.value: sum(1 for r in reports if r.status == status) for status in ReportStatus}
        },
        "work_summary": {
            "total_hours": total_hours_worked,
            "inspection_logs": inspection_logs_count,
            "inspection_types": dict(inspection_count_by_type),
            "work_types": dict(work_count_by_type),
        },
        "safety_summary": {
            "total_observations": safety_observations_count,
            "by_severity": dict(safety_observations_by_severity),
            "by_status": dict(safety_status_counts),
        },
        "issues_summary": {
            "areas_with_issues": dict(issues_by_area)
        },
        "personnel_summary": {
            "total_personnel": len(personnel_hours),
            "hours_by_person": dict(personnel_hours),
            "work_types_by_person": {name: dict(work_types) for name, work_types in personnel_work_types.items()}
        }
    }

def generate_monthly_trends(reports: List[DailyReport], month: int, year: int) -> Dict[str, Any]:
    """
    Generate monthly trends from daily reports
    
    Args:
        reports: List of daily reports
        month: Month to analyze (1-12)
        year: Year to analyze
        
    Returns:
        Dictionary with trend data
    """
    # Filter reports for the specified month/year
    filtered_reports = [
        r for r in reports 
        if r.report_date.month == month and r.report_date.year == year
    ]
    
    if not filtered_reports:
        return {"error": f"No reports found for {month}/{year}"}
    
    # Get the number of days in the month
    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)
    days_in_month = (next_month - date(year, month, 1)).days
    
    # Initialize daily counters
    daily_counts = {
        "reports": [0] * days_in_month,
        "issues": [0] * days_in_month,
        "safety_observations": [0] * days_in_month,
        "work_hours": [0] * days_in_month
    }
    
    # Populate daily data
    for report in filtered_reports:
        day_idx = report.report_date.day - 1  # 0-based index
        
        daily_counts["reports"][day_idx] += 1
        
        # Count issues from inspection logs
        issues_count = sum(1 for log in report.inspection_logs if log.issues_identified)
        daily_counts["issues"][day_idx] += issues_count
        
        # Count safety observations
        daily_counts["safety_observations"][day_idx] += len(report.safety_observations)
        
        # Add work hours
        if report.total_hours_worked:
            daily_counts["work_hours"][day_idx] += report.total_hours_worked
    
    # Create weekly aggregations
    weekly_data = {
        "reports": [],
        "issues": [],
        "safety_observations": [],
        "work_hours": []
    }
    
    # Group into weeks
    for week_start in range(0, days_in_month, 7):
        week_end = min(week_start + 7, days_in_month)
        week_name = f"Week {week_start//7 + 1}"
        
        weekly_data["reports"].append({
            "week": week_name,
            "count": sum(daily_counts["reports"][week_start:week_end])
        })
        weekly_data["issues"].append({
            "week": week_name,
            "count": sum(daily_counts["issues"][week_start:week_end])
        })
        weekly_data["safety_observations"].append({
            "week": week_name,
            "count": sum(daily_counts["safety_observations"][week_start:week_end])
        })
        weekly_data["work_hours"].append({
            "week": week_name,
            "hours": sum(daily_counts["work_hours"][week_start:week_end])
        })
    
    return {
        "month": month,
        "year": year,
        "total_reports": len(filtered_reports),
        "daily_data": daily_counts,
        "weekly_data": weekly_data
    }

def calculate_personnel_metrics(reports: List[DailyReport]) -> Dict[str, Any]:
    """
    Calculate metrics related to personnel from daily reports
    
    Args:
        reports: List of daily reports
        
    Returns:
        Dictionary with personnel metrics
    """
    if not reports:
        return {"error": "No reports provided"}
    
    personnel_data = defaultdict(lambda: {
        "total_hours": 0,
        "work_types": Counter(),
        "areas": Counter(),
        "days_worked": set()
    })
    
    for report in reports:
        for personnel_log in report.personnel_logs:
            name = personnel_log.name
            
            # Track hours
            personnel_data[name]["total_hours"] += personnel_log.hours_worked
            
            # Track work types
            personnel_data[name]["work_types"][personnel_log.work_type.value] += 1
            
            # Track areas
            if personnel_log.area_worked:
                personnel_data[name]["areas"][personnel_log.area_worked] += 1
                
            # Track days worked
            personnel_data[name]["days_worked"].add(report.report_date)
    
    # Convert data to serializable format
    result = {}
    for name, data in personnel_data.items():
        result[name] = {
            "total_hours": data["total_hours"],
            "work_types": dict(data["work_types"]),
            "areas": dict(data["areas"]),
            "days_worked": len(data["days_worked"]),
            "days_worked_list": sorted([d.isoformat() for d in data["days_worked"]])
        }
    
    return result

def generate_report_number(date: date, sequence: int) -> str:
    """
    Generate a standardized report number
    
    Args:
        date: Report date
        sequence: Sequence number for the day
        
    Returns:
        Standardized report number string
    """
    date_string = date.strftime("%Y%m%d")
    return f"DR-{date_string}-{sequence:03d}"
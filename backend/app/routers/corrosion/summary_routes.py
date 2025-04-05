from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Any
from sqlmodel import Session, select, func
from datetime import datetime, timedelta
from ...database import get_session
from ...corrosion_models import (
    CorrosionCoupon, 
    CorrosionLocation,
    CorrosionAnalysisReport, 
    CouponStatus,
    CouponType,
    SystemRiskCategory
)

router = APIRouter()

@router.get("/stats")
def get_system_statistics(session: Session = Depends(get_session)):
    """
    Get summary statistics for the corrosion monitoring system
    """
    # Count coupons by status
    installed_count = session.exec(
        select(func.count()).where(CorrosionCoupon.status == CouponStatus.Installed)
    ).one()
    
    removed_count = session.exec(
        select(func.count()).where(CorrosionCoupon.status == CouponStatus.Removed)
    ).one()
    
    analyzed_count = session.exec(
        select(func.count()).where(CorrosionCoupon.status == CouponStatus.Analyzed)
    ).one()
    
    total_count = installed_count + removed_count + analyzed_count
    
    # Count coupons by type
    type_counts = {}
    for coupon_type in CouponType:
        count = session.exec(
            select(func.count()).where(CorrosionCoupon.coupon_type == coupon_type)
        ).one()
        type_counts[coupon_type.value.lower()] = count
    
    # Count by risk category
    risk_counts = {}
    for risk_category in SystemRiskCategory:
        count = session.exec(
            select(func.count())
            .select_from(CorrosionCoupon)
            .join(CorrosionLocation, CorrosionCoupon.location_id == CorrosionLocation.location_id)
            .where(CorrosionLocation.system_risk_category == risk_category)
        ).one()
        risk_counts[risk_category.value] = count
    
    # Count by severity level (from analysis reports)
    severity_counts = {
        "level1": 0,
        "level2": 0,
        "level3": 0,
        "level4": 0,
        "level5": 0
    }
    
    for level in range(1, 6):
        count = session.exec(
            select(func.count()).where(CorrosionAnalysisReport.calculated_severity == level)
        ).one()
        severity_counts[f"level{level}"] = count
    
    # Count upcoming removals (scheduled within next 30 days)
    today = datetime.utcnow().date()
    thirty_days = today + timedelta(days=30)
    
    upcoming_removals = session.exec(
        select(func.count())
        .where(
            CorrosionCoupon.status == CouponStatus.Installed,
            CorrosionCoupon.scheduled_removal_date <= thirty_days,
            CorrosionCoupon.scheduled_removal_date >= today
        )
    ).one()
    
    # Count overdue removals
    overdue = session.exec(
        select(func.count())
        .where(
            CorrosionCoupon.status == CouponStatus.Installed,
            CorrosionCoupon.scheduled_removal_date < today
        )
    ).one()
    
    return {
        "total": {
            "installed": installed_count,
            "removed": removed_count,
            "analyzed": analyzed_count,
            "total": total_count
        },
        "byType": type_counts,
        "byRiskCategory": risk_counts,
        "bySeverityLevel": severity_counts,
        "upcomingRemovals": upcoming_removals,
        "overdue": overdue
    }

@router.get("/upcoming-removals")
def get_upcoming_removals(days: int = 30, session: Session = Depends(get_session)):
    """
    Get list of coupons scheduled for removal in the specified number of days
    """
    today = datetime.utcnow().date()
    future_date = today + timedelta(days=days)
    
    query = (
        select(CorrosionCoupon)
        .where(
            CorrosionCoupon.status == CouponStatus.Installed,
            CorrosionCoupon.scheduled_removal_date <= future_date,
            CorrosionCoupon.scheduled_removal_date >= today
        )
        .order_by(CorrosionCoupon.scheduled_removal_date)
    )
    
    coupons = session.exec(query).all()
    return [dict(coupon) for coupon in coupons]

@router.get("/overdue-removals")
def get_overdue_removals(session: Session = Depends(get_session)):
    """
    Get list of coupons with overdue removal dates
    """
    today = datetime.utcnow().date()
    
    query = (
        select(CorrosionCoupon)
        .where(
            CorrosionCoupon.status == CouponStatus.Installed,
            CorrosionCoupon.scheduled_removal_date < today
        )
        .order_by(CorrosionCoupon.scheduled_removal_date)
    )
    
    coupons = session.exec(query).all()
    return [dict(coupon) for coupon in coupons]

@router.get("/recent-analysis")
def get_recent_analysis(limit: int = 10, session: Session = Depends(get_session)):
    """
    Get list of recent analysis reports
    """
    query = (
        select(CorrosionAnalysisReport)
        .order_by(CorrosionAnalysisReport.analysis_date.desc())
        .limit(limit)
    )
    
    reports = session.exec(query).all()
    result = []
    
    for report in reports:
        # Get coupon details
        coupon = session.exec(
            select(CorrosionCoupon)
            .where(CorrosionCoupon.coupon_id == report.coupon_id)
        ).first()
        
        if coupon:
            # Create a combined object with essential information
            result.append({
                "report_id": report.report_id,
                "coupon_id": report.coupon_id,
                "analysis_date": report.analysis_date,
                "corrosion_rate": report.corrosion_rate,
                "corrosion_type": report.corrosion_type,
                "calculated_severity": report.calculated_severity,
                "material_type": coupon.material_type,
                "location_id": coupon.location_id
            })
    
    return result

@router.get("/location-summary")
def get_location_summary(session: Session = Depends(get_session)):
    """
    Get summary statistics for each location
    """
    locations = session.exec(select(CorrosionLocation)).all()
    result = []
    
    for location in locations:
        # Count coupons by status for this location
        installed = session.exec(
            select(func.count())
            .where(
                CorrosionCoupon.location_id == location.location_id,
                CorrosionCoupon.status == CouponStatus.Installed
            )
        ).one()
        
        analyzed = session.exec(
            select(func.count())
            .where(
                CorrosionCoupon.location_id == location.location_id,
                CorrosionCoupon.status == CouponStatus.Analyzed
            )
        ).one()
        
        # Get average corrosion rate from analysis reports for this location
        avg_rate_query = (
            select(func.avg(CorrosionAnalysisReport.corrosion_rate))
            .join(CorrosionCoupon, CorrosionAnalysisReport.coupon_id == CorrosionCoupon.coupon_id)
            .where(CorrosionCoupon.location_id == location.location_id)
        )
        
        avg_rate_result = session.exec(avg_rate_query).one()
        avg_corrosion_rate = avg_rate_result if avg_rate_result is not None else 0
        
        # Get highest severity found at this location
        max_severity_query = (
            select(func.max(CorrosionAnalysisReport.calculated_severity))
            .join(CorrosionCoupon, CorrosionAnalysisReport.coupon_id == CorrosionCoupon.coupon_id)
            .where(CorrosionCoupon.location_id == location.location_id)
        )
        
        max_severity_result = session.exec(max_severity_query).one()
        max_severity = max_severity_result if max_severity_result is not None else 0
        
        result.append({
            "location_id": location.location_id,
            "name": location.name,
            "system": location.system,
            "unit": location.unit,
            "risk_category": location.system_risk_category,
            "installed_coupons": installed,
            "analyzed_coupons": analyzed,
            "average_corrosion_rate": float(avg_corrosion_rate),
            "max_severity": max_severity
        })
    
    return result

@router.get("/severity-trends")
def get_severity_trends(months: int = 12, session: Session = Depends(get_session)):
    """
    Get trend data for corrosion severity over time
    """
    start_date = datetime.utcnow() - timedelta(days=30 * months)
    
    # Get all analysis reports in the time period
    reports = session.exec(
        select(CorrosionAnalysisReport)
        .where(CorrosionAnalysisReport.analysis_date >= start_date)
        .order_by(CorrosionAnalysisReport.analysis_date)
    ).all()
    
    # Organize by month
    trends = {}
    for report in reports:
        # Format as YYYY-MM
        month_key = report.analysis_date.strftime("%Y-%m")
        
        if month_key not in trends:
            trends[month_key] = {
                "count": 0,
                "avg_severity": 0,
                "avg_rate": 0,
                "total_severity": 0,
                "total_rate": 0
            }
        
        trends[month_key]["count"] += 1
        trends[month_key]["total_severity"] += report.calculated_severity
        trends[month_key]["total_rate"] += report.corrosion_rate
    
    # Calculate averages
    result = []
    for month, data in trends.items():
        if data["count"] > 0:
            data["avg_severity"] = data["total_severity"] / data["count"]
            data["avg_rate"] = data["total_rate"] / data["count"]
            
            result.append({
                "month": month,
                "count": data["count"],
                "avg_severity": data["avg_severity"],
                "avg_rate": data["avg_rate"]
            })
    
    # Sort by month
    result.sort(key=lambda x: x["month"])
    
    return result
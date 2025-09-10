from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from datetime import datetime
from app.database import get_session
from app.domains.corrosion.models.analysis import CorrosionAnalysisReport
from app.domains.corrosion.models.coupon import CorrosionCoupon
from app.domains.corrosion.models.location import CorrosionLocation
from app.domains.corrosion.models.settings import CorrosionMonitoringSettings
from app.domains.corrosion.models.enums import CouponStatus, CorrosionType
from app.domains.corrosion.services.severity_calculator import (
    calculate_severity_score,
    recommend_next_inspection
)

router = APIRouter()

@router.get("/", response_model=List[CorrosionAnalysisReport])
def get_analysis_reports(
    skip: int = 0,
    limit: int = 100,
    coupon_id: Optional[str] = None,
    location_id: Optional[str] = None,
    min_severity: Optional[int] = None,
    max_severity: Optional[int] = None,
    db: Session = Depends(get_session)
):
    """Get list of corrosion analysis reports with optional filtering"""
    query = select(CorrosionAnalysisReport)
    
    if coupon_id:
        query = query.filter(CorrosionAnalysisReport.coupon_id == coupon_id)
    
    if location_id:
        # Join with coupon to filter by location
        query = query.join(CorrosionCoupon).filter(CorrosionCoupon.location_id == location_id)
    
    if min_severity is not None:
        query = query.filter(CorrosionAnalysisReport.calculated_severity >= min_severity)
    
    if max_severity is not None:
        query = query.filter(CorrosionAnalysisReport.calculated_severity <= max_severity)
    
    query = query.order_by(CorrosionAnalysisReport.analysis_date.desc())
    
    return db.exec(query.offset(skip).limit(limit)).all()

@router.post("/", response_model=Dict)
def create_analysis_report(
    report: CorrosionAnalysisReport,
    db: Session = Depends(get_session)
):
    """Create new corrosion analysis report with automated severity calculation"""
    # Verify that coupon exists and is removed
    coupon = db.get(CorrosionCoupon, report.coupon_id)
    if not coupon:
        raise HTTPException(
            status_code=404,
            detail=f"Coupon with ID '{report.coupon_id}' not found"
        )
    
    if coupon.status != CouponStatus.Removed:
        raise HTTPException(
            status_code=400,
            detail="Coupon must be in 'Removed' status before analysis"
        )
    
    # Get the location for this coupon
    location = db.get(CorrosionLocation, coupon.location_id)
    if not location:
        raise HTTPException(
            status_code=404,
            detail=f"Location with ID '{coupon.location_id}' not found"
        )
    
    # Get monitoring settings if available
    settings = db.exec(select(CorrosionMonitoringSettings)).first()
    
    # Calculate corrosion rate if not provided
    if not report.corrosion_rate and report.weight_loss and report.exposure_days:
        # Simple corrosion rate calculation (mm/year)
        # This is a simplified formula - real implementations would use material density
        material_constant = 365 * 10  # Convert to mm/year
        if report.weight_loss > 0 and coupon.surface_area > 0:
            report.corrosion_rate = (
                (report.weight_loss / coupon.surface_area) * 
                material_constant / report.exposure_days
            )
    
    # Calculate severity score
    severity, details = calculate_severity_score(report, coupon, location, settings)
    
    # Set calculated severity
    report.calculated_severity = severity
    
    # Set calculation factors
    report.calculation_factors = details
    
    # Update coupon status to Analyzed
    coupon.status = CouponStatus.Analyzed
    
    # Add report to database
    db.add(report)
    try:
        db.commit()
        db.refresh(report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    # Also update the coupon
    db.refresh(coupon)
    
    # Get recommended next inspection
    next_inspection_days = recommend_next_inspection(report, severity, settings)
    
    # Return the created report along with additional information
    return {
        "report": report,
        "severity": severity,
        "severity_details": details,
        "recommended_next_inspection_days": next_inspection_days
    }

@router.get("/{report_id}", response_model=CorrosionAnalysisReport)
def get_analysis_report(
    report_id: int,
    db: Session = Depends(get_session)
):
    """Get analysis report by ID"""
    report = db.get(CorrosionAnalysisReport, report_id)
    if not report:
        raise HTTPException(
            status_code=404,
            detail=f"Analysis report with ID {report_id} not found"
        )
    return report

@router.put("/{report_id}", response_model=Dict)
def update_analysis_report(
    report_id: int,
    report_update: CorrosionAnalysisReport,
    recalculate_severity: bool = True,
    db: Session = Depends(get_session)
):
    """Update analysis report with option to recalculate severity score"""
    db_report = db.get(CorrosionAnalysisReport, report_id)
    if not db_report:
        raise HTTPException(status_code=404, detail="Analysis report not found")
    
    # Update fields
    report_data = report_update.dict(exclude_unset=True)
    for key, value in report_data.items():
        setattr(db_report, key, value)
    
    # Recalculate severity if requested and needed fields are changed
    severity = db_report.calculated_severity
    details = db_report.calculation_factors
    
    if recalculate_severity:
        # Get coupon and location
        coupon = db.get(CorrosionCoupon, db_report.coupon_id)
        if not coupon:
            raise HTTPException(
                status_code=404,
                detail=f"Coupon with ID '{db_report.coupon_id}' not found"
            )
        
        location = db.get(CorrosionLocation, coupon.location_id)
        if not location:
            raise HTTPException(
                status_code=404,
                detail=f"Location with ID '{coupon.location_id}' not found"
            )
        
        # Get monitoring settings if available
        settings = db.exec(select(CorrosionMonitoringSettings)).first()
        
        # Recalculate severity
        severity, details = calculate_severity_score(db_report, coupon, location, settings)
        db_report.calculated_severity = severity
        db_report.calculation_factors = details
    
    try:
        db.commit()
        db.refresh(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    # Get recommended next inspection
    settings = db.exec(select(CorrosionMonitoringSettings)).first()
    next_inspection_days = recommend_next_inspection(db_report, severity, settings)
    
    return {
        "report": db_report,
        "severity": severity,
        "severity_details": details,
        "recommended_next_inspection_days": next_inspection_days
    }

@router.delete("/{report_id}")
def delete_analysis_report(
    report_id: int,
    db: Session = Depends(get_session)
):
    """Delete analysis report"""
    report = db.get(CorrosionAnalysisReport, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Analysis report not found")
    
    # Get associated coupon to potentially update its status
    coupon = db.get(CorrosionCoupon, report.coupon_id)
    
    try:
        # Delete the report
        db.delete(report)
        
        # Check if this is the only report for this coupon
        if coupon:
            remaining_reports = db.exec(
                select(CorrosionAnalysisReport).filter(
                    CorrosionAnalysisReport.coupon_id == coupon.coupon_id,
                    CorrosionAnalysisReport.report_id != report_id
                )
            ).all()
            
            # If no other reports, set coupon status back to Removed
            if not remaining_reports:
                coupon.status = CouponStatus.Removed
        
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return {"message": "Analysis report deleted successfully"}
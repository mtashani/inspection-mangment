from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from sqlmodel import Session, select
from datetime import datetime
from ...database import get_session
from ...corrosion_models import (
    CorrosionCoupon,
    CorrosionAnalysisReport,
    CorrosionMonitoringSettings,
    CorrosionType,
    CouponStatus
)
from .severity_calculator import calculate_severity

# Pydantic models for request/response
from pydantic import BaseModel, Field

class CorrosionAnalysisCreate(BaseModel):
    coupon_id: str
    analysis_date: datetime
    final_weight: float
    exposure_days: int
    corrosion_rate: float
    corrosion_type: CorrosionType
    pitting_density: Optional[float] = None
    max_pit_depth: Optional[float] = None
    visual_inspection: str
    microscopic_analysis: Optional[str] = None
    cleaned_by: str
    analyzed_by: str
    approved_by: str
    images: List[str] = []
    recommendations: str
    manual_override_severity: Optional[int] = None

class CorrosionAnalysisUpdate(BaseModel):
    analysis_date: Optional[datetime] = None
    final_weight: Optional[float] = None
    exposure_days: Optional[int] = None
    corrosion_rate: Optional[float] = None
    corrosion_type: Optional[CorrosionType] = None
    pitting_density: Optional[float] = None
    max_pit_depth: Optional[float] = None
    visual_inspection: Optional[str] = None
    microscopic_analysis: Optional[str] = None
    cleaned_by: Optional[str] = None
    analyzed_by: Optional[str] = None
    approved_by: Optional[str] = None
    images: Optional[List[str]] = None
    recommendations: Optional[str] = None
    manual_override_severity: Optional[int] = None

class CalculationFactors(BaseModel):
    rate_factor: float
    type_factor: float
    pitting_factor: float
    material_factor: float
    visual_factor: float

class CorrosionAnalysisResponse(BaseModel):
    report_id: int
    coupon_id: str
    analysis_date: datetime
    final_weight: float
    weight_loss: float
    exposure_days: int
    corrosion_rate: float
    corrosion_type: str
    pitting_density: Optional[float] = None
    max_pit_depth: Optional[float] = None
    visual_inspection: str
    microscopic_analysis: Optional[str] = None
    cleaned_by: str
    analyzed_by: str
    approved_by: str
    images: List[str]
    recommendations: str
    calculated_severity: int
    manual_override_severity: Optional[int] = None
    calculation_factors: Dict[str, float]
    created_at: datetime
    updated_at: datetime

class CorrosionAnalysisDetailResponse(CorrosionAnalysisResponse):
    coupon: Optional[dict] = None

class SeverityCalculationRequest(BaseModel):
    coupon_id: str
    corrosion_rate: float
    corrosion_type: CorrosionType
    pitting_density: Optional[float] = None
    max_pit_depth: Optional[float] = None
    visual_inspection: str
    microscopic_analysis: Optional[str] = None

class SeverityCalculationResponse(BaseModel):
    calculated_severity: int
    calculation_factors: CalculationFactors

router = APIRouter()

@router.get("/", response_model=List[CorrosionAnalysisResponse])
def get_all_analyses(
    coupon_id: Optional[str] = None,
    min_severity: Optional[int] = None,
    max_severity: Optional[int] = None,
    session: Session = Depends(get_session),
    skip: int = 0,
    limit: int = 100
):
    """
    Get a list of all analysis reports, optionally filtered by coupon
    """
    query = select(CorrosionAnalysisReport)
    
    # Apply filters if provided
    if coupon_id:
        query = query.where(CorrosionAnalysisReport.coupon_id == coupon_id)
    if min_severity is not None:
        query = query.where(CorrosionAnalysisReport.calculated_severity >= min_severity)
    if max_severity is not None:
        query = query.where(CorrosionAnalysisReport.calculated_severity <= max_severity)
        
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    reports = session.exec(query).all()
    return reports

@router.get("/{report_id}", response_model=CorrosionAnalysisDetailResponse)
def get_analysis_by_id(report_id: int, session: Session = Depends(get_session)):
    """
    Get details for a specific analysis report
    """
    query = select(CorrosionAnalysisReport).where(CorrosionAnalysisReport.report_id == report_id)
    report = session.exec(query).first()
    
    if not report:
        raise HTTPException(status_code=404, detail=f"Analysis report with ID {report_id} not found")
    
    # Get coupon details
    coupon_query = select(CorrosionCoupon).where(CorrosionCoupon.coupon_id == report.coupon_id)
    coupon = session.exec(coupon_query).first()
    
    # Convert to dict to add the coupon info
    report_dict = dict(report)
    report_dict["coupon"] = dict(coupon) if coupon else None
    
    return report_dict

@router.post("/", response_model=CorrosionAnalysisResponse)
def create_analysis(analysis_data: CorrosionAnalysisCreate, session: Session = Depends(get_session)):
    """
    Create a new analysis report
    """
    # Check if coupon exists and is in removed status
    coupon = session.exec(
        select(CorrosionCoupon).where(CorrosionCoupon.coupon_id == analysis_data.coupon_id)
    ).first()
    
    if not coupon:
        raise HTTPException(
            status_code=400,
            detail=f"Coupon with ID {analysis_data.coupon_id} not found"
        )
    
    if coupon.status == CouponStatus.Installed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot analyze coupon {analysis_data.coupon_id} because it is still installed"
        )
    
    # Calculate weight loss
    weight_loss = coupon.initial_weight - analysis_data.final_weight
    if weight_loss < 0:
        raise HTTPException(
            status_code=400,
            detail="Final weight cannot be greater than initial weight"
        )
    
    # Get the global settings for severity calculation
    settings_query = select(CorrosionMonitoringSettings)
    settings = session.exec(settings_query).first()
    
    if not settings:
        raise HTTPException(
            status_code=500,
            detail="Corrosion monitoring settings not found. Please configure the system first."
        )
    
    # Calculate severity
    report_data = analysis_data.dict()
    report_data["weight_loss"] = weight_loss
    severity_result = calculate_severity(report_data, coupon, settings)
    
    # Create new analysis report
    new_report = CorrosionAnalysisReport(
        **analysis_data.dict(),
        weight_loss=weight_loss,
        calculated_severity=severity_result["calculated_severity"],
        calculation_factors=severity_result["calculation_factors"]
    )
    
    # Update coupon status to analyzed
    coupon.status = CouponStatus.Analyzed
    coupon.updated_at = datetime.utcnow()
    
    session.add(new_report)
    session.add(coupon)
    session.commit()
    session.refresh(new_report)
    
    return new_report

@router.put("/{report_id}", response_model=CorrosionAnalysisResponse)
def update_analysis(
    report_id: int, 
    analysis_data: CorrosionAnalysisUpdate, 
    session: Session = Depends(get_session)
):
    """
    Update an existing analysis report
    """
    report = session.exec(
        select(CorrosionAnalysisReport).where(CorrosionAnalysisReport.report_id == report_id)
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail=f"Analysis report with ID {report_id} not found")
    
    # Update fields
    update_data = analysis_data.dict(exclude_unset=True)
    
    # If final_weight is updated, recalculate weight_loss
    if "final_weight" in update_data:
        coupon = session.exec(
            select(CorrosionCoupon).where(CorrosionCoupon.coupon_id == report.coupon_id)
        ).first()
        
        if not coupon:
            raise HTTPException(
                status_code=404, 
                detail=f"Coupon with ID {report.coupon_id} not found"
            )
        
        update_data["weight_loss"] = coupon.initial_weight - update_data["final_weight"]
        if update_data["weight_loss"] < 0:
            raise HTTPException(
                status_code=400,
                detail="Final weight cannot be greater than initial weight"
            )
    
    # Apply updates
    for key, value in update_data.items():
        setattr(report, key, value)
    
    # Recalculate severity if relevant fields are updated
    severity_impacting_fields = {
        "corrosion_rate", "corrosion_type", "pitting_density", 
        "max_pit_depth", "visual_inspection", "microscopic_analysis"
    }
    
    if any(field in update_data for field in severity_impacting_fields):
        coupon = session.exec(
            select(CorrosionCoupon).where(CorrosionCoupon.coupon_id == report.coupon_id)
        ).first()
        
        settings_query = select(CorrosionMonitoringSettings)
        settings = session.exec(settings_query).first()
        
        if not settings:
            raise HTTPException(
                status_code=500,
                detail="Corrosion monitoring settings not found"
            )
        
        # Create a dictionary with the current report data
        report_data = {
            "corrosion_rate": report.corrosion_rate,
            "corrosion_type": report.corrosion_type,
            "pitting_density": report.pitting_density,
            "max_pit_depth": report.max_pit_depth,
            "visual_inspection": report.visual_inspection,
            "microscopic_analysis": report.microscopic_analysis,
        }
        
        # Calculate new severity
        severity_result = calculate_severity(report_data, coupon, settings)
        report.calculated_severity = severity_result["calculated_severity"]
        report.calculation_factors = severity_result["calculation_factors"]
    
    # Update the updated_at timestamp
    report.updated_at = datetime.utcnow()
    
    session.add(report)
    session.commit()
    session.refresh(report)
    
    return report

@router.delete("/{report_id}")
def delete_analysis(report_id: int, session: Session = Depends(get_session)):
    """
    Delete an analysis report
    """
    report = session.exec(
        select(CorrosionAnalysisReport).where(CorrosionAnalysisReport.report_id == report_id)
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail=f"Analysis report with ID {report_id} not found")
    
    # Change coupon status back to Removed if it was Analyzed
    coupon = session.exec(
        select(CorrosionCoupon).where(CorrosionCoupon.coupon_id == report.coupon_id)
    ).first()
    
    if coupon and coupon.status == CouponStatus.Analyzed:
        coupon.status = CouponStatus.Removed
        coupon.updated_at = datetime.utcnow()
        session.add(coupon)
    
    session.delete(report)
    session.commit()
    
    return {"message": f"Analysis report {report_id} has been deleted"}

@router.post("/calculate-severity", response_model=SeverityCalculationResponse)
def calculate_severity_endpoint(
    calculation_data: SeverityCalculationRequest, 
    session: Session = Depends(get_session)
):
    """
    Calculate severity without saving an analysis report
    """
    # Check if coupon exists
    coupon = session.exec(
        select(CorrosionCoupon).where(CorrosionCoupon.coupon_id == calculation_data.coupon_id)
    ).first()
    
    if not coupon:
        raise HTTPException(
            status_code=400,
            detail=f"Coupon with ID {calculation_data.coupon_id} not found"
        )
    
    # Get the global settings
    settings_query = select(CorrosionMonitoringSettings)
    settings = session.exec(settings_query).first()
    
    if not settings:
        raise HTTPException(
            status_code=500,
            detail="Corrosion monitoring settings not found. Please configure the system first."
        )
    
    # Calculate severity
    result = calculate_severity(calculation_data.dict(), coupon, settings)
    
    return result
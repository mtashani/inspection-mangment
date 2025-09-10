from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from datetime import datetime, date, timedelta
from app.database import get_session
from app.domains.daily_report.models.report import DailyReport
from app.domains.daily_report.models.schemas import (
    DailyReportCreateRequest,
    DailyReportUpdateRequest,
    DailyReportResponse
)

router = APIRouter()

@router.get("/", response_model=List[DailyReportResponse])
def get_daily_reports(
    skip: int = 0,
    limit: int = 100,
    inspection_id: Optional[int] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    inspector_names: Optional[str] = None,
    db: Session = Depends(get_session)
):
    """Get list of daily reports with filtering"""
    query = select(DailyReport)
    
    if inspection_id:
        query = query.filter(DailyReport.inspection_id == inspection_id)
    if from_date:
        query = query.filter(DailyReport.report_date >= from_date)
    if to_date:
        query = query.filter(DailyReport.report_date <= to_date)
    if inspector_names:
        query = query.filter(DailyReport.inspector_names.contains(inspector_names))
    
    query = query.order_by(DailyReport.report_date.desc())
    
    reports = db.exec(query.offset(skip).limit(limit)).all()
    return [DailyReportResponse.from_orm(report) for report in reports]

@router.post("/", response_model=DailyReportResponse)
def create_daily_report(
    report_data: DailyReportCreateRequest,
    db: Session = Depends(get_session)
):
    """Create a new daily report"""
    # Create DailyReport instance from request data
    report = DailyReport(
        inspection_id=report_data.inspection_id,
        report_date=report_data.report_date,
        description=report_data.description,
        inspector_ids=report_data.inspector_ids,
        inspector_names=report_data.inspector_names,
        findings=report_data.findings,
        recommendations=report_data.recommendations,
        safety_notes=report_data.safety_notes,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(report)
    try:
        db.commit()
        db.refresh(report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return DailyReportResponse.from_orm(report)

@router.get("/{report_id}", response_model=DailyReportResponse)
def get_daily_report(
    report_id: int,
    db: Session = Depends(get_session)
):
    """Get a daily report by ID"""
    report = db.get(DailyReport, report_id)
    if not report:
        raise HTTPException(
            status_code=404,
            detail=f"Daily report with ID {report_id} not found"
        )
    return DailyReportResponse.from_orm(report)

@router.put("/{report_id}", response_model=DailyReportResponse)
def update_daily_report(
    report_id: int,
    report_update: DailyReportUpdateRequest,
    db: Session = Depends(get_session)
):
    """Update a daily report"""
    db_report = db.get(DailyReport, report_id)
    if not db_report:
        raise HTTPException(status_code=404, detail="Daily report not found")
    
    # Update fields only if provided in request
    update_data = report_update.dict(exclude_unset=True)
    
    # Update the report
    for key, value in update_data.items():
        setattr(db_report, key, value)
    
    db_report.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return DailyReportResponse.from_orm(db_report)

@router.delete("/{report_id}")
def delete_daily_report(
    report_id: int,
    db: Session = Depends(get_session)
):
    """Delete a daily report"""
    report = db.get(DailyReport, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Daily report not found")
    
    try:
        db.delete(report)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return {"message": "Report deleted successfully"}

# Basic summary endpoint
@router.get("/summary")
def get_reports_summary(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_session)
):
    """Get basic summary of daily reports"""
    query = select(DailyReport)
    
    if from_date:
        query = query.filter(DailyReport.report_date >= from_date)
    if to_date:
        query = query.filter(DailyReport.report_date <= to_date)
    
    reports = db.exec(query).all()
    
    return {
        "total_reports": len(reports),
        "date_range": {
            "from": from_date,
            "to": to_date
        },
        "reports_by_inspection": [
            {
                "inspection_id": report.inspection_id,
                "report_date": report.report_date,
                "description": report.description
            }
            for report in reports
        ]
    }
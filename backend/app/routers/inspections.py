from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List
from ..database import get_session
from ..models import Inspection, DailyReport, DailyReportInspector, Equipment, InspectionStatus
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

router = APIRouter()

@router.get("/check-in-progress/{equipment_code}")
def check_in_progress_inspection(
    equipment_code: str,
    session: Session = Depends(get_session)
):
    try:
        # Get equipment ID
        equipment = session.exec(
            select(Equipment).filter(Equipment.equipment_code == equipment_code)
        ).first()
        
        if not equipment:
            raise HTTPException(status_code=404, detail="Equipment not found")
        
        # Check for in-progress inspections
        inspection = session.exec(
            select(Inspection)
            .filter(Inspection.equipment_id == equipment.id)
            .filter(Inspection.status == InspectionStatus.IN_PROGRESS)
        ).first()
        
        return {
            "has_in_progress": inspection is not None,
            "message": "An inspection is already in progress for this equipment" if inspection else None
        }
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{inspection_id}")
def delete_inspection(
    inspection_id: int,
    session: Session = Depends(get_session)
):
    try:
        inspection = session.get(Inspection, inspection_id)
        if not inspection:
            raise HTTPException(status_code=404, detail="Inspection not found")

        # Get all daily reports for this inspection
        daily_reports = session.exec(
            select(DailyReport)
            .filter(DailyReport.inspection_id == inspection_id)
        ).all()

        # Delete all inspector associations and daily reports
        for report in daily_reports:
            # Delete inspector associations
            inspector_links = session.exec(
                select(DailyReportInspector)
                .filter(DailyReportInspector.daily_report_id == report.id)
            ).all()
            for link in inspector_links:
                session.delete(link)
            
            # Delete the daily report
            session.delete(report)

        # Finally delete the inspection
        session.delete(inspection)
        session.commit()
        return {"message": "Inspection and all associated reports deleted successfully"}
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=400, detail="Unable to delete due to database constraints")
    except SQLAlchemyError as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
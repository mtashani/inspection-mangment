from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, or_, and_, delete
from typing import List, Optional
from ..database import get_session
from ..models import DailyReport, DailyReportInspector, Inspector, Inspection, InspectionStatus, Equipment
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy import distinct, func

router = APIRouter()

class DailyReportUpdate(BaseModel):
    description: Optional[str] = None
    inspector_ids: Optional[List[int]] = None
    report_date: Optional[datetime] = None

class InspectionResponse(BaseModel):
    id: int
    equipment_code: str
    start_date: datetime
    status: str
    daily_reports: List[dict]

class NewInspectionRequest(BaseModel):
    equipment_code: str
    start_date: datetime

class NewDailyReportRequest(BaseModel):
    inspection_id: int
    description: str
    inspector_ids: List[int]
    report_date: datetime

@router.get("/inspections")
def get_inspections(
    session: Session = Depends(get_session),
    status: Optional[str] = Query(None, regex="^(IN_PROGRESS|COMPLETED)$"),
    page: int = Query(1, gt=0),
    page_size: int = Query(10, gt=0),
    from_date: Optional[str] = None,
    to_date: Optional[str] = None
):
    try:
        # Start with a query that joins Inspection with DailyReport
        base_query = (
            select(Inspection)
            .outerjoin(DailyReport)  # Use outer join to include inspections without reports
        )

        # Apply date range filter if provided
        if from_date and to_date:
            from_datetime = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
            to_datetime = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
            to_datetime = to_datetime.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            # Get inspection IDs that have reports in the date range
            inspection_ids_with_reports = (
                session.query(DailyReport.inspection_id)
                .filter(
                    and_(
                        DailyReport.report_date >= from_datetime,
                        DailyReport.report_date <= to_datetime
                    )
                )
                .distinct()
                .all()
            )
            
            if inspection_ids_with_reports:
                # Convert list of tuples to list of IDs
                valid_inspection_ids = [id_[0] for id_ in inspection_ids_with_reports]
                base_query = base_query.where(Inspection.id.in_(valid_inspection_ids))
            else:
                return {"data": [], "total": 0}

        # Apply status filter if provided
        if status:
            base_query = base_query.where(Inspection.status == status)

        # Make query distinct to avoid duplicates from the join
        distinct_query = base_query.distinct()

        # Count total before pagination
        total = len(session.exec(distinct_query).all())

        # Apply pagination
        paginated_query = distinct_query.offset((page - 1) * page_size).limit(page_size)
        inspections = session.exec(paginated_query).all()

        # Format response
        response = []
        for inspection in inspections:
            equipment = session.get(Equipment, inspection.equipment_id)
            daily_reports = []
            
            for report in inspection.daily_reports:
                inspector_links = session.exec(
                    select(DailyReportInspector)
                    .where(DailyReportInspector.daily_report_id == report.id)
                ).all()
                
                inspectors = [
                    {"id": link.inspector_id, "name": session.get(Inspector, link.inspector_id).name}
                    for link in inspector_links
                ]
                
                daily_reports.append({
                    "id": report.id,
                    "inspection_id": report.inspection_id,
                    "report_date": report.report_date,
                    "description": report.description,
                    "inspectors": inspectors,
                    "inspection": {"status": inspection.status}
                })
            
            response.append({
                "id": inspection.id,
                "equipment_code": equipment.equipment_code,
                "start_date": inspection.start_date,
                "status": inspection.status,
                "daily_reports": sorted(daily_reports, key=lambda x: x["report_date"])
            })
        
        return {"data": response, "total": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/inspections", response_model=InspectionResponse)
async def create_inspection(
    request: NewInspectionRequest,
    session: Session = Depends(get_session)
):
    try:
        # Find the equipment by code
        equipment = session.exec(
            select(Equipment).where(Equipment.equipment_code == request.equipment_code)
        ).first()
        
        if not equipment:
            raise HTTPException(status_code=404, detail="Equipment not found")
            
        # Check if there's an existing in-progress inspection
        existing_inspection = session.exec(
            select(Inspection)
            .where(and_(
                Inspection.equipment_id == equipment.id,
                Inspection.status == InspectionStatus.IN_PROGRESS
            ))
        ).first()
        
        if existing_inspection:
            raise HTTPException(
                status_code=400,
                detail=f"An inspection is already in progress for equipment {request.equipment_code}"
            )
        
        # Create new inspection
        new_inspection = Inspection(
            equipment_id=equipment.id,
            start_date=request.start_date,
            status=InspectionStatus.IN_PROGRESS
        )
        
        session.add(new_inspection)
        session.commit()
        session.refresh(new_inspection)
        
        # Format response
        return {
            "id": new_inspection.id,
            "equipment_code": equipment.equipment_code,
            "start_date": new_inspection.start_date,
            "status": new_inspection.status,
            "daily_reports": []
        }
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reports", response_model=dict)
async def create_daily_report(
    request: NewDailyReportRequest,
    session: Session = Depends(get_session)
):
    try:
        inspection = session.get(Inspection, request.inspection_id)
        if not inspection:
            raise HTTPException(status_code=404, detail="Inspection not found")
            
        if inspection.status != InspectionStatus.IN_PROGRESS:
            raise HTTPException(status_code=400, detail="Cannot add reports to a completed inspection")

        # Create new daily report
        new_report = DailyReport(
            inspection_id=request.inspection_id,
            report_date=request.report_date,
            description=request.description
        )
        session.add(new_report)
        session.flush()  # Get the ID before committing

        # Create inspector links
        for inspector_id in request.inspector_ids:
            inspector_link = DailyReportInspector(
                daily_report_id=new_report.id,
                inspector_id=inspector_id
            )
            session.add(inspector_link)

        session.commit()
        session.refresh(new_report)

        # Get inspector details
        inspector_links = session.exec(
            select(DailyReportInspector)
            .where(DailyReportInspector.daily_report_id == new_report.id)
        ).all()

        inspectors = [
            {"id": link.inspector_id, "name": session.get(Inspector, link.inspector_id).name}
            for link in inspector_links
        ]

        return {
            "id": new_report.id,
            "inspection_id": new_report.inspection_id,
            "report_date": new_report.report_date,
            "description": new_report.description,
            "inspectors": inspectors,
            "inspection": {"status": inspection.status}
        }

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/reports/{report_id}", response_model=dict)
async def update_daily_report(
    report_id: int,
    request: DailyReportUpdate,
    session: Session = Depends(get_session)
):
    try:
        report = session.get(DailyReport, report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Daily report not found")

        inspection = session.get(Inspection, report.inspection_id)
        if inspection.status != InspectionStatus.IN_PROGRESS:
            raise HTTPException(status_code=400, detail="Cannot edit report of a completed inspection")

        if request.description is not None:
            report.description = request.description

        if request.report_date is not None:
            report.report_date = request.report_date

        if request.inspector_ids is not None:
            # Remove existing inspector links
            delete_query = delete(DailyReportInspector).where(DailyReportInspector.daily_report_id == report_id)
            session.exec(delete_query)

            # Create new inspector links
            for inspector_id in request.inspector_ids:
                inspector_link = DailyReportInspector(
                    daily_report_id=report_id,
                    inspector_id=inspector_id
                )
                session.add(inspector_link)

        session.commit()
        session.refresh(report)

        # Get updated inspector details
        inspector_links = session.exec(
            select(DailyReportInspector)
            .where(DailyReportInspector.daily_report_id == report.id)
        ).all()

        inspectors = [
            {"id": link.inspector_id, "name": session.get(Inspector, link.inspector_id).name}
            for link in inspector_links
        ]

        return {
            "id": report.id,
            "inspection_id": report.inspection_id,
            "report_date": report.report_date,
            "description": report.description,
            "inspectors": inspectors,
            "inspection": {"status": inspection.status}
        }

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/reports/{report_id}", response_model=dict)
async def delete_daily_report(
    report_id: int,
    session: Session = Depends(get_session)
):
    try:
        report = session.get(DailyReport, report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Daily report not found")

        inspection = session.get(Inspection, report.inspection_id)
        if inspection.status != InspectionStatus.IN_PROGRESS:
            raise HTTPException(status_code=400, detail="Cannot delete report of a completed inspection")

        # Delete inspector links first
        delete_stmt = delete(DailyReportInspector).where(DailyReportInspector.daily_report_id == report_id)
        session.exec(delete_stmt)

        # Delete the report
        session.delete(report)
        session.commit()

        return {"message": "Daily report deleted successfully"}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

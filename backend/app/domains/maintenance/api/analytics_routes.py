"""API routes for maintenance event analytics and reporting"""

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlmodel import Session, select, func, and_, or_, text
from typing import Dict, Any, List, Optional
from datetime import datetime, date
import logging

from app.database import get_session
from app.domains.maintenance.models.event import MaintenanceEvent, MaintenanceSubEvent
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.inspection_team import InspectionTeam
from app.domains.daily_report.models.report import DailyReport
from app.domains.equipment.models.equipment import Equipment
from app.domains.common.services.workflow_service import WorkflowService

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/events/{event_id}/summary")
async def get_event_summary(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Get comprehensive event summary with planned vs actual metrics"""
    try:
        # Verify event exists
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
        
        # Get planned inspections count (using is_planned flag)
        planned_count = session.exec(
            select(func.count(Inspection.id))
            .where(
                and_(
                    Inspection.maintenance_event_id == event_id,
                    Inspection.is_planned == True
                )
            )
        ).first() or 0
        
        # Get planned inspections that are completed
        planned_done = session.exec(
            select(func.count(Inspection.id))
            .where(
                and_(
                    Inspection.maintenance_event_id == event_id,
                    Inspection.is_planned == True,
                    Inspection.status.in_(['Completed', 'Closed', 'Approved'])
                )
            )
        ).first() or 0
        
        # Get unplanned inspections count
        unplanned_count = session.exec(
            select(func.count(Inspection.id))
            .where(
                and_(
                    Inspection.maintenance_event_id == event_id,
                    Inspection.is_planned == False
                )
            )
        ).first() or 0
        
        # Get unplanned inspections completed
        unplanned_done = session.exec(
            select(func.count(Inspection.id))
            .where(
                and_(
                    Inspection.maintenance_event_id == event_id,
                    Inspection.is_planned == False,
                    Inspection.status.in_(['Completed', 'Closed', 'Approved'])
                )
            )
        ).first() or 0
        
        # Calculate completion rates
        completion_rate_planned = round(100.0 * planned_done / planned_count, 2) if planned_count > 0 else None
        total_done = planned_done + unplanned_done
        total_planned = planned_count + unplanned_count
        overall_completion_rate = round(100.0 * total_done / total_planned, 2) if total_planned > 0 else 0
        
        return {
            "event_id": event_id,
            "event_number": event.event_number,
            "event_title": event.title,
            "planned_count": planned_count,
            "planned_done": planned_done,
            "unplanned_count": unplanned_count,
            "unplanned_done": unplanned_done,
            "completion_rate_planned": completion_rate_planned,
            "overall_completion_rate": overall_completion_rate,
            "total_inspections": total_planned,
            "total_completed": total_done
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get event summary for {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get event summary: {str(e)}")


@router.get("/events/{event_id}/gap-analysis")
async def get_gap_analysis(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Get planned vs actual gap analysis by equipment"""
    try:
        # Verify event exists
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
        
        # Get all equipment that has inspections in this event
        equipments = session.exec(
            select(Equipment)
            .join(Inspection)
            .where(Inspection.maintenance_event_id == event_id)
            .distinct()
        ).all()
        
        equipment_analysis = []
        for equipment in equipments:
            # Get planned inspections for this equipment (using is_planned flag)
            planned_count = session.exec(
                select(func.count(Inspection.id))
                .where(
                    and_(
                        Inspection.equipment_id == equipment.id,
                        Inspection.maintenance_event_id == event_id,
                        Inspection.is_planned == True
                    )
                )
            ).first() or 0
            
            # Get completed planned inspections
            planned_done = session.exec(
                select(func.count(Inspection.id))
                .where(
                    and_(
                        Inspection.equipment_id == equipment.id,
                        Inspection.maintenance_event_id == event_id,
                        Inspection.is_planned == True,
                        Inspection.status.in_(['Completed', 'Closed', 'Approved'])
                    )
                )
            ).first() or 0
            
            # Get completed unplanned inspections
            unplanned_done = session.exec(
                select(func.count(Inspection.id))
                .where(
                    and_(
                        Inspection.equipment_id == equipment.id,
                        Inspection.maintenance_event_id == event_id,
                        Inspection.is_planned == False,
                        Inspection.status.in_(['Completed', 'Closed', 'Approved'])
                    )
                )
            ).first() or 0
            
            gap = planned_count - planned_done
            
            if planned_count > 0 or planned_done > 0 or unplanned_done > 0:
                equipment_analysis.append({
                    "equipment_tag": equipment.tag,
                    "equipment_description": equipment.description,
                    "planned_count": planned_count,
                    "planned_done": planned_done,
                    "unplanned_done": unplanned_done,
                    "gap": gap,
                    "coverage_rate": round(100.0 * planned_done / planned_count, 2) if planned_count > 0 else None
                })
        
        # Sort by gap (descending) then by equipment tag
        equipment_analysis.sort(key=lambda x: (-x["gap"], x["equipment_tag"]))
        
        return {
            "event_id": event_id,
            "equipment_analysis": equipment_analysis,
            "summary": {
                "total_equipment": len(equipment_analysis),
                "equipment_with_gaps": len([eq for eq in equipment_analysis if eq["gap"] > 0]),
                "fully_covered_equipment": len([eq for eq in equipment_analysis if eq["gap"] == 0])
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get gap analysis for {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get gap analysis: {str(e)}")


@router.get("/events/{event_id}/department-performance")
async def get_department_performance(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Get performance breakdown by requesting department"""
    try:
        # Verify event exists
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
        
        # Get department performance data using the unified inspection model
        dept_performance = session.exec(
            select(
                Inspection.requesting_department,
                func.count(Inspection.id).filter(
                    Inspection.is_planned == True
                ).label("planned_count"),
                func.count(Inspection.id).filter(
                    and_(
                        Inspection.is_planned == True,
                        Inspection.status.in_(['Completed', 'Closed', 'Approved'])
                    )
                ).label("completed_count")
            )
            .where(Inspection.maintenance_event_id == event_id)
            .group_by(Inspection.requesting_department)
        ).all()
        
        department_data = []
        for dept_data in dept_performance:
            completion_rate = round(100.0 * dept_data.completed_count / dept_data.planned_count, 2) if dept_data.planned_count > 0 else 0
            department_data.append({
                "department": dept_data.requesting_department,
                "planned_count": dept_data.planned_count,
                "completed_count": dept_data.completed_count,
                "completion_rate": completion_rate
            })
        
        return {
            "event_id": event_id,
            "department_performance": department_data,
            "summary": {
                "total_departments": len(department_data),
                "best_performer": max(department_data, key=lambda x: x["completion_rate"])["department"] if department_data else None,
                "average_completion_rate": round(sum(d["completion_rate"] for d in department_data) / len(department_data), 2) if department_data else 0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get department performance for {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get department performance: {str(e)}")


@router.get("/events/{event_id}/timeline-analysis")
async def get_timeline_analysis(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Get timeline adherence analysis"""
    try:
        # Verify event exists
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
        
        # Get timeline analysis for completed inspections using unified model
        timeline_data = session.exec(
            select(
                Inspection.id,
                Inspection.inspection_number,
                Inspection.planned_start_date,
                Inspection.planned_end_date,
                Inspection.actual_start_date,
                Inspection.actual_end_date,
                Equipment.tag.label("equipment_tag")
            )
            .join(Equipment, Equipment.id == Inspection.equipment_id)
            .where(
                and_(
                    Inspection.maintenance_event_id == event_id,
                    Inspection.is_planned == True,
                    Inspection.status.in_(['Completed', 'Closed', 'Approved']),
                    Inspection.actual_start_date.is_not(None),
                    Inspection.actual_end_date.is_not(None)
                )
            )
        ).all()
        
        delays = []
        on_time_count = 0
        
        for inspection in timeline_data:
            start_delay = (inspection.actual_start_date - inspection.planned_start_date).days if inspection.actual_start_date and inspection.planned_start_date else 0
            end_delay = (inspection.actual_end_date - inspection.planned_end_date).days if inspection.actual_end_date and inspection.planned_end_date else 0
            
            is_on_time = start_delay <= 0 and end_delay <= 0
            if is_on_time:
                on_time_count += 1
            
            delays.append({
                "inspection_id": inspection.id,
                "inspection_number": inspection.inspection_number,
                "equipment_tag": inspection.equipment_tag,
                "start_delay_days": start_delay,
                "end_delay_days": end_delay,
                "is_on_time": is_on_time
            })
        
        avg_start_delay = round(sum(d["start_delay_days"] for d in delays) / len(delays), 1) if delays else 0
        avg_end_delay = round(sum(d["end_delay_days"] for d in delays) / len(delays), 1) if delays else 0
        on_time_rate = round(100.0 * on_time_count / len(delays), 2) if delays else 0
        
        return {
            "event_id": event_id,
            "timeline_analysis": delays,
            "summary": {
                "total_completed_inspections": len(delays),
                "on_time_count": on_time_count,
                "on_time_rate": on_time_rate,
                "avg_start_delay_days": avg_start_delay,
                "avg_end_delay_days": avg_end_delay
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get timeline analysis for {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get timeline analysis: {str(e)}")


@router.get("/events/{event_id}/subevents-breakdown")
async def get_subevents_breakdown(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Get breakdown analysis for all sub-events under a maintenance event"""
    try:
        # Verify event exists
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
        
        # Get all sub-events
        sub_events = session.exec(
            select(MaintenanceSubEvent).where(MaintenanceSubEvent.parent_event_id == event_id)
        ).all()
        
        sub_event_analysis = []
        
        for sub_event in sub_events:
            # Get planned inspections for this sub-event using unified model
            planned_count = session.exec(
                select(func.count(Inspection.id))
                .where(
                    and_(
                        Inspection.maintenance_sub_event_id == sub_event.id,
                        Inspection.is_planned == True
                    )
                )
            ).first() or 0
            
            # Get completed planned inspections
            planned_done = session.exec(
                select(func.count(Inspection.id))
                .where(
                    and_(
                        Inspection.maintenance_sub_event_id == sub_event.id,
                        Inspection.is_planned == True,
                        Inspection.status.in_(['Completed', 'Closed', 'Approved'])
                    )
                )
            ).first() or 0
            
            # Calculate completion rate
            completion_rate = round(100.0 * planned_done / planned_count, 2) if planned_count > 0 else None
            
            # Check if overdue (planned end date passed but not completed)
            is_overdue = (
                sub_event.status != "Completed" and 
                sub_event.planned_end_date and 
                sub_event.planned_end_date < date.today()
            )
            
            sub_event_analysis.append({
                "sub_event_id": sub_event.id,
                "sub_event_number": sub_event.sub_event_number,
                "title": sub_event.title,
                "status": sub_event.status,
                "planned_count": planned_count,
                "planned_done": planned_done,
                "completion_rate": completion_rate,
                "planned_start_date": sub_event.planned_start_date,
                "planned_end_date": sub_event.planned_end_date,
                "actual_start_date": sub_event.actual_start_date,
                "actual_end_date": sub_event.actual_end_date,
                "is_overdue": is_overdue,
                "completion_percentage": sub_event.completion_percentage
            })
        
        # Calculate summary
        total_sub_events = len(sub_event_analysis)
        completed_sub_events = len([se for se in sub_event_analysis if se["status"] == "Completed"])
        overdue_sub_events = len([se for se in sub_event_analysis if se["is_overdue"]])
        
        return {
            "event_id": event_id,
            "event_number": event.event_number,
            "event_title": event.title,
            "sub_events_analysis": sub_event_analysis,
            "summary": {
                "total_sub_events": total_sub_events,
                "completed_sub_events": completed_sub_events,
                "overdue_sub_events": overdue_sub_events,
                "completion_rate": round(100.0 * completed_sub_events / total_sub_events, 2) if total_sub_events > 0 else 0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get sub-events breakdown for {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get sub-events breakdown: {str(e)}")


@router.get("/events/{event_id}/unplanned-analysis")
async def get_unplanned_analysis(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Get detailed analysis of unplanned inspections"""
    try:
        # Verify event exists
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
        
        # Get unplanned inspections with details using unified model
        unplanned_inspections = session.exec(
            select(Inspection)
            .where(
                and_(
                    Inspection.maintenance_event_id == event_id,
                    Inspection.is_planned == False
                )
            )
            .order_by(Inspection.created_at.desc())
        ).all()
        
        # Analyze by reasons
        reason_breakdown = {}
        total_unplanned = len(unplanned_inspections)
        completed_unplanned = 0
        
        for inspection in unplanned_inspections:
            reason = inspection.unplanned_reason or "No reason specified"
            if reason not in reason_breakdown:
                reason_breakdown[reason] = {"count": 0, "completed": 0}
            
            reason_breakdown[reason]["count"] += 1
            
            if inspection.status in ['Completed', 'Closed', 'Approved']:
                reason_breakdown[reason]["completed"] += 1
                completed_unplanned += 1
        
        # Get total inspections for comparison
        total_inspections = session.exec(
            select(func.count(Inspection.id))
            .where(Inspection.maintenance_event_id == event_id)
        ).first() or 0
        
        total_completed = session.exec(
            select(func.count(Inspection.id))
            .where(
                and_(
                    Inspection.maintenance_event_id == event_id,
                    Inspection.status.in_(['Completed', 'Closed', 'Approved'])
                )
            )
        ).first() or 0
        
        # Calculate shares
        unplanned_share = round(100.0 * total_unplanned / total_inspections, 2) if total_inspections > 0 else 0
        unplanned_completion_rate = round(100.0 * completed_unplanned / total_unplanned, 2) if total_unplanned > 0 else 0
        
        return {
            "event_id": event_id,
            "event_number": event.event_number,
            "event_title": event.title,
            "unplanned_count": total_unplanned,
            "unplanned_completed": completed_unplanned,
            "unplanned_share_percent": unplanned_share,
            "unplanned_completion_rate": unplanned_completion_rate,
            "reason_breakdown": [
                {
                    "reason": reason,
                    "count": data["count"],
                    "completed": data["completed"],
                    "completion_rate": round(100.0 * data["completed"] / data["count"], 2) if data["count"] > 0 else 0
                }
                for reason, data in reason_breakdown.items()
            ],
            "total_inspections": total_inspections,
            "total_completed": total_completed
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get unplanned analysis for {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get unplanned analysis: {str(e)}")


@router.get("/events/{event_id}/backlog")
async def get_event_backlog(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Get backlog of planned but not completed inspections"""
    try:
        # Verify event exists
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
        
        # Get planned inspections that are not completed using unified model
        backlog_inspections = session.exec(
            select(Inspection)
            .where(
                and_(
                    Inspection.maintenance_event_id == event_id,
                    Inspection.is_planned == True,
                    Inspection.status.not_in(['Completed', 'Closed', 'Approved'])
                )
            )
            .order_by(Inspection.planned_start_date.asc())
        ).all()
        
        backlog_items = []
        for inspection in backlog_inspections:
            # Calculate days overdue
            days_overdue = 0
            if inspection.planned_start_date:
                days_overdue = (date.today() - inspection.planned_start_date).days
            
            backlog_items.append({
                "plan_id": inspection.id,  # Using inspection ID instead of plan ID
                "equipment_tag": inspection.equipment.tag if inspection.equipment else "Unknown",
                "plan_description": inspection.description,
                "planned_start_date": inspection.planned_start_date,
                "planned_end_date": inspection.planned_end_date,
                "priority": "Medium",  # Default priority since we don't have it in the unified model
                "requester": inspection.requesting_department,
                "inspection_id": inspection.id,
                "current_status": inspection.status,
                "days_overdue": days_overdue,
                "is_overdue": days_overdue > 0
            })
        
        # Calculate summary
        total_backlog = len(backlog_items)
        overdue_items = len([item for item in backlog_items if item["is_overdue"]])
        critical_items = 0  # We don't have priority in the unified model
        
        return {
            "event_id": event_id,
            "event_number": event.event_number,
            "event_title": event.title,
            "backlog_items": backlog_items,
            "summary": {
                "total_backlog": total_backlog,
                "overdue_items": overdue_items,
                "critical_items": critical_items,
                "oldest_overdue_days": max([item["days_overdue"] for item in backlog_items], default=0)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get backlog for {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get backlog: {str(e)}")


@router.get("/events/{event_id}/inspectors-workload")
async def get_inspectors_workload(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Get inspector workload analysis for the event"""
    try:
        # Verify event exists
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
        
        # Get inspector workload data
        workload_query = """
        SELECT 
            it.user_id as inspector_id,
            u.name as inspector_name,
            COUNT(it.inspection_id) as inspections_count,
            COALESCE(SUM(it.man_hours), 0) as total_man_hours,
            COALESCE(AVG(it.man_hours), 0) as avg_hours_per_inspection,
            COUNT(CASE WHEN i.status IN ('Completed', 'Closed', 'Approved') THEN 1 END) as completed_inspections
        FROM inspection_team it
        JOIN inspections i ON i.id = it.inspection_id
        LEFT JOIN users u ON u.id = it.user_id
        WHERE i.maintenance_event_id = :event_id
        GROUP BY it.user_id, u.name
        ORDER BY total_man_hours DESC
        """
        
        try:
            result = session.exec(text(workload_query).params(event_id=event_id))
            workload_data = []
            
            for row in result:
                workload_data.append({
                    "inspector_id": row.inspector_id,
                    "inspector_name": row.inspector_name or f"User {row.inspector_id}",
                    "inspections_count": row.inspections_count,
                    "total_man_hours": round(row.total_man_hours, 2),
                    "avg_hours_per_inspection": round(row.avg_hours_per_inspection, 2),
                    "completed_inspections": row.completed_inspections,
                    "completion_rate": round(100.0 * row.completed_inspections / row.inspections_count, 2) if row.inspections_count > 0 else 0
                })
        except Exception:
            # Fallback if users table doesn't exist or join fails
            workload_data = []
        
        # Calculate summary
        total_inspectors = len(workload_data)
        total_hours = sum([wd["total_man_hours"] for wd in workload_data])
        avg_hours_per_inspector = round(total_hours / total_inspectors, 2) if total_inspectors > 0 else 0
        
        return {
            "event_id": event_id,
            "event_number": event.event_number,
            "event_title": event.title,
            "inspector_workload": workload_data,
            "summary": {
                "total_inspectors": total_inspectors,
                "total_man_hours": round(total_hours, 2),
                "avg_hours_per_inspector": avg_hours_per_inspector,
                "top_performer": workload_data[0]["inspector_name"] if workload_data else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get inspector workload for {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get inspector workload: {str(e)}")


@router.get("/events/{event_id}/equipment-coverage")
async def get_equipment_coverage(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Get equipment coverage and first-time inspection analysis"""
    try:
        # Verify event exists
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
        
        # Get all equipment that has inspections in this event
        equipments = session.exec(
            select(Equipment)
            .join(Inspection)
            .where(Inspection.maintenance_event_id == event_id)
            .distinct()
        ).all()
        
        coverage_data = []
        for equipment in equipments:
            # Get inspections for this equipment in this event
            equipment_inspections = session.exec(
                select(Inspection)
                .where(
                    and_(
                        Inspection.equipment_id == equipment.id,
                        Inspection.maintenance_event_id == event_id
                    )
                )
            ).all()
            
            inspection_count = len(equipment_inspections)
            is_inspected = inspection_count > 0
            
            # Check if this is a first-time inspection (no previous inspections for this equipment)
            previous_inspections = session.exec(
                select(func.count(Inspection.id))
                .where(
                    and_(
                        Inspection.equipment_id == equipment.id,
                        Inspection.maintenance_event_id != event_id
                    )
                )
            ).first() or 0
            
            is_first_time = previous_inspections == 0
            
            coverage_data.append({
                "equipment_id": equipment.id,
                "equipment_tag": equipment.tag,
                "equipment_description": equipment.description,
                "is_inspected": is_inspected,
                "inspection_count": inspection_count,
                "is_first_time": is_first_time
            })
        
        # Calculate summary
        total_equipment = len(coverage_data)
        inspected_equipment = len([cd for cd in coverage_data if cd["is_inspected"]])
        first_time_equipment = len([cd for cd in coverage_data if cd["is_first_time"]])
        coverage_percentage = round(100.0 * inspected_equipment / total_equipment, 2) if total_equipment > 0 else 0
        
        return {
            "event_id": event_id,
            "event_number": event.event_number,
            "event_title": event.title,
            "equipment_coverage": coverage_data,
            "summary": {
                "total_equipment": total_equipment,
                "inspected_equipment": inspected_equipment,
                "first_time_equipment": first_time_equipment,
                "coverage_percentage": coverage_percentage,
                "first_time_percentage": round(100.0 * first_time_equipment / total_equipment, 2) if total_equipment > 0 else 0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get equipment coverage for {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get equipment coverage: {str(e)}")


@router.get("/inspections/{inspection_id}/daily-report-coverage")
async def get_daily_report_coverage(
    inspection_id: int = Path(..., description="Inspection ID"),
    session: Session = Depends(get_session)
):
    """Get daily report coverage analysis for an inspection"""
    try:
        # Verify inspection exists
        inspection = session.get(Inspection, inspection_id)
        if not inspection:
            raise HTTPException(status_code=404, detail=f"Inspection {inspection_id} not found")
        
        # Calculate expected working days
        if inspection.actual_start_date and inspection.actual_end_date:
            start_date = inspection.actual_start_date
            end_date = inspection.actual_end_date
        else:
            start_date = inspection.actual_start_date
            end_date = inspection.actual_end_date or date.today()
        
        # Calculate working days (excluding weekends)
        current_date = start_date
        expected_days = 0
        while current_date <= end_date:
            # Count only weekdays (Monday=0, Sunday=6)
            if current_date.weekday() < 5:  # Monday to Friday
                expected_days += 1
            current_date = date.fromordinal(current_date.toordinal() + 1)
        
        # Get actual daily reports
        actual_reports = session.exec(
            select(DailyReport)
            .where(DailyReport.inspection_id == inspection_id)
            .order_by(DailyReport.report_date)
        ).all()
        
        actual_report_days = len(set([report.report_date for report in actual_reports]))
        coverage_percentage = round(100.0 * actual_report_days / expected_days, 2) if expected_days > 0 else 0
        
        # Identify missing days
        report_dates = set([report.report_date for report in actual_reports])
        missing_days = []
        
        current_date = start_date
        while current_date <= end_date:
            if current_date.weekday() < 5 and current_date not in report_dates:
                missing_days.append(current_date)
            current_date = date.fromordinal(current_date.toordinal() + 1)
        
        return {
            "inspection_id": inspection_id,
            "inspection_number": inspection.inspection_number,
            "start_date": start_date,
            "end_date": end_date,
            "expected_report_days": expected_days,
            "actual_report_days": actual_report_days,
            "coverage_percentage": coverage_percentage,
            "missing_days": missing_days,
            "is_compliant": coverage_percentage >= 80,  # 80% threshold
            "reports_summary": {
                "total_reports": len(actual_reports),
                "unique_days": actual_report_days,
                "missing_count": len(missing_days)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get daily report coverage for {inspection_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get daily report coverage: {str(e)}")


@router.get("/events/{event_id}/workflow-permissions")
async def get_event_workflow_permissions(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Get workflow permissions and business rules for an event"""
    try:
        workflow_service = WorkflowService(session)
        permissions = workflow_service.get_event_workflow_permissions(event_id)
        
        if not permissions:
            raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
        
        return {
            "event_id": event_id,
            "permissions": permissions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get workflow permissions for {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get workflow permissions: {str(e)}")
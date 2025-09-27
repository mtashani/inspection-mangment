# Dashboard Service for Admin Panel - Real-time statistics and overview data
from typing import Dict, List, Optional
from sqlmodel import Session, select, func, text, and_
from datetime import datetime, date, timedelta
from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.attendance import AttendanceRecord, MonthlyAttendance
from app.domains.inspector.models.enums import AttendanceStatus
from app.common.utils import jalali_calendar


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_real_time_stats(self) -> Dict:
        """Get real-time dashboard statistics"""
        
        try:
            # Simple count queries
            total_inspectors = len(self.db.exec(select(Inspector)).all())
            active_inspectors = len(self.db.exec(select(Inspector).where(Inspector.active == True)).all())
            attendance_enabled_inspectors = len([
                i for i in self.db.exec(select(Inspector)).all() 
                if i.active and i.attendance_tracking_enabled
            ])
            
            # Today's attendance - simplified
            today = date.today()
            today_records = self.db.exec(select(AttendanceRecord).where(AttendanceRecord.date == today)).all()
            present_today = len([r for r in today_records if r.status == AttendanceStatus.WORKING])
            
            return {
                "total_inspectors": total_inspectors,
                "active_inspectors": active_inspectors,
                "attendance_enabled_inspectors": attendance_enabled_inspectors,
                "present_today": present_today,
                "attendance_rate_today": round((present_today / max(attendance_enabled_inspectors, 1)) * 100, 1),
                "monthly_stats": {
                    "total_records": len(today_records),
                    "working_percentage": round((present_today / max(len(today_records), 1)) * 100, 1),
                    "status_counts": {
                        status.value: len([r for r in today_records if r.status == status])
                        for status in AttendanceStatus
                    }
                },
                "last_updated": datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"Dashboard stats error: {e}")
            return {
                "total_inspectors": 0,
                "active_inspectors": 0,
                "attendance_enabled_inspectors": 0,
                "present_today": 0,
                "attendance_rate_today": 0.0,
                "monthly_stats": {},
                "last_updated": datetime.utcnow().isoformat()
            }

    def get_today_attendance_summary(self) -> Dict:
        """Get today's attendance summary across all inspectors"""
        today = date.today()
        
        # Get all attendance records for today
        today_records = self.db.exec(
            select(AttendanceRecord).where(AttendanceRecord.date == today)
        ).all()
        
        # Count by status
        status_counts = {}
        for status in AttendanceStatus:
            status_counts[status.value] = 0
        
        inspector_details = []
        
        for record in today_records:
            status_counts[record.status.value] += 1
            
            # Get inspector details
            inspector = self.db.get(Inspector, record.inspector_id)
            if inspector:
                inspector_details.append({
                    "inspector_id": record.inspector_id,
                    "inspector_name": f"{inspector.first_name} {inspector.last_name}",
                    "employee_id": inspector.employee_id,
                    "status": record.status.value,
                    "regular_hours": record.regular_hours,
                    "overtime_hours": record.overtime_hours,
                    "is_override": record.is_override,
                    "notes": record.notes
                })
        
        # Get inspectors with attendance enabled but no record for today
        inspectors_with_attendance = self.db.exec(
            select(Inspector).where(
                and_(
                    Inspector.active == True,
                    Inspector.attendance_tracking_enabled == True
                )
            )
        ).all()
        
        recorded_inspector_ids = {record.inspector_id for record in today_records}
        missing_records = []
        
        for inspector in inspectors_with_attendance:
            if inspector.id not in recorded_inspector_ids:
                missing_records.append({
                    "inspector_id": inspector.id,
                    "inspector_name": f"{inspector.first_name} {inspector.last_name}",
                    "employee_id": inspector.employee_id,
                    "status": "NOT_RECORDED"
                })
        
        return {
            "date": today.isoformat(),
            "jalali_date": jalali_calendar.gregorian_to_jalali_str(today),
            "status_summary": status_counts,
            "total_recorded": len(today_records),
            "total_expected": len(inspectors_with_attendance),
            "missing_records": missing_records,
            "inspector_details": inspector_details
        }

    def get_monthly_overview_data(self, jalali_year: int, jalali_month: int) -> Dict:
        """Get monthly overview data for all inspectors"""
        
        # Convert Jalali month to Gregorian date range
        start_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, 1)
        days_in_month = jalali_calendar.get_jalali_month_days(jalali_year, jalali_month)
        end_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, days_in_month)
        
        # Get all active inspectors with attendance tracking
        inspectors = self.db.exec(
            select(Inspector).where(
                and_(
                    Inspector.active == True,
                    Inspector.attendance_tracking_enabled == True
                )
            )
        ).all()
        
        # Get all attendance records for the month
        attendance_records = self.db.exec(
            select(AttendanceRecord).where(
                and_(
                    AttendanceRecord.date >= start_date,
                    AttendanceRecord.date <= end_date
                )
            )
        ).all()
        
        # Group records by inspector
        records_by_inspector = {}
        for record in attendance_records:
            if record.inspector_id not in records_by_inspector:
                records_by_inspector[record.inspector_id] = []
            records_by_inspector[record.inspector_id].append(record)
        
        # Calculate statistics for each inspector
        inspector_summaries = []
        total_working_days = 0
        total_present_days = 0
        
        for inspector in inspectors:
            records = records_by_inspector.get(inspector.id, [])
            
            working_days = len([r for r in records if r.status == AttendanceStatus.WORKING])
            resting_days = len([r for r in records if r.status == AttendanceStatus.RESTING])
            leave_days = len([r for r in records if r.status == AttendanceStatus.LEAVE])
            absent_days = len([r for r in records if r.status == AttendanceStatus.ABSENT])
            
            total_overtime = sum(r.overtime_hours for r in records)
            total_regular = sum(r.regular_hours for r in records)
            
            attendance_rate = (working_days / max(len(records), 1)) * 100 if records else 0
            
            inspector_summaries.append({
                "inspector_id": inspector.id,
                "inspector_name": f"{inspector.first_name} {inspector.last_name}",
                "employee_id": inspector.employee_id,
                "working_days": working_days,
                "resting_days": resting_days,
                "leave_days": leave_days,
                "absent_days": absent_days,
                "total_days_recorded": len(records),
                "total_regular_hours": total_regular,
                "total_overtime_hours": total_overtime,
                "attendance_rate": round(attendance_rate, 1)
            })
            
            total_working_days += working_days
            total_present_days += len(records)
        
        # Overall statistics
        overall_stats = self._get_monthly_overview_stats(jalali_year, jalali_month)
        
        return {
            "year": jalali_year,
            "month": jalali_month,
            "month_name": jalali_calendar.get_jalali_month_name(jalali_month),
            "days_in_month": days_in_month,
            "total_inspectors": len(inspectors),
            "inspector_summaries": inspector_summaries,
            "overall_stats": overall_stats
        }

    def _get_monthly_overview_stats(self, jalali_year: int, jalali_month: int) -> Dict:
        """Get monthly overview statistics"""
        
        # Convert to Gregorian date range
        start_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, 1)
        days_in_month = jalali_calendar.get_jalali_month_days(jalali_year, jalali_month)
        end_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, days_in_month)
        
        # Count records by status
        status_counts = {}
        for status in AttendanceStatus:
            count = self.db.exec(
                select(func.count(AttendanceRecord.id)).where(
                    and_(
                        AttendanceRecord.date >= start_date,
                        AttendanceRecord.date <= end_date,
                        AttendanceRecord.status == status
                    )
                )
            ).first()
            status_counts[status.value] = count or 0
        
        # Calculate totals
        total_records = sum(status_counts.values())
        working_percentage = (status_counts.get('WORKING', 0) / max(total_records, 1)) * 100
        
        # Get overtime statistics using raw SQL
        try:
            result = self.db.connection().execute(
                text("""
                    SELECT 
                        SUM(overtime_hours) as total_overtime,
                        AVG(overtime_hours) as avg_overtime,
                        COUNT(CASE WHEN overtime_hours > 0 THEN 1 END) as days_with_overtime
                    FROM attendancerecord 
                    WHERE date >= :start_date AND date <= :end_date
                """),
                {"start_date": start_date, "end_date": end_date}
            ).first()
            overtime_stats = result
        except Exception as e:
            print(f"Error executing overtime query: {e}")
            overtime_stats = None
        
        return {
            "status_counts": status_counts,
            "total_records": total_records,
            "working_percentage": round(working_percentage, 1),
            "total_overtime_hours": overtime_stats.total_overtime or 0 if overtime_stats else 0,
            "average_overtime_hours": round(overtime_stats.avg_overtime or 0, 1) if overtime_stats else 0,
            "days_with_overtime": overtime_stats.days_with_overtime or 0 if overtime_stats else 0
        }

    def get_recent_activities(self, limit: int = 10) -> List[Dict]:
        """Get recent attendance activities and changes"""
        
        # Get recent attendance records (created or updated in last 7 days)
        recent_cutoff = datetime.utcnow() - timedelta(days=7)
        
        recent_records = self.db.exec(
            select(AttendanceRecord).where(
                AttendanceRecord.updated_at >= recent_cutoff
            ).order_by(AttendanceRecord.updated_at.desc()).limit(limit)
        ).all()
        
        activities = []
        for record in recent_records:
            inspector = self.db.get(Inspector, record.inspector_id)
            if inspector:
                activity_type = "override" if record.is_override else "record"
                activities.append({
                    "id": record.id,
                    "type": activity_type,
                    "inspector_id": record.inspector_id,
                    "inspector_name": f"{inspector.first_name} {inspector.last_name}",
                    "date": record.date.isoformat(),
                    "jalali_date": jalali_calendar.gregorian_to_jalali_str(record.date),
                    "status": record.status.value,
                    "notes": record.notes,
                    "timestamp": record.updated_at.isoformat()
                })
        
        return activities
# NEW/DDD: AttendanceService for domain logic
from typing import List, Optional
from sqlmodel import Session, select, desc
import datetime
from app.domains.inspector.models.attendance import AttendanceRecord, LeaveRequest, WorkCycle, MonthlyAttendance
from app.domains.inspector.models.enums import AttendanceStatus, LeaveRequestStatus, WorkScheduleType
from app.domains.inspector.schemas.attendance import (
    AttendanceRecordCreate, AttendanceRecordUpdate, LeaveRequestCreate, LeaveRequestUpdate
)
from app.common.utils import jalali_calendar
from app.common.services.date_conversion_service import DateConversionService

class AttendanceService:
    def __init__(self, db: Session):
        self.db = db
        
    def get_attendance_by_id(self, attendance_id: int) -> Optional[AttendanceRecord]:
        """Get a specific attendance record by ID."""
        return self.db.get(AttendanceRecord, attendance_id)
        
    def get_all_attendance(self, jalali_year: int, jalali_month: int) -> List[AttendanceRecord]:
        """Get all attendance records for a Jalali month (admin only)."""
        # Convert Jalali month range to Gregorian date range
        start_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, 1)
        days_in_month = jalali_calendar.get_jalali_month_days(jalali_year, jalali_month)
        end_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, days_in_month)
        
        # Query using Gregorian date range for all inspectors
        records = list(self.db.exec(
            select(AttendanceRecord).where(
                AttendanceRecord.date >= start_date,
                AttendanceRecord.date <= end_date
            ).order_by(AttendanceRecord.inspector_id, AttendanceRecord.date)
        ))
        
        return records
        
    def create_attendance(self, data: AttendanceRecordCreate) -> AttendanceRecord:
        """Create a new attendance record (admin only)."""
        # Resolve input date
        resolved_date = DateConversionService.resolve_date_input(data.date, data.jalali_date)
        
        # Create new record
        record_data = data.model_dump(exclude={"jalali_date"})
        record_data["date"] = resolved_date
        record = AttendanceRecord(**record_data)
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record
        
    def update_attendance(self, attendance_id: int, data: AttendanceRecordUpdate) -> AttendanceRecord:
        """Update an existing attendance record (admin only)."""
        record = self.db.get(AttendanceRecord, attendance_id)
        if not record:
            raise ValueError("Attendance record not found")
            
        # Resolve input date if provided
        if data.date or data.jalali_date:
            resolved_date = DateConversionService.resolve_date_input(data.date, data.jalali_date)
            record.date = resolved_date
            
        # Update other fields
        for field, value in data.model_dump(exclude={"date", "jalali_date"}).items():
            if value is not None:
                setattr(record, field, value)
                
        record.updated_at = datetime.datetime.utcnow()
        self.db.commit()
        self.db.refresh(record)
        return record
        
    def delete_attendance(self, attendance_id: int) -> None:
        """Delete an attendance record (admin only)."""
        record = self.db.get(AttendanceRecord, attendance_id)
        if not record:
            raise ValueError("Attendance record not found")
            
        self.db.delete(record)
        self.db.commit()

    def get_attendance(self, inspector_id: int, jalali_year: int, jalali_month: int) -> List[AttendanceRecord]:
        """Get attendance records for an inspector for a Jalali month (recorded + predicted)."""
        # Convert Jalali month range to Gregorian date range
        start_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, 1)
        days_in_month = jalali_calendar.get_jalali_month_days(jalali_year, jalali_month)
        end_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, days_in_month)
        
        # Query using Gregorian date range
        records = list(self.db.exec(
            select(AttendanceRecord).where(
                AttendanceRecord.inspector_id == inspector_id,
                AttendanceRecord.date >= start_date,
                AttendanceRecord.date <= end_date
            ).order_by(AttendanceRecord.date)
        ))
        
        if records:
            return records
            
        # اگر داده ثبت‌شده وجود ندارد و ماه جاری یا آینده است، پیش‌بینی کن
        today = jalali_calendar.gregorian_to_jalali_str(datetime.date.today())
        today_year, today_month, _ = map(int, today.split('-'))
        if (jalali_year > today_year) or (jalali_year == today_year and jalali_month >= today_month):
            # سیکل کاری فعال بازرس را پیدا کن
            work_cycle = self.db.exec(
                select(WorkCycle).where(
                    WorkCycle.inspector_id == inspector_id
                ).order_by(desc(WorkCycle.start_date))
            ).first()
            if not work_cycle:
                return []
            # محاسبه حضور و غیاب پیش‌بینی‌شده (بدون ثبت در دیتابیس)
            cycle_start_date = work_cycle.start_date
            cycle_type = work_cycle.cycle_type
            predicted_records = []
            for day in range(1, days_in_month + 1):
                g_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, day)
                if cycle_type == WorkScheduleType.fourteen_fourteen:
                    delta = (g_date - cycle_start_date).days
                    if delta < 0:
                        status = AttendanceStatus.RESTING
                    else:
                        status = AttendanceStatus.WORKING if 0 <= (delta % 28) < 14 else AttendanceStatus.RESTING
                elif cycle_type == WorkScheduleType.seven_seven:
                    delta = (g_date - cycle_start_date).days
                    if delta < 0:
                        status = AttendanceStatus.RESTING
                    else:
                        status = AttendanceStatus.WORKING if 0 <= (delta % 14) < 7 else AttendanceStatus.RESTING
                elif cycle_type == WorkScheduleType.office:
                    weekday = g_date.weekday()
                    status = AttendanceStatus.WORKING if weekday not in [4, 5] else AttendanceStatus.RESTING
                else:
                    status = AttendanceStatus.WORKING
                predicted_records.append(AttendanceRecord(
                    inspector_id=inspector_id,
                    date=g_date,
                    status=status,
                    is_override=False
                ))
            return predicted_records
        # اگر ماه گذشته است و داده ثبت‌شده وجود ندارد، خروجی خالی بده
        return []

    def create_or_update_attendance(self, inspector_id: int, data: AttendanceRecordCreate) -> AttendanceRecord:
        """Create or update an attendance record for a specific day."""
        # Resolve input date
        resolved_date = DateConversionService.resolve_date_input(data.date, data.jalali_date)
        
        # Find existing record by Gregorian date only
        record = self.db.exec(
            select(AttendanceRecord).where(
                AttendanceRecord.inspector_id == inspector_id,
                AttendanceRecord.date == resolved_date
            )
        ).first()
        
        if record:
            # Update existing record
            for field, value in data.model_dump(exclude={"date", "jalali_date"}).items():
                if value is not None:
                    setattr(record, field, value)
            record.date = resolved_date  # Update with resolved date
            record.updated_at = datetime.datetime.utcnow()
        else:
            # Create new record
            record_data = data.model_dump(exclude={"jalali_date"})
            record_data["date"] = resolved_date
            record = AttendanceRecord(inspector_id=inspector_id, **record_data)
            self.db.add(record)
        
        self.db.commit()
        self.db.refresh(record)
        
        # Update the corresponding MonthlyAttendance so it reflects the new change
        jalali_year, jalali_month, jalali_day = jalali_calendar.gregorian_to_jalali(resolved_date)
        monthly = self.db.exec(
            select(MonthlyAttendance).where(
                MonthlyAttendance.inspector_id == inspector_id,
                MonthlyAttendance.year == jalali_year,
                MonthlyAttendance.month == jalali_month
            )
        ).first()
        if monthly:
            import copy
            new_days = copy.deepcopy(monthly.days)
            jalali_date_str = jalali_calendar.gregorian_to_jalali_str(resolved_date)
            updated = False
            for i, d in enumerate(new_days):
                if d.get('jalali_date') == jalali_date_str:
                    new_days[i] = {
                        'date': record.date.isoformat(),
                        'jalali_date': jalali_date_str,
                        'status': record.status.value if hasattr(record.status, 'value') else record.status,
                        'is_override': record.is_override,
                        'override_reason': record.override_reason,
                        'overtime_hours': record.overtime_hours,
                        'night_shift_hours': record.night_shift_hours,
                        'on_call_hours': record.on_call_hours,
                        'notes': record.notes
                    }
                    updated = True
                    break
            if not updated:
                new_days.append({
                    'date': record.date.isoformat(),
                    'jalali_date': jalali_date_str,
                    'status': record.status.value if hasattr(record.status, 'value') else record.status,
                    'is_override': record.is_override,
                    'override_reason': record.override_reason,
                    'overtime_hours': record.overtime_hours,
                    'night_shift_hours': record.night_shift_hours,
                    'on_call_hours': record.on_call_hours,
                    'notes': record.notes
                })
            monthly.days = new_days
            monthly.updated_at = datetime.datetime.utcnow()
            self.db.add(monthly)
            self.db.commit()
            self.db.refresh(monthly)
        return record

    def generate_attendance(self, inspector_id: int, work_cycle_id: int, jalali_year: int, jalali_month: int) -> list:
        """
        Generate attendance records for a given inspector and work cycle for a Jalali month.
        """
        # Fetch work cycle
        work_cycle = self.db.get(WorkCycle, work_cycle_id)
        if not work_cycle or work_cycle.inspector_id != inspector_id:
            raise ValueError("Work cycle not found or does not belong to inspector")
        start_date = work_cycle.start_date
        cycle_type = work_cycle.cycle_type
        # Determine number of days in Jalali month
        days_in_month = jalali_calendar.get_jalali_month_days(jalali_year, jalali_month)
        records = []
        for day in range(1, days_in_month + 1):
            g_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, day)
            jalali_date_str = f"{jalali_year}-{jalali_month:02d}-{day:02d}"
            if cycle_type == WorkScheduleType.office:
                # فقط برای اداری پنجشنبه/جمعه و تعطیلات رسمی تعطیل است
                weekday = g_date.weekday()
                status = AttendanceStatus.WORKING if weekday not in [4, 5] else AttendanceStatus.RESTING
                if jalali_calendar.is_iran_holiday(jalali_date_str):
                    status = AttendanceStatus.RESTING
            elif cycle_type == WorkScheduleType.fourteen_fourteen:
                delta = (g_date - start_date).days
                if delta < 0:
                    status = AttendanceStatus.RESTING
                else:
                    status = AttendanceStatus.WORKING if 0 <= (delta % 28) < 14 else AttendanceStatus.RESTING
            elif cycle_type == WorkScheduleType.seven_seven:
                delta = (g_date - start_date).days
                if delta < 0:
                    status = AttendanceStatus.RESTING
                else:
                    status = AttendanceStatus.WORKING if 0 <= (delta % 14) < 7 else AttendanceStatus.RESTING
            else:
                status = AttendanceStatus.WORKING
            # Create or update record
            record = self.db.exec(
                select(AttendanceRecord).where(
                    AttendanceRecord.inspector_id == inspector_id,
                    AttendanceRecord.date == g_date
                )
            ).first()
            if record:
                record.status = status
                record.updated_at = datetime.datetime.utcnow()
            else:
                record = AttendanceRecord(
                    inspector_id=inspector_id,
                    date=g_date,
                    status=status
                )
                self.db.add(record)
            records.append(record)
        self.db.commit()
        # TODO: Handle leave requests and overrides
        return records

    def get_leave_requests(self, inspector_id: int, status: Optional[LeaveRequestStatus] = None) -> List[LeaveRequest]:
        """Get leave requests for an inspector."""
        query = select(LeaveRequest).where(LeaveRequest.inspector_id == inspector_id)
        if status:
            query = query.where(LeaveRequest.status == status)
        return list(self.db.exec(query))

    def create_leave_request(self, inspector_id: int, data: LeaveRequestCreate) -> LeaveRequest:
        """Create a leave request."""
        leave = LeaveRequest(inspector_id=inspector_id, **data.dict())
        self.db.add(leave)
        self.db.commit()
        self.db.refresh(leave)
        return leave

    def approve_leave_request(self, request_id: int, approver_id: int) -> LeaveRequest:
        """Approve a leave request and update attendance days."""
        leave = self.db.get(LeaveRequest, request_id)
        if not leave:
            raise ValueError("Leave request not found")
        leave.status = LeaveRequestStatus.Approved
        leave.approved_by = approver_id
        leave.approved_at = datetime.datetime.utcnow()
        self.db.commit()
        self.db.refresh(leave)
        # Update attendance records for leave days
        current_date = leave.start_date
        while current_date <= leave.end_date:
            record = self.db.exec(
                select(AttendanceRecord).where(
                    AttendanceRecord.inspector_id == leave.inspector_id,
                    AttendanceRecord.date == current_date
                )
            ).first()
            if record:
                record.status = AttendanceStatus.LEAVE
                record.is_override = True
                record.updated_at = datetime.datetime.utcnow()
            else:
                record = AttendanceRecord(
                    inspector_id=leave.inspector_id,
                    date=current_date,
                    status=AttendanceStatus.LEAVE,
                    is_override=True
                )
                self.db.add(record)
            current_date += datetime.timedelta(days=1)
        self.db.commit()
        return leave

    def reject_leave_request(self, request_id: int, reason: str) -> LeaveRequest:
        """Reject a leave request."""
        leave = self.db.get(LeaveRequest, request_id)
        if not leave:
            raise ValueError("Leave request not found")
        leave.status = LeaveRequestStatus.Denied
        leave.rejection_reason = reason
        self.db.commit()
        self.db.refresh(leave)
        return leave

    def override_attendance(self, inspector_id: int, data: AttendanceRecordUpdate) -> AttendanceRecord:
        """Override attendance for a specific day (admin only)."""
        # Resolve input date
        resolved_date = DateConversionService.resolve_date_input(data.date, data.jalali_date)
        
        record = self.db.exec(
            select(AttendanceRecord).where(
                AttendanceRecord.inspector_id == inspector_id,
                AttendanceRecord.date == resolved_date
            )
        ).first()
        if not record:
            raise ValueError("Attendance record not found")
            
        for field, value in data.model_dump(exclude={"date", "jalali_date"}).items():
            if value is not None:
                setattr(record, field, value)
        record.date = resolved_date  # Update with resolved date
        record.is_override = True
        record.updated_at = datetime.datetime.utcnow()
        self.db.commit()
        self.db.refresh(record)
        return record

    def generate_monthly_attendance(self, inspector_id: int, jalali_year: int, jalali_month: int) -> Optional[MonthlyAttendance]:
        """Generate and store monthly attendance for an inspector if not exists. Always ensure the month is complete."""
        # Check if already exists
        monthly = self.db.exec(
            select(MonthlyAttendance).where(
                MonthlyAttendance.inspector_id == inspector_id,
                MonthlyAttendance.year == jalali_year,
                MonthlyAttendance.month == jalali_month
            )
        ).first()
        if monthly:
            return monthly
        # Convert Jalali month range to Gregorian date range
        start_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, 1)
        days_in_month = jalali_calendar.get_jalali_month_days(jalali_year, jalali_month)
        end_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, days_in_month)
        
        # Get all attendance records for this inspector and month using date range
        records = self.db.exec(
            select(AttendanceRecord)
            .where(AttendanceRecord.inspector_id == inspector_id)
            .where(AttendanceRecord.date >= start_date)
            .where(AttendanceRecord.date <= end_date)
            .order_by(AttendanceRecord.date)
        ).all()
        
        # پیدا کردن روزهای غایب
        existing_dates = {r.date for r in records}
        all_dates = {jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, day) for day in range(1, days_in_month+1)}
        missing_dates = all_dates - existing_dates
        if missing_dates:
            # آخرین سیکل کاری بازرس را پیدا کن
            work_cycle = self.db.exec(
                select(WorkCycle).where(
                    WorkCycle.inspector_id == inspector_id
                ).order_by(desc(WorkCycle.start_date))
            ).first()
            if work_cycle and work_cycle.id is not None:
                cycle_start_date = work_cycle.start_date
                cycle_type = work_cycle.cycle_type
                for g_date in sorted(missing_dates):
                    jalali_date_str = jalali_calendar.gregorian_to_jalali_str(g_date)
                    if cycle_type == WorkScheduleType.office:
                        weekday = g_date.weekday()
                        status = AttendanceStatus.WORKING if weekday not in [4, 5] else AttendanceStatus.RESTING
                        if jalali_calendar.is_iran_holiday(jalali_date_str):
                            status = AttendanceStatus.RESTING
                    elif cycle_type == WorkScheduleType.fourteen_fourteen:
                        delta = (g_date - cycle_start_date).days
                        status = AttendanceStatus.WORKING if 0 <= (delta % 28) < 14 else AttendanceStatus.RESTING
                    elif cycle_type == WorkScheduleType.seven_seven:
                        delta = (g_date - cycle_start_date).days
                        status = AttendanceStatus.WORKING if 0 <= (delta % 14) < 7 else AttendanceStatus.RESTING
                    else:
                        status = AttendanceStatus.WORKING
                    record = AttendanceRecord(
                        inspector_id=inspector_id,
                        date=g_date,
                        status=status
                    )
                    self.db.add(record)
                self.db.commit()
                # دوباره رکوردها را واکشی کن
                records = self.db.exec(
                    select(AttendanceRecord)
                    .where(AttendanceRecord.inspector_id == inspector_id)
                    .where(AttendanceRecord.date >= start_date)
                    .where(AttendanceRecord.date <= end_date)
                    .order_by(AttendanceRecord.date)
                ).all()
        days = [
            {
                "date": r.date.isoformat(),
                "jalali_date": jalali_calendar.gregorian_to_jalali_str(r.date),
                "status": r.status.value,
                "is_override": r.is_override
            }
            for r in records
        ]
        monthly = MonthlyAttendance(
            inspector_id=inspector_id,
            year=jalali_year,
            month=jalali_month,
            days=days
        )
        self.db.add(monthly)
        self.db.commit()
        self.db.refresh(monthly)
        return monthly 
# NEW/DDD: PayrollService for domain logic
from typing import List, Optional
from sqlmodel import Session, select
import datetime
from app.domains.inspector.models.payroll import PayrollRecord, PayrollItem, PayrollSettings
from app.domains.inspector.schemas.payroll import (
    PayrollRecordCreate, PayrollRecordUpdate, PayrollItemCreate, PayrollItemUpdate, PayrollSettingsCreate, PayrollSettingsUpdate
)
from app.domains.inspector.models.enums import PayrollStatus, PayrollItemType
from sqlalchemy import desc
from app.domains.inspector.services.attendance_service import AttendanceService

class PayrollService:
    def __init__(self, db: Session):
        self.db = db

    def get_payroll(self, inspector_id: int, jalali_year: int, jalali_month: int) -> Optional[PayrollRecord]:
        """Get payroll record for an inspector for a Jalali month."""
        return self.db.exec(
            select(PayrollRecord).where(
                PayrollRecord.inspector_id == inspector_id,
                PayrollRecord.jalali_year == jalali_year,
                PayrollRecord.jalali_month == jalali_month
            )
        ).first()

    def create_or_update_payroll(self, inspector_id: int, data: PayrollRecordCreate) -> PayrollRecord:
        """Create or update a payroll record for a Jalali month."""
        record = self.db.exec(
            select(PayrollRecord).where(
                PayrollRecord.inspector_id == inspector_id,
                PayrollRecord.jalali_year == data.jalali_year,
                PayrollRecord.jalali_month == data.jalali_month
            )
        ).first()
        if record:
            if record.status == PayrollStatus.Paid:
                raise ValueError("Cannot edit a paid payroll record.")
            for field, value in data.dict().items():
                setattr(record, field, value)
            record.updated_at = datetime.datetime.utcnow()
        else:
            record = PayrollRecord(inspector_id=inspector_id, **data.dict())
            self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def add_payroll_item(self, payroll_id: int, data: PayrollItemCreate) -> PayrollItem:
        """Add a payroll item."""
        item = PayrollItem(payroll_id=payroll_id, **data.dict())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def edit_payroll_item(self, item_id: int, data: PayrollItemUpdate) -> PayrollItem:
        """Edit a payroll item."""
        item = self.db.get(PayrollItem, item_id)
        if not item:
            raise ValueError("Payroll item not found")
        for field, value in data.dict().items():
            setattr(item, field, value)
        item.updated_at = datetime.datetime.utcnow()
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete_payroll_item(self, item_id: int) -> bool:
        """Delete a payroll item."""
        item = self.db.get(PayrollItem, item_id)
        if not item:
            raise ValueError("Payroll item not found")
        self.db.delete(item)
        self.db.commit()
        return True

    def auto_calculate_payroll(self, inspector_id: int, jalali_year: int, jalali_month: int) -> PayrollRecord:
        """Auto-calculate payroll items from attendance."""
        # Get attendance records for the month
        attendance_service = AttendanceService(self.db)
        attendance_records = attendance_service.get_attendance(inspector_id, jalali_year, jalali_month)
        present_days = sum(1 for r in attendance_records if r.status == 'present')
        overtime_hours = sum(r.overtime_hours for r in attendance_records)
        night_shift_hours = sum(r.night_shift_hours for r in attendance_records)
        on_call_hours = sum(r.on_call_hours for r in attendance_records)
        leave_days = sum(1 for r in attendance_records if r.status == 'excused')
        # Get or create payroll record
        record = self.db.exec(
            select(PayrollRecord).where(
                PayrollRecord.inspector_id == inspector_id,
                PayrollRecord.jalali_year == jalali_year,
                PayrollRecord.jalali_month == jalali_month
            )
        ).first()
        if not record:
            record = PayrollRecord(
                inspector_id=inspector_id,
                jalali_year=jalali_year,
                jalali_month=jalali_month,
                year=0,  # Set to 0 or calculate if needed
                month=0  # Set to 0 or calculate if needed
            )
            self.db.add(record)
            self.db.commit()
            self.db.refresh(record)
        # Get payroll settings
        settings = self.db.exec(
            select(PayrollSettings).where(PayrollSettings.inspector_id == inspector_id)
        ).first()
        if not settings:
            raise ValueError("Payroll settings not found for inspector")
        # Calculate pays
        record.total_working_days = present_days
        record.total_overtime_hours = overtime_hours
        record.total_night_shift_hours = night_shift_hours
        record.total_on_call_hours = on_call_hours
        record.total_leave_days = leave_days
        record.base_salary = present_days * settings.base_hourly_rate * 8
        record.overtime_pay = overtime_hours * settings.base_hourly_rate * settings.overtime_multiplier
        record.night_shift_pay = night_shift_hours * settings.base_hourly_rate * settings.night_shift_multiplier
        record.on_call_pay = on_call_hours * settings.base_hourly_rate * settings.on_call_multiplier
        record.total_pay = (
            record.base_salary + record.overtime_pay + record.night_shift_pay +
            record.on_call_pay + settings.housing_allowance + settings.transportation_allowance + settings.meal_allowance
        )
        record.updated_at = datetime.datetime.utcnow()
        self.db.commit()
        self.db.refresh(record)
        # Update payroll items
        # (Remove old items and add new ones for this month)
        old_items = list(self.db.exec(
            select(PayrollItem).where(PayrollItem.payroll_id == record.id)
        ))
        for item in old_items:
            self.db.delete(item)
        self.db.commit()
        if record.id is None:
            raise ValueError("PayrollRecord id is None after commit/refresh. Cannot create PayrollItems.")
        items = [
            PayrollItem(payroll_id=record.id, title="Base Salary", type=PayrollItemType.Salary, value=record.base_salary),
            PayrollItem(payroll_id=record.id, title="Overtime", type=PayrollItemType.Overtime, value=record.overtime_pay),
            PayrollItem(payroll_id=record.id, title="Night Shift", type=PayrollItemType.Overtime, value=record.night_shift_pay),
            PayrollItem(payroll_id=record.id, title="On Call", type=PayrollItemType.Overtime, value=record.on_call_pay),
            PayrollItem(payroll_id=record.id, title="Housing Allowance", type=PayrollItemType.Bonus, value=settings.housing_allowance),
            PayrollItem(payroll_id=record.id, title="Transportation Allowance", type=PayrollItemType.Bonus, value=settings.transportation_allowance),
            PayrollItem(payroll_id=record.id, title="Meal Allowance", type=PayrollItemType.Bonus, value=settings.meal_allowance),
        ]
        for item in items:
            self.db.add(item)
        self.db.commit()
        return record

    def get_visible_payrolls_for_inspector(self, inspector_id: int, today_jalali_year: int, today_jalali_month: int, today_jalali_day: int) -> List[PayrollRecord]:
        """Return payrolls visible to inspector: previous month, and current month if in last 5 days."""
        records = []
        # Previous month
        prev_month = today_jalali_month - 1
        prev_year = today_jalali_year
        if prev_month == 0:
            prev_month = 12
            prev_year -= 1
        prev_record = self.get_payroll(inspector_id, prev_year, prev_month)
        if prev_record:
            records.append(prev_record)
        # Current month (if in last 5 days)
        from app.common.utils import jalali_calendar
        days_in_month = jalali_calendar.get_jalali_month_days(today_jalali_year, today_jalali_month)
        if today_jalali_day > days_in_month - 5:
            curr_record = self.get_payroll(inspector_id, today_jalali_year, today_jalali_month)
            if curr_record:
                records.append(curr_record)
        return records

    def get_all_payrolls_for_inspector(self, inspector_id: int) -> List[PayrollRecord]:
        """Return all payroll records for an inspector, ordered by Jalali year and month descending (Jalali months)."""
        return list(self.db.exec(
            select(PayrollRecord)
            .where(PayrollRecord.inspector_id == inspector_id)
            .order_by(desc(getattr(PayrollRecord, 'jalali_year')), desc(getattr(PayrollRecord, 'jalali_month')))
        )) 
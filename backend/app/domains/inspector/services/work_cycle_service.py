# NEW/DDD: WorkCycleService for domain logic
from typing import List, Optional
from sqlmodel import Session, select, SQLModel
import datetime
from sqlalchemy import desc, text, and_, or_, delete, Table
from app.domains.inspector.models.attendance import WorkCycle, AttendanceRecord, MonthlyAttendance
from app.domains.inspector.schemas.work_cycle import WorkCycleCreate, WorkCycleUpdate
from app.domains.inspector.services.attendance_service import AttendanceService
from app.common.utils import jalali_calendar
from app.common.services.date_conversion_service import DateConversionService

class WorkCycleService:
    def __init__(self, db: Session):
        self.db = db

    def get_work_cycles(self, inspector_id: int) -> List[WorkCycle]:
        """Get all work cycles for an inspector."""
        query = select(WorkCycle).where(WorkCycle.inspector_id == inspector_id)
        return list(self.db.exec(query).all())

    def create_work_cycle(self, inspector_id: int, data: WorkCycleCreate) -> WorkCycle:
        """Create a new work cycle for an inspector."""
        # Resolve input date
        resolved_start_date = DateConversionService.resolve_date_input(data.start_date, data.jalali_start_date)
        
        # Create cycle with resolved date
        cycle_data = data.model_dump(exclude={"start_date", "jalali_start_date"})
        cycle_data["start_date"] = resolved_start_date
        cycle = WorkCycle(inspector_id=inspector_id, **cycle_data)
        self.db.add(cycle)
        self.db.commit()
        self.db.refresh(cycle)
        return cycle

    def update_work_cycle(self, cycle_id: int, data: WorkCycleUpdate) -> WorkCycle:
        cycle = self.db.get(WorkCycle, cycle_id)
        if not cycle:
            raise ValueError("Work cycle not found")
        
        update_data = data.model_dump(exclude_unset=True)
        
        # Resolve date input if provided
        new_start_date = None
        if "start_date" in update_data or "jalali_start_date" in update_data:
            new_start_date = DateConversionService.resolve_date_input(
                update_data.get("start_date"), 
                update_data.get("jalali_start_date")
            )
            
        # --- حذف رکوردهای حضور و غیاب آینده و امروز اگر start_date تغییر کند ---
        if new_start_date and new_start_date != cycle.start_date:
            jy, jm, jd = jalali_calendar.gregorian_to_jalali(new_start_date)
            
            # حذف رکوردهای حضور و غیاب آینده و امروز بر اساس تاریخ میلادی (date)
            attendance_table = Table(str(AttendanceRecord.__tablename__), SQLModel.metadata, autoload_with=self.db.bind)
            stmt_att = delete(attendance_table).where(
                (attendance_table.c.inspector_id == cycle.inspector_id) &
                (attendance_table.c.date >= new_start_date)
            )
            self.db.execute(stmt_att)
            
            # حذف رکوردهای ماهانه حضور و غیاب آینده و ماه جاری جلالی (بدون تغییر)
            monthly_table = Table(str(MonthlyAttendance.__tablename__), SQLModel.metadata, autoload_with=self.db.bind)
            stmt_month = delete(monthly_table).where(
                (monthly_table.c.inspector_id == cycle.inspector_id) &
                (
                    (monthly_table.c.year > jy) |
                    ((monthly_table.c.year == jy) & (monthly_table.c.month >= jm))
                )
            )
            self.db.execute(stmt_month)
            self.db.commit()
        # --- پایان حذف ---
        
        # Update cycle with resolved data
        clean_update_data = {k: v for k, v in update_data.items() if k not in ["start_date", "jalali_start_date"]}
        if new_start_date:
            clean_update_data["start_date"] = new_start_date
            
        for field, value in clean_update_data.items():
            setattr(cycle, field, value)
        cycle.updated_at = datetime.datetime.utcnow()
        self.db.commit()
        self.db.refresh(cycle)
        return cycle

# NEW: Attendance domain models for DDD
from typing import Optional
import datetime
from sqlmodel import SQLModel, Field
from app.domains.inspector.models.enums import AttendanceStatus, LeaveType, LeaveRequestStatus, WorkScheduleType
from sqlalchemy import Column, JSON

class AttendanceRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    inspector_id: int = Field(index=True)
    date: datetime.date = Field(index=True)
    status: AttendanceStatus
    is_override: bool = Field(default=False)
    override_reason: Optional[str] = None
    regular_hours: float = Field(default=8.0)
    overtime_hours: float = Field(default=0.0)
    night_shift_hours: float = Field(default=0.0)
    on_call_hours: float = Field(default=0.0)
    notes: Optional[str] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)


class WorkCycle(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    inspector_id: int = Field(index=True)
    start_date: datetime.date
    cycle_type: WorkScheduleType
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

class MonthlyAttendance(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    inspector_id: int = Field(index=True)
    year: int  # سال جلالی
    month: int  # ماه جلالی
    days: list = Field(default_factory=list, sa_column=Column(JSON))  # لیست AttendanceDay/AttendanceRecord به صورت dict
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow) 
    
    
class LeaveRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    inspector_id: int = Field(index=True)
    start_date: datetime.date
    end_date: datetime.date
    leave_type: LeaveType
    reason: str
    status: LeaveRequestStatus = Field(default=LeaveRequestStatus.Pending)
    approved_by: Optional[int] = None
    approved_at: Optional[datetime.datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
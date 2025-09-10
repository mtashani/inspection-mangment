# NEW: Attendance and LeaveRequest schemas
from typing import Optional, List, Dict, Any
import datetime
from pydantic import BaseModel, field_validator, model_validator, Field
from app.domains.inspector.models.enums import AttendanceStatus, LeaveType, LeaveRequestStatus
from app.domains.inspector.models.attendance import AttendanceRecord, WorkCycle
from app.common.services.date_conversion_service import DateConversionService
from app.common.utils import jalali_calendar

class AttendanceRecordCreate(BaseModel):
    # Accept either format, convert to datetime.date internally
    date: Optional[datetime.date] = None
    jalali_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    status: AttendanceStatus
    is_override: Optional[bool] = False
    override_reason: Optional[str] = None
    regular_hours: Optional[float] = 8.0
    overtime_hours: Optional[float] = 0.0
    night_shift_hours: Optional[float] = 0.0
    on_call_hours: Optional[float] = 0.0
    notes: Optional[str] = None
    
    @field_validator('jalali_date')
    @classmethod
    def validate_jalali_date(cls, v):
        if v and not DateConversionService.validate_jalali_date_string(v):
            raise ValueError("Invalid Jalali date format or values")
        return v
    
    @model_validator(mode='before')
    @classmethod
    def validate_date_input(cls, data):
        if isinstance(data, dict):
            date = data.get('date')
            jalali_date = data.get('jalali_date')
            if not date and not jalali_date:
                raise ValueError("Either date or jalali_date must be provided")
            if date and jalali_date:
                raise ValueError("Provide either date or jalali_date, not both")
        return data

class AttendanceRecordUpdate(BaseModel):
    # Same dual input support
    date: Optional[datetime.date] = None
    jalali_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    status: Optional[AttendanceStatus] = None
    is_override: Optional[bool] = None
    override_reason: Optional[str] = None
    regular_hours: Optional[float] = None
    overtime_hours: Optional[float] = None
    night_shift_hours: Optional[float] = None
    on_call_hours: Optional[float] = None
    notes: Optional[str] = None
    
    @field_validator('jalali_date')
    @classmethod
    def validate_jalali_date(cls, v):
        if v and not DateConversionService.validate_jalali_date_string(v):
            raise ValueError("Invalid Jalali date format or values")
        return v
    
    @model_validator(mode='before')
    @classmethod
    def validate_date_input(cls, data):
        if isinstance(data, dict):
            date = data.get('date')
            jalali_date = data.get('jalali_date')
            if date and jalali_date:
                raise ValueError("Provide either date or jalali_date, not both")
        return data

class AttendanceRecordResponse(BaseModel):
    # Always provide both formats in responses
    id: int
    inspector_id: int
    date: datetime.date
    jalali_date: str  # Computed from date
    status: AttendanceStatus
    is_override: bool
    override_reason: Optional[str]
    regular_hours: float
    overtime_hours: float
    night_shift_hours: float
    on_call_hours: float
    notes: Optional[str]
    created_by: Optional[int]
    updated_by: Optional[int]
    created_at: datetime.datetime
    updated_at: datetime.datetime
    
    @classmethod
    def from_model(cls, model: AttendanceRecord) -> "AttendanceRecordResponse":
        return cls(
            id=model.id,
            inspector_id=model.inspector_id,
            date=model.date,
            jalali_date=jalali_calendar.gregorian_to_jalali_str(model.date),
            status=model.status,
            is_override=model.is_override,
            override_reason=model.override_reason,
            regular_hours=model.regular_hours,
            overtime_hours=model.overtime_hours,
            night_shift_hours=model.night_shift_hours,
            on_call_hours=model.on_call_hours,
            notes=model.notes,
            created_by=model.created_by,
            updated_by=model.updated_by,
            created_at=model.created_at,
            updated_at=model.updated_at
        )

class LeaveRequestBase(BaseModel):
    start_date: datetime.date
    end_date: datetime.date
    leave_type: LeaveType
    reason: str

class LeaveRequestCreate(LeaveRequestBase):
    pass

class LeaveRequestUpdate(LeaveRequestBase):
    status: Optional[LeaveRequestStatus]
    rejection_reason: Optional[str]

class LeaveRequestResponse(LeaveRequestBase):
    id: int
    inspector_id: int
    status: LeaveRequestStatus
    approved_by: Optional[int]
    approved_at: Optional[datetime.datetime]
    rejection_reason: Optional[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime

class MonthlyAttendanceResponse(BaseModel):
    id: int
    inspector_id: int
    year: int
    month: int
    days: List[Dict[str, Any]]
    created_at: datetime.datetime
    updated_at: datetime.datetime
# NEW: Payroll domain models for DDD
from typing import Optional
import datetime
from sqlmodel import SQLModel, Field
from app.domains.inspector.models.enums import PayrollItemType
from app.domains.inspector.models.enums import PayrollStatus

class PayrollRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    inspector_id: int = Field(index=True)
    year: int = Field(index=True)
    month: int = Field(index=True)
    jalali_year: int = Field(index=True)
    jalali_month: int = Field(index=True)
    total_working_days: int = Field(default=0)
    total_overtime_hours: float = Field(default=0.0)
    total_night_shift_hours: float = Field(default=0.0)
    total_on_call_hours: float = Field(default=0.0)
    total_leave_days: int = Field(default=0)
    base_salary: float = Field(default=0.0)
    overtime_pay: float = Field(default=0.0)
    night_shift_pay: float = Field(default=0.0)
    on_call_pay: float = Field(default=0.0)
    total_pay: float = Field(default=0.0)
    status: PayrollStatus = Field(default=PayrollStatus.Draft, index=True)
    is_finalized: bool = Field(default=False)
    finalized_by: Optional[int] = None
    finalized_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

class PayrollItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    payroll_id: int = Field(index=True)
    title: str
    type: PayrollItemType
    value: float
    base: Optional[str] = None  # e.g. 'base_salary'
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

class PayrollSettings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    inspector_id: int = Field(index=True, unique=True)
    base_hourly_rate: float
    overtime_multiplier: float = Field(default=1.5)
    night_shift_multiplier: float = Field(default=2.0)
    on_call_multiplier: float = Field(default=1.25)
    housing_allowance: float = Field(default=0.0)
    transportation_allowance: float = Field(default=0.0)
    meal_allowance: float = Field(default=0.0)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow) 
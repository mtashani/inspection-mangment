# NEW: Payroll schemas
from typing import Optional
import datetime
from pydantic import BaseModel
from app.domains.inspector.models.enums import PayrollItemType

class PayrollRecordBase(BaseModel):
    year: int
    month: int
    jalali_year: int
    jalali_month: int
    total_working_days: int = 0
    total_overtime_hours: float = 0.0
    total_night_shift_hours: float = 0.0
    total_on_call_hours: float = 0.0
    total_leave_days: int = 0
    base_salary: float = 0.0
    overtime_pay: float = 0.0
    night_shift_pay: float = 0.0
    on_call_pay: float = 0.0
    total_pay: float = 0.0
    is_finalized: bool = False

class PayrollRecordCreate(PayrollRecordBase):
    pass

class PayrollRecordUpdate(PayrollRecordBase):
    pass

class PayrollRecordResponse(PayrollRecordBase):
    id: int
    inspector_id: int
    finalized_by: Optional[int]
    finalized_at: Optional[datetime.datetime]
    created_at: datetime.datetime
    updated_at: datetime.datetime

class PayrollItemBase(BaseModel):
    title: str
    type: PayrollItemType
    value: float
    base: Optional[str] = None

class PayrollItemCreate(PayrollItemBase):
    pass

class PayrollItemUpdate(PayrollItemBase):
    pass

class PayrollItemResponse(PayrollItemBase):
    id: int
    payroll_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

class PayrollSettingsBase(BaseModel):
    base_hourly_rate: float
    overtime_multiplier: float = 1.5
    night_shift_multiplier: float = 2.0
    on_call_multiplier: float = 1.25
    housing_allowance: float = 0.0
    transportation_allowance: float = 0.0
    meal_allowance: float = 0.0

class PayrollSettingsCreate(PayrollSettingsBase):
    pass

class PayrollSettingsUpdate(PayrollSettingsBase):
    pass

class PayrollSettingsResponse(PayrollSettingsBase):
    id: int
    inspector_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime 
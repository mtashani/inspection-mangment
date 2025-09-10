# NEW: WorkCycle schemas
from typing import Optional
import datetime
from pydantic import BaseModel, field_validator, model_validator, Field
from app.domains.inspector.models.enums import WorkScheduleType
from app.domains.inspector.models.attendance import WorkCycle
from app.common.services.date_conversion_service import DateConversionService
from app.common.utils import jalali_calendar

class WorkCycleCreate(BaseModel):
    # Accept either format, convert to datetime.date internally
    start_date: Optional[datetime.date] = None
    jalali_start_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    cycle_type: WorkScheduleType
    
    @field_validator('jalali_start_date')
    @classmethod
    def validate_jalali_start_date(cls, v):
        if v and not DateConversionService.validate_jalali_date_string(v):
            raise ValueError("Invalid Jalali start date format or values")
        return v
    
    @model_validator(mode='before')
    @classmethod
    def validate_date_input(cls, data):
        if isinstance(data, dict):
            start_date = data.get('start_date')
            jalali_start_date = data.get('jalali_start_date')
            if not start_date and not jalali_start_date:
                raise ValueError("Either start_date or jalali_start_date must be provided")
            if start_date and jalali_start_date:
                raise ValueError("Provide either start_date or jalali_start_date, not both")
        return data

class WorkCycleUpdate(BaseModel):
    # Same dual input support
    start_date: Optional[datetime.date] = None
    jalali_start_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    cycle_type: Optional[WorkScheduleType] = None
    
    @field_validator('jalali_start_date')
    @classmethod
    def validate_jalali_start_date(cls, v):
        if v and not DateConversionService.validate_jalali_date_string(v):
            raise ValueError("Invalid Jalali start date format or values")
        return v
    
    @model_validator(mode='before')
    @classmethod
    def validate_date_input(cls, data):
        if isinstance(data, dict):
            start_date = data.get('start_date')
            jalali_start_date = data.get('jalali_start_date')
            if start_date and jalali_start_date:
                raise ValueError("Provide either start_date or jalali_start_date, not both")
        return data

class WorkCycleResponse(BaseModel):
    # Always provide both formats in responses
    id: int
    inspector_id: int
    start_date: datetime.date
    jalali_start_date: str  # Computed from start_date
    cycle_type: WorkScheduleType
    created_at: datetime.datetime
    updated_at: datetime.datetime
    
    @classmethod
    def from_model(cls, model: WorkCycle) -> "WorkCycleResponse":
        return cls(
            id=model.id,
            inspector_id=model.inspector_id,
            start_date=model.start_date,
            jalali_start_date=jalali_calendar.gregorian_to_jalali_str(model.start_date),
            cycle_type=model.cycle_type,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
# Design Document

## Overview

This design document outlines the refactoring of date handling in the attendance system to eliminate redundant Jalali date storage in the database. The current system stores both `datetime.date` and `jalali_date` string fields, which creates data redundancy and potential consistency issues. The new design will store only standard `datetime.date` objects in the database and handle Jalali date conversion at the API/presentation layer.

## Architecture

### Current Architecture Issues
- **Data Redundancy**: Both Gregorian and Jalali dates are stored in database tables
- **Consistency Risk**: Potential for Gregorian and Jalali dates to become out of sync
- **Query Complexity**: Filtering and sorting operations are complicated by dual date storage
- **Storage Overhead**: Additional string fields consume unnecessary database space

### New Architecture Principles
- **Single Source of Truth**: Only `datetime.date` objects stored in database
- **Conversion at Boundaries**: Jalali conversion happens at API request/response boundaries
- **Backward Compatibility**: API responses maintain both date formats for frontend compatibility
- **Performance Optimization**: Database queries use native date types for optimal performance

## Components and Interfaces

### 1. Database Models (Domain Layer)

#### Modified Models
```python
class AttendanceRecord(SQLModel, table=True):
    # Remove: jalali_date: str
    date: datetime.date = Field(index=True)  # Keep only this
    # ... other fields remain unchanged

class WorkCycle(SQLModel, table=True):
    # Remove: jalali_start_date: str
    start_date: datetime.date  # Keep only this
    # ... other fields remain unchanged

class MonthlyAttendance(SQLModel, table=True):
    # Keep: year/month as Jalali calendar (no change needed)
    # Rationale: Monthly reports are business-oriented and naturally align with Jalali calendar
    # Simple queries: WHERE year=1403 AND month=3 for "خرداد ۱۴۰۳"
    year: int  # Jalali year (e.g., 1403)
    month: int  # Jalali month (1-12)
    # ... other fields remain unchanged
```

### 2. API Schemas (Presentation Layer)

#### Request DTOs
```python
class AttendanceRecordCreate(BaseModel):
    # Accept either format, convert to datetime.date internally
    date: Optional[datetime.date] = None
    jalali_date: Optional[str] = None  # Format: "YYYY-MM-DD"
    # ... other fields

class AttendanceRecordUpdate(BaseModel):
    # Same dual input support
    date: Optional[datetime.date] = None
    jalali_date: Optional[str] = None
    # ... other fields
```

#### Response DTOs
```python
class AttendanceRecordResponse(BaseModel):
    # Always provide both formats in responses
    date: datetime.date
    jalali_date: str  # Computed from date
    # ... other fields

    @classmethod
    def from_model(cls, model: AttendanceRecord) -> "AttendanceRecordResponse":
        return cls(
            date=model.date,
            jalali_date=jalali_calendar.gregorian_to_jalali_str(model.date),
            # ... other fields
        )
```

### 3. Service Layer

#### Date Conversion Service
```python
class DateConversionService:
    @staticmethod
    def resolve_date_input(date: Optional[datetime.date], jalali_date: Optional[str]) -> datetime.date:
        """Convert input date (either format) to datetime.date"""
        if date:
            return date
        elif jalali_date:
            jy, jm, jd = map(int, jalali_date.split("-"))
            return jalali_calendar.jalali_to_gregorian(jy, jm, jd)
        else:
            raise ValueError("Either date or jalali_date must be provided")
    
    @staticmethod
    def add_jalali_date_to_response(obj: dict, date_field: str = "date") -> dict:
        """Add jalali_date field to response object"""
        if date_field in obj and obj[date_field]:
            obj["jalali_date"] = jalali_calendar.gregorian_to_jalali_str(obj[date_field])
        return obj
```

#### Modified AttendanceService
```python
class AttendanceService:
    def get_attendance(self, inspector_id: int, jalali_year: int, jalali_month: int) -> List[AttendanceRecord]:
        # Convert Jalali month range to Gregorian date range
        start_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, 1)
        days_in_month = jalali_calendar.get_jalali_month_days(jalali_year, jalali_month)
        end_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, days_in_month)
        
        # Query using Gregorian date range
        records = self.db.exec(
            select(AttendanceRecord).where(
                AttendanceRecord.inspector_id == inspector_id,
                AttendanceRecord.date >= start_date,
                AttendanceRecord.date <= end_date
            ).order_by(AttendanceRecord.date)
        ).all()
        
        return records
    
    def create_or_update_attendance(self, inspector_id: int, data: AttendanceRecordCreate) -> AttendanceRecord:
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
            for field, value in data.dict(exclude={"date", "jalali_date"}).items():
                if value is not None:
                    setattr(record, field, value)
            record.date = resolved_date  # Update with resolved date
            record.updated_at = datetime.datetime.utcnow()
        else:
            # Create new record
            record_data = data.dict(exclude={"jalali_date"})
            record_data["date"] = resolved_date
            record = AttendanceRecord(inspector_id=inspector_id, **record_data)
            self.db.add(record)
        
        self.db.commit()
        return record
```

### 4. API Endpoints

#### Modified Endpoints
```python
@router.get("/attendance/{inspector_id}")
async def get_attendance(
    inspector_id: int,
    jalali_year: int,
    jalali_month: int,
    db: Session = Depends(get_db)
) -> List[AttendanceRecordResponse]:
    records = attendance_service.get_attendance(inspector_id, jalali_year, jalali_month)
    return [AttendanceRecordResponse.from_model(record) for record in records]

@router.post("/attendance/{inspector_id}")
async def create_attendance(
    inspector_id: int,
    data: AttendanceRecordCreate,
    db: Session = Depends(get_db)
) -> AttendanceRecordResponse:
    record = attendance_service.create_or_update_attendance(inspector_id, data)
    return AttendanceRecordResponse.from_model(record)
```

## Data Models

### Database Schema Changes

#### Before (Current)
```sql
CREATE TABLE attendancerecord (
    id INTEGER PRIMARY KEY,
    inspector_id INTEGER,
    date DATE,
    jalali_date VARCHAR,  -- Remove this
    status VARCHAR,
    -- ... other fields
);

CREATE TABLE workcycle (
    id INTEGER PRIMARY KEY,
    inspector_id INTEGER,
    start_date DATE,
    jalali_start_date VARCHAR,  -- Remove this
    cycle_type VARCHAR,
    -- ... other fields
);
```

#### After (New)
```sql
CREATE TABLE attendancerecord (
    id INTEGER PRIMARY KEY,
    inspector_id INTEGER,
    date DATE,  -- Keep only this
    status VARCHAR,
    -- ... other fields
);

CREATE TABLE workcycle (
    id INTEGER PRIMARY KEY,
    inspector_id INTEGER,
    start_date DATE,  -- Keep only this
    cycle_type VARCHAR,
    -- ... other fields
);
```

### Query Optimization

#### Date Range Queries for AttendanceRecord
```python
# Old approach (string-based filtering)
records = session.exec(
    select(AttendanceRecord).where(
        AttendanceRecord.jalali_date.startswith(f"{jalali_year}-{jalali_month:02d}")
    )
).all()

# New approach (date range filtering)
start_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, 1)
days_in_month = jalali_calendar.get_jalali_month_days(jalali_year, jalali_month)
end_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, days_in_month)

records = session.exec(
    select(AttendanceRecord).where(
        AttendanceRecord.date >= start_date,
        AttendanceRecord.date <= end_date
    ).order_by(AttendanceRecord.date)
).all()
```

#### Monthly Attendance Queries (No Change Needed)
```python
# MonthlyAttendance queries remain simple and efficient
monthly_record = session.exec(
    select(MonthlyAttendance).where(
        MonthlyAttendance.inspector_id == inspector_id,
        MonthlyAttendance.year == jalali_year,
        MonthlyAttendance.month == jalali_month
    )
).first()
```

## Error Handling

### Date Conversion Errors
```python
class DateConversionError(Exception):
    """Raised when date conversion fails"""
    pass

class InvalidJalaliDateError(DateConversionError):
    """Raised when Jalali date format is invalid"""
    pass

# In service methods
try:
    resolved_date = DateConversionService.resolve_date_input(data.date, data.jalali_date)
except ValueError as e:
    raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
```

### Input Validation
```python
class AttendanceRecordCreate(BaseModel):
    date: Optional[datetime.date] = None
    jalali_date: Optional[str] = Field(None, regex=r"^\d{4}-\d{2}-\d{2}$")
    
    @validator('jalali_date')
    def validate_jalali_date(cls, v):
        if v:
            try:
                jy, jm, jd = map(int, v.split("-"))
                if not (1 <= jm <= 12 and 1 <= jd <= 31):
                    raise ValueError("Invalid Jalali date components")
                # Additional validation can be added here
            except (ValueError, AttributeError):
                raise ValueError("Jalali date must be in YYYY-MM-DD format")
        return v
    
    @root_validator
    def validate_date_input(cls, values):
        date = values.get('date')
        jalali_date = values.get('jalali_date')
        if not date and not jalali_date:
            raise ValueError("Either date or jalali_date must be provided")
        return values
```

## Testing Strategy

### Unit Tests
1. **Date Conversion Tests**
   - Test `DateConversionService.resolve_date_input()` with various inputs
   - Test Jalali to Gregorian conversion accuracy
   - Test edge cases (leap years, month boundaries)

2. **Model Tests**
   - Verify database schema changes
   - Test model creation without jalali_date fields
   - Test data integrity after migration

3. **Service Tests**
   - Test `AttendanceService` methods with new date handling
   - Test date range queries for monthly attendance
   - Test error handling for invalid date inputs

### Integration Tests
1. **API Tests**
   - Test endpoints with both date formats in requests
   - Verify responses contain both date formats
   - Test date filtering and sorting functionality

2. **Database Tests**
   - Test query performance with date range filters
   - Verify data consistency after refactoring
   - Test concurrent access scenarios

### Performance Tests
1. **Query Performance**
   - Compare query performance before/after refactoring
   - Test large dataset scenarios
   - Measure index effectiveness on date fields

2. **Memory Usage**
   - Measure memory reduction from removing redundant fields
   - Test API response serialization performance

## Migration Strategy

### Development Environment
1. **Database Reset**
   - Drop existing SQLite database
   - Run Alembic migrations to create new schema
   - Reseed database with test data using new models

2. **Code Updates**
   - Update domain models to remove jalali_date fields
   - Modify services to use date conversion utilities
   - Update API schemas to handle dual date inputs
   - Modify frontend API calls if necessary

### Rollback Plan
- Keep backup of current models and services
- Maintain git branches for easy rollback
- Document all changes for quick reversal if needed
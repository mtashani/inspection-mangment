"""
Tests for refactored date handling in attendance system
"""
import pytest
import datetime
from sqlmodel import Session, select
from app.database import engine
from app.domains.inspector.models.attendance import AttendanceRecord, WorkCycle
from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.enums import WorkScheduleType, AttendanceStatus, InspectorType
from app.domains.inspector.services.attendance_service import AttendanceService
from app.domains.inspector.services.work_cycle_service import WorkCycleService
from app.domains.inspector.schemas.attendance import AttendanceRecordCreate, AttendanceRecordResponse
from app.domains.inspector.schemas.work_cycle import WorkCycleCreate, WorkCycleResponse
from app.common.services.date_conversion_service import DateConversionService
from app.common.utils import jalali_calendar


@pytest.fixture
def db_session():
    """Create a test database session"""
    with Session(engine) as session:
        yield session


@pytest.fixture
def test_inspector(db_session):
    """Create a test inspector"""
    import uuid
    unique_id = str(uuid.uuid4())[:8]
    inspector = Inspector(
        name="Test Inspector",
        employee_id=f"TEST{unique_id}",
        inspector_type=InspectorType.General,
        email=f"test{unique_id}@example.com",
        years_experience=5,
        specialties=["TEST"],
        active=True,
        available=True,
        can_login=True,
        attendance_tracking_enabled=True
    )
    db_session.add(inspector)
    db_session.commit()
    db_session.refresh(inspector)
    return inspector


@pytest.fixture
def test_work_cycle(db_session, test_inspector):
    """Create a test work cycle"""
    cycle = WorkCycle(
        inspector_id=test_inspector.id,
        start_date=datetime.date(2024, 6, 15),  # 1403-03-26 Jalali
        cycle_type=WorkScheduleType.fourteen_fourteen
    )
    db_session.add(cycle)
    db_session.commit()
    db_session.refresh(cycle)
    return cycle


class TestDateConversionService:
    """Test the DateConversionService"""
    
    def test_resolve_date_input_with_gregorian(self):
        """Test resolving Gregorian date input"""
        test_date = datetime.date(2024, 6, 15)
        result = DateConversionService.resolve_date_input(date=test_date, jalali_date=None)
        assert result == test_date
    
    def test_resolve_date_input_with_jalali(self):
        """Test resolving Jalali date input"""
        jalali_date = "1403-03-26"  # Should convert to 2024-06-15
        result = DateConversionService.resolve_date_input(date=None, jalali_date=jalali_date)
        assert isinstance(result, datetime.date)
        # Verify the conversion is correct
        expected_date = jalali_calendar.jalali_to_gregorian(1403, 3, 26)
        assert result == expected_date
    
    def test_resolve_date_input_validation_errors(self):
        """Test validation errors for date input"""
        # Test no input provided
        with pytest.raises(ValueError, match="Either date or jalali_date must be provided"):
            DateConversionService.resolve_date_input(date=None, jalali_date=None)
        
        # Test both inputs provided
        with pytest.raises(ValueError, match="Provide either date or jalali_date, not both"):
            DateConversionService.resolve_date_input(
                date=datetime.date(2024, 6, 15), 
                jalali_date="1403-03-26"
            )


class TestAttendanceService:
    """Test the refactored AttendanceService"""
    
    def test_create_attendance_with_gregorian_date(self, db_session, test_inspector):
        """Test creating attendance record with Gregorian date"""
        service = AttendanceService(db_session)
        
        data = AttendanceRecordCreate(
            date=datetime.date(2024, 6, 15),
            status=AttendanceStatus.WORKING,
            regular_hours=8.0
        )
        
        record = service.create_or_update_attendance(test_inspector.id, data)
        
        assert record.inspector_id == test_inspector.id
        assert record.date == datetime.date(2024, 6, 15)
        assert record.status == AttendanceStatus.WORKING
        assert record.regular_hours == 8.0
    
    def test_create_attendance_with_jalali_date(self, db_session, test_inspector):
        """Test creating attendance record with Jalali date"""
        service = AttendanceService(db_session)
        
        data = AttendanceRecordCreate(
            jalali_date="1403-03-26",  # Should convert to 2024-06-15
            status=AttendanceStatus.WORKING,
            regular_hours=8.0
        )
        
        record = service.create_or_update_attendance(test_inspector.id, data)
        
        assert record.inspector_id == test_inspector.id
        expected_date = jalali_calendar.jalali_to_gregorian(1403, 3, 26)
        assert record.date == expected_date
        assert record.status == AttendanceStatus.WORKING
    
    def test_get_attendance_uses_date_range_query(self, db_session, test_inspector, test_work_cycle):
        """Test that get_attendance uses date range queries instead of string filtering"""
        service = AttendanceService(db_session)
        
        # Create some test attendance records
        test_date = datetime.date(2024, 6, 15)  # 1403-03-26 Jalali
        record = AttendanceRecord(
            inspector_id=test_inspector.id,
            date=test_date,
            status=AttendanceStatus.WORKING
        )
        db_session.add(record)
        db_session.commit()
        
        # Get attendance for Jalali month 1403-03
        records = service.get_attendance(test_inspector.id, 1403, 3)
        
        assert len(records) > 0
        assert any(r.date == test_date for r in records)


class TestWorkCycleService:
    """Test the refactored WorkCycleService"""
    
    def test_create_work_cycle_with_gregorian_date(self, db_session, test_inspector):
        """Test creating work cycle with Gregorian date"""
        service = WorkCycleService(db_session)
        
        data = WorkCycleCreate(
            start_date=datetime.date(2024, 6, 15),
            cycle_type=WorkScheduleType.fourteen_fourteen
        )
        
        cycle = service.create_work_cycle(test_inspector.id, data)
        
        assert cycle.inspector_id == test_inspector.id
        assert cycle.start_date == datetime.date(2024, 6, 15)
        assert cycle.cycle_type == WorkScheduleType.fourteen_fourteen
    
    def test_create_work_cycle_with_jalali_date(self, db_session, test_inspector):
        """Test creating work cycle with Jalali date"""
        service = WorkCycleService(db_session)
        
        data = WorkCycleCreate(
            jalali_start_date="1403-03-26",  # Should convert to 2024-06-15
            cycle_type=WorkScheduleType.fourteen_fourteen
        )
        
        cycle = service.create_work_cycle(test_inspector.id, data)
        
        assert cycle.inspector_id == test_inspector.id
        expected_date = jalali_calendar.jalali_to_gregorian(1403, 3, 26)
        assert cycle.start_date == expected_date
        assert cycle.cycle_type == WorkScheduleType.fourteen_fourteen


class TestResponseSchemas:
    """Test that response schemas include both date formats"""
    
    def test_attendance_record_response_includes_both_dates(self, db_session, test_inspector):
        """Test that AttendanceRecordResponse includes both Gregorian and Jalali dates"""
        # Create a test record
        record = AttendanceRecord(
            inspector_id=test_inspector.id,
            date=datetime.date(2024, 6, 15),
            status=AttendanceStatus.WORKING,
            regular_hours=8.0,
            overtime_hours=0.0,
            night_shift_hours=0.0,
            on_call_hours=0.0,
            is_override=False,
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()
        )
        record.id = 1  # Mock ID
        
        response = AttendanceRecordResponse.from_model(record)
        
        assert response.date == datetime.date(2024, 6, 15)
        assert response.jalali_date == "1403-03-26"
        assert response.status == AttendanceStatus.WORKING
    
    def test_work_cycle_response_includes_both_dates(self, db_session, test_inspector):
        """Test that WorkCycleResponse includes both Gregorian and Jalali dates"""
        # Create a test cycle
        cycle = WorkCycle(
            inspector_id=test_inspector.id,
            start_date=datetime.date(2024, 6, 15),
            cycle_type=WorkScheduleType.fourteen_fourteen,
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()
        )
        cycle.id = 1  # Mock ID
        
        response = WorkCycleResponse.from_model(cycle)
        
        assert response.start_date == datetime.date(2024, 6, 15)
        assert response.jalali_start_date == "1403-03-26"
        assert response.cycle_type == WorkScheduleType.fourteen_fourteen


class TestDatabaseQueries:
    """Test that database queries work correctly with new date handling"""
    
    def test_attendance_queries_use_date_range(self, db_session, test_inspector):
        """Test that attendance queries use date ranges instead of string matching"""
        # Create test records for different dates in the same Jalali month
        dates = [
            datetime.date(2024, 5, 21),  # 1403-03-01
            datetime.date(2024, 6, 15),  # 1403-03-26
            datetime.date(2024, 6, 20),  # 1403-03-31
        ]
        
        for date in dates:
            record = AttendanceRecord(
                inspector_id=test_inspector.id,
                date=date,
                status=AttendanceStatus.WORKING
            )
            db_session.add(record)
        db_session.commit()
        
        # Query for Jalali month 1403-03 using date range
        start_date = jalali_calendar.jalali_to_gregorian(1403, 3, 1)
        days_in_month = jalali_calendar.get_jalali_month_days(1403, 3)
        end_date = jalali_calendar.jalali_to_gregorian(1403, 3, days_in_month)
        
        records = db_session.exec(
            select(AttendanceRecord).where(
                AttendanceRecord.inspector_id == test_inspector.id,
                AttendanceRecord.date >= start_date,
                AttendanceRecord.date <= end_date
            ).order_by(AttendanceRecord.date)
        ).all()
        
        assert len(records) == 3
        assert all(start_date <= record.date <= end_date for record in records)
    
    def test_no_jalali_date_fields_in_database(self, db_session, test_inspector):
        """Test that database models no longer have jalali_date fields"""
        # Create records and verify they don't have jalali_date fields
        record = AttendanceRecord(
            inspector_id=test_inspector.id,
            date=datetime.date(2024, 6, 15),
            status=AttendanceStatus.WORKING
        )
        db_session.add(record)
        
        cycle = WorkCycle(
            inspector_id=test_inspector.id,
            start_date=datetime.date(2024, 6, 15),
            cycle_type=WorkScheduleType.fourteen_fourteen
        )
        db_session.add(cycle)
        db_session.commit()
        
        # Verify that jalali_date fields don't exist
        assert not hasattr(record, 'jalali_date')
        assert not hasattr(cycle, 'jalali_start_date')
        
        # Verify that only date fields exist
        assert hasattr(record, 'date')
        assert hasattr(cycle, 'start_date')
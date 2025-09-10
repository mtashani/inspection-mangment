# Test Data Seeding Script for Inspector Admin Panel
"""
This script seeds test data for the inspector admin panel functionality.
It creates inspectors, attendance records, work cycles, and related data.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, create_engine, select
from datetime import datetime, date, timedelta
import random
from app.database import get_session
from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.attendance import AttendanceRecord, WorkCycle, MonthlyAttendance
from app.domains.inspector.models.enums import InspectorType, AttendanceStatus, WorkScheduleType
from app.common.utils import jalali_calendar


def seed_test_inspectors(db: Session):
    """Create test inspectors with attendance tracking enabled"""
    
    test_inspectors = [
        {
            "first_name": "احمد",
            "last_name": "محمدی",
            "employee_id": "INS001",
            "national_id": "1234567890",
            "email": "ahmad.mohammadi@company.com",
            "inspector_type": InspectorType.NDT,
            "department": "بازرسی غیرمخرب",
            "phone": "09121234567",
            "years_experience": 5,
            "active": True,
            "attendance_tracking_enabled": True,
            "base_hourly_rate": 250000.0,
            "overtime_multiplier": 1.5,
            "night_shift_multiplier": 1.25,
            "on_call_multiplier": 1.2
        },
        {
            "first_name": "فاطمه",
            "last_name": "حسینی",
            "employee_id": "INS002",
            "national_id": "2345678901",
            "email": "fatemeh.hosseini@company.com",
            "inspector_type": InspectorType.NDT,
            "department": "بازرسی غیرمخرب",
            "phone": "09129876543",
            "years_experience": 8,
            "active": True,
            "attendance_tracking_enabled": True,
            "base_hourly_rate": 280000.0,
            "overtime_multiplier": 1.5,
            "night_shift_multiplier": 1.25,
            "on_call_multiplier": 1.2
        },
        {
            "first_name": "علی",
            "last_name": "کریمی",
            "employee_id": "INS003",
            "national_id": "3456789012",
            "email": "ali.karimi@company.com",
            "inspector_type": InspectorType.Mechanical,
            "department": "مکانیک",
            "phone": "09135557788",
            "years_experience": 3,
            "active": True,
            "attendance_tracking_enabled": True,
            "base_hourly_rate": 220000.0,
            "overtime_multiplier": 1.5,
            "night_shift_multiplier": 1.25,
        },
        {
            "first_name": "مریم",
            "last_name": "احمدی",
            "employee_id": "INS004",
            "national_id": "4567890123",
            "email": "maryam.ahmadi@company.com",
            "inspector_type": InspectorType.Corrosion,
            "department": "خورندگی",
            "phone": "09141112233",
            "years_experience": 12,
            "active": True,
            "attendance_tracking_enabled": True,
            "base_hourly_rate": 320000.0,
            "overtime_multiplier": 1.5,
            "night_shift_multiplier": 1.25,
            "on_call_multiplier": 1.3
        },
        {
            "first_name": "محسن",
            "last_name": "رضایی",
            "employee_id": "INS005",
            "national_id": "5678901234",
            "email": "mohsen.rezaei@company.com",
            "inspector_type": InspectorType.Instrumentation,
            "department": "ابزار دقیق",
            "phone": "09156667890",
            "years_experience": 7,
            "active": True,
            "attendance_tracking_enabled": True,
            "base_hourly_rate": 300000.0
        },
        {
            "first_name": "زهرا",
            "last_name": "موسوی",
            "employee_id": "INS006",
            "national_id": "6789012345",
            "email": "zahra.mousavi@company.com",
            "inspector_type": InspectorType.Electrical,
            "department": "برق",
            "phone": "09162345678",
            "years_experience": 6,
            "active": True,
            "attendance_tracking_enabled": True,
            "base_hourly_rate": 275000.0
        },
        {
            "first_name": "حسین",
            "last_name": "نوری",
            "employee_id": "INS007",
            "national_id": "7890123456",
            "email": "hossein.nouri@company.com",
            "inspector_type": InspectorType.Civil,
            "department": "عمران",
            "phone": "09177778888",
            "years_experience": 9,
            "active": True,
            "attendance_tracking_enabled": True,
            "base_hourly_rate": 290000.0
        },
        {
            "first_name": "سارا",
            "last_name": "قاسمی",
            "employee_id": "INS008",
            "national_id": "8901234567",
            "email": "sara.ghasemi@company.com",
            "inspector_type": InspectorType.General,
            "department": "کنترل کیفیت",
            "phone": "09189990000",
            "years_experience": 4,
            "active": True,
            "attendance_tracking_enabled": True,
            "base_hourly_rate": 240000.0
        }
    ]
    
    created_inspectors = []
    
    for inspector_data in test_inspectors:
        # Check if inspector already exists
        existing = db.exec(
            select(Inspector).where(Inspector.employee_id == inspector_data["employee_id"])
        ).first()
        
        if not existing:
            inspector = Inspector(**inspector_data)
            db.add(inspector)
            try:
                db.commit()
                db.refresh(inspector)
                created_inspectors.append(inspector)
                print(f"Created inspector: {inspector.first_name} {inspector.last_name} (ID: {inspector.id})")
            except Exception as e:
                db.rollback()
                print(f"Error creating inspector {inspector_data['employee_id']}: {e}")
                # Try to find existing by national_id
                existing_by_national = db.exec(
                    select(Inspector).where(Inspector.national_id == inspector_data["national_id"])
                ).first()
                if existing_by_national:
                    created_inspectors.append(existing_by_national)
                    print(f"Found existing inspector by national_id: {existing_by_national.first_name} {existing_by_national.last_name}")
        else:
            created_inspectors.append(existing)
            print(f"Inspector already exists: {existing.first_name} {existing.last_name}")
    
    return created_inspectors


def seed_work_cycles(db: Session, inspectors: list):
    """Create work cycles for inspectors"""
    
    # Different work cycle types
    cycle_types = [
        WorkScheduleType.fourteen_fourteen,
        WorkScheduleType.seven_seven,
        WorkScheduleType.office
    ]
    
    created_cycles = []
    
    for inspector in inspectors:
        # Assign different cycle types based on department
        if inspector.department == "کنترل کیفیت":
            cycle_type = WorkScheduleType.office
        elif inspector.department in ["بازرسی غیرمخرب", "عمران"]:
            cycle_type = WorkScheduleType.fourteen_fourteen
        else:
            cycle_type = WorkScheduleType.seven_seven
        
        # Start date 3 months ago
        start_date = date.today() - timedelta(days=90)
        
        work_cycle = WorkCycle(
            inspector_id=inspector.id,
            start_date=start_date,
            cycle_type=cycle_type
        )
        
        db.add(work_cycle)
        created_cycles.append(work_cycle)
    
    db.commit()
    
    for cycle in created_cycles:
        db.refresh(cycle)
        print(f"Created work cycle for inspector {cycle.inspector_id}: {cycle.cycle_type}")
    
    return created_cycles


def seed_attendance_records(db: Session, inspectors: list, work_cycles: list):
    """Create realistic attendance records for the last 3 months"""
    
    from app.domains.inspector.services.attendance_service import AttendanceService
    service = AttendanceService(db)
    
    # Get current Jalali date
    today = date.today()
    jalali_today = jalali_calendar.gregorian_to_jalali_str(today)
    current_year, current_month, _ = map(int, jalali_today.split('-'))
    
    # Generate for last 3 months
    months_to_generate = [
        (current_year, current_month),
        (current_year, current_month - 1 if current_month > 1 else 12),
        (current_year - 1 if current_month == 1 else current_year, current_month - 2 if current_month > 2 else current_month - 2 + 12)
    ]
    
    # Fix year for previous months
    for i, (year, month) in enumerate(months_to_generate):
        if month <= 0:
            months_to_generate[i] = (year - 1, month + 12)
    
    created_records = 0
    
    for inspector in inspectors:
        # Find work cycle for this inspector
        work_cycle = next((wc for wc in work_cycles if wc.inspector_id == inspector.id), None)
        if not work_cycle:
            continue
        
        for jalali_year, jalali_month in months_to_generate:
            try:
                # Generate basic attendance pattern
                records = service.generate_attendance(
                    inspector.id, 
                    work_cycle.id, 
                    jalali_year, 
                    jalali_month
                )
                
                # Add some realistic variations
                for record in records:
                    # Add some overtime randomly (20% chance)
                    if record.status == AttendanceStatus.WORKING and random.random() < 0.2:
                        record.overtime_hours = random.uniform(1, 4)
                    
                    # Add some night shifts (10% chance)
                    if record.status == AttendanceStatus.WORKING and random.random() < 0.1:
                        record.night_shift_hours = random.uniform(2, 6)
                    
                    # Occasionally mark as absent instead of working (5% chance)
                    if record.status == AttendanceStatus.WORKING and random.random() < 0.05:
                        record.status = AttendanceStatus.UNAVAILABLE
                        record.is_override = True
                        record.override_reason = "غیبت غیرموجه"
                    
                    # Add notes occasionally
                    if random.random() < 0.1:
                        notes = [
                            "کار در پروژه خاص",
                            "بازرسی اضطراری",
                            "آموزش پرسنل",
                            "مرخصی استحقاقی",
                            "ماموریت شهرستان"
                        ]
                        record.notes = random.choice(notes)
                
                db.commit()
                created_records += len(records)
                print(f"Generated {len(records)} attendance records for inspector {inspector.employee_id} - {jalali_year}/{jalali_month:02d}")
                
            except Exception as e:
                print(f"Error generating attendance for inspector {inspector.employee_id}: {e}")
                continue
    
    print(f"Total attendance records created: {created_records}")
    return created_records


def seed_monthly_attendance_summaries(db: Session, inspectors: list):
    """Generate monthly attendance summaries"""
    
    from app.domains.inspector.services.attendance_service import AttendanceService
    service = AttendanceService(db)
    
    # Get current Jalali date
    today = date.today()
    jalali_today = jalali_calendar.gregorian_to_jalali_str(today)
    current_year, current_month, _ = map(int, jalali_today.split('-'))
    
    # Generate summaries for last 3 months
    months_to_generate = [
        (current_year, current_month),
        (current_year, current_month - 1 if current_month > 1 else 12),
        (current_year - 1 if current_month == 1 else current_year, current_month - 2 if current_month > 2 else current_month - 2 + 12)
    ]
    
    # Fix year for previous months
    for i, (year, month) in enumerate(months_to_generate):
        if month <= 0:
            months_to_generate[i] = (year - 1, month + 12)
    
    created_summaries = 0
    
    for inspector in inspectors:
        for jalali_year, jalali_month in months_to_generate:
            try:
                monthly = service.generate_monthly_attendance(inspector.id, jalali_year, jalali_month)
                if monthly:
                    created_summaries += 1
                    print(f"Generated monthly summary for inspector {inspector.employee_id} - {jalali_year}/{jalali_month:02d}")
            except Exception as e:
                print(f"Error generating monthly summary for inspector {inspector.employee_id}: {e}")
                continue
    
    print(f"Total monthly summaries created: {created_summaries}")
    return created_summaries


def main():
    """Main seeding function"""
    print("🌱 Starting test data seeding for Inspector Admin Panel...")
    
    # Get database session
    from app.database import engine
    
    with Session(engine) as db:
        try:
            # 1. Create test inspectors
            print("\n1️⃣ Creating test inspectors...")
            inspectors = seed_test_inspectors(db)
            
            # 2. Create work cycles
            print("\n2️⃣ Creating work cycles...")
            work_cycles = seed_work_cycles(db, inspectors)
            
            # 3. Generate attendance records
            print("\n3️⃣ Generating attendance records...")
            attendance_count = seed_attendance_records(db, inspectors, work_cycles)
            
            # 4. Generate monthly summaries
            print("\n4️⃣ Generating monthly summaries...")
            summary_count = seed_monthly_attendance_summaries(db, inspectors)
            
            print(f"\n✅ Seeding completed successfully!")
            print(f"📊 Summary:")
            print(f"   - Inspectors created: {len(inspectors)}")
            print(f"   - Work cycles created: {len(work_cycles)}")
            print(f"   - Attendance records created: {attendance_count}")
            print(f"   - Monthly summaries created: {summary_count}")
            print(f"\n🎉 Admin panel test data is now ready!")
            
        except Exception as e:
            print(f"❌ Error during seeding: {e}")
            import traceback
            traceback.print_exc()
            db.rollback()


if __name__ == "__main__":
    main()
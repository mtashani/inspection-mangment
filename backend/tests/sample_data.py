from app.database import get_session
from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.enums import InspectorType, WorkScheduleType, AttendanceStatus, LeaveType, LeaveRequestStatus
from app.domains.inspector.models.authorization import Role, InspectorRole
from app.domains.inspector.models.attendance import WorkCycle, AttendanceRecord, LeaveRequest
from app.domains.inspector.models.payroll import PayrollSettings, PayrollRecord
from sqlmodel import Session, select
import bcrypt
import datetime

def insert_sample_data():
    with next(get_session()) as session:
        # --- Admin user ---
        admin_role = session.exec(select(Role).where(Role.name == 'admin')).first()
        if not admin_role:
            admin_role = Role(name='admin', description='Administrator')
            session.add(admin_role)
            session.commit()
            session.refresh(admin_role)
        password_hash = bcrypt.hashpw('admin'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin = session.exec(select(Inspector).where(Inspector.username == 'admin')).first()
        if not admin:
            admin = Inspector(
                name='Admin User',
                employee_id='ADM001',
                inspector_type=InspectorType.General,
                email='admin@inspection.local',
                years_experience=10,
                specialties=[],
                active=True,
                available=True,
                username='admin',
                password_hash=password_hash,
                can_login=True
            )
            session.add(admin)
            session.commit()
            session.refresh(admin)
        if admin.id is not None and admin_role.id is not None:
            if not session.exec(select(InspectorRole).where(InspectorRole.inspector_id == admin.id, InspectorRole.role_id == admin_role.id)).first():
                inspector_role = InspectorRole(inspector_id=admin.id, role_id=admin_role.id)
                session.add(inspector_role)
                session.commit()
        # --- Normal inspector ---
        password_hash2 = bcrypt.hashpw('user123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        inspector = session.exec(select(Inspector).where(Inspector.username == 'user1')).first()
        if not inspector:
            inspector = Inspector(
                name='Normal Inspector',
                employee_id='EMP002',
                inspector_type=InspectorType.Mechanical,
                email='user1@inspection.local',
                years_experience=5,
                specialties=[],
                active=True,
                available=True,
                username='user1',
                password_hash=password_hash2,
                can_login=True
            )
            session.add(inspector)
            session.commit()
            session.refresh(inspector)
        # --- WorkCycle for each inspector ---
        for insp in [admin, inspector]:
            if insp.id is not None:
                wc = session.exec(select(WorkCycle).where(WorkCycle.inspector_id == insp.id)).first()
                if not wc:
                    wc = WorkCycle(
                        inspector_id=insp.id,
                        start_date=datetime.date(2024, 6, 1),
                        end_date=datetime.date(2024, 12, 31),
                        cycle_type=WorkScheduleType.FOURTEEN_FOURTEEN,
                    )
                    session.add(wc)
        session.commit()
        # --- Attendance records for June 2024 ---
        for insp in [admin, inspector]:
            if insp.id is not None:
                for day in range(1, 6):
                    date = datetime.date(2024, 6, day)
                    jalali_date = f"1403-03-{day:02d}"
                    record = session.exec(select(AttendanceRecord).where(AttendanceRecord.inspector_id == insp.id, AttendanceRecord.date == date)).first()
                    if not record:
                        record = AttendanceRecord(
                            inspector_id=insp.id,
                            date=date,
                            jalali_date=jalali_date,
                            status=AttendanceStatus.Present if day != 3 else AttendanceStatus.Absent
                        )
                        session.add(record)
        session.commit()
        # --- Leave request for normal inspector ---
        if inspector.id is not None:
            leave = session.exec(select(LeaveRequest).where(LeaveRequest.inspector_id == inspector.id)).first()
            if not leave:
                leave = LeaveRequest(
                    inspector_id=inspector.id,
                    start_date=datetime.date(2024, 6, 3),
                    end_date=datetime.date(2024, 6, 4),
                    leave_type=LeaveType.Vacation,
                    reason='Sample leave',
                    status=LeaveRequestStatus.Approved
                )
                session.add(leave)
        session.commit()
        # --- Payroll settings for each inspector ---
        for insp in [admin, inspector]:
            if insp.id is not None:
                ps = session.exec(select(PayrollSettings).where(PayrollSettings.inspector_id == insp.id)).first()
                if not ps:
                    ps = PayrollSettings(
                        inspector_id=insp.id,
                        base_hourly_rate=100000,
                        overtime_multiplier=1.5,
                        night_shift_multiplier=2.0,
                        on_call_multiplier=1.25,
                        housing_allowance=2000000,
                        transportation_allowance=1000000,
                        meal_allowance=500000
                    )
                    session.add(ps)
        session.commit()
        # --- Payroll record for June 2024 for each inspector ---
        for insp in [admin, inspector]:
            if insp.id is not None:
                pr = session.exec(select(PayrollRecord).where(PayrollRecord.inspector_id == insp.id, PayrollRecord.jalali_year == 1403, PayrollRecord.jalali_month == 3)).first()
                if not pr:
                    pr = PayrollRecord(
                        inspector_id=insp.id,
                        year=2024,
                        month=6,
                        jalali_year=1403,
                        jalali_month=3,
                        total_working_days=4,
                        total_overtime_hours=2.0,
                        total_night_shift_hours=1.0,
                        total_on_call_hours=0.0,
                        total_leave_days=1,
                        base_salary=3200000,
                        overtime_pay=300000,
                        night_shift_pay=200000,
                        on_call_pay=0,
                        total_pay=3700000,
                        is_finalized=False
                    )
                    session.add(pr)
        session.commit()
        print('Sample data (admin, user, workcycle, attendance, leave, payroll) created.')

if __name__ == "__main__":
    insert_sample_data() 
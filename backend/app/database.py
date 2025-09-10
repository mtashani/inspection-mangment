from sqlmodel import SQLModel, create_engine, Session
from typing import Generator
from app.core.config import settings

# Import all models to register them with SQLModel metadata
from app.domains.psv.models.psv import PSV
from app.domains.psv.models.calibration import Calibration
from app.domains.psv.models.config import RBIConfiguration, ServiceRiskCategory
from app.domains.inspector.models.inspector import Inspector, InspectorCertificationRecord
from app.domains.inspector.models.authorization import Role, Permission, RolePermission, InspectorRole
from app.domains.inspector.models.documents import InspectorDocument
from app.domains.inspector.models.specialty import InspectorSpecialty
from app.domains.corrosion.models.coupon import CorrosionCoupon
from app.domains.corrosion.models.location import CorrosionLocation
from app.domains.corrosion.models.analysis import CorrosionAnalysisReport
from app.domains.corrosion.models.settings import CorrosionMonitoringSettings
from app.domains.crane.models.crane import Crane, CraneInspection, CraneInspectionSettings
from app.domains.equipment.models.equipment import Equipment
from app.domains.daily_report.models.report import DailyReport
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.inspection_team import InspectionTeam
from app.domains.maintenance.models.event import MaintenanceEvent, MaintenanceSubEvent
from app.domains.inspector.models.attendance import WorkCycle, AttendanceRecord, LeaveRequest, MonthlyAttendance
from app.domains.inspector.models.payroll import PayrollSettings, PayrollRecord, PayrollItem

# Notification System Models
try:
    from app.domains.notifications.models.notification import Notification, NotificationPreference
    print("✅ Notification System models imported successfully")
except Exception as e:
    print(f"❌ Failed to import Notification System models: {e}")

# Professional Report System Models
try:
    from app.domains.report.models.template import Template
    from app.domains.report.models.template_section import TemplateSection
    from app.domains.report.models.template_subsection import TemplateSubSection
    from app.domains.report.models.template_field import TemplateField
    from app.domains.report.models.final_report import FinalReport
    from app.domains.report.models.report_field_value import ReportFieldValue
    print("✅ Professional Report System models imported successfully")
except Exception as e:
    print(f"❌ Failed to import Professional Report System models: {e}")

# RBI Calculation System Models (if they have database models)
try:
    # RBI system might not have database models if it's purely computational
    # But if there are any, they would be imported here
    pass
except Exception as e:
    print(f"❌ Failed to import RBI Calculation System models: {e}")

# Create engine based on environment
if settings.DB_ENV == "development":
    engine = create_engine(settings.SQLITE_URL, echo=settings.SQL_ECHO)
else:
    engine = create_engine(settings.DATABASE_URL, echo=settings.SQL_ECHO)

def create_db_and_tables():
    """Create all database tables"""
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    """Get database session"""
    with Session(engine) as session:
        yield session

def create_all_tables():
    SQLModel.metadata.create_all(engine)

if __name__ == "__main__":
    create_all_tables()
    print("All tables created.")
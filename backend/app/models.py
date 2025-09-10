"""
DEPRECATED: This file is maintained for backward compatibility.
New code should import directly from the appropriate domain:
- app.domains.psv.models
- app.domains.corrosion.models
- app.domains.crane.models
- app.domains.equipment.models
- app.domains.inspector.models
"""

# Import from domains for backward compatibility
print("🔄 Loading models from DDD domains...")

try:
    from app.domains.psv.models.psv import PSV
    from app.domains.psv.models.calibration import Calibration
    from app.domains.psv.models.config import RBIConfiguration
    print("✅ PSV models imported")
except Exception as e:
    print(f"❌ PSV models import failed: {e}")

try:
    from app.domains.corrosion.models.coupon import CorrosionCoupon
    from app.domains.corrosion.models.location import CorrosionLocation
    from app.domains.corrosion.models.analysis import CorrosionAnalysisReport
    from app.domains.corrosion.models.settings import CorrosionMonitoringSettings
    print("✅ Corrosion models imported")
except Exception as e:
    print(f"❌ Corrosion models import failed: {e}")

try:
    from app.domains.inspector.models.inspector import Inspector, InspectorCertificationRecord
    from app.domains.inspector.models.authorization import Role, Permission, RolePermission, InspectorRole
    from app.domains.inspector.models.documents import InspectorDocument
    print("✅ Inspector models imported")
except Exception as e:
    print(f"❌ Inspector models import failed: {e}")

try:
    from app.domains.crane.models.crane import Crane, CraneInspection, CraneInspectionSettings
    print("✅ Crane models imported")
except Exception as e:
    print(f"❌ Crane models import failed: {e}")

try:
    from app.domains.equipment.models.equipment import Equipment
    print("✅ Equipment models imported")
except Exception as e:
    print(f"❌ Equipment models import failed: {e}")

try:
    from app.domains.maintenance.models.event import MaintenanceEvent, MaintenanceSubEvent
    from app.domains.maintenance.models.inspection_plan import InspectionPlan
    print("✅ Maintenance models imported")
except Exception as e:
    print(f"❌ Maintenance models import failed: {e}")

try:
    from app.domains.daily_report.models.report import DailyReport
    print("✅ Daily Report models imported")
except Exception as e:
    print(f"❌ Daily Report models import failed: {e}")

try:
    from app.domains.inspection.models.inspection import Inspection
    print("✅ Inspection models imported")
except Exception as e:
    print(f"❌ Inspection models import failed: {e}")

# Import database utilities
try:
    from app.database import engine, get_session
    print("✅ Database utilities imported")
except Exception as e:
    print(f"❌ Database utilities import failed: {e}")

print("🎉 All available models loaded from DDD domains!")
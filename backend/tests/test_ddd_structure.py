"""
Domain-Driven Design Structure Tests
These tests ensure the domain-driven design structure is properly implemented.
"""

import pytest
from sqlalchemy import text
from sqlmodel import Session
from fastapi.testclient import TestClient

from app.database import engine, get_session
from app.main import app
from app.domains.auth.dependencies import Permission

# Import models from all domains to test imports
def test_psv_imports():
    """Test that PSV domain imports work correctly"""
    from app.domains.psv.models import PSV, Calibration
    from app.domains.psv.models.config import RBIConfiguration, ServiceRiskCategory
    assert PSV
    assert Calibration
    assert RBIConfiguration
    assert ServiceRiskCategory

def test_corrosion_imports():
    """Test that Corrosion domain imports work correctly"""
    from app.domains.corrosion.models import (
        CorrosionLocation, 
        CorrosionCoupon,
        CorrosionAnalysisReport
    )
    from app.domains.corrosion.models.settings import CorrosionMonitoringSettings
    assert CorrosionLocation
    assert CorrosionCoupon
    assert CorrosionAnalysisReport
    assert CorrosionMonitoringSettings

def test_crane_imports():
    """Test that Crane domain imports work correctly"""
    from app.domains.crane.models import Crane, CraneInspection, CraneInspectionSettings
    assert Crane
    assert CraneInspection
    assert CraneInspectionSettings

def test_equipment_imports():
    """Test that Equipment domain imports work correctly"""
    from app.domains.equipment.models import Equipment, MaintenanceRecord, SparePart
    assert Equipment
    assert MaintenanceRecord
    assert SparePart

def test_inspector_imports():
    """Test that Inspector domain imports work correctly"""
    from app.domains.inspector.models import Inspector, InspectorCertificationRecord
    assert Inspector
    assert InspectorCertificationRecord
    # assert InspectorAvailability  # Removed as this model no longer exists

def test_inspection_imports():
    """Test that Inspection domain imports work correctly"""
    from app.domains.inspection.models import Inspection, InspectionTask, InspectionFinding, InspectionSchedule
    assert Inspection
    assert InspectionTask
    assert InspectionFinding
    assert InspectionSchedule

def test_daily_report_imports():
    """Test that Daily Report domain imports work correctly"""
    from app.domains.daily_report.models import DailyReport, InspectionLog, SafetyObservation, PersonnelLog
    assert DailyReport
    assert InspectionLog
    assert SafetyObservation
    assert PersonnelLog

def test_database_connection():
    """Test that the database connection works"""
    # Execute simple query to verify connection
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        assert result.scalar() == 1

def test_session_provider():
    """Test that the session provider works"""
    # Create session using the provider
    session = next(get_session())
    assert isinstance(session, Session)
    session.close()

# def test_psv_service():
#     """Test that the PSV service works"""
#     # Import a service from the PSV domain
#     from app.domains.psv.services.rbi.basic import get_rbi_factors
#     
#     # Basic test
#     factors = get_rbi_factors(1)
#     assert isinstance(factors, dict)
#     assert "environment" in factors
#     assert "equipment_type" in factors

# def test_api_router_imports():
#     """Test that the API router imports work correctly"""
#     # from app.api.router import api_router
#     assert len(api_router.routes) > 0

client = TestClient(app)

def get_headers_for_user(user_id, is_admin=False, permissions=None):
    # This is a placeholder. Replace with your real auth header logic.
    headers = {"X-User-Id": str(user_id)}
    if is_admin:
        headers["X-Admin"] = "1"
    if permissions:
        headers["X-Permissions"] = ",".join(permissions)
    return headers

def test_attendance_permission_admin():
    headers = get_headers_for_user(1, is_admin=True)
    response = client.get("/api/inspectors/1/attendance?jalali_year=1403&jalali_month=3", headers=headers)
    assert response.status_code == 200

def test_attendance_permission_inspector_allowed():
    headers = get_headers_for_user(2, permissions=[Permission.ATTENDANCE_VIEW_OWN])
    response = client.get("/api/inspectors/2/attendance?jalali_year=1403&jalali_month=3", headers=headers)
    assert response.status_code == 200

def test_attendance_permission_inspector_forbidden():
    headers = get_headers_for_user(2, permissions=[])
    response = client.get("/api/inspectors/2/attendance?jalali_year=1403&jalali_month=3", headers=headers)
    assert response.status_code == 403

def test_payroll_permission_admin():
    headers = get_headers_for_user(1, is_admin=True)
    response = client.get("/api/inspectors/1/payroll?jalali_year=1403&jalali_month=3", headers=headers)
    assert response.status_code == 200

def test_payroll_permission_inspector_allowed():
    headers = get_headers_for_user(2, permissions=[Permission.PAYROLL_VIEW_OWN])
    response = client.get("/api/inspectors/2/payroll?jalali_year=1403&jalali_month=3", headers=headers)
    assert response.status_code == 200

def test_payroll_permission_inspector_forbidden():
    headers = get_headers_for_user(2, permissions=[])
    response = client.get("/api/inspectors/2/payroll?jalali_year=1403&jalali_month=3", headers=headers)
    assert response.status_code == 403
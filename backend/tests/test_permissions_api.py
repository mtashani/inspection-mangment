import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_headers(user_id, is_admin=False, permissions=None):
    headers = {"X-User-Id": str(user_id)}
    if is_admin:
        headers["X-Admin"] = "1"
    if permissions:
        headers["X-Permissions"] = ",".join(permissions)
    return headers

def test_attendance_admin_access():
    headers = get_headers(1, is_admin=True)
    response = client.get("/api/inspectors/1/attendance?jalali_year=1402&jalali_month=1", headers=headers)
    assert response.status_code in (200, 404)  # 404 if no data, 200 if present

def test_attendance_inspector_allowed():
    headers = get_headers(2, permissions=["attendance:view_own"])
    response = client.get("/api/inspectors/2/attendance?jalali_year=1402&jalali_month=1", headers=headers)
    assert response.status_code in (200, 404)

def test_attendance_inspector_forbidden():
    headers = get_headers(2, permissions=[])
    response = client.get("/api/inspectors/2/attendance?jalali_year=1402&jalali_month=1", headers=headers)
    assert response.status_code in (403, 404)

def test_payroll_admin_access():
    headers = get_headers(1, is_admin=True)
    response = client.get("/api/inspectors/1/payroll?jalali_year=1402&jalali_month=1", headers=headers)
    assert response.status_code in (200, 404)

def test_payroll_inspector_allowed():
    headers = get_headers(2, permissions=["payroll:view_own"])
    response = client.get("/api/inspectors/2/payroll?jalali_year=1402&jalali_month=1", headers=headers)
    assert response.status_code in (200, 404)

def test_payroll_inspector_forbidden():
    headers = get_headers(2, permissions=[])
    response = client.get("/api/inspectors/2/payroll?jalali_year=1402&jalali_month=1", headers=headers)
    assert response.status_code in (403, 404) 
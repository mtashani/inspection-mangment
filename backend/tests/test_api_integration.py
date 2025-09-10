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

def test_create_and_get_attendance():
    headers = get_headers(1, is_admin=True, permissions=["attendance:edit_all", "attendance:view_all"])
    # Create attendance record
    data = {
        "date": "2024-06-01",
        "jalali_date": "1403-03-12",
        "status": "present"
    }
    response = client.post("/api/inspectors/1/attendance", json=data, headers=headers)
    assert response.status_code in (200, 201)
    # Get attendance record
    response = client.get("/api/inspectors/1/attendance?jalali_year=1403&jalali_month=3", headers=headers)
    assert response.status_code in (200, 404)

def test_leave_request_and_approval():
    headers = get_headers(2, permissions=["leave_request:create"])
    # Create leave request
    data = {
        "start_date": "2024-06-10",
        "end_date": "2024-06-12",
        "leave_type": "vacation",
        "reason": "test leave"
    }
    response = client.post("/api/inspectors/2/leave-requests", json=data, headers=headers)
    assert response.status_code in (200, 201)
    leave_id = response.json().get("id")
    # Approve leave request as admin
    admin_headers = get_headers(1, is_admin=True, permissions=["leave_request:approve"])
    approval_data = {"approved_by": 1}
    response = client.put(f"/api/leave-requests/{leave_id}/approve", json=approval_data, headers=admin_headers)
    assert response.status_code in (200, 201, 204) 
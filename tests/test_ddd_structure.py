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
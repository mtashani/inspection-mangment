#!/usr/bin/env python3
"""
Comprehensive test for inspector deletion workflow
"""

import requests
import json

def get_auth_token():
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    response = requests.post(
        "http://localhost:8000/api/v1/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if response.status_code == 200:
        return response.json().get("access_token")
    return None

def create_test_inspector(token):
    """Create a test inspector"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    inspector_data = {
        "first_name": "Test",
        "last_name": "Inspector",
        "employee_id": "TEST_DELETE_001",
        "national_id": "9876543210",
        "email": "test.delete@example.com",
        "years_experience": 3,
        "can_login": True,
        "active": True
    }
    
    response = requests.post("http://localhost:8000/api/v1/inspectors/", json=inspector_data, headers=headers)
    
    if response.status_code == 200:
        return response.json()["id"]
    return None

def test_deletion_workflow():
    """Test complete deletion workflow"""
    token = get_auth_token()
    if not token:
        print("❌ Authentication failed")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    
    # Create test inspector
    print("📝 Creating test inspector...")
    inspector_id = create_test_inspector(token)
    if not inspector_id:
        print("❌ Failed to create test inspector")
        return
    
    print(f"✅ Created test inspector with ID: {inspector_id}")
    
    # Check related records\n    print(f\"\\n📋 Checking related records for inspector {inspector_id}...\")\n    response = requests.get(f\"http://localhost:8000/api/v1/inspectors/{inspector_id}/related-records\", headers=headers)\n    \n    if response.status_code == 200:\n        related_data = response.json()\n        print(f\"Related records: {related_data['total_related_records']}\")\n        print(f\"Can delete safely: {related_data['can_delete_safely']}\")\n        print(json.dumps(related_data['related_records'], indent=2, ensure_ascii=False))\n    else:\n        print(f\"❌ Failed to get related records: {response.status_code}\")\n    \n    # Try normal delete\n    print(f\"\\n🧪 Attempting normal delete of inspector {inspector_id}...\")\n    response = requests.delete(f\"http://localhost:8000/api/v1/inspectors/{inspector_id}\", headers=headers)\n    \n    print(f\"Status: {response.status_code}\")\n    try:\n        print(f\"Response: {response.json()}\")\n    except:\n        print(f\"Response Text: {response.text}\")\n    \n    if response.status_code == 400:\n        # Try force delete\n        print(f\"\\n🔥 Attempting force delete of inspector {inspector_id}...\")\n        response = requests.delete(f\"http://localhost:8000/api/v1/inspectors/{inspector_id}?force=true\", headers=headers)\n        \n        print(f\"Status: {response.status_code}\")\n        try:\n            print(f\"Response: {response.json()}\")\n        except:\n            print(f\"Response Text: {response.text}\")\n    \n    # Verify deletion\n    print(f\"\\n✅ Verifying deletion...\")\n    response = requests.get(f\"http://localhost:8000/api/v1/inspectors/{inspector_id}\", headers=headers)\n    \n    if response.status_code == 404:\n        print(\"✅ Inspector successfully deleted\")\n    else:\n        print(f\"❌ Inspector still exists: {response.status_code}\")\n\nif __name__ == \"__main__\":\n    print(\"🚀 Starting Inspector Deletion Workflow Test\")\n    print(\"=\" * 60)\n    test_deletion_workflow()\n    print(\"\\n🏁 Test completed!\")
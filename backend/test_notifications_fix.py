#!/usr/bin/env python3
"""
Test script to verify notification system fixes are working properly.
Run this after starting the backend server.
"""

import requests
import json
import time
from typing import Dict, Any

# Configuration
BACKEND_URL = "http://localhost:8000"

def test_backend_health() -> bool:
    """Test if backend is running"""
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        return response.status_code == 200
    except:
        return False

def test_notifications_api() -> Dict[str, Any]:
    """Test notifications API endpoints"""
    results = {}
    
    # Test get notifications
    try:
        response = requests.get(f"{BACKEND_URL}/api/v1/notifications/notifications")
        results["get_notifications"] = {
            "status": response.status_code,
            "success": response.status_code == 200,
            "count": len(response.json()) if response.status_code == 200 else 0
        }
    except Exception as e:
        results["get_notifications"] = {"success": False, "error": str(e)}
    
    # Test unread count
    try:
        response = requests.get(f"{BACKEND_URL}/api/v1/notifications/notifications/unread-count")
        results["unread_count"] = {
            "status": response.status_code,
            "success": response.status_code == 200,
            "count": response.json().get("unread_count", 0) if response.status_code == 200 else 0
        }
    except Exception as e:
        results["unread_count"] = {"success": False, "error": str(e)}
    
    # Test broadcast endpoint
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/v1/notifications/test/broadcast",
            params={
                "title": "Test Notification Fix",
                "message": "Testing notification system after fixes",
                "priority": "medium"
            }
        )
        results["test_broadcast"] = {
            "status": response.status_code,
            "success": response.status_code == 200
        }
    except Exception as e:
        results["test_broadcast"] = {"success": False, "error": str(e)}
    
    return results

def test_maintenance_events_api() -> Dict[str, Any]:
    """Test maintenance events API for notification triggers"""
    results = {}
    
    # Test get events
    try:
        response = requests.get(f"{BACKEND_URL}/api/v1/maintenance/events")
        results["get_events"] = {
            "status": response.status_code,
            "success": response.status_code == 200,
            "count": len(response.json()) if response.status_code == 200 else 0
        }
    except Exception as e:
        results["get_events"] = {"success": False, "error": str(e)}
    
    return results

def test_inspection_api() -> Dict[str, Any]:
    """Test inspection API for notification triggers"""
    results = {}
    
    # Test get inspections
    try:
        response = requests.get(f"{BACKEND_URL}/api/v1/inspections")
        results["get_inspections"] = {
            "status": response.status_code,
            "success": response.status_code == 200,
            "count": len(response.json()) if response.status_code == 200 else 0
        }
    except Exception as e:
        results["get_inspections"] = {"success": False, "error": str(e)}
    
    return results

def main():
    """Run all notification system tests"""
    print("🧪 Testing Notification System Fixes")
    print("=" * 50)
    
    # Check backend health
    if not test_backend_health():
        print("❌ Backend server is not running on http://localhost:8000")
        print("💡 Please start the backend server first: cd backend && python -m uvicorn app.main:app --reload")
        return
    
    print("✅ Backend server is running")
    
    # Test notifications API
    print("\n📡 Testing Notifications API...")
    notification_results = test_notifications_api()
    for test_name, result in notification_results.items():
        if result.get("success"):
            print(f"✅ {test_name}: OK")
            if "count" in result:
                print(f"   📊 Count: {result['count']}")
        else:
            print(f"❌ {test_name}: FAILED")
            if "error" in result:
                print(f"   🔍 Error: {result['error']}")
    
    # Test maintenance events API
    print("\n🔧 Testing Maintenance Events API...")
    events_results = test_maintenance_events_api()
    for test_name, result in events_results.items():
        if result.get("success"):
            print(f"✅ {test_name}: OK")
            if "count" in result:
                print(f"   📊 Count: {result['count']}")
        else:
            print(f"❌ {test_name}: FAILED")
            if "error" in result:
                print(f"   🔍 Error: {result['error']}")
    
    # Test inspections API
    print("\n📋 Testing Inspections API...")
    inspection_results = test_inspection_api()
    for test_name, result in inspection_results.items():
        if result.get("success"):
            print(f"✅ {test_name}: OK")
            if "count" in result:
                print(f"   📊 Count: {result['count']}")
        else:
            print(f"❌ {test_name}: FAILED")
            if "error" in result:
                print(f"   🔍 Error: {result['error']}")
    
    # Summary
    print("\n📊 Test Summary:")
    all_results = {**notification_results, **events_results, **inspection_results}
    success_count = sum(1 for r in all_results.values() if r.get("success"))
    total_count = len(all_results)
    
    print(f"✅ Passed: {success_count}/{total_count}")
    print(f"❌ Failed: {total_count - success_count}/{total_count}")
    
    if success_count == total_count:
        print("\n🎉 All tests passed! Notification system is working properly.")
    else:
        print("\n⚠️ Some tests failed. Please check the backend server and API endpoints.")
    
    print("\n💡 Next Steps:")
    print("1. Start the frontend: cd frontend-v2 && npm run dev")
    print("2. Login to the application") 
    print("3. Check the notification bell in the navigation bar")
    print("4. Try creating a new maintenance event or inspection to test real-time notifications")

if __name__ == "__main__":
    main()
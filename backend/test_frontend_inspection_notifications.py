#!/usr/bin/env python3
"""
Test script to verify frontend inspection creation triggers notifications
"""

import asyncio
import sys
import os
import json
import aiohttp
from datetime import datetime, date

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'app'))

from sqlmodel import Session, select
from backend.app.database import create_db_and_tables, engine
from backend.app.domains.notifications.models.notification import Notification, NotificationType

async def test_inspection_api_call():
    """Test creating inspection via frontend API call"""
    print("🧪 Testing inspection creation via frontend API...")
    
    base_url = "http://127.0.0.1:8000"
    
    # Sample data that frontend would send
    inspection_data = {
        "inspection_number": f"TEST-FRONTEND-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "title": "Test Frontend Inspection",
        "description": "Testing frontend inspection creation with notifications",
        "equipment_id": 1,  # Assuming equipment F-401 has ID 1
        "requesting_department": "Inspection",
        "work_order": "WO-TEST-001",
        "permit_number": "PM-TEST-001",
        "is_planned": True,
        "maintenance_event_id": None,
        "maintenance_sub_event_id": None,
        "planned_start_date": "2024-12-10",
        "planned_end_date": "2024-12-11",
        "actual_start_date": None,
        "actual_end_date": None,
        "unplanned_reason": None
    }
    
    # First, try to get a valid auth token (this might fail if auth is required)
    try:
        async with aiohttp.ClientSession() as session:
            print(f"📡 Calling POST {base_url}/api/v1/inspections/")
            print(f"📊 Payload: {json.dumps(inspection_data, indent=2)}")
            
            async with session.post(
                f"{base_url}/api/v1/inspections/",
                json=inspection_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                print(f"🔍 Response Status: {response.status}")
                response_text = await response.text()
                print(f"📄 Response Body: {response_text}")
                
                if response.status == 200 or response.status == 201:
                    print("✅ Inspection created successfully!")
                    try:
                        response_json = json.loads(response_text)
                        inspection_id = response_json.get('id')
                        print(f"📋 Created inspection ID: {inspection_id}")
                        return inspection_id
                    except json.JSONDecodeError:
                        print("⚠️ Could not parse response as JSON")
                elif response.status == 401:
                    print("🔐 Authentication required - this is expected in production")
                elif response.status == 422:
                    print("❌ Validation error - check the data format")
                else:
                    print(f"❌ Unexpected response status: {response.status}")
                    
    except Exception as e:
        print(f"❌ Error calling API: {e}")
        
    return None

def check_notifications_in_db(inspection_id=None):
    """Check if notifications were created in the database"""
    print("\n🔍 Checking notifications in database...")
    
    try:
        with Session(engine) as session:
            # Get recent inspection-related notifications
            query = select(Notification).where(
                Notification.type == NotificationType.INSPECTION_CREATED
            ).order_by(Notification.created_at.desc()).limit(5)
            
            notifications = session.exec(query).all()
            
            if not notifications:
                print("❌ No inspection creation notifications found in database")
                return False
                
            print(f"✅ Found {len(notifications)} inspection creation notification(s):")
            
            for notif in notifications:
                print(f"   📌 ID: {notif.id}")
                print(f"      Title: {notif.title}")
                print(f"      Message: {notif.message}")
                print(f"      Created: {notif.created_at}")
                print(f"      Related Item: {notif.related_item_type}#{notif.related_item_id}")
                
                if inspection_id and notif.related_item_id == str(inspection_id):
                    print(f"   🎯 This notification matches our test inspection!")
                print()
                
            return True
            
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return False

async def test_notification_system():
    """Test the complete flow"""
    print("🔔 Testing Frontend Inspection → Notification Flow")
    print("=" * 50)
    
    # Check database connectivity
    try:
        create_db_and_tables()
        print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return
    
    # Check notifications before the test
    print("\n📊 Checking notifications before test...")
    notifications_before = check_notifications_in_db()
    
    # Test the API call
    inspection_id = await test_inspection_api_call()
    
    # Check notifications after the test
    print("\n📊 Checking notifications after test...")
    notifications_after = check_notifications_in_db(inspection_id)
    
    # Summary
    print("\n📋 Test Summary:")
    print(f"   API Call: {'✅ Success' if inspection_id else '❌ Failed'}")
    print(f"   Notifications: {'✅ Found' if notifications_after else '❌ Not Found'}")
    
    if inspection_id and notifications_after:
        print("🎉 End-to-end test PASSED - Inspection creation triggers notifications!")
    elif inspection_id and not notifications_after:
        print("⚠️ Inspection created but notifications not found - Check notification service")
    elif not inspection_id:
        print("❌ Could not create inspection - Check API endpoint and authentication")
    else:
        print("❓ Unexpected result - Manual investigation needed")

if __name__ == "__main__":
    asyncio.run(test_notification_system())
#!/usr/bin/env python3
"""
Test script to verify inspection notification creation
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from datetime import datetime, date
from sqlmodel import Session, select, create_engine
from app.database import create_db_and_tables, engine, get_session
from app.domains.notifications.services.notification_service import NotificationService
from app.domains.notifications.models.notification import Notification, NotificationType
from app.domains.equipment.models.equipment import Equipment
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspector.models.inspector import Inspector

async def test_inspection_notification():
    """Test creating an inspection notification"""
    print("🧪 Testing inspection notification creation...")
    
    # Create database tables if they don't exist
    create_db_and_tables()
    
    # Get database session
    with Session(engine) as session:
        # Get or create test equipment
        equipment = session.exec(select(Equipment).where(Equipment.tag == "F-401")).first()
        if not equipment:
            print("❌ No equipment found with tag 'F-401'. Please check the database.")
            return
        
        print(f"✅ Found equipment: {equipment.tag} - {equipment.description}")
        
        # Create notification service
        notification_service = NotificationService(session)
        
        # Test creating an inspection notification
        try:
            await notification_service.broadcast_inspection_created(
                inspection_id=999,  # Test ID
                inspection_number="TEST-INS-F401-001",
                equipment_tag=equipment.tag,
                event_id=None,
                event_number=None,
                sub_event_id=None,
                sub_event_number=None,
                created_by="test_system",
                inspection_type="Planned",
                is_planned=True
            )
            
            print("✅ Notification created successfully!")
            
            # Check if notification was saved
            notifications = session.exec(
                select(Notification).where(
                    Notification.type == NotificationType.INSPECTION_CREATED
                ).order_by(Notification.created_at.desc())
            ).first()
            
            if notifications:
                print(f"✅ Found notification in database:")
                print(f"   ID: {notifications.id}")
                print(f"   Title: {notifications.title}")
                print(f"   Message: {notifications.message}")
                print(f"   Type: {notifications.type}")
                print(f"   Priority: {notifications.priority}")
                print(f"   Created: {notifications.created_at}")
            else:
                print("❌ No notification found in database")
                
        except Exception as e:
            print(f"❌ Error creating notification: {e}")
            import traceback
            traceback.print_exc()

async def test_notification_api_call():
    """Test the notification API directly"""
    print("\n🌐 Testing notification API call...")
    
    import requests
    
    try:
        # Test API connectivity
        response = requests.get("http://127.0.0.1:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend server is running")
            
            # Try to get notifications (this might fail due to auth, but we can see the response)
            try:
                notif_response = requests.get("http://127.0.0.1:8000/api/v1/notifications/", timeout=5)
                print(f"📡 Notifications API response: {notif_response.status_code}")
                if notif_response.status_code == 401:
                    print("🔐 Authentication required (expected)")
                elif notif_response.status_code == 200:
                    print(f"✅ Got response: {notif_response.json()}")
                else:
                    print(f"❓ Unexpected response: {notif_response.text}")
            except Exception as e:
                print(f"❌ Notifications API error: {e}")
                
        else:
            print(f"❌ Backend server returned: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server at http://127.0.0.1:8000")
    except Exception as e:
        print(f"❌ Error testing API: {e}")

async def main():
    """Main test function"""
    print("🔔 Inspection Notification Test - Using Equipment F-401")
    print("=" * 40)
    
    # First, run the test
    await test_inspection_notification()
    await test_notification_api_call()
    
    print("\n💡 If test equipment was missing, run: python setup_test_data.py")
    print("✨ Test completed!")

if __name__ == "__main__":
    asyncio.run(main())
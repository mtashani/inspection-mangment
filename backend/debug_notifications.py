#!/usr/bin/env python3
"""
Simple notification debugging tool
Run this while testing frontend inspection creation
"""

import time
from sqlmodel import Session, select
from app.database import engine
from app.domains.notifications.models.notification import Notification, NotificationType

def monitor_notifications():
    """Monitor notification creation in real-time"""
    print("🔔 Notification Monitor Started")
    print("Create an inspection in the frontend now...")
    print("Press Ctrl+C to stop monitoring")
    print("-" * 50)
    
    last_notification_id = 0
    
    # Get the latest notification ID first
    try:
        with Session(engine) as session:
            latest = session.exec(
                select(Notification).order_by(Notification.id.desc()).limit(1)
            ).first()
            if latest:
                last_notification_id = latest.id
                print(f"📊 Starting from notification ID: {last_notification_id}")
    except Exception as e:
        print(f"❌ Error getting initial state: {e}")
        return
    
    try:
        while True:
            with Session(engine) as session:
                # Check for new notifications
                new_notifications = session.exec(
                    select(Notification).where(
                        Notification.id > last_notification_id
                    ).order_by(Notification.id.asc())
                ).all()
                
                for notif in new_notifications:
                    print(f"🆕 NEW NOTIFICATION!")
                    print(f"   ID: {notif.id}")
                    print(f"   Type: {notif.type}")
                    print(f"   Title: {notif.title}")
                    print(f"   Message: {notif.message}")
                    print(f"   Related: {notif.related_item_type}#{notif.related_item_id}")
                    print(f"   Created: {notif.created_at}")
                    print(f"   Target Inspector: {notif.inspector_id}")
                    print("-" * 30)
                    
                    last_notification_id = notif.id
                    
                    if notif.type == NotificationType.INSPECTION_CREATED:
                        print("✅ INSPECTION NOTIFICATION DETECTED!")
            
            time.sleep(2)  # Check every 2 seconds
            
    except KeyboardInterrupt:
        print("\n👋 Monitoring stopped")
    except Exception as e:
        print(f"❌ Error during monitoring: {e}")

if __name__ == "__main__":
    monitor_notifications()
#!/usr/bin/env python3
"""
Check database data for inspectors and notifications
"""

import sqlite3
import os

def check_database_data():
    """Check database for inspectors and notifications"""
    db_path = 'inspection_management.db'
    
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 Checking database data...")
        print(f"📍 Database: {db_path}")
        print()
        
        # Check inspectors
        cursor.execute("SELECT COUNT(*) FROM inspectors")
        total_inspectors = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM inspectors WHERE can_login = 1")
        login_enabled = cursor.fetchone()[0]
        
        print(f"👥 Inspectors:")
        print(f"  - Total: {total_inspectors}")
        print(f"  - Can login: {login_enabled}")
        
        if login_enabled > 0:
            # First check what columns exist
            cursor.execute("PRAGMA table_info(inspectors)")
            columns = cursor.fetchall()
            print("  - Available columns:", [col[1] for col in columns])
            
            cursor.execute("SELECT id, first_name, last_name, username, email FROM inspectors WHERE can_login = 1 LIMIT 5")
            inspectors = cursor.fetchall()
            print("  - Sample inspectors:")
            for inspector in inspectors:
                print(f"    • ID: {inspector[0]}, Name: {inspector[1]} {inspector[2]}, Username: {inspector[3]}, Email: {inspector[4]}")
        print()
        
        # Check notifications
        cursor.execute("SELECT COUNT(*) FROM notifications")
        total_notifications = cursor.fetchone()[0]
        
        print(f"🔔 Notifications:")
        print(f"  - Total: {total_notifications}")
        
        if total_notifications > 0:
            cursor.execute("SELECT id, title, type, priority, recipient_id, created_at FROM notifications ORDER BY created_at DESC LIMIT 5")
            notifications = cursor.fetchall()
            print("  - Recent notifications:")
            for notification in notifications:
                print(f"    • ID: {notification[0]}, Title: {notification[1]}, Type: {notification[2]}, Priority: {notification[3]}, Recipient: {notification[4]}, Created: {notification[5]}")
        print()
        
        # Check maintenance events
        cursor.execute("SELECT COUNT(*) FROM maintenance_events")
        total_events = cursor.fetchone()[0]
        
        print(f"🔧 Maintenance Events:")
        print(f"  - Total: {total_events}")
        
        if total_events > 0:
            cursor.execute("SELECT id, event_number, title, event_type, status, created_at FROM maintenance_events ORDER BY created_at DESC LIMIT 3")
            events = cursor.fetchall()
            print("  - Recent events:")
            for event in events:
                print(f"    • ID: {event[0]}, Number: {event[1]}, Title: {event[2]}, Type: {event[3]}, Status: {event[4]}, Created: {event[5]}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return False

if __name__ == "__main__":
    check_database_data()
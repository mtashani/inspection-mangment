#!/usr/bin/env python3
"""
Check SQLite database tables for notification system
"""

import sqlite3
import os

def check_notification_tables():
    """Check if notification tables exist in the database"""
    db_path = 'inspection_management.db'
    
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check for notification tables
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name LIKE '%notification%'
            ORDER BY name
        """)
        
        notification_tables = cursor.fetchall()
        
        print("🔍 Checking notification tables in SQLite database...")
        print(f"📍 Database: {db_path}")
        print()
        
        if notification_tables:
            print("✅ Notification tables found:")
            for table in notification_tables:
                print(f"  - {table[0]}")
                
                # Get table schema
                cursor.execute(f"PRAGMA table_info({table[0]})")
                columns = cursor.fetchall()
                print(f"    Columns ({len(columns)}):")
                for col in columns:
                    print(f"      • {col[1]} ({col[2]})")
                print()
        else:
            print("❌ No notification tables found!")
            
        # Check all tables to see what exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        all_tables = cursor.fetchall()
        
        print(f"📋 All tables in database ({len(all_tables)}):")
        for table in all_tables:
            print(f"  - {table[0]}")
            
        conn.close()
        return len(notification_tables) > 0
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return False

if __name__ == "__main__":
    check_notification_tables()
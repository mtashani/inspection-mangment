"""
Script to fix the inspector_documents table schema by adding the missing original_filename column.
This resolves the sqlite3.OperationalError: no such column: inspector_documents.original_filename error.
"""

import sqlite3
import os
import sys

def fix_database_schema():
    """Add the missing original_filename column to inspector_documents table"""
    
    # Database path
    db_path = r"c:\Users\tashan\Documents\code\inspection mangment\backend\inspection_management.db"
    
    # Check if database exists
    if not os.path.exists(db_path):
        print(f"❌ Database file not found at {db_path}")
        return False
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if the column already exists
        cursor.execute("PRAGMA table_info(inspector_documents);")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'original_filename' in columns:
            print("✅ Column 'original_filename' already exists in inspector_documents table")
            conn.close()
            return True
        
        # Add the missing column
        print("🔧 Adding 'original_filename' column to inspector_documents table...")
        cursor.execute("ALTER TABLE inspector_documents ADD COLUMN original_filename VARCHAR;")
        
        # Commit changes
        conn.commit()
        print("✅ Successfully added 'original_filename' column to inspector_documents table")
        
        # Verify the column was added
        cursor.execute("PRAGMA table_info(inspector_documents);")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"📋 Current columns in inspector_documents table: {', '.join(columns)}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error fixing database schema: {e}")
        return False

def check_logging_issue():
    """Check why the error might not be appearing in the log files"""
    
    # Log file path
    log_file_path = r"c:\Users\tashan\Documents\code\inspection mangment\backend\logs\inspector_api_errors.log"
    
    print(f"\n🔍 Checking log file: {log_file_path}")
    
    if not os.path.exists(log_file_path):
        print("⚠️  Log file does not exist yet")
        return
    
    try:
        # Read the last 20 lines of the log file
        with open(log_file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            print(f"📄 Last {min(20, len(lines))} lines of log file:")
            for line in lines[-20:]:
                print(line.strip())
    except Exception as e:
        print(f"❌ Error reading log file: {e}")

if __name__ == "__main__":
    print("🔧 Fixing inspector_documents table schema...")
    
    # Fix the database schema
    success = fix_database_schema()
    
    if success:
        print("\n✅ Database schema fix completed successfully!")
        print("🔄 You should now be able to access the /api/v1/inspectors/{id}/related-records endpoint without errors.")
    else:
        print("\n❌ Failed to fix database schema. Please check the error message above.")
        sys.exit(1)
    
    # Check logging
    check_logging_issue()
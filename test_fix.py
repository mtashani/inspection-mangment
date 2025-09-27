"""
Test script to verify that the database schema fix worked correctly
"""

import sqlite3
import os

def test_database_fix():
    """Test that the original_filename column was added correctly"""
    
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
        
        # Check if the column exists
        cursor.execute("PRAGMA table_info(inspector_documents);")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'original_filename' in columns:
            print("✅ SUCCESS: Column 'original_filename' exists in inspector_documents table")
            
            # Test a simple query that includes the original_filename column
            cursor.execute("SELECT id, filename, original_filename FROM inspector_documents LIMIT 1;")
            print("✅ SUCCESS: Query with original_filename column works correctly")
            
            conn.close()
            return True
        else:
            print("❌ FAILURE: Column 'original_filename' is missing from inspector_documents table")
            conn.close()
            return False
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing database schema fix...")
    
    success = test_database_fix()
    
    if success:
        print("\n🎉 All tests passed! The database schema fix was successful.")
        print("   The /api/v1/inspectors/{id}/related-records endpoint should now work correctly.")
    else:
        print("\n💥 Tests failed! Please check the error messages above.")
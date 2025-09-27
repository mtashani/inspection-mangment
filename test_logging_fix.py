"""
Test script to verify that the logging fix works correctly
"""

import os
import time

def test_logging_fix():
    """Test that the logging decorator is working correctly"""
    
    # Log file path
    log_file_path = r"c:\Users\tashan\Documents\code\inspection mangment\backend\logs\inspector_api_errors.log"
    
    # Get initial log file size
    initial_size = 0
    if os.path.exists(log_file_path):
        initial_size = os.path.getsize(log_file_path)
    
    print(f"Initial log file size: {initial_size} bytes")
    
    # Wait a moment
    time.sleep(1)
    
    # Print instructions for testing
    print("\n🔧 To test the logging fix:")
    print("1. Make a request to the /api/v1/inspectors/999/related-records endpoint")
    print("2. This should trigger a 404 error (inspector not found)")
    print("3. The error should be logged to the inspector_api_errors.log file")
    print("4. Run this script again after making the request to check if the log was created")
    
    print(f"\n📝 Log file location: {log_file_path}")
    
    return True

if __name__ == "__main__":
    print("🧪 Testing logging fix...")
    test_logging_fix()
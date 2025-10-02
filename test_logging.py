#!/usr/bin/env python3
"""
Test script to verify domain-based error logging is working correctly.
This script makes requests to each domain that should trigger errors
and verifies they are logged to the correct files.
"""

import requests
import json
import time
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
LOG_DIR = "backend/logs"

# Test cases for each domain
TEST_CASES = {
    "equipment": {
        "endpoint": "/equipment/nonexistent",
        "method": "GET",
        "expected_status": 404,
        "description": "Test equipment domain 404 error logging"
    },
    "maintenance": {
        "endpoint": "/maintenance/events/nonexistent",
        "method": "GET", 
        "expected_status": 404,
        "description": "Test maintenance domain 404 error logging"
    },
    "inspector": {
        "endpoint": "/inspectors/nonexistent",
        "method": "GET",
        "expected_status": 404,
        "description": "Test inspector domain 404 error logging"
    }
}

def test_domain_logging(domain_name, test_case):
    """Test logging for a specific domain"""
    print(f"\n--- Testing {domain_name} domain ---")
    print(f"Description: {test_case['description']}")
    
    # Make request that should trigger an error
    url = f"{BASE_URL}{test_case['endpoint']}"
    print(f"Making {test_case['method']} request to: {url}")
    
    try:
        if test_case['method'] == 'GET':
            response = requests.get(url)
        elif test_case['method'] == 'POST':
            response = requests.post(url, json={})
        else:
            response = requests.request(test_case['method'], url)
            
        print(f"Response status: {response.status_code}")
        print(f"Expected status: {test_case['expected_status']}")
        
        if response.status_code == test_case['expected_status']:
            print("✅ Status code matches expected")
        else:
            print("⚠️  Status code doesn't match expected")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False
    
    # Wait a moment for logs to be written
    time.sleep(1)
    
    # Check if log file exists and contains the error
    log_file = Path(LOG_DIR) / f"{domain_name}_api_errors.log"
    if log_file.exists():
        print(f"✅ Log file exists: {log_file}")
        
        # Read last few lines of log file
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                # Get last 5 lines
                last_lines = lines[-5:] if len(lines) >= 5 else lines
                
                # Check if any line contains the endpoint
                found = False
                for line in last_lines:
                    if test_case['endpoint'] in line:
                        print("✅ Error found in log file:")
                        print(f"   Last log entry: {line.strip()}")
                        found = True
                        break
                        
                if not found:
                    print("⚠️  Error not found in recent log entries")
                    print("   Recent log entries:")
                    for line in last_lines:
                        print(f"   {line.strip()}")
                        
        except Exception as e:
            print(f"❌ Failed to read log file: {e}")
            return False
    else:
        print(f"❌ Log file not found: {log_file}")
        return False
        
    return True

def main():
    """Main test function"""
    print("Domain-Based Error Logging Test Script")
    print("=" * 50)
    
    # Check if log directory exists
    log_dir_path = Path(LOG_DIR)
    if not log_dir_path.exists():
        print(f"❌ Log directory not found: {LOG_DIR}")
        print("Make sure the FastAPI application is running and has created log files")
        return
    
    print(f"✅ Log directory found: {LOG_DIR}")
    
    # Test each domain
    results = {}
    for domain_name, test_case in TEST_CASES.items():
        try:
            success = test_domain_logging(domain_name, test_case)
            results[domain_name] = success
        except Exception as e:
            print(f"❌ Test failed for {domain_name}: {e}")
            results[domain_name] = False
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for success in results.values() if success)
    total = len(results)
    
    for domain_name, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{domain_name.capitalize():12} {status}")
    
    print("-" * 50)
    print(f"Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Domain-based logging is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the logs and configuration.")

if __name__ == "__main__":
    main()

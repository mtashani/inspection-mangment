#!/usr/bin/env python3
"""
Inspection Data Fetcher Script
Fetches all inspection records and planned inspections from the backend API
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, List, Any

# Backend API Configuration
BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"

def get_auth_token():
    """
    Get authentication token from the backend
    You may need to adjust this based on your auth system
    """
    # Try to login with common test credentials
    login_data = {
        "username": "admin",
        "password": "admin"
    }
    
    try:
        response = requests.post(f"{API_V1}/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
    except Exception as e:
        print(f"⚠️ Could not get auth token: {e}")
    
    return None

def make_api_request(endpoint: str, token: str = None) -> Dict[str, Any]:
    """Make API request with optional authentication"""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        response = requests.get(f"{API_V1}{endpoint}", headers=headers)
        
        return {
            "success": response.status_code == 200,
            "status_code": response.status_code,
            "data": response.json() if response.status_code == 200 else None,
            "error": response.text if response.status_code != 200 else None
        }
    except Exception as e:
        return {
            "success": False,
            "status_code": 0,
            "data": None,
            "error": str(e)
        }

def fetch_inspections_data():
    """Fetch all inspection-related data from the API"""
    
    print("🔍 Fetching Inspection Data from Backend API")
    print("=" * 60)
    
    # Get authentication token
    print("🔐 Attempting to authenticate...")
    token = get_auth_token()
    if token:
        print(f"✅ Authentication successful (token: {token[:20]}...)")
    else:
        print("⚠️ Authentication failed, trying without token...")
    
    # API endpoints to test
    endpoints = [
        "/inspections",
        "/inspections?limit=100",
        "/maintenance/events",
        "/maintenance/events/14",
        "/maintenance/events/14/sub-events",
        "/inspections?maintenance_event_id=14",
        "/inspections?maintenance_event_id=14&maintenance_sub_event_id=1",
        "/daily-reports/inspections",
        "/daily-reports/inspections?maintenance_event_id=14"
    ]
    
    results = {}
    
    print("\n📊 Fetching data from API endpoints...")
    print("-" * 40)
    
    for endpoint in endpoints:
        print(f"\n🔗 Testing: {endpoint}")
        result = make_api_request(endpoint, token)
        
        if result["success"]:
            data = result["data"]
            if isinstance(data, list):
                count = len(data)
                print(f"   ✅ Success: {count} records returned")
            elif isinstance(data, dict):
                if "inspections" in data:
                    count = len(data["inspections"])
                    print(f"   ✅ Success: {count} inspections returned")
                elif "count" in data:
                    print(f"   ✅ Success: {data['count']} records (with count field)")
                else:
                    print(f"   ✅ Success: Object returned")
            else:
                print(f"   ✅ Success: Data returned")
        else:
            print(f"   ❌ Failed: {result['status_code']} - {result['error']}")
        
        results[endpoint] = result
    
    return results

def analyze_results(results: Dict[str, Dict[str, Any]]):
    """Analyze and display the results"""
    
    print("\n" + "=" * 60)
    print("📋 DETAILED ANALYSIS RESULTS")
    print("=" * 60)
    
    for endpoint, result in results.items():
        print(f"\n🔍 Endpoint: {endpoint}")
        print("-" * 50)
        
        if result["success"]:
            data = result["data"]
            
            if isinstance(data, list):
                print(f"📊 Count: {len(data)} records")
                if len(data) > 0:
                    print("📝 Sample Record:")
                    print(json.dumps(data[0], indent=2, default=str)[:500] + "...")
            
            elif isinstance(data, dict):
                if "inspections" in data:
                    inspections = data["inspections"]
                    print(f"📊 Count: {len(inspections)} inspections")
                    if "count" in data:
                        print(f"📊 Total Count: {data['count']}")
                    
                    if len(inspections) > 0:
                        print("📝 Sample Inspection:")
                        print(json.dumps(inspections[0], indent=2, default=str)[:500] + "...")
                
                elif "sub_events" in data:
                    print(f"📊 Event Details with {len(data.get('sub_events', []))} sub-events")
                    print("📝 Event Info:")
                    event_info = {k: v for k, v in data.items() if k != 'sub_events'}
                    print(json.dumps(event_info, indent=2, default=str))
                
                else:
                    print("📝 Response Data:")
                    print(json.dumps(data, indent=2, default=str)[:500] + "...")
        
        else:
            print(f"❌ Error: {result['status_code']}")
            print(f"❌ Message: {result['error']}")

def generate_summary(results: Dict[str, Dict[str, Any]]):
    """Generate a summary of findings"""
    
    print("\n" + "=" * 60)
    print("🎯 SUMMARY OF FINDINGS")
    print("=" * 60)
    
    successful_endpoints = [ep for ep, res in results.items() if res["success"]]
    failed_endpoints = [ep for ep, res in results.items() if not res["success"]]
    
    print(f"✅ Successful endpoints: {len(successful_endpoints)}")
    print(f"❌ Failed endpoints: {len(failed_endpoints)}")
    
    if successful_endpoints:
        print("\n✅ Working endpoints:")
        for ep in successful_endpoints:
            data = results[ep]["data"]
            if isinstance(data, list):
                print(f"   • {ep} → {len(data)} records")
            elif isinstance(data, dict) and "inspections" in data:
                print(f"   • {ep} → {len(data['inspections'])} inspections")
            else:
                print(f"   • {ep} → OK")
    
    if failed_endpoints:
        print("\n❌ Failed endpoints:")
        for ep in failed_endpoints:
            error = results[ep]["error"]
            print(f"   • {ep} → {error}")
    
    # Check specifically for event 14 data
    event_14_endpoints = [ep for ep in results.keys() if "14" in ep]
    if event_14_endpoints:
        print(f"\n🔍 Event 14 Analysis:")
        for ep in event_14_endpoints:
            result = results[ep]
            if result["success"]:
                data = result["data"]
                if isinstance(data, dict) and "inspections" in data:
                    inspections = data["inspections"]
                    print(f"   • {ep} → {len(inspections)} inspections found")
                    if inspections:
                        sample = inspections[0]
                        print(f"     - Sample: {sample.get('inspection_number', 'N/A')} - {sample.get('title', 'N/A')}")
                elif isinstance(data, list):
                    print(f"   • {ep} → {len(data)} records")
                else:
                    print(f"   • {ep} → Event data retrieved")
            else:
                print(f"   • {ep} → Failed: {result['error']}")

def check_backend_status():
    """Check if backend server is running and provide startup instructions"""
    print("🔍 Checking Backend Server Status")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend server is running!")
            return True
    except requests.exceptions.ConnectionError:
        print("❌ Backend server is NOT running on localhost:8000")
    except Exception as e:
        print(f"❌ Error checking backend: {e}")
    
    print("\n🚀 TO START THE BACKEND SERVER:")
    print("-" * 40)
    print("1. Open a new terminal/PowerShell window")
    print("2. Navigate to the backend directory:")
    print('   cd "C:\\Users\\tashan\\Documents\\code\\inspection mangment\\backend"')
    print("3. Activate virtual environment (if you have one):")
    print("   .\\venv\\Scripts\\activate    # Windows")
    print("   # OR")
    print("   source venv/bin/activate   # Linux/Mac")
    print("4. Start the server:")
    print("   python -m uvicorn app.main:app --reload --port 8000")
    print("   # OR")
    print("   uvicorn app.main:app --reload --port 8000")
    print("\n⚠️ Make sure the backend server is running BEFORE running this script again!")
    
    return False

def main():
    """Main function"""
    try:
        print("🚀 Starting Inspection Data Fetch")
        print(f"📅 Timestamp: {datetime.now().isoformat()}")
        
        # Check if backend is running
        if not check_backend_status():
            print("\n❌ Cannot continue without backend server running.")
            print("💡 Please start the backend server first and then run this script again.")
            return
        
        # Fetch data
        results = fetch_inspections_data()
        
        # Analyze results
        analyze_results(results)
        
        # Generate summary
        generate_summary(results)
        
        print("\n" + "=" * 60)
        print("✅ Script completed successfully!")
        print("💡 Please share these results to help diagnose any issues.")
        
    except KeyboardInterrupt:
        print("\n⚠️ Script interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
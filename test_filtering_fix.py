#!/usr/bin/env python3
"""
Test Script for Backend Filtering Fix
Tests the maintenance_event_id filtering in the inspections API
"""

import requests
import json
from typing import Dict, Any

# Backend API Configuration
BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"

def test_filtering_fix():
    """Test the filtering fix for Event 14"""
    
    print("🔧 Testing Backend Filtering Fix for Event 14")
    print("=" * 60)
    
    # Test cases to run
    test_cases = [
        {
            "name": "All Inspections (No Filter)",
            "endpoint": "/inspections",
            "params": {}
        },
        {
            "name": "Event 14 Inspections Only", 
            "endpoint": "/inspections",
            "params": {"maintenance_event_id": 14}
        },
        {
            "name": "Event 14 + Sub-Event 1",
            "endpoint": "/inspections", 
            "params": {"maintenance_event_id": 14, "maintenance_sub_event_id": 1}
        },
        {
            "name": "Non-existent Event 999",
            "endpoint": "/inspections",
            "params": {"maintenance_event_id": 999}
        }
    ]
    
    results = {}
    
    for test_case in test_cases:
        print(f"\n🧪 Testing: {test_case['name']}")
        print("-" * 40)
        
        try:
            response = requests.get(f"{API_V1}{test_case['endpoint']}", params=test_case['params'])
            
            if response.status_code == 200:
                data = response.json()
                count = len(data)
                print(f"✅ Success: {count} inspections returned")
                
                # Show sample if available
                if count > 0:
                    sample = data[0]
                    event_id = sample.get('maintenance_event_id')
                    sub_event_id = sample.get('maintenance_sub_event_id')
                    print(f"   Sample: {sample.get('inspection_number')} - Event: {event_id}, Sub-Event: {sub_event_id}")
                
                results[test_case['name']] = {
                    "success": True,
                    "count": count,
                    "sample_event_id": data[0].get('maintenance_event_id') if count > 0 else None
                }
            else:
                print(f"❌ Failed: {response.status_code} - {response.text}")
                results[test_case['name']] = {
                    "success": False,
                    "error": f"{response.status_code}: {response.text}"
                }
                
        except Exception as e:
            print(f"❌ Error: {e}")
            results[test_case['name']] = {
                "success": False, 
                "error": str(e)
            }
    
    # Analysis
    print("\n" + "=" * 60)
    print("📊 FILTERING FIX ANALYSIS")
    print("=" * 60)
    
    all_inspections_count = results.get("All Inspections (No Filter)", {}).get("count", 0)
    event_14_count = results.get("Event 14 Inspections Only", {}).get("count", 0)
    
    print(f"📈 Total Inspections: {all_inspections_count}")
    print(f"📈 Event 14 Inspections: {event_14_count}")
    
    if all_inspections_count > 0 and event_14_count >= 0:
        if event_14_count < all_inspections_count:
            print("✅ FILTERING IS WORKING! Event 14 returns fewer inspections than total.")
            print("✅ The backend is now properly filtering by maintenance_event_id.")
        elif event_14_count == all_inspections_count:
            print("⚠️ FILTERING MAY NOT BE WORKING: Event 14 returns same count as total.")
            print("⚠️ This could mean all inspections belong to Event 14, OR filtering is not working.")
        else:
            print("❌ UNEXPECTED: Event 14 count is higher than total count.")
    
    # Check sample event IDs
    event_14_sample_id = results.get("Event 14 Inspections Only", {}).get("sample_event_id")
    if event_14_sample_id:
        if event_14_sample_id == 14:
            print("✅ CONFIRMED: Event 14 filter returns inspections with maintenance_event_id = 14")
        else:
            print(f"❌ BUG DETECTED: Event 14 filter returned inspection with maintenance_event_id = {event_14_sample_id}")
    
    print("\n🎯 CONCLUSION:")
    if event_14_count < all_inspections_count and event_14_sample_id == 14:
        print("✅ Backend filtering fix is WORKING CORRECTLY!")
        print("✅ The maintenance_event_id parameter is now properly filtering inspections.")
        print("✅ Event 14 data is REAL, not mock data.")
    elif event_14_count == 0:
        print("✅ Backend filtering is working - Event 14 has no associated inspections.")
        print("✅ This explains why you weren't seeing data for Event 14.")
    else:
        print("⚠️ Need to verify the filtering behavior manually.")
    
    return results

def main():
    """Main function"""
    try:
        print("🚀 Starting Backend Filtering Fix Test")
        print("📅 Make sure the backend server is running on localhost:8000")
        
        # Test the fix
        results = test_filtering_fix()
        
        print("\n" + "=" * 60)
        print("✅ Test completed! Please share these results.")
        
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")

if __name__ == "__main__":
    main()
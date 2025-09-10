#!/usr/bin/env python3
"""
Test script for verifying search and date filtering functionality
for inspections API after implementing the requested improvements.
"""

import requests
import json
from datetime import datetime, date, timedelta
import urllib.parse

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
INSPECTIONS_ENDPOINT = f"{BASE_URL}/inspections"

def test_api_call(name: str, endpoint: str, params: dict = None):
    """Test an API call and return results"""
    try:
        print(f"\n🧪 Testing: {name}")
        print(f"📡 URL: {endpoint}")
        if params:
            print(f"📝 Params: {params}")
        
        response = requests.get(endpoint, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            count = len(data.get('data', [])) if isinstance(data, dict) and 'data' in data else len(data) if isinstance(data, list) else 0
            print(f"✅ Success: {response.status_code} - {count} inspections found")
            
            # Show sample data if available
            if isinstance(data, dict) and 'data' in data and data['data']:
                sample = data['data'][0]
                print(f"📄 Sample: {sample.get('inspection_number', 'N/A')} - {sample.get('title', 'N/A')}")
                print(f"📅 Dates: planned_start={sample.get('planned_start_date')}, actual_start={sample.get('actual_start_date')}")
            elif isinstance(data, list) and data:
                sample = data[0]
                print(f"📄 Sample: {sample.get('inspection_number', 'N/A')} - {sample.get('title', 'N/A')}")
            
            return {
                "success": True,
                "status_code": response.status_code,
                "count": count,
                "data": data
            }
        else:
            print(f"❌ Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"💬 Error details: {error_data}")
            except:
                print(f"💬 Error text: {response.text}")
            
            return {
                "success": False,
                "status_code": response.status_code,
                "error": response.text
            }
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return {
            "success": False,
            "status_code": 0,
            "error": str(e)
        }

def test_search_and_date_filters():
    """Test the new search and date filtering functionality"""
    
    print("🔍 TESTING SEARCH AND DATE FILTERS")
    print("=" * 60)
    
    results = {}
    
    # Test 1: Basic search functionality (title, number, description)
    search_terms = ["pressure", "valve", "inspection", "CV-302"]
    for term in search_terms:
        result = test_api_call(
            f"Search for '{term}'",
            INSPECTIONS_ENDPOINT,
            {"search": term}
        )
        results[f"search_{term}"] = result
    
    # Test 2: Date filtering with different date fields
    today = date.today()
    past_date = today - timedelta(days=30)
    future_date = today + timedelta(days=30)
    
    date_fields = ["planned_start_date", "planned_end_date", "actual_start_date", "actual_end_date"]
    
    for date_field in date_fields:
        result = test_api_call(
            f"Date filter on {date_field} (last 30 days)",
            INSPECTIONS_ENDPOINT,
            {
                "date_field": date_field,
                "from_date": past_date.isoformat(),
                "to_date": today.isoformat()
            }
        )
        results[f"date_filter_{date_field}"] = result
    
    # Test 3: Combined search and date filters
    result = test_api_call(
        "Combined: search + date filter",
        INSPECTIONS_ENDPOINT,
        {
            "search": "valve",
            "date_field": "actual_start_date",
            "from_date": past_date.isoformat()
        }
    )
    results["combined_search_date"] = result
    
    # Test 4: Equipment tag search (existing functionality)
    result = test_api_call(
        "Equipment tag search",
        INSPECTIONS_ENDPOINT,
        {"equipment_tag": "CV"}
    )
    results["equipment_tag_search"] = result
    
    # Test 5: Pagination with search
    result = test_api_call(
        "Search with pagination",
        INSPECTIONS_ENDPOINT,
        {
            "search": "inspection",
            "skip": 0,
            "limit": 5
        }
    )
    results["search_with_pagination"] = result
    
    # Test 6: All filters combined
    result = test_api_call(
        "All filters combined",
        INSPECTIONS_ENDPOINT,
        {
            "search": "pressure",
            "equipment_tag": "CV",
            "date_field": "actual_start_date",
            "from_date": past_date.isoformat(),
            "status": "InProgress",
            "skip": 0,
            "limit": 10
        }
    )
    results["all_filters_combined"] = result
    
    return results

def analyze_results(results):
    """Analyze the test results"""
    print("\n" + "=" * 60)
    print("📊 SEARCH AND DATE FILTER ANALYSIS")
    print("=" * 60)
    
    successful_tests = sum(1 for result in results.values() if result.get("success", False))
    total_tests = len(results)
    
    print(f"📈 Tests Passed: {successful_tests}/{total_tests}")
    print(f"📈 Success Rate: {(successful_tests/total_tests)*100:.1f}%")
    
    # Check if search is working
    search_working = False
    for key, result in results.items():
        if key.startswith("search_") and result.get("success") and result.get("count", 0) > 0:
            search_working = True
            break
    
    if search_working:
        print("✅ SEARCH FUNCTIONALITY: Working! Search terms are returning results.")
    else:
        print("⚠️ SEARCH FUNCTIONALITY: May not be working or no matching data found.")
    
    # Check if date filtering is working
    date_filtering_working = False
    for key, result in results.items():
        if key.startswith("date_filter_") and result.get("success"):
            date_filtering_working = True
            break
    
    if date_filtering_working:
        print("✅ DATE FILTERING: Working! Date filters are being accepted.")
    else:
        print("⚠️ DATE FILTERING: May not be working properly.")
    
    # Show specific recommendations
    print("\n🔧 RECOMMENDATIONS:")
    
    if not search_working:
        print("• Add test data with searchable titles/descriptions containing common terms")
        print("• Verify search logic in backend is case-insensitive")
    
    if not date_filtering_working:
        print("• Check if inspection records have proper date values")
        print("• Verify date field validation in backend")
    
    # Show data samples for debugging
    print("\n📋 SAMPLE DATA (for debugging):")
    for key, result in list(results.items())[:3]:
        if result.get("success") and result.get("count", 0) > 0:
            print(f"• {key}: Found {result['count']} records")

if __name__ == "__main__":
    print("🚀 Starting Search and Date Filter Tests...")
    print(f"⏰ Test time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = test_search_and_date_filters()
    analyze_results(results)
    
    print("\n✨ Test completed!")
    print("💡 Next steps: Test these improvements in the frontend UI")
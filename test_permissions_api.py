#!/usr/bin/env python3
"""
Test script to verify the permissions bulk-usage API endpoint
"""

import requests
import json

def test_permissions_api():
    # Test without authentication first
    url = "http://localhost:8000/api/v1/admin/permissions/bulk-usage"
    
    print("🧪 Testing permissions bulk-usage API endpoint...")
    print(f"📡 URL: {url}")
    
    try:
        # Test without token (should return 401)
        response = requests.get(url)
        print(f"📊 Response without token: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Endpoint requires authentication (expected)")
        else:
            print(f"⚠️ Unexpected response: {response.status_code}")
            
        # Test with admin token
        token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiIsImV4cCI6MTc2MzUzNzAzMH0.VlPT1O2P4YLjDSNFwZCGzM7WdUBxgJwU0FJvg_LztLk"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, headers=headers)
        print(f"📊 Response with token: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API call successful!")
            print(f"📋 Response data keys: {list(data.keys())}")
            
            if 'usage_stats' in data:
                usage_stats = data['usage_stats']  
                print(f"📊 Usage stats count: {len(usage_stats)}")
                
                # Show sample data
                if usage_stats:
                    sample_key = list(usage_stats.keys())[0]
                    print(f"📝 Sample usage stat for permission {sample_key}:")
                    print(json.dumps(usage_stats[sample_key], indent=2))
                else:
                    print("⚠️ No usage stats found")
            else:
                print("❌ 'usage_stats' key not found in response")
                print(f"📄 Full response: {json.dumps(data, indent=2)}")
                
        else:
            print(f"❌ API call failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"📄 Error response: {json.dumps(error_data, indent=2)}")
            except:
                print(f"📄 Raw error response: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - is the backend running on port 8000?")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    test_permissions_api()
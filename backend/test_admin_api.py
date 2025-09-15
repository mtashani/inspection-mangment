#!/usr/bin/env python3
"""
Test admin API endpoint directly
"""

import sys
from pathlib import Path
import requests
import json

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

from sqlmodel import Session
from app.database import engine
from app.domains.inspector.models.inspector import Inspector
from app.domains.auth.services.auth_service import AuthService
from sqlmodel import select

def test_admin_api():
    """Test admin API endpoint directly"""
    print("🧪 Testing Admin API Endpoint")
    print("=" * 50)
    
    # Get admin user and create token
    with Session(engine) as session:
        admin_user = session.exec(
            select(Inspector).where(Inspector.username == "admin")
        ).first()
        
        if not admin_user:
            print("❌ Admin user not found!")
            return
            
        # Get roles and permissions
        roles, permissions = AuthService.get_inspector_roles_and_permissions(session, admin_user.id)
        
        # Create access token
        token = AuthService.create_access_token(
            inspector_id=admin_user.id,
            roles=roles,
            permissions=permissions
        )
        
        print(f"🔑 Created token for user {admin_user.username}")
        print(f"👤 Roles: {roles}")
        print(f"🔐 Has admin:manage: {'admin:manage' in permissions}")
    
    # Test API endpoint
    base_url = "http://127.0.0.1:8000/api/v1"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print(f"\n🌐 Testing API endpoint: {base_url}/admin/dashboard")
    
    try:
        response = requests.get(f"{base_url}/admin/dashboard", headers=headers, timeout=10)
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📊 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ API call successful!")
            data = response.json()
            print(f"📄 Response data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        else:
            print(f"❌ API call failed: {response.status_code}")
            print(f"📄 Response text: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - is the backend server running?")
        print("💡 Start the backend with: uvicorn app.main:app --reload --host 127.0.0.1 --port 8000")
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_admin_api()
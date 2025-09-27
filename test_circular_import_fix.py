"""
Test script to verify that the circular import issue is fixed
"""
import sys
import os

# Add the backend directory to the Python path
backend_dir = r"c:\Users\tashan\Documents\code\inspection mangment\backend"
sys.path.insert(0, backend_dir)

def test_imports():
    """Test that imports work correctly without circular import errors"""
    
    try:
        # Test importing the main application
        print("🔧 Testing main application import...")
        from app.main import app
        print("✅ Main application imported successfully")
        
        # Test importing models
        print("🔧 Testing model imports...")
        from app.domains.inspector.models.inspector import Inspector
        from app.domains.notifications.models.notification import Notification, NotificationPreference
        print("✅ Model imports successful")
        
        # Test importing API modules
        print("🔧 Testing API imports...")
        from app.domains.inspector.api.inspector import router
        print("✅ API imports successful")
        
        return True
        
    except Exception as e:
        print(f"❌ Import error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🧪 Testing circular import fix...")
    
    success = test_imports()
    
    if success:
        print("\n🎉 All imports successful! The circular import issue has been fixed.")
        print("   You should now be able to start the FastAPI server without errors.")
    else:
        print("\n💥 Import test failed. Please check the error messages above.")
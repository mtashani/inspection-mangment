#!/usr/bin/env python3
"""
Backend Server Startup Script
Helps start the FastAPI backend server
"""

import os
import sys
import subprocess
from pathlib import Path

def find_backend_directory():
    """Find the backend directory"""
    current_dir = Path(__file__).parent
    backend_dir = current_dir / "backend"
    
    if backend_dir.exists():
        return backend_dir
    
    # Try common locations
    possible_locations = [
        current_dir / "backend",
        current_dir.parent / "backend",
        Path("C:/Users/tashan/Documents/code/inspection mangment/backend")
    ]
    
    for location in possible_locations:
        if location.exists():
            return location
    
    return None

def check_requirements(backend_dir):
    """Check if required files exist"""
    main_file = backend_dir / "app" / "main.py"
    if not main_file.exists():
        print(f"❌ Main app file not found: {main_file}")
        return False
    
    print(f"✅ Backend directory found: {backend_dir}")
    print(f"✅ Main app file found: {main_file}")
    return True

def start_backend_server(backend_dir):
    """Start the backend server"""
    print(f"🚀 Starting backend server from: {backend_dir}")
    print("-" * 50)
    
    os.chdir(backend_dir)
    
    # Try different commands
    commands = [
        ["python", "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"],
        ["uvicorn", "app.main:app", "--reload", "--port", "8000"],
        ["python", "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
    ]
    
    for i, cmd in enumerate(commands, 1):
        print(f"🔄 Trying command {i}: {' '.join(cmd)}")
        try:
            # Start the server
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            # Wait a bit to see if it starts successfully
            import time
            time.sleep(2)
            
            if process.poll() is None:  # Process is still running
                print(f"✅ Backend server started successfully!")
                print(f"🌐 Server should be running at: http://localhost:8000")
                print(f"📋 API docs available at: http://localhost:8000/docs")
                print(f"🔍 Health check: http://localhost:8000/health")
                print("\\n⚠️ Keep this terminal window open to keep the server running!")
                print("⚠️ Press Ctrl+C to stop the server")
                
                # Keep the process running and show output
                try:
                    for line in process.stdout:
                        print(line, end='')
                except KeyboardInterrupt:
                    print("\\n🛑 Stopping server...")
                    process.terminate()
                    break
                    
                return True
            else:
                stdout, stderr = process.communicate()
                print(f"❌ Command failed:")
                if stderr:
                    print(f"Error: {stderr}")
                if stdout:
                    print(f"Output: {stdout}")
                    
        except FileNotFoundError:
            print(f"❌ Command not found: {cmd[0]}")
        except Exception as e:
            print(f"❌ Error running command: {e}")
    
    return False

def main():
    """Main function"""
    print("🚀 Backend Server Startup Helper")
    print("=" * 60)
    
    # Find backend directory
    backend_dir = find_backend_directory()
    if not backend_dir:
        print("❌ Backend directory not found!")
        print("💡 Make sure you're running this from the project root directory.")
        return False
    
    # Check requirements
    if not check_requirements(backend_dir):
        print("❌ Backend setup incomplete!")
        return False
    
    # Start server
    print("\\n🔧 Starting Backend Server...")
    print("=" * 40)
    success = start_backend_server(backend_dir)
    
    if not success:
        print("\\n❌ Failed to start backend server!")
        print("💡 Try running manually:")
        print(f'   cd "{backend_dir}"')
        print("   python -m uvicorn app.main:app --reload --port 8000")
    
    return success

if __name__ == "__main__":
    main()
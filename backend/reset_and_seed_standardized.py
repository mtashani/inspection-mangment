#!/usr/bin/env python3
"""
Database Reset and Standardized RBAC Setup
This script completely resets the database and sets up the standardized RBAC system
"""

import sys
import os
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

from seed_standardized_permissions import main as seed_main


def main():
    """Main function to reset and seed database with standardized RBAC"""
    print("🔄 Starting Database Reset and Standardized RBAC Setup...")
    print("=" * 70)
    
    try:
        # Run the standardized seeding
        seed_main()
        
        print("\n" + "🎉" * 20)
        print("✅ DATABASE RESET AND STANDARDIZED RBAC SETUP COMPLETED!")
        print("🎉" * 20)
        print("\n📋 What was accomplished:")
        print("   ✅ Deleted existing SQLite database")
        print("   ✅ Created fresh database with all tables")
        print("   ✅ Seeded 23 standardized permissions")
        print("   ✅ Created standardized roles")
        print("   ✅ Assigned permissions to roles")
        print("   ✅ Created super admin user")
        print("   ✅ Updated Permission model with new fields")
        print("\n🔐 Ready to use with:")
        print("   Username: admin")
        print("   Password: admin123")
        print("=" * 70)
        
    except Exception as e:
        print(f"❌ Error during reset and setup: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
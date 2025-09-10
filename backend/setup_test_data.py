#!/usr/bin/env python3
"""
Setup test data for inspection notifications
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from sqlmodel import Session, select
from app.database import create_db_and_tables, engine
from app.domains.equipment.models.equipment import Equipment
from app.domains.inspector.models.inspector import Inspector
from app.domains.inspection.models.enums import RefineryDepartment

def setup_test_equipment():
    """Create test equipment if it doesn't exist"""
    print("🔧 Setting up test equipment...")
    
    # Create database tables if they don't exist
    create_db_and_tables()
    
    with Session(engine) as session:
        # Check if test equipment exists
        existing_equipment = session.exec(select(Equipment).where(Equipment.tag == "TEST-001")).first()
        
        if existing_equipment:
            print(f"✅ Test equipment already exists: {existing_equipment.tag}")
            return existing_equipment
        
        # Create test equipment
        test_equipment = Equipment(
            tag="TEST-001",
            description="Test Equipment for Notification Testing",
            equipment_type="Pressure Vessel",
            location="Test Area",
            manufacturer="Test Manufacturer",
            model="TEST-MODEL-001",
            serial_number="TEST-SN-001",
            year_manufactured=2020,
            active=True
        )
        
        session.add(test_equipment)
        session.commit()
        session.refresh(test_equipment)
        
        print(f"✅ Created test equipment: {test_equipment.tag} - {test_equipment.description}")
        return test_equipment

def setup_test_inspector():
    """Create test inspector if it doesn't exist"""
    print("👤 Setting up test inspector...")
    
    with Session(engine) as session:
        # Check if test inspector exists
        existing_inspector = session.exec(select(Inspector).where(Inspector.employee_id == "TEST-001")).first()
        
        if existing_inspector:
            print(f"✅ Test inspector already exists: {existing_inspector.employee_id}")
            return existing_inspector
        
        # Create test inspector
        test_inspector = Inspector(
            first_name="Test",
            last_name="Inspector",
            employee_id="TEST-001",
            email="test.inspector@example.com",
            username="test_inspector",
            password_hash="$2b$12$test_hash",  # This is a dummy hash
            can_login=True,
            active=True
        )
        
        session.add(test_inspector)
        session.commit()
        session.refresh(test_inspector)
        
        print(f"✅ Created test inspector: {test_inspector.employee_id}")
        return test_inspector

def main():
    """Main setup function"""
    print("🚀 Setting up test data for inspection notifications")
    print("=" * 50)
    
    try:
        equipment = setup_test_equipment()
        inspector = setup_test_inspector()
        
        print("\n✨ Test data setup completed!")
        print(f"   Equipment: {equipment.tag}")
        print(f"   Inspector: {inspector.employee_id}")
        print("\nYou can now run: python test_inspection_notifications.py")
        
    except Exception as e:
        print(f"❌ Error setting up test data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
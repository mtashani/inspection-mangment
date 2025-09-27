"""
Quick script to check what inspector data already exists
Run this to see why the 400 error is happening
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from app.database import get_session
from app.domains.inspector.models.inspector import Inspector

def check_existing_data():
    # The data from your error log
    employee_id = "231215"
    national_id = "2457650054" 
    email = "wegewis530@inupup.com"
    
    print("🔍 Checking existing inspector data...")
    print("=" * 50)
    
    # Get database session
    with next(get_session()) as db:
        
        # Check employee ID
        existing_employee = db.exec(
            select(Inspector).where(Inspector.employee_id == employee_id)
        ).first()
        
        if existing_employee:
            print(f"❌ Employee ID '{employee_id}' ALREADY EXISTS:")
            print(f"   Inspector ID: {existing_employee.id}")
            print(f"   Name: {existing_employee.first_name} {existing_employee.last_name}")
            print(f"   Email: {existing_employee.email}")
            print(f"   Active: {existing_employee.active}")
        else:
            print(f"✅ Employee ID '{employee_id}' is available")
        
        print("-" * 50)
        
        # Check national ID
        existing_national = db.exec(
            select(Inspector).where(Inspector.national_id == national_id)
        ).first()
        
        if existing_national:
            print(f"❌ National ID '{national_id}' ALREADY EXISTS:")
            print(f"   Inspector ID: {existing_national.id}")
            print(f"   Name: {existing_national.first_name} {existing_national.last_name}")
            print(f"   Employee ID: {existing_national.employee_id}")
        else:
            print(f"✅ National ID '{national_id}' is available")
        
        print("-" * 50)
        
        # Check email
        existing_email = db.exec(
            select(Inspector).where(Inspector.email == email)
        ).first()
        
        if existing_email:
            print(f"❌ Email '{email}' ALREADY EXISTS:")
            print(f"   Inspector ID: {existing_email.id}")
            print(f"   Name: {existing_email.first_name} {existing_email.last_name}")
            print(f"   Employee ID: {existing_email.employee_id}")
        else:
            print(f"✅ Email '{email}' is available")
        
        print("=" * 50)
        
        # Show all existing inspectors for reference
        all_inspectors = db.exec(select(Inspector)).all()
        print(f"\n📋 All existing inspectors ({len(all_inspectors)} total):")
        for inspector in all_inspectors:
            print(f"   ID: {inspector.id} | Employee ID: {inspector.employee_id} | "
                  f"Name: {inspector.first_name} {inspector.last_name} | "
                  f"Email: {inspector.email} | Active: {inspector.active}")

if __name__ == "__main__":
    check_existing_data()
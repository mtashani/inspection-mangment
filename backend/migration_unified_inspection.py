#!/usr/bin/env python3
"""
Migration script for unified inspection model
This script updates the database to support the unified inspection model approach
"""

import os
import sys
from datetime import date, datetime
from sqlmodel import Session, select
from sqlalchemy import text

# Add app directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, get_session
from app.domains.inspection.models.inspection import Inspection
from app.domains.maintenance.models.inspection_plan import InspectionPlan

def migrate_inspection_plans_to_inspections():
    """
    Migrate existing InspectionPlan records to Inspection model
    """
    print("🔄 Starting migration of InspectionPlan to unified Inspection model...")
    
    with Session(engine) as session:
        try:
            # Get all existing inspection plans
            plans = session.exec(select(InspectionPlan)).all()
            print(f"📋 Found {len(plans)} inspection plans to migrate")
            
            migrated_count = 0
            skipped_count = 0
            
            for plan in plans:
                try:
                    # Check if there's already an inspection linked to this plan
                    existing_inspection = session.exec(
                        select(Inspection).where(Inspection.inspection_plan_id == plan.id)
                    ).first()
                    
                    if existing_inspection:
                        print(f"⚠️  Skipping plan {plan.id} - already has linked inspection {existing_inspection.id}")
                        skipped_count += 1
                        continue
                    
                    # Create a new inspection from the plan
                    # Generate inspection number based on plan
                    inspection_number = f"INS-{plan.id:05d}-PLAN"
                    
                    # Check if this inspection number already exists
                    existing_with_number = session.exec(
                        select(Inspection).where(Inspection.inspection_number == inspection_number)
                    ).first()
                    
                    if existing_with_number:
                        inspection_number = f"INS-{plan.id:05d}-PLAN-{datetime.utcnow().strftime('%H%M%S')}"
                    
                    # Create inspection record
                    inspection = Inspection(
                        inspection_number=inspection_number,
                        title=plan.description or f"Inspection for {plan.equipment_tag}",
                        description=plan.description,
                        start_date=plan.planned_start_date or date.today(),
                        end_date=plan.planned_end_date,
                        equipment_id=1,  # Default equipment - should be updated manually
                        maintenance_event_id=plan.maintenance_event_id,
                        maintenance_sub_event_id=plan.maintenance_sub_event_id,
                        requesting_department=plan.requester,
                        status="Planned",  # Planned status for migrated plans
                        is_planned=True,
                        planned_start_date=plan.planned_start_date,
                        planned_end_date=plan.planned_end_date,
                        created_at=plan.created_at,
                        updated_at=plan.updated_at
                    )
                    
                    session.add(inspection)
                    migrated_count += 1
                    print(f"✅ Migrated plan {plan.id} to inspection {inspection_number}")
                    
                except Exception as e:
                    print(f"❌ Error migrating plan {plan.id}: {str(e)}")
                    continue
            
            # Commit all changes
            session.commit()
            print(f"\n🎉 Migration completed!")
            print(f"📊 Statistics:")
            print(f"   - Migrated: {migrated_count} plans")
            print(f"   - Skipped: {skipped_count} plans")
            print(f"   - Total processed: {len(plans)} plans")
            
        except Exception as e:
            session.rollback()
            print(f"❌ Migration failed: {str(e)}")
            raise

def add_unified_model_columns():
    """
    Add new columns to inspections table for unified model
    """
    print("🔧 Adding unified model columns to inspections table...")
    
    columns_to_add = [
        "ALTER TABLE inspections ADD COLUMN is_planned BOOLEAN DEFAULT FALSE",
        "ALTER TABLE inspections ADD COLUMN unplanned_reason TEXT",
        "ALTER TABLE inspections ADD COLUMN planned_start_date DATE",
        "ALTER TABLE inspections ADD COLUMN planned_end_date DATE",
        "ALTER TABLE inspections ADD COLUMN actual_start_date DATE",
        "ALTER TABLE inspections ADD COLUMN actual_end_date DATE"
    ]
    
    with Session(engine) as session:
        for sql in columns_to_add:
            try:
                session.exec(text(sql))
                print(f"✅ Executed: {sql}")
            except Exception as e:
                if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                    print(f"⚠️  Column already exists, skipping: {sql}")
                else:
                    print(f"❌ Error: {sql} - {str(e)}")
                    
        session.commit()
        print("🎉 Unified model columns added successfully!")

def update_existing_inspections():
    """
    Update existing inspections to use unified model approach
    """
    print("🔄 Updating existing inspections for unified model...")
    
    with Session(engine) as session:
        try:
            # Get all existing inspections
            inspections = session.exec(select(Inspection)).all()
            print(f"📋 Found {len(inspections)} inspections to update")
            
            updated_count = 0
            
            for inspection in inspections:
                try:
                    # Default logic for existing inspections
                    if inspection.is_planned is None:
                        # If linked to inspection_plan, mark as planned
                        if hasattr(inspection, 'inspection_plan_id') and inspection.inspection_plan_id:
                            inspection.is_planned = True
                            inspection.planned_start_date = inspection.start_date
                            inspection.planned_end_date = inspection.end_date
                        else:
                            # Otherwise, assume unplanned
                            inspection.is_planned = False
                            inspection.actual_start_date = inspection.start_date
                            inspection.actual_end_date = inspection.end_date
                            inspection.unplanned_reason = "Legacy inspection - reason not specified"
                        
                        updated_count += 1
                        print(f"✅ Updated inspection {inspection.inspection_number}")
                        
                except Exception as e:
                    print(f"❌ Error updating inspection {inspection.id}: {str(e)}")
                    continue
            
            session.commit()
            print(f"\n🎉 Updated {updated_count} inspections for unified model!")
            
        except Exception as e:
            session.rollback()
            print(f"❌ Update failed: {str(e)}")
            raise

if __name__ == "__main__":
    print("🚀 Starting unified inspection model migration...")
    print("=" * 60)
    
    try:
        # Step 1: Add new columns
        add_unified_model_columns()
        print()
        
        # Step 2: Update existing inspections
        update_existing_inspections()
        print()
        
        # Step 3: Migrate inspection plans (optional)
        migrate_inspection_plans_to_inspections()
        print()
        
        print("=" * 60)
        print("✅ Migration completed successfully!")
        print("\n📝 Next steps:")
        print("1. Test the API endpoints with the unified model")
        print("2. Update frontend-v2 to use the unified API")
        print("3. Consider deprecating InspectionPlan model after verification")
        
    except Exception as e:
        print(f"\n💥 Migration failed: {str(e)}")
        sys.exit(1)
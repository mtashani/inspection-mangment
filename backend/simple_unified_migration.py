#!/usr/bin/env python3
"""
Simple migration for unified inspection model
"""

import os
import sys
from sqlalchemy import text

# Add app directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine

def update_inspections_for_unified_model():
    """
    Update existing inspections for unified model
    """
    print("🔄 Updating existing inspections for unified model...")
    
    with engine.connect() as conn:
        try:
            # Update existing inspections to set default values for unified model
            update_sql = """
            UPDATE inspections 
            SET 
                is_planned = CASE 
                    WHEN status = 'Planned' THEN TRUE 
                    ELSE FALSE 
                END,
                unplanned_reason = CASE 
                    WHEN status != 'Planned' AND unplanned_reason IS NULL 
                    THEN 'Legacy inspection - reason not specified'
                    ELSE unplanned_reason
                END,
                planned_start_date = CASE 
                    WHEN status = 'Planned' THEN start_date 
                    ELSE planned_start_date
                END,
                planned_end_date = CASE 
                    WHEN status = 'Planned' THEN end_date 
                    ELSE planned_end_date
                END,
                actual_start_date = CASE 
                    WHEN status != 'Planned' THEN start_date 
                    ELSE actual_start_date
                END,
                actual_end_date = CASE 
                    WHEN status != 'Planned' THEN end_date 
                    ELSE actual_end_date
                END
            WHERE is_planned IS NULL OR is_planned = FALSE
            """
            
            result = conn.execute(text(update_sql))
            conn.commit()
            
            print(f"✅ Updated {result.rowcount} inspections for unified model")
            
            # Get count of planned vs unplanned inspections
            count_sql = """
            SELECT 
                is_planned,
                COUNT(*) as count,
                status
            FROM inspections 
            GROUP BY is_planned, status
            ORDER BY is_planned, status
            """
            
            result = conn.execute(text(count_sql))
            rows = result.fetchall()
            
            print("\n📊 Inspection statistics after migration:")
            for row in rows:
                is_planned = "Planned" if row[0] else "Unplanned"
                print(f"   - {is_planned} + {row[2]}: {row[1]} inspections")
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            raise

if __name__ == "__main__":
    print("🚀 Starting simple unified inspection model migration...")
    print("=" * 60)
    
    try:
        update_inspections_for_unified_model()
        
        print("=" * 60)
        print("✅ Migration completed successfully!")
        print("\n📝 Next steps:")
        print("1. Test the unified inspection API endpoints")
        print("2. Update frontend-v2 to use the unified model")
        print("3. Verify planned/unplanned inspection creation works")
        
    except Exception as e:
        print(f"\n💥 Migration failed: {str(e)}")
        sys.exit(1)
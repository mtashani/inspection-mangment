from datetime import datetime
from sqlmodel import Session, select
from app.database import engine
from app.models import Equipment, Inspector, Inspection, DailyReport, InspectionStatus
from typing import List, Dict

def verify_and_fix_data():
    with Session(engine) as session:
        print("Starting data verification and fix process...")
        
        # 1. Get all inspections
        inspections = session.exec(select(Inspection)).all()
        print(f"\nFound {len(inspections)} inspections")
        
        fixes_made = 0
        
        for inspection in inspections:
            original_status = inspection.status
            needs_update = False
            
            # 2. Normalize status to uppercase
            if inspection.status.lower() in ['in progress', 'in_progress']:
                inspection.status = InspectionStatus.IN_PROGRESS
                needs_update = True
            elif inspection.status.lower() in ['completed', 'complete']:
                inspection.status = InspectionStatus.COMPLETED
                needs_update = True
            
            # 3. Check daily reports consistency
            daily_reports = session.exec(
                select(DailyReport).where(DailyReport.inspection_id == inspection.id)
            ).all()
            
            # If there are no daily reports and status is COMPLETED, change to IN_PROGRESS
            if not daily_reports and inspection.status == InspectionStatus.COMPLETED:
                inspection.status = InspectionStatus.IN_PROGRESS
                needs_update = True
                print(f"Inspection {inspection.id}: Changed status to IN_PROGRESS (no daily reports)")
            
            if needs_update:
                fixes_made += 1
                print(f"Inspection {inspection.id}: Status changed from '{original_status}' to '{inspection.status}'")
                session.add(inspection)
        
        if fixes_made > 0:
            print(f"\nApplying {fixes_made} fixes...")
            session.commit()
            print("Changes committed successfully")
        else:
            print("\nNo fixes needed")
        
        # 4. Final verification
        print("\nVerifying final state...")
        final_stats = get_statistics(session)
        print("\nFinal Statistics:")
        print(f"Total Inspections: {final_stats['total']}")
        print(f"IN_PROGRESS: {final_stats['in_progress']}")
        print(f"COMPLETED: {final_stats['completed']}")
        print(f"With Daily Reports: {final_stats['with_reports']}")
        print(f"Without Daily Reports: {final_stats['without_reports']}")

def get_statistics(session: Session) -> Dict[str, int]:
    stats = {
        'total': 0,
        'in_progress': 0,
        'completed': 0,
        'with_reports': 0,
        'without_reports': 0
    }
    
    inspections = session.exec(select(Inspection)).all()
    stats['total'] = len(inspections)
    
    for inspection in inspections:
        if inspection.status == InspectionStatus.IN_PROGRESS:
            stats['in_progress'] += 1
        elif inspection.status == InspectionStatus.COMPLETED:
            stats['completed'] += 1
            
        daily_reports = session.exec(
            select(DailyReport).where(DailyReport.inspection_id == inspection.id)
        ).all()
        
        if daily_reports:
            stats['with_reports'] += 1
        else:
            stats['without_reports'] += 1
    
    return stats

if __name__ == "__main__":
    verify_and_fix_data()
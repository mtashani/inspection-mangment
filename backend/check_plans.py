#!/usr/bin/env python3
from app.database import engine
from sqlmodel import Session, select, text

with Session(engine) as session:
    # Get event ID
    result = session.exec(text("SELECT id FROM maintenance_events WHERE event_number = 'MAINT-2025-001'")).first()
    if result:
        event_id = result if isinstance(result, int) else result[0]
        print(f'Event ID: {event_id}')
        
        # Check inspection plans table
        plans_result = session.exec(text('SELECT COUNT(*) FROM inspection_plans')).first()
        total_plans = plans_result[0] if plans_result and isinstance(plans_result, tuple) else plans_result
        print(f'Total inspection plans: {total_plans}')
        
        # Check plans for this event  
        event_plans_query = f"""
        SELECT equipment_tag, status, maintenance_event_id, maintenance_sub_event_id 
        FROM inspection_plans 
        WHERE maintenance_event_id = {event_id} 
           OR maintenance_sub_event_id IN (
               SELECT id FROM maintenance_sub_events WHERE parent_event_id = {event_id}
           )
        """
        event_plans = session.exec(text(event_plans_query)).all()
        print(f'Plans for this event: {len(event_plans)}')
        for plan in event_plans:
            print(f'  - {plan[0]}: {plan[1]} (event_id: {plan[2]}, sub_event_id: {plan[3]})')
            
        # Check inspections
        inspections_result = session.exec(text(f'SELECT COUNT(*) FROM inspections WHERE maintenance_event_id = {event_id}')).first()
        total_inspections = inspections_result[0] if inspections_result and isinstance(inspections_result, tuple) else inspections_result  
        print(f'Total inspections for event: {total_inspections}')
        
    else:
        print('Event not found')
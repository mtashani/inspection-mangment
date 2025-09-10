#!/usr/bin/env python3

from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

# Test the InspectionResponse model with null values
class InspectionResponse(BaseModel):
    id: int
    inspection_number: str
    title: str
    description: Optional[str] = None
    status: str
    equipment_id: int
    requesting_department: str
    final_report: Optional[str] = None
    work_order: Optional[str] = None
    permit_number: Optional[str] = None
    # Unified model fields
    is_planned: bool
    unplanned_reason: Optional[str] = None
    maintenance_event_id: Optional[int] = None
    maintenance_sub_event_id: Optional[int] = None
    # All date fields are optional to support both planned and unplanned inspections
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

def test_unplanned_inspection_response():
    """Test creating response for unplanned inspection (no planned dates)"""
    try:
        response = InspectionResponse(
            id=104,
            inspection_number='INS-U-250907-1160',
            title='Emergency Pump Inspection',
            description='Urgent inspection due to equipment failure',
            status='InProgress',
            equipment_id=1,
            requesting_department='Inspection',
            final_report=None,
            work_order=None,
            permit_number=None,
            is_planned=False,
            unplanned_reason='equipment_failure',
            maintenance_event_id=4,
            maintenance_sub_event_id=None,
            planned_start_date=None,  # Null for unplanned
            planned_end_date=None,    # Null for unplanned
            actual_start_date=date.today(),
            actual_end_date=None,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        print("✅ Unplanned inspection response model works!")
        print(f"Response dict: {response.dict()}")
        return True
        
    except Exception as e:
        print(f"❌ Error creating unplanned inspection response: {e}")
        return False

def test_planned_inspection_response():
    """Test creating response for planned inspection (has planned dates)"""
    try:
        response = InspectionResponse(
            id=105,
            inspection_number='INS-P-250907-1200',
            title='Scheduled Maintenance Inspection',
            description='Planned inspection for routine maintenance',
            status='Planned',
            equipment_id=2,
            requesting_department='Maintenance',
            final_report=None,
            work_order='WO-2025-001',
            permit_number=None,
            is_planned=True,
            unplanned_reason=None,
            maintenance_event_id=4,
            maintenance_sub_event_id=None,
            planned_start_date=date.today(),
            planned_end_date=date.today(),
            actual_start_date=None,  # Null until started
            actual_end_date=None,    # Null until completed
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        print("✅ Planned inspection response model works!")
        print(f"Response dict: {response.dict()}")
        return True
        
    except Exception as e:
        print(f"❌ Error creating planned inspection response: {e}")
        return False

if __name__ == "__main__":
    print("Testing InspectionResponse models...")
    print()
    
    success1 = test_unplanned_inspection_response()
    print()
    success2 = test_planned_inspection_response()
    
    if success1 and success2:
        print("\n🎉 All tests passed! The response model should work correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the model definition.")
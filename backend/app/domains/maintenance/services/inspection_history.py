from typing import List, Optional
from typing import List, Optional
from sqlmodel import Session, select
from sqlalchemy import desc
from app.domains.inspection.models.inspection import Inspection
from app.domains.equipment.models.equipment import Equipment


class InspectionHistoryService:
    """Service for managing inspection history and first-time detection"""
    
    @staticmethod
    def is_first_time_inspection(equipment_tag: str, session: Session) -> bool:
        """
        Determine if this is the first inspection for equipment
        
        Args:
            equipment_tag: The equipment tag to check
            session: Database session
            
        Returns:
            True if this is the first inspection for the equipment, False otherwise
        """
        # Query for existing inspections for this equipment
        statement = select(Inspection).join(Equipment).where(Equipment.tag == equipment_tag)
        existing_inspections = session.exec(statement).all()
        
        return len(existing_inspections) == 0
    
    @staticmethod
    def get_equipment_inspection_count(equipment_tag: str, session: Session) -> int:
        """
        Get total number of inspections for equipment
        
        Args:
            equipment_tag: The equipment tag to check
            session: Database session
            
        Returns:
            Total number of inspections for the equipment
        """
        statement = select(Inspection).join(Equipment).where(Equipment.tag == equipment_tag)
        inspections = session.exec(statement).all()
        
        return len(inspections)
    
    @staticmethod
    def get_equipment_inspection_history(equipment_tag: str, session: Session) -> List[Inspection]:
        """
        Get complete inspection history for equipment
        
        Args:
            equipment_tag: The equipment tag to check
            session: Database session
            
        Returns:
            List of all inspections for the equipment, ordered by start date
        """
        statement = (
            select(Inspection)
            .join(Equipment)
            .where(Equipment.tag == equipment_tag)
            .order_by(desc(Inspection.actual_start_date))
        )
        
        return list(session.exec(statement).all())
    
    @staticmethod
    def get_latest_inspection(equipment_tag: str, session: Session) -> Optional[Inspection]:
        """
        Get the most recent inspection for equipment
        
        Args:
            equipment_tag: The equipment tag to check
            session: Database session
            
        Returns:
            The most recent inspection for the equipment, or None if no inspections exist
        """
        statement = (
            select(Inspection)
            .join(Equipment)
            .where(Equipment.tag == equipment_tag)
            .order_by(desc(Inspection.actual_start_date))
            .limit(1)
        )
        
        result = session.exec(statement).first()
        return result
    
    @staticmethod
    def has_active_inspection(equipment_tag: str, session: Session) -> bool:
        """
        Check if equipment currently has an active inspection
        
        Args:
            equipment_tag: The equipment tag to check
            session: Database session
            
        Returns:
            True if equipment has an inspection with status 'InProgress', False otherwise
        """
        from app.domains.inspection.models.enums import InspectionStatus
        
        statement = (
            select(Inspection)
            .join(Equipment)
            .where(
                Equipment.tag == equipment_tag,
                Inspection.status == InspectionStatus.InProgress
            )
        )
        
        active_inspection = session.exec(statement).first()
        return active_inspection is not None
    
    @staticmethod
    def get_first_time_inspections_count_for_event(
        maintenance_event_id: Optional[int] = None,
        maintenance_sub_event_id: Optional[int] = None,
        session: Session = None
    ) -> int:
        """
        Get count of first-time inspections for a maintenance event or sub-event
        
        Args:
            maintenance_event_id: ID of the maintenance event
            maintenance_sub_event_id: ID of the maintenance sub-event
            session: Database session
            
        Returns:
            Number of first-time inspections in the event/sub-event
        """
        if not session:
            raise ValueError("Database session is required")
        
        # Get all inspections for the event/sub-event
        if maintenance_event_id:
            statement = select(Inspection).where(
                Inspection.maintenance_event_id == maintenance_event_id
            )
        elif maintenance_sub_event_id:
            statement = select(Inspection).where(
                Inspection.maintenance_sub_event_id == maintenance_sub_event_id
            )
        else:
            raise ValueError("Either maintenance_event_id or maintenance_sub_event_id must be provided")
        
        inspections = session.exec(statement).all()
        
        # Count how many are first-time inspections
        first_time_count = 0
        for inspection in inspections:
            if inspection.equipment:
                # Check if this inspection is the first for this equipment
                equipment_inspections = InspectionHistoryService.get_equipment_inspection_history(
                    inspection.equipment.tag, session
                )
                # If this inspection is the only one or the earliest one, it's first-time
                if len(equipment_inspections) == 1 or equipment_inspections[-1].id == inspection.id:
                    first_time_count += 1
        
        return first_time_count
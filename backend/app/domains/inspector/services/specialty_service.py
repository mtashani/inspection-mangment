"""
Inspector Specialty Service
سرویس مدیریت تخصص‌های بازرسین
"""

from typing import Dict, List, Optional
from datetime import datetime
from sqlmodel import Session, select, delete
from fastapi import HTTPException, Depends
from app.database import get_session
from app.domains.inspector.models.specialty import InspectorSpecialty, SpecialtyCodes
from app.domains.inspector.models.inspector import Inspector

class SpecialtyService:
    @staticmethod
    def get_inspector_specialties(inspector_id: int, db: Session) -> Dict[str, bool]:
        """Get all specialties for an inspector"""
        specialties = db.exec(
            select(InspectorSpecialty)
            .where(InspectorSpecialty.inspector_id == inspector_id)
            .where(InspectorSpecialty.granted == True)
        ).all()
        
        # Initialize all specialties as False
        result = {code: False for code, _, _ in SpecialtyCodes.ALL_SPECIALTIES}
        
        # Set granted specialties to True
        for specialty in specialties:
            result[specialty.specialty_code] = True
            
        return result
    
    @staticmethod
    def update_inspector_specialties(
        inspector_id: int, 
        specialties: Dict[str, bool], 
        granted_by: int,
        db: Session
    ) -> bool:
        """Update inspector specialties"""
        try:
            # حذف specialties قدیمی
            db.exec(
                delete(InspectorSpecialty)
                .where(InspectorSpecialty.inspector_id == inspector_id)
            )
            
            # اضافه کردن specialties جدید
            for specialty_code, granted in specialties.items():
                if granted and SpecialtyCodes.is_valid_code(specialty_code):
                    new_specialty = InspectorSpecialty(
                        inspector_id=inspector_id,
                        specialty_code=specialty_code,
                        granted=True,
                        granted_by=granted_by
                    )
                    db.add(new_specialty)
            
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=400, 
                detail=f"Error updating specialties: {str(e)}"
            )
    
    @staticmethod
    def has_specialty(inspector_id: int, specialty_code: str, db: Session) -> bool:
        """Check if inspector has specific specialty"""
        result = db.exec(
            select(InspectorSpecialty)
            .where(InspectorSpecialty.inspector_id == inspector_id)
            .where(InspectorSpecialty.specialty_code == specialty_code)
            .where(InspectorSpecialty.granted == True)
        ).first()
        
        return result is not None
    
    @staticmethod
    def require_specialty(specialty_code: str):
        """Decorator to require specific specialty for API endpoints"""
        def decorator(func):
            def wrapper(*args, **kwargs):
                # This will be implemented after we have auth service ready
                # For now, we'll just pass through
                return func(*args, **kwargs)
            return wrapper
        return decorator
    
    @staticmethod
    def get_inspectors_with_specialty(specialty_code: str, db: Session) -> List[Inspector]:
        """Get all inspectors who have a specific specialty"""
        specialty_records = db.exec(
            select(InspectorSpecialty)
            .where(InspectorSpecialty.specialty_code == specialty_code)
            .where(InspectorSpecialty.granted == True)
        ).all()
        
        inspector_ids = [record.inspector_id for record in specialty_records]
        
        if not inspector_ids:
            return []
        
        inspectors = db.exec(
            select(Inspector)
            .where(Inspector.id.in_(inspector_ids))
            .where(Inspector.active == True)
        ).all()
        
        # Convert ORM objects to dicts with only serializable fields
        return [inspector.dict(exclude={"certifications", "roles", "documents", "psv_calibrations", "operated_calibrations", "approved_calibrations", "cleaned_coupon_analyses", "analyzed_coupon_analyses", "approved_coupon_analyses", "specialty_records"}) for inspector in inspectors]
    
    @staticmethod
    def grant_specialty(
        inspector_id: int, 
        specialty_code: str, 
        granted_by: int, 
        db: Session
    ) -> bool:
        """Grant a single specialty to inspector"""
        if not SpecialtyCodes.is_valid_code(specialty_code):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid specialty code: {specialty_code}"
            )
        
        # Check if already exists
        existing = db.exec(
            select(InspectorSpecialty)
            .where(InspectorSpecialty.inspector_id == inspector_id)
            .where(InspectorSpecialty.specialty_code == specialty_code)
        ).first()
        
        if existing:
            existing.granted = True
            existing.granted_by = granted_by
            existing.updated_at = datetime.utcnow()
        else:
            new_specialty = InspectorSpecialty(
                inspector_id=inspector_id,
                specialty_code=specialty_code,
                granted=True,
                granted_by=granted_by
            )
            db.add(new_specialty)
        
        try:
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Error granting specialty: {str(e)}"
            )
    
    @staticmethod
    def revoke_specialty(
        inspector_id: int, 
        specialty_code: str, 
        revoked_by: int, 
        db: Session
    ) -> bool:
        """Revoke a specialty from inspector"""
        existing = db.exec(
            select(InspectorSpecialty)
            .where(InspectorSpecialty.inspector_id == inspector_id)
            .where(InspectorSpecialty.specialty_code == specialty_code)
        ).first()
        
        if existing:
            existing.granted = False
            existing.granted_by = revoked_by
            existing.updated_at = datetime.utcnow()
            
            try:
                db.commit()
                return True
            except Exception as e:
                db.rollback()
                raise HTTPException(
                    status_code=400,
                    detail=f"Error revoking specialty: {str(e)}"
                )
        
        return False
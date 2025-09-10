"""
Inspector Specialty API Endpoints
API های مدیریت تخصص‌های بازرسین
"""

from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.database import get_session
from app.domains.inspector.services.specialty_service import SpecialtyService
from app.domains.inspector.models.specialty import SpecialtyCodes
from app.domains.inspector.models.inspector import Inspector
from app.domains.auth.services.auth_service import AuthService

router = APIRouter()

def get_current_inspector(db: Session = Depends(get_session), token: str = None):
    """Temporary function until auth is fully integrated"""
    # This is a placeholder - will be replaced with actual auth
    # For now, return a mock admin user
    return Inspector(id=1, name="Admin", employee_id="ADMIN001", inspector_type="Admin")

def is_admin(inspector: Inspector) -> bool:
    """Check if inspector is admin"""
    # This is a placeholder - will be replaced with actual role checking
    return inspector.employee_id == "ADMIN001" or inspector.name == "Admin"

def get_current_admin(current_user: Inspector = Depends(get_current_inspector)):
    """Get current user and ensure they are admin"""
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="نیاز به دسترسی ادمین")
    return current_user

@router.get("/{inspector_id}/specialties", response_model=Dict[str, bool])
def get_inspector_specialties(
    inspector_id: int,
    db: Session = Depends(get_session),
    current_user: Inspector = Depends(get_current_inspector)
):
    """Get specialties for an inspector"""
    # بررسی دسترسی: فقط خودش یا ادمین
    if current_user.id != inspector_id and not is_admin(current_user):
        raise HTTPException(status_code=403, detail="دسترسی مجاز نیست")
    
    return SpecialtyService.get_inspector_specialties(inspector_id, db)

@router.post("/{inspector_id}/specialties")
def update_inspector_specialties(
    inspector_id: int,
    specialties: Dict[str, bool],
    db: Session = Depends(get_session),
    current_user: Inspector = Depends(get_current_admin)  # فقط ادمین
):
    """Update inspector specialties (Admin only)"""
    # Validate specialty codes
    valid_codes = {code for code, _, _ in SpecialtyCodes.ALL_SPECIALTIES}
    for code in specialties.keys():
        if code not in valid_codes:
            raise HTTPException(
                status_code=400, 
                detail=f"کد تخصص نامعتبر: {code}"
            )
    
    success = SpecialtyService.update_inspector_specialties(
        inspector_id, specialties, current_user.id, db
    )
    
    if success:
        return {"message": "تخصص‌ها با موفقیت بروزرسانی شدند"}
    else:
        raise HTTPException(
            status_code=400, 
            detail="خطا در بروزرسانی تخصص‌ها"
        )

@router.get("/specialty-codes")
def get_all_specialty_codes():
    """Get all available specialty codes with descriptions"""
    return [
        {
            "code": code,
            "title": title, 
            "description": description
        }
        for code, title, description in SpecialtyCodes.ALL_SPECIALTIES
    ]

@router.get("/by-specialty/{specialty_code}", response_model=List[Inspector])
def get_inspectors_by_specialty(
    specialty_code: str,
    db: Session = Depends(get_session),
    current_user: Inspector = Depends(get_current_inspector)
):
    """Get all inspectors who have a specific specialty"""
    if not SpecialtyCodes.is_valid_code(specialty_code):
        raise HTTPException(
            status_code=400,
            detail=f"کد تخصص نامعتبر: {specialty_code}"
        )
    
    inspectors = SpecialtyService.get_inspectors_with_specialty(specialty_code, db)
    return inspectors

@router.post("/{inspector_id}/grant/{specialty_code}")
def grant_specialty(
    inspector_id: int,
    specialty_code: str,
    db: Session = Depends(get_session),
    current_user: Inspector = Depends(get_current_admin)
):
    """Grant a single specialty to inspector (Admin only)"""
    success = SpecialtyService.grant_specialty(
        inspector_id, specialty_code, current_user.id, db
    )
    
    if success:
        specialty_name = SpecialtyCodes.get_specialty_display_name(specialty_code)
        return {"message": f"تخصص {specialty_name} با موفقیت اعطا شد"}
    else:
        raise HTTPException(
            status_code=400,
            detail="خطا در اعطای تخصص"
        )

@router.post("/{inspector_id}/revoke/{specialty_code}")
def revoke_specialty(
    inspector_id: int,
    specialty_code: str,
    db: Session = Depends(get_session),
    current_user: Inspector = Depends(get_current_admin)
):
    """Revoke a specialty from inspector (Admin only)"""
    success = SpecialtyService.revoke_specialty(
        inspector_id, specialty_code, current_user.id, db
    )
    
    if success:
        specialty_name = SpecialtyCodes.get_specialty_display_name(specialty_code)
        return {"message": f"تخصص {specialty_name} با موفقیت لغو شد"}
    else:
        raise HTTPException(
            status_code=400,
            detail="خطا در لغو تخصص"
        )

# Helper endpoints for specific specialties
@router.get("/psv-inspectors", response_model=List[Inspector])
def get_psv_inspectors(db: Session = Depends(get_session)):
    """Get all inspectors with PSV specialty"""
    return SpecialtyService.get_inspectors_with_specialty(SpecialtyCodes.PSV, db)

@router.get("/crane-inspectors", response_model=List[Inspector])
def get_crane_inspectors(db: Session = Depends(get_session)):
    """Get all inspectors with CRANE specialty"""
    return SpecialtyService.get_inspectors_with_specialty(SpecialtyCodes.CRANE, db)

@router.get("/corrosion-inspectors", response_model=List[Inspector])
def get_corrosion_inspectors(db: Session = Depends(get_session)):
    """Get all inspectors with CORROSION specialty"""
    return SpecialtyService.get_inspectors_with_specialty(SpecialtyCodes.CORROSION, db)
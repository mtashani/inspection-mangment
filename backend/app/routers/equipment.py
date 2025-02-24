from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List
from ..database import get_session
from ..models import Equipment
from sqlalchemy.exc import SQLAlchemyError

router = APIRouter()

@router.get("/tags")
def get_equipment_tags(
    search: str = Query(None, description="Search term for equipment tags"),
    session: Session = Depends(get_session)
):
    try:
        query = select(Equipment.equipment_code)
        if search:
            query = query.filter(Equipment.equipment_code.ilike(f"%{search}%"))
        
        result = session.exec(query).all()
        return {"tags": result}
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..database import get_session
from ..models import Inspector

router = APIRouter()

@router.get("")
def get_inspectors(
    session: Session = Depends(get_session)
):
    inspectors = session.exec(select(Inspector)).all()
    return inspectors
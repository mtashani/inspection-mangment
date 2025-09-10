from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.domains.auth.services.auth_service import AuthService
from app.domains.auth.schemas import Token, InspectorResponse
from app.domains.inspector.models.inspector import Inspector
from app.core.config import settings

router = APIRouter()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_inspector(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> Inspector:
    """Get the current authenticated inspector"""
    inspector = await AuthService.get_current_inspector(db, token)
    if not inspector:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return inspector


async def get_current_active_inspector(
    current_inspector: Inspector = Depends(get_current_inspector),
) -> Inspector:
    """Get the current active inspector"""
    if not current_inspector.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive inspector"
        )
    return current_inspector


@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    inspector = await AuthService.authenticate_inspector(
        db, form_data.username, form_data.password
    )
    
    if not inspector:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": str(inspector.id)}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=InspectorResponse)
async def read_inspector_me(
    current_inspector: Inspector = Depends(get_current_active_inspector),
) -> Any:
    """Get current inspector profile"""
    return current_inspector


@router.post("/logout")
async def logout() -> Any:
    """
    Logout - client-side only since JWT tokens are stateless.
    Client should discard the token.
    """
    return {"message": "Successfully logged out"}
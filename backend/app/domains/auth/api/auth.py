from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session
from typing import Any, Dict

from app.database import get_session
from app.domains.auth.services.auth_service import AuthService
from app.domains.inspector.models.inspector import Inspector
from app.domains.auth.schemas.auth import Token, UserInfo

router = APIRouter()
from fastapi import Request

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def get_token_from_header_or_cookie(request: Request):
    # Try to get token from Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]
    # Fallback to cookie
    token_cookie = request.cookies.get("access_token")
    if token_cookie:
        return token_cookie
    return None


from fastapi import Response

@router.post("/login", response_model=Token)
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_session)
) -> Any:
    """
    Get an access token for future requests using username and password
    """
    print(f"🔑 [LOGIN] Attempt for user: {form_data.username}")
    inspector = AuthService.authenticate_inspector(db, form_data.username, form_data.password)
    if not inspector:
        print(f"❌ [LOGIN] Failed for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = AuthService.create_access_token(data={"sub": str(inspector.id)})
    print(f"✅ [LOGIN] Success for user: {form_data.username}, token created")
    
    # Set HttpOnly cookie (response is now properly injected)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=60*60*2  # 2 hours
    )
    print(f"🍪 [LOGIN] HttpOnly cookie set for user: {form_data.username}")
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserInfo)
def read_users_me(
    db: Session = Depends(get_session),
    request: Request = None
) -> Any:
    """
    Get current user information
    """
    token = get_token_from_header_or_cookie(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    inspector = AuthService.get_current_inspector(db, token)
    if not inspector:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get roles
    roles = []
    for role in inspector.roles:
        roles.append(role.role.name)
    
    return {
        "id": inspector.id,
        "username": inspector.username,
        "email": inspector.email,
        "name": f"{inspector.first_name} {inspector.last_name}",
        "roles": roles,
        "is_active": inspector.active,
        "employee_id": inspector.employee_id
    }


@router.post("/logout")
def logout() -> Dict[str, str]:
    """
    Logout endpoint (client-side logout)
    """
    return {"detail": "Logout successful"}


@router.post("/change-password")
def change_password(
    current_password: str,
    new_password: str,
    db: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
) -> Dict[str, str]:
    """
    Change user password
    """
    inspector = AuthService.get_current_inspector(db, token)
    if not inspector:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify current password
    if not AuthService.verify_password(current_password, inspector.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    new_password_hash = AuthService.get_password_hash(new_password)
    
    # Update password
    inspector.password_hash = new_password_hash
    db.add(inspector)
    db.commit()
    
    return {"detail": "Password changed successfully"}
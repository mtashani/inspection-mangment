"""Authentication service for handling security operations."""

import datetime
from typing import Optional, Dict, Any, TYPE_CHECKING, TypeVar, cast
from passlib.context import CryptContext
from sqlmodel import Session, select
from sqlalchemy import or_
from fastapi import Depends, HTTPException, status
import jwt  # PyJWT package needed

from app.core.config import settings

if TYPE_CHECKING:
    from app.domains.inspector.models.inspector import Inspector

# Define generic type for Inspector model
T = TypeVar('T')

# Password hashing context - use bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service for handling authentication-related operations"""

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against a hash"""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        """Generate a password hash"""
        return pwd_context.hash(password)

    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.datetime.utcnow() + expires_delta
        else:
            expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        
        return encoded_jwt

    @staticmethod
    def authenticate_inspector(db: Session, username_or_email: str, password: str) -> Optional[T]:
        """Authenticate an inspector by username/email and password"""
        # Import here to avoid circular imports
        from app.domains.inspector.models.inspector import Inspector
        
        # Query for inspector by username or email
        result = db.exec(
            select(Inspector).where(
                or_(
                    Inspector.username == username_or_email,
                    Inspector.email == username_or_email
                ),
                Inspector.can_login == True,
                Inspector.active == True
            )
        )
        inspector = result.first()
        
        # Check if inspector exists and password is correct
        if not inspector or not AuthService.verify_password(password, inspector.password_hash):
            return None
            
        # Update last login timestamp
        inspector.last_login = datetime.datetime.utcnow()
        db.add(inspector)
        db.commit()
        
        return cast(T, inspector)

    @staticmethod
    def get_current_inspector(db: Session, token: str) -> Optional[T]:
        """Get the current inspector from a JWT token"""
        # Import here to avoid circular imports
        from app.domains.inspector.models.inspector import Inspector
        
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            inspector_id = payload.get("sub")
            
            if inspector_id is None:
                return None
                
            result = db.exec(
                select(Inspector).where(
                    Inspector.id == int(inspector_id),
                    Inspector.active == True,
                    Inspector.can_login == True
                )
            )
            return cast(T, result.first())
            
        except (jwt.PyJWTError, ValueError):
            return None

    @staticmethod
    def has_permission(inspector: T, resource: str, action: str) -> bool:
        """Check if inspector has permission for resource and action"""
        if not inspector or not hasattr(inspector, 'roles'):
            return False
            
        for inspector_role in inspector.roles:
            role = inspector_role.role
            for role_permission in role.permissions:
                permission = role_permission.permission
                if permission.resource == resource and permission.action == action:
                    return True
                    
        return False

    @staticmethod
    def get_current_active_inspector_with_permission(
        db: Session,
        token: str,
        resource: str,
        action: str
    ) -> T:
        """Get current inspector and check permission"""
        inspector = AuthService.get_current_inspector(db, token)
        
        if not inspector:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        if not AuthService.has_permission(inspector, resource, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions for {resource}:{action}",
            )
            
        return inspector
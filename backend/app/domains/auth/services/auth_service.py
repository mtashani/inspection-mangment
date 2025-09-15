"""Authentication service for handling security operations."""

import datetime
from typing import Optional, Dict, Any, TYPE_CHECKING, TypeVar, cast, List, Set
from passlib.context import CryptContext
from sqlmodel import Session, select
from sqlalchemy import or_
from fastapi import Depends, HTTPException, status
import jwt  # PyJWT package needed
import logging

from app.core.config import settings

if TYPE_CHECKING:
    from app.domains.inspector.models.inspector import Inspector

# Define generic type for Inspector model
T = TypeVar('T')

# Password hashing context - use bcrypt with explicit configuration for compatibility
try:
    # Import bcrypt directly to check version compatibility
    import bcrypt
    
    # Configure CryptContext with explicit bcrypt settings
    pwd_context = CryptContext(
        schemes=["bcrypt"], 
        deprecated="auto",
        bcrypt__rounds=12,  # Explicit rounds for consistency
        bcrypt__ident="2b",  # Use 2b identifier for compatibility
        bcrypt__vary_rounds=0.1  # Allow some variation in rounds
    )
    
    # Test the context to ensure it works
    test_hash = pwd_context.hash("test")
    pwd_context.verify("test", test_hash)
    
except Exception as e:
    logging.warning(f"bcrypt configuration issue: {e}. Using simpler configuration.")
    try:
        # Simpler fallback configuration
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    except Exception as e2:
        logging.error(f"bcrypt fallback also failed: {e2}. Using pbkdf2_sha256 as backup.")
        # Ultimate fallback to pbkdf2_sha256 if bcrypt fails completely
        pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


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
    def create_access_token(
        inspector_id: int, 
        roles: Optional[List[str]] = None, 
        permissions: Optional[Set[str]] = None,
        expires_delta: Optional[datetime.timedelta] = None
    ) -> str:
        """Create a JWT access token with roles and permissions"""
        to_encode = {
            "sub": str(inspector_id),
            "roles": roles or [],
            "permissions": list(permissions or set()),
            "iat": datetime.datetime.utcnow(),
            "type": "access"
        }
        
        if expires_delta:
            expire = datetime.datetime.utcnow() + expires_delta
        else:
            expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            
        to_encode.update({"exp": expire})
        
        try:
            encoded_jwt = jwt.encode(
                to_encode,
                settings.SECRET_KEY,
                algorithm=settings.ALGORITHM
            )
            return encoded_jwt
        except Exception as e:
            logging.error(f"Error creating access token: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create access token"
            )

    @staticmethod
    def create_refresh_token(inspector_id: int, expires_delta: Optional[datetime.timedelta] = None) -> str:
        """Create a JWT refresh token"""
        to_encode = {
            "sub": str(inspector_id),
            "iat": datetime.datetime.utcnow(),
            "type": "refresh"
        }
        
        if expires_delta:
            expire = datetime.datetime.utcnow() + expires_delta
        else:
            # Refresh tokens last longer (7 days by default)
            expire = datetime.datetime.utcnow() + datetime.timedelta(days=7)
            
        to_encode.update({"exp": expire})
        
        try:
            encoded_jwt = jwt.encode(
                to_encode,
                settings.SECRET_KEY,
                algorithm=settings.ALGORITHM
            )
            return encoded_jwt
        except Exception as e:
            logging.error(f"Error creating refresh token: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create refresh token"
            )

    @staticmethod
    def authenticate_inspector(db: Session, username_or_email: str, password: str) -> Optional[T]:
        """Authenticate an inspector by username/email and password"""
        # Import here to avoid circular imports
        from app.domains.inspector.models.inspector import Inspector
        from app.domains.inspector.models.authorization import InspectorRole, Role, RolePermission, Permission
        
        # Query for inspector by username or email with roles and permissions
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
    def login_inspector(db: Session, username_or_email: str, password: str) -> Optional[Dict[str, Any]]:
        """Login inspector and return tokens with roles/permissions"""
        inspector = AuthService.authenticate_inspector(db, username_or_email, password)
        if not inspector:
            return None
            
        # Get roles and permissions
        roles, permissions = AuthService.get_inspector_roles_and_permissions(db, inspector.id)
        
        # Create tokens
        access_token = AuthService.create_access_token(
            inspector_id=inspector.id,
            roles=roles,
            permissions=permissions
        )
        refresh_token = AuthService.create_refresh_token(inspector_id=inspector.id)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "inspector": inspector
        }

    @staticmethod
    def decode_token(token: str) -> Optional[Dict[str, Any]]:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            
            # Validate token type
            if payload.get("type") not in ["access", "refresh"]:
                logging.warning("Invalid token type")
                return None
                
            # Check expiration
            exp = payload.get("exp")
            if exp and datetime.datetime.utcnow().timestamp() > exp:
                logging.warning("Token has expired")
                return None
                
            return payload
            
        except jwt.ExpiredSignatureError:
            logging.warning("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logging.warning(f"Invalid token: {e}")
            return None
        except Exception as e:
            logging.error(f"Error decoding token: {e}")
            return None

    @staticmethod
    def get_current_inspector(db: Session, token: str) -> Optional[T]:
        """Get the current inspector from a JWT token"""
        # Import here to avoid circular imports
        from app.domains.inspector.models.inspector import Inspector
        
        payload = AuthService.decode_token(token)
        if not payload or payload.get("type") != "access":
            return None
            
        inspector_id = payload.get("sub")
        if inspector_id is None:
            return None
            
        try:
            result = db.exec(
                select(Inspector).where(
                    Inspector.id == int(inspector_id),
                    Inspector.active == True,
                    Inspector.can_login == True
                )
            )
            return cast(T, result.first())
        except (ValueError, Exception) as e:
            logging.error(f"Error getting inspector: {e}")
            return None

    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> Optional[Dict[str, str]]:
        """Refresh access token using refresh token"""
        payload = AuthService.decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None
            
        inspector_id = payload.get("sub")
        if not inspector_id:
            return None
            
        # Get inspector and their current roles/permissions
        inspector = AuthService.get_current_inspector(db, refresh_token)
        if not inspector:
            return None
            
        # Get updated roles and permissions
        roles, permissions = AuthService.get_inspector_roles_and_permissions(db, inspector.id)
        
        # Create new access token with updated permissions
        new_access_token = AuthService.create_access_token(
            inspector_id=inspector.id,
            roles=roles,
            permissions=permissions
        )
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }

    @staticmethod
    def get_inspector_roles_and_permissions(db: Session, inspector_id: int) -> tuple[List[str], Set[str]]:
        """Get inspector roles and permissions from database"""
        from app.domains.inspector.models.authorization import InspectorRole, Role, RolePermission, Permission
        
        # Get all roles for the inspector
        role_result = db.exec(
            select(Role)
            .join(InspectorRole, InspectorRole.role_id == Role.id)
            .where(InspectorRole.inspector_id == inspector_id)
        )
        roles = role_result.all()
        role_names = [role.name for role in roles]
        
        # Get all permissions for these roles
        permissions = set()
        for role in roles:
            perm_result = db.exec(
                select(Permission)
                .join(RolePermission, RolePermission.permission_id == Permission.id)
                .where(RolePermission.role_id == role.id)
            )
            role_permissions = perm_result.all()
            for perm in role_permissions:
                permissions.add(f"{perm.resource}:{perm.action}")
        
        return role_names, permissions

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
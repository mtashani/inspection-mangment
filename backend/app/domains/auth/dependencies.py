# Enhanced Authentication dependencies for FastAPI with RBAC
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Callable, TYPE_CHECKING
from sqlmodel import Session
import logging
from datetime import datetime

from app.database import get_session as get_db
from app.domains.auth.services.auth_service import AuthService
from app.domains.auth.services.permission_service import PermissionService

if TYPE_CHECKING:
    from app.domains.inspector.models.inspector import Inspector

# HTTP Bearer token security scheme
security = HTTPBearer(auto_error=False)

async def get_current_inspector(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional["Inspector"]:
    """Get current inspector from JWT token"""
    if not credentials:
        return None
        
    try:
        inspector = AuthService.get_current_inspector(db, credentials.credentials)
        if inspector:
            # Log successful authentication for audit
            logging.info(f"Authenticated inspector {inspector.id} ({inspector.username}) from {request.client.host}")
        return inspector
    except Exception as e:
        logging.warning(f"Authentication failed: {e}")
        return None

async def get_current_active_inspector(
    inspector: Optional["Inspector"] = Depends(get_current_inspector)
) -> "Inspector":
    """Get current active inspector or raise 401"""
    if not inspector:
        logging.warning("Unauthenticated access attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not inspector.active:
        logging.warning(f"Inactive inspector {inspector.id} attempted access")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inspector account is inactive"
        )
        
    if not inspector.can_login:
        logging.warning(f"Inspector {inspector.id} without login permission attempted access")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inspector account cannot login"
        )
    
    return inspector

def require_permission(resource: str, action: str) -> Callable:
    """
    Dependency factory for protecting endpoints with specific permissions
    
    Args:
        resource: The resource being accessed (e.g., 'ndt', 'psv', 'report')
        action: The action being performed (e.g., 'create', 'view', 'approve')
    
    Returns:
        FastAPI dependency function that checks permissions
    """
    async def permission_dependency(
        request: Request,
        inspector: "Inspector" = Depends(get_current_active_inspector),
        db: Session = Depends(get_db)
    ) -> "Inspector":
        """Check if inspector has required permission"""
        try:
            has_perm = await PermissionService.has_permission(db, inspector, resource, action)
            
            if not has_perm:
                # Log authorization failure for audit
                logging.warning(
                    f"Authorization failed: inspector={inspector.id}, "
                    f"resource={resource}, action={action}, "
                    f"endpoint={request.url.path}, method={request.method}, "
                    f"client={request.client.host}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions for {resource}:{action}"
                )
            
            # Log successful authorization for audit
            logging.info(
                f"Authorization success: inspector={inspector.id}, "
                f"resource={resource}, action={action}, "
                f"endpoint={request.url.path}, method={request.method}"
            )
            
            return inspector
            
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Permission check error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Permission check failed"
            )
    
    return permission_dependency

def require_any_permission(*permissions: tuple[str, str]) -> Callable:
    """
    Dependency factory for endpoints that require any of multiple permissions
    
    Args:
        permissions: Tuples of (resource, action) pairs
    
    Returns:
        FastAPI dependency function that checks if user has any of the permissions
    """
    async def any_permission_dependency(
        request: Request,
        inspector: "Inspector" = Depends(get_current_active_inspector),
        db: Session = Depends(get_db)
    ) -> "Inspector":
        """Check if inspector has any of the required permissions"""
        try:
            for resource, action in permissions:
                has_perm = await PermissionService.has_permission(db, inspector, resource, action)
                if has_perm:
                    logging.info(
                        f"Authorization success (any): inspector={inspector.id}, "
                        f"matched={resource}:{action}, endpoint={request.url.path}"
                    )
                    return inspector
            
            # Log authorization failure
            perm_strings = [f"{r}:{a}" for r, a in permissions]
            logging.warning(
                f"Authorization failed (any): inspector={inspector.id}, "
                f"required_any={perm_strings}, endpoint={request.url.path}"
            )
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required any of: {', '.join(perm_strings)}"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Permission check error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Permission check failed"
            )
    
    return any_permission_dependency

def require_all_permissions(*permissions: tuple[str, str]) -> Callable:
    """
    Dependency factory for endpoints that require all of multiple permissions
    
    Args:
        permissions: Tuples of (resource, action) pairs
    
    Returns:
        FastAPI dependency function that checks if user has all permissions
    """
    async def all_permissions_dependency(
        request: Request,
        inspector: "Inspector" = Depends(get_current_active_inspector),
        db: Session = Depends(get_db)
    ) -> "Inspector":
        """Check if inspector has all required permissions"""
        try:
            missing_permissions = []
            
            for resource, action in permissions:
                has_perm = await PermissionService.has_permission(db, inspector, resource, action)
                if not has_perm:
                    missing_permissions.append(f"{resource}:{action}")
            
            if missing_permissions:
                logging.warning(
                    f"Authorization failed (all): inspector={inspector.id}, "
                    f"missing={missing_permissions}, endpoint={request.url.path}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required permissions: {', '.join(missing_permissions)}"
                )
            
            logging.info(
                f"Authorization success (all): inspector={inspector.id}, "
                f"endpoint={request.url.path}"
            )
            
            return inspector
            
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Permission check error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Permission check failed"
            )
    
    return all_permissions_dependency

# Convenience dependencies for common admin operations
require_admin_access = require_permission("admin", "manage")
require_user_management = require_permission("admin", "manage_users")
require_role_management = require_permission("admin", "manage_roles")
require_permission_management = require_permission("admin", "manage_permissions")

# Audit logging middleware dependency
async def log_request(
    request: Request,
    inspector: Optional["Inspector"] = Depends(get_current_inspector)
):
    """Log all requests for audit purposes"""
    inspector_id = inspector.id if inspector else "anonymous"
    inspector_username = inspector.username if inspector else "anonymous"
    
    logging.info(
        f"Request: method={request.method}, path={request.url.path}, "
        f"inspector={inspector_id} ({inspector_username}), "
        f"client={request.client.host}, user_agent={request.headers.get('user-agent', 'unknown')}"
    )
    
    return inspector 
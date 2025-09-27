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
from app.core.permissions import validate_permission
from app.core.api_logging import DomainLogger

if TYPE_CHECKING:
    from app.domains.inspector.models.inspector import Inspector

# HTTP Bearer token security scheme
security = HTTPBearer(auto_error=False)


def _extract_domain_from_path(path: str) -> str:
    """
    Extract domain name from URL path to determine which log file to use.
    Examples:
    - /api/v1/inspector/documents/1/preview -> inspector
    - /api/v1/maintenance/equipment/1 -> maintenance
    - /api/v1/equipment/1 -> equipment
    """
    path_parts = path.strip('/').split('/')
    # Look for common API version patterns and extract domain after version
    for i, part in enumerate(path_parts):
        if part.startswith('v') and len(part) > 1:  # v1, v2, etc.
            if i + 1 < len(path_parts):
                domain = path_parts[i + 1]
                # Sanitize domain name to be a valid filename
                domain = domain.replace('-', '_').replace('.', '_').lower()
                
                # Handle some common plural/singular variations
                if domain.endswith('s') and domain not in ['users', 'files', 'logs']:  # keep actual plurals
                    singular = domain[:-1]
                    # Use a whitelist of valid domains to know when to singularize
                    valid_domains = {
                        'inspector', 'equipment', 'maintenance', 'inspection', 
                        'document', 'certification', 'schedule', 'report'
                    }
                    if singular in valid_domains:
                        domain = singular
                
                return domain
    
    # Default to 'general' if we can't determine the domain
    return 'general'


def _log_authentication_error(request: Request, error_message: str, user_id: Optional[int] = None):
    """
    Helper function to log authentication errors to the appropriate domain log
    """
    domain_name = _extract_domain_from_path(str(request.url.path))
    DomainLogger.log_api_error(
        domain_name=domain_name,
        endpoint=str(request.url.path),
        method=request.method,
        error=Exception(error_message),
        request_data=None,
        user_id=user_id,
        status_code=401
    )


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
    request: Request,
    inspector: Optional["Inspector"] = Depends(get_current_inspector)
) -> "Inspector":
    """Get current active inspector or raise 401"""
    if not inspector:
        logging.warning("Unauthenticated access attempt")
        # Log authentication failure to appropriate domain logs
        _log_authentication_error(request, "Could not validate credentials - authentication failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not inspector.active:
        logging.warning(f"Inactive inspector {inspector.id} attempted access")
        # Log inactive account access attempt to appropriate domain logs
        _log_authentication_error(request, f"Inactive inspector {inspector.id} attempted access", inspector.id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inspector account is inactive"
        )
        
    if not inspector.can_login:
        logging.warning(f"Inspector {inspector.id} without login permission attempted access")
        # Log login permission denial to appropriate domain logs
        _log_authentication_error(request, f"Inspector {inspector.id} without login permission attempted access", inspector.id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inspector account cannot login"
        )
    
    return inspector

def require_standardized_permission(permission: str) -> Callable:
    """
    Enhanced permission dependency that uses standardized permissions
    
    Args:
        permission: Standardized permission name (e.g., "mechanical_view", "system_superadmin")
    
    Returns:
        Dependency function that validates the permission
    """
    
    async def permission_checker(
        request: Request,
        inspector: "Inspector" = Depends(get_current_active_inspector),
        db: Session = Depends(get_db)
    ) -> "Inspector":
        
        # Validate permission format
        if not validate_permission(permission):
            logging.error(f"Invalid standardized permission requested: {permission}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid permission: {permission}. Must be one of the 23 standardized permissions."
            )
        
        # Check permission
        has_access = await PermissionService.check_inspector_permission(
            db, inspector.id, permission
        )
        
        # Log access attempt
        logging.info(
            f"Standardized permission check: inspector={inspector.id} ({inspector.username}), "
            f"permission={permission}, granted={has_access}, "
            f"endpoint={request.url.path}, method={request.method}"
        )
        
        if not has_access:
            logging.warning(
                f"Access denied: inspector={inspector.id} ({inspector.username}), "
                f"permission={permission}, endpoint={request.url.path}"
            )
            
            # Get inspector's current permissions for better error message
            inspector_permissions = await PermissionService.get_inspector_permissions(
                db, inspector.id
            )
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "message": f"Insufficient permissions. Required: {permission}",
                    "required_permission": permission,
                    "current_permissions": inspector_permissions,
                    "suggestion": "Contact your administrator to request the required permission."
                }
            )
        
        return inspector
    
    return permission_checker

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
"""
API logging decorator for automatic error tracking in domain APIs
"""
from functools import wraps
from typing import Callable, Any, Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import ValidationError
import asyncio
import inspect
from .logging_config import DomainLogger


def log_api_errors(domain_name: str):
    """
    Decorator to automatically log API errors for a specific domain
    
    Usage:
        @log_api_errors("inspector")
        @router.post("/create")
        def create_inspector(...):
            # Your API logic here
    
    Args:
        domain_name: Name of the domain (e.g., 'inspector', 'maintenance')
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Extract request info
            request_info = _extract_request_info(args, kwargs)
            
            try:
                # Call the original function
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)
                return result
                
            except HTTPException as e:
                # Log HTTP exceptions (4xx, 5xx errors)
                DomainLogger.log_api_error(
                    domain_name=domain_name,
                    endpoint=request_info.get("endpoint", "unknown"),
                    method=request_info.get("method", "unknown"),
                    error=e,
                    request_data=request_info.get("request_data"),
                    user_id=request_info.get("user_id"),
                    status_code=e.status_code
                )
                raise  # Re-raise to maintain original behavior
                
            except ValidationError as e:
                # Log validation errors
                DomainLogger.log_validation_error(
                    domain_name=domain_name,
                    endpoint=request_info.get("endpoint", "unknown"),
                    method=request_info.get("method", "unknown"),
                    validation_errors=e.errors(),
                    request_data=request_info.get("request_data"),
                    user_id=request_info.get("user_id")
                )
                raise HTTPException(
                    status_code=422,
                    detail={
                        "message": "Validation failed",
                        "errors": e.errors(),
                        "type": "validation_error"
                    }
                )
                
            except Exception as e:
                # Log unexpected errors
                DomainLogger.log_api_error(
                    domain_name=domain_name,
                    endpoint=request_info.get("endpoint", "unknown"),
                    method=request_info.get("method", "unknown"),
                    error=e,
                    request_data=request_info.get("request_data"),
                    user_id=request_info.get("user_id"),
                    status_code=500
                )
                
                # Convert to HTTP exception
                raise HTTPException(
                    status_code=500,
                    detail={
                        "message": f"Internal server error: {str(e)}",
                        "type": "internal_error"
                    }
                )
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Debug print
            print(f"🔍 Logging decorator called for {func.__name__} in domain {domain_name}")
            
            # Extract request info
            request_info = _extract_request_info(args, kwargs)
            
            try:
                # Call the original function
                result = func(*args, **kwargs)
                return result
                
            except HTTPException as e:
                print(f"📝 Logging HTTPException: {e.status_code} - {e.detail}")
                # Log HTTP exceptions (4xx, 5xx errors)
                DomainLogger.log_api_error(
                    domain_name=domain_name,
                    endpoint=request_info.get("endpoint", "unknown"),
                    method=request_info.get("method", "unknown"),
                    error=e,
                    request_data=request_info.get("request_data"),
                    user_id=request_info.get("user_id"),
                    status_code=e.status_code
                )
                raise  # Re-raise to maintain original behavior
                
            except ValidationError as e:
                print(f"📝 Logging ValidationError: {e.errors()}")
                # Log validation errors
                DomainLogger.log_validation_error(
                    domain_name=domain_name,
                    endpoint=request_info.get("endpoint", "unknown"),
                    method=request_info.get("method", "unknown"),
                    validation_errors=e.errors(),
                    request_data=request_info.get("request_data"),
                    user_id=request_info.get("user_id")
                )
                raise HTTPException(
                    status_code=422,
                    detail={
                        "message": "Validation failed",
                        "errors": e.errors(),
                        "type": "validation_error"
                    }
                )
                
            except Exception as e:
                print(f"📝 Logging Exception: {type(e).__name__} - {str(e)}")
                # Log unexpected errors
                DomainLogger.log_api_error(
                    domain_name=domain_name,
                    endpoint=request_info.get("endpoint", "unknown"),
                    method=request_info.get("method", "unknown"),
                    error=e,
                    request_data=request_info.get("request_data"),
                    user_id=request_info.get("user_id"),
                    status_code=500
                )
                
                # Convert to HTTP exception
                raise HTTPException(
                    status_code=500,
                    detail={
                        "message": f"Internal server error: {str(e)}",
                        "type": "internal_error"
                    }
                )
        
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


def _extract_request_info(args: tuple, kwargs: dict) -> dict:
    """Extract request information from function arguments"""
    request_info = {
        "endpoint": "unknown",
        "method": "unknown", 
        "request_data": None,
        "user_id": None
    }
    
    # Look for FastAPI Request object
    request = None
    for arg in args:
        if hasattr(arg, 'method') and hasattr(arg, 'url'):
            request = arg
            break
    
    # Check kwargs for request-like objects
    if not request:
        for key, value in kwargs.items():
            if hasattr(value, 'method') and hasattr(value, 'url'):
                request = value
                break
    
    # Extract request info if found
    if request:
        request_info["endpoint"] = str(request.url.path)
        request_info["method"] = request.method
    
    # Look for current_inspector/current_user
    current_inspector = None
    for key, value in kwargs.items():
        if key in ['current_inspector', 'current_user'] and hasattr(value, 'id'):
            current_inspector = value
            break
    
    # Also check args for inspector objects
    if not current_inspector:
        for arg in args:
            if hasattr(arg, 'id') and hasattr(arg, 'username'):
                current_inspector = arg
                break
    
    if current_inspector:
        request_info["user_id"] = getattr(current_inspector, 'id', None)
    
    # Look for request data (Pydantic models or dict)
    for key, value in kwargs.items():
        if key.endswith('_data') or key in ['data', 'request', 'body']:
            if hasattr(value, 'dict'):
                request_info["request_data"] = value.dict()
            elif isinstance(value, dict):
                request_info["request_data"] = value
            break
    
    # Also check positional args for data models
    if not request_info["request_data"]:
        for arg in args:
            if hasattr(arg, 'dict'):
                request_info["request_data"] = arg.dict()
                break
            elif isinstance(arg, dict):
                request_info["request_data"] = arg
                break
    
    return request_info


# Convenience function for manual logging
def log_domain_error(
    domain_name: str,
    endpoint: str,
    method: str,
    error: Exception,
    request_data: Optional[dict] = None,
    user_id: Optional[int] = None,
    status_code: Optional[int] = None
):
    """
    Manually log a domain error (for use outside decorators)
    """
    DomainLogger.log_api_error(
        domain_name=domain_name,
        endpoint=endpoint,
        method=method,
        error=error,
        request_data=request_data,
        user_id=user_id,
        status_code=status_code
    )


# Convenience function for manual validation error logging
def log_domain_validation_error(
    domain_name: str,
    endpoint: str,
    method: str,
    validation_errors: list,
    request_data: Optional[dict] = None,
    user_id: Optional[int] = None
):
    """
    Manually log a domain validation error
    """
    DomainLogger.log_validation_error(
        domain_name=domain_name,
        endpoint=endpoint,
        method=method,
        validation_errors=validation_errors,
        request_data=request_data,
        user_id=user_id
    )
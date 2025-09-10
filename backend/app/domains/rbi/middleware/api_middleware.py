"""Middleware for RBI API"""

import time
import uuid
import logging
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import json


logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging API requests and responses"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Log request
        start_time = time.time()
        logger.info(
            f"Request started - ID: {request_id}, Method: {request.method}, "
            f"URL: {request.url}, Client: {request.client.host if request.client else 'unknown'}"
        )
        
        # Process request
        try:
            response = await call_next(request)
            
            # Log response
            process_time = time.time() - start_time
            logger.info(
                f"Request completed - ID: {request_id}, Status: {response.status_code}, "
                f"Time: {process_time:.3f}s"
            )
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = f"{process_time:.3f}"
            
            return response
            
        except Exception as e:
            # Log error
            process_time = time.time() - start_time
            logger.error(
                f"Request failed - ID: {request_id}, Error: {str(e)}, "
                f"Time: {process_time:.3f}s"
            )
            
            # Return error response
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error_code": 500,
                    "error_message": "Internal server error",
                    "request_id": request_id,
                    "timestamp": time.time()
                },
                headers={"X-Request-ID": request_id}
            )


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Simple rate limiting middleware"""
    
    def __init__(self, app: ASGIApp, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_counts = {}  # In production, use Redis or similar
        self.window_size = 60  # 1 minute window
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Clean old entries
        self._clean_old_entries(current_time)
        
        # Check rate limit
        if client_ip in self.request_counts:
            request_times = self.request_counts[client_ip]
            recent_requests = [t for t in request_times if current_time - t < self.window_size]
            
            if len(recent_requests) >= self.requests_per_minute:
                logger.warning(f"Rate limit exceeded for client {client_ip}")
                return JSONResponse(
                    status_code=429,
                    content={
                        "success": False,
                        "error_code": 429,
                        "error_message": "Rate limit exceeded",
                        "retry_after": 60,
                        "timestamp": current_time
                    },
                    headers={"Retry-After": "60"}
                )
            
            # Update request times
            recent_requests.append(current_time)
            self.request_counts[client_ip] = recent_requests
        else:
            # First request from this client
            self.request_counts[client_ip] = [current_time]
        
        return await call_next(request)
    
    def _clean_old_entries(self, current_time: float):
        """Clean old entries from request counts"""
        for client_ip in list(self.request_counts.keys()):
            request_times = self.request_counts[client_ip]
            recent_requests = [t for t in request_times if current_time - t < self.window_size]
            
            if recent_requests:
                self.request_counts[client_ip] = recent_requests
            else:
                del self.request_counts[client_ip]


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware for adding security headers"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        
        return response


class CORSMiddleware(BaseHTTPMiddleware):
    """Custom CORS middleware for RBI API"""
    
    def __init__(self, app: ASGIApp, allowed_origins: list = None, allowed_methods: list = None):
        super().__init__(app)
        self.allowed_origins = allowed_origins or ["*"]
        self.allowed_methods = allowed_methods or ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Handle preflight requests
        if request.method == "OPTIONS":
            response = Response()
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = ", ".join(self.allowed_methods)
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Request-ID"
            response.headers["Access-Control-Max-Age"] = "86400"
            return response
        
        response = await call_next(request)
        
        # Add CORS headers
        origin = request.headers.get("origin")
        if origin and (origin in self.allowed_origins or "*" in self.allowed_origins):
            response.headers["Access-Control-Allow-Origin"] = origin
        else:
            response.headers["Access-Control-Allow-Origin"] = "*"
        
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Expose-Headers"] = "X-Request-ID, X-Process-Time"
        
        return response


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Middleware for additional request validation"""
    
    def __init__(self, app: ASGIApp, max_request_size: int = 10 * 1024 * 1024):  # 10MB
        super().__init__(app)
        self.max_request_size = max_request_size
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check request size
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_request_size:
            logger.warning(f"Request too large: {content_length} bytes")
            return JSONResponse(
                status_code=413,
                content={
                    "success": False,
                    "error_code": 413,
                    "error_message": "Request entity too large",
                    "max_size_bytes": self.max_request_size,
                    "timestamp": time.time()
                }
            )
        
        # Check content type for POST/PUT requests
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("content-type", "")
            if not content_type.startswith("application/json"):
                logger.warning(f"Invalid content type: {content_type}")
                return JSONResponse(
                    status_code=415,
                    content={
                        "success": False,
                        "error_code": 415,
                        "error_message": "Unsupported media type. Expected application/json",
                        "timestamp": time.time()
                    }
                )
        
        return await call_next(request)


class ResponseCompressionMiddleware(BaseHTTPMiddleware):
    """Middleware for response compression"""
    
    def __init__(self, app: ASGIApp, minimum_size: int = 1024):
        super().__init__(app)
        self.minimum_size = minimum_size
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Check if client accepts gzip
        accept_encoding = request.headers.get("accept-encoding", "")
        if "gzip" not in accept_encoding.lower():
            return response
        
        # Check response size and type
        if (hasattr(response, "body") and 
            len(response.body) >= self.minimum_size and
            response.headers.get("content-type", "").startswith("application/json")):
            
            # Compress response (simplified - in production use proper compression)
            response.headers["Content-Encoding"] = "gzip"
            response.headers["Vary"] = "Accept-Encoding"
        
        return response


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware for collecting API metrics"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.metrics = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "average_response_time": 0.0,
            "endpoint_stats": {}
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        endpoint = f"{request.method} {request.url.path}"
        
        try:
            response = await call_next(request)
            
            # Update metrics
            process_time = time.time() - start_time
            self._update_metrics(endpoint, response.status_code, process_time, success=True)
            
            return response
            
        except Exception as e:
            # Update metrics for failed requests
            process_time = time.time() - start_time
            self._update_metrics(endpoint, 500, process_time, success=False)
            raise
    
    def _update_metrics(self, endpoint: str, status_code: int, process_time: float, success: bool):
        """Update internal metrics"""
        self.metrics["total_requests"] += 1
        
        if success and 200 <= status_code < 400:
            self.metrics["successful_requests"] += 1
        else:
            self.metrics["failed_requests"] += 1
        
        # Update average response time
        total_requests = self.metrics["total_requests"]
        current_avg = self.metrics["average_response_time"]
        self.metrics["average_response_time"] = (
            (current_avg * (total_requests - 1) + process_time) / total_requests
        )
        
        # Update endpoint stats
        if endpoint not in self.metrics["endpoint_stats"]:
            self.metrics["endpoint_stats"][endpoint] = {
                "count": 0,
                "success_count": 0,
                "average_time": 0.0
            }
        
        endpoint_stats = self.metrics["endpoint_stats"][endpoint]
        endpoint_stats["count"] += 1
        
        if success and 200 <= status_code < 400:
            endpoint_stats["success_count"] += 1
        
        # Update endpoint average time
        count = endpoint_stats["count"]
        current_avg = endpoint_stats["average_time"]
        endpoint_stats["average_time"] = (
            (current_avg * (count - 1) + process_time) / count
        )
    
    def get_metrics(self) -> dict:
        """Get current metrics"""
        return self.metrics.copy()


class HealthCheckMiddleware(BaseHTTPMiddleware):
    """Middleware for health check endpoints"""
    
    def __init__(self, app: ASGIApp, health_check_path: str = "/health"):
        super().__init__(app)
        self.health_check_path = health_check_path
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Handle health check requests quickly
        if request.url.path == self.health_check_path:
            return JSONResponse(
                content={
                    "status": "healthy",
                    "timestamp": time.time(),
                    "version": "1.0.0"
                }
            )
        
        return await call_next(request)


# Utility functions for middleware configuration

def configure_api_middleware(app, config: dict = None):
    """Configure all API middleware"""
    
    if config is None:
        config = {}
    
    # Add middleware in reverse order (last added is executed first)
    
    # Health check (should be first to respond quickly)
    app.add_middleware(HealthCheckMiddleware)
    
    # Metrics collection
    app.add_middleware(MetricsMiddleware)
    
    # Response compression
    if config.get("enable_compression", True):
        app.add_middleware(ResponseCompressionMiddleware)
    
    # Request validation
    max_request_size = config.get("max_request_size", 10 * 1024 * 1024)
    app.add_middleware(RequestValidationMiddleware, max_request_size=max_request_size)
    
    # CORS
    allowed_origins = config.get("allowed_origins", ["*"])
    allowed_methods = config.get("allowed_methods", ["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    app.add_middleware(CORSMiddleware, allowed_origins=allowed_origins, allowed_methods=allowed_methods)
    
    # Security headers
    if config.get("enable_security_headers", True):
        app.add_middleware(SecurityHeadersMiddleware)
    
    # Rate limiting
    if config.get("enable_rate_limiting", True):
        requests_per_minute = config.get("requests_per_minute", 60)
        app.add_middleware(RateLimitingMiddleware, requests_per_minute=requests_per_minute)
    
    # Request logging (should be last to log everything)
    app.add_middleware(RequestLoggingMiddleware)
    
    logger.info("API middleware configured successfully")


def get_middleware_metrics(app) -> dict:
    """Get metrics from middleware"""
    
    # Find metrics middleware
    for middleware in app.user_middleware:
        if isinstance(middleware.cls, type) and issubclass(middleware.cls, MetricsMiddleware):
            return middleware.cls.get_metrics()
    
    return {"error": "Metrics middleware not found"}
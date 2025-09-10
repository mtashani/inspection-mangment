"""Main FastAPI application for RBI domain"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import sys
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('rbi_api.log')
    ]
)

logger = logging.getLogger(__name__)

# Import routers and middleware
from app.domains.rbi.routers.rbi_router import router as rbi_router
from app.domains.rbi.middleware.api_middleware import configure_api_middleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    
    # Startup
    logger.info("🚀 Starting RBI API application...")
    
    # Initialize services (if needed)
    try:
        # Add any startup initialization here
        logger.info("✅ RBI API services initialized successfully")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize RBI API services: {str(e)}")
        raise
    
    finally:
        # Shutdown
        logger.info("🛑 Shutting down RBI API application...")
        
        # Add any cleanup here
        logger.info("✅ RBI API application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="RBI Calculation API",
    description="""
    # Risk-Based Inspection (RBI) Calculation API
    
    This API provides comprehensive RBI calculation services including:
    
    ## 🔧 Core Features
    - **Single & Batch Calculations**: Perform RBI calculations for individual equipment or batches
    - **Multi-Level Analysis**: Automatic level determination (Level 1, 2, 3) based on data availability
    - **Configuration Management**: Manage scoring tables, risk matrices, and calculation parameters
    - **Pattern Recognition**: Identify equipment families and degradation patterns
    - **Adaptive Parameters**: Automatically adjust parameters based on prediction feedback
    - **Comprehensive Reporting**: Generate detailed calculation and system reports
    - **Audit Trail**: Complete tracking of all calculations and configuration changes
    
    ## 📊 Calculation Levels
    - **Level 1**: Basic calculations using fixed intervals from equipment master data
    - **Level 2**: Semi-quantitative analysis using scoring tables and risk matrices
    - **Level 3**: Fully quantitative analysis with advanced degradation modeling
    
    ## 🎯 Key Benefits
    - Improved inspection planning and resource allocation
    - Enhanced safety through risk-based decision making
    - Reduced maintenance costs through optimized inspection intervals
    - Continuous learning and improvement through pattern recognition
    - Complete audit trail for regulatory compliance
    
    ## 🔒 Security & Performance
    - Rate limiting and request validation
    - Comprehensive error handling and logging
    - Response compression and caching
    - Security headers and CORS support
    
    ## 📚 Documentation
    - Interactive API documentation available at `/docs`
    - Alternative documentation at `/redoc`
    - Health check endpoint at `/health`
    """,
    version="1.0.0",
    contact={
        "name": "RBI System Support",
        "email": "support@rbi-system.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure middleware
middleware_config = {
    "enable_compression": True,
    "enable_security_headers": True,
    "enable_rate_limiting": True,
    "requests_per_minute": 100,  # Adjust based on needs
    "max_request_size": 50 * 1024 * 1024,  # 50MB for batch operations
    "allowed_origins": ["*"],  # Configure based on deployment
    "allowed_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}

configure_api_middleware(app, middleware_config)

# Include routers
app.include_router(rbi_router)

# Global exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    logger.error(
        f"Unhandled exception in request {request_id}: {str(exc)}",
        exc_info=True
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error_code": 500,
            "error_message": "Internal server error",
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }
    )


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Handle 404 errors"""
    
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "error_code": 404,
            "error_message": f"Endpoint not found: {request.url.path}",
            "timestamp": datetime.now().isoformat()
        }
    )


@app.exception_handler(405)
async def method_not_allowed_handler(request: Request, exc):
    """Handle 405 errors"""
    
    return JSONResponse(
        status_code=405,
        content={
            "success": False,
            "error_code": 405,
            "error_message": f"Method {request.method} not allowed for {request.url.path}",
            "timestamp": datetime.now().isoformat()
        }
    )


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    
    return {
        "message": "Welcome to RBI Calculation API",
        "version": "1.0.0",
        "documentation": "/docs",
        "health_check": "/api/v1/rbi/health",
        "timestamp": datetime.now().isoformat()
    }


# API Information endpoint
@app.get("/info", tags=["Root"])
async def api_info():
    """Get API information and statistics"""
    
    return {
        "api_name": "RBI Calculation API",
        "version": "1.0.0",
        "description": "Risk-Based Inspection calculation and management system",
        "features": [
            "Single and batch RBI calculations",
            "Multi-level analysis (Level 1, 2, 3)",
            "Configuration management",
            "Pattern recognition",
            "Adaptive parameter adjustment",
            "Comprehensive reporting",
            "Audit trail"
        ],
        "endpoints": {
            "calculations": "/api/v1/rbi/calculate",
            "batch_calculations": "/api/v1/rbi/calculate/batch",
            "configuration": "/api/v1/rbi/configuration",
            "reports": "/api/v1/rbi/report",
            "patterns": "/api/v1/rbi/pattern",
            "parameters": "/api/v1/rbi/parameters",
            "health": "/api/v1/rbi/health"
        },
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_schema": "/openapi.json"
        },
        "support": {
            "email": "support@rbi-system.com",
            "documentation": "https://docs.rbi-system.com"
        },
        "timestamp": datetime.now().isoformat()
    }


# Metrics endpoint
@app.get("/metrics", tags=["Monitoring"])
async def get_metrics():
    """Get API metrics and statistics"""
    
    try:
        from app.domains.rbi.middleware.api_middleware import get_middleware_metrics
        metrics = get_middleware_metrics(app)
        
        return {
            "success": True,
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Failed to get metrics: {str(e)}")
        return {
            "success": False,
            "error": "Failed to retrieve metrics",
            "timestamp": datetime.now().isoformat()
        }


# Development server runner
if __name__ == "__main__":
    import uvicorn
    
    logger.info("🚀 Starting RBI API development server...")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True
    )
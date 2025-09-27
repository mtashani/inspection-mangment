"""
Centralized logging configuration for domain-specific API logging
Creates separate log files for each domain and provides error-level filtering
"""
import os
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Dict, Optional
import json
from datetime import datetime


class DomainLogger:
    """Centralized logger for domain-specific API error logging"""
    
    _loggers: Dict[str, logging.Logger] = {}
    _handlers: Dict[str, RotatingFileHandler] = {}
    
    @classmethod
    def setup_logging(cls):
        """Initialize logging configuration for all domains"""
        # Create logs directory if it doesn't exist
        logs_dir = Path(__file__).parent.parent.parent / "logs"
        logs_dir.mkdir(exist_ok=True)
        
        # Basic logging configuration
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    @classmethod
    def get_domain_logger(cls, domain_name: str) -> logging.Logger:
        """
        Get or create a domain-specific logger
        
        Args:
            domain_name: Name of the domain (e.g., 'inspector', 'maintenance', 'equipment')
            
        Returns:
            Logger configured for the specific domain
        """
        if domain_name not in cls._loggers:
            cls._create_domain_logger(domain_name)
        
        return cls._loggers[domain_name]
    
    @classmethod
    def _create_domain_logger(cls, domain_name: str):
        """Create a new domain-specific logger with file handler"""
        # Create logger
        logger = logging.getLogger(f"domain.{domain_name}")
        logger.setLevel(logging.ERROR)  # Only log ERROR level and above
        
        # Prevent duplicate logs from parent loggers
        logger.propagate = False
        
        # Create logs directory path - use absolute path
        backend_dir = Path(__file__).parent.parent.parent
        logs_dir = backend_dir / "logs"
        logs_dir.mkdir(exist_ok=True)
        
        log_file = logs_dir / f"{domain_name}_api_errors.log"
        
        print(f"📝 Creating log file at: {log_file}")
        
        # Create rotating file handler (10MB max, keep 5 backup files)
        handler = RotatingFileHandler(
            log_file,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        
        # Create detailed formatter for error tracking
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(funcName)s:%(lineno)d] - %(message)s'
        )
        handler.setFormatter(formatter)
        
        # Add handler to logger
        logger.addHandler(handler)
        
        # Store references
        cls._loggers[domain_name] = logger
        cls._handlers[domain_name] = handler
        
        # Log the creation
        logger.error(f"Domain logger '{domain_name}' initialized at {datetime.now()}")
        print(f"✅ Domain logger '{domain_name}' created successfully")
    
    @classmethod
    def log_api_error(
        cls, 
        domain_name: str, 
        endpoint: str, 
        method: str, 
        error: Exception, 
        request_data: Optional[dict] = None,
        user_id: Optional[int] = None,
        status_code: Optional[int] = None
    ):
        """
        Log an API error with detailed context
        
        Args:
            domain_name: Domain name (e.g., 'inspector')
            endpoint: API endpoint path
            method: HTTP method (GET, POST, etc.)
            error: The exception that occurred
            request_data: Request data that caused the error (optional)
            user_id: ID of the user who made the request (optional)
            status_code: HTTP status code (optional)
        """
        logger = cls.get_domain_logger(domain_name)
        
        # Create detailed error context
        error_context = {
            "timestamp": datetime.now().isoformat(),
            "domain": domain_name,
            "endpoint": endpoint,
            "method": method,
            "error_type": type(error).__name__,
            "error_message": getattr(error, 'detail', str(error)),
            "status_code": status_code,
            "user_id": user_id
        }
        
        # Add request data if provided (sanitize sensitive data)
        if request_data:
            sanitized_data = cls._sanitize_request_data(request_data)
            error_context["request_data"] = sanitized_data
        
        # Add stack trace for better debugging
        import traceback
        error_context["stack_trace"] = traceback.format_exc()
        
        # Log as JSON for easier parsing
        logger.error(json.dumps(error_context, indent=2, ensure_ascii=False))
    
    @classmethod
    def _sanitize_request_data(cls, data: dict) -> dict:
        """Remove sensitive data from request logging"""
        sensitive_fields = ['password', 'password_hash', 'token', 'secret', 'key']
        
        if not isinstance(data, dict):
            return str(data)[:200]  # Limit string length
        
        sanitized = {}
        for key, value in data.items():
            if any(sensitive in key.lower() for sensitive in sensitive_fields):
                sanitized[key] = "[REDACTED]"
            elif isinstance(value, dict):
                sanitized[key] = cls._sanitize_request_data(value)
            elif isinstance(value, (str, int, float, bool, type(None))):
                sanitized[key] = value
            else:
                sanitized[key] = str(value)[:100]  # Limit length for complex objects
        
        return sanitized
    
    @classmethod
    def log_validation_error(
        cls,
        domain_name: str,
        endpoint: str,
        method: str,
        validation_errors: list,
        request_data: Optional[dict] = None,
        user_id: Optional[int] = None
    ):
        """
        Log validation errors with detailed field information
        
        Args:
            domain_name: Domain name
            endpoint: API endpoint path
            method: HTTP method
            validation_errors: List of validation errors from Pydantic
            request_data: Original request data
            user_id: User ID who made the request
        """
        logger = cls.get_domain_logger(domain_name)
        
        validation_context = {
            "timestamp": datetime.now().isoformat(),
            "domain": domain_name,
            "endpoint": endpoint,
            "method": method,
            "error_type": "ValidationError",
            "user_id": user_id,
            "validation_errors": validation_errors
        }
        
        if request_data:
            validation_context["request_data"] = cls._sanitize_request_data(request_data)
        
        logger.error(f"VALIDATION_ERROR: {json.dumps(validation_context, indent=2, ensure_ascii=False)}")
    
    @classmethod
    def get_logs_summary(cls) -> dict:
        """Get a summary of all domain logs"""
        logs_dir = Path(__file__).parent.parent.parent / "logs"
        summary = {}
        
        for log_file in logs_dir.glob("*_api_errors.log"):
            domain_name = log_file.stem.replace("_api_errors", "")
            
            try:
                file_size = log_file.stat().st_size
                with open(log_file, 'r', encoding='utf-8') as f:
                    lines = len(f.readlines())
                
                summary[domain_name] = {
                    "file_path": str(log_file),
                    "file_size_mb": round(file_size / (1024*1024), 2),
                    "total_lines": lines,
                    "last_modified": datetime.fromtimestamp(log_file.stat().st_mtime).isoformat()
                }
            except Exception as e:
                summary[domain_name] = {"error": str(e)}
        
        return summary


# Initialize logging on import
DomainLogger.setup_logging()
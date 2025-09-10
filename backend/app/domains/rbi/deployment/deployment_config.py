"""RBI System Deployment Configuration"""

import os
from typing import Dict, Any, List
from dataclasses import dataclass
from enum import Enum


class DeploymentEnvironment(str, Enum):
    """Deployment environment types"""
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"


class DatabaseType(str, Enum):
    """Database types for deployment"""
    SQLITE = "sqlite"
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    SQLSERVER = "sqlserver"


@dataclass
class DatabaseConfig:
    """Database configuration"""
    type: DatabaseType
    host: str = "localhost"
    port: int = 5432
    database: str = "rbi_system"
    username: str = "rbi_user"
    password: str = ""
    connection_pool_size: int = 10
    connection_timeout: int = 30
    ssl_enabled: bool = False
    
    def get_connection_string(self) -> str:
        """Generate database connection string"""
        if self.type == DatabaseType.SQLITE:
            return f"sqlite:///{self.database}.db"
        elif self.type == DatabaseType.POSTGRESQL:
            return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"
        elif self.type == DatabaseType.MYSQL:
            return f"mysql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"
        elif self.type == DatabaseType.SQLSERVER:
            return f"mssql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"
        else:
            raise ValueError(f"Unsupported database type: {self.type}")


@dataclass
class SecurityConfig:
    """Security configuration"""
    enable_authentication: bool = True
    enable_authorization: bool = True
    enable_audit_trail: bool = True
    enable_encryption: bool = False
    jwt_secret_key: str = ""
    jwt_expiration_hours: int = 24
    password_min_length: int = 8
    max_login_attempts: int = 5
    session_timeout_minutes: int = 60
    
    def validate(self) -> List[str]:
        """Validate security configuration"""
        errors = []
        
        if self.enable_authentication and not self.jwt_secret_key:
            errors.append("JWT secret key is required when authentication is enabled")
        
        if self.password_min_length < 6:
            errors.append("Password minimum length should be at least 6 characters")
        
        if self.jwt_expiration_hours < 1:
            errors.append("JWT expiration should be at least 1 hour")
        
        return errors


@dataclass
class PerformanceConfig:
    """Performance configuration"""
    max_concurrent_calculations: int = 10
    calculation_timeout_seconds: int = 30
    batch_size_limit: int = 100
    memory_limit_mb: int = 1024
    cpu_limit_percent: int = 80
    cache_enabled: bool = True
    cache_ttl_minutes: int = 60
    
    def validate(self) -> List[str]:
        """Validate performance configuration"""
        errors = []
        
        if self.max_concurrent_calculations < 1:
            errors.append("Max concurrent calculations must be at least 1")
        
        if self.calculation_timeout_seconds < 5:
            errors.append("Calculation timeout should be at least 5 seconds")
        
        if self.batch_size_limit < 1:
            errors.append("Batch size limit must be at least 1")
        
        return errors


@dataclass
class LoggingConfig:
    """Logging configuration"""
    level: str = "INFO"
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    file_path: str = "logs/rbi_system.log"
    max_file_size_mb: int = 100
    backup_count: int = 5
    enable_console_logging: bool = True
    enable_file_logging: bool = True
    
    def validate(self) -> List[str]:
        """Validate logging configuration"""
        errors = []
        
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if self.level.upper() not in valid_levels:
            errors.append(f"Invalid logging level. Must be one of: {valid_levels}")
        
        if self.max_file_size_mb < 1:
            errors.append("Max file size must be at least 1 MB")
        
        return errors


class DeploymentConfig:
    """Complete deployment configuration"""
    
    def __init__(self, environment: DeploymentEnvironment = DeploymentEnvironment.DEVELOPMENT):
        self.environment = environment
        self.database = self._get_database_config()
        self.security = self._get_security_config()
        self.performance = self._get_performance_config()
        self.logging = self._get_logging_config()
        
        # Environment-specific settings
        self.debug = environment in [DeploymentEnvironment.DEVELOPMENT, DeploymentEnvironment.TESTING]
        self.testing = environment == DeploymentEnvironment.TESTING
        
        # API settings
        self.api_host = os.getenv("RBI_API_HOST", "0.0.0.0")
        self.api_port = int(os.getenv("RBI_API_PORT", "8000"))
        self.api_workers = int(os.getenv("RBI_API_WORKERS", "1"))
        
        # External integrations
        self.enable_external_integrations = environment != DeploymentEnvironment.DEVELOPMENT
        
    def _get_database_config(self) -> DatabaseConfig:
        """Get database configuration based on environment"""
        if self.environment == DeploymentEnvironment.DEVELOPMENT:
            return DatabaseConfig(
                type=DatabaseType.SQLITE,
                database="rbi_dev",
                connection_pool_size=5
            )
        elif self.environment == DeploymentEnvironment.TESTING:
            return DatabaseConfig(
                type=DatabaseType.SQLITE,
                database="rbi_test",
                connection_pool_size=2
            )
        elif self.environment == DeploymentEnvironment.STAGING:
            return DatabaseConfig(
                type=DatabaseType.POSTGRESQL,
                host=os.getenv("DB_HOST", "localhost"),
                port=int(os.getenv("DB_PORT", "5432")),
                database=os.getenv("DB_NAME", "rbi_staging"),
                username=os.getenv("DB_USER", "rbi_user"),
                password=os.getenv("DB_PASSWORD", ""),
                connection_pool_size=10,
                ssl_enabled=True
            )
        else:  # PRODUCTION
            return DatabaseConfig(
                type=DatabaseType.POSTGRESQL,
                host=os.getenv("DB_HOST", "localhost"),
                port=int(os.getenv("DB_PORT", "5432")),
                database=os.getenv("DB_NAME", "rbi_production"),
                username=os.getenv("DB_USER", "rbi_user"),
                password=os.getenv("DB_PASSWORD", ""),
                connection_pool_size=20,
                ssl_enabled=True
            )
    
    def _get_security_config(self) -> SecurityConfig:
        """Get security configuration based on environment"""
        if self.environment == DeploymentEnvironment.DEVELOPMENT:
            return SecurityConfig(
                enable_authentication=False,
                enable_authorization=False,
                enable_audit_trail=True,
                enable_encryption=False,
                jwt_secret_key="dev-secret-key-not-for-production",
                jwt_expiration_hours=24
            )
        elif self.environment == DeploymentEnvironment.TESTING:
            return SecurityConfig(
                enable_authentication=True,
                enable_authorization=True,
                enable_audit_trail=True,
                enable_encryption=False,
                jwt_secret_key="test-secret-key",
                jwt_expiration_hours=1
            )
        else:  # STAGING or PRODUCTION
            return SecurityConfig(
                enable_authentication=True,
                enable_authorization=True,
                enable_audit_trail=True,
                enable_encryption=True,
                jwt_secret_key=os.getenv("JWT_SECRET_KEY", ""),
                jwt_expiration_hours=8 if self.environment == DeploymentEnvironment.PRODUCTION else 24,
                password_min_length=12 if self.environment == DeploymentEnvironment.PRODUCTION else 8,
                max_login_attempts=3 if self.environment == DeploymentEnvironment.PRODUCTION else 5
            )
    
    def _get_performance_config(self) -> PerformanceConfig:
        """Get performance configuration based on environment"""
        if self.environment == DeploymentEnvironment.DEVELOPMENT:
            return PerformanceConfig(
                max_concurrent_calculations=5,
                calculation_timeout_seconds=60,
                batch_size_limit=50,
                memory_limit_mb=512,
                cpu_limit_percent=70,
                cache_enabled=False
            )
        elif self.environment == DeploymentEnvironment.TESTING:
            return PerformanceConfig(
                max_concurrent_calculations=2,
                calculation_timeout_seconds=30,
                batch_size_limit=20,
                memory_limit_mb=256,
                cpu_limit_percent=50,
                cache_enabled=False
            )
        elif self.environment == DeploymentEnvironment.STAGING:
            return PerformanceConfig(
                max_concurrent_calculations=10,
                calculation_timeout_seconds=45,
                batch_size_limit=100,
                memory_limit_mb=1024,
                cpu_limit_percent=80,
                cache_enabled=True,
                cache_ttl_minutes=30
            )
        else:  # PRODUCTION
            return PerformanceConfig(
                max_concurrent_calculations=20,
                calculation_timeout_seconds=30,
                batch_size_limit=200,
                memory_limit_mb=2048,
                cpu_limit_percent=85,
                cache_enabled=True,
                cache_ttl_minutes=60
            )
    
    def _get_logging_config(self) -> LoggingConfig:
        """Get logging configuration based on environment"""
        if self.environment == DeploymentEnvironment.DEVELOPMENT:
            return LoggingConfig(
                level="DEBUG",
                file_path="logs/rbi_dev.log",
                max_file_size_mb=50,
                backup_count=3,
                enable_console_logging=True
            )
        elif self.environment == DeploymentEnvironment.TESTING:
            return LoggingConfig(
                level="WARNING",
                file_path="logs/rbi_test.log",
                max_file_size_mb=10,
                backup_count=1,
                enable_console_logging=False
            )
        else:  # STAGING or PRODUCTION
            return LoggingConfig(
                level="INFO" if self.environment == DeploymentEnvironment.STAGING else "WARNING",
                file_path=f"logs/rbi_{self.environment.value}.log",
                max_file_size_mb=200,
                backup_count=10,
                enable_console_logging=False
            )
    
    def validate(self) -> List[str]:
        """Validate complete deployment configuration"""
        errors = []
        
        # Validate individual components
        errors.extend(self.security.validate())
        errors.extend(self.performance.validate())
        errors.extend(self.logging.validate())
        
        # Environment-specific validations
        if self.environment == DeploymentEnvironment.PRODUCTION:
            if not self.security.jwt_secret_key:
                errors.append("JWT secret key is required for production environment")
            
            if self.database.type == DatabaseType.SQLITE:
                errors.append("SQLite is not recommended for production environment")
            
            if not self.security.enable_encryption:
                errors.append("Encryption should be enabled in production environment")
        
        # API configuration validation
        if self.api_port < 1024 and os.getuid() != 0:  # Unix-like systems
            errors.append("Port numbers below 1024 require root privileges")
        
        return errors
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary"""
        return {
            'environment': self.environment.value,
            'debug': self.debug,
            'testing': self.testing,
            'api': {
                'host': self.api_host,
                'port': self.api_port,
                'workers': self.api_workers
            },
            'database': {
                'type': self.database.type.value,
                'host': self.database.host,
                'port': self.database.port,
                'database': self.database.database,
                'username': self.database.username,
                'connection_pool_size': self.database.connection_pool_size,
                'ssl_enabled': self.database.ssl_enabled
            },
            'security': {
                'enable_authentication': self.security.enable_authentication,
                'enable_authorization': self.security.enable_authorization,
                'enable_audit_trail': self.security.enable_audit_trail,
                'enable_encryption': self.security.enable_encryption,
                'jwt_expiration_hours': self.security.jwt_expiration_hours,
                'password_min_length': self.security.password_min_length,
                'max_login_attempts': self.security.max_login_attempts
            },
            'performance': {
                'max_concurrent_calculations': self.performance.max_concurrent_calculations,
                'calculation_timeout_seconds': self.performance.calculation_timeout_seconds,
                'batch_size_limit': self.performance.batch_size_limit,
                'memory_limit_mb': self.performance.memory_limit_mb,
                'cpu_limit_percent': self.performance.cpu_limit_percent,
                'cache_enabled': self.performance.cache_enabled,
                'cache_ttl_minutes': self.performance.cache_ttl_minutes
            },
            'logging': {
                'level': self.logging.level,
                'file_path': self.logging.file_path,
                'max_file_size_mb': self.logging.max_file_size_mb,
                'backup_count': self.logging.backup_count,
                'enable_console_logging': self.logging.enable_console_logging,
                'enable_file_logging': self.logging.enable_file_logging
            },
            'external_integrations': self.enable_external_integrations
        }
    
    @classmethod
    def from_environment(cls, env_name: str = None) -> 'DeploymentConfig':
        """Create configuration from environment variable"""
        env_name = env_name or os.getenv("RBI_ENVIRONMENT", "development")
        
        try:
            environment = DeploymentEnvironment(env_name.lower())
        except ValueError:
            environment = DeploymentEnvironment.DEVELOPMENT
        
        return cls(environment)
    
    def save_to_file(self, file_path: str):
        """Save configuration to file"""
        import json
        
        config_dict = self.to_dict()
        
        # Remove sensitive information
        if 'password' in config_dict.get('database', {}):
            config_dict['database']['password'] = '***'
        
        with open(file_path, 'w') as f:
            json.dump(config_dict, f, indent=2)


# Predefined configurations for different environments
DEVELOPMENT_CONFIG = DeploymentConfig(DeploymentEnvironment.DEVELOPMENT)
TESTING_CONFIG = DeploymentConfig(DeploymentEnvironment.TESTING)
STAGING_CONFIG = DeploymentConfig(DeploymentEnvironment.STAGING)
PRODUCTION_CONFIG = DeploymentConfig(DeploymentEnvironment.PRODUCTION)


def get_deployment_config(environment: str = None) -> DeploymentConfig:
    """Get deployment configuration for specified environment"""
    return DeploymentConfig.from_environment(environment)
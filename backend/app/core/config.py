import os
import pathlib
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings using Pydantic v2 BaseSettings"""
    
    # API
    API_V1_STR: str = "/api/v1"
    
    # Authentication
    SECRET_KEY: str = "your-secret-key-for-local-development-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # Database settings
    DB_ENV: str = "development"
    SQLITE_DB_PATH: str = "backend/inspection_management.db"
    SQLITE_URL: str = f"sqlite:///backend/inspection_management.db"
    DATABASE_URL: str = f"sqlite:///backend/inspection_management.db"
    AUTO_RESET_DB: bool = False
    SQL_ECHO: bool = False
    
    # Storage - Use local storage during development
    STORAGE_TYPE: str = "local"  # "s3" or "local"
    S3_BUCKET_NAME: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_REGION: Optional[str] = None
    S3_ENDPOINT_URL: Optional[str] = None  # For non-AWS S3-compatible services
    LOCAL_STORAGE_PATH: str = "./storage"
    
    # Admin settings
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin"
    ADMIN_EMAIL: str = "admin@example.com"
    
    # Development settings
    DEBUG: bool = False
    
    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
        "extra": "ignore"  # Allow extra fields in .env file
    }

    def init_storage_path(self):
        """Initialize local storage directory if it doesn't exist"""
        if self.STORAGE_TYPE == "local":
            os.makedirs(self.LOCAL_STORAGE_PATH, exist_ok=True)


# Create settings instance
settings = Settings()

# Initialize storage path
settings.init_storage_path()
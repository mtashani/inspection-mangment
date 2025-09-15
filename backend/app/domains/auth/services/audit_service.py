"""
Audit service for comprehensive logging of authentication and authorization events
"""

import logging
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
from sqlmodel import Session, SQLModel, Field
from sqlalchemy import Column, DateTime, String, Integer, Text, Boolean

class AuditEventType(str, Enum):
    """Types of audit events"""
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILURE = "login_failure"
    LOGOUT = "logout"
    PERMISSION_GRANTED = "permission_granted"
    PERMISSION_DENIED = "permission_denied"
    ROLE_ASSIGNED = "role_assigned"
    ROLE_REMOVED = "role_removed"
    PERMISSION_ASSIGNED = "permission_assigned"
    PERMISSION_REMOVED = "permission_removed"
    TOKEN_REFRESH = "token_refresh"
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_UNLOCKED = "account_unlocked"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"

class AuditLog(SQLModel, table=True):
    """Audit log model for tracking security events"""
    __tablename__ = "audit_logs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Event information
    event_type: AuditEventType = Field(sa_column=Column(String, index=True))
    event_description: str = Field(sa_column=Column(Text))
    
    # User information
    inspector_id: Optional[int] = Field(default=None, index=True)
    inspector_username: Optional[str] = Field(default=None, index=True)
    
    # Request information
    ip_address: Optional[str] = Field(default=None, index=True)
    user_agent: Optional[str] = Field(default=None)
    endpoint: Optional[str] = Field(default=None, index=True)
    http_method: Optional[str] = Field(default=None)
    
    # Permission/Role information
    resource: Optional[str] = Field(default=None, index=True)
    action: Optional[str] = Field(default=None, index=True)
    role_name: Optional[str] = Field(default=None)
    permission_name: Optional[str] = Field(default=None)
    
    # Result information
    success: bool = Field(default=True, index=True)
    error_message: Optional[str] = Field(default=None)
    
    # Additional context
    additional_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(Text))
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime, index=True))

class AuditService:
    """Service for handling audit logging"""
    
    @staticmethod
    def setup_audit_logger() -> logging.Logger:
        """Set up dedicated audit logger"""
        audit_logger = logging.getLogger("audit")
        audit_logger.setLevel(logging.INFO)
        
        # Create file handler for audit logs
        handler = logging.FileHandler("backend/logs/audit.log")
        handler.setLevel(logging.INFO)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - AUDIT - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        
        # Add handler to logger
        if not audit_logger.handlers:
            audit_logger.addHandler(handler)
        
        return audit_logger
    
    @staticmethod
    async def log_event(
        db: Session,
        event_type: AuditEventType,
        description: str,
        inspector_id: Optional[int] = None,
        inspector_username: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        endpoint: Optional[str] = None,
        http_method: Optional[str] = None,
        resource: Optional[str] = None,
        action: Optional[str] = None,
        role_name: Optional[str] = None,
        permission_name: Optional[str] = None,
        success: bool = True,
        error_message: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """Log an audit event to database and file"""
        
        # Create audit log entry
        audit_entry = AuditLog(
            event_type=event_type,
            event_description=description,
            inspector_id=inspector_id,
            inspector_username=inspector_username,
            ip_address=ip_address,
            user_agent=user_agent,
            endpoint=endpoint,
            http_method=http_method,
            resource=resource,
            action=action,
            role_name=role_name,
            permission_name=permission_name,
            success=success,
            error_message=error_message,
            additional_data=additional_data
        )
        
        # Save to database
        try:
            db.add(audit_entry)
            db.commit()
            db.refresh(audit_entry)
        except Exception as e:
            logging.error(f"Failed to save audit log to database: {e}")
            db.rollback()
        
        # Log to file
        audit_logger = AuditService.setup_audit_logger()
        log_message = AuditService._format_audit_message(audit_entry)
        
        if success:
            audit_logger.info(log_message)
        else:
            audit_logger.warning(log_message)
        
        return audit_entry
    
    @staticmethod
    def _format_audit_message(audit_entry: AuditLog) -> str:
        """Format audit entry for logging"""
        parts = [
            f"Event: {audit_entry.event_type}",
            f"Description: {audit_entry.event_description}"
        ]
        
        if audit_entry.inspector_id:
            parts.append(f"Inspector: {audit_entry.inspector_id} ({audit_entry.inspector_username})")
        
        if audit_entry.ip_address:
            parts.append(f"IP: {audit_entry.ip_address}")
        
        if audit_entry.endpoint:
            parts.append(f"Endpoint: {audit_entry.http_method} {audit_entry.endpoint}")
        
        if audit_entry.resource and audit_entry.action:
            parts.append(f"Permission: {audit_entry.resource}:{audit_entry.action}")
        
        if audit_entry.role_name:
            parts.append(f"Role: {audit_entry.role_name}")
        
        if not audit_entry.success and audit_entry.error_message:
            parts.append(f"Error: {audit_entry.error_message}")
        
        return " | ".join(parts)
    
    @staticmethod
    async def log_login_success(
        db: Session,
        inspector_id: int,
        inspector_username: str,
        ip_address: str,
        user_agent: Optional[str] = None
    ):
        """Log successful login"""
        await AuditService.log_event(
            db=db,
            event_type=AuditEventType.LOGIN_SUCCESS,
            description=f"Inspector {inspector_username} logged in successfully",
            inspector_id=inspector_id,
            inspector_username=inspector_username,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True
        )
    
    @staticmethod
    async def log_login_failure(
        db: Session,
        username: str,
        ip_address: str,
        error_message: str,
        user_agent: Optional[str] = None
    ):
        """Log failed login attempt"""
        await AuditService.log_event(
            db=db,
            event_type=AuditEventType.LOGIN_FAILURE,
            description=f"Failed login attempt for username: {username}",
            inspector_username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            success=False,
            error_message=error_message
        )
    
    @staticmethod
    async def log_permission_check(
        db: Session,
        inspector_id: int,
        inspector_username: str,
        resource: str,
        action: str,
        granted: bool,
        ip_address: Optional[str] = None,
        endpoint: Optional[str] = None,
        http_method: Optional[str] = None
    ):
        """Log permission check result"""
        event_type = AuditEventType.PERMISSION_GRANTED if granted else AuditEventType.PERMISSION_DENIED
        description = f"Permission {resource}:{action} {'granted' if granted else 'denied'} for {inspector_username}"
        
        await AuditService.log_event(
            db=db,
            event_type=event_type,
            description=description,
            inspector_id=inspector_id,
            inspector_username=inspector_username,
            ip_address=ip_address,
            endpoint=endpoint,
            http_method=http_method,
            resource=resource,
            action=action,
            success=granted,
            error_message=None if granted else f"Insufficient permissions for {resource}:{action}"
        )
    
    @staticmethod
    async def log_role_assignment(
        db: Session,
        target_inspector_id: int,
        target_inspector_username: str,
        role_name: str,
        assigned_by_id: int,
        assigned_by_username: str,
        ip_address: Optional[str] = None
    ):
        """Log role assignment"""
        await AuditService.log_event(
            db=db,
            event_type=AuditEventType.ROLE_ASSIGNED,
            description=f"Role '{role_name}' assigned to {target_inspector_username} by {assigned_by_username}",
            inspector_id=assigned_by_id,
            inspector_username=assigned_by_username,
            ip_address=ip_address,
            role_name=role_name,
            additional_data={
                "target_inspector_id": target_inspector_id,
                "target_inspector_username": target_inspector_username
            }
        )
    
    @staticmethod
    async def log_role_removal(
        db: Session,
        target_inspector_id: int,
        target_inspector_username: str,
        role_name: str,
        removed_by_id: int,
        removed_by_username: str,
        ip_address: Optional[str] = None
    ):
        """Log role removal"""
        await AuditService.log_event(
            db=db,
            event_type=AuditEventType.ROLE_REMOVED,
            description=f"Role '{role_name}' removed from {target_inspector_username} by {removed_by_username}",
            inspector_id=removed_by_id,
            inspector_username=removed_by_username,
            ip_address=ip_address,
            role_name=role_name,
            additional_data={
                "target_inspector_id": target_inspector_id,
                "target_inspector_username": target_inspector_username
            }
        )
    
    @staticmethod
    async def log_suspicious_activity(
        db: Session,
        description: str,
        inspector_id: Optional[int] = None,
        inspector_username: Optional[str] = None,
        ip_address: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None
    ):
        """Log suspicious activity"""
        await AuditService.log_event(
            db=db,
            event_type=AuditEventType.SUSPICIOUS_ACTIVITY,
            description=description,
            inspector_id=inspector_id,
            inspector_username=inspector_username,
            ip_address=ip_address,
            success=False,
            additional_data=additional_data
        )
    
    @staticmethod
    async def get_audit_logs(
        db: Session,
        inspector_id: Optional[int] = None,
        event_type: Optional[AuditEventType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[AuditLog]:
        """Retrieve audit logs with filtering"""
        from sqlmodel import select
        
        query = select(AuditLog)
        
        if inspector_id:
            query = query.where(AuditLog.inspector_id == inspector_id)
        
        if event_type:
            query = query.where(AuditLog.event_type == event_type)
        
        if start_date:
            query = query.where(AuditLog.created_at >= start_date)
        
        if end_date:
            query = query.where(AuditLog.created_at <= end_date)
        
        query = query.order_by(AuditLog.created_at.desc())
        query = query.offset(offset).limit(limit)
        
        result = db.exec(query)
        return result.all()
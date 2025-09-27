"""
Logging management API for viewing and managing domain logs
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlmodel import Session
import json
from pathlib import Path
from datetime import datetime

from app.database import get_session
from app.domains.auth.dependencies import require_standardized_permission
from app.domains.inspector.models.inspector import Inspector
from app.core.logging_config import DomainLogger

router = APIRouter()


@router.get("/logs/summary")
def get_logs_summary(
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Get summary of all domain logs
    
    Requires system_superadmin permission.
    """
    try:
        summary = DomainLogger.get_logs_summary()
        return {
            "success": True,
            "logs_summary": summary,
            "total_domains": len(summary)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get logs summary: {str(e)}"
        )


@router.get("/logs/{domain_name}")
def get_domain_logs(
    domain_name: str,
    lines: int = Query(50, ge=1, le=1000, description="Number of recent lines to return"),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Get recent logs for a specific domain
    
    Requires system_superadmin permission.
    """
    try:
        logs_dir = Path(__file__).parent.parent.parent.parent / "logs"
        log_file = logs_dir / f"{domain_name}_api_errors.log"
        
        if not log_file.exists():
            return {
                "success": True,
                "domain": domain_name,
                "logs": [],
                "message": f"No error logs found for domain '{domain_name}'"
            }
        
        # Read last N lines from file
        with open(log_file, 'r', encoding='utf-8') as f:
            all_lines = f.readlines()
            recent_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
        
        # Parse JSON logs if possible
        parsed_logs = []
        for line in recent_lines:
            line = line.strip()
            if line:
                try:
                    # Try to parse as JSON
                    log_entry = json.loads(line.split(' - ', 3)[-1]) if ' - ' in line else {"raw": line}
                    parsed_logs.append({
                        "timestamp": line.split(' - ')[0] if ' - ' in line else "unknown",
                        "content": log_entry
                    })
                except json.JSONDecodeError:
                    # If not JSON, treat as raw text
                    parsed_logs.append({
                        "timestamp": line.split(' - ')[0] if ' - ' in line else "unknown",
                        "content": {"raw": line}
                    })
        
        return {
            "success": True,
            "domain": domain_name,
            "logs": parsed_logs,
            "total_entries": len(parsed_logs),
            "file_path": str(log_file)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get logs for domain '{domain_name}': {str(e)}"
        )


@router.post("/logs/test-error/{domain_name}")
def test_domain_logging(
    domain_name: str,
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Test logging system by creating a test error log
    
    Requires system_superadmin permission.
    """
    try:
        # Create a test error
        test_error = Exception(f"Test error for domain '{domain_name}' at {datetime.now()}")
        
        DomainLogger.log_api_error(
            domain_name=domain_name,
            endpoint="/logs/test-error",
            method="POST",
            error=test_error,
            request_data={"test": True, "domain": domain_name},
            user_id=current_inspector.id,
            status_code=500
        )
        
        return {
            "success": True,
            "message": f"Test error logged for domain '{domain_name}'",
            "domain": domain_name,
            "user_id": current_inspector.id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to test logging for domain '{domain_name}': {str(e)}"
        )


@router.delete("/logs/{domain_name}")
def clear_domain_logs(
    domain_name: str,
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Clear logs for a specific domain
    
    Requires system_superadmin permission.
    """
    try:
        logs_dir = Path(__file__).parent.parent.parent.parent / "logs"
        log_file = logs_dir / f"{domain_name}_api_errors.log"
        
        if log_file.exists():
            # Clear the file content but keep the file
            with open(log_file, 'w', encoding='utf-8') as f:
                f.write(f"# Log cleared at {datetime.now().isoformat()} by user {current_inspector.id}\n")
            
            return {
                "success": True,
                "message": f"Logs cleared for domain '{domain_name}'",
                "domain": domain_name
            }
        else:
            return {
                "success": True,
                "message": f"No logs found for domain '{domain_name}'",
                "domain": domain_name
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear logs for domain '{domain_name}': {str(e)}"
        )
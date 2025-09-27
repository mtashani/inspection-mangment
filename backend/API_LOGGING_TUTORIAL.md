# API Logging System Tutorial

This tutorial explains how to add automatic error logging to any domain's API endpoints.

## What This System Does

- **Automatic Error Logging**: Captures all API errors (400, 500, validation errors) automatically
- **Domain-Specific Log Files**: Each domain gets its own log file (e.g., `inspector_api_errors.log`, `maintenance_api_errors.log`)
- **Detailed Error Context**: Logs include request data, user info, stack traces, and timestamps
- **Error-Only Filtering**: Only logs ERROR level messages to avoid cluttering
- **File Rotation**: Automatic log rotation (10MB max, keeps 5 backup files)

## How to Add Logging to Your Domain

### Step 1: Import the Decorator

Add this import to your API file:

```python
from app.core.api_logging import log_api_errors
```

### Step 2: Add Decorator to Endpoints

Add the `@log_api_errors("your_domain_name")` decorator to all your API endpoints:

```python
from app.core.api_logging import log_api_errors

@log_api_errors("maintenance")  # Replace with your domain name
@router.post("/events")
def create_maintenance_event(
    event_data: MaintenanceEventCreateRequest,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("maintenance_edit"))
):
    # Your existing API logic here
    pass

@log_api_errors("maintenance")
@router.get("/events/{event_id}")
def get_maintenance_event(
    event_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    # Your existing API logic here
    pass
```

### Step 3: That's It!

The decorator automatically:
- Catches all exceptions (HTTPException, ValidationError, generic Exception)
- Logs detailed error context to `logs/your_domain_api_errors.log`
- Re-raises the original exception (doesn't change your API behavior)
- Sanitizes sensitive data (passwords, tokens, etc.)

## What Gets Logged

Each error log entry includes:
```json
{
  "timestamp": "2025-01-15T10:30:45",
  "domain": "maintenance", 
  "endpoint": "/api/v1/maintenance/events",
  "method": "POST",
  "error_type": "ValidationError",
  "error_message": "Field 'title' is required",
  "status_code": 422,
  "user_id": 123,
  "request_data": {
    "description": "Test event",
    "password": "[REDACTED]"
  },
  "stack_trace": "Full stack trace here..."
}
```

## Domain Examples

### For Equipment Domain:
```python
from app.core.api_logging import log_api_errors

@log_api_errors("equipment")
@router.post("/equipment")
def create_equipment(...):
    pass
```

### For Maintenance Domain:
```python
from app.core.api_logging import log_api_errors

@log_api_errors("maintenance") 
@router.get("/events")
def get_maintenance_events(...):
    pass
```

### For Inspection Domain:
```python
from app.core.api_logging import log_api_errors

@log_api_errors("inspection")
@router.post("/inspections")
def create_inspection(...):
    pass
```

## Manual Logging (Optional)

For custom logging outside of API endpoints:

```python
from app.core.api_logging import log_domain_error, log_domain_validation_error

# Log a custom error
log_domain_error(
    domain_name="maintenance",
    endpoint="/custom/operation", 
    method="POST",
    error=exception_object,
    request_data={"some": "data"},
    user_id=user.id,
    status_code=500
)

# Log validation errors
log_domain_validation_error(
    domain_name="maintenance",
    endpoint="/custom/validation",
    method="POST", 
    validation_errors=[{"field": "title", "message": "Required"}],
    request_data=request_data,
    user_id=user.id
)
```

## Viewing Logs

### Admin API Endpoints (Requires system_superadmin permission):

1. **Get logs summary**: `GET /api/v1/admin/logs/summary`
2. **View domain logs**: `GET /api/v1/admin/logs/{domain_name}?lines=100`
3. **Test logging**: `POST /api/v1/admin/logs/test-error/{domain_name}`
4. **Clear logs**: `DELETE /api/v1/admin/logs/{domain_name}`

### Direct File Access:
Log files are stored in: `backend/logs/{domain_name}_api_errors.log`

## Best Practices

1. **Use descriptive domain names**: Use the same name as your domain folder (e.g., "inspector", "maintenance", "equipment")

2. **Don't remove existing error handling**: The decorator works alongside your existing try/catch blocks

3. **One decorator per endpoint**: Each API endpoint should have exactly one `@log_api_errors` decorator

4. **Place decorator correctly**: Put `@log_api_errors` right before the `@router` decorator:
   ```python
   @log_api_errors("maintenance")
   @router.post("/events") 
   def create_event(...):
   ```

5. **Test your logging**: Use the test endpoint to verify logging works for your domain

## Troubleshooting

### Common Issues:

1. **Import Error**: Make sure the import path is correct:
   ```python
   from app.core.api_logging import log_api_errors
   ```

2. **Decorator Order**: Put `@log_api_errors` before `@router`:
   ```python
   # ✅ Correct
   @log_api_errors("maintenance")
   @router.post("/events")
   
   # ❌ Wrong  
   @router.post("/events")
   @log_api_errors("maintenance")
   ```

3. **Domain Name**: Use consistent, lowercase domain names without spaces

4. **Permissions**: Log viewing requires `system_superadmin` permission

### Testing Your Implementation:

1. Add the decorator to a few endpoints
2. Make a request that causes an error (e.g., missing required field)
3. Check the log file: `backend/logs/your_domain_api_errors.log`
4. Verify the error is logged with proper context

That's it! Your domain will now have comprehensive error logging to help debug API issues. 🎉
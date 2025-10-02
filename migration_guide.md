# Domain-Based Error Logging Migration Guide

## Overview

This guide provides step-by-step instructions for migrating an existing FastAPI project to a domain-based error logging system. The system automatically captures and logs API errors with domain-specific context, including endpoint, method, user ID, request data, and stack traces.

## Prerequisites

Before beginning the migration, ensure the following components are in place:

1. `api_logging.py` - Contains the `@log_api_errors(domain_name)` decorator and helper functions
2. `logging_config.py` - Sets up domain-specific loggers with rotating file handlers
3. `main.py` - Integrates global exception handlers for 415 errors

## Migration Steps

### 1. Apply Logging Decorator to All Endpoints

For every API endpoint in each domain, add the `@log_api_errors("<domain_name>")` decorator **before** the `@router` decorator.

**Before:**
```python
@router.get("/events")
def get_maintenance_events(...):
    ...
```

**After:**
```python
@log_api_errors("maintenance")
@router.get("/events")
def get_maintenance_events(...):
    ...
```

### 2. Remove Legacy Logging

Delete all legacy logging code:
- Remove `logging.error`, `logging.info`, and custom logger usage from endpoints
- Remove manual instantiation of loggers (`logger = logging.getLogger(__name__)`)
- Replace ad-hoc error logging with `log_domain_error` or `log_domain_validation_error` if needed outside decorators

### 3. Ensure Domain Naming Consistency

Always use lowercase domain names matching the folder name:
- ✅ `"inspector"` for `backend/app/domains/inspector/`
- ✅ `"maintenance"` for `backend/app/domains/maintenance/`
- ✅ `"equipment"` for `backend/app/domains/equipment/`

### 4. Integrate Global Exception Handlers

Ensure `add_global_exception_handlers(app)` is called in `main.py` to catch 415 errors that occur at the ASGI level.

### 5. Validate Error Capture

All errors (400, 401, 403, 404, 415, 422, 500) will be automatically logged by the decorator. Manual logging helpers (`log_domain_error`, `log_domain_validation_error`) can be used for custom error scenarios.

### 6. Add Failing Test Requests

For each domain, add a failing test request to verify logs are written to `backend/logs/{domain}_api_errors.log`.

## Common Pitfalls

### 1. Decorator Order
Always place `@log_api_errors("<domain>")` **before** `@router`:
```python
# ❌ Wrong
@router.get("/events")
@log_api_errors("maintenance")
def get_maintenance_events(...):

# ✅ Correct
@log_api_errors("maintenance")
@router.get("/events")
def get_maintenance_events(...):
```

### 2. Domain Name Mismatches
Use exact lowercase folder names:
```python
# ❌ Wrong
@log_api_errors("Maintenance")  # Capitalized
@log_api_errors("insp")         # Abbreviated

# ✅ Correct
@log_api_errors("inspector")
@log_api_errors("maintenance")
@log_api_errors("equipment")
```

### 3. Legacy Logging Leftovers
Remove all manual logging:
```python
# ❌ Wrong
logger = logging.getLogger(__name__)
logger.error("Something went wrong")

# ✅ Correct - Let the decorator handle it
# No manual logging needed
```

### 4. Missing Request Extraction
Ensure endpoints accept `Request` or user objects if you want user/request context in logs:
```python
# ✅ Good - includes user context
@log_api_errors("inspector")
@router.get("/profile")
def get_profile(
    current_user: User = Depends(get_current_user)
):
    ...

# ✅ Good - includes request context
@log_api_errors("maintenance")
@router.post("/events")
def create_event(
    request: Request,  # Required for request context
    event_data: EventCreateRequest
):
    ...
```

## Best Practices

### 1. Consistent Application
Apply the decorator to **every** endpoint in **every** domain without exception.

### 2. Sanitization Trust
Rely on built-in sanitization for sensitive fields (passwords, tokens, keys) - no need for manual redaction.

### 3. Testing Regularly
Regularly test error scenarios per domain and verify log output in `backend/logs/{domain}_api_errors.log`.

### 4. Documentation
Document logging conventions for new contributors in your project README or wiki.

### 5. Monitoring
Periodically review log files for completeness and anomalies using log analysis tools.

### 6. Refactoring Safety
When refactoring code, remove unused/legacy logging code to prevent confusion.

## Example Implementation

### Equipment Domain (`backend/app/domains/equipment/api/equipment.py`)

```python
from app.core.api_logging import log_api_errors

@log_api_errors("equipment")
@router.get("/", response_model=List[Equipment])
def get_equipment(
    skip: int = 0,
    limit: int = 10,
    tag: Optional[str] = None,
    equipment_type: Optional[str] = None,
    unit: Optional[str] = None,
    train: Optional[str] = None,
    db: Session = Depends(get_session)
):
    """Get list of equipment with optional filtering"""
    query = select(Equipment)
    
    if tag:
        query = query.filter(Equipment.tag.contains(tag))
    if equipment_type:
        query = query.filter(Equipment.equipment_type.contains(equipment_type))
    if unit:
        query = query.filter(Equipment.unit.contains(unit))
    if train:
        query = query.filter(Equipment.train.contains(train))
        
    return db.exec(query.offset(skip).limit(limit)).all()

@log_api_errors("equipment")
@router.post("/", response_model=Equipment)
def create_equipment(
    equipment: Equipment,
    db: Session = Depends(get_session)
):
    """Create new equipment"""
    db.add(equipment)
    try:
        db.commit()
        db.refresh(equipment)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return equipment
```

### Maintenance Domain (`backend/app/domains/maintenance/api/maintenance_routes.py`)

```python
from app.core.api_logging import log_api_errors

@log_api_errors("maintenance")
@router.get("/events", response_model=List[Dict[str, Any]])
def get_maintenance_events(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    event_type: Optional[MaintenanceEventType] = Query(None, description="Filter by event type"),
    status: Optional[MaintenanceEventStatus] = Query(None, description="Filter by status"),
    from_date: Optional[date] = Query(None, description="Filter events from this date"),
    to_date: Optional[date] = Query(None, description="Filter events to this date"),
    session: Session = Depends(get_session)
):
    """Get list of maintenance events with filtering options"""
    try:
        query = select(MaintenanceEvent)
        
        # Apply filters
        if event_type:
            query = query.where(MaintenanceEvent.event_type == event_type)
        if status:
            query = query.where(MaintenanceEvent.status == status)
        if from_date:
            query = query.where(MaintenanceEvent.planned_start_date >= from_date)
        if to_date:
            query = query.where(MaintenanceEvent.planned_start_date <= to_date)
        
        # Order by creation date (newest first)
        query = query.order_by(MaintenanceEvent.created_at.desc())
        
        # Apply pagination
        events = session.exec(query.offset(skip).limit(limit)).all()
        
        # Prepare response with sub-events count
        response = []
        for event in events:
            # Get sub-events count
            sub_events_count = len(list(session.exec(
                select(MaintenanceSubEvent).where(MaintenanceSubEvent.parent_event_id == event.id)
            ).all()))
            
            # Get inspections count - both direct inspections and sub-event inspections
            from app.domains.inspection.models.inspection import Inspection
            direct_inspections_count = len(list(session.exec(
                select(Inspection).where(Inspection.maintenance_event_id == event.id)
            ).all()))
            
            sub_event_inspections_count = 0
            if sub_events_count > 0:
                # Get all sub-events for this event
                sub_events = session.exec(
                    select(MaintenanceSubEvent).where(MaintenanceSubEvent.parent_event_id == event.id)
                ).all()
                
                for sub_event in sub_events:
                    sub_inspections = len(list(session.exec(
                        select(Inspection).where(Inspection.maintenance_sub_event_id == sub_event.id)
                    ).all()))
                    sub_event_inspections_count += sub_inspections
            
            # Total inspections count
            inspections_count = direct_inspections_count + sub_event_inspections_count
            
            response.append({
                "id": event.id,
                "event_number": event.event_number,
                "title": event.title,
                "description": event.description,
                "event_type": event.event_type,
                "event_category": event.event_category,
                "status": event.status,
                "planned_start_date": event.planned_start_date,
                "planned_end_date": event.planned_end_date,
                "actual_start_date": event.actual_start_date,
                "actual_end_date": event.actual_end_date,
                "created_by": event.created_by,
                "approved_by": event.approved_by,
                "approval_date": event.approval_date,
                "notes": event.notes,
                "sub_events_count": sub_events_count,
                "inspections_count": inspections_count,
                "direct_inspections_count": direct_inspections_count,
                "created_at": event.created_at,
                "updated_at": event.updated_at
            })
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to get maintenance events: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get maintenance events: {str(e)}")
```

### Inspector Domain (`backend/app/domains/inspector/api/inspector.py`)

```python
from app.core.api_logging import log_api_errors

@log_api_errors("inspector")
@router.get("/", response_model=List[InspectorResponse])
def get_inspectors(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search in name, employee_id, email"),
    active_only: bool = Query(True, description="Show only active inspectors"),
    can_login_only: Optional[bool] = Query(None, description="Filter by login capability"),
    attendance_tracking: Optional[bool] = Query(None, description="Filter by attendance tracking"),
    sort_by: str = Query("last_name", description="Sort field"),
    sort_order: str = Query("asc", description="Sort order (asc/desc)"),
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_hr_manage"))
):
    """
    Get paginated list of inspectors with advanced filtering and search.
    
    Requires system_hr_manage permission.
    """
    try:
        # Build base query - get inspectors with roles loaded
        # Note: We'll load roles separately to avoid complex eager loading issues
        query = select(Inspector)
        
        # Apply filters
        if search:
            search_filter = or_(
                Inspector.first_name.contains(search),
                Inspector.last_name.contains(search),
                Inspector.employee_id.contains(search),
                Inspector.email.contains(search),
                Inspector.national_id.contains(search)
            )
            query = query.where(search_filter)
        
        if active_only:
            query = query.where(Inspector.active == True)
        
        if can_login_only is not None:
            query = query.where(Inspector.can_login == can_login_only)
        
        if attendance_tracking is not None:
            query = query.where(Inspector.attendance_tracking_enabled == attendance_tracking)
        
        # Apply sorting
        sort_field = getattr(Inspector, sort_by, Inspector.last_name)
        if sort_order.lower() == "desc":
            query = query.order_by(sort_field.desc())
        else:
            query = query.order_by(sort_field.asc())
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)
        
        # Execute query
        inspectors = db.exec(query).all()
        
        # Load roles for each inspector separately to avoid SQLAlchemy relationship issues
        inspector_responses = []
        for inspector in inspectors:
            # Get roles for this inspector
            from app.domains.inspector.models.authorization import InspectorRole, Role
            roles_query = select(InspectorRole, Role).where(
                InspectorRole.inspector_id == inspector.id
            ).join(Role, InspectorRole.role_id == Role.id)
            
            role_results = db.exec(roles_query).all()
            role_names = [role.name for _, role in role_results]
            
            # Create response with roles
            response_data = InspectorResponse.from_model(inspector)
            response_data.roles = role_names
            inspector_responses.append(response_data)
        
        logging.info(
            f"Inspector list requested by {current_inspector.id}: "
            f"page={page}, size={page_size}, search={search}"
        )
        
        return inspector_responses
        
    except Exception as e:
        logging.error(f"Failed to get inspectors: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve inspectors: {str(e)}")
```

## Verification

After migration, verify the system works correctly:

1. Check that log files are created in `backend/logs/` for each domain
2. Trigger intentional errors in each domain and verify they appear in the correct log files
3. Ensure sensitive data is properly sanitized in logs
4. Confirm that all HTTP status codes (400-500) are captured
5. Test global exception handlers for 415 errors

## Troubleshooting

### No Logs Generated
- Verify the decorator is applied to all endpoints
- Check that domain names match folder names exactly
- Ensure the logging directory is writable

### Incorrect Log Files
- Double-check domain names in decorators
- Verify folder structure matches domain names
- Confirm no typos in domain names

### Missing Context Data
- Ensure endpoints accept `Request` or user objects when context is needed
- Check that user authentication middleware is properly configured
- Verify request data extraction logic in the decorator

### Performance Issues
- Review log file rotation settings in `logging_config.py`
- Check disk space on the logging volume
- Monitor log file sizes and adjust rotation parameters if needed

## Conclusion

This domain-based error logging system provides comprehensive error tracking with minimal code changes. By following these migration steps and best practices, you'll have a robust logging infrastructure that makes debugging significantly easier and provides valuable insights into API usage and error patterns.

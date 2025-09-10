# 🔧 API Error Fix: Inspection Creation Issue

## 🔍 Problem Analysis

User reported: `ApiError: [object Object]` when creating planned inspections.

### Root Cause
The frontend and backend have a mismatch in the inspection creation API:

**Frontend sends:**
- `planned_date` (string) 
- `maintenance_event_id` (number)
- `maintenance_sub_event_id` (number)
- `is_planned` (boolean)

**Backend expects (InspectionCreateRequest):**
- `start_date` (date) instead of `planned_date`
- Missing `maintenance_event_id` field
- Missing `maintenance_sub_event_id` field  
- Missing `is_planned` field

## ✅ Frontend Fix Applied

### 1. Enhanced Error Handling
- **File**: `src/lib/utils/toast-messages.ts`
- **Added**: Comprehensive error formatting with debugging
- **Added**: Better ApiError handling with status codes
- **Added**: Network error detection

### 2. API Data Transformation
- **File**: `src/lib/api/maintenance-events.ts` 
- **Added**: Data transformation layer to convert frontend format to backend format
- **Mapping**: `planned_date` → `start_date`
- **Removed**: Unsupported fields (maintenance associations) temporarily

### 3. Improved Debugging
- **File**: `src/hooks/use-maintenance-events.ts`
- **Added**: Detailed logging for mutation requests and responses
- **Added**: Error context tracking

## 🚀 Backend Updates Needed

To fully support the frontend requirements, the backend needs these updates:

### Update `InspectionCreateRequest` in `backend/app/domains/inspection/api/inspection_routes.py`:

```python
class InspectionCreateRequest(BaseModel):
    inspection_number: str
    title: str
    description: Optional[str] = None
    start_date: date  # Keep existing field
    planned_date: Optional[date] = None  # Add for compatibility
    end_date: Optional[date] = None
    equipment_id: int
    requesting_department: RefineryDepartment
    work_order: Optional[str] = None
    permit_number: Optional[str] = None
    # ADD THESE MISSING FIELDS:
    maintenance_event_id: Optional[int] = None
    maintenance_sub_event_id: Optional[int] = None
    is_planned: bool = False
    unplanned_reason: Optional[str] = None
    notes: Optional[str] = None
```

### Update the create_inspection function:

```python
# Create inspection with all fields
inspection = Inspection(
    inspection_number=inspection_data.inspection_number,
    title=inspection_data.title,
    description=inspection_data.description,
    start_date=inspection_data.planned_date or inspection_data.start_date,  # Support both
    end_date=inspection_data.end_date,
    equipment_id=inspection_data.equipment_id,
    requesting_department=inspection_data.requesting_department,
    work_order=inspection_data.work_order,
    permit_number=inspection_data.permit_number,
    # ADD THESE:
    maintenance_event_id=inspection_data.maintenance_event_id,
    maintenance_sub_event_id=inspection_data.maintenance_sub_event_id,
    is_planned=inspection_data.is_planned,
    unplanned_reason=inspection_data.unplanned_reason,
    status=InspectionStatus.Planned if inspection_data.is_planned else InspectionStatus.InProgress
)
```

## 🧪 Testing

The improved error handling will now show:
- ✅ Clear error messages instead of `[object Object]`
- ✅ Detailed API request/response logging
- ✅ Proper error classification (network, validation, server)

## 📝 Current Status

- ✅ **Frontend Fixed**: Error handling and API compatibility 
- ⏳ **Backend Pending**: Full field support for maintenance associations
- ✅ **User Experience**: Much better error messages and debugging

The inspection creation should now work with better error reporting, but the maintenance event associations will need the backend updates to be fully functional.
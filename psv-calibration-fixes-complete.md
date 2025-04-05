# PSV Calibration Functionality - All Issues Fixed

## Key Issues Fixed

1. **Fixed Backend Date Handling Error**
   - Added proper date type handling in calibration_routes.py
   - Fixed TypeError that was occurring when adding timedelta to string dates
   - Ensured proper datetime object conversion

2. **Fixed API "Body is unusable" Error**
   - Added response cloning before attempting to read response bodies
   - Enhanced error handling for all HTTP requests
   - Fixed in both route.ts and [id]/route.ts files

3. **Fixed "Not Found" Errors for Updates and Deletions**
   - Created proper dynamic route handler at `/api/calibration/[id]/route.ts`
   - Added both PUT and DELETE methods to properly handle all operations
   - Ensured correct forwarding to backend `/api/psv/calibration/{id}`

4. **Fixed Form Field Layout**
   - Ensured date and work number fields appear side-by-side
   - Used flex-row layout to guarantee consistent appearance
   - Applied in both add and edit forms

5. **Fixed Schema/Database Mismatch**
   - Removed `leak_test_pressure` field to match the database model
   - Fixed null/undefined value handling in form inputs

## Implementation Details

### 1. Dynamic Route Handler for Item Operations

The key solution was implementing a proper route handler for individual calibration operations:

```typescript
// frontend/src/app/api/calibration/[id]/route.ts

// Handle updates to specific calibration records
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract ID from URL params
  const id = params.id;
  
  // Forward to backend at correct URL
  const response = await fetch(`${API_URL}/api/psv/calibration/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(calibrationData),
  });
  
  // Handle response...
}

// Handle deletion of specific calibration records
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract ID from URL params
  const id = params.id;
  
  // Forward to backend at correct URL
  const response = await fetch(`${API_URL}/api/psv/calibration/${id}`, {
    method: 'DELETE',
    headers: { 'Accept': '*/*' },
  });
  
  // Handle response...
}
```

### 2. Backend Date Handling Fix

```python
# backend/app/routers/psv/calibration_routes.py

# Convert string dates to datetime objects if needed
if isinstance(calibration.calibration_date, str):
    calibration_date = datetime.fromisoformat(calibration.calibration_date.replace('Z', '+00:00'))
else:
    calibration_date = calibration.calibration_date
    
psv.last_calibration_date = calibration_date
# Calculate expiry date based on frequency (in months)
psv.expire_date = calibration_date + timedelta(days=psv.frequency * 30)
```

### 3. Error Handling Improvements

```typescript
// Clone response before attempting to read it multiple times
const responseClone = response.clone();

try {
  // Try to parse as JSON first
  const errorData = await response.json();
  // Handle JSON error...
} catch (jsonError) {
  // Fall back to text from cloned response
  try {
    const errorText = await responseClone.text();
    // Handle text error...
  } catch (textError) {
    // Handle case where both fail
  }
}
```

## Verification Steps

1. **Adding Calibrations**
   - Open a PSV detail page
   - Click "Add New Calibration"
   - Fill out the form (all fields should now work correctly)
   - Submit and verify it appears in the history

2. **Updating Calibrations**
   - Click the edit icon next to an existing calibration
   - Make changes to the fields
   - Click "Update Calibration"
   - Verify changes are saved

3. **Deleting Calibrations**
   - Click the delete icon next to a calibration
   - Confirm deletion in the dialog
   - Verify the calibration is removed from the list

All types of operations (create, read, update, delete) should now work correctly with PSV calibrations.
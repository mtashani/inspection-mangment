# PSV Settings Page Fixes

## Issues Fixed

### 1. "PSV with tag number 'service-risk' not found" Error
- **Problem**: When accessing service risk endpoints, the backend was treating "service-risk" as a PSV tag number
- **Root Cause**: Route conflict in FastAPI where `/api/psv/service-risk` was being matched by `/api/psv/{tag_number}` route
- **Solution**: 
  - Created a dedicated router for service risk at `/api/service-risk` 
  - Updated frontend API calls to use this new endpoint
  - Added more robust error handling with detailed logging

### 2. RBI Configuration Selection Not Working
- **Problem**: Selecting configurations in the settings page wasn't updating the form
- **Root Cause**: The form wasn't re-rendering when new initialData was provided
- **Solution**:
  - Added useEffect to reset form values when initialData changes
  - Used a formKey to force React to re-render the entire form component
  - Added detailed logging to track configuration selection

## Code Changes

### Backend Changes
1. **Added new service_risk_router.py**:
   ```python
   router = APIRouter(prefix="/service-risk", tags=["Service Risk"])
   ```

2. **Updated main.py**:
   ```python
   from .routers.service_risk_router import router as service_risk_router
   # ...
   app.include_router(service_risk_router, prefix="/api", tags=["Service Risk"])
   app.include_router(psv_router, prefix="/api", tags=["PSV Management"])
   ```

### Frontend Changes
1. **Updated frontend/src/api/rbi.ts**:
   - Changed service risk API endpoint from `/api/psv/service-risk` to `/api/service-risk`
   - Added detailed error handling and logging

2. **Fixed frontend/src/components/psv/rbi-config-form.tsx**:
   ```typescript
   const [formKey, setFormKey] = useState<number>(0);
   
   // Reset form when initialData changes
   useEffect(() => {
     console.log("RBI form initialData changed:", initialData);
     if (initialData) {
       form.reset(initialData);
     } else {
       form.reset(defaultValues);
     }
     setFormKey(prev => prev + 1);
   }, [initialData, form]);
   
   return (
     <Form {...form} key={formKey}>
       {/* ... */}
     </Form>
   );
   ```

## Testing Steps

1. **Test backend routes**:
   - Start backend with `uvicorn app.main:app --reload`
   - Verify service risk endpoints at `/api/service-risk` are accessible
   
2. **Test frontend**:
   - Start frontend with `npm run dev`
   - Navigate to PSV Settings page
   - Verify no more "PSV with tag number 'service-risk' not found" errors
   - Verify RBI configurations can be selected and form updates accordingly

3. **Additional checks**:
   - Create/edit RBI configurations
   - Create/edit service risk categories
   - Confirm changes are saved to the database

## Future Recommendations

1. **Keep route structures consistent**:
   - Use resource-based URLs (e.g., `/api/equipments`, `/api/inspections`, `/api/service-risks`)
   - Avoid nesting too deeply (e.g., `/api/psv/calibration/results/export`)
   
2. **Add defensive coding**:
   - Include default values for all form fields
   - Add proper logging for API calls and errors
   - Use React keys wisely to force re-rendering when needed

3. **Improve error handling**:
   - Be specific about error messages
   - Include HTTP status codes in error logs
   - Provide fallback behavior when APIs fail
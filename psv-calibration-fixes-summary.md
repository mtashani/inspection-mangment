# PSV Calibration Issues - Fixed

## Issues Addressed

1. **Missing PUT Method for Calibration Updates**
   - Added the PUT method to frontend API route handler
   - Enhanced URL pattern matching to properly extract calibration ID
   - Added detailed logging for better debugging

2. **Form Input Validation Errors**
   - Fixed "changing uncontrolled input to controlled" errors
   - Added proper handling for null values in numeric inputs
   - Standardized input field handling across all form fields

3. **Form Layout Issues**
   - Explicitly set flex-row layout for Date and Work Number fields
   - Ensured consistent side-by-side layout in both add and edit forms

4. **Schema/Database Mismatch**
   - Removed `leak_test_pressure` field from schema and data objects
   - Aligned form schema with database model for better consistency

5. **Save Button Issues**
   - Removed problematic onClick handler from save button
   - Retained proper form submission via form attribute

## Testing

Please test the following scenarios to ensure all issues have been resolved:

1. **Adding new calibration records**
   - Open the add calibration form
   - Fill in all required fields
   - Click Save Calibration
   - Verify successful submission

2. **Editing existing calibration records**
   - Open an edit calibration drawer
   - Modify some fields
   - Click Update Calibration
   - Verify changes are saved properly

3. **Form Layout**
   - Verify that Date and Work Number appear side-by-side
   - Confirm form layout is consistent between add and edit views

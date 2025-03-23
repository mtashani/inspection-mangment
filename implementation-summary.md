# PSV Calibration Dialog Enhancement Implementation

We have successfully implemented the auto-RBI level selection feature for the PSV calibration dialog. Here's what we've done:

## 1. Added a new API function in `frontend/src/api/rbi.ts`

```typescript
export async function getAppropriateRBILevel(psvTagNumber: string): Promise<RBILevel> {
  try {
    // First get the active RBI configuration
    const activeConfig = await getActiveRBIConfiguration();
    
    if (!activeConfig) {
      console.warn("No active RBI configuration found, defaulting to level 1");
      return 1; // Default to level 1 if no config
    }
    
    // Use the active configuration's level to calculate RBI
    const calculationResult = await calculateRBI(psvTagNumber, activeConfig.level);
    
    // The calculation result includes the recommended RBI level for this PSV
    return calculationResult.rbi_level || 1;
  } catch (error) {
    console.error("Error determining appropriate RBI level:", error);
    return 1; // Default to level 1 on error
  }
}
```

This function leverages the existing RBI calculation system to determine the appropriate RBI level for a PSV based on its tag number.

## 2. Enhanced the PSV Calibration Dialog in `frontend/src/components/psv/psv-calibration-dialog.tsx`

- Removed the manual RBI level selector dropdown
- Added logic to automatically fetch the appropriate RBI level when the dialog opens
- Added loading state with spinner while fetching the RBI level
- Added error handling with fallback to RBI Level 1 if there's an error
- Added display of the selected RBI level
- Ensured the Submit button only appears when the RBI level has been loaded

## 3. Fixed the usage in the PSV detail page

Updated `frontend/src/app/psv/[id]/page.tsx` to use the PSVCalibrationDialog component correctly:
- Removed the double-dialog nesting (was `Dialog` > `DialogContent` > `PSVCalibrationDialog`)
- Now using `PSVCalibrationDialog` directly

## Testing

To test this implementation:

1. Go to the PSV detail page for any PSV
2. Click on the "Add New Calibration" button
3. Verify that:
   - The dialog shows a loading spinner while fetching the RBI level
   - The appropriate RBI level is displayed automatically
   - The form fields adapt based on the RBI level
   - No manual RBI level selection is required
   - You can submit the form and it works correctly

## Notes

- The implementation uses mock data for RBI calculation since the backend endpoint is still in development (as noted in the `calculateRBI` function)
- The existing TypeScript errors in the PSV detail page are unrelated to our changes and should be addressed separately
# Test Instructions for PSV Multi-Filter Fix

## What's Been Fixed

1. **Backend Fix**: Added the missing SQLAlchemy `or_` import to enable filtering with multiple values
2. **Frontend Fix**: Connected the UI filter selections to the API requests

## How to Test

1. Start your backend server if not already running:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. Start your frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open the PSV page in your browser

4. Test the following scenarios:
   
   a. **Select multiple values for the same filter**:
      - Click on the "Train" filter
      - Select 2 or more train options (e.g., "Train A" and "Train B")
      - Verify that PSVs from both selected trains appear in the list

   b. **Select multiple values for different filters**:
      - Select multiple values for "Train" filter
      - Also select multiple values for "Unit" filter
      - Verify that PSVs matching BOTH filters appear (they must match at least one value from each filter)

   c. **Clear filters**:
      - After applying filters, click "Clear filters" or "Reset"
      - Verify that all PSVs are displayed again

## Technical Changes Made

### Backend
- Added `from sqlalchemy.sql import func, distinct, or_` import to `psv_routes.py` 
- Updated the filter handling code to properly handle lists of filter values

### Frontend
- Created proper connection between UI filters and API calls
- Added state management for filters in the PSV page component
- Implemented a callback to reload data when filters change

## Browser Console Check
Open your browser's developer console (F12) and check for any error messages or warnings when applying filters.
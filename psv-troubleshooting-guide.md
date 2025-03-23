# PSV System Troubleshooting Guide

## Current Issues

You reported that the PSV pages are showing "Failed to fetch" errors, and the Settings and Analytics pages are also displaying errors. These errors are typically related to API connectivity issues between your frontend and backend.

## Solution Implemented

I've added tools to help diagnose and fix these connectivity issues:

1. **API Debug Tool** (`frontend/src/api-debug.ts`) - A utility to test API connections and diagnose issues
2. **Debug Page** (`frontend/src/app/api-debug/page.tsx`) - A page that provides real-time diagnostics and troubleshooting steps
3. **Environment Configuration** (`frontend/.env.local`) - Added proper API URL configuration

## Steps to Fix the Issues

1. **Verify Backend Server**
   - Make sure your backend server is running with:
   ```
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```
   
2. **Check the API Connection**
   - Navigate to the API debug page at http://localhost:3000/api-debug
   - This page will automatically test API connectivity and show which endpoints are failing
   - It will also provide specific troubleshooting steps based on the errors detected

3. **Common Solutions**
   - **Backend Not Running**: Start the backend server as shown above
   - **CORS Issues**: Make sure your frontend origin is included in the backend's CORS settings
   - **Environment Configuration**: Verify that `.env.local` has the correct backend URL

4. **Restart Frontend Server**
   - After making changes, restart your frontend development server:
   ```
   cd frontend
   npm run dev
   ```

## Understanding API Connectivity

The PSV management system relies on these key endpoints:

- `/api/psv` - For fetching PSV list data
- `/api/psv/rbi/config` - For RBI configuration settings
- `/api/psv/service-risk` - For service risk categories

If any of these endpoints fail, it will cause the corresponding pages to display errors or empty data.

## Verifying the Fix

Once you've made the necessary adjustments:
1. Check the API Debug page again to verify all endpoints are working
2. Navigate to the PSV pages to confirm they're now displaying data properly
3. Test the Settings and Analytics pages to ensure they're functioning correctly
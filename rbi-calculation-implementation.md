# RBI Calculation Implementation

## Overview

This implementation adds an RBI Calculation component to the PSV detail page, which calculates and displays time remaining until the next calibration based on active RBI configurations.

## Files Created/Updated

1. **RBI Calculation Component** (`frontend/src/components/psv/rbi-calculation.tsx`)
   - Main component that displays active RBI configuration
   - Allows calculation of RBI metrics
   - Shows months and days remaining until next calibration

2. **API Functions** (`frontend/src/api/rbi.ts`)
   - Added new functions:
     - `getActiveRBIConfiguration()`: Fetches active RBI configuration
     - `calculateRBI()`: Calculates RBI results for a PSV
   - Updated type definitions for existing functions

3. **Types** (`frontend/src/components/psv/types.ts`)
   - Added `RBICalculationResult` interface
   - Added `RBIConfiguration` interface
   - Updated PSV and other related types

4. **PSV Detail Page** (`frontend/src/app/psv-layout/psv/[tag]/page.tsx`)
   - Added tab for RBI Calculation
   - Integrated RBI Calculation component

## Features

1. **Time Remaining Calculation**:
   - Shows months and days remaining until next calibration date
   - Color-coded based on urgency:
     - Red: Calibration overdue (negative months)
     - Orange: < 3 months remaining
     - Yellow: < 6 months remaining
     - Green: > 6 months remaining

2. **Risk Information**:
   - Displays risk score
   - Shows risk category with color-coding
   - Includes recommended calibration interval

3. **Detailed Results**:
   - Shows calculation details when available
   - Provides next calibration date

## Usage

1. Navigate to the PSV detail page
2. Click on the "RBI Calculation" tab
3. Click "Calculate RBI" button
4. View the calculation results, including months remaining until next calibration

## API Endpoints

The component relies on these backend endpoints:

1. `GET /api/psv/rbi/config/active`: Returns active RBI configuration
2. `POST /api/psv/rbi/{tag_number}/calculate?level={level}`: Calculates RBI metrics

## Styling

The component uses the following styling features:

1. Card layout with header and content
2. Color-coded risk categories and time remaining
3. Responsive grid layout for different screen sizes
4. Loading state with skeleton loader
5. Error handling with alert messages
# Jalali Calendar Implementation for Admin Panel

## Overview

Successfully implemented Jalali (Persian) calendar support for the Attendance Overview section in the admin panel, matching the functionality that was present in frontend v1 and compatible with the backend API that expects `jalali_year` and `jalali_month` parameters.

## Changes Made

### 1. Added Jalali Calendar Library
- **Package**: `jalaali-js` (installed)
- **Purpose**: Accurate conversion between Gregorian and Jalali dates

### 2. Created Jalali Utilities (`src/lib/utils/jalali.ts`)
**Key Functions:**
- `gregorianToJalali()` - Convert Gregorian date to Jalali
- `jalaliToGregorian()` - Convert Jalali date to Gregorian  
- `getCurrentJalaliDate()` - Get current date in Jalali
- `getJalaliMonthName()` - Get Persian month names
- `getDaysInJalaliMonth()` - Get correct days in Jalali month (handles leap years)
- `getPreviousJalaliMonth()` / `getNextJalaliMonth()` - Month navigation
- `isJalaliDateToday()` - Check if a Jalali date is today
- `formatJalaliDate()` - Format dates in Persian style

**Persian Month Names:**
```javascript
['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 
 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
```

### 3. Updated API Functions (`src/lib/api/admin/attendance.ts`)
- **New Function**: `getJalaliMonthlyAttendance(inspectorId, jalaliYear, jalaliMonth)`
- **Backend Compatible**: Uses `/inspectors/{id}/attendance?jalali_year=1403&jalali_month=3` endpoint
- **Maintained Legacy**: Kept `getMonthlyAttendance()` for backward compatibility

### 4. Updated Attendance Overview Component (`src/components/admin/dashboard/attendance-overview.tsx`)

**Major Changes:**
- **Props**: Changed from `currentMonth/currentYear` to `currentJalaliMonth/currentJalaliYear`
- **Month Display**: Shows Persian month names (e.g., "فروردین 1403" instead of "March 2024")
- **Calendar Logic**: Uses Jalali calendar for all date calculations
- **Today Detection**: Properly detects today using Jalali calendar
- **Month Navigation**: Handles Jalali month boundaries correctly

**Visual Improvements:**
- Today's date highlighted with ring indicator
- Persian month names in header
- Correct number of days per Jalali month (31/30/29 based on month and leap year)

### 5. Updated Dashboard Hook (`src/hooks/admin/use-admin-dashboard.ts`)
- **Parameters**: Changed to `jalaliMonth` and `jalaliYear`
- **Default Values**: Uses current Jalali date as default
- **Cache Keys**: Updated to include Jalali parameters for proper data caching
- **Fallback**: Mock data generator updated to work with Jalali calendar

### 6. Updated Admin Dashboard (`src/components/admin/dashboard/admin-dashboard.tsx`)
- **State**: Uses Jalali calendar state instead of Gregorian
- **Current Date**: Initializes with current Jalali date
- **Month Navigation**: Handles Jalali month changes properly

### 7. Updated Attendance Management (`src/components/admin/attendance/attendance-management.tsx`)
- **API Calls**: Uses `getJalaliMonthlyAttendance()` for data fetching
- **State**: Manages Jalali month/year instead of Gregorian
- **Parameters**: Passes Jalali parameters to child components

### 8. Created Demo Component (`src/components/demo/jalali-calendar-demo.tsx`)
- **Purpose**: Demonstrates working Jalali calendar functionality
- **Features**: Month navigation, today highlighting, Persian text
- **Visual**: Shows both English and Persian elements

## Backend Integration

### API Endpoints Used
```
GET /api/inspectors/{inspector_id}/attendance?jalali_year={year}&jalali_month={month}
```

### Expected Response Format
```json
[
  {
    "date": "2024-06-15",        // Gregorian date for storage
    "jalali_date": "1403-03-26", // Jalali date for reference
    "status": "WORKING",
    "workHours": 8,
    "overtimeHours": 0,
    "isOverride": false,
    "overrideReason": null
  }
]
```

## Key Features Implemented

### ✅ Jalali Calendar Support
- **Month Names**: Full Persian month names (فروردین، اردیبهشت، etc.)
- **Correct Days**: Handles 31/30/29 days per month correctly
- **Leap Years**: Proper Jalali leap year calculations using `jalaali-js`
- **Today Detection**: Accurately identifies today in Jalali calendar

### ✅ Backend Compatibility
- **API Parameters**: Uses `jalali_year` and `jalali_month` as expected by backend
- **Date Conversion**: Converts between Jalali and Gregorian for data processing
- **Storage Format**: Maintains Gregorian dates for consistency with database

### ✅ User Experience
- **Persian Interface**: Month names and navigation in Persian
- **Visual Indicators**: Today's date highlighted properly
- **Smooth Navigation**: Previous/next month works correctly with Jalali boundaries
- **Real-time**: Current date detection updates properly

### ✅ Data Processing
- **Attendance Mapping**: Correctly maps attendance data to Jalali calendar days
- **Statistics**: Calculates attendance rates and summaries accurately
- **Caching**: Proper cache invalidation with Jalali parameters

## Technical Considerations

### Date Storage
- **Database**: Continues to store Gregorian dates for consistency
- **API**: Accepts Jalali parameters but works with Gregorian internally
- **Frontend**: Displays and navigates using Jalali calendar

### Performance
- **Conversion**: Minimal overhead for date conversions using optimized library
- **Caching**: React Query caches data properly with Jalali keys
- **Memoization**: Attendance mapping memoized for performance

### Backwards Compatibility
- **Legacy Functions**: Kept original functions for components not yet updated
- **Gradual Migration**: Can update other components to Jalali gradually
- **API Flexibility**: Backend supports both Gregorian and Jalali parameters

## Testing

### Manual Testing Verified
- ✅ Month navigation works correctly (handles year boundaries)
- ✅ Today's date highlighted properly
- ✅ Persian month names display correctly
- ✅ Attendance data maps to correct Jalali days
- ✅ Calendar shows correct number of days per month
- ✅ Leap year handling works (اسفند shows 29/30 days correctly)

## Usage Example

```typescript
// Get current Jalali date
const today = getCurrentJalaliDate(); // { jy: 1403, jm: 3, jd: 26 }

// Get month name
const monthName = getJalaliMonthName(3); // "خرداد"

// Navigate months
const { year, month } = getNextJalaliMonth(1403, 12); // { year: 1404, month: 1 }

// Check if today
const isToday = isJalaliDateToday(1403, 3, 26); // true/false

// API call
const attendance = await getJalaliMonthlyAttendance(inspectorId, 1403, 3);
```

## Result

The Attendance Overview section in the admin panel now works with Jalali calendar exactly like it did in frontend v1, sending proper `jalali_year` and `jalali_month` parameters to the backend API, and displaying Persian month names and calendar navigation to users.

The implementation is complete, tested, and ready for production use.
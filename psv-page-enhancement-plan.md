# PSV Page Enhancement Plan

This document outlines the plan to implement the requested enhancements to the PSV page.

## Requirements

1. **Fix Under Calibration Card**: The "Under Calibration" summary card shows 0 even though it should display PSVs with valid calibration dates (expire_date hasn't passed yet).

2. **Remove Color Coding Button**: Since dates in the "Next Due" column are already color-coded, remove the "Show Color Coding" button. Update coloring so that dates due in the next 30 days are yellow (which are currently showing in gray).

3. **Dynamic Type Filter**: Make the PSV "Type" filter fetch options from the backend rather than using hardcoded values.

4. **Add Unit and Train Filters**: Add new filters for "Unit" and "Train" to the data table toolbar.

## Implementation Plan

### 1. Fix Under Calibration Card

#### Backend Changes

In `backend/app/routers/psv/summary_routes.py`, modify the `get_psv_summary` function:

```python
# Current code (lines ~86-89):
"underCalibration": {
    "main": 0,  # TODO: Add when under_calibration status is implemented
    "spare": 0
},

# Update to:
# Calculate PSVs that are within calibration period
main_under_cal = main_count.filter(PSV.expire_date > now)
spare_under_cal = spare_count.filter(PSV.expire_date > now)

# Then update the underCalibration section in the summary dict:
"underCalibration": {
    "main": db.exec(main_under_cal.with_only_columns(func.count())).first(),
    "spare": db.exec(spare_under_cal.with_only_columns(func.count())).first()
},
```

#### Frontend Changes

No changes needed for the frontend as it will automatically use the updated values from the backend.

### 2. Remove Color Coding Button and Update Colors

In `frontend/src/app/psv/page.tsx`:

```typescript
// Remove state (around line 97):
const [showColorCoding, setShowColorCoding] = useState(false);

// Remove button (around lines 273-279):
<Button 
  variant={showColorCoding ? "default" : "outline"}
  onClick={() => setShowColorCoding(!showColorCoding)}
  size="sm"
>
  {showColorCoding ? "Hide Color Coding" : "Show Color Coding"}
</Button>

// Update PSVDataTable props (around line 283):
// From:
<PSVDataTable data={psvs} showColorCoding={showColorCoding} />
// To:
<PSVDataTable data={psvs} />
```

In `frontend/src/components/psv/psv-data-table.tsx`:

```typescript
// Update props interface (around lines 162-165):
interface PSVDataTableProps {
  data: PSV[];
  // Remove showColorCoding prop
}

// Update function signature (line 167):
export function PSVDataTable({ data }: PSVDataTableProps) {

// Update getRowClassName function (around line 214):
// From:
const getRowClassName = (row: PSV) => {
  if (!showColorCoding) return "";
  
  const today = new Date();
  const expireDate = new Date(row.expire_date);
  const daysUntilDue = Math.ceil((expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) {
    return "bg-red-50 hover:bg-red-100";
  } else if (daysUntilDue < 30) {
    return "bg-yellow-50 hover:bg-yellow-100";
  }
  return "";
};

// To:
const getRowClassName = (row: PSV) => {
  const today = new Date();
  const expireDate = new Date(row.expire_date);
  const daysUntilDue = Math.ceil((expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) {
    return "bg-red-50 hover:bg-red-100";
  } else if (daysUntilDue < 30) {
    // Use yellow for dates due in next 30 days (currently showing as gray)
    return "bg-yellow-50 hover:bg-yellow-100";
  }
  // Use light yellow for dates that are not yet due (currently showing no color)
  return "bg-yellow-50/30 hover:bg-yellow-100/30";
};
```

### 3. Dynamic Type Filter

#### Backend Changes

Add new endpoint in `backend/app/routers/psv/psv_routes.py`:

```python
from typing import Dict, List, Optional
from sqlalchemy import distinct

@router.get("/types", response_model=List[str])
def get_psv_types(db: Session = Depends(get_session)):
    """Get all unique PSV types"""
    result = db.exec(select(distinct(PSV.type))).all()
    return [r[0] for r in result if r[0]]  # Filter out None values
```

#### Frontend Changes

In `frontend/src/api/psv.ts`, add new function:

```typescript
export async function fetchPSVTypes(): Promise<string[]> {
  const response = await fetch(`${API_URL}/api/psv/types`);
  if (!response.ok) {
    throw new Error('Failed to fetch PSV types');
  }
  return response.json();
}
```

In `frontend/src/components/psv/data-table-toolbar.tsx`:

```typescript
// Add import for useState and useEffect
import { useState, useEffect } from "react";
import { fetchPSVTypes } from "@/api/psv";

// Inside DataTableToolbar function, replace hardcoded types:
// From:
const psvTypes = [
  { label: "Open Bonnet", value: "OPEN_BONNET" },
  { label: "Pilot", value: "PILOT" },
  { label: "Other", value: "OTHER" },
];

// To:
const [psvTypes, setPsvTypes] = useState<{ label: string, value: string }[]>([]);

// Add useEffect to fetch types:
useEffect(() => {
  async function loadTypes() {
    try {
      const types = await fetchPSVTypes();
      const formattedTypes = types.map(type => ({
        label: type.replace("_", " ").toLowerCase(),
        value: type
      }));
      setPsvTypes(formattedTypes);
    } catch (error) {
      console.error("Failed to fetch PSV types:", error);
    }
  }
  
  loadTypes();
}, []);
```

### 4. Add Unit and Train Filters

#### Backend Changes

Add new endpoints in `backend/app/routers/psv/psv_routes.py`:

```python
@router.get("/units", response_model=List[str])
def get_psv_units(db: Session = Depends(get_session)):
    """Get all unique PSV units"""
    result = db.exec(select(distinct(PSV.unit))).all()
    return [r[0] for r in result if r[0]]  # Filter out None values

@router.get("/trains", response_model=List[str])
def get_psv_trains(db: Session = Depends(get_session)):
    """Get all unique PSV trains"""
    result = db.exec(select(distinct(PSV.train))).all()
    return [r[0] for r in result if r[0]]  # Filter out None values
```

#### Frontend Changes

In `frontend/src/api/psv.ts`, add new functions:

```typescript
export async function fetchPSVUnits(): Promise<string[]> {
  const response = await fetch(`${API_URL}/api/psv/units`);
  if (!response.ok) {
    throw new Error('Failed to fetch PSV units');
  }
  return response.json();
}

export async function fetchPSVTrains(): Promise<string[]> {
  const response = await fetch(`${API_URL}/api/psv/trains`);
  if (!response.ok) {
    throw new Error('Failed to fetch PSV trains');
  }
  return response.json();
}
```

In `frontend/src/components/psv/data-table-toolbar.tsx`:

```typescript
// Add state for units and trains
const [psvUnits, setPsvUnits] = useState<{ label: string, value: string }[]>([]);
const [psvTrains, setPsvTrains] = useState<{ label: string, value: string }[]>([]);

// Extend useEffect to fetch units and trains:
useEffect(() => {
  async function loadFilterData() {
    try {
      // Fetch types
      const types = await fetchPSVTypes();
      const formattedTypes = types.map(type => ({
        label: type.replace("_", " ").toLowerCase(),
        value: type
      }));
      setPsvTypes(formattedTypes);
      
      // Fetch units
      const units = await fetchPSVUnits();
      const formattedUnits = units.map(unit => ({
        label: unit,
        value: unit
      }));
      setPsvUnits(formattedUnits);
      
      // Fetch trains
      const trains = await fetchPSVTrains();
      const formattedTrains = trains.map(train => ({
        label: train,
        value: train
      }));
      setPsvTrains(formattedTrains);
    } catch (error) {
      console.error("Failed to fetch PSV filter data:", error);
    }
  }
  
  loadFilterData();
}, []);

// Add unit and train filters in the UI (around line 73):
{table.getColumn("type") && (
  <DataTableFacetedFilter
    column={table.getColumn("type")}
    title="Type"
    options={psvTypes}
  />
)}
{table.getColumn("unit") && (
  <DataTableFacetedFilter
    column={table.getColumn("unit")}
    title="Unit"
    options={psvUnits}
  />
)}
{table.getColumn("train") && (
  <DataTableFacetedFilter
    column={table.getColumn("train")}
    title="Train"
    options={psvTrains}
  />
)}
```

## Implementation Sequence

1. Backend changes for "Under Calibration" count
2. Backend endpoints for filter options (types, units, trains)
3. Frontend removal of color coding button and update color scheme
4. Frontend update for DataTableToolbar with new filters

## Technical Considerations

1. **API Design**: The new endpoints follow RESTful practices and are consistent with existing endpoints.
2. **Performance**: For large datasets, pagination or lazy loading of filter options may be needed in the future.
3. **Error Handling**: Proper error handling is implemented for API requests.
4. **User Experience**: Filters are intuitive and responsive.

## Expected Outcomes

1. "Under Calibration" card will display correct count of PSVs with valid calibration dates
2. Color coding will always be applied with appropriate colors:
   - Red for expired calibrations (already implemented)
   - Yellow for calibrations due in the next 30 days
   - Light yellow for calibrations not yet due
3. Type filter will use dynamic data from the backend
4. Unit and Train filters will be available for more granular filtering
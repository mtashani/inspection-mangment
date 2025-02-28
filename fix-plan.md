# PSV Data Table Toolbar Fix Plan

## Current Issues
1. Column mismatch: Frontend tries to access "tag" but the actual column is "tag_number"
2. Non-existent column: "testMedium" filter is being used but this field doesn't exist in the PSV table

## Required Changes

### 1. Update Tag Number Filter
In `frontend/src/components/psv/data-table-toolbar.tsx`:
```typescript
// Change from:
value={(table.getColumn("tag")?.getFilterValue() as string) ?? ""}
onChange={(event) =>
  table.getColumn("tag")?.setFilterValue(event.target.value)
}

// Change to:
value={(table.getColumn("tag_number")?.getFilterValue() as string) ?? ""}
onChange={(event) =>
  table.getColumn("tag_number")?.setFilterValue(event.target.value)
}
```

### 2. Remove Test Medium Filter
In `frontend/src/components/psv/data-table-toolbar.tsx`:
- Remove the testMediums array
- Remove the test medium filter section:
```typescript
{table.getColumn("testMedium") && (
  <DataTableFacetedFilter
    column={table.getColumn("testMedium")}
    title="Test Medium"
    options={testMediums}
  />
)}
```

### 3. Update PSVData Interface
In `frontend/src/components/psv/data-table-toolbar.tsx`:
```typescript
interface PSVData {
  last_calibration_date?: string; // Changed from lastCalibrationDate
  expire_date?: string;           // Changed from nextCalibrationDate
  tag_number?: string;            // Changed from tag
  type?: string;
  // Remove testMedium as it's not part of PSV data
}
```

## Implementation Notes
- These changes align the frontend with the actual backend data structure
- The test medium filter should be moved to a separate calibration management interface if needed
- The PSVData interface should match the column definitions in psv-data-table.tsx
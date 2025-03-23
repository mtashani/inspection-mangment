# PSV Filter Fix Plan

## Problem Description

In the PSV page, when multiple values are selected for train, type, or unit filters (e.g., selecting both "Train A" and "Train B"), no data appears in the table even though there should be matching results.

## Root Cause Analysis

After examining the backend code in `backend/app/routers/psv/psv_routes.py`, the issue has been identified:

1. The filtering logic attempts to use an `or_` function from SQLAlchemy for creating OR conditions when multiple filter values are selected:

```python
# Handle multiple unit values with OR condition
if unit and len(unit) > 0:
    unit_filters = [PSV.unit == u for u in unit]
    query = query.filter(or_(*unit_filters))  # Error: 'or_' is not defined
```

2. However, the `or_` function is not imported from SQLAlchemy, causing the filtering to fail silently and return empty results.

3. This same issue exists for all three filter types: `unit`, `type`, and `train`.

## Solution Plan

### 1. Import the Missing SQLAlchemy Function

Add the `or_` function import to the top of the file with the other SQLAlchemy imports:

```python
from sqlalchemy.sql import func, distinct, or_
```

### 2. Verify Filter Logic

Ensure that the filter logic is correctly implemented for all three filter types:

- Unit filter
- Type filter  
- Train filter

### 3. Implementation Steps

1. Modify the import statement in `backend/app/routers/psv/psv_routes.py` to include the `or_` function
2. Test by selecting multiple values within the same filter category
3. Further test by combining different filter categories
4. Verify that all filter combinations work as expected

### 4. Testing Strategy

1. **Unit Testing**: Test each filter type individually with:
   - One selected value
   - Multiple selected values
   - No selected values

2. **Integration Testing**: Test combinations of filters:
   - Unit + Type
   - Unit + Train
   - Type + Train
   - All three filters together

### 5. Verification Criteria

The fix will be considered successful when:
1. Selecting multiple values for any filter shows all records matching ANY of the selected values
2. Combining multiple filter types shows records matching ALL the applied filter conditions
3. No console errors or warnings appear during filtering operations

## Estimated Effort

- Implementation: 30 minutes
- Testing: 1 hour
- Documentation: 30 minutes

## Recommendation

We should implement this fix as soon as possible since it affects core functionality of the PSV management page, preventing users from effectively filtering and finding PSV records.
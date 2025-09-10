# Implementation Plan

- [x] 1. Create date conversion utility service

  - Implement `DateConversionService` class with static methods for handling dual date inputs
  - Add input validation for Jalali date format (YYYY-MM-DD)
  - Add error handling for invalid date conversions
  - Write unit tests for date conversion edge cases
  - _Requirements: 2.1, 2.2, 5.3_

- [x] 2. Update domain models to remove redundant Jalali date fields

  - Remove `jalali_date` field from `AttendanceRecord` model
  - Remove `jalali_start_date` field from `WorkCycle` model
  - Keep `MonthlyAttendance` year/month fields as Jalali (no changes needed)
  - Update model imports and dependencies
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Modify API schemas to support dual date input/output

  - Update `AttendanceRecordCreate` schema to accept both date formats with validation
  - Update `AttendanceRecordUpdate` schema to accept both date formats with validation
  - Modify response schemas to include computed `jalali_date` field
  - Add `from_model` class methods for automatic Jalali date conversion in responses
  - _Requirements: 3.1, 3.3, 2.1_

- [x] 4. Refactor AttendanceService to use new date handling

  - Update `get_attendance` method to use Gregorian date range queries instead of string filtering
  - Modify `create_or_update_attendance` method to resolve dual date inputs using `DateConversionService`
  - Update `generate_monthly_attendance` method to use date range queries
  - Refactor `apply_leave_to_attendance` method to use resolved dates
  - Update `override_attendance` method to handle dual date inputs

  - _Requirements: 2.2, 2.3, 2.4_

- [ ] 5. Update WorkCycleService to handle single date format

  - Remove Jalali date handling from `update_work_cycle` method

  - Update attendance record deletion logic to use Gregorian date comparisons
  - Modify cycle date calculations to work with `datetime.date` objects only
  - _Requirements: 1.2, 2.2_

- [x] 6. Reset development database and update seed data

  - Drop existing SQLite database file
  - Run Alembic migrations to create tables with new schema
  - Update seed data generation to use only `datetime.date` objects
  - Verify all test data is created correctly without Jalali date fields
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Update API endpoints to use new schemas and services

  - Modify attendance endpoints to use updated request/response schemas
  - Update work cycle endpoints to handle single date format
  - Ensure all endpoints return both Gregorian and Jalali dates in responses
  - Add proper error handling for invalid date inputs
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 8. Write comprehensive tests for refactored date handling

  - Create unit tests for `DateConversionService` with various input scenarios
  - Write service layer tests for updated attendance and work cycle services
  - Add integration tests for API endpoints with both date input formats
  - Test date filtering and sorting functionality with new query approach

  - Test error handling for invalid date inputs and edge cases

  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 9. Update frontend API integration (if needed)

  - Review frontend API calls to ensure compatibility with new request/response formats
  - Update any hardcoded date field references if necessary
  - Test frontend date picker integration with new API format
  - Verify all date displays work correctly with API responses
  - _Requirements: 3.3, 3.4_

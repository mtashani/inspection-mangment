# Requirements Document

## Introduction

The current attendance system stores both Gregorian and Jalali dates separately in the database, which creates data redundancy, potential inconsistency issues, and complicates filtering and sorting operations. This feature aims to refactor the date handling approach to store only standard datetime.date objects in the database and handle Jalali date conversion at the API/presentation layer.

## Requirements

### Requirement 1

**User Story:** As a system architect, I want to store only standard datetime.date objects in the database, so that we maintain data consistency and avoid redundancy.

#### Acceptance Criteria

1. WHEN storing attendance records THEN the system SHALL only store datetime.date objects in the database
2. WHEN storing work cycles THEN the system SHALL only store datetime.date objects in the database  
3. WHEN storing monthly attendance THEN the system SHALL only store datetime.date objects in the database
4. IF jalali date fields exist in models THEN the system SHALL remove them from database schema

### Requirement 2

**User Story:** As a developer, I want Jalali date conversion to happen at the API layer, so that the business logic remains clean and testable.

#### Acceptance Criteria

1. WHEN API responses are generated THEN the system SHALL convert datetime.date to Jalali format in response DTOs
2. WHEN API requests contain Jalali dates THEN the system SHALL convert them to datetime.date before processing
3. WHEN filtering by date THEN the system SHALL accept both Gregorian and Jalali date formats and convert appropriately
4. WHEN sorting by date THEN the system SHALL use the standard datetime.date fields for optimal performance

### Requirement 3

**User Story:** As a frontend developer, I want to receive properly formatted Jalali dates from the API, so that I can display them correctly without additional conversion logic.

#### Acceptance Criteria

1. WHEN fetching attendance records THEN the API SHALL return both gregorian_date and jalali_date in response
2. WHEN fetching work cycles THEN the API SHALL return both gregorian_start_date and jalali_start_date in response
3. WHEN submitting forms with Jalali dates THEN the frontend SHALL send them in a standardized format
4. WHEN displaying dates THEN the frontend SHALL use the jalali_date from API responses

### Requirement 4

**User Story:** As a developer, I want to reset the development database and reseed it with the new schema, so that I can test the refactored date handling with fresh data.

#### Acceptance Criteria

1. WHEN database is reset THEN the system SHALL drop all existing tables
2. WHEN database is reseeded THEN the system SHALL create tables with the new schema (without jalali_date columns)
3. WHEN seeding data THEN the system SHALL generate test data using only datetime.date objects
4. WHEN seeding completes THEN the system SHALL verify that all attendance records have valid dates

### Requirement 5

**User Story:** As a QA engineer, I want comprehensive tests for the new date handling, so that I can ensure the system works correctly with both date formats.

#### Acceptance Criteria

1. WHEN testing API endpoints THEN the system SHALL handle both Gregorian and Jalali date inputs correctly
2. WHEN testing date filtering THEN the system SHALL return accurate results for both date formats
3. WHEN testing date sorting THEN the system SHALL maintain correct chronological order
4. WHEN testing edge cases THEN the system SHALL handle invalid dates gracefully
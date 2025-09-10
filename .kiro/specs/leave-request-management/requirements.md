# Requirements Document

## Introduction

The Leave Request Management feature will allow inspectors to submit leave requests, which administrators can then review, approve, or reject. This system will help track inspector availability and manage workforce planning efficiently. The feature will integrate with the existing inspector management system and respect the permission-based access control already in place.

The system must work in conjunction with the existing work cycle forecasting functionality, which predicts inspector presence and absence based on work cycle patterns (e.g., 14-14 cycle means 14 days of work followed by 14 days of rest). Approved leave requests must be properly recorded in the attendance data and must handle scenarios where work cycle start dates are modified, which affects forecast data.

## Requirements

### Requirement 1

**User Story:** As an inspector, I want to submit leave requests, so that I can formally request time off for personal or professional reasons.

#### Acceptance Criteria

1. WHEN an inspector is logged in THEN the system SHALL allow them to create a new leave request.
2. WHEN creating a leave request THEN the system SHALL require the following information:
   - Start date (in Jalali calendar format)
   - End date (in Jalali calendar format)
   - Leave type (vacation, sick leave, personal leave, etc.)
   - Reason for leave (optional for some leave types)
3. WHEN submitting a leave request THEN the system SHALL validate that the end date is not before the start date.
4. WHEN submitting a leave request THEN the system SHALL set the initial status to "Pending".
5. WHEN a leave request is successfully submitted THEN the system SHALL notify the inspector's supervisor or admin.

### Requirement 2

**User Story:** As an administrator, I want to review and manage leave requests, so that I can ensure proper staffing levels and track inspector availability.

#### Acceptance Criteria

1. WHEN an administrator is logged in THEN the system SHALL display a list of all leave requests with filtering options.
2. WHEN viewing the leave requests list THEN the system SHALL show key information including inspector name, leave dates, type, and status.
3. WHEN an administrator selects a leave request THEN the system SHALL display the full details of the request.
4. WHEN reviewing a leave request THEN the system SHALL allow the administrator to approve or reject the request.
5. WHEN approving or rejecting a request THEN the system SHALL require the administrator to provide a comment (optional for approvals, mandatory for rejections).
6. WHEN a leave request status changes THEN the system SHALL notify the requesting inspector.

### Requirement 3

**User Story:** As an inspector, I want to view the status and history of my leave requests, so that I can track their approval progress and plan accordingly.

#### Acceptance Criteria

1. WHEN an inspector is logged in THEN the system SHALL display a list of their leave requests.
2. WHEN viewing the leave request list THEN the system SHALL show the status of each request.
3. WHEN an inspector selects a leave request THEN the system SHALL display the full details including any admin comments.
4. WHEN a leave request is pending THEN the system SHALL allow the inspector to cancel it.
5. WHEN a leave request is approved or rejected THEN the system SHALL NOT allow the inspector to modify it.

### Requirement 4

**User Story:** As an administrator, I want the system to automatically update inspector availability based on approved leave requests, so that the inspection scheduling system has accurate availability information.

#### Acceptance Criteria

1. WHEN a leave request is approved THEN the system SHALL automatically mark the inspector as unavailable for the specified date range.
2. WHEN a leave request is rejected or canceled THEN the system SHALL ensure the inspector's availability status remains unchanged.
3. WHEN an approved leave request ends THEN the system SHALL automatically restore the inspector's availability status.
4. IF an inspector has an approved leave request THEN the system SHALL prevent scheduling of inspections for that inspector during the leave period.

### Requirement 5

**User Story:** As a system administrator, I want to configure leave request settings, so that I can customize the system according to organizational policies.

#### Acceptance Criteria

1. WHEN accessing the leave request settings THEN the system SHALL allow configuration of leave types.
2. WHEN configuring leave types THEN the system SHALL allow specification of whether each type requires approval.
3. WHEN configuring leave types THEN the system SHALL allow setting maximum allowed days per year for each type.
4. WHEN configuring leave request settings THEN the system SHALL allow designation of approval workflows (who can approve which types of requests).

### Requirement 6

**User Story:** As an administrator, I want leave requests to integrate with the work cycle forecasting system, so that approved leaves are properly reflected in attendance data.

#### Acceptance Criteria

1. WHEN a leave request is approved THEN the system SHALL update the attendance data to reflect the approved leave.
2. WHEN a leave request overlaps with forecasted work days THEN the system SHALL mark those days as leave in the attendance data.
3. WHEN a leave request overlaps with forecasted rest days THEN the system SHALL NOT modify those days in the attendance data.
4. WHEN an approved leave request is canceled THEN the system SHALL restore the original forecasted attendance data.

### Requirement 7

**User Story:** As an administrator, I want to ensure leave requests remain consistent when work cycle start dates are modified, so that historical data remains accurate while future forecasts are updated.

#### Acceptance Criteria

1. WHEN an administrator changes a work cycle start date THEN the system SHALL preserve all past approved leave requests in the attendance data.
2. WHEN an administrator changes a work cycle start date THEN the system SHALL recalculate future attendance forecasts without affecting approved leave requests.
3. WHEN an administrator changes a work cycle start date THEN the system SHALL identify any conflicts between new forecasts and existing approved future leave requests.
4. WHEN conflicts are identified between new forecasts and approved leave requests THEN the system SHALL notify the administrator and provide options to resolve the conflicts.
5. WHEN a work cycle type is changed (e.g., from 14-14 to 21-7) THEN the system SHALL handle the transition period appropriately for any existing approved leave requests.
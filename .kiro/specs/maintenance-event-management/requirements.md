# Requirements Document

## Introduction

This system is designed for comprehensive management of Maintenance Events and their associated inspections. The system should provide capabilities for managing main events, sub-events, equipment planning, inspection registration, and comprehensive reporting.

## Requirements

### Requirement 1: Maintenance Events Management

**User Story:** As a maintenance manager, I want to be able to define and manage different maintenance events (such as normal intervals, overhauls) so that I can organize the maintenance process.

#### Acceptance Criteria

1. WHEN user creates a new maintenance event THEN system SHALL record name, type, start date, end date and event status
2. WHEN event is simple type (like normal interval) THEN system SHALL provide direct connection of inspections to main event
3. WHEN event is complex (like overhaul) THEN system SHALL provide capability to define Sub-Events
4. WHEN user changes event status THEN system SHALL change status between "Planning Phase", "In Progress" and "Completed"

### Requirement 2: Sub-Events Management

**User Story:** As a maintenance manager, I want to be able to divide complex events into smaller sub-events so that I can have better management.

#### Acceptance Criteria

1. WHEN main event is complex type THEN system SHALL provide capability to create sub-events
2. WHEN sub-event is created THEN system SHALL record name, description and connection to main event
3. WHEN inspection is registered THEN system SHALL provide connection to related sub-event
4. IF event has sub-events THEN inspections SHALL be connected to sub-events not main event

### Requirement 3: Inspection Planning

**User Story:** As a maintenance planner, I want to be able to define the list of inspections that should be performed in each event so that I can have accurate planning and track requesters.

#### Acceptance Criteria

1. WHEN user creates event or sub-event THEN system SHALL provide capability to add planned inspections
2. WHEN inspection is added to plan THEN system SHALL record equipment tag, requester, priority and description
3. WHEN inspection is in plan THEN system SHALL show its status as "Planned"
4. WHEN inspection starts THEN system SHALL change inspection status to "In Progress"

### Requirement 4: Inspection Management

**User Story:** As an inspector, I want to be able to register and manage inspections related to each equipment so that the inspection process is organized.

#### Acceptance Criteria

1. WHEN new inspection is registered THEN system SHALL record equipment tag, event/sub-event, start date and responsible inspector
2. IF equipment has "In Progress" inspection THEN system SHALL prevent registering new inspection for same equipment
3. WHEN inspection starts THEN system SHALL set its status to "In Progress"
4. WHEN inspection is completed THEN system SHALL set its status to "Completed" and allow registering new inspection for equipment

### Requirement 5: Daily Reports Registration

**User Story:** As an inspector, I want to be able to register daily reports related to each inspection so that work progress is trackable.

#### Acceptance Criteria

1. WHEN inspector registers daily report THEN system SHALL record date, inspector name, description and attachments
2. WHEN daily report is registered THEN system SHALL connect it to related inspection
3. WHEN multiple inspectors work in one day THEN system SHALL provide capability to register multiple reports for one day
4. WHEN daily report is viewed THEN system SHALL display date, inspector name and activity summary

### Requirement 6: Reporting and Analytics

**User Story:** As a maintenance manager, I want to have comprehensive reports of each event status and work progress so that I can make better decisions.

#### Acceptance Criteria

1. WHEN user requests event report THEN system SHALL display number of planned, inspected and under inspection equipment
2. WHEN report is viewed THEN system SHALL display number of completed and in progress inspections
3. WHEN statistics are requested THEN system SHALL identify number of equipment being inspected for first time
4. WHEN detailed report is requested THEN system SHALL categorize planned and completed inspections based on requester
5. WHEN requester analysis is requested THEN system SHALL show inspection statistics grouped by each requester

### Requirement 7: Status Management

**User Story:** As a system user, I want to see the exact status of each event, inspection and equipment so that I have complete understanding of work status.

#### Acceptance Criteria

1. WHEN event is created THEN system SHALL set its status to "Planning Phase"
2. WHEN first inspection of event starts THEN system SHALL change event status to "In Progress"
3. WHEN all planned inspections are completed THEN system SHALL set event status to "Completed"
4. WHEN status changes THEN system SHALL record date and time of status change

### Requirement 8: Enhanced User Interface

**User Story:** As a user, I want to have a simple and understandable user interface that displays information hierarchically.

#### Acceptance Criteria

1. WHEN enhanced daily reports page is loaded THEN system SHALL display events in grouped format
2. WHEN event has sub-events THEN system SHALL display sub-events in nested format
3. WHEN inspections are displayed THEN system SHALL place them under related event or sub-event
4. WHEN daily reports are displayed THEN system SHALL display them under related inspection
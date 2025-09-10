# Requirements Document

## Introduction

This feature enhances the inspection management system by introducing a comprehensive Equipment model and restructuring the Inspection workflow to support maintenance events and daily reporting. The system will support equipment tracking with detailed specifications, maintenance event management, and a structured inspection process that includes daily reports and final reports.

## Requirements

### Requirement 1: Equipment Model Enhancement

**User Story:** As a maintenance manager, I want to track detailed equipment information including specifications, installation details, and maintenance intervals, so that I can effectively manage equipment lifecycle and maintenance schedules.

#### Acceptance Criteria

1. WHEN creating equipment THEN the system SHALL store TAG, description, unit, train, equipment type, installation date, operating pressure, operating temperature, material, inspection interval in months, P&ID reference, and data sheet path
2. WHEN accessing equipment THEN the system SHALL provide a list of all related inspections
3. WHEN equipment is created THEN the system SHALL validate all required fields including TAG uniqueness
4. WHEN equipment operating parameters are updated THEN the system SHALL maintain audit trail of changes

### Requirement 2: Maintenance Event Management

**User Story:** As an operations supervisor, I want to create maintenance events (like overhauls) with sub-events, so that I can organize complex maintenance activities and track their progress systematically.

#### Acceptance Criteria

1. WHEN creating a maintenance event THEN the system SHALL support event types including routine maintenance, overhaul, and custom events
2. WHEN creating an overhaul event THEN the system SHALL support sub-events like total overhaul or train 5 gas overhaul
3. WHEN an event is created THEN the system SHALL allow multiple inspections to be associated with it
4. WHEN viewing an event THEN the system SHALL display all associated inspections and their status

### Requirement 3: Enhanced Inspection Workflow

**User Story:** As an inspector, I want to register inspections within maintenance events with start/end dates and requesting department information, so that I can properly track inspection lifecycle and departmental coordination.

#### Acceptance Criteria

1. WHEN creating an inspection THEN the system SHALL require start date, end date, status (in progress or completed), and requesting department
2. WHEN selecting requesting department THEN the system SHALL provide predefined refinery departments (operations, inspection, maintenance, etc.)
3. WHEN an inspection is created THEN the system SHALL associate it with a specific equipment and optionally with a maintenance event
4. WHEN inspection status changes THEN the system SHALL update timestamps accordingly
5. WHEN inspection is completed THEN the system SHALL require final report submission

### Requirement 4: Daily Report Management

**User Story:** As an inspector, I want to submit daily reports during inspections with inspector assignments and detailed descriptions, so that I can document daily progress and maintain inspection continuity.

#### Acceptance Criteria

1. WHEN creating a daily report THEN the system SHALL require associated inspection, list of inspectors, date, and detailed description
2. WHEN an inspection is in progress THEN the system SHALL allow multiple daily reports to be submitted
3. WHEN viewing an inspection THEN the system SHALL display all associated daily reports in chronological order
4. WHEN a daily report is submitted THEN the system SHALL validate that the inspection is in progress status

### Requirement 5: Model Cleanup and Restructuring

**User Story:** As a system administrator, I want to remove obsolete model classes and streamline the data structure, so that the system maintains clean architecture and improved performance.

#### Acceptance Criteria

1. WHEN system is updated THEN the system SHALL remove MaintenanceRecord, SparePart, EquipmentCategory, EquipmentStatus, EquipmentCondition, MaintenanceType, InspectionTask, InspectionFinding, InspectionSchedule, FindingSeverity, InspectionPriority, InspectionLog, SafetyObservation, PersonnelLog, DailyReportInspector, ReportStatus, WeatherCondition, InspectionType, WorkType, and SafetyRating classes
2. WHEN models are removed THEN the system SHALL ensure no data loss through proper migration strategy
3. WHEN new structure is implemented THEN the system SHALL maintain backward compatibility for existing data where possible

### Requirement 6: Inspection Process Workflow

**User Story:** As a maintenance coordinator, I want to follow a structured process from event creation to final reporting, so that all maintenance activities are properly documented and tracked.

#### Acceptance Criteria

1. WHEN starting maintenance work THEN the system SHALL require creating a maintenance event first
2. WHEN maintenance event is created THEN the system SHALL optionally allow creating sub-events if applicable
3. WHEN inspectors are ready THEN the system SHALL allow registering new inspections within the event
4. WHEN inspection is active THEN the system SHALL allow daily reports to be submitted until completion
5. WHEN inspection work is finished THEN the system SHALL require marking inspection as complete and submitting final report
6. WHEN all inspections in an event are complete THEN the system SHALL allow closing the maintenance event
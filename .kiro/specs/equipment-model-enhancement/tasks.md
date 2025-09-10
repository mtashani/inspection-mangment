# Implementation Plan

- [x] 1. Create new maintenance domain and event models




  - Create new maintenance domain directory structure
  - Implement MaintenanceEvent and MaintenanceSubEvent models with proper relationships
  - Create MaintenanceEventType and MaintenanceEventStatus enums
  - Write unit tests for maintenance event models and validation
  - _Requirements: 2.1, 2.2, 2.3_





- [x] 2. Create RefineryDepartment enum for inspection workflow



  - Implement RefineryDepartment enum with predefined refinery departments
  - Add enum to inspection models module
  - Write unit tests for enum validation




  - _Requirements: 3.2_

- [x] 3. Enhance Equipment model with new fields and relationships

  - Modify Equipment model to replace equipment_code with tag field
  - Add train, equipment_type, and enhanced operating parameter fields
  - Add inspection_interval_months, p_and_id, and data_sheet_path fields
  - Create inspections relationship with Inspection model



  - Write unit tests for enhanced Equipment model validation
  - _Requirements: 1.1, 1.2, 1.3_


- [x] 4. Update Inspection model for maintenance event workflow
  - Add maintenance_event_id foreign key relationship to Inspection model
  - Add requesting_department field with RefineryDepartment enum
  - Add start_date, end_date fields and update status workflow
  - Add final_report field for completion documentation
  - Remove obsolete relationships (tasks, findings) from Inspection model
  - Write unit tests for enhanced Inspection model and relationships
  - _Requirements: 3.1, 3.3, 3.4, 3.5_



- [x] 5. Simplify DailyReport model for inspection tracking
  - Add inspection_id foreign key to DailyReport model
  - Simplify inspector management with flexible approach (IDs and names)
  - Remove complex sub-models and simplify to essential fields
  - Keep core fields: report_date, description, inspectors
  - Write unit tests for simplified DailyReport model and relationships
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 6. Create database migration for new models and relationships
  - Write Alembic migration script to create maintenance_events and maintenance_sub_events tables
  - Add new fields to equipment table (tag, train, equipment_type, etc.)
  - Add new fields to inspections table (maintenance_event_id, requesting_department, etc.)
  - Update daily_reports table structure and relationships
  - Test migration script with sample data
  - _Requirements: 1.4, 3.5, 4.4_

- [ ] 7. Remove obsolete model classes and clean up imports
  - Remove MaintenanceRecord, SparePart, EquipmentCategory, EquipmentStatus, EquipmentCondition classes
  - Remove MaintenanceType, InspectionTask, InspectionFinding, InspectionSchedule classes
  - Remove FindingSeverity, InspectionPriority, InspectionLog, SafetyObservation classes
  - Remove PersonnelLog, DailyReportInspector, ReportStatus, WeatherCondition classes
  - Remove InspectionType, WorkType, SafetyRating classes
  - Clean up unused enum imports and update __init__.py files
  - Write migration script to handle data cleanup and archival
  - _Requirements: 5.1, 5.2_

- [ ] 8. Update API endpoints for equipment management
  - Modify equipment CRUD endpoints to handle new Equipment model structure
  - Add validation for TAG uniqueness and required fields
  - Update equipment list and detail serialization
  - Write integration tests for equipment API endpoints
  - _Requirements: 1.1, 1.3_

- [ ] 9. Implement maintenance event management API endpoints
  - Create CRUD endpoints for MaintenanceEvent model
  - Implement sub-event creation and management endpoints
  - Add event status transition endpoints
  - Write integration tests for maintenance event API endpoints
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 10. Update inspection workflow API endpoints
  - Modify inspection creation endpoint to support maintenance event association
  - Add requesting department validation and selection
  - Update inspection status transition endpoints
  - Add final report submission endpoint
  - Write integration tests for enhanced inspection workflow
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ] 11. Implement daily report API endpoints for inspection tracking
  - Create daily report submission endpoint with inspection association
  - Implement inspector assignment endpoints for daily reports
  - Add daily report listing and filtering by inspection
  - Write integration tests for daily report API endpoints
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 12. Update frontend models and types for new data structure
  - Create TypeScript interfaces for MaintenanceEvent and MaintenanceSubEvent
  - Update Equipment interface with new fields (tag, train, equipment_type, etc.)
  - Update Inspection interface with maintenance event and department fields
  - Update DailyReport interface for simplified structure
  - Write unit tests for frontend model validation
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 13. Implement equipment management UI components
  - Create equipment form component with new fields (TAG, train, equipment_type, etc.)
  - Update equipment list component to display new information
  - Add equipment detail view with inspection history
  - Write component tests for equipment management UI
  - _Requirements: 1.1, 1.2_

- [ ] 14. Create maintenance event management UI
  - Implement maintenance event creation form with event type selection
  - Create sub-event management interface for complex maintenance scenarios
  - Add event timeline and status tracking components
  - Write component tests for maintenance event UI
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 15. Update inspection workflow UI components
  - Modify inspection creation form to include maintenance event selection
  - Add requesting department dropdown with refinery departments
  - Update inspection detail view with event association and final report
  - Create inspection status transition interface
  - Write component tests for inspection workflow UI
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ] 16. Implement daily report UI for inspection tracking
  - Create daily report submission form with inspection association
  - Add inspector selection and assignment interface
  - Implement daily report list view filtered by inspection
  - Write component tests for daily report UI
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 17. Create end-to-end workflow integration tests
  - Write automated tests for complete maintenance event workflow
  - Test equipment creation to inspection completion workflow
  - Validate daily report submission and final report process
  - Test data integrity across all model relationships
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
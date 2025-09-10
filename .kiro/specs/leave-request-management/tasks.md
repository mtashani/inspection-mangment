# Implementation Plan

## Overview
This implementation plan outlines the tasks needed to create a separate leave request management system. The system is currently partially implemented within the attendance module, but we will move it to its own domain for better separation of concerns and maintainability.

### Architecture Decision
We have decided to implement the leave request system as a separate domain:

- **Separated Approach**: Create a dedicated leave request domain with its own models, services, and API endpoints
  - Pros: Better separation of concerns, more maintainable as system grows, clearer boundaries
  - Cons: Requires refactoring existing code, need to manage relationships between domains

This approach will require removing the existing leave request functionality from the attendance module and creating new files in a dedicated leave domain.

- [ ] 1. Create New Leave Request Domain Structure
  - [ ] 1.1 Create directory structure for the leave domain
  - [ ] 1.2 Remove leave request code from attendance module
    - Remove LeaveRequest model from attendance.py
    - Remove leave request methods from attendance_service.py
    - Remove leave request endpoints from attendance API
  - [ ] 1.3 Create new leave request models and schemas
    - Create LeaveRequest model with Jalali date support
    - Create LeaveTypeConfig model
    - Create corresponding schemas
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Create Leave Request API Endpoints
  - [ ] 2.1 Create new API router for leave requests
    - Create file structure in backend/app/domains/leave/api/
    - Set up router with proper dependencies
    - _Requirements: 1.1, 2.1, 2.2_
  
  - [ ] 2.2 Implement inspector endpoints
    - Create leave request endpoint
    - View own leave requests endpoint
    - View specific leave request details endpoint
    - Cancel pending leave request endpoint
    - _Requirements: 1.1, 3.1, 3.2, 3.3, 3.4_
    
  - [ ] 2.3 Implement admin endpoints
    - View all leave requests with filtering endpoint
    - Approve leave request endpoint
    - Reject leave request endpoint
    - Leave type configuration endpoints
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. Implement Leave Request Service Enhancements
  - [ ] 3.1 Improve leave request creation and validation
    - Add validation for date ranges
    - Check for overlapping leave requests
    - _Requirements: 1.3, 1.4_
  
  - [ ] 3.2 Enhance leave request approval workflow
    - Update approval process to properly handle admin comments
    - Implement proper rejection workflow with required comments
    - _Requirements: 2.4, 2.5, 2.6_

- [ ] 4. Integrate Leave Requests with Work Cycle System
  - [ ] 4.1 Update attendance records on leave request approval
    - Modify attendance service to update records when leave is approved
    - Handle different attendance statuses based on leave type
    - _Requirements: 4.1, 4.2, 6.1, 6.2_
  
  - [ ] 4.2 Handle work cycle changes with existing leave requests
    - Implement conflict detection between work cycle changes and leave requests
    - Create notification system for conflicts
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 5. Implement Leave Type Configuration
  - Create leave type configuration model and schema
  - Implement API endpoints for managing leave types
  - Add validation based on leave type configuration
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 6. Add Notification System for Leave Requests
  - Implement notifications for leave request status changes
  - Create notifications for conflicts with work cycle changes
  - _Requirements: 1.5, 2.6, 7.4_

- [ ] 7. Implement Frontend Components for Leave Requests
  - [ ] 7.1 Create inspector leave request UI
    - Build leave request form with Jalali calendar support
    - Implement leave request list and detail views
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3_
  
  - [ ] 7.2 Create admin leave request management UI
    - Build leave request dashboard with filtering options
    - Implement approval/rejection workflow UI
    - Create conflict resolution interface
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.4_

- [ ] 8. Add Unit and Integration Tests
  - Write tests for leave request validation
  - Create tests for leave request approval workflow
  - Test integration with work cycle system
  - _Requirements: All_
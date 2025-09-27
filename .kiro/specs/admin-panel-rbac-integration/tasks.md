# Implementation Plan

## Overview

This implementation plan converts the RBAC standardization and admin panel integration design into actionable coding tasks. The plan prioritizes database setup, permission standardization, layout integration, and complete admin functionality implementation.

## Implementation Tasks

- [x] 1. Database Reset and Permission System Setup

  - Delete existing SQLite database file to start fresh
  - Create standardized permission seeding script with 23 predefined permissions
  - Create super admin user seeding script
  - Update database initialization to use new permission structure
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.1, 10.2_

- [x] 2. Backend Permission System Standardization

  - [x] 2.1 Create standardized permission constants and types

    - Define STANDARDIZED_PERMISSIONS constant with all 23 permissions
    - Create TypeScript types for permission validation
    - Update permission validation logic to use standardized list
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Update permission checking middleware

    - Modify require_permission dependency to use standardized permissions
    - Add permission validation to reject non-standard permissions
    - Enhance logging for permission checks and access attempts
    - _Requirements: 1.4, 12.1, 12.3_

  - [x] 2.3 Create database seeding scripts

    - Write script to create all 23 standardized permissions
    - Create default roles (Super Admin, HR Manager, etc.) with appropriate permissions
    - Create super admin user with system_superadmin permission
    - Add validation script to verify seeding completed correctly
    - _Requirements: 1.1, 1.2, 10.3, 10.4_

- [x] 3. Admin Layout Integration and Cleanup


  - [x] 3.1 Analyze and remove separate admin layout components

    - Review existing AdminLayoutContent, AdminSidebar, AdminNavHeader components
    - Identify which files in frontend-v2/src/components/admin/shared/ are no longer needed
    - Delete redundant admin layout components and clean up imports
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Integrate admin routes with main layout

    - Review current admin layout.tsx structure
    - Update admin layout.tsx to use main application layout structure instead of separate sidebar
    - Integrate admin navigation items with main navigation system
    - Ensure breadcrumbs follow main application pattern
    - Test navigation consistency between admin and regular pages
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.3 Update admin navigation and routing

    - Review existing navigation configuration files
    - Add admin navigation items to main navigation configuration
    - Implement permission-based visibility for admin menu items
    - Update routing to work with integrated layout structure
    - _Requirements: 2.3, 2.4, 8.4_

- [ ] 4. Inspector Management Module Implementation






  - [x] 4.1 Create inspector management API endpoints



    - Review existing inspector APIs in backend/app/domains/admin/api/ and backend/app/domains/inspector/api/
    - Analyze current GET /admin/inspectors endpoint for pagination, search, and filtering capabilities
    - Complete or create POST /admin/inspectors for inspector creation if missing
    - Complete or create PUT /admin/inspectors/{id} for inspector updates if missing
    - Complete or create DELETE /admin/inspectors/{id} with safety checks if missing
    - Complete or create role assignment endpoints for inspectors if missing
    - _Requirements: 3.1, 3.2, 3.3, 9.1_

  - [x] 4.2 Build inspector management frontend interface




    - Review existing inspector management components in frontend-v2/src/app/admin/inspectors/
    - Analyze current inspector list, create/edit forms, and search functionality
    - Complete or create inspector list component with DataTable if missing
    - Complete or create inspector create/edit forms with validation if missing
    - Complete or create inspector search and filtering functionality if missing
    - Complete or create role assignment interface for inspectors if missing
    - Complete or create inspector detail view with all information sections if missing
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 11.1, 11.3_



  - [x] 4.3 Add inspector role management features
    - Review existing role assignment components
    - Complete or create role assignment modal/interface if missing
    - Complete or create bulk role assignment functionality if missing
    - Complete or create role removal with confirmation dialogs if missing
    - Complete or create display of current roles and effective permissions if missing
    - _Requirements: 3.4, 3.5_


- [-] 5. Attendance Management Module Implementation



  - [x] 5.1 Create attendance management API endpoints




    - Review existing attendance APIs in backend/app/domains/inspector/api/attendance.py
    - Analyze current GET /admin/attendance endpoint for date range filtering capabilities
    - Complete or create POST /admin/attendance/bulk-import for Excel imports if missing
    - Complete or create attendance reporting endpoints with various formats if missing
    - Complete or create attendance record CRUD operations if missing
    - Complete or create attendance summary and statistics endpoints if missing
    - _Requirements: 4.1, 4.2, 4.3, 9.2_

  - [x] 5.2 Build attendance management frontend interface



    - Review existing attendance components in frontend-v2/src/app/admin/attendance/
    - Analyze current attendance calendar, forms, and reporting interfaces
    - Complete or create attendance calendar view (daily/weekly/monthly) if missing
    - Complete or create attendance record entry forms if missing
    - Complete or create bulk import functionality with file upload if missing
    - Complete or create attendance reporting interface with export options if missing
    - Complete or create attendance summary dashboard if missing
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 11.1, 11.2_

  - [ ] 5.3 Add attendance reporting and analytics


    - Review existing attendance reporting components
    - Complete or create attendance report generation if missing
    - Complete or create export functionality (Excel, PDF) if missing
    - Complete or create attendance analytics and trends if missing
    - Complete or create attendance policy configuration interface if missing
    - _Requirements: 4.3, 4.5, 11.4_

- [ ] 6. Payroll Management Module Implementation

  - [ ] 6.1 Create payroll management API endpoints

    - Review existing payroll APIs in backend/app/domains/admin/api/ or backend/app/domains/inspector/api/
    - Analyze current payroll-related endpoints if any exist
    - Complete or create POST /admin/payroll/calculate for payroll calculations if missing
    - Complete or create GET /admin/payroll/records with period filtering if missing
    - Complete or create payroll export endpoints (Excel, PDF) if missing
    - Complete or create payroll settings management endpoints if missing
    - Complete or create payslip generation and retrieval endpoints if missing
    - _Requirements: 5.1, 5.2, 5.3, 9.3_

  - [ ] 6.2 Build payroll management frontend interface

    - Review existing payroll components in frontend-v2/src/app/admin/payroll/
    - Analyze current payroll calculation, records, and settings interfaces
    - Complete or create payroll calculation interface if missing
    - Complete or create payroll records list with filtering if missing
    - Complete or create payslip generation and preview if missing
    - Complete or create payroll export functionality if missing
    - Complete or create payroll settings configuration interface if missing
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 11.1, 11.4_

  - [ ] 6.3 Add payroll calculation and reporting features
    - Review existing payroll calculation and reporting components
    - Complete or create payroll calculation logic with rates and multipliers if missing
    - Complete or create payroll validation and error checking if missing
    - Complete or create detailed payroll reports if missing
    - Complete or create payroll approval workflow if missing
    - _Requirements: 5.1, 5.5, 11.4_

- [ ] 7. RBAC Management Module Enhancement

  - [ ] 7.1 Update role and permission management APIs

    - Review existing RBAC APIs in backend/app/domains/admin/api/roles.py and permissions.py
    - Analyze current role management endpoints for impact analysis capabilities
    - Complete or create permission usage tracking endpoints if missing
    - Complete or create bulk role assignment APIs if missing
    - Complete or create role/permission validation endpoints if missing
    - Complete or create permission migration utilities if missing
    - _Requirements: 6.1, 6.2, 6.3, 9.4_

  - [ ] 7.2 Build enhanced RBAC management interface

    - Review existing RBAC components in frontend-v2/src/app/admin/rbac/
    - Analyze current role management, permission assignment interfaces
    - Complete or update role management interface with standardized permissions if needed
    - Complete or create permission assignment interface grouped by domain if missing
    - Complete or create role impact analysis views if missing
    - Complete or create bulk role assignment functionality if missing
    - Complete or create permission usage analytics if missing
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 11.1_

  - [ ] 7.3 Add RBAC analytics and validation
    - Review existing RBAC analytics and validation components
    - Complete or create role assignment analytics if missing
    - Complete or create permission usage statistics if missing
    - Complete or create role/permission validation tools if missing
    - Complete or create access audit trail interface if missing
    - _Requirements: 6.4, 6.5, 12.1, 12.3_

- [ ] 8. Report Template Management Module Implementation

  - [ ] 8.1 Create template management API endpoints

    - Review existing template APIs in backend/app/domains/report/api/template_routes.py
    - Analyze current template management endpoints for admin functionality
    - Complete or create GET /admin/templates with categorization if missing
    - Complete or create POST /admin/templates for template creation if missing
    - Complete or create PUT /admin/templates/{id} for template updates if missing
    - Complete or create DELETE /admin/templates/{id} with usage checks if missing
    - Complete or create template validation and cloning endpoints if missing
    - _Requirements: 7.1, 7.2, 7.3, 9.5_

  - [ ] 8.2 Build template management frontend interface

    - Review existing template components in frontend-v2/src/app/admin/templates/
    - Analyze current template list, create/edit forms, and validation interfaces
    - Complete or create template list with categorization and search if missing
    - Complete or create template create/edit forms if missing
    - Complete or create template validation interface if missing
    - Complete or create template cloning functionality if missing
    - Complete or create template usage analytics view if missing
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 11.1_

  - [ ] 8.3 Add template builder and validation features
    - Review existing template builder and validation components
    - Complete or create visual template builder interface if missing
    - Complete or create template field validation if missing
    - Complete or create template preview functionality if missing
    - Complete or create template usage tracking if missing
    - _Requirements: 7.2, 7.4, 7.5_

- [ ] 9. Enhanced Permission-Based UI Controls

  - [ ] 9.1 Create enhanced permission checking components

    - Review existing permission components in frontend-v2/src/components/
    - Analyze current ProtectedButton, PermissionError, ProtectedRoute components
    - Complete or create ProtectedButton component with tooltip support if missing
    - Complete or create PermissionError component with detailed messages if missing
    - Complete or create ProtectedRoute component with better error handling if missing
    - Complete or create permission-based form field disabling if missing
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 9.2 Update existing components with enhanced permission controls

    - Review existing admin components for permission usage
    - Update all admin buttons to use ProtectedButton if not already implemented
    - Add permission tooltips to restricted actions if missing
    - Complete or create dynamic UI updates when permissions change if missing
    - Add informative error messages for restricted access if missing
    - _Requirements: 8.1, 8.2, 8.4, 8.5_

  - [ ] 9.3 Add permission-based navigation and menu controls
    - Review existing navigation components for permission-based controls
    - Update navigation to hide/show items based on permissions if not implemented
    - Add permission indicators in menus if missing
    - Complete or create dynamic menu updates if missing
    - Complete or create permission-based page access controls if missing
    - _Requirements: 8.4, 8.5_

- [ ] 10. Performance Optimization and User Experience

  - [ ] 10.1 Implement optimized data loading

    - Review existing data loading patterns in admin components
    - Add pagination to all admin list views if not implemented
    - Complete or create virtual scrolling for large datasets if missing
    - Complete or create debounced search functionality if missing
    - Complete or create loading states and skeleton screens if missing
    - _Requirements: 11.1, 11.3_

  - [ ] 10.2 Add React Query caching for admin data

    - Review existing React Query usage in admin components
    - Complete or create React Query implementation for inspector data if missing
    - Complete or create caching for roles and permissions if missing
    - Complete or create optimistic updates for admin operations if missing
    - Complete or create background data refresh if missing
    - _Requirements: 11.1, 11.2_

  - [ ] 10.3 Enhance bulk operations and progress tracking
    - Review existing bulk operation components
    - Complete or create progress indicators for bulk operations if missing
    - Complete or create background job tracking if missing
    - Complete or create bulk operation confirmation dialogs if missing
    - Complete or create operation result summaries if missing
    - _Requirements: 11.2, 11.5_

- [ ] 11. Security Enhancements and Audit Trail

  - [ ] 11.1 Enhance API security with detailed logging

    - Update all admin endpoints with enhanced permission checking
    - Add detailed audit logging for all admin operations
    - Implement request validation and sanitization
    - Add rate limiting for sensitive operations
    - _Requirements: 12.1, 12.2, 12.4_

  - [ ] 11.2 Create audit trail interface

    - Review existing audit trail components
    - Complete or create admin action logging system if missing
    - Complete or create audit log viewing interface if missing
    - Complete or create audit log filtering and search if missing
    - Complete or create audit report generation if missing
    - _Requirements: 12.1, 12.3_

  - [ ] 11.3 Add security monitoring and alerts
    - Review existing security monitoring components
    - Complete or create suspicious activity detection if missing
    - Complete or create security alert system if missing
    - Complete or create access attempt monitoring if missing
    - Complete or create security dashboard if missing
    - _Requirements: 12.4, 12.5_

- [ ] 12. Testing and Documentation

  - [ ] 12.1 Create comprehensive tests for admin functionality

    - Write unit tests for all admin components
    - Create integration tests for admin APIs
    - Add E2E tests for admin workflows
    - Test permission-based access controls
    - _Requirements: All requirements validation_

  - [ ] 12.2 Add performance and security tests

    - Test admin interface performance with large datasets
    - Validate permission checking performance
    - Test bulk operation handling
    - Verify security controls and access restrictions
    - _Requirements: 11.1, 11.4, 12.1_

  - [ ] 12.3 Create migration documentation and guides
    - Write migration guide for other domains to adopt standardized RBAC
    - Create admin interface usage documentation
    - Document new permission system and role management
    - Add troubleshooting guide for common issues
    - _Requirements: 10.5, migration guide for other domains_

## Migration Guide for Other Domains

After completing the admin domain implementation, other domains can be migrated using this pattern:

### Step 1: Permission Analysis

- Identify current permission usage in the domain
- Map existing permissions to standardized permissions
- Determine which of the 23 permissions apply to the domain

### Step 2: API Updates

- Update all domain API endpoints to use `require_standardized_permission`
- Replace old permission checks with standardized permission names
- Add proper error handling and logging

### Step 3: Frontend Integration

- Update domain components to use main layout structure
- Replace custom permission checking with `usePermissions` hook
- Implement `ProtectedButton` and `ProtectedRoute` components
- Add proper error messages for restricted access

### Step 4: Testing and Validation

- Test all domain functionality with new permission system
- Verify UI updates correctly based on user permissions
- Validate API security with standardized permissions
- Ensure consistent user experience across domains

### Example Domain Migration (Maintenance Events):

```typescript
// Before
const canCreateEvent = hasPermission('maintenance', 'create');

// After
const canCreateEvent = hasPermission('maintenance_edit');

// API Update
@router.post("/maintenance/events")
async def create_event(
    current_inspector: Inspector = Depends(require_standardized_permission("maintenance_edit"))
)

// Component Update
<ProtectedButton
  requiredPermission="maintenance_edit"
  fallbackMessage="برای ایجاد ایونت تعمیراتی نیاز به دسترسی مدیریت تعمیرات دارید"
>
  ایجاد ایونت
</ProtectedButton>
```

This migration pattern ensures consistency across all domains while maintaining the standardized RBAC system.

# Implementation Plan

- [ ] 1. Database Schema and Model Updates





  - Update Inspector model by removing enum-based fields and complex relationships
  - Add display_label field to Role and Permission models for UI presentation
  - Create database migration scripts for schema changes
  - _Requirements: 8.1, 8.2, 8.4_

- [x] 1.1 Refactor Inspector Model


  - Remove inspector_type enum field from Inspector model
  - Remove specialties JSON field and related helper methods
  - Remove complex relationship mappings (psv_calibrations, corrosion_analysis_reports, etc.)
  - Keep essential relationships (roles, certifications, documents, notifications, inspection_assignments)
  - Update model to match simplified design specification
  - _Requirements: 8.1, 8.2_



- [x] 1.2 Enhance RBAC Models
  - Add display_label field to Role model for UI presentation
  - Add display_label field to Permission model for UI presentation
  - Enable relationships in Role and Permission models (currently disabled)
  - Create proper foreign key relationships between all RBAC tables


  - _Requirements: 3.2, 7.2_

- [x] 1.3 Database Recreation and Schema Setup
  - Delete existing SQLite database file and recreate from scratch with new schema
  - Run Alembic migrations to create all tables with updated Inspector model (without inspector_type and specialties)
  - Add display_label fields to roles and permissions tables in initial migration
  - Verify all RBAC relationships are properly created in fresh database
  - _Requirements: 8.1, 8.3, 8.5_
-

- [ ] 2. Enhanced Authentication Service




  - Extend AuthService to load and include roles/permissions in JWT tokens
  - Implement permission checking with database queries and caching
  - Create middleware for protecting API endpoints with specific permissions
  - _Requirements: 1.2, 1.5, 9.1, 9.3_

- [x] 2.1 JWT Token Enhancement


  - Modify create_access_token method to include user roles and permissions in token payload
  - Update token validation to extract and validate roles/permissions
  - Implement token refresh mechanism that updates permissions dynamically
  - Add error handling for malformed or expired tokens
  - _Requirements: 1.2, 1.5_

- [x] 2.2 Permission Checking Service


  - Implement has_permission method with database queries through role relationships
  - Add caching layer using Redis for permission lookups to improve performance
  - Create cache invalidation logic when roles or permissions change
  - Write unit tests for permission checking logic with various role combinations
  - _Requirements: 1.5, 9.1, 9.3_



- [x] 2.3 Authorization Middleware
  - Create require_permission dependency function for protecting FastAPI endpoints
  - Implement permission checking that works with multiple roles per user
  - Add comprehensive error handling for authentication and authorization failures
  - Create logging for all authorization attempts and failures for audit purposes
  - _Requirements: 5.1, 5.2, 10.1, 10.3_
-

- [x] 3. Admin Management API Endpoints



  - Create CRUD endpoints for roles management (create, read, update, delete)
  - Create CRUD endpoints for permissions management
  - Implement role-permission assignment endpoints
  - Create inspector-role assignment endpoints with bulk operations support
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2, 7.1, 7.4_

- [x] 3.1 Role Management Endpoints


  - Create POST /admin/roles endpoint for creating new roles with validation
  - Create GET /admin/roles endpoint for listing all roles with pagination
  - Create PUT /admin/roles/{id} endpoint for updating role details
  - Create DELETE /admin/roles/{id} endpoint with safety checks for active assignments
  - Add comprehensive input validation and error handling for all role operations
  - _Requirements: 2.1, 2.4, 7.1_



- [x] 3.2 Permission Management Endpoints
  - Create POST /admin/permissions endpoint for creating new permissions
  - Create GET /admin/permissions endpoint for listing permissions with filtering
  - Create PUT /admin/permissions/{id} endpoint for updating permission details
  - Create DELETE /admin/permissions/{id} endpoint with dependency checking
  - Implement permission discovery endpoint that returns available resources and actions
  - _Requirements: 3.1, 3.2, 3.5, 7.2_

- [x] 3.3 Role-Permission Assignment Endpoints


  - Create PUT /admin/roles/{id}/permissions endpoint for assigning permissions to roles
  - Create DELETE /admin/roles/{id}/permissions/{permission_id} for removing specific permissions
  - Create GET /admin/roles/{id}/permissions endpoint for viewing role permissions
  - Implement bulk assignment operations for efficiency
  - Add validation to prevent invalid permission assignments
  - _Requirements: 2.2, 2.3, 7.3_

- [x] 3.4 Inspector-Role Assignment Endpoints



  - Create PUT /admin/inspectors/{id}/roles endpoint for assigning roles to inspectors
  - Create DELETE /admin/inspectors/{id}/roles/{role_id} for removing specific roles
  - Create GET /admin/inspectors/{id}/roles endpoint for viewing inspector roles
  - Implement bulk role assignment for multiple inspectors
  - Add immediate permission cache invalidation when roles change
  - _Requirements: 4.1, 4.2, 4.4, 7.4_

- [x] 4. Dynamic UI Access Control System





  - Create permission context provider for React frontend
  - Implement permission-based component rendering
  - Create protected route components that check permissions
  - Update navigation components to show only authorized menu items
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 4.1 Permission Context and Hooks


  - Create PermissionContext provider that manages user permissions and roles
  - Implement usePermissions hook for accessing permission checking functions
  - Create useRoles hook for role-based access control
  - Add automatic context updates when user permissions change
  - Write comprehensive tests for permission context functionality
  - _Requirements: 5.1, 5.5_



- [x] 4.2 Protected Route Components
  - Create ProtectedRoute component that checks permissions before rendering
  - Implement RoleBasedRoute component for role-specific access control
  - Create AccessDenied component for unauthorized access scenarios
  - Add redirect logic for unauthorized users to appropriate error pages


  - _Requirements: 5.4_

- [x] 4.3 Dynamic Navigation System
  - Update main navigation component to filter menu items based on user permissions
  - Create dynamic sidebar that shows only authorized sections


  - Implement breadcrumb system that respects permission boundaries
  - Add visual indicators for restricted areas
  - _Requirements: 5.1, 5.2_

- [x] 4.4 Permission-Based UI Elements
  - Create conditional rendering utilities for buttons and actions based on permissions
  - Implement dynamic form field rendering based on user access levels
  - Update dropdown components to show only authorized options (e.g., eligible inspectors)
  - Add permission-based styling and visual cues for UI elements
  - _Requirements: 5.2, 5.3, 6.5_

- [x] 5. Integration with Existing Pages
  - [x] 5.1 Admin Panel Integration

    - Integrate RBAC system with existing admin panel pages
    - Add permission checks to admin components
    - Update admin navigation to use permission-based filtering
    - _Requirements: 1.1, 2.1, 5.1_
  
  - [x] 5.2 Maintenance Events Integration  
    - Update maintenance events pages to use permission-based access
    - Add permission checks to maintenance event forms and components
    - Integrate with existing maintenance event workflows
    - _Requirements: 1.1, 2.1, 5.1_

- [x] 6. Developer Documentation and Guidelines





  - [x] 6.1 Create comprehensive developer guide for RBAC system
  - [x] 6.2 Write integration examples and best practices
  - [x] 6.3 Create migration guide for existing components
  - [x] 6.4 Document permission patterns and conventions
  - _Requirements: All requirements_

- [ ] 7. Future Report Access Control Implementation (For when report pages are built)
  - Update report creation endpoints to check appropriate permissions
  - Implement report approval workflow with role-based authorization
  - Create filtered report listing based on user permissions
  - Add permission-based deletion controls for reports
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 7.1 Report Creation Access Control
  - Update PSV report creation to require psv:create permission
  - Update NDT report creation to require ndt:create permission
  - Update mechanical report creation to require mechanical:create permission
  - Add permission checks for all other report types (corrosion, crane, electrical, instrumentation)
  - Implement inspector eligibility filtering for report assignment dropdowns
  - _Requirements: 6.1, 6.5_

- [ ] 7.2 Report Approval Workflow
  - Implement approval endpoints that check appropriate approve permissions
  - Create multi-level approval system (initial approval + final approval)
  - Add approval history tracking with inspector information
  - Update report status based on approval permissions and workflow rules
  - _Requirements: 6.2_

- [ ] 7.3 Report Listing and Filtering
  - Update report listing endpoints to filter results based on user permissions
  - Implement section-based filtering for managers (only their department reports)
  - Create "my reports" filtering for inspectors to see only their own reports
  - Add permission-based column visibility in report tables
  - _Requirements: 6.3_

- [ ] 7.4 Report Deletion Controls
  - Implement delete_own_report permission checking for inspector's own reports
  - Add delete_section_report permission for department managers
  - Create delete_all_reports permission for global administrators
  - Add confirmation dialogs and audit logging for all deletion operations
  - _Requirements: 6.4_

- [ ] 8. Administrative Interface Development (Future Enhancement)
  - Create admin dashboard with role and permission management sections
  - Build role management interface with CRUD operations
  - Develop permission management interface with assignment capabilities
  - Create user role assignment interface with bulk operations
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 6.1 Admin Dashboard
  - Create main admin dashboard with overview of roles, permissions, and users
  - Add statistics cards showing role distribution and permission usage
  - Implement quick actions for common administrative tasks
  - Create navigation structure for all admin management sections
  - _Requirements: 7.1_

- [ ] 6.2 Role Management Interface
  - Build role listing page with search, filter, and pagination capabilities
  - Create role creation form with validation and error handling
  - Implement role editing interface with permission assignment
  - Add role deletion functionality with safety checks and confirmations
  - _Requirements: 7.1, 7.5_

- [ ] 6.3 Permission Management Interface
  - Create permission listing page with resource and action filtering
  - Build permission creation form with resource/action selection
  - Implement permission editing interface with description updates
  - Add permission usage tracking to show which roles use each permission
  - _Requirements: 7.2_

- [ ] 6.4 User Role Assignment Interface
  - Create inspector listing page with role assignment capabilities
  - Build bulk role assignment interface for multiple inspectors
  - Implement role removal functionality with immediate effect
  - Add role assignment history and audit trail viewing
  - _Requirements: 7.4, 7.5_

- [ ] 7. Data Migration and System Integration
  - Create comprehensive data migration scripts for existing inspector types and specialties
  - Implement rollback mechanisms for failed migrations
  - Update all existing API endpoints to use new permission system
  - Create seeding scripts for default roles and permissions
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [ ] 7.1 Fresh Database Setup
  - Create fresh SQLite database with new schema (no migration needed)
  - Set up initial inspector records with proper authentication fields (username, password_hash, can_login)
  - Create sample data that demonstrates the new RBAC system functionality
  - Implement data backup/restore utilities for development and testing
  - _Requirements: 8.1, 8.2, 8.5_

- [ ] 7.2 Default Data Seeding
  - Create seeding script for standard roles (NDT Inspector, Mechanical Inspector, etc.)
  - Write seeding script for standard permissions (create, approve, delete operations)
  - Implement role-permission assignment seeding for default configurations
  - Create admin user seeding with full permissions for initial system setup
  - _Requirements: 8.3_

- [ ] 7.3 API Endpoint Updates
  - Update all existing endpoints to use new permission checking middleware
  - Replace enum-based access controls with permission-based checks
  - Update inspector filtering logic in forms and dropdowns to use role-based queries
  - Add permission validation to all CRUD operations across all domains
  - _Requirements: 8.4_

- [ ] 8. Performance Optimization and Caching
  - Implement Redis caching for permission lookups
  - Create database query optimization for role/permission joins
  - Add performance monitoring for permission checking operations
  - Implement cache invalidation strategies for role/permission changes
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 8.1 Caching Implementation
  - Set up Redis caching for user permission lookups with appropriate TTL
  - Implement cache warming strategies for frequently accessed permissions
  - Create cache invalidation logic triggered by role/permission modifications
  - Add cache hit/miss monitoring and performance metrics
  - _Requirements: 9.2, 9.3_

- [ ] 8.2 Database Query Optimization
  - Create optimized queries for permission checking with proper indexing
  - Implement materialized views for complex permission aggregations
  - Add database connection pooling configuration for high concurrency
  - Create query performance monitoring and slow query identification
  - _Requirements: 9.1, 9.4_

- [ ] 9. Security and Audit Implementation
  - Implement comprehensive audit logging for all authorization events
  - Create security monitoring for suspicious permission access patterns
  - Add rate limiting for authentication and admin operations
  - Implement secure session management with proper token expiration
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 9.1 Audit Logging System
  - Create audit log model for tracking all permission-related operations
  - Implement logging for successful and failed authorization attempts
  - Add audit trail for role and permission modifications with user attribution
  - Create audit log viewing interface for administrators
  - _Requirements: 10.1, 10.2_

- [ ] 9.2 Security Monitoring
  - Implement detection for unusual permission access patterns
  - Create alerting system for potential privilege escalation attempts
  - Add monitoring for failed authentication attempts and account lockout
  - Implement security dashboard for real-time threat monitoring
  - _Requirements: 10.3, 10.5_

- [ ] 10. Testing and Quality Assurance
  - Write comprehensive unit tests for all permission checking logic
  - Create integration tests for complete authentication and authorization flows
  - Implement end-to-end tests for admin management workflows
  - Add performance tests for permission checking under load
  - _Requirements: All requirements validation_

- [ ] 10.1 Unit Testing
  - Write unit tests for AuthService permission checking methods
  - Create tests for role and permission CRUD operations
  - Implement tests for JWT token generation and validation with roles/permissions
  - Add tests for cache operations and invalidation logic
  - _Requirements: All core functionality_

- [ ] 10.2 Integration Testing
  - Create end-to-end authentication flow tests from login to permission checking
  - Write integration tests for admin management API endpoints
  - Implement tests for permission enforcement across different user roles
  - Add tests for migration scripts and data integrity
  - _Requirements: Complete system workflow_

- [ ] 10.3 Performance and Security Testing
  - Create load tests for permission checking with multiple concurrent users
  - Implement security tests for JWT token manipulation and privilege escalation
  - Add performance benchmarks for database queries and cache operations
  - Create penetration tests for admin interfaces and permission bypass attempts
  - _Requirements: 9.1, 10.3, 10.4_
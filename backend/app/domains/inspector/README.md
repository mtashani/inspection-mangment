# Inspector Management System

This module implements a comprehensive inspector management system with authentication, role-based access control, and document management.

## Features

- **Authentication** - Inspectors can log in to the system using username/password
- **Role-based access control** - Permissions are assigned through roles
- **Profile management** - Inspectors can manage their profile information and upload profile images
- **Document storage** - Store inspector documents and certificates using S3 or local filesystem
- **Specialized inspector types** - Different inspector types for different inspection areas
- **Admin dashboard** - Admin interface for managing inspectors and their roles

## Inspector Types

- Mechanical - For mechanical inspections including PSV calibration
- Corrosion - For corrosion monitoring and analysis
- NDT - Non-Destructive Testing inspectors
- Electrical - For electrical inspection tasks
- Instrumentation - For instrumentation inspection tasks
- Civil - For civil/structural inspections
- General - For general inspection tasks
- PSVOperator - Operators who perform PSV tests
- LiftingEquipmentOperator - Operators for lifting equipment tests

## Roles and Permissions

The system includes the following default roles:

1. **Admin** - Full system access
2. **PSVInspector** - Can create and modify PSV calibration records
3. **CorrosionInspector** - Can create and modify corrosion records
4. **PSVApprover** - Can approve PSV calibration reports
5. **CorrosionApprover** - Can approve corrosion analysis reports
6. **LiftingEquipmentOperator** - Operator for lifting equipment tests
7. **PSVOperator** - Operator for PSV tests

Permissions are grouped by resource:

- `inspectors` - Managing inspector accounts
- `psv` - PSV related operations
- `calibration` - Calibration record operations
- `corrosion` - Corrosion monitoring operations
- `admin` - Administrative functions

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Log in and get access token
- `POST /api/v1/auth/logout` - Log out
- `GET /api/v1/auth/me` - Get current user information

### Admin Functions
- `GET /api/v1/admin/inspectors` - List all inspectors
- `POST /api/v1/admin/inspectors` - Create new inspector
- `PUT /api/v1/admin/inspectors/{id}` - Update inspector
- `DELETE /api/v1/admin/inspectors/{id}` - Delete inspector
- `PUT /api/v1/admin/inspectors/{id}/roles` - Assign roles to inspector

### Profile Management
- `POST /api/v1/inspectors/{id}/profile-image` - Upload profile image
- `GET /api/v1/inspectors/{id}/documents` - List inspector documents
- `POST /api/v1/inspectors/{id}/documents` - Upload inspector documents

## Database Migration

Use the migration script `add_auth_and_roles.py` to update the database schema with all required tables and relationships.

## Frontend Components

- Login page for authentication
- Admin dashboard for inspector management
- Profile page for inspector profile management
- Role-based UI components that adapt to user permissions
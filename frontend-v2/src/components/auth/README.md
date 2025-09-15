# Dynamic RBAC System

This directory contains the complete implementation of the Dynamic Role-Based Access Control (RBAC) system for the inspection management platform.

## Overview

The RBAC system provides fine-grained permission control across the entire application, automatically filtering UI elements, navigation, and content based on user permissions and roles.

## Architecture

### Core Components

1. **Permission Context** (`permission-context.tsx`)
   - Manages user permissions and roles
   - Provides permission checking functions
   - Integrates with authentication system

2. **Permission Hooks** (`../hooks/use-permissions.ts`)
   - `usePermissions()` - Main permission checking
   - `useRoles()` - Role-based access control
   - `useResourcePermissions()` - Resource-specific permissions
   - Domain-specific hooks (PSV, NDT, Mechanical, etc.)

3. **Protected Components**
   - `ProtectedRoute` - Route-level protection
   - `RoleBasedRoute` - Role-specific routes
   - `PermissionGuard` - Component-level protection
   - `AccessDenied` - User-friendly error pages

4. **Permission-Aware UI Components**
   - Permission buttons (Create, Edit, Delete, Approve)
   - Permission form fields (hide/disable/readonly)
   - Permission selects (filtered options)
   - Permission badges and indicators

## Backend Integration

The system integrates with the backend Inspector model and authorization system:

### User Data Structure

```typescript
interface RBACUser {
  id: number;
  username: string | null;
  email: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  // ... other Inspector model fields
  roles: string[];
  permissions: string[];
}
```

### Permission Format

Permissions follow the format: `resource:action`

- Examples: `psv:create`, `ndt:approve`, `admin:manage_roles`

### JWT Token Integration

- Permissions and roles are embedded in JWT tokens
- Automatically extracted and used by the frontend
- Token refresh maintains up-to-date permissions

## Usage Examples

### Basic Permission Checking

```tsx
import { usePermissions } from '@/hooks/use-permissions';

function MyComponent() {
  const { hasPermission } = usePermissions();

  if (hasPermission('psv', 'create')) {
    return <CreatePSVButton />;
  }

  return null;
}
```

### Protected Routes

```tsx
import { ProtectedRoute } from '@/components/auth';

function PSVCreatePage() {
  return (
    <ProtectedRoute permission={{ resource: 'psv', action: 'create' }}>
      <PSVCreateForm />
    </ProtectedRoute>
  );
}
```

### Permission-Based UI Elements

```tsx
import {
  CreateButton,
  PermissionGuard,
} from '@/components/ui/permission-components';

function PSVDashboard() {
  return (
    <div>
      <CreateButton resource="psv">Create PSV Report</CreateButton>

      <PermissionGuard permission={{ resource: 'psv', action: 'approve' }}>
        <PSVApprovalSection />
      </PermissionGuard>
    </div>
  );
}
```

### Dynamic Navigation

```tsx
import { useNavigation } from '@/hooks/use-navigation';

function Sidebar() {
  const { navigation } = useNavigation();

  return (
    <nav>
      {navigation.map(item => (
        <NavItem key={item.title} item={item} />
      ))}
    </nav>
  );
}
```

## Permission Resources and Actions

### Resources

- `psv` - PSV calibration and testing
- `ndt` - Non-destructive testing
- `mechanical` - Mechanical inspections
- `corrosion` - Corrosion analysis
- `crane` - Crane inspections
- `electrical` - Electrical inspections
- `instrumentation` - Instrumentation inspections
- `report` - General reporting
- `admin` - System administration
- `quality` - Quality control
- `user` - User management
- `inspector` - Inspector management

### Actions

- `create` - Create new records
- `view` - View records
- `edit_own` - Edit own records
- `edit_all` - Edit any records
- `approve` - Approve records
- `final_approve` - Final approval
- `delete_own` - Delete own records
- `delete_section` - Delete section records
- `delete_all` - Delete any records
- `manage` - Full management access
- `execute_test` - Execute tests
- `quality_inspect` - Quality inspection
- `quality_approve` - Quality approval

## Standard Roles

### Admin Roles

- `Global Admin` - Full system access
- `System Admin` - System administration

### Manager Roles

- `Mechanical Manager` - Mechanical department management
- `NDT Manager` - NDT department management
- `PSV Manager` - PSV department management
- `QC Manager` - Quality control management

### Inspector Roles

- `NDT Inspector` - NDT inspections
- `Mechanical Inspector` - Mechanical inspections
- `PSV Inspector` - PSV inspections
- `Corrosion Inspector` - Corrosion analysis
- `Crane Inspector` - Crane inspections
- `Electrical Inspector` - Electrical inspections
- `Instrumentation Inspector` - Instrumentation inspections
- `QC Inspector` - Quality control inspections

### Operator Roles

- `PSV Test Operator` - PSV test operations

## Testing

The system includes comprehensive tests:

- Permission context tests
- Hook tests
- Component tests
- Integration tests
- Auth utility tests

Run tests with:

```bash
npm test -- --testPathPattern="permission|auth"
```

## Configuration

### Navigation Configuration

Edit `../lib/navigation-config.ts` to modify navigation structure and permissions.

### Permission Constants

Edit `../types/permissions.ts` to add new resources, actions, or roles.

### Auth Integration

Edit `../lib/auth-utils.ts` to modify user data transformation.

## Troubleshooting

### Common Issues

1. **Permissions not updating**
   - Check JWT token expiration
   - Verify backend permission assignment
   - Clear localStorage and re-login

2. **Navigation not filtering**
   - Verify navigation configuration
   - Check permission format (resource:action)
   - Ensure user has required permissions

3. **Components not hiding**
   - Check PermissionGuard usage
   - Verify permission prop format
   - Check fallback components

### Debug Mode

Enable debug logging:

```typescript
// In development
localStorage.setItem('rbac-debug', 'true');
```

## Migration Guide

### From Legacy Auth System

1. Update User interface imports
2. Replace role checks with permission checks
3. Update navigation configuration
4. Add permission guards to components
5. Test all protected routes and components

### Adding New Permissions

1. Add resource/action to constants
2. Update backend permission seeding
3. Add to navigation configuration
4. Create UI components
5. Add tests

## Performance Considerations

- Permission checks are memoized
- Navigation filtering is cached
- Token parsing is optimized
- Component re-renders are minimized

## Security Notes

- Never rely solely on frontend permission checks
- Always validate permissions on the backend
- Use HTTPS in production
- Implement proper token refresh
- Log permission violations for audit

## Contributing

When adding new features:

1. Follow the established patterns
2. Add comprehensive tests
3. Update documentation
4. Consider backward compatibility
5. Test with different permission sets

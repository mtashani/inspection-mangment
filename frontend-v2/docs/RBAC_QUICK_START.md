# RBAC Quick Start Guide

## Setup and Installation (5 minutes)

### 1. Add Providers

```tsx
// app/layout.tsx
import { AuthProvider } from '@/contexts/auth-context';
import { PermissionProvider } from '@/contexts/permission-context';

export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      <PermissionProvider>{children}</PermissionProvider>
    </AuthProvider>
  );
}
```

### 2. Protect Pages

```tsx
// pages/psv-reports.tsx
import { ProtectedRoute } from '@/components/auth';

export default function PSVReportsPage() {
  return (
    <ProtectedRoute permission={{ resource: 'psv', action: 'view' }}>
      <div>PSV Reports Page Content</div>
    </ProtectedRoute>
  );
}
```

### 3. Use Permission-Based Buttons

```tsx
import {
  CreateButton,
  EditButton,
  DeleteButton,
} from '@/components/ui/permission-components';

function ReportCard({ report }) {
  return (
    <div>
      <h3>{report.title}</h3>
      <div className="flex gap-2">
        <CreateButton resource="psv">Create</CreateButton>
        <EditButton resource="psv" isOwn={true}>
          Edit
        </EditButton>
        <DeleteButton resource="psv" scope="own">
          Delete
        </DeleteButton>
      </div>
    </div>
  );
}
```

## Common Patterns

### Conditional Protection

```tsx
import { PermissionGuard } from '@/components/auth';

<PermissionGuard permission={{ resource: 'psv', action: 'approve' }}>
  <ApproveButton />
</PermissionGuard>;
```

### Permission Checks in Code

```tsx
import { usePermissions } from '@/hooks/use-permissions';

function MyComponent() {
  const { hasPermission } = usePermissions();

  if (hasPermission('psv', 'create')) {
    // Show content
  }
}
```

### Automatic Navigation

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

## Important Resources and Actions

### Resources

- `psv` - PSV Reports
- `ndt` - NDT Reports
- `mechanical` - Mechanical Reports
- `admin` - System Administration

### Actions

- `create` - Create
- `view` - View
- `edit_own` - Edit Own
- `edit_all` - Edit All
- `approve` - Approve
- `delete_own` - Delete Own

## Important Notes

1. **Always check on backend too** - Frontend is only for UX
2. **Use fallbacks** - Appropriate messages for users without access
3. **Performance** - Use useMemo for complex calculations
4. **Testing** - Test components with different permissions

## Complete Example

```tsx
import { ProtectedRoute, PermissionGuard } from '@/components/auth';
import {
  CreateButton,
  EditButton,
} from '@/components/ui/permission-components';
import { usePermissions } from '@/hooks/use-permissions';

function PSVReportsPage() {
  const { hasPermission } = usePermissions();

  return (
    <ProtectedRoute permission={{ resource: 'psv', action: 'view' }}>
      <div>
        <div className="flex justify-between">
          <h1>PSV Reports</h1>
          <CreateButton resource="psv">Create Report</CreateButton>
        </div>

        {hasPermission('psv', 'approve') && (
          <div className="mb-4">
            <h2>Pending Approval Reports</h2>
            {/* Reports list */}
          </div>
        )}

        <PermissionGuard
          permission={{ resource: 'admin', action: 'manage' }}
          fallback={<div>Only administrators can view this section</div>}
        >
          <AdminSection />
        </PermissionGuard>
      </div>
    </ProtectedRoute>
  );
}
```

For more information, read `RBAC_DEVELOPER_GUIDE.md`.

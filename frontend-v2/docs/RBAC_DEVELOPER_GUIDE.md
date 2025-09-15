# Comprehensive RBAC System Developer Guide

## Introduction

This guide is written for developers who want to use the Role-Based Access Control (RBAC) system in the inspection management platform. The RBAC system provides fine-grained and dynamic access control across all application sections.

## System Architecture

### Core Components

1. **Permission Context** - Manages user permissions and roles
2. **Protected Components** - Protects routes and components
3. **Permission-Aware UI** - UI elements that change based on permissions
4. **Navigation System** - Dynamic navigation system
5. **Auth Integration** - Integration with authentication system

## Installation and Setup

### 1. Add Providers

In your `layout.tsx` or `app.tsx` file:

```tsx
import { AuthProvider } from '@/contexts/auth-context';
import { PermissionProvider } from '@/contexts/permission-context';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <PermissionProvider>
            {children}
          </PermissionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Using Hooks

```tsx
import { usePermissions, useRoles } from '@/hooks/use-permissions';

function MyComponent() {
  const { hasPermission, permissions } = usePermissions();
  const { isAdmin, isManager } = useRoles();
  
  // Use permission checks
}
```

## Usage Patterns

### 1. Route Protection

#### Simple Protection
```tsx
import { ProtectedRoute } from '@/components/auth';

function PSVReportsPage() {
  return (
    <ProtectedRoute permission={{ resource: 'psv', action: 'view' }}>
      <PSVReportsList />
    </ProtectedRoute>
  );
}
```

#### Role-Based Protection
```tsx
import { RoleBasedRoute } from '@/components/auth';

function AdminPanel() {
  return (
    <RoleBasedRoute allowedRoles={['Global Admin', 'System Admin']}>
      <AdminDashboard />
    </RoleBasedRoute>
  );
}
```

#### Multiple Permission Protection
```tsx
<ProtectedRoute 
  permissions={[
    { resource: 'psv', action: 'create' },
    { resource: 'ndt', action: 'create' }
  ]}
  requireAll={false} // Only need one of the permissions
>
  <CreateReportPage />
</ProtectedRoute>
```

### 2. Component Protection

#### Using PermissionGuard
```tsx
import { PermissionGuard } from '@/components/auth';

function ReportActions({ reportId }: { reportId: number }) {
  return (
    <div className="flex gap-2">
      <PermissionGuard permission={{ resource: 'psv', action: 'edit_own' }}>
        <EditButton reportId={reportId} />
      </PermissionGuard>
      
      <PermissionGuard permission={{ resource: 'psv', action: 'approve' }}>
        <ApproveButton reportId={reportId} />
      </PermissionGuard>
      
      <PermissionGuard permission={{ resource: 'psv', action: 'delete_own' }}>
        <DeleteButton reportId={reportId} />
      </PermissionGuard>
    </div>
  );
}
```

#### Using Conditional Rendering
```tsx
import { usePermissions } from '@/hooks/use-permissions';

function Dashboard() {
  const { hasPermission } = usePermissions();
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {hasPermission('psv', 'create') && (
        <CreatePSVButton />
      )}
      
      {hasPermission('admin', 'manage') && (
        <AdminSection />
      )}
    </div>
  );
}
```

### 3. Using Permission-Based UI Components

#### Action Buttons
```tsx
import { 
  CreateButton, 
  EditButton, 
  DeleteButton, 
  ApproveButton 
} from '@/components/ui/permission-components';

function PSVReportCard({ report }: { report: PSVReport }) {
  return (
    <Card>
      <CardContent>
        <h3>{report.title}</h3>
        <div className="flex gap-2 mt-4">
          <CreateButton resource="psv">
            Create New Report
          </CreateButton>
          
          <EditButton resource="psv" isOwn={report.inspector_id === currentUserId}>
            Edit
          </EditButton>
          
          <ApproveButton resource="psv">
            Approve
          </ApproveButton>
          
          <DeleteButton resource="psv" scope="own">
            Delete
          </DeleteButton>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Form Fields
```tsx
import { 
  PermissionInput, 
  PermissionSelect, 
  PermissionCheckbox 
} from '@/components/ui/permission-components';

function PSVReportForm() {
  return (
    <form>
      <PermissionInput
        permission={{ resource: 'psv', action: 'create' }}
        label="PSV Serial Number"
        placeholder="Enter serial number"
        required
      />
      
      <PermissionSelect
        permission={{ resource: 'psv', action: 'create' }}
        label="PSV Type"
        description="Select the type of safety valve"
      >
        <option value="safety">Safety Valve</option>
        <option value="relief">Relief Valve</option>
      </PermissionSelect>
      
      <PermissionCheckbox
        permission={{ resource: 'quality', action: 'quality_approve' }}
        label="Quality Approved"
        description="Only quality control personnel can modify this field"
      />
    </form>
  );
}
```

### 4. Dynamic Navigation

#### Using Navigation Hook
```tsx
import { useNavigation } from '@/hooks/use-navigation';

function Sidebar() {
  const { navigation, isLoading } = useNavigation();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <nav>
      {navigation.map(item => (
        <NavItem key={item.title} item={item} />
      ))}
    </nav>
  );
}
```

#### Using Permission-Aware Sidebar
```tsx
import { AppSidebarPermissionAware } from '@/components/app-sidebar-permission-aware';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <AppSidebarPermissionAware />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
```

## Resources and Actions

### Available Resources
```typescript
export const RESOURCES = {
  PSV: 'psv',                    // PSV calibration and testing
  NDT: 'ndt',                    // Non-destructive testing
  MECHANICAL: 'mechanical',       // Mechanical inspections
  CORROSION: 'corrosion',        // Corrosion analysis
  CRANE: 'crane',                // Crane inspections
  ELECTRICAL: 'electrical',      // Electrical inspections
  INSTRUMENTATION: 'instrumentation', // Instrumentation
  REPORT: 'report',              // General reporting
  ADMIN: 'admin',                // System administration
  QUALITY: 'quality',            // Quality control
  USER: 'user',                  // User management
  INSPECTOR: 'inspector',        // Inspector management
} as const;
```

### Available Actions
```typescript
export const ACTIONS = {
  CREATE: 'create',              // Create new records
  VIEW: 'view',                  // View records
  EDIT_OWN: 'edit_own',         // Edit own records
  EDIT_ALL: 'edit_all',         // Edit all records
  APPROVE: 'approve',            // Approve records
  FINAL_APPROVE: 'final_approve', // Final approval
  DELETE_OWN: 'delete_own',     // Delete own records
  DELETE_SECTION: 'delete_section', // Delete section records
  DELETE_ALL: 'delete_all',     // Delete all records
  MANAGE: 'manage',              // Full management
  EXECUTE_TEST: 'execute_test',  // Execute tests
  QUALITY_INSPECT: 'quality_inspect', // Quality inspection
  QUALITY_APPROVE: 'quality_approve', // Quality approval
} as const;
```

## Standard Roles

### Management Roles
- `Global Admin` - Full system access
- `Mechanical Manager` - Mechanical department management
- `NDT Manager` - NDT department management
- `PSV Manager` - PSV department management
- `QC Manager` - Quality control management

### Inspector Roles
- `NDT Inspector` - NDT inspector
- `Mechanical Inspector` - Mechanical inspector
- `PSV Inspector` - PSV inspector
- `Corrosion Inspector` - Corrosion inspector
- `Crane Inspector` - Crane inspector
- `QC Inspector` - Quality control inspector

### Operator Roles
- `PSV Test Operator` - PSV test operator

## Best Practices

### 1. Security
```tsx
// ❌ Wrong - Don't rely only on frontend
function DeleteButton() {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission('psv', 'delete_own')) {
    return null; // Just hiding is not enough
  }
  
  const handleDelete = async () => {
    // Delete request without backend verification
    await deleteReport(reportId);
  };
  
  return <button onClick={handleDelete}>Delete</button>;
}

// ✅ Correct - Always check on backend too
function DeleteButton() {
  const { hasPermission } = usePermissions();
  
  const handleDelete = async () => {
    try {
      // Backend checks permission itself
      await deleteReport(reportId);
    } catch (error) {
      if (error.status === 403) {
        toast.error('You do not have permission to delete this report');
      }
    }
  };
  
  if (!hasPermission('psv', 'delete_own')) {
    return null;
  }
  
  return <button onClick={handleDelete}>Delete</button>;
}
```

### 2. Performance
```tsx
// ✅ Use useMemo for complex calculations
function ReportsList() {
  const { hasPermission } = usePermissions();
  
  const canCreateReports = useMemo(() => {
    return hasPermission('psv', 'create') || 
           hasPermission('ndt', 'create') || 
           hasPermission('mechanical', 'create');
  }, [hasPermission]);
  
  return (
    <div>
      {canCreateReports && <CreateReportButton />}
      {/* ... */}
    </div>
  );
}
```

### 3. User Experience
```tsx
// ✅ Appropriate messages for users
function ProtectedFeature() {
  return (
    <PermissionGuard 
      permission={{ resource: 'psv', action: 'create' }}
      fallback={
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded">
          <p>To access this section, you need PSV report creation permission.</p>
          <p>Please contact your system administrator.</p>
        </div>
      }
    >
      <PSVCreateForm />
    </PermissionGuard>
  );
}
```

### 4. Testing
```tsx
// ✅ Test components with different permissions
describe('PSVReportCard', () => {
  it('should show edit button for users with edit permission', () => {
    const mockUser = {
      permissions: ['psv:edit_own'],
      roles: ['PSV Inspector']
    };
    
    render(
      <MockPermissionProvider user={mockUser}>
        <PSVReportCard report={mockReport} />
      </MockPermissionProvider>
    );
    
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });
  
  it('should hide edit button for users without permission', () => {
    const mockUser = {
      permissions: ['psv:view'],
      roles: ['PSV Inspector']
    };
    
    render(
      <MockPermissionProvider user={mockUser}>
        <PSVReportCard report={mockReport} />
      </MockPermissionProvider>
    );
    
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });
});
```

## Practical Examples

### 1. PSV Reports List Page
```tsx
import { usePermissions } from '@/hooks/use-permissions';
import { CreateButton, EditButton, DeleteButton } from '@/components/ui/permission-components';
import { PermissionGuard } from '@/components/auth';

function PSVReportsPage() {
  const { hasPermission } = usePermissions();
  const [reports, setReports] = useState([]);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>PSV Reports</h1>
        <CreateButton resource="psv">
          Create New Report
        </CreateButton>
      </div>
      
      <div className="grid gap-4">
        {reports.map(report => (
          <Card key={report.id}>
            <CardContent>
              <h3>{report.title}</h3>
              <p>Inspector: {report.inspector_name}</p>
              <p>Status: {report.status}</p>
              
              <div className="flex gap-2 mt-4">
                <EditButton 
                  resource="psv" 
                  isOwn={report.inspector_id === currentUserId}
                >
                  Edit
                </EditButton>
                
                <PermissionGuard permission={{ resource: 'psv', action: 'approve' }}>
                  <Button variant="outline">Approve</Button>
                </PermissionGuard>
                
                <DeleteButton 
                  resource="psv" 
                  scope="own"
                  hideWhenNoAccess={true}
                >
                  Delete
                </DeleteButton>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 2. Create Report Form
```tsx
function CreatePSVReportForm() {
  return (
    <ProtectedRoute permission={{ resource: 'psv', action: 'create' }}>
      <form>
        <PermissionInput
          permission={{ resource: 'psv', action: 'create' }}
          label="Serial Number"
          required
        />
        
        <PermissionSelect
          permission={{ resource: 'psv', action: 'create' }}
          label="PSV Type"
        >
          <option value="safety">Safety Valve</option>
          <option value="relief">Relief Valve</option>
        </PermissionSelect>
        
        <PermissionCheckbox
          permission={{ resource: 'quality', action: 'quality_approve' }}
          label="Quality Approved"
          description="Only QC personnel"
          readOnlyWhenNoAccess={true}
        />
        
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          
          <PermissionGuard permission={{ resource: 'psv', action: 'approve' }}>
            <Button type="button" variant="outline">
              Save and Approve
            </Button>
          </PermissionGuard>
        </div>
      </form>
    </ProtectedRoute>
  );
}
```

### 3. Admin Panel
```tsx
function AdminPanel() {
  return (
    <RoleBasedRoute allowedRoles={['Global Admin']}>
      <div>
        <h1>Admin Panel</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PermissionGuard permission={{ resource: 'admin', action: 'manage_inspectors' }}>
            <Card>
              <CardHeader>
                <CardTitle>Inspector Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/admin/inspectors">Manage Inspectors</Link>
                </Button>
              </CardContent>
            </Card>
          </PermissionGuard>
          
          <PermissionGuard permission={{ resource: 'admin', action: 'manage_roles' }}>
            <Card>
              <CardHeader>
                <CardTitle>Role Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/admin/roles">Manage Roles</Link>
                </Button>
              </CardContent>
            </Card>
          </PermissionGuard>
        </div>
      </div>
    </RoleBasedRoute>
  );
}
```

## Troubleshooting

### Common Issues

1. **Permissions not updating**
   ```tsx
   // Solution: Use refreshPermissions
   const { refreshPermissions } = usePermissions();
   
   useEffect(() => {
     refreshPermissions();
   }, [userRoleChanged]);
   ```

2. **Navigation not filtering**
   ```tsx
   // Check that navigation config is correct
   // and permission format is correct (resource:action)
   ```

3. **Components not hiding**
   ```tsx
   // Check that PermissionGuard is used correctly
   // and fallback component is configured
   ```

### Debug Mode
```typescript
// In development
localStorage.setItem('rbac-debug', 'true');

// Then see permission check logs in console
```

## Migration from Legacy System

### 1. Update Existing Components
```tsx
// Before
function OldComponent() {
  const { user } = useAuth();
  
  if (user.roles.includes('admin')) {
    return <AdminButton />;
  }
  
  return null;
}

// After
function NewComponent() {
  return (
    <PermissionGuard permission={{ resource: 'admin', action: 'manage' }}>
      <AdminButton />
    </PermissionGuard>
  );
}
```

### 2. Update Route Protection
```tsx
// Before
function ProtectedPage() {
  const { user } = useAuth();
  
  if (!user.roles.includes('PSV Inspector')) {
    return <AccessDenied />;
  }
  
  return <PSVContent />;
}

// After
function ProtectedPage() {
  return (
    <ProtectedRoute permission={{ resource: 'psv', action: 'view' }}>
      <PSVContent />
    </ProtectedRoute>
  );
}
```

## Conclusion

The RBAC system is a powerful tool for access control in applications. By following this guide and using the provided patterns, you can easily create a strong and maintainable security system.

For additional questions or technical issues, refer to the API documentation or development team.
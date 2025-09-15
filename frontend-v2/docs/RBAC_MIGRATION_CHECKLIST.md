# RBAC Migration Checklist

## Before Starting

- [ ] Read `RBAC_DEVELOPER_GUIDE.md`
- [ ] Read `RBAC_QUICK_START.md`
- [ ] Review examples in `src/components/examples/`
- [ ] Test RBAC system with different users

## Migration Steps

### 1. Project Preparation

- [ ] Add `PermissionProvider` to `layout.tsx`
- [ ] Import required types and hooks
- [ ] Verify existing authentication functionality

### 2. Identify Pages and Components

#### Admin Panel Pages
- [ ] `/admin` - Main admin page
- [ ] `/admin/inspectors` - Inspector management
- [ ] `/admin/roles` - Role management (future)
- [ ] `/admin/settings` - System settings

#### Maintenance Events Pages
- [ ] `/maintenance-events` - Events list
- [ ] `/maintenance-events/create` - Create event
- [ ] `/maintenance-events/[id]` - Event details
- [ ] `/maintenance-events/[id]/edit` - Edit event

#### Shared Components
- [ ] Navigation/Sidebar components
- [ ] Form components
- [ ] Button components
- [ ] Modal/Dialog components

### 3. Define Required Permissions

#### Admin Panel Permissions
- [ ] `admin:manage` - General system management
- [ ] `admin:manage_inspectors` - Inspector management
- [ ] `admin:manage_roles` - Role management
- [ ] `admin:view` - View admin panel

#### Maintenance Events Permissions
- [ ] `maintenance:create` - Create maintenance event
- [ ] `maintenance:view` - View events
- [ ] `maintenance:edit_own` - Edit own events
- [ ] `maintenance:edit_all` - Edit all events
- [ ] `maintenance:delete_own` - Delete own events
- [ ] `maintenance:delete_all` - Delete all events
- [ ] `maintenance:approve` - Approve events

### 4. Page Migration

#### For each page:

##### A. Route Protection
```tsx
// Before
function MyPage() {
  const { user } = useAuth();
  if (!user.isAdmin) return <AccessDenied />;
  return <PageContent />;
}

// After
function MyPage() {
  return (
    <ProtectedRoute permission={{ resource: 'admin', action: 'manage' }}>
      <PageContent />
    </ProtectedRoute>
  );
}
```

- [ ] Add `ProtectedRoute` wrapper
- [ ] Define appropriate permission
- [ ] Remove manual access check code

##### B. Navigation Updates
```tsx
// Before
{user.isAdmin && <AdminLink />}

// After
<PermissionGuard permission={{ resource: 'admin', action: 'view' }}>
  <AdminLink />
</PermissionGuard>
```

- [ ] Replace role checks with permission checks
- [ ] Use `PermissionGuard` for conditional rendering
- [ ] Remove manual role checking code

##### C. Action Button Updates
```tsx
// Before
{user.canEdit && <EditButton />}

// After
<EditButton resource="maintenance" isOwn={isOwner} />
```

- [ ] Replace regular buttons with Permission-based buttons
- [ ] Use `CreateButton`, `EditButton`, `DeleteButton`
- [ ] Set appropriate scope (own/section/all)

### 5. Form Migration

#### For each form:

##### A. Field Protection
```tsx
// Before
{user.isManager && <SensitiveField />}

// After
<PermissionInput
  permission={{ resource: 'admin', action: 'manage' }}
  label="Sensitive Field"
  readOnlyWhenNoAccess={true}
/>
```

- [ ] Replace regular inputs with `PermissionInput`
- [ ] Use `PermissionSelect` for dropdowns
- [ ] Set `readOnlyWhenNoAccess` or `hideWhenNoAccess`

##### B. Submit Action Protection
```tsx
// Before
const handleSubmit = () => {
  if (!user.canCreate) return;
  // submit logic
};

// After
const handleSubmit = () => {
  // Backend checks permission itself
  // Only UI feedback needed
};
```

- [ ] Remove manual permission checks from handlers
- [ ] Add error handling for 403 responses
- [ ] Use permission-based submit buttons

### 6. Navigation Migration

#### A. Sidebar/Menu Components
```tsx
// Before
const menuItems = [
  { title: 'Admin', href: '/admin', visible: user.isAdmin },
  // ...
];

// After
import { useNavigation } from '@/hooks/use-navigation';
const { navigation } = useNavigation(); // Automatically filtered
```

- [ ] Remove manual menu filtering
- [ ] Use `useNavigation` hook
- [ ] Update navigation config

#### B. Breadcrumbs
```tsx
// Before
<Breadcrumb items={staticItems} />

// After
<PermissionBreadcrumbs />
```

- [ ] Replace with `PermissionBreadcrumbs`
- [ ] Remove manual breadcrumb generation

### 7. Testing

#### For each component/page:

- [ ] Test with user without permission
- [ ] Test with user with limited permission
- [ ] Test with admin user
- [ ] Test loading states
- [ ] Test error handling

#### Test Cases
```tsx
describe('MyComponent', () => {
  it('should show content for authorized users', () => {
    // test with permissions
  });
  
  it('should show access denied for unauthorized users', () => {
    // test without permissions
  });
  
  it('should hide sensitive actions for limited users', () => {
    // test with limited permissions
  });
});
```

### 8. Performance Optimization

- [ ] Check for unnecessary re-renders
- [ ] Use `useMemo` for complex calculations
- [ ] Review permission checks in loops
- [ ] Optimize navigation filtering

### 9. Documentation

- [ ] Update component documentation
- [ ] Add permission requirements to README
- [ ] Document custom permissions
- [ ] Create examples for team members

### 10. Deployment Checklist

- [ ] Test in different environments
- [ ] Verify backend permission endpoints
- [ ] Test JWT token integration
- [ ] Check error handling in production
- [ ] Monitor permission-related errors

## Important Notes

### ⚠️ Security Notes
- Always check permissions on backend too
- Never rely solely on frontend permission checks
- Use HTTPS in production
- Keep JWT tokens secure

### 🚀 Performance Notes
- Use `useMemo` for expensive permission calculations
- Cache permission checks
- Avoid unnecessary re-renders

### 👥 UX Notes
- Show appropriate messages for access denied
- Handle loading states
- Define appropriate fallback components

### 🧪 Testing Notes
- Test all permission scenarios
- Create mock permission contexts for testing
- Write integration tests for complete flows

## Complete Migration Example

### Before:
```tsx
function AdminPage() {
  const { user } = useAuth();
  
  if (!user.isAdmin) {
    return <div>Access Denied</div>;
  }
  
  return (
    <div>
      <h1>Admin Panel</h1>
      {user.canManageUsers && (
        <button onClick={handleCreateUser}>Create User</button>
      )}
      <UsersList />
    </div>
  );
}
```

### After:
```tsx
function AdminPage() {
  return (
    <ProtectedRoute permission={{ resource: 'admin', action: 'view' }}>
      <div>
        <h1>Admin Panel</h1>
        <CreateButton resource="user">Create User</CreateButton>
        <UsersList />
      </div>
    </ProtectedRoute>
  );
}
```

## Helpful Resources

- `RBAC_DEVELOPER_GUIDE.md` - Complete guide
- `RBAC_QUICK_START.md` - Quick start
- `src/components/examples/` - Practical examples
- `src/components/auth/README.md` - Technical documentation
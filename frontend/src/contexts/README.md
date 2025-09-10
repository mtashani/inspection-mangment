# Authentication and Context System

This directory contains React contexts used throughout the application, including the new authentication system.

## Auth Context

The `auth-context.tsx` file implements a comprehensive authentication system that:

- Manages user authentication state
- Handles login/logout operations
- Provides user profile information
- Implements permission checking for access control

### Usage

Wrap your application with the `AuthProvider`:

```tsx
<AuthProvider>
  <YourApp />
</AuthProvider>
```

Use the authentication hooks in your components:

```tsx
const { isAuthenticated, inspector, login, logout, hasPermission } = useAuth();

// Check if user is authenticated
if (!isAuthenticated) {
  return <Redirect to="/login" />;
}

// Check permissions
if (!hasPermission('psv', 'create')) {
  return <AccessDenied />;
}
```

## Permission System

The permission system uses a resource:action pattern:

- Resources: `inspectors`, `psv`, `calibration`, `corrosion`, etc.
- Actions: `create`, `read`, `update`, `delete`, `approve`, etc.

Permissions are granted through roles assigned to inspectors.

## Protected Routes

To create protected routes that require authentication or specific permissions:

```tsx
// Example of a protected route component
export function ProtectedRoute({ 
  children,
  resource,
  action
}: { 
  children: React.ReactNode,
  resource?: string,
  action?: string
}) {
  const { isAuthenticated, hasPermission } = useAuth();
  const router = useRouter();
  
  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }
  
  if (resource && action && !hasPermission(resource, action)) {
    return <AccessDenied />;
  }
  
  return <>{children}</>;
}
```

## Other Contexts

- `sidebar-context.tsx` - Manages sidebar state (expanded/collapsed)
- `inspectors-context.tsx` - Provides access to inspector data
- `notifications-context.tsx` - Manages application notifications
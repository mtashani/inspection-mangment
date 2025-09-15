---
trigger: manual
alwaysApply: false
---
# RBAC Development Rules
**10 Essential Rules for RBAC Implementation**

## 🔐 **RBAC Development Rules**

### **Rule 1: Backend API Protection**
```python
# ALWAYS protect API endpoints with RBAC
@require_permission("resource", "action")
async def api_endpoint():
    pass
```

### **Rule 2: Permission Format Standard**
```python
# Use consistent permission format: "resource:action"
Examples: "admin:manage", "psv:create", "report:approve"
```

### **Rule 3: Add New Permissions to System**
```python
# MUST add permissions to create_default_permissions() in backend/create_super_admin.py
{"name": "resource_action", "resource": "resource", "action": "action", 
 "description": "Description", "display_label": "Display Label"}
```

### **Rule 4: Frontend Route Protection**
```tsx
// ALWAYS wrap protected pages with ProtectedRoute
<ProtectedRoute permission={{ resource: 'resource_name', action: 'view' }}>
  <YourPage />
</ProtectedRoute>
```

### **Rule 5: Component-Level Security**
```tsx
// Use PermissionGuard for component protection
<PermissionGuard permission={{ resource: 'resource_name', action: 'create' }}>
  <CreateButton />
</PermissionGuard>
```

### **Rule 6: Navigation Security**
```typescript
// Add permissions to navigation items in lib/navigation-config.ts
{
  title: 'Page Name',
  href: '/page-path',
  permission: { resource: 'resource_name', action: 'view' }
}
```

### **Rule 7: JWT Token Validation**
```python
# Backend MUST validate JWT tokens and extract permissions
current_inspector = Depends(AuthService.get_current_active_inspector_with_permission(
    db, token, "resource", "action"
))
```

### **Rule 8: Frontend Permission Constants**
```typescript
// MUST add new resources to types/permissions.ts
export const RESOURCES = {
  NEW_RESOURCE: 'new_resource',
} as const;
```

### **Rule 9: Use Specialized Permission Hooks**
```typescript
// Use domain-specific hooks for better code organization
const { canCreate, canApprove } = usePSVPermissions();
const { isAdmin, isManager } = useRoles();
```

### **Rule 10: Test with Different User Roles**
```bash
# ALWAYS test API endpoints and UI with different user roles
# Super Admin: admin/admin123 (all permissions)
# Test with PSV Inspector, NDT Inspector, etc.
```

---

## 🚨 **Critical Reminders**

- **Never skip RBAC protection** - Every API endpoint MUST have permission checks
- **Frontend permissions are for UX only** - Backend validation is the security layer  
- **Follow permission naming convention** - Always use "resource:action" format
- **Test with multiple roles** - Ensure proper access control for all user types
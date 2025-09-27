---
trigger: always_on
alwaysApply: true
---
# RBAC Domain Development - Quick Guide

## ⚠️ Important: No New Permissions Needed
**Don't create new permissions for each domain!** Use existing department permissions:
- `mechanical_view` for PSV, tanks, pipes
- `ndt_view` for non-destructive testing  
- `corrosion_view` for corrosion inspection
- `electrical_view` for electrical systems
- `maintenance_view` for maintenance tasks

## Core Rules

1. **Middleware Only** - All authentication happens in root middleware, never use component guards
2. **DashboardLayout Required** - Every page must wrap DashboardLayout directly
3. **No Custom Layouts** - Never create domain-specific layouts
4. **Smart Button Logic** - Disable buttons and show errors instead of hiding them
5. **API Permission Checks** - Match API endpoints with required permissions
6. **Proper Breadcrumbs** - Always provide navigation breadcrumbs
7. **Notification Integration** - Use NotificationService for all event broadcasting
8. **Real-Time Updates** - Implement WebSocket notifications for user actions

## Quick Implementation Guide

### 1. Route Protection (`src/middleware.ts`)
```typescript
const ROUTE_PERMISSIONS = {
  '/new-domain': {
    type: 'permission',
    required: ['appropriate_existing_permission']
  }
}
```

### 2. Page Structure (`src/app/domain-name/page.tsx`)
```typescript
export default function DomainPage() {
  return (
    <DashboardLayout breadcrumbs={[...]}>
      <DomainContent />
    </DashboardLayout>
  )
}
```

### 3. Button Logic (`src/components/domain-name/actions.tsx`)
```typescript
const { user } = useAuth()
const canEdit = user?.permissions?.includes('mechanical_edit')

const handleClick = () => {
  if (!canEdit) {
    toast({ variant: "destructive", title: "Permission Denied" })
    return
  }
  // Proceed with action
}

<Button onClick={handleClick} disabled={!canEdit}>
  Edit
</Button>
```

### 4. API Endpoints (`backend/app/domains/{domain}/api/`)
```python
# GET = {department}_view
# POST/PUT/DELETE = {department}_edit  
# PATCH /approve = {department}_approve

if 'mechanical_edit' not in current_user.permissions:
    raise HTTPException(status_code=403, detail="Edit permission required")
```

### 5. Notification Broadcasting (`backend`)
```python
# In your domain service
from app.domains.notifications.services.notification_service import NotificationService

notification_service = NotificationService(db)
await notification_service.broadcast_event_created(
    event_id=event.id,
    event_number=event.number,
    event_title=event.title,
    created_by=user.full_name
)
```

### 6. Frontend Notifications (`src/components`)
```typescript
import { useRealTimeNotifications } from '@/contexts/real-time-notifications'

const { notifications, unreadCount, isConnected } = useRealTimeNotifications()
```

## 📡 Real-Time Notification System

### Backend Files
- **Models**: `backend/app/domains/notifications/models/notification.py`
- **API**: `backend/app/domains/notifications/api/notification_routes.py`
- **WebSocket**: `backend/app/domains/notifications/api/websocket_routes.py`
- **Service**: `backend/app/domains/notifications/services/notification_service.py`
- **Manager**: `backend/app/domains/notifications/services/websocket_manager.py`

### Frontend Files
- **Context**: `frontend-v2/src/contexts/real-time-notifications.tsx`
- **WebSocket Service**: `frontend-v2/src/lib/services/websocket-service.ts`
- **Component**: `frontend-v2/src/components/navigation/notifications.tsx`
- **API**: `frontend-v2/src/lib/api/notifications.ts`
- **Layout Integration**: `frontend-v2/src/components/layout/real-time-layout.tsx`

### Notification Types
```typescript
// Core Event Notifications
event_created, event_updated, event_deleted, event_status_changed
event_approved, event_approval_reverted

// Sub-Event Notifications  
sub_event_created, sub_event_updated, sub_event_status_changed

// Inspection Notifications
inspection_created, inspection_completed, inspection_updated
bulk_inspections_planned

// Equipment & Calibration
calibration_due, calibration_overdue
rbi_change, psv_update

// System Notifications
system_alert, task_complete
```

### When to Add Notifications
Add notifications for these scenarios:
- **Create Operations** - New events, inspections, equipment records
- **Status Changes** - Event approval, completion, cancellation
- **Critical Updates** - Equipment failures, overdue calibrations
- **Bulk Operations** - Mass planning, batch approvals
- **System Events** - Login failures, data imports, backups
- **User Actions** - Role assignments, permission changes

### Broadcasting Rules
1. **Backend** - Use `NotificationService.broadcast_*()` methods
2. **WebSocket Auth** - JWT token validation required
3. **Frontend** - Use `useRealTimeNotifications()` hook
4. **Toast System** - High/critical priority auto-shows toast
5. **Permissions** - Notifications respect department permissions

## Key Points
- ✅ Use existing permissions from department list
- ✅ Page-level protection happens in middleware only
- ✅ Button-level protection: Disable buttons and show error messages (don't hide buttons)
- ✅ API-level protection happens in endpoints (verify permissions)
- ✅ All pages use DashboardLayout wrapper
- ✅ Match HTTP methods with appropriate permissions (GET=view, POST/PUT/DELETE=edit, PATCH/approve=approve)
- ❌ No new permissions unless completely new department
- ❌ No AdminPermissionGuard or custom guards
- ❌ No domain-specific layouts

## Available Department Permissions
- **System**: `system_superadmin`, `system_hr_manage`
- **Mechanical**: `mechanical_view/edit/approve`
- **NDT**: `ndt_view/edit/approve`
- **Corrosion**: `corrosion_view/edit/approve`
- **Electrical**: `electrical_view/edit/approve`
- **Instrumentation**: `instrument_view/edit/approve`
- **Quality**: `quality_view/edit/approve`
- **Maintenance**: `maintenance_view/edit/approve`

## Developer Checklist

### RBAC Implementation
- [ ] Used existing department permission (no new permissions)
- [ ] Added route protection in `middleware.ts`
- [ ] Wrapped page with `DashboardLayout`
- [ ] Disabled buttons + show toast (no hiding buttons)
- [ ] API permission checks match HTTP methods
- [ ] No component guards used
- [ ] Proper breadcrumbs configured

### Notification Integration
- [ ] Backend: Used `NotificationService.broadcast_*()` methods
- [ ] Frontend: Used `useRealTimeNotifications()` hook  
- [ ] WebSocket connection requires JWT authentication
- [ ] Toast notifications for high/critical priority
- [ ] Notification bell shows connection status

### File Structure
```
src/app/domain-name/page.tsx
src/components/domain-name/
src/hooks/use-domain-name.ts
backend/app/domains/domain-name/api/
backend/app/domains/domain-name/models/
```

## Essential Implementation Rules

### Authentication Utilities (from `app.domains.auth.dependencies`):
```python
get_current_inspector()                    # Get current logged-in user
get_current_active_inspector()             # Get current active user  
require_standardized_permission(name)      # Require specific permission
```

### Permission-HTTP Method Mapping:
```python
GET requests    → {department}_view       # Read operations
POST/PUT/DELETE → {department}_edit       # Create/Update/Delete operations  
PATCH /approve  → {department}_approve    # Approval operations
```

### Backend API Security Pattern:
```python
@router.get("/events")
async def get_events(
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("maintenance_view"))
):
    pass
```

### Frontend Route Protection (`middleware.ts`):
```typescript
const ROUTE_PERMISSIONS = {
  '/maintenance': {
    type: 'permission',
    required: ['maintenance_view']
  }
}
```

### Frontend Button Logic:
```typescript
const { user } = useAuth()
const canEdit = user?.permissions?.includes('maintenance_edit')

const handleClick = () => {
  if (!canEdit) {
    toast({ variant: "destructive", title: "Permission Denied" })
    return
  }
  // Proceed with action
}

<Button onClick={handleClick} disabled={!canEdit}>Edit</Button>
```

### Common Mistakes to Avoid:
```typescript
// ❌ Wrong
{canEdit && <Button>Edit</Button>}                    // Don't hide buttons
require_standardized_permission("maintenance_create") // Don't create new permissions

// ✅ Correct  
<Button disabled={!canEdit}>Edit</Button>             // Disable buttons instead
require_standardized_permission("maintenance_edit")   // Use existing permissions
```

### PowerShell Commands
```powershell
# Backend (activate venv first)
.\venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend  
npm run dev

# Check WebSocket stats
curl http://localhost:8000/api/v1/notifications/ws/stats
```
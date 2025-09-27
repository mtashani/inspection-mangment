# RBAC Domain Development Guide

## ⚠️ نکته مهم
**🚫 نیازی به ساخت permission جدید برای هر domain نیست!**
از permissions موجود department ها استفاده کنید:
- `mechanical_view` برای PSV, تانک‌ها، لوله‌ها
- `ndt_view` برای آزمایش‌های غیرمخرب  
- `corrosion_view` برای بازرسی خوردگی
- `electrical_view` برای سیستم‌های برقی
- `maintenance_view` برای تعمیرات

## Overview

این راهنما برای توسعه‌دهندگانی است که می‌خواهند domain جدید به سیستم اضافه کنند. برای حفظ یکدستی و امنیت سیستم، لطفاً این قوانین را دقیقاً رعایت کنید.

## قوانین اصلی

### ⚠️ قانون 1: استفاده از Middleware تنها
- **نکنید:** AdminPermissionGuard یا component-level guards اضافه نکنید (این کامپوننت‌ها حذف شده‌اند)
- **بکنید:** فقط از root middleware برای authentication و authorization استفاده کنید
- **مثال صحیح:**
```typescript
// ❌ اشتباه
<AdminPermissionGuard requiredPermission="canManagePayroll">
  <PayrollPage />
</AdminPermissionGuard>

// ✅ صحیح - middleware خودکار چک می‌کند
export default function PayrollPage() {
  return <DashboardLayout>...</DashboardLayout>
}
```

### ⚠️ قانون 2: استفاده از DashboardLayout مستقیم
- **نکنید:** layout اضافی برای domain خود نسازید
- **بکنید:** مستقیماً DashboardLayout را در هر صفحه wrap کنید
- **مثال صحیح:**
```typescript
// ❌ اشتباه - layout اضافی
// src/app/my-domain/layout.tsx

// ✅ صحیح
export default function MyDomainPage() {
  return (
    <DashboardLayout 
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'My Domain', current: true }
      ]}
    >
      <MyDomainContent />
    </DashboardLayout>
  )
}
```

### ⚠️ قانون 3: استفاده از Permission Format استاندارد
- **فرمت:** `{department}_{action}` یا `{section}_{action}`
- **مثال:** `mechanical_view`, `ndt_edit`, `corrosion_approve`, `electrical_view`
- **نکته مهم:** mechanical, ndt, corrosion, electrical, etc. بخش‌هایی از سازمان بازرسی هستند
- **استفاده:** صفحات PSV با `mechanical_view` permission باز می‌شوند

## لیست Permissions استاندارد

### System Permissions
```typescript
'system_superadmin'     // دسترسی کامل سیستم
'system_hr_manage'      // مدیریت HR و بازرسان
```

### Inspection Department Permissions
```typescript
// Mechanical Department
'mechanical_view'       // مشاهده بازرسی‌های مکانیکی (PSV, مخازن, لوله, تجهیزات)
'mechanical_edit'       // ویرایش بازرسی‌های مکانیکی  
'mechanical_approve'    // تایید بازرسی‌های مکانیکی

// NDT (Non-Destructive Testing) Department
'ndt_view'             // مشاهده آزمایش‌های غیرمخرب (RT, UT, MT, PT)
'ndt_edit'             // ویرایش آزمایش‌های غیرمخرب
'ndt_approve'          // تایید آزمایش‌های غیرمخرب

// Corrosion Department
'corrosion_view'        // مشاهده بازرسی‌های خوردگی
'corrosion_edit'        // ویرایش بازرسی‌های خوردگی
'corrosion_approve'     // تایید بازرسی‌های خوردگی

// Electrical Department
'electrical_view'       // مشاهده بازرسی‌های برقی
'electrical_edit'       // ویرایش بازرسی‌های برقی
'electrical_approve'    // تایید بازرسی‌های برقی

// Instrumentation Department
'instrument_view'       // مشاهده ابزاردقیق
'instrument_edit'       // ویرایش ابزاردقیق
'instrument_approve'    // تایید ابزاردقیق

// Quality Control Department
'quality_view'          // مشاهده کنترل کیفیت
'quality_edit'          // ویرایش کنترل کیفیت
'quality_approve'       // تایید کنترل کیفیت

// Maintenance Department
'maintenance_view'      // مشاهده تعمیرات
'maintenance_edit'      // ویرایش تعمیرات
'maintenance_approve'   // تایید تعمیرات
```

## مراحل اضافه کردن Domain جدید

### 1. ✅ استفاده از Permissions موجود
**🚫 نیازی به permission جدید نیست!** از permissions موجود استفاده کنید:

```typescript
// ✅ Permissions از قبل موجود هستند:
'mechanical_view'    // برای PSV, تانک، لوله، تجهیزات مکانیکی
'ndt_view'          // برای RT, UT, MT, PT
'corrosion_view'    // برای بازرسی خوردگی
'electrical_view'   // برای سیستم‌های برقی
'maintenance_view'  // برای تعمیرات
'quality_view'      // برای کنترل کیفیت

// ❌ Permission جدید نسازید:
// 'my_domain_view'        // اشتباه!
// 'my_domain_edit'        // اشتباه!
// 'my_domain_approve'     // اشتباه!
```

**✅ مثال صحیح:** صفحه جدید `/pressure-vessels` از `mechanical_view` استفاده می‌کند.

**⚠️ فقط در صورت نیاز به department کاملاً جدید** (مثل یک بخش جدید در سازمان بازرسی) permission جدید اضافه کنید.

### 🔍 نحوه انتخاب Permission مناسب:

| نوع Domain | Permission مناسب | توضیح |
|------------|------------------|-------|
| PSV، مخازن، لوله | `mechanical_view` | بخش مکانیک |
| آزمایش‌های غیرمخرب | `ndt_view` | بخش NDT |
| بازرسی خوردگی | `corrosion_view` | بخش خوردگی |
| سیستم‌های برقی | `electrical_view` | بخش برق |
| تعمیرات و نگهداری | `maintenance_view` | بخش تعمیرات |
| کنترل کیفیت | `quality_view` | بخش کیفیت |

### 2. اضافه کردن Route Protection
در `middleware.ts` روت جدید اضافه کنید:
```typescript
const ROUTE_PERMISSIONS = {
  '/new-domain': {
    type: 'permission',
    required: ['appropriate_existing_permission'] // از permission موجود استفاده کنید
  }
}
```

### 3. ساختار استاندارد Directory
```
src/app/domain-name/page.tsx        // صفحه اصلی
src/components/domain-name/         // کامپوننت‌ها  
src/hooks/use-domain-name.ts        // Hook اختصاصی
```

### 📝 **نکات کلیدی:**

1. **DashboardLayout اجباری**: همه صفحات باید `DashboardLayout` را wrap کنند
2. **بدون Layout اضافی**: هرگز `layout.tsx` برای domain جدید نسازید
3. **بدون Permission Guards**: هرگز `AdminPermissionGuard` استفاده نکنید
4. **Middleware فقط**: تمام authentication در middleware انجام می‌شود
5. **Breadcrumbs ضروری**: همیشه breadcrumbs مناسب ارائه دهید

### 4. لایه دکمه (Button Layer)
**📍 مکان:** `src/components/ui/permission-button.tsx`

• **✅ استفاده کنید:** از `Button` استاندارد بدون wrapper اضافی
• **❌ نکنید:** `PermissionButton` یا guard اضافی نسازید
• **مثال:**
```typescript
import { Button } from '@/components/ui/button'

// ✅ صحیح - ساده و مستقیم
<Button onClick={handleEdit}>Edit</Button>
<Button variant="destructive" onClick={handleDelete}>Delete</Button>
```

### 5. لایه API (API Layer)
**📍 مکان Backend:** `backend/app/domains/{domain}/api/`
**📍 مکان Frontend:** `src/hooks/use-{domain}.ts`

• **Backend Structure:**
```
backend/app/domains/my-domain/
├── api/
│   ├── __init__.py
│   └── my_domain.py          # API endpoints
├── models/
│   └── my_domain.py          # SQLModel models
└── schemas/
    └── my_domain.py          # Pydantic schemas
```

• **API Endpoint Pattern:**
```python
# backend/app/domains/my-domain/api/my_domain.py
from fastapi import APIRouter, Depends
from app.core.auth import get_current_user

router = APIRouter(prefix="/my-domain", tags=["my-domain"])

@router.get("/")
async def get_items(current_user = Depends(get_current_user)):
    # Permission check happens in middleware
    return {"items": []}
```

• **Frontend Hook Pattern:**
```typescript
// src/hooks/use-my-domain.ts
export function useMyDomain() {
  const { token } = useAuth()
  
  const fetchData = async () => {
    const response = await fetch('/api/my-domain', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return response.json()
  }
  
  return { fetchData }
}
```

• **⚠️ نکات API:**
  - همیشه `get_current_user` dependency استفاده کنید
  - Permission check در middleware انجام می‌شود نه در API
  - Error handling مناسب در frontend hook
  - TypeScript interfaces برای response data

## چک‌لیست تکمیل

- [ ] ✅ **Permission مناسب انتخاب شده** (از لیست موجود - **هیچ permission جدید نساخته‌اید**)
- [ ] Route protection در middleware اضافه شده
- [ ] صفحات با DashboardLayout wrap شده‌اند
- [ ] هیچ AdminPermissionGuard اضافی وجود ندارد
- [ ] Layout اضافی ساخته نشده
- [ ] Breadcrumbs مناسب تنظیم شده
- [ ] Hook مخصوص domain ساخته شده
- [ ] Metadata صفحات تنظیم شده
- [ ] Navigation menu به‌روزرسانی شده (در صورت نیاز)

## نکات مهم

1. **امنیت:** middleware خودکار تمام authentication و authorization را انجام می‌دهد
2. **Performance:** layout اضافی باعث کندی می‌شود
3. **یکدستی:** تمام domains باید ساختار یکسان داشته باشند
4. **Scalability:** این ساختار برای domain های زیاد مقیاس‌پذیر است

## نحوه عملکرد Route Protection

### ⚙️ نوع های Route:

1. **Public Routes** - بدون نیاز به authentication:
```typescript
'/dashboard': { type: 'public' },
'/login': { type: 'public' }
```

2. **Role-based Routes** - بر اساس نقش کاربر:
```typescript
'/admin': {
  type: 'role',
  required: ['Super Admin', 'Global Admin'],
  permission: 'system_superadmin' // fallback
}
```

3. **Permission-based Routes** - بر اساس permissions:
```typescript
'/maintenance-events': {
  type: 'permission',
  required: ['maintenance_view']
}
```

### 🔧 نحوه اضافه کردن Route جدید:

1. **برای بخش بازرسی جدید** مثل `/psv` یا `/pipe`:
```typescript
// در middleware.ts
const ROUTE_PERMISSIONS = {
  // ... سایر routes
  '/psv': {
    type: 'permission',
    required: ['mechanical_view'] // PSV جزو بخش مکانیک
  },
  '/ndt': {
    type: 'permission',
    required: ['ndt_view']
  },
  '/pipe': {
    type: 'permission',
    required: ['mechanical_view'] // یا corrosion_view
  }
}
```

2. **برای sub-routes با permissions مختلف**:
```typescript
'/mechanical': {
  type: 'permission',
  required: ['mechanical_view']
},
'/mechanical/edit': {
  type: 'permission',
  required: ['mechanical_edit']
},
'/mechanical/approve': {
  type: 'permission',
  required: ['mechanical_approve']
}
```

### ⚠️ نکات مهم:
- **ترتیب اهمیت**: More specific routes اول بررسی می‌شوند
- **Default behavior**: بدون rule مشخص = اجازه دسترسی
- **Fallback**: Role-based routes می‌توانند permission fallback داشته باشند

---

## مثال کامل - کارهای اشتباه

```typescript
// ❌ نکنید - Layout اضافی
export default function MyDomainLayout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>
}

// ❌ نکنید - Permission Guard اضافی  
<AdminPermissionGuard requiredPermission="mechanical_view">
  <MyComponent />
</AdminPermissionGuard>

// ❌ نکنید - Permission جدید بدون ضرورت
'my_domain_view'        // اشتباه - از 'mechanical_view' استفاده کنید
'another_domain_edit'   // اشتباه - از 'ndt_edit' استفاده کنید
'custom_permission'     // اشتباه - از permissions استاندارد استفاده کنید

// ❌ نکنید - فرمت نامعتبر
'myDomain-view-permission'  // فرمت اشتباه
'domain_view_special'       // خیلی طولانی و غیرضروری
```

## ✅ راه صحیح

```typescript
// ✅ استفاده از permission موجود در middleware
const ROUTE_PERMISSIONS = {
  '/pressure-vessels': {
    type: 'permission',
    required: ['mechanical_view']  // از permission موجود استفاده کنید
  }
}

// ✅ صفحه ساده بدون guard اضافی
export default function PressureVesselsPage() {
  return (
    <DashboardLayout>
      <PressureVesselContent />
    </DashboardLayout>
  )
}
```

## سوالات متداول

**Q: چگونه permission سطوح مختلف تنظیم کنم؟**
A: از view/edit/approve pattern استفاده کنید: `domain_view`, `domain_edit`, `domain_approve`

**Q: آیا می‌توانم sub-domain داشته باشم؟**
A: بله، مثل `electrical_motor_view` یا `mechanical_pump_edit`

**Q: چگونه بدانم middleware کار می‌کند؟**
A: اگر به صفحه دسترسی داشتید، middleware کار کرده است.

---

**نکته:** این راهنما قوانین لازم‌الاجرا است. عدم رعایت باعث مشکلات امنیتی و عملکردی می‌شود.
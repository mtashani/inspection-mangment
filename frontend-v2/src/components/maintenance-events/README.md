# Maintenance Events Components

این پوشه شامل تمام کامپوننت‌های مربوط به سیستم Maintenance Events & Daily Reports است.

## ساختار کامپوننت‌ها

### کامپوننت‌های اصلی

#### `EventsOverviewContainer`
کامپوننت اصلی صفحه اول که تمام state management و data fetching را مدیریت می‌کند.

**ویژگی‌ها:**
- مدیریت state با TanStack Query
- همگام‌سازی فیلترها با URL
- مدیریت loading و error states
- Click-to-filter functionality در summary cards

#### `EventDetailsContainer`
کامپوننت اصلی صفحه دوم برای نمایش جزئیات یک maintenance event.

**ویژگی‌ها:**
- مدیریت tabs و search state
- URL state synchronization
- Error handling برای event not found

#### `EventsHeader`
Header صفحه اول با title و action buttons.

**ویژگی‌ها:**
- Refresh، Export، و Create Event buttons
- Responsive design
- Consistent spacing با design system

#### `EventDetailsHeader`
Header صفحه دوم با اطلاعات کامل maintenance event.

**ویژگی‌ها:**
- نمایش جزئیات event (dates، status، counts)
- Action buttons برای Start/Complete event
- Status badges با رنگ‌های مناسب

#### `SummaryCards`
کارت‌های خلاصه آمار و metrics کلیدی.

**ویژگی‌ها:**
- 8 کارت metric مختلف
- Click-to-filter functionality
- Loading skeletons
- Responsive grid layout
- رنگ‌بندی مناسب برای هر metric

#### `GlobalSearchAndFilters`
پنل جامع جستجو و فیلتر کردن برای صفحه اول.

**ویژگی‌ها:**
- جستجوی متنی با debounce
- فیلترهای سریع (Status، Event Type)
- فیلترهای پیشرفته (Date Range)
- Active filters display با قابلیت حذف
- URL state synchronization

### کامپوننت‌های نمایش

#### `EventsList`
نمایش لیست maintenance events در grid layout.

**ویژگی‌ها:**
- Responsive grid (1-3 columns)
- Loading، Error، و Empty states
- Consistent card spacing

#### `EventCard`
کارت نمایش یک maintenance event.

**ویژگی‌ها:**
- Status و Event Type badges
- Date range display
- Sub-events و Inspections count
- Click navigation به Event Details
- Hover effects

### کامپوننت‌های Loading و Error

#### `EventsListSkeleton`
Loading skeleton برای لیست events.

#### `EventsListError`
Error state برای لیست events با retry button.

#### `EventsListEmpty`
Empty state برای لیست events با create button.

#### `EventDetailsSkeleton`
Loading skeleton برای صفحه Event Details.

#### `EventNotFound`
Error state برای event not found با back button.

## API Integration

کامپوننت‌ها از این API endpoints استفاده می‌کنند:

- `GET /api/v1/maintenance/events` - دریافت لیست events
- `GET /api/v1/maintenance/events/{id}` - جزئیات یک event
- `GET /api/v1/maintenance/sub-events` - لیست sub-events
- `GET /api/v1/maintenance/statistics/summary` - آمار خلاصه
- `POST /api/v1/maintenance/events/{id}/start` - شروع event
- `POST /api/v1/maintenance/events/{id}/complete` - تکمیل event

### Data Flow

```
Page Component
    ↓
Container Component
    ↓
TanStack Query Hooks (use-maintenance-events.ts)
    ↓
API Services (maintenance-events.ts)
    ↓
Backend APIs
```

## State Management

### TanStack Query

تمام data fetching و caching با TanStack Query مدیریت می‌شود:

```tsx
// مثال استفاده از hooks
const { data, loading, error } = useMaintenanceEvents(filters)
const { data: summary } = useEventsSummary(filters)
const startMutation = useStartMaintenanceEvent()
```

### URL State

فیلترها و search با URL همگام‌سازی می‌شوند:

```
/maintenance-events?search=pump&status=InProgress&dateFrom=2025-01-01
/maintenance-events/123?tab=direct-inspections&search=valve
```

## Styling

### Design System

تمام کامپوننت‌ها از shadcn/ui و Tailwind CSS استفاده می‌کنند:

- Consistent spacing: `gap-4`, `p-4`, `space-y-4`
- Typography: `text-lg`, `font-semibold`, `text-muted-foreground`
- Colors: CSS variables (`hsl(var(--primary))`)
- Grid layouts: `grid gap-4 md:grid-cols-2 lg:grid-cols-3`

### Status Colors

```tsx
// Status badge colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Planned': return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'InProgress': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'Completed': return 'text-green-600 bg-green-50 border-green-200'
    // ...
  }
}
```

## Performance

### Optimizations

- **TanStack Query**: Efficient caching و background updates
- **URL State**: Browser back/forward navigation
- **Loading States**: Skeleton components برای better UX
- **Error Boundaries**: Graceful error handling
- **Optimistic Updates**: برای mutations

### Bundle Size

- Tree shaking برای کاهش bundle size
- Dynamic imports آماده برای lazy loading
- Optimized dependencies

## Navigation

### Two-Level Architecture

1. **Level 1** (`/maintenance-events`): Events Overview
   - Summary cards
   - Global search and filters
   - Events grid

2. **Level 2** (`/maintenance-events/[eventId]`): Event Details
   - Event information header
   - Tabbed interface (آماده برای پیاده‌سازی)
   - Inspections lists (آماده برای پیاده‌سازی)

### Breadcrumbs

```tsx
// Level 1
[Inspection Management] > [Maintenance Events]

// Level 2  
[Inspection Management] > [Maintenance Events] > [Event Details]
```

## Next Steps

کامپوننت‌های آماده شده:
- ✅ Events Overview (Level 1)
- ✅ Event Details Header (Level 2)
- ✅ Navigation integration
- ✅ API integration
- ✅ State management

کامپوننت‌های در انتظار پیاده‌سازی:
- ⏳ Event Tabs system
- ⏳ Inspections List
- ⏳ Inspection Cards
- ⏳ Daily Report Cards
- ⏳ CRUD Modals

## Troubleshooting

### مشکلات رایج

1. **API Connection**: بررسی کنید backend در حال اجرا باشد
2. **Missing Dependencies**: `npm install` را اجرا کنید
3. **Type Errors**: بررسی کنید types در `maintenance-events.ts` به‌روز باشند
4. **Navigation Issues**: بررسی کنید routes در `app` directory درست تعریف شده‌اند
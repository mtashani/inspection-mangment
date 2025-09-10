# Daily Reports Components

این پوشه شامل تمام کامپوننت‌های مربوط به صفحه Daily Reports است که از Enhanced Daily Reports صفحه قدیمی migrate شده‌اند.

## ساختار کامپوننت‌ها

### کامپوننت‌های اصلی

#### `DailyReportsContainer`
کامپوننت اصلی که تمام state management و data fetching را مدیریت می‌کند.

**ویژگی‌ها:**
- مدیریت state با TanStack Query
- همگام‌سازی فیلترها با URL
- مدیریت loading و error states
- CRUD operations برای daily reports

#### `DailyReportsHeader`
Header صفحه با breadcrumb، title و action buttons.

**ویژگی‌ها:**
- Responsive design
- Action buttons (refresh, export, settings)
- نمایش تعداد items و فیلترهای فعال

#### `SummaryCards`
کارت‌های خلاصه آمار و metrics کلیدی.

**ویژگی‌ها:**
- 8 کارت metric مختلف
- Click-to-filter functionality
- Loading skeletons
- Responsive grid layout

#### `FilterPanel`
پنل جامع فیلتر کردن با قابلیت‌های پیشرفته.

**ویژگی‌ها:**
- جستجوی متنی
- فیلترهای سریع (Quick filters)
- فیلترهای پیشرفته (Advanced filters)
- Date range picker
- Multi-select inspectors
- URL state synchronization

#### `HierarchicalList`
نمایش hierarchical داده‌ها (Maintenance Events > Inspections > Daily Reports).

**ویژگی‌ها:**
- Expand/collapse functionality
- Action menus برای هر item
- Status indicators
- Nested structure support

### کامپوننت‌های Modal

#### `CreateReportModal`
Modal برای ایجاد گزارش روزانه جدید.

**ویژگی‌ها:**
- Form validation با Zod
- Multi-select inspectors
- Date picker
- Weather conditions selection
- Rich text areas برای findings و recommendations

#### `EditReportModal`
Modal برای ویرایش گزارش‌های موجود.

**ویژگی‌ها:**
- Pre-populated form data
- Same validation as create modal
- Optimistic updates

### کامپوننت‌های کمکی

#### `DailyReportsErrorBoundary`
Error boundary مخصوص Daily Reports با fallback UI مناسب.

#### `DailyReportsSkeletons`
مجموعه‌ای از loading skeleton components برای UX بهتر.

## استفاده

### Import کردن کامپوننت‌ها

```tsx
import {
  DailyReportsContainer,
  SummaryCards,
  FilterPanel,
  HierarchicalList,
  CreateReportModal,
  EditReportModal
} from '@/components/daily-reports'
```

### استفاده در صفحه

```tsx
// در app/daily-reports/page.tsx
import { DailyReportsContainer } from '@/components/daily-reports'

export default function DailyReportsPage({ searchParams }) {
  const initialFilters = {
    search: searchParams?.search,
    status: searchParams?.status,
    // ...
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <DailyReportsContainer initialFilters={initialFilters} />
    </div>
  )
}
```

## API Integration

### Backend Endpoints

کامپوننت‌ها از این API endpoints استفاده می‌کنند:

- `GET /api/v1/daily-reports` - دریافت لیست گزارش‌ها
- `POST /api/v1/daily-reports` - ایجاد گزارش جدید
- `PUT /api/v1/daily-reports/{id}` - ویرایش گزارش
- `DELETE /api/v1/daily-reports/{id}` - حذف گزارش
- `GET /api/v1/daily-reports/by-inspection/{id}` - گزارش‌های یک inspection
- `GET /api/v1/inspections` - لیست inspections
- `GET /api/v1/maintenance-events` - لیست maintenance events

### Data Flow

```
Page Component
    ↓
DailyReportsContainer
    ↓
TanStack Query Hooks (use-daily-reports.ts)
    ↓
API Services (daily-reports.ts)
    ↓
Backend APIs
```

## State Management

### TanStack Query

تمام data fetching و caching با TanStack Query مدیریت می‌شود:

```tsx
// مثال استفاده از hooks
const { data, loading, error } = useDailyReports(filters)
const createMutation = useCreateDailyReport()
const updateMutation = useUpdateDailyReport()
```

### URL State

فیلترها با URL همگام‌سازی می‌شوند:

```
/daily-reports?search=pump&status=IN_PROGRESS&dateFrom=2025-01-01
```

## Styling

### Design System

تمام کامپوننت‌ها از shadcn/ui و Tailwind CSS استفاده می‌کنند:

- Consistent spacing و typography
- Dark/Light mode support
- Responsive design
- Accessibility compliance

### Theme Variables

```css
/* استفاده از CSS variables برای consistency */
.text-primary
.bg-card
.border-border
/* ... */
```

## Performance

### Optimizations

- **Virtualization**: برای لیست‌های بزرگ (آماده برای پیاده‌سازی)
- **Lazy Loading**: کامپوننت‌های سنگین
- **Memoization**: React.memo و useMemo در جاهای مناسب
- **Optimistic Updates**: برای UX بهتر در mutations

### Bundle Size

- Tree shaking برای کاهش bundle size
- Dynamic imports برای code splitting
- Optimized dependencies

## Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Coverage

```bash
npm run test:coverage
```

## Migration Notes

### تفاوت‌ها با Enhanced Daily Reports قدیمی

1. **نام**: "Daily Reports" به جای "Enhanced Daily Reports"
2. **Backend Integration**: Real API calls به جای mock data
3. **Design System**: shadcn/ui به جای custom components
4. **State Management**: TanStack Query به جای local state
5. **Type Safety**: Full TypeScript support
6. **Performance**: بهینه‌سازی‌های مختلف

### Breaking Changes

- API interface تغییر کرده
- Component props متفاوت هستند
- CSS classes جدید

## Troubleshooting

### مشکلات رایج

1. **API Connection**: بررسی کنید backend در حال اجرا باشد
2. **Missing Dependencies**: `npm install` را اجرا کنید
3. **Type Errors**: بررسی کنید تمام types import شده باشند

### Debug Mode

```tsx
// برای debug کردن TanStack Query
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// در development mode
{process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
```

## Contributing

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- Component documentation

### Pull Request Process

1. Fork repository
2. Create feature branch
3. Write tests
4. Update documentation
5. Submit PR

## Future Enhancements

### Planned Features

- [ ] Real-time updates با WebSockets
- [ ] Advanced analytics dashboard
- [ ] Bulk operations
- [ ] Export functionality
- [ ] Mobile app support
- [ ] Offline support

### Performance Improvements

- [ ] Virtual scrolling برای لیست‌های بزرگ
- [ ] Service Worker برای caching
- [ ] Image optimization
- [ ] Bundle splitting بیشتر
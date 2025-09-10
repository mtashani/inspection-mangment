# Component Library Documentation

## Overview

This document provides comprehensive documentation for all custom components in the Inspection Management System frontend. Each component is designed with accessibility, performance, and maintainability in mind.

## Table of Contents

1. [UI Components](#ui-components)
2. [Layout Components](#layout-components)
3. [Form Components](#form-components)
4. [Data Display Components](#data-display-components)
5. [Navigation Components](#navigation-components)
6. [Utility Components](#utility-components)
7. [Theme System](#theme-system)
8. [Best Practices](#best-practices)

---

## UI Components

### Button Component

**Location**: `src/components/ui/button.tsx`

A versatile button component with multiple variants and sizes.

#### Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}
```

#### Usage Examples

```tsx
// Basic button
<Button>Click me</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Small outline button
<Button variant="outline" size="sm">Cancel</Button>

// Icon button
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

#### Accessibility Features
- Full keyboard navigation support
- ARIA attributes for screen readers
- Focus management and visual indicators
- Semantic HTML structure

---

### Card Component

**Location**: `src/components/ui/card.tsx`

A flexible container component for grouping related content.

#### Props

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
```

#### Usage Examples

```tsx
<Card>
  <CardHeader>
    <CardTitle>Equipment Details</CardTitle>
    <CardDescription>View and edit equipment information</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Equipment content goes here...</p>
  </CardContent>
  <CardFooter>
    <Button>Save Changes</Button>
  </CardFooter>
</Card>
```

---

### Input Component

**Location**: `src/components/ui/input.tsx`

A styled input component with validation support.

#### Props

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  helperText?: string
}
```

#### Usage Examples

```tsx
// Basic input
<Input placeholder="Enter equipment name" />

// Input with error state
<Input 
  placeholder="Enter email" 
  error={true}
  helperText="Please enter a valid email address"
/>

// Controlled input
<Input 
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Search..."
/>
```

---

### Loading Spinner

**Location**: `src/components/ui/loading-spinner.tsx`

A customizable loading indicator component.

#### Props

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}
```

#### Usage Examples

```tsx
// Basic spinner
<LoadingSpinner />

// Large spinner with text
<LoadingSpinner size="lg" text="Loading data..." />

// Custom styled spinner
<LoadingSpinner className="text-primary" />
```

---

### Optimized Image

**Location**: `src/components/ui/optimized-image.tsx`

An enhanced image component with optimization and error handling.

#### Props

```typescript
interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  fill?: boolean
  quality?: number
}
```

#### Usage Examples

```tsx
// Basic optimized image
<OptimizedImage 
  src="/equipment/pump-01.jpg"
  alt="Centrifugal Pump"
  width={300}
  height={200}
/>

// Priority image with blur placeholder
<OptimizedImage 
  src="/hero-image.jpg"
  alt="Industrial facility"
  width={1200}
  height={600}
  priority={true}
  placeholder="blur"
/>

// Responsive fill image
<OptimizedImage 
  src="/background.jpg"
  alt="Background"
  fill={true}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

---

## Layout Components

### Main Layout

**Location**: `src/components/layout/main-layout.tsx`

The primary layout wrapper for authenticated pages.

#### Props

```typescript
interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}
```

#### Usage Examples

```tsx
<MainLayout title="Dashboard" description="System overview and metrics">
  <DashboardContent />
</MainLayout>
```

---

### Sidebar Navigation

**Location**: `src/components/layout/sidebar.tsx`

Responsive sidebar navigation component.

#### Features
- Collapsible design for mobile
- Active state management
- Role-based menu items
- Keyboard navigation support

#### Usage Examples

```tsx
<Sidebar 
  isOpen={sidebarOpen}
  onToggle={setSidebarOpen}
  userRole="inspector"
/>
```

---

## Form Components

### Form Field

**Location**: `src/components/form/form-field.tsx`

A wrapper component for form inputs with label and validation.

#### Props

```typescript
interface FormFieldProps {
  label: string
  name: string
  error?: string
  required?: boolean
  children: React.ReactNode
  helperText?: string
}
```

#### Usage Examples

```tsx
<FormField 
  label="Equipment Name"
  name="equipmentName"
  required={true}
  error={errors.equipmentName}
  helperText="Enter a unique name for this equipment"
>
  <Input {...register('equipmentName')} />
</FormField>
```

---

### Date Picker

**Location**: `src/components/form/date-picker.tsx`

Jalali calendar-enabled date picker component.

#### Props

```typescript
interface DatePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  calendarType?: 'gregorian' | 'jalali'
}
```

#### Usage Examples

```tsx
// Jalali date picker
<DatePicker 
  value={inspectionDate}
  onChange={setInspectionDate}
  calendarType="jalali"
  placeholder="تاریخ بازرسی را انتخاب کنید"
/>

// Gregorian date picker
<DatePicker 
  value={dueDate}
  onChange={setDueDate}
  calendarType="gregorian"
  placeholder="Select due date"
/>
```

---

## Data Display Components

### Data Table

**Location**: `src/components/data-table/data-table.tsx`

A feature-rich table component with sorting, filtering, and pagination.

#### Props

```typescript
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  pagination?: boolean
  sorting?: boolean
  filtering?: boolean
  onRowClick?: (row: T) => void
}
```

#### Usage Examples

```tsx
const columns: ColumnDef<Equipment>[] = [
  {
    accessorKey: 'name',
    header: 'Equipment Name',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={getStatusVariant(row.original.status)}>
        {row.original.status}
      </Badge>
    ),
  },
]

<DataTable 
  data={equipmentList}
  columns={columns}
  loading={isLoading}
  pagination={true}
  sorting={true}
  filtering={true}
  onRowClick={(equipment) => navigate(`/equipment/${equipment.id}`)}
/>
```

---

### Stats Card

**Location**: `src/components/dashboard/stats-card.tsx`

A card component for displaying key metrics and statistics.

#### Props

```typescript
interface StatsCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  icon?: React.ReactNode
  description?: string
}
```

#### Usage Examples

```tsx
<StatsCard 
  title="Total Equipment"
  value={1247}
  change={{ value: 12, type: 'increase' }}
  icon={<Settings className="h-4 w-4" />}
  description="Active equipment in system"
/>
```

---

## Navigation Components

### Breadcrumb

**Location**: `src/components/navigation/breadcrumb.tsx`

Navigation breadcrumb component for showing current page hierarchy.

#### Props

```typescript
interface BreadcrumbProps {
  items: Array<{
    label: string
    href?: string
    current?: boolean
  }>
}
```

#### Usage Examples

```tsx
<Breadcrumb 
  items={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Equipment', href: '/equipment' },
    { label: 'Pump-001', current: true }
  ]}
/>
```

---

### Tab Navigation

**Location**: `src/components/navigation/tabs.tsx`

Accessible tab navigation component.

#### Props

```typescript
interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}
```

#### Usage Examples

```tsx
<Tabs defaultValue="details">
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
    <TabsTrigger value="documents">Documents</TabsTrigger>
  </TabsList>
  
  <TabsContent value="details">
    <EquipmentDetails />
  </TabsContent>
  
  <TabsContent value="history">
    <MaintenanceHistory />
  </TabsContent>
  
  <TabsContent value="documents">
    <DocumentList />
  </TabsContent>
</Tabs>
```

---

## Utility Components

### Error Boundary

**Location**: `src/components/error-boundary.tsx`

React error boundary for graceful error handling.

#### Props

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}
```

#### Usage Examples

```tsx
<ErrorBoundary fallback={CustomErrorFallback}>
  <SomeComponentThatMightError />
</ErrorBoundary>
```

---

### Performance Monitor

**Location**: `src/components/performance-monitor.tsx`

Development tool for monitoring application performance.

#### Features
- Core Web Vitals tracking
- Memory usage monitoring
- Network status detection
- Real-time metrics display

#### Usage Examples

```tsx
// Automatically included in development builds
<PerformanceMonitor />
```

---

## Theme System

### Theme Provider

**Location**: `src/components/theme-provider.tsx`

Context provider for theme management with system preference detection.

#### Features
- Light/Dark mode support
- System preference detection
- Persistent theme selection
- Smooth transitions

#### Usage Examples

```tsx
<ThemeProvider defaultTheme="system" storageKey="app-theme">
  <App />
</ThemeProvider>
```

### Theme Toggle

**Location**: `src/components/theme-toggle.tsx`

Button component for switching between light and dark themes.

#### Usage Examples

```tsx
<ThemeToggle />
```

---

## Best Practices

### Component Development Guidelines

1. **Accessibility First**
   - Always include proper ARIA attributes
   - Ensure keyboard navigation works
   - Test with screen readers
   - Maintain proper color contrast

2. **Performance Optimization**
   - Use React.memo for expensive components
   - Implement proper loading states
   - Lazy load heavy components
   - Optimize re-renders with useMemo/useCallback

3. **Type Safety**
   - Define proper TypeScript interfaces
   - Use generic types where appropriate
   - Avoid `any` types
   - Document prop types clearly

4. **Testing**
   - Write unit tests for all components
   - Include accessibility tests
   - Test different prop combinations
   - Mock external dependencies

5. **Documentation**
   - Document all props and their types
   - Provide usage examples
   - Include accessibility notes
   - Document any special behaviors

### Code Organization

```
src/components/
├── ui/                 # Basic UI components
├── layout/            # Layout-related components
├── form/              # Form-specific components
├── navigation/        # Navigation components
├── dashboard/         # Dashboard-specific components
└── [feature]/         # Feature-specific components
```

### Naming Conventions

- **Components**: PascalCase (e.g., `DataTable`, `FormField`)
- **Files**: kebab-case (e.g., `data-table.tsx`, `form-field.tsx`)
- **Props**: camelCase (e.g., `isLoading`, `onValueChange`)
- **CSS Classes**: kebab-case following Tailwind conventions

### Import/Export Patterns

```typescript
// Named exports for components
export { Button } from './button'
export { Input } from './input'

// Default export for main component
export default function DataTable() { ... }

// Re-export from index files
export * from './button'
export * from './input'
```

---

## Storybook Integration

All components should have corresponding Storybook stories for:
- Visual testing
- Documentation
- Component playground
- Accessibility testing

### Story Structure

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Button',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
}
```

---

## Migration Notes

When migrating from the old system:

1. **Component Mapping**
   - Old `<button>` → New `<Button>`
   - Old custom CSS → Tailwind classes
   - Old form components → New form system

2. **Breaking Changes**
   - Prop name changes documented in migration guide
   - CSS class changes
   - Event handler signature changes

3. **Gradual Migration**
   - Components can be migrated incrementally
   - Old and new systems can coexist temporarily
   - Use feature flags for gradual rollout

---

For more detailed information about specific components, refer to their individual documentation files or Storybook stories.
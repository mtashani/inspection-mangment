---
trigger: manual
alwaysApply: false
---

# Frontend V2 Design & Development Rules

This rule enforces the design system, component patterns, and implementation standards for the Inspection Management System Frontend V2.

## Core Design Principles

### Architecture Standards
- **Framework**: Next.js 15 with React 19, TypeScript strict mode
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query for server state, React Context for client state
- **Component Pattern**: Container/Presentation separation
- **Mobile-First**: All interfaces must be responsive and touch-friendly

### Project Structure Requirements
```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
│   ├── ui/             # Base shadcn/ui components
│   ├── [domain]/       # Domain-specific components
│   └── layout/         # Layout components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── styles/             # Global styles and optimizations
└── types/              # TypeScript type definitions
```

## Component Implementation Rules

### 1. Component Architecture Pattern
ALWAYS follow the container/presentation separation:

```tsx
// Container Component (logic)
export function EventsOverviewContainer({ initialFilters }: Props) {
  const { data, loading } = useMaintenanceEvents(filters);
  return <EventsList events={data} loading={loading} />;
}

// Presentation Component (UI)
export function EventsList({ events, loading }: Props) {
  return <div>{/* Pure UI rendering */}</div>;
}
```

### 2. TypeScript Requirements
- ALWAYS define props interfaces for components
- Use strict mode TypeScript
- Use string enums for better debugging
- Follow PascalCase for interface naming

```tsx
interface ComponentNameProps {
  data: RequiredType;
  onAction?: () => void;
  loading?: boolean;
}
```

### 3. Card Component Pattern
ALL cards must follow this structure:

```tsx
<Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Title</CardTitle>
    <Icon className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{value}</div>
    <p className="text-xs text-muted-foreground">Description</p>
  </CardContent>
</Card>
```

### 4. Button Hierarchy Standards
```tsx
// Primary action
<Button variant="default">Primary Action</Button>

// Secondary action
<Button variant="outline">Secondary Action</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Ghost/subtle action
<Button variant="ghost">Cancel</Button>
```

### 5. Loading States Implementation
ALL components MUST handle loading states:

```tsx
// Button loading state
<Button disabled={isLoading}>
  {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? 'Loading...' : 'Submit'}
</Button>

// Skeleton loading
<Skeleton className="h-8 w-20" />

// Progressive loading wrapper
<ProgressiveLoading
  isLoading={loading}
  skeleton={<StatsGridSkeleton count={8} />}
  delay={100}
>
  <ActualContent />
</ProgressiveLoading>
```

## Responsive Design Requirements

### 1. Mobile-First Breakpoints
```css
/* Mobile First Approach */
/* Default: Mobile (0-767px) */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### 2. Grid Layout Patterns
```tsx
// Standard responsive grid
<div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

// Summary cards pattern
<div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">

// Main content layout
<div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
  <div className="lg:col-span-3">
  <div className="lg:col-span-1">
```

### 3. Mobile Optimization Rules
- **Touch Targets**: Minimum 44px x 44px for interactive elements
- **Typography**: Minimum 16px input font size (prevents iOS zoom)
- **Safe Areas**: Account for device notches using CSS env() variables
- **Scrolling**: Use `-webkit-overflow-scrolling: touch` for momentum scrolling

```tsx
// Mobile responsive patterns
<div className="hidden md:block">Desktop Only</div>
<div className="flex flex-col md:flex-row gap-4">
<Button className="w-full md:w-auto">
```

## Styling Standards

### 1. Color System (CSS Custom Properties)
```css
/* Light Theme */
--primary: 222.2 47.4% 11.2%
--secondary: 210 40% 96%
--muted: 210 40% 96%
--destructive: 0 84.2% 60.2%
--border: 214.3 31.8% 91.4%

/* Dark Theme */
--primary: 210 40% 98%
--background: 222.2 84% 4.9%
```

### 2. Icon Usage Standards
- **Library**: Lucide React icons only
- **Sizes**: `h-4 w-4` (16px) standard, `h-6 w-6` (24px) for headers
- **Colors**: `text-muted-foreground` decorative, `text-foreground` functional

```tsx
// Status indicators
<CheckCircle className="h-4 w-4 text-green-600" />  // Completed
<AlertTriangle className="h-4 w-4 text-red-600" />  // Error/Warning
<Activity className="h-4 w-4 text-yellow-600" />    // In Progress
```

### 3. Animation Standards
```css
/* Standard transitions */
.transition-all { transition: all 0.2s ease; }
.hover:scale-105:hover { transform: scale(1.05); }
.animate-spin { animation: spin 1s linear infinite; }
```

## Form Implementation Rules

### 1. Form Structure Pattern
```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
    <FormField
      control={form.control}
      name="fieldName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Field Label</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

### 2. Validation Requirements
- Use React Hook Form with Zod validation
- Always provide clear error messages
- Implement real-time validation feedback

## State Management Rules

### 1. Server State Management
- Use TanStack Query for all API data
- Implement proper error handling with toast notifications
- Use optimistic updates where appropriate

```tsx
const { data, error, isLoading } = useQuery({
  queryKey: ['events'],
  queryFn: fetchEvents,
  onError: (error) => toast.error(error.message),
});
```

### 2. URL State Management
- Implement URL synchronization for shareable filters
- Use custom hooks for URL state management
- Maintain filter persistence across page reloads

## Error Handling Patterns

### 1. Error Boundary Usage
```tsx
<ErrorBoundary>
  <ComponentThatMightFail />
</ErrorBoundary>
```

### 2. Query Error Handling
```tsx
if (error) return <ErrorState error={error} />;
if (isLoading) return <LoadingState />;
```

## Layout Guidelines

### 1. Dashboard Layout Structure
```tsx
<DashboardLayout breadcrumbs={breadcrumbs}>
  <div className="flex flex-col gap-6">
    <PageHeader />
    <SummaryCards />
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <MainContent />
      </div>
      <div className="lg:col-span-1">
        <Sidebar />
      </div>
    </div>
  </div>
</DashboardLayout>
```

### 2. Page Composition Pattern
1. **Header Section**: Title, description, and primary actions
2. **Summary Section**: Key metrics and statistics
3. **Filter Section**: Search and filtering controls
4. **Content Section**: Main data display with pagination
5. **Action Section**: Secondary actions and quick tools

## Performance Requirements

### 1. Loading Optimization
- Use React.lazy for route-based code splitting
- Implement virtualization for lists over 1000 items
- Use Next.js Image component for optimized images
- Monitor bundle size regularly

### 2. Runtime Performance
- Minimize re-renders with React.memo
- Use proper dependency arrays in useEffect
- Implement error boundaries
- Monitor Core Web Vitals

## Testing Standards

### 1. Component Testing
```tsx
// Test rendering
expect(screen.getByText('Expected Text')).toBeInTheDocument();

// Test interactions
await user.click(screen.getByRole('button', { name: 'Submit' }));

// Test loading states
expect(screen.getByText('Loading...')).toBeInTheDocument();
```

### 2. E2E Testing Requirements
- Test critical user flows (login, dashboard, key actions)
- Verify responsive behavior across devices
- Test accessibility features (keyboard navigation, screen readers)

## Accessibility Requirements

### 1. WCAG 2.1 AA Compliance
- Ensure sufficient contrast ratios (4.5:1 minimum)
- Provide proper ARIA attributes
- Use semantic HTML elements
- Implement keyboard navigation

### 2. Focus Management
```tsx
// Clear focus indicators
.focus-visible:outline-none:focus-visible {
  outline: 2px solid rgb(59, 130, 246);
  outline-offset: 2px;
}
```

## Code Quality Checklist

### Before Implementation
- [ ] Design follows established patterns
- [ ] TypeScript interfaces defined
- [ ] Mobile responsiveness planned
- [ ] Accessibility requirements identified
- [ ] Loading and error states designed

### During Implementation
- [ ] Follows component architecture patterns
- [ ] Implements proper TypeScript types
- [ ] Includes responsive design classes
- [ ] Handles loading and error states
- [ ] Includes proper ARIA attributes
- [ ] Uses semantic HTML elements

### After Implementation
- [ ] Unit tests written and passing
- [ ] Visual regression tests pass
- [ ] Accessibility testing completed
- [ ] Performance impact measured
- [ ] Code review completed
- [ ] Documentation updated

## Violation Consequences

Failure to follow these rules may result in:
- Code review rejection
- Inconsistent user experience
- Accessibility violations
- Performance issues
- Maintenance difficulties

**Remember**: Consistency is more important than individual preferences. When in doubt, follow existing patterns rather than creating new ones.

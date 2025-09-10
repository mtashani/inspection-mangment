# Frontend V2 Design Rules & Guidelines

This document serves as the comprehensive design system guide for the Inspection Management System Frontend V2. It outlines the design principles, component patterns, and implementation standards that must be followed to maintain consistency and quality across the application.

## 🎯 Design Philosophy

### Core Principles
1. **Consistency First**: Every component should follow established patterns
2. **Mobile-First Design**: All interfaces must be responsive and touch-friendly
3. **Accessibility by Default**: WCAG 2.1 AA compliance is mandatory
4. **Performance Conscious**: Optimize for real-world network conditions
5. **User Experience Focused**: Prioritize usability over aesthetics

## 🏗️ Architecture Overview

### Technology Stack
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query + React Context
- **Type Safety**: TypeScript with strict mode
- **Testing**: Jest + Playwright for E2E

### Project Structure Standards
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

## 🎨 Design System

### Color Palette
Using CSS Custom Properties with HSL values for consistent theming:

```css
/* Light Theme */
--primary: 222.2 47.4% 11.2%        /* Dark blue-gray */
--secondary: 210 40% 96%             /* Light gray */
--muted: 210 40% 96%                 /* Muted gray */
--accent: 210 40% 96%                /* Accent gray */
--destructive: 0 84.2% 60.2%         /* Red for errors */
--border: 214.3 31.8% 91.4%          /* Border gray */

/* Dark Theme */
--primary: 210 40% 98%               /* Light text */
--background: 222.2 84% 4.9%         /* Dark background */
```

### Typography
- **Font Family**: Inter (variable font with swap display)
- **Font Sizes**: Use Tailwind's predefined scale (text-sm, text-base, text-lg, etc.)
- **Font Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)

### Spacing & Layout
- **Grid System**: CSS Grid with responsive breakpoints
- **Spacing Scale**: Tailwind's 4px base unit (0.25rem)
- **Border Radius**: Consistent `--radius: 0.5rem` variable
- **Shadows**: Subtle elevation using `shadow-sm`, `shadow-md`, `shadow-lg`

## 📱 Responsive Design Rules

### Breakpoint Strategy
```css
/* Mobile First Approach */
/* Default: Mobile (0-767px) */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Mobile Optimization Requirements
1. **Touch Targets**: Minimum 44px x 44px for interactive elements
2. **Typography**: Minimum 16px input font size to prevent zoom on iOS
3. **Safe Areas**: Account for device notches and home indicators
4. **Scrolling**: Implement momentum scrolling with `-webkit-overflow-scrolling: touch`

### Grid Layout Patterns
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

## 🧩 Component Patterns

### Card Components
**Standard Card Structure:**
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

**Card Interaction Rules:**
- Always include hover states for interactive cards
- Use subtle animations (scale, shadow) for feedback
- Maintain consistent padding (p-6 for header, pt-0 for content)

### Button Patterns
**Button Hierarchy:**
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

**Loading States:**
```tsx
<Button disabled={isLoading}>
  {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? 'Loading...' : 'Submit'}
</Button>
```

### Form Components
**Form Structure Pattern:**
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

### Loading States
**Skeleton Loading:**
```tsx
// Simple skeleton
<Skeleton className="h-8 w-20" />

// Complex skeleton (summary cards)
<SummaryCardSkeleton count={8} />

// Progressive loading wrapper
<ProgressiveLoading
  isLoading={loading}
  skeleton={<StatsGridSkeleton count={8} />}
  delay={100}
>
  <ActualContent />
</ProgressiveLoading>
```

## 🎭 Animation & Transitions

### Standard Transitions
```css
/* Hover transitions */
.transition-all { transition: all 0.2s ease; }

/* Scale animations */
.hover:scale-105:hover { transform: scale(1.05); }

/* Loading animations */
.animate-spin { animation: spin 1s linear infinite; }
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
```

### Interaction Feedback
- **Hover States**: Subtle elevation and color changes
- **Active States**: Slight scale reduction (0.98) for touch feedback
- **Focus States**: Clear ring indicators for keyboard navigation
- **Loading States**: Consistent spinner icons and skeleton placeholders

## 🔧 Technical Implementation Rules

### TypeScript Standards
1. **Strict Mode**: Always enabled
2. **Interface Naming**: PascalCase with descriptive names
3. **Props Interfaces**: Always define props interfaces for components
4. **Enum Usage**: Use string enums for better debugging

### Component Architecture
**Container/Presentation Pattern:**
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

### State Management Rules
1. **Server State**: Use TanStack Query for all API data
2. **Client State**: Use React Context for app-wide state
3. **Form State**: Use React Hook Form with Zod validation
4. **URL State**: Use custom hooks for URL synchronization

### Error Handling Patterns
```tsx
// Error Boundary wrapper
<ErrorBoundary>
  <ComponentThatMightFail />
</ErrorBoundary>

// Query error handling
const { data, error, isLoading } = useQuery({
  queryKey: ['events'],
  queryFn: fetchEvents,
  onError: (error) => toast.error(error.message),
});

if (error) return <ErrorState error={error} />;
```

## 📐 Layout Guidelines

### Dashboard Layout Structure
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

### Page Composition Pattern
1. **Header Section**: Title, description, and primary actions
2. **Summary Section**: Key metrics and statistics
3. **Filter Section**: Search and filtering controls
4. **Content Section**: Main data display with pagination
5. **Action Section**: Secondary actions and quick tools

## 🎨 Icon Usage Standards

### Icon Library
- **Primary**: Lucide React icons
- **Size Standards**: `h-4 w-4` (16px) for most cases, `h-6 w-6` (24px) for headers
- **Color Classes**: `text-muted-foreground` for decorative, `text-foreground` for functional

### Common Icon Mappings
```tsx
// Status indicators
<CheckCircle className="h-4 w-4 text-green-600" />  // Completed
<AlertTriangle className="h-4 w-4 text-red-600" />  // Error/Warning
<Activity className="h-4 w-4 text-yellow-600" />    // In Progress

// Actions
<Plus className="h-4 w-4" />          // Add/Create
<Edit className="h-4 w-4" />          // Edit
<Trash2 className="h-4 w-4" />        // Delete
<RefreshCw className="h-4 w-4" />     // Refresh/Loading
```

## 🌙 Dark Mode Implementation

### Theme Toggle Pattern
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
>
  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
</Button>
```

### Dark Mode Color Considerations
- Ensure sufficient contrast ratios (4.5:1 minimum)
- Test all interactive states in both themes
- Use semantic color variables, not hardcoded values

## 📱 Mobile-Specific Guidelines

### Touch Interface Rules
1. **Minimum Touch Target**: 44px x 44px
2. **Gesture Support**: Implement swipe actions where appropriate
3. **Scroll Behavior**: Use momentum scrolling for lists
4. **Input Handling**: Prevent zoom on input focus

### Mobile Layout Adaptations
```tsx
// Hide on mobile, show on desktop
<div className="hidden md:block">Desktop Only</div>

// Stack on mobile, side-by-side on desktop
<div className="flex flex-col md:flex-row gap-4">

// Full width on mobile
<Button className="w-full md:w-auto">
```

## 🔍 Search & Filter Patterns

### Global Search Implementation
```tsx
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">
    <Input
      placeholder="Search events..."
      value={filters.search}
      onChange={(e) => handleFiltersChange({ search: e.target.value })}
    />
  </div>
  <div className="flex gap-2">
    <FilterDropdown />
    <DateRangePicker />
  </div>
</div>
```

### Filter State Management
- Use URL synchronization for shareable filters
- Implement debounced search inputs
- Provide clear filter indicators and reset options

## 🧪 Testing Requirements

### Component Testing
```tsx
// Test rendering
expect(screen.getByText('Expected Text')).toBeInTheDocument();

// Test interactions
await user.click(screen.getByRole('button', { name: 'Submit' }));

// Test loading states
expect(screen.getByText('Loading...')).toBeInTheDocument();
```

### E2E Testing Patterns
- Test critical user flows (login, dashboard, key actions)
- Verify responsive behavior across devices
- Test accessibility features (keyboard navigation, screen readers)

## 📈 Performance Guidelines

### Loading Optimization
1. **Lazy Loading**: Use React.lazy for route-based code splitting
2. **Image Optimization**: Use Next.js Image component
3. **Bundle Analysis**: Regular bundle size monitoring
4. **Virtualization**: Implement for large lists (1000+ items)

### Runtime Performance
- Minimize unnecessary re-renders with React.memo
- Use proper dependency arrays in useEffect
- Implement proper error boundaries
- Monitor Core Web Vitals

## 🚀 Deployment Considerations

### Build Optimization
```json
{
  "scripts": {
    "build": "next build",
    "build:analyze": "ANALYZE=true next build",
    "build:production": "NODE_ENV=production next build"
  }
}
```

### Environment Configuration
- Use environment variables for API endpoints
- Implement proper error tracking
- Set up monitoring and analytics

## 📋 Checklist for New Components

### Before Implementation
- [ ] Design approved and follows established patterns
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

## 🛠️ Development Tools

### Required VSCode Extensions
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Prettier - Code formatter
- ESLint

### Recommended Workflow
1. Create component with TypeScript interface
2. Implement mobile-first responsive design
3. Add loading and error states
4. Write unit tests
5. Test across devices and browsers
6. Performance audit
7. Accessibility review

## 📝 Documentation Standards

### Component Documentation
```tsx
/**
 * EventCard component displays maintenance event information
 * 
 * @param event - The maintenance event data
 * @param onEdit - Callback for edit action
 * @param onDelete - Callback for delete action
 * @param loading - Loading state indicator
 */
interface EventCardProps {
  event: MaintenanceEvent;
  onEdit?: () => void;
  onDelete?: () => void;
  loading?: boolean;
}
```

### Storybook Integration
- Every reusable component should have stories
- Include all variant states
- Document props and usage examples
- Test with different data scenarios

---

## 🎯 Final Notes

This design system is living document that should evolve with the project. All changes to these rules should be:

1. **Discussed**: Team review before implementation
2. **Documented**: Update this file with changes
3. **Tested**: Ensure compatibility with existing components
4. **Communicated**: Share updates with all team members

Remember: **Consistency is more important than individual preferences**. When in doubt, follow existing patterns rather than creating new ones.

## 📞 Questions & Support

For questions about these guidelines or requests for new patterns, please:
1. Check existing components for similar patterns
2. Review this document thoroughly  
3. Discuss with the team before implementing new patterns
4. Update documentation when adding new standards

---
*Last updated: January 2025*
*Version: 2.0*
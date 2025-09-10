# UI Component Library Documentation

## Overview

This documentation covers the enhanced UI component library for the Inspection Management System. All components are built with accessibility, performance, and theming in mind.

## Design System

### Color Schemes
The system supports 7 beautiful color schemes, each with light and dark modes:
- **Blue** (Default): Professional and trustworthy
- **Green**: Natural and growth-oriented
- **Purple**: Creative and innovative
- **Orange**: Energetic and warm
- **Red**: Bold and attention-grabbing
- **Teal**: Calm and balanced
- **Indigo**: Deep and sophisticated

### Typography
- **Font Family**: Inter (primary), JetBrains Mono (monospace)
- **Font Sizes**: 12px - 36px with consistent line heights
- **Font Weights**: Normal (400), Medium (500), Semibold (600), Bold (700)

### Spacing System
Based on 4px grid system: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px

## Core Components

### 1. Enhanced Form System (`enhanced-form-system.tsx`)

#### EnhancedFormField
Base form field component with validation and accessibility features.

```tsx
import { EnhancedFormField } from '@/components/ui/enhanced-form-system';

<EnhancedFormField
  label="Email Address"
  required
  error="Please enter a valid email"
  description="We'll never share your email"
  config={{ variant: 'comfortable', size: 'md' }}
>
  <input type="email" />
</EnhancedFormField>
```

**Props:**
- `label` (string): Field label text
- `required` (boolean): Whether field is required
- `error` (string): Error message to display
- `success` (string): Success message to display
- `warning` (string): Warning message to display
- `description` (string): Help text
- `config` (FormFieldConfig): Field configuration options

#### EnhancedInput
Advanced input component with real-time validation and debouncing.

```tsx
import { EnhancedInput } from '@/components/ui/enhanced-form-system';

<EnhancedInput
  label="Username"
  required
  clearable
  showPasswordToggle={type === 'password'}
  onValidate={async (value) => {
    // Custom validation logic
    return { isValid: value.length >= 3, message: 'Too short' };
  }}
  debounceMs={300}
/>
```

**Props:**
- `clearable` (boolean): Show clear button
- `showPasswordToggle` (boolean): Show password visibility toggle
- `prefix` (ReactNode): Content before input
- `suffix` (ReactNode): Content after input
- `onValidate` (function): Async validation function
- `debounceMs` (number): Debounce delay for validation

#### EnhancedFormWizard
Multi-step form component with progress tracking.

```tsx
import { EnhancedFormWizard } from '@/components/ui/enhanced-form-system';

const steps = [
  {
    id: 'personal',
    title: 'Personal Information',
    content: <PersonalInfoForm />,
    validation: async () => validatePersonalInfo(),
    estimatedTime: 5
  },
  // ... more steps
];

<EnhancedFormWizard
  steps={steps}
  currentStep={currentStep}
  onStepChange={setCurrentStep}
  onComplete={handleComplete}
  showProgress
  showTimeEstimate
  autoSave
  onAutoSave={handleAutoSave}
/>
```

### 2. Widget System (`widget-system.tsx`)

#### WidgetSystem
Container for dashboard widgets with drag-and-drop support.

```tsx
import { WidgetSystem, widgetTemplates } from '@/components/ui/widget-system';

const [widgets, setWidgets] = useState([
  widgetTemplates.totalInspections(),
  widgetTemplates.pendingInspections(),
  widgetTemplates.recentInspections()
]);

<WidgetSystem
  widgets={widgets}
  onWidgetsChange={setWidgets}
  editable
  columns={4}
  gap={4}
/>
```

**Widget Types:**
- **MetricWidget**: Display KPIs with trends and targets
- **ListWidget**: Show filterable lists with search and sort
- **ChartWidget**: Data visualizations (placeholder)
- **CustomWidget**: Custom React components

### 3. Data Table System (`optimized-data-table.tsx`)

#### OptimizedDataTable
High-performance data table with virtualization for large datasets.

```tsx
import { OptimizedDataTable } from '@/components/ui/optimized-data-table';

const columns = [
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    sortable: true,
    filterable: true
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ value }) => <StatusBadge status={value} />
  }
];

<OptimizedDataTable
  data={data}
  columns={columns}
  enableVirtualization
  serverSide
  onFetchData={fetchTableData}
  selectable
  onRowSelect={handleRowSelect}
  enableCaching
  cacheKey="inspections-table"
/>
```

**Features:**
- Virtual scrolling for 1000+ rows
- Server-side pagination and filtering
- Column sorting and filtering
- Row selection
- Data caching
- Export functionality

### 4. Table Export System (`table-export-system.tsx`)

#### ExportOptionsDialog
Comprehensive export dialog with multiple formats and customization.

```tsx
import { ExportOptionsDialog } from '@/components/ui/table-export-system';

<ExportOptionsDialog
  data={tableData}
  columns={exportColumns}
  onExport={handleExport}
  templates={savedTemplates}
  onSaveTemplate={handleSaveTemplate}
/>
```

**Supported Formats:**
- CSV: Comma-separated values
- Excel: Microsoft Excel (.xlsx)
- PDF: Portable Document Format
- JSON: JavaScript Object Notation
- XML: Extensible Markup Language

### 5. Loading and Progress (`loading-progress.tsx`)

#### Skeleton Components
Loading placeholders for different content types.

```tsx
import { 
  Skeleton, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonList 
} from '@/components/ui/loading-progress';

// Basic skeleton
<Skeleton className="h-4 w-32" />

// Card skeleton
<SkeletonCard />

// Table skeleton
<SkeletonTable rows={5} columns={4} />
```

#### Progress Indicators
Various progress indicators with animations.

```tsx
import { Progress, ProgressSteps } from '@/components/ui/loading-progress';

// Linear progress
<Progress 
  value={75} 
  variant="linear" 
  color="primary" 
  showValue 
  animated 
/>

// Step progress
<ProgressSteps
  steps={steps}
  orientation="horizontal"
  showDescription
/>
```

### 6. Accessibility System (`accessibility-system.tsx`)

#### AriaLiveProvider
Context provider for screen reader announcements.

```tsx
import { AriaLiveProvider, useAriaLive } from '@/components/ui/accessibility-system';

// Wrap your app
<AriaLiveProvider>
  <App />
</AriaLiveProvider>

// Use in components
const { announce, announceError } = useAriaLive();
announce('Data saved successfully');
```

#### Accessible Components
Pre-built accessible components with proper ARIA attributes.

```tsx
import { 
  AccessibleButton, 
  AccessibleTable, 
  AccessibleModal 
} from '@/components/ui/accessibility-system';

<AccessibleButton
  ariaLabel="Save document"
  ariaDescribedBy="save-help"
  loading={isSaving}
  loadingText="Saving..."
>
  Save
</AccessibleButton>
```

### 7. Accessibility Preferences (`accessibility-preferences.tsx`)

#### AccessibilityProvider
Global accessibility preferences management.

```tsx
import { 
  AccessibilityProvider, 
  AccessibilitySettings 
} from '@/components/ui/accessibility-preferences';

// App level
<AccessibilityProvider>
  <App />
</AccessibilityProvider>

// Settings page
<AccessibilitySettings showAdvanced />
```

**Preference Categories:**
- **Visual**: High contrast, large text, font size
- **Motion**: Reduced motion, animation speed
- **Navigation**: Keyboard navigation, focus indicators
- **Audio**: Sound effects, screen reader optimization

### 8. Performance Optimization (`performance-optimization.tsx`)

#### OptimizedList
Virtualized list component for large datasets.

```tsx
import { OptimizedList } from '@/components/ui/performance-optimization';

<OptimizedList
  items={largeDataset}
  renderItem={(item, index) => <ItemComponent item={item} />}
  itemHeight={60}
  containerHeight={400}
  overscan={5}
/>
```

#### Performance Utilities
Tools for measuring and optimizing component performance.

```tsx
import { 
  usePerformanceMonitor, 
  withPerformanceMonitoring,
  performanceUtils 
} from '@/components/ui/performance-optimization';

// Monitor component renders
const MyComponent = withPerformanceMonitoring(BaseComponent, 'MyComponent');

// Debounce expensive operations
const debouncedSearch = performanceUtils.debounce(searchFunction, 300);
```

## Usage Guidelines

### 1. Theming
All components automatically adapt to the current theme. Use CSS custom properties for consistent styling:

```css
.my-component {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}
```

### 2. Accessibility
- Always provide meaningful labels and descriptions
- Use semantic HTML elements
- Test with keyboard navigation
- Ensure sufficient color contrast
- Provide alternative text for images

### 3. Performance
- Use memoization for expensive calculations
- Implement virtualization for large lists
- Lazy load components when possible
- Optimize images and assets
- Monitor bundle size

### 4. Responsive Design
Components are mobile-first and responsive by default:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

### 5. Error Handling
Always handle loading and error states:

```tsx
{loading && <LoadingState />}
{error && <ErrorState error={error} onRetry={handleRetry} />}
{data && <DataComponent data={data} />}
```

## Best Practices

### Component Development
1. **Single Responsibility**: Each component should have one clear purpose
2. **Composition over Inheritance**: Use composition patterns for flexibility
3. **Props Interface**: Define clear TypeScript interfaces for all props
4. **Default Props**: Provide sensible defaults for optional props
5. **Error Boundaries**: Wrap components in error boundaries

### Performance
1. **Memoization**: Use React.memo for expensive components
2. **Lazy Loading**: Implement code splitting for large components
3. **Virtual Scrolling**: Use for lists with 100+ items
4. **Debouncing**: Debounce user input and API calls
5. **Bundle Analysis**: Monitor and optimize bundle size

### Accessibility
1. **ARIA Labels**: Provide descriptive ARIA labels
2. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
3. **Focus Management**: Manage focus properly in modals and complex components
4. **Screen Readers**: Test with screen reader software
5. **Color Contrast**: Maintain WCAG AA compliance

### Testing
1. **Unit Tests**: Test component logic and props
2. **Integration Tests**: Test component interactions
3. **Accessibility Tests**: Use axe-core for automated a11y testing
4. **Visual Regression**: Use Chromatic or similar tools
5. **Performance Tests**: Monitor render times and memory usage

## Migration Guide

### From Old Components
1. **Import Changes**: Update import paths to new component library
2. **Prop Changes**: Review and update component props
3. **Styling**: Migrate to new design tokens and CSS custom properties
4. **Accessibility**: Add required ARIA attributes and labels
5. **Testing**: Update tests for new component APIs

### Breaking Changes
- Form components now require explicit labels
- Table components use new column definition format
- Theme switching requires new provider setup
- Accessibility features are now mandatory

## Troubleshooting

### Common Issues
1. **Theme not applying**: Ensure ThemeProvider is properly configured
2. **Components not responsive**: Check Tailwind CSS configuration
3. **Accessibility warnings**: Add missing ARIA labels and roles
4. **Performance issues**: Enable virtualization for large datasets
5. **Bundle size**: Use lazy loading and code splitting

### Debug Tools
- React DevTools Profiler for performance analysis
- axe DevTools for accessibility testing
- Lighthouse for overall quality assessment
- Bundle Analyzer for size optimization

## Contributing

### Adding New Components
1. Follow the established patterns and conventions
2. Include comprehensive TypeScript types
3. Add accessibility features by default
4. Write unit and integration tests
5. Update documentation and examples

### Code Style
- Use TypeScript for all components
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep components focused and composable

For more detailed examples and API references, see the individual component files and their accompanying test files.
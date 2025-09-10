# Theme System Migration Guide

## Overview

This guide helps you migrate from the factory-based component system to the Enhanced Theme System with shadcn/ui components and DaisyUI-style theming.

## Migration Steps

### 1. Update Component Imports

#### Before (Factory System)

```tsx
import { createInteractiveComponent, createLayoutComponent } from '@/design-system/components/base'

const Button = createInteractiveComponent('Button', {
  variants: {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600'
  }
})

const Card = createLayoutComponent('Card', {
  base: 'bg-white rounded-lg shadow-md p-4'
})
```

#### After (Enhanced Theme System)

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Components automatically use theme variables
<Button variant="primary">Click me</Button>

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content
  </CardContent>
</Card>
```

### 2. Component Mapping Reference

| Factory Component | shadcn/ui Component | Theme Variables Used |
|------------------|-------------------|---------------------|
| `createInteractiveComponent('Button')` | `@/components/ui/button` | `--color-primary`, `--radius-field`, `--size-field` |
| `createLayoutComponent('Card')` | `@/components/ui/card` | `--color-base-100`, `--radius-box`, `--depth` |
| `createFormComponent('Input')` | `@/components/ui/input` | `--color-base-100`, `--radius-field`, `--size-field` |
| `createInteractiveComponent('Badge')` | `@/components/ui/badge` | `--color-primary`, `--radius-selector`, `--size-selector` |
| `createLayoutComponent('Alert')` | `@/components/ui/alert` | `--color-info`, `--radius-box`, `--border` |

### 3. Update Theme Definitions

#### Before (Simple Color Themes)

```typescript
const blueTheme = {
  primary: '#3b82f6',
  secondary: '#64748b',
  background: '#ffffff',
  text: '#1f2937'
}
```

#### After (Enhanced Theme Structure)

```typescript
import type { EnhancedTheme } from '@/design-system/types/enhanced-theme'

const blueTheme: EnhancedTheme = {
  id: 'blue',
  name: 'Blue Theme',
  description: 'A professional blue theme',
  colorScheme: 'light',
  
  colors: {
    // Base colors
    'base-100': '#ffffff',
    'base-200': '#f8fafc',
    'base-300': '#f1f5f9',
    'base-content': '#1f2937',
    
    // Semantic colors with content pairs
    primary: '#3b82f6',
    'primary-content': '#ffffff',
    secondary: '#64748b',
    'secondary-content': '#ffffff',
    accent: '#0ea5e9',
    'accent-content': '#ffffff',
    neutral: '#374151',
    'neutral-content': '#ffffff',
    
    // Status colors
    info: '#0ea5e9',
    'info-content': '#ffffff',
    success: '#10b981',
    'success-content': '#ffffff',
    warning: '#f59e0b',
    'warning-content': '#ffffff',
    error: '#ef4444',
    'error-content': '#ffffff'
  },
  
  // Component-specific properties
  radius: {
    'radius-box': '0.75rem',      // Cards, modals, alerts
    'radius-field': '0.375rem',   // Buttons, inputs
    'radius-selector': '0.25rem'  // Checkboxes, badges
  },
  
  sizing: {
    'size-field': '2.5rem',       // Button/input height
    'size-selector': '1.25rem'    // Small controls
  },
  
  effects: {
    border: '1px solid #e2e8f0',
    depth: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  }
}
```

### 4. Update Theme Provider

#### Before

```tsx
import { ThemeProvider } from '@/contexts/theme-context'

function App() {
  return (
    <ThemeProvider themes={[blueTheme, redTheme]}>
      <YourApp />
    </ThemeProvider>
  )
}
```

#### After

```tsx
import { EnhancedThemeProvider } from '@/design-system/providers/enhanced-theme-provider'

function App() {
  return (
    <EnhancedThemeProvider 
      defaultTheme="blue"
      themes={[blueTheme, redTheme]}
      enableSystem
      storageKey="app-theme"
    >
      <YourApp />
    </EnhancedThemeProvider>
  )
}
```

### 5. Update Theme Usage in Components

#### Before (Direct Style Objects)

```tsx
function CustomComponent() {
  const { theme } = useTheme()
  
  return (
    <div 
      style={{
        backgroundColor: theme.primary,
        color: theme.text,
        borderRadius: '8px',
        padding: '16px'
      }}
    >
      Content
    </div>
  )
}
```

#### After (CSS Variables)

```tsx
function CustomComponent() {
  return (
    <div 
      style={{
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-primary-content)',
        borderRadius: 'var(--radius-box)',
        padding: 'var(--space-4)' // If spacing is defined
      }}
    >
      Content
    </div>
  )
}

// Or using Tailwind with arbitrary values
function CustomComponentTailwind() {
  return (
    <div className="bg-[var(--color-primary)] text-[var(--color-primary-content)] rounded-[var(--radius-box)] p-4">
      Content
    </div>
  )
}
```

### 6. Update Custom Styling

#### Before (Hardcoded Values)

```css
.custom-button {
  background-color: #3b82f6;
  color: white;
  border-radius: 6px;
  height: 40px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

#### After (Theme Variables)

```css
.custom-button {
  background-color: var(--color-primary);
  color: var(--color-primary-content);
  border-radius: var(--radius-field);
  height: var(--size-field);
  box-shadow: var(--depth);
}
```

## Automated Migration Tools

### 1. Component Import Replacer

Create a script to automatically update imports:

```bash
# Replace factory imports with shadcn/ui imports
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/createInteractiveComponent.*Button.*/import { Button } from "@\/components\/ui\/button"/g'
```

### 2. Theme Converter Script

```typescript
// scripts/convert-themes.ts
import type { EnhancedTheme } from '@/design-system/types/enhanced-theme'

interface OldTheme {
  primary: string
  secondary: string
  background: string
  text: string
}

function convertTheme(oldTheme: OldTheme, id: string, name: string): EnhancedTheme {
  return {
    id,
    name,
    description: `Converted from legacy ${name} theme`,
    colorScheme: 'light', // Adjust as needed
    
    colors: {
      'base-100': oldTheme.background,
      'base-200': lighten(oldTheme.background, 0.05),
      'base-300': lighten(oldTheme.background, 0.1),
      'base-content': oldTheme.text,
      
      primary: oldTheme.primary,
      'primary-content': getContrastColor(oldTheme.primary),
      secondary: oldTheme.secondary,
      'secondary-content': getContrastColor(oldTheme.secondary),
      
      // Generate other colors based on primary
      accent: adjustHue(oldTheme.primary, 30),
      'accent-content': getContrastColor(adjustHue(oldTheme.primary, 30)),
      neutral: '#374151',
      'neutral-content': '#ffffff',
      
      info: '#0ea5e9',
      'info-content': '#ffffff',
      success: '#10b981',
      'success-content': '#ffffff',
      warning: '#f59e0b',
      'warning-content': '#ffffff',
      error: '#ef4444',
      'error-content': '#ffffff'
    },
    
    radius: {
      'radius-box': '0.75rem',
      'radius-field': '0.375rem',
      'radius-selector': '0.25rem'
    },
    
    sizing: {
      'size-field': '2.5rem',
      'size-selector': '1.25rem'
    },
    
    effects: {
      border: '1px solid #e2e8f0',
      depth: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }
  }
}

// Helper functions (implement with color manipulation library)
function lighten(color: string, amount: number): string {
  // Implementation
  return color
}

function getContrastColor(color: string): string {
  // Return white or black based on color brightness
  return '#ffffff'
}

function adjustHue(color: string, degrees: number): string {
  // Implementation
  return color
}
```

## Step-by-Step Migration Process

### Phase 1: Setup Enhanced Theme System

1. **Install Dependencies** (if not already installed)
   ```bash
   npm install class-variance-authority clsx tailwind-merge
   ```

2. **Update Theme Provider**
   ```tsx
   // Replace old theme provider with EnhancedThemeProvider
   import { EnhancedThemeProvider } from '@/design-system/providers/enhanced-theme-provider'
   ```

3. **Convert Existing Themes**
   ```typescript
   // Use the converter script or manually convert themes
   const convertedThemes = oldThemes.map(theme => convertTheme(theme))
   ```

### Phase 2: Replace Core Components

1. **Replace Button Components**
   ```bash
   # Find and replace Button usage
   find src -name "*.tsx" | xargs grep -l "createInteractiveComponent.*Button"
   ```

2. **Replace Card Components**
   ```bash
   # Find and replace Card usage
   find src -name "*.tsx" | xargs grep -l "createLayoutComponent.*Card"
   ```

3. **Replace Form Components**
   ```bash
   # Find and replace Input, Select, etc.
   find src -name "*.tsx" | xargs grep -l "createFormComponent"
   ```

### Phase 3: Update Styling

1. **Replace Hardcoded Colors**
   ```bash
   # Find hardcoded colors and replace with CSS variables
   grep -r "bg-blue-500" src/ --include="*.tsx"
   ```

2. **Update Custom CSS**
   ```css
   /* Replace hardcoded values with CSS variables */
   .my-component {
     background-color: var(--color-primary);
     border-radius: var(--radius-field);
   }
   ```

### Phase 4: Testing and Validation

1. **Test Theme Switching**
   ```tsx
   // Ensure all components respond to theme changes
   const { setTheme } = useEnhancedTheme()
   setTheme('dark')
   ```

2. **Validate Accessibility**
   ```typescript
   // Check contrast ratios
   const { validateTheme } = useEnhancedTheme()
   const validation = validateTheme(myTheme)
   ```

3. **Performance Testing**
   ```typescript
   // Monitor performance
   import { debugPerformance } from '@/design-system/utils/theme-performance'
   debugPerformance.runPerformanceAnalysis()
   ```

### Phase 5: Cleanup

1. **Remove Factory System**
   ```bash
   # Remove factory component files
   rm -rf src/design-system/components/base
   ```

2. **Update Imports**
   ```bash
   # Remove unused imports
   npx eslint --fix src/
   ```

3. **Clean Dependencies**
   ```bash
   # Remove unused packages
   npm uninstall unused-packages
   ```

## Common Migration Issues

### Issue 1: Component Props Don't Match

**Problem**: Factory components had different props than shadcn/ui components.

**Solution**: Update prop usage according to shadcn/ui documentation.

```tsx
// Before
<Button variant="primary" size="large">Click me</Button>

// After (check shadcn/ui Button props)
<Button variant="default" size="lg">Click me</Button>
```

### Issue 2: Missing CSS Variables

**Problem**: Components don't respond to theme changes.

**Solution**: Ensure CSS variables are properly defined and used.

```css
/* Add missing CSS variables */
:root {
  --color-primary: #3b82f6;
  --radius-field: 0.375rem;
}
```

### Issue 3: Theme Validation Errors

**Problem**: Converted themes fail validation.

**Solution**: Ensure all required properties are present.

```typescript
// Check validation result
const validation = validateTheme(convertedTheme)
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors)
}
```

### Issue 4: Performance Degradation

**Problem**: Theme switching is slow after migration.

**Solution**: Use performance optimization features.

```typescript
// Preload critical themes
import { globalThemePreloader } from '@/design-system/utils/theme-performance'
await globalThemePreloader.preloadCriticalThemes(criticalThemes)
```

## Validation Checklist

- [ ] All factory components replaced with shadcn/ui equivalents
- [ ] Theme definitions follow EnhancedTheme interface
- [ ] CSS variables used instead of hardcoded values
- [ ] Theme switching works correctly
- [ ] All themes pass validation
- [ ] Performance is acceptable (< 100ms theme switch)
- [ ] Accessibility standards maintained
- [ ] No console errors or warnings
- [ ] Factory system code removed
- [ ] Documentation updated

## Post-Migration Optimization

### 1. Performance Tuning

```typescript
// Monitor and optimize performance
import { useThemePerformance } from '@/hooks/use-theme-performance'

const { metrics, optimizePerformance } = useThemePerformance()

// Optimize if needed
if (metrics.themeSwitch.avg > 100) {
  optimizePerformance()
}
```

### 2. Bundle Size Optimization

```typescript
// Track usage and optimize bundle
import { BundleSizeOptimizer } from '@/design-system/utils/theme-performance'

const report = BundleSizeOptimizer.generateOptimizationReport()
console.log('Optimization recommendations:', report.recommendations)
```

### 3. Theme Variants

```typescript
// Add theme variants for better UX
const variants = [
  { id: 'rounded', name: 'Rounded' },
  { id: 'compact', name: 'Compact' }
]

// Apply variants
const { applyThemeVariants } = useEnhancedTheme()
await applyThemeVariants(['rounded', 'compact'])
```

This migration guide provides a comprehensive approach to transitioning from the factory system to the Enhanced Theme System while maintaining functionality and improving performance.
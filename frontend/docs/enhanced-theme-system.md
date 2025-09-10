# Enhanced Theme System Documentation

## Overview

The Enhanced Theme System provides comprehensive theme control over component properties like border radius, sizing, spacing, shadows, and colors while maintaining shadcn/ui as the reliable foundation. It implements DaisyUI-style theming capabilities with advanced performance optimizations.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Theme Configuration](#theme-configuration)
3. [CSS Variables](#css-variables)
4. [Theme Variants](#theme-variants)
5. [Performance Optimization](#performance-optimization)
6. [Migration Guide](#migration-guide)
7. [API Reference](#api-reference)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Getting Started

### Installation

The Enhanced Theme System is built into the design system. No additional installation is required.

### Basic Usage

```tsx
import { EnhancedThemeProvider, useEnhancedTheme } from '@/design-system/providers/enhanced-theme-provider'

// Wrap your app with the theme provider
function App() {
  return (
    <EnhancedThemeProvider defaultTheme="base" enableSystem>
      <YourApp />
    </EnhancedThemeProvider>
  )
}

// Use the theme in components
function ThemeToggle() {
  const { theme, setTheme, themes } = useEnhancedTheme()
  
  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      {themes.map(t => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
    </select>
  )
}
```

## Theme Configuration

### Theme Structure

Themes follow the `EnhancedTheme` interface:

```typescript
interface EnhancedTheme {
  id: string
  name: string
  description: string
  colorScheme: 'light' | 'dark'
  
  colors: {
    // Base surface colors
    'base-100': string      // Main background
    'base-200': string      // Secondary background  
    'base-300': string      // Tertiary background
    'base-content': string  // Text on base colors
    
    // Semantic colors
    primary: string
    'primary-content': string
    secondary: string
    'secondary-content': string
    accent: string
    'accent-content': string
    neutral: string
    'neutral-content': string
    
    // Status colors
    info: string
    'info-content': string
    success: string
    'success-content': string
    warning: string
    'warning-content': string
    error: string
    'error-content': string
  }
  
  radius: {
    'radius-box': string      // Cards, modals, alerts
    'radius-field': string    // Buttons, inputs, selects
    'radius-selector': string // Checkboxes, toggles, badges
  }
  
  sizing: {
    'size-field': string      // Button/input height base
    'size-selector': string   // Small controls size
  }
  
  effects: {
    border: string           // Border style/width
    depth: string           // Shadow intensity
    noise?: string          // Optional texture/pattern
  }
}
```

### Creating Custom Themes

```typescript
const customTheme: EnhancedTheme = {
  id: 'custom-blue',
  name: 'Custom Blue',
  description: 'A custom blue theme with rounded corners',
  colorScheme: 'light',
  
  colors: {
    'base-100': '#ffffff',
    'base-200': '#f8fafc',
    'base-300': '#f1f5f9',
    'base-content': '#0f172a',
    
    primary: '#3b82f6',
    'primary-content': '#ffffff',
    secondary: '#64748b',
    'secondary-content': '#ffffff',
    
    // ... other colors
  },
  
  radius: {
    'radius-box': '1rem',
    'radius-field': '0.75rem',
    'radius-selector': '9999px'
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
```

## CSS Variables

The theme system uses CSS variables that follow DaisyUI naming conventions:

### Color Variables

```css
/* Base colors */
--color-base-100: #ffffff;
--color-base-200: #f8fafc;
--color-base-300: #f1f5f9;
--color-base-content: #0f172a;

/* Semantic colors */
--color-primary: #3b82f6;
--color-primary-content: #ffffff;
--color-secondary: #64748b;
--color-secondary-content: #ffffff;

/* Status colors */
--color-success: #10b981;
--color-success-content: #ffffff;
--color-warning: #f59e0b;
--color-warning-content: #ffffff;
--color-error: #ef4444;
--color-error-content: #ffffff;
```

### Component Variables

```css
/* Radius variables */
--radius-box: 0.75rem;      /* Cards, modals, alerts */
--radius-field: 0.375rem;   /* Buttons, inputs, selects */
--radius-selector: 0.25rem; /* Checkboxes, toggles, badges */

/* Sizing variables */
--size-field: 2.5rem;       /* Button/input height */
--size-selector: 1.25rem;   /* Small controls size */

/* Effect variables */
--border: 1px solid #e2e8f0;
--depth: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
```

### Using CSS Variables in Components

```tsx
// In component styles
const buttonStyles = {
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-primary-content)',
  borderRadius: 'var(--radius-field)',
  height: 'var(--size-field)',
  boxShadow: 'var(--depth)'
}

// In Tailwind classes (using arbitrary values)
<button className="bg-[var(--color-primary)] text-[var(--color-primary-content)] rounded-[var(--radius-field)]">
  Button
</button>
```

## Theme Variants

Theme variants allow you to modify existing themes with predefined adjustments:

### Available Variants

- **rounded**: Large border radius for friendly appearance
- **sharp**: Minimal border radius for professional look
- **compact**: Smaller sizing for dense layouts
- **spacious**: Larger sizing for comfortable layouts
- **minimal**: Reduced shadows and subtle borders
- **rich**: Prominent shadows and enhanced visual depth

### Applying Variants

```tsx
const { applyThemeVariant, applyThemeVariants } = useEnhancedTheme()

// Apply single variant
applyThemeVariant(roundedVariant)

// Apply multiple variants
applyThemeVariants(['rounded', 'compact'])
```

### Creating Custom Variants

```typescript
const customVariant: ThemeVariant = {
  id: 'extra-rounded',
  name: 'Extra Rounded',
  description: 'Even more rounded corners',
  modifiers: {
    radius: {
      'radius-box': '2rem',
      'radius-field': '1.5rem',
      'radius-selector': '9999px'
    }
  }
}
```

## Performance Optimization

The theme system includes several performance optimizations:

### Caching

- **CSS Variable Cache**: Caches computed theme variables with LRU eviction
- **Theme Preloading**: Preloads frequently used themes for faster switching
- **Bundle Optimization**: Tracks usage and optimizes bundle size

### Monitoring Performance

```tsx
import { useThemePerformance } from '@/hooks/use-theme-performance'

function PerformanceMonitor() {
  const { 
    metrics, 
    cacheInfo, 
    startMonitoring, 
    getPerformanceReport 
  } = useThemePerformance({
    enableLogging: true,
    logInterval: 10000
  })
  
  return (
    <div>
      <button onClick={startMonitoring}>Start Monitoring</button>
      <pre>{getPerformanceReport()}</pre>
    </div>
  )
}
```

### Performance Best Practices

1. **Preload Critical Themes**: Use `globalThemePreloader.preloadCriticalThemes()`
2. **Monitor Cache Efficiency**: Check cache hit rates regularly
3. **Optimize Bundle Size**: Remove unused themes in production
4. **Use Variants Wisely**: Combine variants instead of creating new themes

## Migration Guide

### From Factory System to Enhanced Themes

#### Before (Factory System)

```tsx
import { createInteractiveComponent } from '@/design-system/components/base'

const Button = createInteractiveComponent('Button', {
  variants: {
    primary: 'bg-blue-500 text-white'
  }
})
```

#### After (Enhanced Themes)

```tsx
import { Button } from '@/components/ui/button'

// Button automatically uses theme variables
<Button variant="primary">Click me</Button>
```

#### Component Mapping

| Factory Component | shadcn/ui Equivalent | Notes |
|------------------|---------------------|-------|
| `createInteractiveComponent('Button')` | `@/components/ui/button` | Uses `--color-primary`, `--radius-field` |
| `createLayoutComponent('Card')` | `@/components/ui/card` | Uses `--radius-box`, `--depth` |
| `createFormComponent('Input')` | `@/components/ui/input` | Uses `--radius-field`, `--size-field` |

### Updating Existing Themes

```typescript
// Old theme format
const oldTheme = {
  colors: {
    primary: '#3b82f6',
    background: '#ffffff'
  }
}

// New enhanced theme format
const newTheme: EnhancedTheme = {
  id: 'migrated-theme',
  name: 'Migrated Theme',
  description: 'Migrated from old format',
  colorScheme: 'light',
  
  colors: {
    primary: '#3b82f6',
    'primary-content': '#ffffff',
    'base-100': '#ffffff',
    'base-content': '#0f172a',
    // ... other required colors
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
```

## API Reference

### EnhancedThemeProvider

```tsx
interface EnhancedThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: string
  storageKey?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
  themes?: EnhancedTheme[]
  variants?: ThemeVariant[]
}
```

### useEnhancedTheme Hook

```typescript
interface ThemeContextType {
  theme: string
  themes: EnhancedTheme[]
  setTheme: (theme: string) => void
  systemTheme: 'light' | 'dark'
  resolvedTheme: string
  getThemeVariable: (variable: keyof ThemeCSSVariables) => string
  applyThemeVariant: (variant: ThemeVariant) => void
  applyThemeVariants: (variantIds: string[]) => Promise<void>
  resetToDefault: () => void
  validateTheme: (theme: EnhancedTheme) => ThemeValidationResult
}
```

### Performance Utilities

```typescript
// Global instances
import { 
  globalThemeApplier,
  globalThemePreloader,
  debugPerformance,
  BundleSizeOptimizer
} from '@/design-system/utils/theme-performance'

// Preload themes
await globalThemePreloader.preloadCriticalThemes(themes)

// Debug performance
debugPerformance.runPerformanceAnalysis()

// Optimize bundle
const report = BundleSizeOptimizer.generateOptimizationReport()
```

## Best Practices

### Theme Design

1. **Consistent Color Pairs**: Always define content colors for semantic colors
2. **Accessible Contrast**: Ensure WCAG AA compliance (4.5:1 contrast ratio)
3. **Semantic Naming**: Use semantic color names instead of specific colors
4. **Component-Specific Radius**: Use appropriate radius variables for different component types

### Performance

1. **Preload Critical Themes**: Preload the 3-5 most commonly used themes
2. **Monitor Cache Efficiency**: Aim for >70% cache hit rate
3. **Batch Updates**: Use `applyThemeVariants` for multiple changes
4. **Optimize Bundle**: Remove unused themes in production builds

### Development

1. **Use TypeScript**: Leverage full type safety for theme definitions
2. **Validate Themes**: Use built-in validation for theme consistency
3. **Monitor Performance**: Use development tools to track performance
4. **Test Across Themes**: Ensure components work with all themes

## Troubleshooting

### Common Issues

#### Theme Not Applying

```typescript
// Check if theme exists
const { themes } = useEnhancedTheme()
const themeExists = themes.find(t => t.id === 'my-theme')

// Validate theme
const { validateTheme } = useEnhancedTheme()
const validation = validateTheme(myTheme)
if (!validation.isValid) {
  console.error('Theme validation failed:', validation.errors)
}
```

#### Performance Issues

```typescript
// Check cache efficiency
import { debugPerformance } from '@/design-system/utils/theme-performance'

debugPerformance.runPerformanceAnalysis()

// Optimize performance
globalThemeApplier.optimizePerformance()
```

#### CSS Variables Not Working

```css
/* Ensure CSS variables are properly defined */
:root {
  --color-primary: #3b82f6;
  --radius-field: 0.375rem;
}

/* Use fallback values */
.my-component {
  background-color: var(--color-primary, #3b82f6);
  border-radius: var(--radius-field, 0.375rem);
}
```

### Debug Tools

```typescript
// Performance debugging
import { debugPerformance } from '@/design-system/utils/theme-performance'

// Log all performance info
debugPerformance.runPerformanceAnalysis()

// Benchmark theme switching
const benchmark = await debugPerformance.benchmarkThemeSwitching(themes)

// Clear all caches
debugPerformance.clearAll()
```

### Development Mode Features

The theme system includes several development-only features:

- **Performance Monitor**: Visual performance monitoring component
- **Theme Validation**: Runtime theme validation with detailed error messages
- **Cache Debugging**: Detailed cache information and efficiency metrics
- **Bundle Analysis**: Usage tracking and optimization recommendations

## Examples

### Complete Theme Definition

```typescript
export const corporateTheme: EnhancedTheme = {
  id: 'corporate',
  name: 'Corporate',
  description: 'Professional corporate theme with subtle shadows',
  colorScheme: 'light',
  
  colors: {
    'base-100': '#ffffff',
    'base-200': '#f8fafc',
    'base-300': '#f1f5f9',
    'base-content': '#1e293b',
    
    primary: '#1e40af',
    'primary-content': '#ffffff',
    secondary: '#64748b',
    'secondary-content': '#ffffff',
    accent: '#0ea5e9',
    'accent-content': '#ffffff',
    neutral: '#374151',
    'neutral-content': '#ffffff',
    
    info: '#0ea5e9',
    'info-content': '#ffffff',
    success: '#059669',
    'success-content': '#ffffff',
    warning: '#d97706',
    'warning-content': '#ffffff',
    error: '#dc2626',
    'error-content': '#ffffff'
  },
  
  radius: {
    'radius-box': '0.5rem',
    'radius-field': '0.25rem',
    'radius-selector': '0.125rem'
  },
  
  sizing: {
    'size-field': '2.5rem',
    'size-selector': '1.25rem'
  },
  
  effects: {
    border: '1px solid #e2e8f0',
    depth: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    noise: 'none'
  }
}
```

### Theme Switching Component

```tsx
import { useEnhancedTheme } from '@/design-system/providers/enhanced-theme-provider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function ThemeSwitcher() {
  const { theme, themes, setTheme, applyThemeVariants } = useEnhancedTheme()
  
  const handleVariantToggle = async (variantId: string) => {
    await applyThemeVariants([variantId])
  }
  
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Theme</label>
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {themes.map(t => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium">Variants</label>
        <div className="flex gap-2 mt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleVariantToggle('rounded')}
          >
            Rounded
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleVariantToggle('compact')}
          >
            Compact
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleVariantToggle('minimal')}
          >
            Minimal
          </Button>
        </div>
      </div>
    </div>
  )
}
```

This documentation provides comprehensive coverage of the Enhanced Theme System, from basic usage to advanced performance optimization and troubleshooting.
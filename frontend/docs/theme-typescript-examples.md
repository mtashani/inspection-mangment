# TypeScript Examples and Best Practices

## Overview

This document provides comprehensive TypeScript examples and best practices for working with the Enhanced Theme System.

## Type Definitions

### Core Theme Types

```typescript
// Enhanced Theme Interface
interface EnhancedTheme {
  id: string
  name: string
  description: string
  colorScheme: 'light' | 'dark'
  colors: ThemeColors
  radius: ThemeRadius
  sizing: ThemeSizing
  effects: ThemeEffects
  spacing?: ThemeSpacing
  typography?: ThemeTypography
}

// Theme Colors with semantic naming
interface ThemeColors {
  // Base surface colors
  'base-100': string      // Main background
  'base-200': string      // Secondary background  
  'base-300': string      // Tertiary background
  'base-content': string  // Text on base colors
  
  // Semantic colors with content pairs
  primary: string
  'primary-content': string
  secondary: string
  'secondary-content': string
  accent: string
  'accent-content': string
  neutral: string
  'neutral-content': string
  
  // Status colors with content pairs
  info: string
  'info-content': string
  success: string
  'success-content': string
  warning: string
  'warning-content': string
  error: string
  'error-content': string
}

// Component-specific radius values
interface ThemeRadius {
  'radius-box': string      // Cards, modals, alerts
  'radius-field': string    // Buttons, inputs, selects
  'radius-selector': string // Checkboxes, toggles, badges
}

// Component sizing
interface ThemeSizing {
  'size-field': string      // Button/input height base
  'size-selector': string   // Small controls size
}

// Visual effects
interface ThemeEffects {
  border: string           // Border style/width
  depth: string           // Shadow intensity
  noise?: string          // Optional texture/pattern
}

// Optional spacing system
interface ThemeSpacing {
  'space-xs': string
  'space-sm': string
  'space-md': string
  'space-lg': string
  'space-xl': string
}

// Optional typography system
interface ThemeTypography {
  'font-size-xs': string
  'font-size-sm': string
  'font-size-base': string
  'font-size-lg': string
  'font-size-xl': string
  'font-weight-normal': string
  'font-weight-medium': string
  'font-weight-bold': string
}
```

### CSS Variables Type

```typescript
// CSS Variables mapping
interface ThemeCSSVariables {
  // Color variables
  '--color-base-100': string
  '--color-base-200': string
  '--color-base-300': string
  '--color-base-content': string
  '--color-primary': string
  '--color-primary-content': string
  '--color-secondary': string
  '--color-secondary-content': string
  '--color-accent': string
  '--color-accent-content': string
  '--color-neutral': string
  '--color-neutral-content': string
  '--color-info': string
  '--color-info-content': string
  '--color-success': string
  '--color-success-content': string
  '--color-warning': string
  '--color-warning-content': string
  '--color-error': string
  '--color-error-content': string
  
  // Component radius variables
  '--radius-box': string
  '--radius-field': string
  '--radius-selector': string
  
  // Sizing variables
  '--size-field': string
  '--size-selector': string
  
  // Effect variables
  '--border': string
  '--depth': string
  '--noise'?: string
}

// Type-safe CSS variable keys
type CSSVariableKey = keyof ThemeCSSVariables
```

### Theme Variant Types

```typescript
// Theme variant definition
interface ThemeVariant {
  id: string
  name: string
  description: string
  category: 'radius' | 'sizing' | 'effects' | 'mixed'
  modifiers: Partial<EnhancedTheme>
}

// Categorized theme variant for conflict resolution
interface CategorizedThemeVariant {
  id: string
  name: string
  description: string
  category: 'radius' | 'sizing' | 'effects'
  priority: number
  tokens: Record<string, string>
}

// Variant application result
interface VariantApplicationResult {
  success: boolean
  resultingTheme?: EnhancedTheme
  appliedVariants: string[]
  resolvedConflicts?: ConflictResolution[]
  errors?: string[]
}

// Conflict resolution information
interface ConflictResolution {
  property: string
  conflictingVariants: string[]
  resolvedValue: string
  reason: string
}
```

### Validation Types

```typescript
// Theme validation result
interface ThemeValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Validation rule
interface ValidationRule {
  name: string
  validate: (theme: EnhancedTheme) => ValidationResult
}

interface ValidationResult {
  isValid: boolean
  message?: string
}
```

## Creating Type-Safe Themes

### Basic Theme Creation

```typescript
import type { EnhancedTheme } from '@/design-system/types/enhanced-theme'

// Type-safe theme definition
const corporateTheme: EnhancedTheme = {
  id: 'corporate',
  name: 'Corporate',
  description: 'Professional corporate theme',
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
    depth: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  }
}
```

### Theme Builder Pattern

```typescript
// Theme builder for type-safe theme construction
class ThemeBuilder {
  private theme: Partial<EnhancedTheme> = {}
  
  constructor(id: string, name: string) {
    this.theme.id = id
    this.theme.name = name
  }
  
  description(desc: string): this {
    this.theme.description = desc
    return this
  }
  
  colorScheme(scheme: 'light' | 'dark'): this {
    this.theme.colorScheme = scheme
    return this
  }
  
  colors(colors: ThemeColors): this {
    this.theme.colors = colors
    return this
  }
  
  radius(radius: ThemeRadius): this {
    this.theme.radius = radius
    return this
  }
  
  sizing(sizing: ThemeSizing): this {
    this.theme.sizing = sizing
    return this
  }
  
  effects(effects: ThemeEffects): this {
    this.theme.effects = effects
    return this
  }
  
  spacing(spacing: ThemeSpacing): this {
    this.theme.spacing = spacing
    return this
  }
  
  typography(typography: ThemeTypography): this {
    this.theme.typography = typography
    return this
  }
  
  build(): EnhancedTheme {
    // Validate required properties
    if (!this.theme.id || !this.theme.name || !this.theme.colors || 
        !this.theme.radius || !this.theme.sizing || !this.theme.effects) {
      throw new Error('Missing required theme properties')
    }
    
    return this.theme as EnhancedTheme
  }
}

// Usage
const modernTheme = new ThemeBuilder('modern', 'Modern Theme')
  .description('A modern, clean theme with rounded corners')
  .colorScheme('light')
  .colors({
    'base-100': '#ffffff',
    'base-200': '#f8fafc',
    // ... other colors
  })
  .radius({
    'radius-box': '1rem',
    'radius-field': '0.75rem',
    'radius-selector': '9999px'
  })
  .sizing({
    'size-field': '2.75rem',
    'size-selector': '1.5rem'
  })
  .effects({
    border: '1px solid #e2e8f0',
    depth: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  })
  .build()
```

### Color Palette Generator

```typescript
// Type-safe color palette generator
interface ColorPalette {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
  950: string
}

class ColorPaletteGenerator {
  static generatePalette(baseColor: string): ColorPalette {
    // Implementation would use color manipulation library
    return {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: baseColor,
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49'
    }
  }
  
  static createThemeColors(
    primary: string,
    secondary: string,
    accent: string
  ): ThemeColors {
    const primaryPalette = this.generatePalette(primary)
    const secondaryPalette = this.generatePalette(secondary)
    const accentPalette = this.generatePalette(accent)
    
    return {
      'base-100': '#ffffff',
      'base-200': '#f8fafc',
      'base-300': '#f1f5f9',
      'base-content': '#1e293b',
      
      primary: primaryPalette[500],
      'primary-content': primaryPalette[50],
      secondary: secondaryPalette[500],
      'secondary-content': secondaryPalette[50],
      accent: accentPalette[500],
      'accent-content': accentPalette[50],
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
    }
  }
}
```

## Type-Safe Theme Variants

### Creating Variants

```typescript
// Type-safe variant creation
const roundedVariant: ThemeVariant = {
  id: 'rounded',
  name: 'Rounded',
  description: 'Large border radius for friendly appearance',
  category: 'radius',
  modifiers: {
    radius: {
      'radius-box': '1rem',
      'radius-field': '0.75rem',
      'radius-selector': '9999px'
    }
  }
}

const compactVariant: ThemeVariant = {
  id: 'compact',
  name: 'Compact',
  description: 'Smaller sizing for dense layouts',
  category: 'sizing',
  modifiers: {
    sizing: {
      'size-field': '2rem',
      'size-selector': '1rem'
    }
  }
}

// Variant factory with type safety
class VariantFactory {
  static createRadiusVariant(
    id: string,
    name: string,
    radius: ThemeRadius
  ): ThemeVariant {
    return {
      id,
      name,
      description: `${name} radius variant`,
      category: 'radius',
      modifiers: { radius }
    }
  }
  
  static createSizingVariant(
    id: string,
    name: string,
    sizing: ThemeSizing
  ): ThemeVariant {
    return {
      id,
      name,
      description: `${name} sizing variant`,
      category: 'sizing',
      modifiers: { sizing }
    }
  }
  
  static createEffectsVariant(
    id: string,
    name: string,
    effects: ThemeEffects
  ): ThemeVariant {
    return {
      id,
      name,
      description: `${name} effects variant`,
      category: 'effects',
      modifiers: { effects }
    }
  }
}

// Usage
const extraRoundedVariant = VariantFactory.createRadiusVariant(
  'extra-rounded',
  'Extra Rounded',
  {
    'radius-box': '2rem',
    'radius-field': '1.5rem',
    'radius-selector': '9999px'
  }
)
```

## Type-Safe Component Usage

### Using Theme Context

```typescript
import { useEnhancedTheme } from '@/design-system/providers/enhanced-theme-provider'
import type { EnhancedTheme, ThemeVariant } from '@/design-system/types/enhanced-theme'

function ThemeControls() {
  const {
    theme,
    themes,
    setTheme,
    getThemeVariable,
    applyThemeVariant,
    validateTheme
  } = useEnhancedTheme()
  
  // Type-safe theme switching
  const handleThemeChange = (themeId: string) => {
    const selectedTheme = themes.find(t => t.id === themeId)
    if (selectedTheme) {
      setTheme(themeId)
    }
  }
  
  // Type-safe CSS variable access
  const primaryColor = getThemeVariable('--color-primary')
  const fieldRadius = getThemeVariable('--radius-field')
  
  // Type-safe variant application
  const handleVariantApply = (variant: ThemeVariant) => {
    applyThemeVariant(variant)
  }
  
  // Type-safe theme validation
  const handleThemeValidation = (theme: EnhancedTheme) => {
    const validation = validateTheme(theme)
    if (!validation.isValid) {
      console.error('Theme validation failed:', validation.errors)
    }
  }
  
  return (
    <div>
      <select value={theme} onChange={(e) => handleThemeChange(e.target.value)}>
        {themes.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      
      <div style={{ 
        backgroundColor: primaryColor,
        borderRadius: fieldRadius 
      }}>
        Themed content
      </div>
    </div>
  )
}
```

### Custom Hook with Type Safety

```typescript
// Custom hook for theme-aware styling
function useThemeStyles() {
  const { getThemeVariable } = useEnhancedTheme()
  
  // Type-safe style object creation
  const createStyles = <T extends Record<string, React.CSSProperties>>(
    styleFactory: (getVar: (key: CSSVariableKey) => string) => T
  ): T => {
    return styleFactory(getThemeVariable)
  }
  
  return { createStyles }
}

// Usage
function StyledComponent() {
  const { createStyles } = useThemeStyles()
  
  const styles = createStyles((getVar) => ({
    container: {
      backgroundColor: getVar('--color-base-100'),
      color: getVar('--color-base-content'),
      borderRadius: getVar('--radius-box'),
      padding: '1rem',
      boxShadow: getVar('--depth')
    },
    button: {
      backgroundColor: getVar('--color-primary'),
      color: getVar('--color-primary-content'),
      borderRadius: getVar('--radius-field'),
      height: getVar('--size-field'),
      border: 'none',
      cursor: 'pointer'
    }
  }))
  
  return (
    <div style={styles.container}>
      <button style={styles.button}>
        Themed Button
      </button>
    </div>
  )
}
```

## Advanced Type Patterns

### Theme Composition

```typescript
// Compose themes from base themes
type ThemeComposition = {
  base: EnhancedTheme
  variants: ThemeVariant[]
}

class ThemeComposer {
  static compose(composition: ThemeComposition): EnhancedTheme {
    let composedTheme = { ...composition.base }
    
    composition.variants.forEach(variant => {
      if (variant.modifiers.colors) {
        composedTheme.colors = { ...composedTheme.colors, ...variant.modifiers.colors }
      }
      if (variant.modifiers.radius) {
        composedTheme.radius = { ...composedTheme.radius, ...variant.modifiers.radius }
      }
      if (variant.modifiers.sizing) {
        composedTheme.sizing = { ...composedTheme.sizing, ...variant.modifiers.sizing }
      }
      if (variant.modifiers.effects) {
        composedTheme.effects = { ...composedTheme.effects, ...variant.modifiers.effects }
      }
    })
    
    return composedTheme
  }
}

// Usage
const composedTheme = ThemeComposer.compose({
  base: corporateTheme,
  variants: [roundedVariant, compactVariant]
})
```

### Generic Theme Utilities

```typescript
// Generic utility for theme property access
function getThemeProperty<T extends keyof EnhancedTheme>(
  theme: EnhancedTheme,
  property: T
): EnhancedTheme[T] {
  return theme[property]
}

// Generic utility for safe property updates
function updateThemeProperty<T extends keyof EnhancedTheme>(
  theme: EnhancedTheme,
  property: T,
  value: EnhancedTheme[T]
): EnhancedTheme {
  return {
    ...theme,
    [property]: value
  }
}

// Usage
const themeColors = getThemeProperty(corporateTheme, 'colors')
const updatedTheme = updateThemeProperty(corporateTheme, 'radius', {
  'radius-box': '2rem',
  'radius-field': '1rem',
  'radius-selector': '0.5rem'
})
```

### Type Guards

```typescript
// Type guards for theme validation
function isValidTheme(obj: unknown): obj is EnhancedTheme {
  if (typeof obj !== 'object' || obj === null) return false
  
  const theme = obj as Partial<EnhancedTheme>
  
  return (
    typeof theme.id === 'string' &&
    typeof theme.name === 'string' &&
    typeof theme.description === 'string' &&
    (theme.colorScheme === 'light' || theme.colorScheme === 'dark') &&
    isValidThemeColors(theme.colors) &&
    isValidThemeRadius(theme.radius) &&
    isValidThemeSizing(theme.sizing) &&
    isValidThemeEffects(theme.effects)
  )
}

function isValidThemeColors(obj: unknown): obj is ThemeColors {
  if (typeof obj !== 'object' || obj === null) return false
  
  const colors = obj as Partial<ThemeColors>
  const requiredColors: (keyof ThemeColors)[] = [
    'base-100', 'base-200', 'base-300', 'base-content',
    'primary', 'primary-content',
    'secondary', 'secondary-content',
    'accent', 'accent-content',
    'neutral', 'neutral-content',
    'info', 'info-content',
    'success', 'success-content',
    'warning', 'warning-content',
    'error', 'error-content'
  ]
  
  return requiredColors.every(color => typeof colors[color] === 'string')
}

function isValidThemeRadius(obj: unknown): obj is ThemeRadius {
  if (typeof obj !== 'object' || obj === null) return false
  
  const radius = obj as Partial<ThemeRadius>
  return (
    typeof radius['radius-box'] === 'string' &&
    typeof radius['radius-field'] === 'string' &&
    typeof radius['radius-selector'] === 'string'
  )
}

function isValidThemeSizing(obj: unknown): obj is ThemeSizing {
  if (typeof obj !== 'object' || obj === null) return false
  
  const sizing = obj as Partial<ThemeSizing>
  return (
    typeof sizing['size-field'] === 'string' &&
    typeof sizing['size-selector'] === 'string'
  )
}

function isValidThemeEffects(obj: unknown): obj is ThemeEffects {
  if (typeof obj !== 'object' || obj === null) return false
  
  const effects = obj as Partial<ThemeEffects>
  return (
    typeof effects.border === 'string' &&
    typeof effects.depth === 'string' &&
    (effects.noise === undefined || typeof effects.noise === 'string')
  )
}
```

## Performance-Aware Types

### Performance Monitoring Types

```typescript
// Performance metrics with type safety
interface ThemePerformanceMetrics {
  themeSwitch: PerformanceMetric
  variantApply: PerformanceMetric
  cssUpdate: PerformanceMetric
}

interface PerformanceMetric {
  avg: number
  min: number
  max: number
  count: number
}

interface ThemeCacheInfo {
  themeCount: number
  styleCount: number
  totalSize: number
  hitRate: number
}

// Performance hook with full type safety
function useThemePerformance(): {
  metrics: ThemePerformanceMetrics
  cacheInfo: ThemeCacheInfo
  startMonitoring: () => void
  stopMonitoring: () => void
  getReport: () => string
} {
  // Implementation
  return {} as any
}
```

## Best Practices

### 1. Always Use Type Annotations

```typescript
// Good: Explicit type annotation
const myTheme: EnhancedTheme = {
  // ... theme definition
}

// Bad: Implicit typing
const myTheme = {
  // ... theme definition
}
```

### 2. Use Type Guards for Runtime Safety

```typescript
// Good: Type guard for external data
function loadThemeFromAPI(data: unknown): EnhancedTheme | null {
  if (isValidTheme(data)) {
    return data
  }
  return null
}

// Bad: Unsafe type assertion
function loadThemeFromAPI(data: unknown): EnhancedTheme {
  return data as EnhancedTheme
}
```

### 3. Leverage Generic Utilities

```typescript
// Good: Generic utility for type safety
function createThemeVariant<T extends keyof EnhancedTheme>(
  property: T,
  value: EnhancedTheme[T]
): ThemeVariant {
  return {
    id: `custom-${property}`,
    name: `Custom ${property}`,
    description: `Custom ${property} variant`,
    category: 'mixed',
    modifiers: { [property]: value }
  }
}

// Usage with full type safety
const radiusVariant = createThemeVariant('radius', {
  'radius-box': '2rem',
  'radius-field': '1rem',
  'radius-selector': '0.5rem'
})
```

### 4. Use Branded Types for CSS Variables

```typescript
// Branded type for CSS variable values
type CSSValue = string & { __brand: 'CSSValue' }

function createCSSValue(value: string): CSSValue {
  // Validate CSS value format
  if (!/^[\w\s\-\(\)\.,%#]+$/.test(value)) {
    throw new Error(`Invalid CSS value: ${value}`)
  }
  return value as CSSValue
}

// Usage
const primaryColor: CSSValue = createCSSValue('#3b82f6')
const invalidColor = createCSSValue('invalid-color') // Throws error
```

This comprehensive TypeScript guide ensures type safety throughout the Enhanced Theme System while providing practical examples and best practices for developers.
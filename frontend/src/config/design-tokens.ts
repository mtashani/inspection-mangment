/**
 * Design System Tokens - Simplified and Consistent
 * Based on the design system guidelines
 */

// Typography Scale (4 levels only)
export const typography = {
  title: 'text-2xl font-semibold',
  heading: 'text-xl font-medium', 
  body: 'text-base',
  small: 'text-sm text-muted-foreground'
} as const

// Spacing Scale (4px/8px increments only)
export const spacing = {
  xs: '4px',   // 1
  sm: '8px',   // 2  
  md: '16px',  // 4
  lg: '24px'   // 6
} as const

// Component Variants
export const components = {
  card: {
    base: 'rounded-2xl shadow-md bg-card text-card-foreground p-4',
    hover: 'hover:shadow-lg transition-shadow duration-200'
  },
  
  button: {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    success: 'bg-success text-success-foreground hover:bg-success/90',
    warning: 'bg-warning text-warning-foreground hover:bg-warning/90',
    error: 'bg-error text-error-foreground hover:bg-error/90',
    sizes: {
      sm: 'h-8 px-3 text-sm',
      default: 'h-10 px-4',
      lg: 'h-12 px-6 text-lg'
    }
  },
  
  container: 'container mx-auto max-w-screen-xl',
  
  gap: 'gap-4' // 16px consistent gap
} as const

// Animation Settings
export const animations = {
  duration: '200ms',
  easing: 'ease-in-out',
  hover: 'transition-all duration-200 ease-in-out'
} as const

// Icon Sizes (4 levels only)
export const iconSizes = {
  xs: 12,
  sm: 16, 
  md: 20,
  lg: 24
} as const
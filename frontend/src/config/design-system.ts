/**
 * Enhanced Design System Configuration
 * This file manages all design tokens for the project with multiple color schemes
 */

// Color scheme definitions with beautiful palettes
export const colorSchemes = {
  blue: {
    light: {
      50: '#eff6ff',
      100: '#dbeafe', 
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a'
    },
    dark: {
      50: '#1e3a8a',
      100: '#1e40af',
      200: '#1d4ed8',
      300: '#2563eb',
      400: '#3b82f6',
      500: '#60a5fa',
      600: '#93c5fd',
      700: '#bfdbfe',
      800: '#dbeafe',
      900: '#eff6ff'
    }
  },
  green: {
    light: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d'
    },
    dark: {
      50: '#14532d',
      100: '#166534',
      200: '#15803d',
      300: '#16a34a',
      400: '#22c55e',
      500: '#4ade80',
      600: '#86efac',
      700: '#bbf7d0',
      800: '#dcfce7',
      900: '#f0fdf4'
    }
  },
  purple: {
    light: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87'
    },
    dark: {
      50: '#581c87',
      100: '#6b21a8',
      200: '#7c3aed',
      300: '#9333ea',
      400: '#a855f7',
      500: '#c084fc',
      600: '#d8b4fe',
      700: '#e9d5ff',
      800: '#f3e8ff',
      900: '#faf5ff'
    }
  },
  orange: {
    light: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12'
    },
    dark: {
      50: '#7c2d12',
      100: '#9a3412',
      200: '#c2410c',
      300: '#ea580c',
      400: '#f97316',
      500: '#fb923c',
      600: '#fdba74',
      700: '#fed7aa',
      800: '#ffedd5',
      900: '#fff7ed'
    }
  },
  red: {
    light: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d'
    },
    dark: {
      50: '#7f1d1d',
      100: '#991b1b',
      200: '#b91c1c',
      300: '#dc2626',
      400: '#ef4444',
      500: '#f87171',
      600: '#fca5a5',
      700: '#fecaca',
      800: '#fee2e2',
      900: '#fef2f2'
    }
  },
  teal: {
    light: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a'
    },
    dark: {
      50: '#134e4a',
      100: '#115e59',
      200: '#0f766e',
      300: '#0d9488',
      400: '#14b8a6',
      500: '#2dd4bf',
      600: '#5eead4',
      700: '#99f6e4',
      800: '#ccfbf1',
      900: '#f0fdfa'
    }
  },
  indigo: {
    light: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81'
    },
    dark: {
      50: '#312e81',
      100: '#3730a3',
      200: '#4338ca',
      300: '#4f46e5',
      400: '#6366f1',
      500: '#818cf8',
      600: '#a5b4fc',
      700: '#c7d2fe',
      800: '#e0e7ff',
      900: '#eef2ff'
    }
  }
} as const

export const designSystem = {
  colors: {
    // Color schemes for theming
    schemes: colorSchemes,
    
    // Neutral colors (same for all themes)
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    },
    
    // Semantic colors (consistent across themes)
    semantic: {
      success: {
        light: '#dcfce7',
        main: '#16a34a',
        dark: '#15803d'
      },
      warning: {
        light: '#fef3c7',
        main: '#f59e0b',
        dark: '#d97706'
      },
      error: {
        light: '#fee2e2',
        main: '#ef4444',
        dark: '#dc2626'
      },
      info: {
        light: '#dbeafe',
        main: '#3b82f6',
        dark: '#1d4ed8'
      }
    },
    
    // Background colors (theme-aware)
    background: {
      light: {
        primary: '#ffffff',
        secondary: '#f9fafb',
        tertiary: '#f3f4f6'
      },
      dark: {
        primary: '#111827',
        secondary: '#1f2937',
        tertiary: '#374151'
      }
    },
    
    // Text colors (theme-aware)
    text: {
      light: {
        primary: '#111827',
        secondary: '#6b7280',
        tertiary: '#9ca3af'
      },
      dark: {
        primary: '#f9fafb',
        secondary: '#d1d5db',
        tertiary: '#9ca3af'
      }
    },
    
    // Border colors (theme-aware)
    border: {
      light: {
        primary: '#e5e7eb',
        secondary: '#f3f4f6',
        tertiary: '#d1d5db'
      },
      dark: {
        primary: '#374151',
        secondary: '#4b5563',
        tertiary: '#6b7280'
      }
    }
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem'  // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem'     // 96px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px'
  },
  
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    card: '0 2px 8px rgba(0, 0, 0, 0.05)',
    cardHover: '0 4px 12px rgba(0, 0, 0, 0.08)',
    modal: '0 4px 16px rgba(0, 0, 0, 0.1)'
  },
  
  layout: {
    sidebar: {
      width: '250px',
      widthCollapsed: '64px'
    },
    header: {
      height: '64px'
    },
    container: {
      maxWidth: '1200px',
      padding: '1rem'
    }
  },
  
  transitions: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    timing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out'
    }
  },
  
  // Component-specific tokens
  components: {
    button: {
      height: {
        sm: '2rem',    // 32px
        md: '2.5rem',  // 40px
        lg: '3rem'     // 48px
      },
      padding: {
        sm: '0.5rem 0.75rem',
        md: '0.75rem 1rem',
        lg: '1rem 1.5rem'
      }
    },
    input: {
      height: {
        sm: '2rem',
        md: '2.5rem',
        lg: '3rem'
      },
      padding: '0.75rem'
    },
    card: {
      padding: '1.5rem',
      borderRadius: '0.75rem'
    }
  }
} as const

// Theme configuration types
export type ColorScheme = keyof typeof colorSchemes
export type ThemeMode = 'light' | 'dark'

export interface ThemeConfig {
  mode: ThemeMode
  colorScheme: ColorScheme
  direction: 'ltr' | 'rtl'
}

// Default theme configuration
export const defaultTheme: ThemeConfig = {
  mode: 'light',
  colorScheme: 'blue',
  direction: 'ltr'
}

// Function to get theme colors based on configuration
export function getThemeColors(config: ThemeConfig = defaultTheme) {
  const { mode, colorScheme } = config
  const schemeColors = colorSchemes[colorScheme][mode]
  
  return {
    primary: schemeColors,
    neutral: designSystem.colors.neutral,
    semantic: designSystem.colors.semantic,
    background: designSystem.colors.background[mode],
    text: designSystem.colors.text[mode],
    border: designSystem.colors.border[mode]
  }
}

// CSS Custom Properties generator
export function generateCSSVariables(config: ThemeConfig = defaultTheme) {
  const colors = getThemeColors(config)
  
  return {
    // Primary colors
    '--color-primary-50': colors.primary[50],
    '--color-primary-100': colors.primary[100],
    '--color-primary-200': colors.primary[200],
    '--color-primary-300': colors.primary[300],
    '--color-primary-400': colors.primary[400],
    '--color-primary-500': colors.primary[500],
    '--color-primary-600': colors.primary[600],
    '--color-primary-700': colors.primary[700],
    '--color-primary-800': colors.primary[800],
    '--color-primary-900': colors.primary[900],
    
    // Neutral colors
    '--color-neutral-50': colors.neutral[50],
    '--color-neutral-100': colors.neutral[100],
    '--color-neutral-200': colors.neutral[200],
    '--color-neutral-300': colors.neutral[300],
    '--color-neutral-400': colors.neutral[400],
    '--color-neutral-500': colors.neutral[500],
    '--color-neutral-600': colors.neutral[600],
    '--color-neutral-700': colors.neutral[700],
    '--color-neutral-800': colors.neutral[800],
    '--color-neutral-900': colors.neutral[900],
    
    // Semantic colors
    '--color-success-light': colors.semantic.success.light,
    '--color-success-main': colors.semantic.success.main,
    '--color-success-dark': colors.semantic.success.dark,
    '--color-warning-light': colors.semantic.warning.light,
    '--color-warning-main': colors.semantic.warning.main,
    '--color-warning-dark': colors.semantic.warning.dark,
    '--color-error-light': colors.semantic.error.light,
    '--color-error-main': colors.semantic.error.main,
    '--color-error-dark': colors.semantic.error.dark,
    '--color-info-light': colors.semantic.info.light,
    '--color-info-main': colors.semantic.info.main,
    '--color-info-dark': colors.semantic.info.dark,
    
    // Background colors
    '--color-bg-primary': colors.background.primary,
    '--color-bg-secondary': colors.background.secondary,
    '--color-bg-tertiary': colors.background.tertiary,
    
    // Text colors
    '--color-text-primary': colors.text.primary,
    '--color-text-secondary': colors.text.secondary,
    '--color-text-tertiary': colors.text.tertiary,
    
    // Border colors
    '--color-border-primary': colors.border.primary,
    '--color-border-secondary': colors.border.secondary,
    '--color-border-tertiary': colors.border.tertiary,
    
    // Layout
    '--sidebar-width': designSystem.layout.sidebar.width,
    '--sidebar-width-collapsed': designSystem.layout.sidebar.widthCollapsed,
    '--header-height': designSystem.layout.header.height,
    
    // Shadows
    '--shadow-card': designSystem.shadows.card,
    '--shadow-card-hover': designSystem.shadows.cardHover,
    '--shadow-modal': designSystem.shadows.modal,
    
    // Transitions
    '--transition-fast': designSystem.transitions.duration.fast,
    '--transition-normal': designSystem.transitions.duration.normal,
    '--transition-slow': designSystem.transitions.duration.slow,
    
    // Direction
    '--direction': config.direction
  }
}

// RTL utility functions
export const rtlUtils = {
  getTextAlign: (direction: 'ltr' | 'rtl') => direction === 'rtl' ? 'text-right' : 'text-left',
  getMarginStart: (value: string) => ({ marginInlineStart: value }),
  getPaddingEnd: (value: string) => ({ paddingInlineEnd: value }),
  getFlexDirection: (direction: 'ltr' | 'rtl') => direction === 'rtl' ? 'flex-row-reverse' : 'flex-row',
  getBorderSide: (direction: 'ltr' | 'rtl') => direction === 'rtl' ? 'border-r-4' : 'border-l-4'
}

// Tailwind CSS Custom Classes
export const customClasses = {
  // Card styles
  card: 'bg-white rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-150 ease-in-out',
  cardHover: 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5',
  
  // Navigation styles  
  navItem: 'flex items-center gap-3 p-3 rounded-xl transition-all duration-150 ease-in-out',
  navItemActive: 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)] border-l-4 border-[var(--color-primary-600)]',
  navItemHover: 'hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary-700)]',
  
  // Button styles
  buttonPrimary: 'bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-xl px-4 py-2 font-medium transition-all duration-150 ease-in-out',
  buttonSecondary: 'bg-[var(--color-success-main)] text-white hover:bg-[var(--color-success-dark)] rounded-xl px-4 py-2 font-medium transition-all duration-150 ease-in-out',
  buttonGhost: 'bg-transparent hover:bg-[var(--color-neutral-100)] rounded-xl px-4 py-2 font-medium transition-all duration-150 ease-in-out',
  
  // Text styles
  textPrimary: 'text-[var(--color-text-primary)]',
  textSecondary: 'text-[var(--color-text-secondary)]',
  textAccent: 'text-[var(--color-primary-600)]'
}
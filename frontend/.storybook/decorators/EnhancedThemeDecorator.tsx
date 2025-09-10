/**
 * Enhanced Theme Decorator for Storybook
 * Provides advanced theme switching with performance monitoring and interactive controls
 */

import React, { useEffect, useState, useCallback } from 'react'
import type { Decorator } from '@storybook/react'
import { EnhancedThemeProvider } from '../../src/design-system/providers/enhanced-theme-provider'
import { globalThemeApplier, globalThemePreloader, debugPerformance } from '../../src/design-system/utils/theme-performance'
import type { EnhancedTheme } from '../../src/design-system/types/enhanced-theme'

// Define available themes for Storybook
const storybookThemes: EnhancedTheme[] = [
  {
    id: 'base',
    name: 'Base Theme',
    description: 'Default shadcn/ui appearance',
    colorScheme: 'light',
    colors: {
      'base-100': '#ffffff',
      'base-200': '#f8fafc',
      'base-300': '#f1f5f9',
      'base-content': '#0f172a',
      primary: '#2563eb',
      'primary-content': '#ffffff',
      secondary: '#64748b',
      'secondary-content': '#ffffff',
      accent: '#f59e0b',
      'accent-content': '#ffffff',
      neutral: '#374151',
      'neutral-content': '#ffffff',
      info: '#3b82f6',
      'info-content': '#ffffff',
      success: '#22c55e',
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
  },
  {
    id: 'cool-blue',
    name: 'Cool Blue',
    description: 'Professional blue theme',
    colorScheme: 'light',
    colors: {
      'base-100': '#f8fafc',
      'base-200': '#f1f5f9',
      'base-300': '#e2e8f0',
      'base-content': '#1e293b',
      primary: '#3b82f6',
      'primary-content': '#ffffff',
      secondary: '#6b7280',
      'secondary-content': '#ffffff',
      accent: '#06b6d4',
      'accent-content': '#ffffff',
      neutral: '#374151',
      'neutral-content': '#ffffff',
      info: '#3b82f6',
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
      border: '1px solid #cbd5e1',
      depth: '0 4px 6px -1px rgba(59, 130, 246, 0.1)'
    }
  },
  {
    id: 'warm-sand',
    name: 'Warm Sand',
    description: 'Warm, earthy theme',
    colorScheme: 'light',
    colors: {
      'base-100': '#fefcf3',
      'base-200': '#fef3c7',
      'base-300': '#fde68a',
      'base-content': '#451a03',
      primary: '#d97706',
      'primary-content': '#ffffff',
      secondary: '#92400e',
      'secondary-content': '#ffffff',
      accent: '#f59e0b',
      'accent-content': '#ffffff',
      neutral: '#78716c',
      'neutral-content': '#ffffff',
      info: '#0284c7',
      'info-content': '#ffffff',
      success: '#059669',
      'success-content': '#ffffff',
      warning: '#d97706',
      'warning-content': '#ffffff',
      error: '#dc2626',
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
      border: '1px solid #fbbf24',
      depth: '0 4px 6px -1px rgba(217, 119, 6, 0.1)'
    }
  },
  {
    id: 'midnight-purple',
    name: 'Midnight Purple',
    description: 'Dark theme with purple accents',
    colorScheme: 'dark',
    colors: {
      'base-100': '#1f2937',
      'base-200': '#374151',
      'base-300': '#4b5563',
      'base-content': '#f9fafb',
      primary: '#a78bfa',
      'primary-content': '#1f2937',
      secondary: '#6b7280',
      'secondary-content': '#ffffff',
      accent: '#f472b6',
      'accent-content': '#1f2937',
      neutral: '#374151',
      'neutral-content': '#f9fafb',
      info: '#60a5fa',
      'info-content': '#1f2937',
      success: '#34d399',
      'success-content': '#1f2937',
      warning: '#fbbf24',
      'warning-content': '#1f2937',
      error: '#f87171',
      'error-content': '#1f2937'
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
      border: '1px solid #4b5563',
      depth: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
    }
  },
  {
    id: 'soft-gray',
    name: 'Soft Gray',
    description: 'Subtle gray theme',
    colorScheme: 'light',
    colors: {
      'base-100': '#fafafa',
      'base-200': '#f4f4f5',
      'base-300': '#e4e4e7',
      'base-content': '#18181b',
      primary: '#6366f1',
      'primary-content': '#ffffff',
      secondary: '#64748b',
      'secondary-content': '#ffffff',
      accent: '#8b5cf6',
      'accent-content': '#ffffff',
      neutral: '#52525b',
      'neutral-content': '#ffffff',
      info: '#3b82f6',
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
      border: '1px solid #d4d4d8',
      depth: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
    }
  },
  {
    id: 'warm-cream',
    name: 'Warm Cream',
    description: 'Warm, creamy theme',
    colorScheme: 'light',
    colors: {
      'base-100': '#fefdf8',
      'base-200': '#fef7ed',
      'base-300': '#fed7aa',
      'base-content': '#431407',
      primary: '#f59e0b',
      'primary-content': '#ffffff',
      secondary: '#78716c',
      'secondary-content': '#ffffff',
      accent: '#f97316',
      'accent-content': '#ffffff',
      neutral: '#57534e',
      'neutral-content': '#ffffff',
      info: '#0284c7',
      'info-content': '#ffffff',
      success: '#059669',
      'success-content': '#ffffff',
      warning: '#d97706',
      'warning-content': '#ffffff',
      error: '#dc2626',
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
      border: '1px solid #fdba74',
      depth: '0 4px 6px -1px rgba(245, 158, 11, 0.1)'
    }
  }
]

// Theme variant definitions
const themeVariants = {
  rounded: {
    'radius-box': '1rem',
    'radius-field': '0.75rem',
    'radius-selector': '9999px'
  },
  sharp: {
    'radius-box': '0.25rem',
    'radius-field': '0.125rem',
    'radius-selector': '0.125rem'
  },
  compact: {
    'size-field': '2rem',
    'size-selector': '1rem'
  },
  spacious: {
    'size-field': '3rem',
    'size-selector': '1.5rem'
  },
  minimal: {
    depth: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid #f1f5f9'
  },
  rich: {
    depth: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    border: '2px solid var(--color-primary)'
  }
}

/**
 * Performance Monitor Component for Storybook
 */
function StorybookPerformanceMonitor({ mode }: { mode: string }) {
  const [metrics, setMetrics] = useState<any>(null)
  
  useEffect(() => {
    if (mode === 'off') return
    
    const interval = setInterval(() => {
      const stats = globalThemeApplier.getPerformanceStats()
      const cacheInfo = globalThemeApplier.getCacheEfficiency()
      setMetrics({ stats, cacheInfo })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [mode])
  
  if (mode === 'off' || !metrics) return null
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'var(--color-base-100)',
        border: '1px solid var(--color-base-300)',
        borderRadius: 'var(--radius-box)',
        padding: '12px',
        fontSize: '12px',
        zIndex: 1000,
        minWidth: '200px',
        boxShadow: 'var(--depth)'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        🚀 Theme Performance
      </div>
      
      {mode === 'detailed' && (
        <>
          <div>Cache Hit Rate: {(metrics.cacheInfo.hitRate * 100).toFixed(1)}%</div>
          <div>Theme Switch Avg: {metrics.stats.themeSwitch?.avg?.toFixed(1) || 0}ms</div>
          <div>CSS Update Avg: {metrics.stats.cssUpdate?.avg?.toFixed(1) || 0}ms</div>
        </>
      )}
      
      {mode === 'basic' && (
        <div>
          Performance: {metrics.stats.themeSwitch?.avg < 50 ? '✅ Good' : '⚠️ Slow'}
        </div>
      )}
    </div>
  )
}

/**
 * Theme Preview Component
 */
function ThemePreview({ theme, variant }: { theme: string; variant: string }) {
  const currentTheme = storybookThemes.find(t => t.id === theme)
  if (!currentTheme) return null
  
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        background: 'var(--color-base-100)',
        border: '1px solid var(--color-base-300)',
        borderRadius: 'var(--radius-box)',
        padding: '12px',
        fontSize: '12px',
        zIndex: 1000,
        minWidth: '200px',
        boxShadow: 'var(--depth)'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        🎨 Current Theme
      </div>
      <div>Theme: {currentTheme.name}</div>
      <div>Variant: {variant === 'none' ? 'Default' : variant}</div>
      <div>Scheme: {currentTheme.colorScheme}</div>
      
      <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
        <div 
          style={{
            width: '16px',
            height: '16px',
            backgroundColor: currentTheme.colors.primary,
            borderRadius: '2px'
          }}
          title="Primary"
        />
        <div 
          style={{
            width: '16px',
            height: '16px',
            backgroundColor: currentTheme.colors.secondary,
            borderRadius: '2px'
          }}
          title="Secondary"
        />
        <div 
          style={{
            width: '16px',
            height: '16px',
            backgroundColor: currentTheme.colors.accent,
            borderRadius: '2px'
          }}
          title="Accent"
        />
      </div>
    </div>
  )
}

/**
 * Enhanced Theme Decorator
 */
export const EnhancedThemeDecorator: Decorator = (Story, context) => {
  const { globals, parameters } = context
  const theme = globals.theme || 'base'
  const variant = globals.themeVariant || 'none'
  const colorScheme = globals.colorScheme || 'auto'
  const performanceMode = globals.performanceMode || 'off'
  const showPreview = globals.themePreview || false
  
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Apply theme and variant changes
  const applyThemeChanges = useCallback(async () => {
    const selectedTheme = storybookThemes.find(t => t.id === theme)
    if (!selectedTheme) return
    
    try {
      // Apply base theme
      await globalThemeApplier.applyTheme(selectedTheme)
      
      // Apply variant modifications
      if (variant !== 'none' && themeVariants[variant as keyof typeof themeVariants]) {
        const variantModifications = themeVariants[variant as keyof typeof themeVariants]
        const root = document.documentElement
        
        Object.entries(variantModifications).forEach(([key, value]) => {
          root.style.setProperty(`--${key}`, value)
        })
      }
      
      // Apply color scheme
      if (colorScheme !== 'auto') {
        document.documentElement.style.colorScheme = colorScheme
      }
      
      // Set data attributes for CSS selectors
      document.documentElement.setAttribute('data-theme', theme)
      document.documentElement.setAttribute('data-variant', variant)
      document.documentElement.setAttribute('data-color-scheme', colorScheme)
      
    } catch (error) {
      console.error('Failed to apply theme:', error)
    }
  }, [theme, variant, colorScheme])
  
  // Initialize theme system
  useEffect(() => {
    const initialize = async () => {
      // Preload all themes for better performance
      await globalThemePreloader.preloadCriticalThemes(storybookThemes)
      
      // Apply initial theme
      await applyThemeChanges()
      
      // Expose debug utilities to global scope
      if (typeof window !== 'undefined') {
        ;(window as any).__THEME_PERFORMANCE_DEBUG__ = debugPerformance
      }
      
      setIsInitialized(true)
    }
    
    initialize()
  }, [])
  
  // Apply theme changes when globals change
  useEffect(() => {
    if (isInitialized) {
      applyThemeChanges()
    }
  }, [theme, variant, colorScheme, isInitialized, applyThemeChanges])
  
  if (!isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '200px',
        fontSize: '14px',
        color: '#666'
      }}>
        Loading theme system...
      </div>
    )
  }
  
  return (
    <EnhancedThemeProvider 
      defaultTheme={theme}
      themes={storybookThemes}
      enableSystem={colorScheme === 'auto'}
      disableTransitionOnChange={false}
    >
      <div 
        className="storybook-theme-container"
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--color-base-100)',
          color: 'var(--color-base-content)',
          padding: '1rem',
          transition: 'background-color 0.2s ease, color 0.2s ease'
        }}
      >
        <Story />
        
        {/* Performance Monitor */}
        <StorybookPerformanceMonitor mode={performanceMode} />
        
        {/* Theme Preview */}
        {showPreview && <ThemePreview theme={theme} variant={variant} />}
      </div>
    </EnhancedThemeProvider>
  )
}

export default EnhancedThemeDecorator
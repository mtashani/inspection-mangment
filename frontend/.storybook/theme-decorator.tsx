import React from 'react'
import type { Decorator } from '@storybook/react'

/**
 * Theme Decorator for Storybook
 * Applies design system themes to stories
 */

// Available themes
export const AVAILABLE_THEMES = [
  { value: 'base', title: 'Base', description: 'Default light theme' },
  { value: 'cool-blue', title: 'Cool Blue', description: 'Professional blue theme' },
  { value: 'warm-sand', title: 'Warm Sand', description: 'Warm earth tones' },
  { value: 'midnight-purple', title: 'Midnight Purple', description: 'Dark purple theme' },
  { value: 'soft-gray', title: 'Soft Gray', description: 'Subtle gray theme' },
  { value: 'warm-cream', title: 'Warm Cream', description: 'Warm cream theme' },
] as const

export type ThemeName = typeof AVAILABLE_THEMES[number]['value']

// Theme preview component
export const ThemePreview: React.FC<{ theme: ThemeName; children: React.ReactNode }> = ({ 
  theme, 
  children 
}) => {
  React.useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', theme)
    
    // Force re-render by updating a CSS custom property
    document.documentElement.style.setProperty('--theme-update', Date.now().toString())
    
    // Cleanup on unmount
    return () => {
      document.documentElement.setAttribute('data-theme', 'base')
    }
  }, [theme])

  return (
    <div 
      className="bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200"
      data-theme={theme}
      style={{ minHeight: '100vh' }}
    >
      {children}
    </div>
  )
}

// Theme info component for documentation
export const ThemeInfo: React.FC<{ theme: ThemeName }> = ({ theme }) => {
  const themeData = AVAILABLE_THEMES.find(t => t.value === theme)
  
  if (!themeData) return null

  return (
    <div className="mb-4 p-4 border border-[var(--border)] rounded-xl bg-[var(--card)]">
      <h3 className="text-lg font-semibold text-[var(--card-foreground)] mb-2">
        {themeData.title} Theme
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        {themeData.description}
      </p>
      
      {/* Color palette preview */}
      <div className="grid grid-cols-6 gap-2">
        <div className="space-y-1">
          <div className="w-8 h-8 rounded bg-[var(--primary)] border border-[var(--border)]" />
          <span className="text-xs text-[var(--muted-foreground)]">Primary</span>
        </div>
        <div className="space-y-1">
          <div className="w-8 h-8 rounded bg-[var(--success)] border border-[var(--border)]" />
          <span className="text-xs text-[var(--muted-foreground)]">Success</span>
        </div>
        <div className="space-y-1">
          <div className="w-8 h-8 rounded bg-[var(--warning)] border border-[var(--border)]" />
          <span className="text-xs text-[var(--muted-foreground)]">Warning</span>
        </div>
        <div className="space-y-1">
          <div className="w-8 h-8 rounded bg-[var(--error)] border border-[var(--border)]" />
          <span className="text-xs text-[var(--muted-foreground)]">Error</span>
        </div>
        <div className="space-y-1">
          <div className="w-8 h-8 rounded bg-[var(--info)] border border-[var(--border)]" />
          <span className="text-xs text-[var(--muted-foreground)]">Info</span>
        </div>
        <div className="space-y-1">
          <div className="w-8 h-8 rounded bg-[var(--muted)] border border-[var(--border)]" />
          <span className="text-xs text-[var(--muted-foreground)]">Muted</span>
        </div>
      </div>
    </div>
  )
}

// Main theme decorator
export const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme as ThemeName || 'base'
  
  return (
    <ThemePreview theme={theme}>
      <Story />
    </ThemePreview>
  )
}

// Theme decorator with info panel
export const withThemeInfo: Decorator = (Story, context) => {
  const theme = context.globals.theme as ThemeName || 'base'
  
  return (
    <ThemePreview theme={theme}>
      <ThemeInfo theme={theme} />
      <Story />
    </ThemePreview>
  )
}

// Utility function to get theme CSS variables
export const getThemeVariables = (theme: ThemeName): Record<string, string> => {
  // Read actual CSS variables from the document
  if (typeof document !== 'undefined') {
    const computedStyle = getComputedStyle(document.documentElement)
    
    const variables: Record<string, string> = {}
    const cssVariables = [
      '--background', '--foreground', '--card', '--card-foreground',
      '--muted', '--muted-foreground', '--border', '--input', '--ring',
      '--primary', '--primary-foreground', '--success', '--success-foreground',
      '--warning', '--warning-foreground', '--error', '--error-foreground',
      '--info', '--info-foreground'
    ]
    
    cssVariables.forEach(variable => {
      const value = computedStyle.getPropertyValue(variable).trim()
      if (value) {
        variables[variable] = value
      }
    })
    
    return variables
  }
  
  // Fallback for SSR
  const fallbackVariables = {
    '--background': '#ffffff',
    '--foreground': '#0f172a',
    '--primary': '#2563eb',
    '--success': '#22c55e',
    '--warning': '#f59e0b',
    '--error': '#ef4444',
    '--info': '#3b82f6',
  }
  
  return fallbackVariables
}

// Export theme utilities for use in stories
export const themeUtils = {
  AVAILABLE_THEMES,
  getThemeVariables,
  ThemePreview,
  ThemeInfo,
}

// Theme switcher component for stories
export const ThemeSwitcher: React.FC<{
  currentTheme: ThemeName
  onThemeChange: (theme: ThemeName) => void
}> = ({ currentTheme, onThemeChange }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6 p-4 border border-[var(--border)] rounded-xl bg-[var(--card)]">
      <span className="text-sm font-medium text-[var(--card-foreground)] mr-2">
        Theme:
      </span>
      {AVAILABLE_THEMES.map((theme) => (
        <button
          key={theme.value}
          onClick={() => onThemeChange(theme.value)}
          className={`
            px-3 py-1 text-xs rounded-lg border transition-colors
            ${currentTheme === theme.value
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
              : 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--muted)]/80'
            }
          `}
          title={theme.description}
        >
          {theme.title}
        </button>
      ))}
    </div>
  )
}

// Design tokens display component
export const DesignTokensDisplay: React.FC<{ theme: ThemeName }> = ({ theme }) => {
  const variables = getThemeVariables(theme)
  
  return (
    <div className="mb-6 p-4 border border-[var(--border)] rounded-xl bg-[var(--card)]">
      <h3 className="text-lg font-semibold text-[var(--card-foreground)] mb-4">
        Design Tokens
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(variables).map(([variable, value]) => (
          <div key={variable} className="flex items-center gap-3">
            <div 
              className="w-6 h-6 rounded border border-[var(--border)] shrink-0"
              style={{ backgroundColor: value }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-mono text-[var(--foreground)] truncate">
                {variable}
              </div>
              <div className="text-xs text-[var(--muted-foreground)] truncate">
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Component showcase wrapper
export const ComponentShowcase: React.FC<{
  title: string
  description?: string
  children: React.ReactNode
}> = ({ title, description, children }) => {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-[var(--muted-foreground)]">
            {description}
          </p>
        )}
      </div>
      
      <div className="p-6 border border-[var(--border)] rounded-xl bg-[var(--card)]">
        {children}
      </div>
    </div>
  )
}

// Responsive preview component
export const ResponsivePreview: React.FC<{
  children: React.ReactNode
  viewports?: string[]
}> = ({ children, viewports = ['mobile', 'tablet', 'desktop'] }) => {
  const [currentViewport, setCurrentViewport] = React.useState(viewports[0])
  
  const getViewportStyles = (viewport: string) => {
    const config = customViewports[viewport as keyof typeof customViewports]
    if (!config) return {}
    
    return {
      width: config.styles.width,
      height: config.styles.height,
      border: '1px solid var(--border)',
      borderRadius: '8px',
      overflow: 'auto'
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {viewports.map((viewport) => (
          <button
            key={viewport}
            onClick={() => setCurrentViewport(viewport)}
            className={`
              px-3 py-1 text-xs rounded-lg border transition-colors
              ${currentViewport === viewport
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--muted)]/80'
              }
            `}
          >
            {viewport}
          </button>
        ))}
      </div>
      
      <div 
        className="bg-[var(--background)] transition-all duration-300"
        style={getViewportStyles(currentViewport)}
      >
        {children}
      </div>
    </div>
  )
}

// Import viewport configurations
import { customViewports } from './viewport-addon'
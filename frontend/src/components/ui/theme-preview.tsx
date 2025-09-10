/**
 * Theme Preview Component
 * Shows a mini preview of each theme
 */

"use client"

import { DesignSystemCard } from "./design-system-card"
import { DesignSystemButton } from "./design-system-button"

interface ThemePreviewProps {
  themeName: string
  themeId: string
  isActive: boolean
  onClick: () => void
}

export function ThemePreview({ themeName, themeId, isActive, onClick }: ThemePreviewProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-[var(--radius-card)] p-4 text-left
        transition-all duration-[var(--transition-fast)]
        border-2 
        ${isActive 
          ? 'border-[var(--primary)] scale-105 shadow-lg' 
          : 'border-transparent hover:border-[var(--primary)]/20 hover:scale-102'
        }
      `}
      style={{
        background: getThemeBackground(themeId),
        color: getThemeForeground(themeId)
      }}
    >
      {/* Mini preview content */}
      <div className="space-y-2">
        <div className="text-sm font-semibold">{themeName}</div>
        
        {/* Mini card preview */}
        <div 
          className="rounded-lg p-2 text-xs"
          style={{ 
            background: getThemeCardBackground(themeId),
            color: getThemeCardForeground(themeId)
          }}
        >
          <div className="font-medium mb-1">Sample Card</div>
          <div className="opacity-70">Preview content</div>
        </div>
        
        {/* Mini button preview */}
        <div className="flex gap-1">
          <div 
            className="px-2 py-1 rounded text-xs font-medium"
            style={{
              background: getThemePrimary(themeId),
              color: getThemePrimaryForeground(themeId)
            }}
          >
            Primary
          </div>
          <div 
            className="px-2 py-1 rounded text-xs"
            style={{
              background: getThemeSuccess(themeId),
              color: '#ffffff'
            }}
          >
            Success
          </div>
        </div>
      </div>
      
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[var(--primary)]"></div>
      )}
    </button>
  )
}

// Helper functions to get theme colors
function getThemeBackground(themeId: string): string {
  const backgrounds: Record<string, string> = {
    'base': '#ffffff',
    'cool-blue': '#f5f7fa',
    'warm-sand': '#fafaf5',
    'midnight-purple': '#1e1b2e',
    'soft-gray': '#f8f9fb',
    'warm-cream': '#fefcf3'
  }
  return backgrounds[themeId] || backgrounds.base
}

function getThemeForeground(themeId: string): string {
  const foregrounds: Record<string, string> = {
    'base': '#0f172a',
    'cool-blue': '#1e293b',
    'warm-sand': '#3c2f2f',
    'midnight-purple': '#e0e7ff',
    'soft-gray': '#1f2937',
    'warm-cream': '#1c1917'
  }
  return foregrounds[themeId] || foregrounds.base
}

function getThemeCardBackground(themeId: string): string {
  const cardBackgrounds: Record<string, string> = {
    'base': '#f9fafb',
    'cool-blue': '#ffffff',
    'warm-sand': '#ffffff',
    'midnight-purple': '#2a2547',
    'soft-gray': '#ffffff',
    'warm-cream': '#ffffff'
  }
  return cardBackgrounds[themeId] || cardBackgrounds.base
}

function getThemeCardForeground(themeId: string): string {
  const cardForegrounds: Record<string, string> = {
    'base': '#0f172a',
    'cool-blue': '#1e293b',
    'warm-sand': '#3c2f2f',
    'midnight-purple': '#e0e7ff',
    'soft-gray': '#1f2937',
    'warm-cream': '#1c1917'
  }
  return cardForegrounds[themeId] || cardForegrounds.base
}

function getThemePrimary(themeId: string): string {
  const primaries: Record<string, string> = {
    'base': '#2563eb',
    'cool-blue': '#3b82f6',
    'warm-sand': '#d4a373',
    'midnight-purple': '#a78bfa',
    'soft-gray': '#6366f1',
    'warm-cream': '#f59e0b'
  }
  return primaries[themeId] || primaries.base
}

function getThemePrimaryForeground(themeId: string): string {
  return '#ffffff'
}

function getThemeSuccess(themeId: string): string {
  const success: Record<string, string> = {
    'base': '#22c55e',
    'cool-blue': '#10b981',
    'warm-sand': '#65a30d',
    'midnight-purple': '#34d399',
    'soft-gray': '#10b981',
    'warm-cream': '#22c55e'
  }
  return success[themeId] || success.base
}
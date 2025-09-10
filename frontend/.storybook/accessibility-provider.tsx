import React, { createContext, useContext, useState } from 'react'

// Simple accessibility preferences for Storybook
interface AccessibilityPreferences {
  highContrast: boolean
  reducedMotion: boolean
  largeText: boolean
  fontSize: number
}

const defaultPreferences: AccessibilityPreferences = {
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  fontSize: 16
}

interface AccessibilityContextType {
  preferences: AccessibilityPreferences
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

// Simple AccessibilityProvider for Storybook
export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(defaultPreferences)

  const updatePreference = <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  return (
    <AccessibilityContext.Provider
      value={{
        preferences,
        updatePreference
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

// Hook to use accessibility preferences
export function useAccessibilityPreferences() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibilityPreferences must be used within AccessibilityProvider')
  }
  return context
}

// Simple QuickAccessibilityToggle for Storybook
export function QuickAccessibilityToggle() {
  const { preferences, updatePreference } = useAccessibilityPreferences()

  return (
    <div className="flex items-center gap-2 p-2 border rounded">
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={preferences.highContrast}
          onChange={(e) => updatePreference('highContrast', e.target.checked)}
        />
        High Contrast
      </label>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={preferences.reducedMotion}
          onChange={(e) => updatePreference('reducedMotion', e.target.checked)}
        />
        Reduce Motion
      </label>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={preferences.largeText}
          onChange={(e) => updatePreference('largeText', e.target.checked)}
        />
        Large Text
      </label>
    </div>
  )
}
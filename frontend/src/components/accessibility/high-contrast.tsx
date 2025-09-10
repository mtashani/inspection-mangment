'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

interface HighContrastContextType {
  isHighContrast: boolean
  toggleHighContrast: () => void
  setHighContrast: (enabled: boolean) => void
}

const HighContrastContext = createContext<HighContrastContextType | undefined>(undefined)

export interface HighContrastProviderProps {
  children: React.ReactNode
}

export function HighContrastProvider({ children }: HighContrastProviderProps) {
  const [isHighContrast, setIsHighContrast] = useState(false)

  // Check for system preference and saved preference
  useEffect(() => {
    // Check system preference
    const systemPreference = window.matchMedia('(prefers-contrast: high)').matches
    
    // Check saved preference
    const savedPreference = localStorage.getItem('high-contrast')
    const shouldEnable = savedPreference ? savedPreference === 'true' : systemPreference

    setIsHighContrast(shouldEnable)
  }, [])

  // Apply high contrast class to document
  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }

    // Save preference
    localStorage.setItem('high-contrast', isHighContrast.toString())
  }, [isHighContrast])

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-update if user hasn't manually set preference
      const savedPreference = localStorage.getItem('high-contrast')
      if (!savedPreference) {
        setIsHighContrast(e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleHighContrast = () => {
    setIsHighContrast(prev => !prev)
  }

  const setHighContrast = (enabled: boolean) => {
    setIsHighContrast(enabled)
  }

  return (
    <HighContrastContext.Provider value={{
      isHighContrast,
      toggleHighContrast,
      setHighContrast
    }}>
      {children}
    </HighContrastContext.Provider>
  )
}

export function useHighContrast() {
  const context = useContext(HighContrastContext)
  if (context === undefined) {
    throw new Error('useHighContrast must be used within a HighContrastProvider')
  }
  return context
}

export interface HighContrastToggleProps {
  className?: string
}

export function HighContrastToggle({ className }: HighContrastToggleProps) {
  const { isHighContrast, toggleHighContrast } = useHighContrast()

  return (
    <button
      onClick={toggleHighContrast}
      className={cn(
        'flex items-center space-x-2 px-3 py-2 rounded-md transition-colors',
        'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'high-contrast:border-2 high-contrast:border-current',
        className
      )}
      aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
      title={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
    >
      <div className="relative w-5 h-5">
        <div className={cn(
          'absolute inset-0 rounded-full transition-colors',
          isHighContrast ? 'bg-black' : 'bg-gray-400'
        )} />
        <div className={cn(
          'absolute inset-0 rounded-full border-2 transition-colors',
          isHighContrast ? 'border-white' : 'border-gray-600'
        )} />
        <div className={cn(
          'absolute top-1/2 left-1/2 w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-colors',
          isHighContrast ? 'bg-white' : 'bg-gray-600'
        )} />
      </div>
      <span className="text-sm font-medium">
        High Contrast
      </span>
    </button>
  )
}

// High contrast aware component wrapper
export interface HighContrastAwareProps {
  children: React.ReactNode
  highContrastClassName?: string
  className?: string
}

export function HighContrastAware({
  children,
  highContrastClassName,
  className
}: HighContrastAwareProps) {
  const { isHighContrast } = useHighContrast()

  return (
    <div className={cn(
      className,
      isHighContrast && highContrastClassName
    )}>
      {children}
    </div>
  )
}

// Hook for high contrast aware styling
export function useHighContrastStyles() {
  const { isHighContrast } = useHighContrast()

  const getHighContrastClass = (normalClass: string, highContrastClass: string) => {
    return isHighContrast ? highContrastClass : normalClass
  }

  const getConditionalClass = (highContrastClass: string) => {
    return isHighContrast ? highContrastClass : ''
  }

  return {
    isHighContrast,
    getHighContrastClass,
    getConditionalClass
  }
}

// Predefined high contrast color classes
export const highContrastColors = {
  // Backgrounds
  bgPrimary: 'high-contrast:bg-black high-contrast:text-white',
  bgSecondary: 'high-contrast:bg-white high-contrast:text-black',
  bgMuted: 'high-contrast:bg-gray-100 high-contrast:text-black',
  
  // Borders
  border: 'high-contrast:border-2 high-contrast:border-black',
  borderWhite: 'high-contrast:border-2 high-contrast:border-white',
  
  // Text
  textPrimary: 'high-contrast:text-black',
  textSecondary: 'high-contrast:text-white',
  textMuted: 'high-contrast:text-gray-900',
  
  // Interactive elements
  button: 'high-contrast:border-2 high-contrast:border-current high-contrast:bg-white high-contrast:text-black hover:high-contrast:bg-black hover:high-contrast:text-white',
  buttonPrimary: 'high-contrast:border-2 high-contrast:border-white high-contrast:bg-black high-contrast:text-white hover:high-contrast:bg-white hover:high-contrast:text-black',
  
  // Form elements
  input: 'high-contrast:border-2 high-contrast:border-black high-contrast:bg-white high-contrast:text-black',
  inputFocus: 'focus:high-contrast:border-4 focus:high-contrast:border-blue-600',
  
  // Status colors
  success: 'high-contrast:bg-white high-contrast:text-green-900 high-contrast:border-2 high-contrast:border-green-900',
  warning: 'high-contrast:bg-white high-contrast:text-yellow-900 high-contrast:border-2 high-contrast:border-yellow-900',
  error: 'high-contrast:bg-white high-contrast:text-red-900 high-contrast:border-2 high-contrast:border-red-900',
  info: 'high-contrast:bg-white high-contrast:text-blue-900 high-contrast:border-2 high-contrast:border-blue-900'
}

export type { HighContrastProviderProps, HighContrastToggleProps, HighContrastAwareProps }
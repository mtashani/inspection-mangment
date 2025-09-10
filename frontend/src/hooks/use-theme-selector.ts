/**
 * Theme Selector Hook
 * 
 * Custom hook for managing theme selection and variants
 */

import { useState, useCallback, useEffect } from 'react'
import { useEnhancedTheme } from '@/design-system/providers/enhanced-theme-provider'
import { defaultThemes } from '@/design-system/themes/default-themes'
import { allThemeVariants } from '@/design-system/themes/theme-variants'
import type { EnhancedTheme } from '@/design-system/types/enhanced-theme'
import type { CategorizedThemeVariant } from '@/design-system/types/theme-variants'

/**
 * Theme Selector State
 */
export interface ThemeSelectorState {
  /** Currently selected theme ID */
  selectedTheme: string
  /** Currently selected variant IDs */
  selectedVariants: string[]
  /** Preview theme (for live preview) */
  previewTheme: string | null
  /** Whether variants are being applied */
  isApplyingVariants: boolean
  /** Available themes */
  availableThemes: EnhancedTheme[]
  /** Available variants */
  availableVariants: CategorizedThemeVariant[]
}

/**
 * Theme Selector Actions
 */
export interface ThemeSelectorActions {
  /** Select a theme */
  selectTheme: (themeId: string) => void
  /** Toggle a variant */
  toggleVariant: (variantId: string) => void
  /** Apply selected variants */
  applyVariants: () => Promise<void>
  /** Reset variants */
  resetVariants: () => void
  /** Preview theme (without applying) */
  previewTheme: (themeId: string | null) => void
  /** Get conflicting variants for a given variant */
  getConflictingVariants: (variantId: string) => string[]
  /** Check if variant is conflicted */
  isVariantConflicted: (variantId: string) => boolean
  /** Get variant by ID */
  getVariant: (variantId: string) => CategorizedThemeVariant | undefined
  /** Get theme by ID */
  getTheme: (themeId: string) => EnhancedTheme | undefined
}

/**
 * Theme Selector Hook Result
 */
export interface UseThemeSelectorResult extends ThemeSelectorState, ThemeSelectorActions {}

/**
 * Theme Selector Hook Options
 */
export interface UseThemeSelectorOptions {
  /** Enable live preview */
  enablePreview?: boolean
  /** Auto-apply variants on selection */
  autoApply?: boolean
  /** Persist selections to localStorage */
  persistSelections?: boolean
  /** Storage key for persistence */
  storageKey?: string
}

/**
 * Custom hook for theme selection and variant management
 */
export function useThemeSelector(options: UseThemeSelectorOptions = {}): UseThemeSelectorResult {
  const {
    enablePreview = false,
    autoApply = false,
    persistSelections = true,
    storageKey = 'theme-selector-state'
  } = options
  
  const { theme: currentTheme, setTheme, applyThemeVariants } = useEnhancedTheme()
  
  // State
  const [selectedTheme, setSelectedTheme] = useState<string>(currentTheme)
  const [selectedVariants, setSelectedVariants] = useState<string[]>([])
  const [previewThemeState, setPreviewThemeState] = useState<string | null>(null)
  const [isApplyingVariants, setIsApplyingVariants] = useState(false)
  
  // Load persisted state on mount
  useEffect(() => {
    if (!persistSelections || typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const { selectedVariants: storedVariants } = JSON.parse(stored)
        if (Array.isArray(storedVariants)) {
          setSelectedVariants(storedVariants)
        }
      }
    } catch (error) {
      console.warn('Failed to load theme selector state:', error)
    }
  }, [persistSelections, storageKey])
  
  // Persist state changes
  useEffect(() => {
    if (!persistSelections || typeof window === 'undefined') return
    
    try {
      const state = {
        selectedVariants
      }
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to persist theme selector state:', error)
    }
  }, [selectedVariants, persistSelections, storageKey])
  
  // Sync with current theme
  useEffect(() => {
    setSelectedTheme(currentTheme)
  }, [currentTheme])
  
  /**
   * Select a theme
   */
  const selectTheme = useCallback((themeId: string) => {
    setSelectedTheme(themeId)
    setTheme(themeId)
    
    if (enablePreview) {
      setPreviewThemeState(null) // Clear preview when theme is selected
    }
  }, [setTheme, enablePreview])
  
  /**
   * Toggle a variant
   */
  const toggleVariant = useCallback((variantId: string) => {
    const variant = allThemeVariants.find(v => v.id === variantId)
    if (!variant) return
    
    setSelectedVariants(prev => {
      let newVariants: string[]
      
      if (prev.includes(variantId)) {
        // Remove variant
        newVariants = prev.filter(id => id !== variantId)
      } else {
        // Add variant, but check for conflicts
        newVariants = [...prev]
        
        // Remove conflicting variants
        if (variant.conflicts) {
          newVariants = newVariants.filter(id => !variant.conflicts!.includes(id))
        }
        
        // Add new variant
        newVariants.push(variantId)
      }
      
      // Auto-apply if enabled
      if (autoApply && newVariants.length > 0) {
        applyThemeVariants(newVariants)
      }
      
      return newVariants
    })
  }, [autoApply, applyThemeVariants])
  
  /**
   * Apply selected variants
   */
  const applyVariants = useCallback(async () => {
    if (selectedVariants.length === 0) return
    
    setIsApplyingVariants(true)
    
    try {
      applyThemeVariants(selectedVariants)
      
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error) {
      console.error('Failed to apply theme variants:', error)
    } finally {
      setIsApplyingVariants(false)
    }
  }, [selectedVariants, applyThemeVariants])
  
  /**
   * Reset variants
   */
  const resetVariants = useCallback(() => {
    setSelectedVariants([])
    // Reset to base theme
    setTheme(selectedTheme)
  }, [selectedTheme, setTheme])
  
  /**
   * Preview theme
   */
  const previewTheme = useCallback((themeId: string | null) => {
    if (!enablePreview) return
    
    setPreviewThemeState(themeId)
    
    if (themeId) {
      // Apply preview theme temporarily
      setTheme(themeId)
    } else {
      // Restore original theme
      setTheme(selectedTheme)
    }
  }, [enablePreview, setTheme, selectedTheme])
  
  /**
   * Get conflicting variants for a given variant
   */
  const getConflictingVariants = useCallback((variantId: string): string[] => {
    const variant = allThemeVariants.find(v => v.id === variantId)
    return variant?.conflicts || []
  }, [])
  
  /**
   * Check if variant is conflicted
   */
  const isVariantConflicted = useCallback((variantId: string): boolean => {
    const variant = allThemeVariants.find(v => v.id === variantId)
    if (!variant?.conflicts) return false
    
    return variant.conflicts.some(conflictId => selectedVariants.includes(conflictId))
  }, [selectedVariants])
  
  /**
   * Get variant by ID
   */
  const getVariant = useCallback((variantId: string): CategorizedThemeVariant | undefined => {
    return allThemeVariants.find(v => v.id === variantId)
  }, [])
  
  /**
   * Get theme by ID
   */
  const getTheme = useCallback((themeId: string): EnhancedTheme | undefined => {
    return defaultThemes.find(t => t.id === themeId)
  }, [])
  
  return {
    // State
    selectedTheme,
    selectedVariants,
    previewTheme: previewThemeState,
    isApplyingVariants,
    availableThemes: defaultThemes,
    availableVariants: allThemeVariants,
    
    // Actions
    selectTheme,
    toggleVariant,
    applyVariants,
    resetVariants,
    previewTheme,
    getConflictingVariants,
    isVariantConflicted,
    getVariant,
    getTheme
  }
}

/**
 * Theme Selector Utilities
 */
export const themeSelectorUtils = {
  /**
   * Get theme display name with variant info
   */
  getDisplayName: (theme: EnhancedTheme, variants: CategorizedThemeVariant[]): string => {
    if (variants.length === 0) return theme.name
    
    const variantNames = variants.map(v => v.name).join(', ')
    return `${theme.name} (${variantNames})`
  },
  
  /**
   * Get theme category icon
   */
  getCategoryIcon: (category: string): string => {
    switch (category) {
      case 'radius': return '✨'
      case 'sizing': return '📏'
      case 'visual': return '⚡'
      default: return '🎨'
    }
  },
  
  /**
   * Get theme color scheme badge variant
   */
  getColorSchemeBadge: (colorScheme: 'light' | 'dark'): 'default' | 'secondary' => {
    return colorScheme === 'dark' ? 'secondary' : 'default'
  },
  
  /**
   * Check if variants are compatible
   */
  areVariantsCompatible: (variantIds: string[]): boolean => {
    const variants = variantIds.map(id => allThemeVariants.find(v => v.id === id)).filter(Boolean)
    
    for (const variant of variants) {
      if (variant?.conflicts) {
        const hasConflict = variant.conflicts.some(conflictId => 
          variantIds.includes(conflictId)
        )
        if (hasConflict) return false
      }
    }
    
    return true
  },
  
  /**
   * Get recommended variants for a theme
   */
  getRecommendedVariants: (themeId: string): string[] => {
    // Simple recommendation logic based on theme characteristics
    const theme = defaultThemes.find(t => t.id === themeId)
    if (!theme) return []
    
    const recommendations: string[] = []
    
    // Dark themes work well with minimal variants
    if (theme.colorScheme === 'dark') {
      recommendations.push('minimal', 'sharp')
    } else {
      recommendations.push('rounded', 'spacious')
    }
    
    return recommendations
  }
}
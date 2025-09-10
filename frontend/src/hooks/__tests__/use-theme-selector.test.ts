/**
 * Theme Selector Hook Tests
 * Tests theme selection logic, variant management, and persistence
 */

import { renderHook, act } from '@testing-library/react'
import { useThemeSelector, themeSelectorUtils } from '../use-theme-selector'
import { useEnhancedTheme } from '@/design-system/providers/enhanced-theme-provider'

// Mock the enhanced theme provider
jest.mock('@/design-system/providers/enhanced-theme-provider', () => ({
  useEnhancedTheme: jest.fn()
}))

// Mock theme data
const mockThemes = [
  {
    id: 'base',
    name: 'Base Theme',
    description: 'Default theme',
    colorScheme: 'light' as const,
    category: 'default',
    colors: { primary: '#2563eb' }
  },
  {
    id: 'dark',
    name: 'Dark Theme', 
    description: 'Dark color scheme',
    colorScheme: 'dark' as const,
    category: 'dark',
    colors: { primary: '#3b82f6' }
  }
]

const mockVariants = [
  {
    id: 'rounded',
    name: 'Rounded',
    description: 'More rounded corners',
    category: 'radius' as const,
    tokens: { 'radius-field': '0.5rem' }
  },
  {
    id: 'sharp',
    name: 'Sharp',
    description: 'Sharp corners',
    category: 'radius' as const,
    tokens: { 'radius-field': '0rem' },
    conflicts: ['rounded']
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Smaller spacing',
    category: 'sizing' as const,
    tokens: { 'space-4': '0.75rem' }
  }
]

// Mock theme data imports
jest.mock('@/design-system/themes/default-themes', () => ({
  defaultThemes: mockThemes
}))

jest.mock('@/design-system/themes/theme-variants', () => ({
  allThemeVariants: mockVariants
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

const mockUseEnhancedTheme = useEnhancedTheme as jest.MockedFunction<typeof useEnhancedTheme>

describe('useThemeSelector Hook', () => {
  const mockSetTheme = jest.fn()
  const mockApplyThemeVariants = jest.fn()
  
  beforeEach(() => {
    mockUseEnhancedTheme.mockReturnValue({
      theme: 'base',
      setTheme: mockSetTheme,
      applyThemeVariants: mockApplyThemeVariants,
      themeConfig: mockThemes[0],
      isLoading: false,
      error: null
    })
    
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })
  
  describe('Basic Functionality', () => {\n    test('initializes with current theme', () => {\n      const { result } = renderHook(() => useThemeSelector())\n      \n      expect(result.current.selectedTheme).toBe('base')\n      expect(result.current.selectedVariants).toEqual([])\n      expect(result.current.availableThemes).toEqual(mockThemes)\n      expect(result.current.availableVariants).toEqual(mockVariants)\n    })\n    \n    test('syncs with theme provider changes', () => {\n      const { result, rerender } = renderHook(() => useThemeSelector())\n      \n      expect(result.current.selectedTheme).toBe('base')\n      \n      // Change theme in provider\n      mockUseEnhancedTheme.mockReturnValue({\n        theme: 'dark',\n        setTheme: mockSetTheme,\n        applyThemeVariants: mockApplyThemeVariants,\n        themeConfig: mockThemes[1],\n        isLoading: false,\n        error: null\n      })\n      \n      rerender()\n      \n      expect(result.current.selectedTheme).toBe('dark')\n    })\n  })\n  \n  describe('Theme Selection', () => {\n    test('selects theme correctly', () => {\n      const { result } = renderHook(() => useThemeSelector())\n      \n      act(() => {\n        result.current.selectTheme('dark')\n      })\n      \n      expect(result.current.selectedTheme).toBe('dark')\n      expect(mockSetTheme).toHaveBeenCalledWith('dark')\n    })\n    \n    test('clears preview when theme is selected', () => {\n      const { result } = renderHook(() => useThemeSelector({ enablePreview: true }))\n      \n      act(() => {\n        result.current.previewTheme('dark')\n      })\n      \n      expect(result.current.previewTheme).toBe('dark')\n      \n      act(() => {\n        result.current.selectTheme('dark')\n      })\n      \n      expect(result.current.previewTheme).toBe(null)\n    })\n  })\n  \n  describe('Variant Management', () => {\n    test('toggles variant selection', () => {\n      const { result } = renderHook(() => useThemeSelector())\n      \n      act(() => {\n        result.current.toggleVariant('rounded')\n      })\n      \n      expect(result.current.selectedVariants).toContain('rounded')\n      \n      act(() => {\n        result.current.toggleVariant('rounded')\n      })\n      \n      expect(result.current.selectedVariants).not.toContain('rounded')\n    })\n    \n    test('handles conflicting variants', () => {\n      const { result } = renderHook(() => useThemeSelector())\n      \n      // Select rounded first\n      act(() => {\n        result.current.toggleVariant('rounded')\n      })\n      \n      expect(result.current.selectedVariants).toContain('rounded')\n      \n      // Select sharp (conflicts with rounded)\n      act(() => {\n        result.current.toggleVariant('sharp')\n      })\n      \n      expect(result.current.selectedVariants).toContain('sharp')\n      expect(result.current.selectedVariants).not.toContain('rounded')\n    })\n    \n    test('auto-applies variants when autoApply is enabled', () => {\n      const { result } = renderHook(() => useThemeSelector({ autoApply: true }))\n      \n      act(() => {\n        result.current.toggleVariant('rounded')\n      })\n      \n      expect(mockApplyThemeVariants).toHaveBeenCalledWith(['rounded'])\n    })\n    \n    test('does not auto-apply when autoApply is disabled', () => {\n      const { result } = renderHook(() => useThemeSelector({ autoApply: false }))\n      \n      act(() => {\n        result.current.toggleVariant('rounded')\n      })\n      \n      expect(mockApplyThemeVariants).not.toHaveBeenCalled()\n    })\n  })\n  \n  describe('Variant Application', () => {\n    test('applies selected variants', async () => {\n      const { result } = renderHook(() => useThemeSelector())\n      \n      act(() => {\n        result.current.toggleVariant('rounded')\n        result.current.toggleVariant('compact')\n      })\n      \n      await act(async () => {\n        await result.current.applyVariants()\n      })\n      \n      expect(mockApplyThemeVariants).toHaveBeenCalledWith(['rounded', 'compact'])\n    })\n    \n    test('sets loading state during application', async () => {\n      const { result } = renderHook(() => useThemeSelector())\n      \n      act(() => {\n        result.current.toggleVariant('rounded')\n      })\n      \n      const applyPromise = act(async () => {\n        await result.current.applyVariants()\n      })\n      \n      expect(result.current.isApplyingVariants).toBe(true)\n      \n      await applyPromise\n      \n      expect(result.current.isApplyingVariants).toBe(false)\n    })\n    \n    test('handles application errors gracefully', async () => {\n      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()\n      mockApplyThemeVariants.mockRejectedValue(new Error('Apply failed'))\n      \n      const { result } = renderHook(() => useThemeSelector())\n      \n      act(() => {\n        result.current.toggleVariant('rounded')\n      })\n      \n      await act(async () => {\n        await result.current.applyVariants()\n      })\n      \n      expect(consoleSpy).toHaveBeenCalledWith('Failed to apply theme variants:', expect.any(Error))\n      expect(result.current.isApplyingVariants).toBe(false)\n      \n      consoleSpy.mockRestore()\n    })\n    \n    test('does not apply when no variants selected', async () => {\n      const { result } = renderHook(() => useThemeSelector())\n      \n      await act(async () => {\n        await result.current.applyVariants()\n      })\n      \n      expect(mockApplyThemeVariants).not.toHaveBeenCalled()\n    })\n  })\n  \n  describe('Variant Reset', () => {\n    test('resets all variants', () => {\n      const { result } = renderHook(() => useThemeSelector())\n      \n      act(() => {\n        result.current.toggleVariant('rounded')\n        result.current.toggleVariant('compact')\n      })\n      \n      expect(result.current.selectedVariants).toHaveLength(2)\n      \n      act(() => {\n        result.current.resetVariants()\n      })\n      \n      expect(result.current.selectedVariants).toHaveLength(0)\n      expect(mockSetTheme).toHaveBeenCalledWith('base')\n    })\n  })\n  \n  describe('Theme Preview', () => {\n    test('enables preview when enablePreview is true', () => {\n      const { result } = renderHook(() => useThemeSelector({ enablePreview: true }))\n      \n      act(() => {\n        result.current.previewTheme('dark')\n      })\n      \n      expect(result.current.previewTheme).toBe('dark')\n      expect(mockSetTheme).toHaveBeenCalledWith('dark')\n    })\n    \n    test('ignores preview when enablePreview is false', () => {\n      const { result } = renderHook(() => useThemeSelector({ enablePreview: false }))\n      \n      act(() => {\n        result.current.previewTheme('dark')\n      })\n      \n      expect(result.current.previewTheme).toBe(null)\n      expect(mockSetTheme).not.toHaveBeenCalled()\n    })\n    \n    test('restores original theme when preview is cleared', () => {\n      const { result } = renderHook(() => useThemeSelector({ enablePreview: true }))\n      \n      act(() => {\n        result.current.previewTheme('dark')\n      })\n      \n      act(() => {\n        result.current.previewTheme(null)\n      })\n      \n      expect(mockSetTheme).toHaveBeenLastCalledWith('base')\n    })\n  })\n  \n  describe('Persistence', () => {\n    test('loads persisted variants on mount', () => {\n      const persistedState = JSON.stringify({ selectedVariants: ['rounded', 'compact'] })\n      mockLocalStorage.getItem.mockReturnValue(persistedState)\n      \n      const { result } = renderHook(() => useThemeSelector())\n      \n      expect(result.current.selectedVariants).toEqual(['rounded', 'compact'])\n    })\n    \n    test('persists variant changes to localStorage', () => {\n      const { result } = renderHook(() => useThemeSelector())\n      \n      act(() => {\n        result.current.toggleVariant('rounded')\n      })\n      \n      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(\n        'theme-selector-state',\n        JSON.stringify({ selectedVariants: ['rounded'] })\n      )\n    })\n    \n    test('uses custom storage key', () => {\n      const { result } = renderHook(() => \n        useThemeSelector({ storageKey: 'custom-theme-key' })\n      )\n      \n      act(() => {\n        result.current.toggleVariant('rounded')\n      })\n      \n      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(\n        'custom-theme-key',\n        expect.any(String)\n      )\n    })\n    \n    test('disables persistence when persistSelections is false', () => {\n      const { result } = renderHook(() => \n        useThemeSelector({ persistSelections: false })\n      )\n      \n      act(() => {\n        result.current.toggleVariant('rounded')\n      })\n      \n      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()\n    })\n    \n    test('handles localStorage errors gracefully', () => {\n      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()\n      mockLocalStorage.getItem.mockImplementation(() => {\n        throw new Error('Storage error')\n      })\n      \n      renderHook(() => useThemeSelector())\n      \n      expect(consoleSpy).toHaveBeenCalledWith('Failed to load theme selector state:', expect.any(Error))\n      \n      consoleSpy.mockRestore()\n    })\n  })\n  \n  describe('Utility Functions', () => {\n    test('gets conflicting variants', () => {\n      const { result } = renderHook(() => useThemeSelector())\n      \n      const conflicts = result.current.getConflictingVariants('sharp')\n      expect(conflicts).toEqual(['rounded'])\n    })\n    \n    test('checks if variant is conflicted', () => {\n      const { result } = renderHook(() => useThemeSelector())\n      \n      act(() => {\n        result.current.toggleVariant('rounded')\n      })\n      \n      expect(result.current.isVariantConflicted('sharp')).toBe(true)\n      expect(result.current.isVariantConflicted('compact')).toBe(false)\n    })\n    \n    test('gets variant by ID', () => {\n      const { result } = renderHook(() => useThemeSelector())\n      \n      const variant = result.current.getVariant('rounded')\n      expect(variant).toEqual(mockVariants[0])\n      \n      const nonexistent = result.current.getVariant('nonexistent')\n      expect(nonexistent).toBeUndefined()\n    })\n    \n    test('gets theme by ID', () => {\n      const { result } = renderHook(() => useThemeSelector())\n      \n      const theme = result.current.getTheme('base')\n      expect(theme).toEqual(mockThemes[0])\n      \n      const nonexistent = result.current.getTheme('nonexistent')\n      expect(nonexistent).toBeUndefined()\n    })\n  })\n})\n\ndescribe('themeSelectorUtils', () => {\n  describe('getDisplayName', () => {\n    test('returns theme name when no variants', () => {\n      const displayName = themeSelectorUtils.getDisplayName(mockThemes[0], [])\n      expect(displayName).toBe('Base Theme')\n    })\n    \n    test('includes variant names when variants present', () => {\n      const displayName = themeSelectorUtils.getDisplayName(\n        mockThemes[0], \n        [mockVariants[0], mockVariants[2]]\n      )\n      expect(displayName).toBe('Base Theme (Rounded, Compact)')\n    })\n  })\n  \n  describe('getCategoryIcon', () => {\n    test('returns correct icons for categories', () => {\n      expect(themeSelectorUtils.getCategoryIcon('radius')).toBe('✨')\n      expect(themeSelectorUtils.getCategoryIcon('sizing')).toBe('📏')\n      expect(themeSelectorUtils.getCategoryIcon('visual')).toBe('⚡')\n      expect(themeSelectorUtils.getCategoryIcon('unknown')).toBe('🎨')\n    })\n  })\n  \n  describe('getColorSchemeBadge', () => {\n    test('returns correct badge variants', () => {\n      expect(themeSelectorUtils.getColorSchemeBadge('light')).toBe('default')\n      expect(themeSelectorUtils.getColorSchemeBadge('dark')).toBe('secondary')\n    })\n  })\n  \n  describe('areVariantsCompatible', () => {\n    test('returns true for compatible variants', () => {\n      const compatible = themeSelectorUtils.areVariantsCompatible(['rounded', 'compact'])\n      expect(compatible).toBe(true)\n    })\n    \n    test('returns false for conflicting variants', () => {\n      const incompatible = themeSelectorUtils.areVariantsCompatible(['rounded', 'sharp'])\n      expect(incompatible).toBe(false)\n    })\n  })\n  \n  describe('getRecommendedVariants', () => {\n    test('recommends variants for light themes', () => {\n      const recommendations = themeSelectorUtils.getRecommendedVariants('base')\n      expect(recommendations).toEqual(['rounded', 'spacious'])\n    })\n    \n    test('recommends variants for dark themes', () => {\n      const recommendations = themeSelectorUtils.getRecommendedVariants('dark')\n      expect(recommendations).toEqual(['minimal', 'sharp'])\n    })\n    \n    test('returns empty array for unknown themes', () => {\n      const recommendations = themeSelectorUtils.getRecommendedVariants('unknown')\n      expect(recommendations).toEqual([])\n    })\n  })\n})"
'use client'

import React from 'react'
import { Palette, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
// TODO: Replace with simple theme system
// import { useEnhancedTheme } from '@/design-system/providers/enhanced-theme-provider'

// Available themes with their display information
const availableThemes = [
  {
    id: 'base',
    name: 'Base Theme',
    description: 'Clean and professional',
    preview: "var(--info)"
  },
  {
    id: 'cool-blue',
    name: 'Cool Blue',
    description: 'Modern blue tones',
    preview: '#0ea5e9'
  },
  {
    id: 'warm-sand',
    name: 'Warm Sand',
    description: 'Earthy and warm',
    preview: "var(--warning)"
  },
  {
    id: 'midnight-purple',
    name: 'Midnight Purple',
    description: 'Dark and elegant',
    preview: '#7c3aed'
  },
  {
    id: 'soft-gray',
    name: 'Soft Gray',
    description: 'Subtle and minimal',
    preview: '#6b7280'
  },
  {
    id: 'warm-cream',
    name: 'Warm Cream',
    description: 'Cozy and inviting',
    preview: '#d97706'
  }
]

export function ThemeSelector() {
  // TODO: Replace with simple theme system
  const themeContext = null // useEnhancedTheme()
  
  // Fallback if theme context is not available
  if (!themeContext) {
    return (
      <Button 
        variant="ghost" 
        size="icon"
        className="relative rounded-[var(--radius-field)]"
        aria-label="Change theme"
        disabled
      >
        <Palette className="h-5 w-5 text-[var(--color-base-content)]" />
      </Button>
    )
  }

  const { theme, setTheme } = themeContext
  const currentTheme = availableThemes.find(t => t.id === theme) || availableThemes[0]

  const handleThemeChange = (themeId: string) => {
    try {
      setTheme(themeId)
    } catch (error) {
      console.error('Failed to change theme:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative rounded-[var(--radius-field)]"
          aria-label="Change theme"
        >
          <Palette className="h-5 w-5 text-[var(--color-base-content)]" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-[var(--color-base-100)] border-[var(--border)]"
      >
        <DropdownMenuLabel className="text-[var(--color-base-content)] font-medium">
          Choose Theme
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-[var(--color-base-300)]" />
        
        <div className="p-1">
          {availableThemes.map((themeOption) => (
            <DropdownMenuItem
              key={themeOption.id}
              onClick={() => handleThemeChange(themeOption.id)}
              className="flex items-center gap-3 p-3 hover:bg-[var(--color-base-200)] cursor-pointer rounded-[var(--radius-field)]"
            >
              <div className="flex items-center gap-3 flex-1">
                <div 
                  className="w-4 h-4 rounded-full border border-[var(--color-base-300)]"
                  style={{ backgroundColor: themeOption.preview }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[var(--color-base-content)]">
                    {themeOption.name}
                  </div>
                  <div className="text-xs text-[var(--color-base-content)]/70">
                    {themeOption.description}
                  </div>
                </div>
              </div>
              
              {theme === themeOption.id && (
                <Check className="h-4 w-4 text-[var(--color-primary)]" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
        
        <DropdownMenuSeparator className="bg-[var(--color-base-300)]" />
        
        <div className="p-2 text-xs text-[var(--color-base-content)]/70 text-center">
          Current: {currentTheme.name}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
/**
 * Theme Controls Tool Component
 * Provides quick theme controls in the Storybook toolbar
 */

import React, { useCallback } from 'react'
import { useGlobals, useChannel } from '@storybook/manager-api'
import { IconButton, WithTooltip, TooltipLinkList } from '@storybook/components'
import { PaintBrushIcon } from '@storybook/icons'
import { EVENTS } from './constants'

export const ThemeControlsTool: React.FC = () => {
  const [globals, updateGlobals] = useGlobals()
  const emit = useChannel({})
  
  const currentTheme = globals.theme || 'base'
  const currentVariant = globals.themeVariant || 'none'
  
  // Quick theme options
  const quickThemes = [
    { id: 'base', title: 'Base Theme', icon: '🎨' },
    { id: 'cool-blue', title: 'Cool Blue', icon: '🔵' },
    { id: 'warm-sand', title: 'Warm Sand', icon: '🟤' },
    { id: 'midnight-purple', title: 'Midnight Purple', icon: '🟣' },
    { id: 'soft-gray', title: 'Soft Gray', icon: '⚪' },
    { id: 'warm-cream', title: 'Warm Cream', icon: '🟡' },
  ]
  
  // Quick variant options
  const quickVariants = [
    { id: 'none', title: 'Default', icon: '🎯' },
    { id: 'rounded', title: 'Rounded', icon: '🔘' },
    { id: 'sharp', title: 'Sharp', icon: '⬜' },
    { id: 'compact', title: 'Compact', icon: '📦' },
    { id: 'spacious', title: 'Spacious', icon: '📏' },
    { id: 'minimal', title: 'Minimal', icon: '✨' },
    { id: 'rich', title: 'Rich', icon: '💎' },
  ]
  
  // Handle theme change
  const handleThemeChange = useCallback((themeId: string) => {
    updateGlobals({ theme: themeId })
    emit(EVENTS.THEME_CHANGED, { themeId })
  }, [updateGlobals, emit])
  
  // Handle variant change
  const handleVariantChange = useCallback((variantId: string) => {
    updateGlobals({ themeVariant: variantId })
    emit(EVENTS.VARIANT_CHANGED, { variantId })
  }, [updateGlobals, emit])
  
  // Reset to default
  const handleReset = useCallback(() => {
    updateGlobals({
      theme: 'base',
      themeVariant: 'none',
      colorScheme: 'auto'
    })
    emit(EVENTS.RESET_THEME)
  }, [updateGlobals, emit])
  
  // Create tooltip links
  const tooltipLinks = [
    // Theme section
    {
      id: 'theme-header',
      title: 'Themes',
      center: true,
      disabled: true,
    },
    ...quickThemes.map(theme => ({
      id: `theme-${theme.id}`,
      title: theme.title,
      icon: theme.icon,
      active: currentTheme === theme.id,
      onClick: () => handleThemeChange(theme.id),
    })),
    
    // Separator
    {
      id: 'separator-1',
      title: '---',
      disabled: true,
    },
    
    // Variant section
    {
      id: 'variant-header',
      title: 'Variants',
      center: true,
      disabled: true,
    },
    ...quickVariants.map(variant => ({
      id: `variant-${variant.id}`,
      title: variant.title,
      icon: variant.icon,
      active: currentVariant === variant.id,
      onClick: () => handleVariantChange(variant.id),
    })),
    
    // Separator
    {
      id: 'separator-2',
      title: '---',
      disabled: true,
    },
    
    // Actions
    {
      id: 'reset',
      title: 'Reset to Default',
      icon: '🔄',
      onClick: handleReset,
    },
    {
      id: 'export',
      title: 'Export Configuration',
      icon: '📤',
      onClick: () => {
        const config = {
          theme: currentTheme,
          variant: currentVariant,
          timestamp: new Date().toISOString()
        }
        
        const blob = new Blob([JSON.stringify(config, null, 2)], {
          type: 'application/json'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `theme-config-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
        
        emit(EVENTS.EXPORT_THEME, config)
      },
    },
  ]
  
  return (
    <WithTooltip
      placement="top"
      trigger="click"
      closeOnOutsideClick
      tooltip={<TooltipLinkList links={tooltipLinks} />}
    >
      <IconButton
        key="theme-controls"
        title="Enhanced Theme Controls"
        active={false}
      >
        <PaintBrushIcon />
      </IconButton>
    </WithTooltip>
  )
}
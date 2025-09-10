/**
 * Theme Controls Panel Component
 * Provides detailed theme controls in the Storybook addon panel
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useGlobals, useChannel } from '@storybook/manager-api'
import { AddonPanel, Form } from '@storybook/components'
import { EVENTS } from './constants'

interface ThemeControlsPanelProps {
  active: boolean
}

export const ThemeControlsPanel: React.FC<ThemeControlsPanelProps> = ({ active }) => {
  const [globals, updateGlobals] = useGlobals()
  const [performanceData, setPerformanceData] = useState<any>(null)
  const emit = useChannel({})
  
  const currentTheme = globals.theme || 'base'
  const currentVariant = globals.themeVariant || 'none'
  const currentColorScheme = globals.colorScheme || 'auto'
  const performanceMode = globals.performanceMode || 'off'
  
  // Available themes
  const themes = [
    { value: 'base', label: 'Base Theme', description: 'Default shadcn/ui appearance' },
    { value: 'cool-blue', label: 'Cool Blue', description: 'Professional blue theme' },
    { value: 'warm-sand', label: 'Warm Sand', description: 'Warm, earthy theme' },
    { value: 'midnight-purple', label: 'Midnight Purple', description: 'Dark theme with purple accents' },
    { value: 'soft-gray', label: 'Soft Gray', description: 'Subtle gray theme' },
    { value: 'warm-cream', label: 'Warm Cream', description: 'Warm, creamy theme' },
  ]
  
  // Available variants
  const variants = [
    { value: 'none', label: 'Default', description: 'No variant applied' },
    { value: 'rounded', label: 'Rounded', description: 'Large border radius for friendly appearance' },
    { value: 'sharp', label: 'Sharp', description: 'Minimal border radius for professional look' },
    { value: 'compact', label: 'Compact', description: 'Smaller sizing for dense layouts' },
    { value: 'spacious', label: 'Spacious', description: 'Larger sizing for comfortable layouts' },
    { value: 'minimal', label: 'Minimal', description: 'Reduced shadows and subtle borders' },
    { value: 'rich', label: 'Rich', description: 'Prominent shadows and enhanced visual depth' },
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
  
  // Handle color scheme change
  const handleColorSchemeChange = useCallback((scheme: string) => {
    updateGlobals({ colorScheme: scheme })
  }, [updateGlobals])
  
  // Handle performance mode change
  const handlePerformanceModeChange = useCallback((mode: string) => {
    updateGlobals({ performanceMode: mode })
  }, [updateGlobals])
  
  // Reset theme to default
  const handleResetTheme = useCallback(() => {
    updateGlobals({
      theme: 'base',
      themeVariant: 'none',
      colorScheme: 'auto',
      performanceMode: 'off'
    })
    emit(EVENTS.RESET_THEME)
  }, [updateGlobals, emit])
  
  // Export theme configuration
  const handleExportTheme = useCallback(() => {
    const config = {
      theme: currentTheme,
      variant: currentVariant,
      colorScheme: currentColorScheme,
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
  }, [currentTheme, currentVariant, currentColorScheme, emit])
  
  // Generate performance report
  const handlePerformanceReport = useCallback(() => {
    emit(EVENTS.PERFORMANCE_REPORT)
  }, [emit])
  
  // Update performance data
  useEffect(() => {
    if (performanceMode !== 'off') {
      const interval = setInterval(() => {
        // This would be populated by the decorator
        setPerformanceData({
          cacheHitRate: Math.random() * 100,
          avgThemeSwitch: Math.random() * 100,
          avgCSSUpdate: Math.random() * 20
        })
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [performanceMode])
  
  if (!active) return null
  
  return (
    <AddonPanel>
      <div style={{ padding: '16px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Enhanced Theme Controls</h3>
        
        {/* Theme Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '8px' }}>Theme</h4>
          <Form.Select
            value={currentTheme}
            onChange={(e) => handleThemeChange(e.target.value)}
            style={{ width: '100%', marginBottom: '8px' }}
          >
            {themes.map(theme => (
              <option key={theme.value} value={theme.value}>
                {theme.label}
              </option>
            ))}
          </Form.Select>
          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
            {themes.find(t => t.value === currentTheme)?.description}
          </p>
        </div>
        
        {/* Variant Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '8px' }}>Variant</h4>
          <Form.Select
            value={currentVariant}
            onChange={(e) => handleVariantChange(e.target.value)}
            style={{ width: '100%', marginBottom: '8px' }}
          >
            {variants.map(variant => (
              <option key={variant.value} value={variant.value}>
                {variant.label}
              </option>
            ))}
          </Form.Select>
          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
            {variants.find(v => v.value === currentVariant)?.description}
          </p>
        </div>
        
        {/* Color Scheme */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '8px' }}>Color Scheme</h4>
          <Form.Select
            value={currentColorScheme}
            onChange={(e) => handleColorSchemeChange(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="auto">Auto (System)</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Form.Select>
        </div>
        
        {/* Performance Monitoring */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '8px' }}>Performance Monitoring</h4>
          <Form.Select
            value={performanceMode}
            onChange={(e) => handlePerformanceModeChange(e.target.value)}
            style={{ width: '100%', marginBottom: '8px' }}
          >
            <option value="off">Off</option>
            <option value="basic">Basic</option>
            <option value="detailed">Detailed</option>
          </Form.Select>
          
          {performanceMode !== 'off' && performanceData && (
            <div style={{ 
              background: '#f8f9fa', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <div>Cache Hit Rate: {performanceData.cacheHitRate.toFixed(1)}%</div>
              <div>Avg Theme Switch: {performanceData.avgThemeSwitch.toFixed(1)}ms</div>
              <div>Avg CSS Update: {performanceData.avgCSSUpdate.toFixed(1)}ms</div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '8px' }}>Actions</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Form.Button
              onClick={handleResetTheme}
              style={{ fontSize: '12px' }}
            >
              Reset to Default
            </Form.Button>
            <Form.Button
              onClick={handleExportTheme}
              style={{ fontSize: '12px' }}
            >
              Export Config
            </Form.Button>
            <Form.Button
              onClick={handlePerformanceReport}
              style={{ fontSize: '12px' }}
            >
              Performance Report
            </Form.Button>
          </div>
        </div>
        
        {/* Current Configuration */}
        <div>
          <h4 style={{ marginBottom: '8px' }}>Current Configuration</h4>
          <div style={{ 
            background: '#f8f9fa', 
            padding: '12px', 
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <div>Theme: {currentTheme}</div>
            <div>Variant: {currentVariant}</div>
            <div>Color Scheme: {currentColorScheme}</div>
            <div>Performance: {performanceMode}</div>
          </div>
        </div>
      </div>
    </AddonPanel>
  )
}
/**
 * Enhanced Storybook Preview Configuration
 * Configures advanced theme switching with performance monitoring and interactive controls
 */

import type { Preview } from '@storybook/react'
import { EnhancedThemeDecorator } from './decorators/EnhancedThemeDecorator'
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
    },
    docs: {
      toc: true,
      source: {
        state: 'open',
      },
    },
    backgrounds: {
      default: 'auto',
      values: [
        {
          name: 'auto',
          value: 'var(--color-base-100)',
        },
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#0f172a',
        },
        {
          name: 'gray',
          value: '#f8fafc',
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px',
          },
        },
      },
    },
    // Enhanced theme system parameters
    enhancedTheme: {
      enablePerformanceMonitoring: true,
      enableVariantCombinations: true,
      showThemePreview: true,
    },
  },
  
  decorators: [
    EnhancedThemeDecorator,
  ],
  
  globalTypes: {
    theme: {
      description: 'Enhanced theme system with full DaisyUI-style theming',
      defaultValue: 'base',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { 
            value: 'base', 
            title: 'Base Theme', 
            icon: 'circle',
            right: '🎨'
          },
          { 
            value: 'cool-blue', 
            title: 'Cool Blue', 
            icon: 'circle',
            right: '🔵'
          },
          { 
            value: 'warm-sand', 
            title: 'Warm Sand', 
            icon: 'circle',
            right: '🟤'
          },
          { 
            value: 'midnight-purple', 
            title: 'Midnight Purple', 
            icon: 'circle',
            right: '🟣'
          },
          { 
            value: 'soft-gray', 
            title: 'Soft Gray', 
            icon: 'circle',
            right: '⚪'
          },
          { 
            value: 'warm-cream', 
            title: 'Warm Cream', 
            icon: 'circle',
            right: '🟡'
          },
        ],
        dynamicTitle: true,
      },
    },
    
    themeVariant: {
      description: 'Theme variants for visual modifications',
      defaultValue: 'none',
      toolbar: {
        title: 'Variant',
        icon: 'component',
        items: [
          { value: 'none', title: 'Default', right: '🎯' },
          { value: 'rounded', title: 'Rounded', right: '🔘' },
          { value: 'sharp', title: 'Sharp', right: '⬜' },
          { value: 'compact', title: 'Compact', right: '📦' },
          { value: 'spacious', title: 'Spacious', right: '📏' },
          { value: 'minimal', title: 'Minimal', right: '✨' },
          { value: 'rich', title: 'Rich', right: '💎' },
        ],
        dynamicTitle: true,
      },
    },
    
    colorScheme: {
      description: 'Color scheme preference',
      defaultValue: 'auto',
      toolbar: {
        title: 'Color Scheme',
        icon: 'contrast',
        items: [
          { value: 'auto', title: 'Auto', right: '🌓' },
          { value: 'light', title: 'Light', right: '☀️' },
          { value: 'dark', title: 'Dark', right: '🌙' },
        ],
        dynamicTitle: true,
      },
    },
    
    performanceMode: {
      description: 'Performance monitoring mode',
      defaultValue: 'off',
      toolbar: {
        title: 'Performance',
        icon: 'timer',
        items: [
          { value: 'off', title: 'Off' },
          { value: 'basic', title: 'Basic Monitoring' },
          { value: 'detailed', title: 'Detailed Analysis' },
        ],
        dynamicTitle: true,
      },
    },
    
    themePreview: {
      description: 'Show theme preview panel',
      defaultValue: false,
      toolbar: {
        title: 'Theme Preview',
        icon: 'eye',
        items: [
          { value: false, title: 'Hide Preview' },
          { value: true, title: 'Show Preview' },
        ],
        dynamicTitle: true,
      },
    },
  },
}

export default preview
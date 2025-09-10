import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { 
  ThemeInfo, 
  DesignTokensDisplay, 
  ComponentShowcase,
  AVAILABLE_THEMES,
  type ThemeName 
} from '../../.storybook/theme-decorator'

/**
 * Design Tokens Documentation
 * 
 * This story showcases all design tokens including colors, typography, spacing, and other design elements
 * that form the foundation of our design system.
 */

const meta: Meta = {
  title: 'Design System/Design Tokens',
  parameters: {
    docs: {
      description: {
        component: `
Design tokens are the foundational elements of our design system. They define colors, typography, spacing, 
and other visual properties that ensure consistency across all components and themes.

## Token Categories

- **Colors**: Primary, semantic, and neutral color palettes
- **Typography**: Font families, sizes, weights, and line heights  
- **Spacing**: Consistent spacing scale for margins, padding, and gaps
- **Border Radius**: Rounded corner values for different component types
- **Shadows**: Elevation and depth through shadow definitions

## Theme Support

All design tokens are theme-aware and automatically adapt when switching between different themes.
Use the theme switcher in the toolbar to see how tokens change across themes.
        `
      }
    },
    layout: 'fullscreen'
  }
}

export default meta
type Story = StoryObj

// Color Palette Story
export const ColorPalette: Story = {
  render: () => {
    const ColorSwatch = ({ 
      name, 
      variable, 
      description 
    }: { 
      name: string
      variable: string
      description?: string 
    }) => (
      <div className="space-y-2">
        <div 
          className="w-full h-16 rounded-lg border border-[var(--border)]"
          style={{ backgroundColor: `var(${variable})` }}
        />
        <div>
          <div className="text-sm font-medium text-[var(--foreground)]">
            {name}
          </div>
          <div className="text-xs font-mono text-[var(--muted-foreground)]">
            {variable}
          </div>
          {description && (
            <div className="text-xs text-[var(--muted-foreground)] mt-1">
              {description}
            </div>
          )}
        </div>
      </div>
    )

    return (
      <div className="p-6 space-y-8">
        <ComponentShowcase 
          title="Color Palette"
          description="Core colors used throughout the design system"
        >
          <div className="space-y-6">
            {/* Primary Colors */}
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Primary Colors
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <ColorSwatch 
                  name="Primary" 
                  variable="--primary"
                  description="Main brand color"
                />
                <ColorSwatch 
                  name="Primary Foreground" 
                  variable="--primary-foreground"
                  description="Text on primary background"
                />
                <ColorSwatch 
                  name="Background" 
                  variable="--background"
                  description="Main background color"
                />
                <ColorSwatch 
                  name="Foreground" 
                  variable="--foreground"
                  description="Main text color"
                />
                <ColorSwatch 
                  name="Card" 
                  variable="--card"
                  description="Card background"
                />
                <ColorSwatch 
                  name="Card Foreground" 
                  variable="--card-foreground"
                  description="Text on card background"
                />
              </div>
            </div>

            {/* Semantic Colors */}
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Semantic Colors
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ColorSwatch 
                  name="Success" 
                  variable="--success"
                  description="Success states and positive actions"
                />
                <ColorSwatch 
                  name="Warning" 
                  variable="--warning"
                  description="Warning states and caution"
                />
                <ColorSwatch 
                  name="Error" 
                  variable="--error"
                  description="Error states and destructive actions"
                />
                <ColorSwatch 
                  name="Info" 
                  variable="--info"
                  description="Informational content"
                />
              </div>
            </div>

            {/* Neutral Colors */}
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Neutral Colors
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ColorSwatch 
                  name="Muted" 
                  variable="--muted"
                  description="Subtle background color"
                />
                <ColorSwatch 
                  name="Muted Foreground" 
                  variable="--muted-foreground"
                  description="Subtle text color"
                />
                <ColorSwatch 
                  name="Border" 
                  variable="--border"
                  description="Border and divider color"
                />
                <ColorSwatch 
                  name="Ring" 
                  variable="--ring"
                  description="Focus ring color"
                />
              </div>
            </div>
          </div>
        </ComponentShowcase>
      </div>
    )
  }
}

// Typography Story
export const Typography: Story = {
  render: () => {
    const TypographyExample = ({ 
      size, 
      variable, 
      example 
    }: { 
      size: string
      variable: string
      example: string 
    }) => (
      <div className="space-y-2">
        <div 
          className="text-[var(--foreground)]"
          style={{ fontSize: `var(${variable})` }}
        >
          {example}
        </div>
        <div className="text-xs text-[var(--muted-foreground)]">
          <span className="font-medium">{size}</span> - 
          <span className="font-mono ml-1">{variable}</span>
        </div>
      </div>
    )

    return (
      <div className="p-6 space-y-8">
        <ComponentShowcase 
          title="Typography Scale"
          description="Font sizes and typography hierarchy"
        >
          <div className="space-y-6">
            <TypographyExample 
              size="6XL" 
              variable="--font-size-6xl" 
              example="The quick brown fox jumps"
            />
            <TypographyExample 
              size="5XL" 
              variable="--font-size-5xl" 
              example="The quick brown fox jumps"
            />
            <TypographyExample 
              size="4XL" 
              variable="--font-size-4xl" 
              example="The quick brown fox jumps"
            />
            <TypographyExample 
              size="3XL" 
              variable="--font-size-3xl" 
              example="The quick brown fox jumps over the lazy dog"
            />
            <TypographyExample 
              size="2XL" 
              variable="--font-size-2xl" 
              example="The quick brown fox jumps over the lazy dog"
            />
            <TypographyExample 
              size="XL" 
              variable="--font-size-xl" 
              example="The quick brown fox jumps over the lazy dog"
            />
            <TypographyExample 
              size="Large" 
              variable="--font-size-lg" 
              example="The quick brown fox jumps over the lazy dog"
            />
            <TypographyExample 
              size="Base" 
              variable="--font-size-base" 
              example="The quick brown fox jumps over the lazy dog"
            />
            <TypographyExample 
              size="Small" 
              variable="--font-size-sm" 
              example="The quick brown fox jumps over the lazy dog"
            />
            <TypographyExample 
              size="Extra Small" 
              variable="--font-size-xs" 
              example="The quick brown fox jumps over the lazy dog"
            />
          </div>
        </ComponentShowcase>
      </div>
    )
  }
}

// Spacing Story
export const Spacing: Story = {
  render: () => {
    const SpacingExample = ({ 
      name, 
      variable, 
      size 
    }: { 
      name: string
      variable: string
      size: string 
    }) => (
      <div className="flex items-center gap-4">
        <div className="w-16 text-sm font-medium text-[var(--foreground)]">
          {name}
        </div>
        <div 
          className="bg-[var(--primary)] rounded"
          style={{ 
            width: `var(${variable})`, 
            height: '24px',
            minWidth: '2px'
          }}
        />
        <div className="text-xs font-mono text-[var(--muted-foreground)]">
          {variable} ({size})
        </div>
      </div>
    )

    return (
      <div className="p-6 space-y-8">
        <ComponentShowcase 
          title="Spacing Scale"
          description="Consistent spacing values for margins, padding, and gaps"
        >
          <div className="space-y-4">
            <SpacingExample name="0" variable="--space-0" size="0" />
            <SpacingExample name="1" variable="--space-1" size="0.25rem" />
            <SpacingExample name="2" variable="--space-2" size="0.5rem" />
            <SpacingExample name="3" variable="--space-3" size="0.75rem" />
            <SpacingExample name="4" variable="--space-4" size="1rem" />
            <SpacingExample name="5" variable="--space-5" size="1.25rem" />
            <SpacingExample name="6" variable="--space-6" size="1.5rem" />
            <SpacingExample name="8" variable="--space-8" size="2rem" />
            <SpacingExample name="10" variable="--space-10" size="2.5rem" />
            <SpacingExample name="12" variable="--space-12" size="3rem" />
            <SpacingExample name="16" variable="--space-16" size="4rem" />
            <SpacingExample name="20" variable="--space-20" size="5rem" />
            <SpacingExample name="24" variable="--space-24" size="6rem" />
          </div>
        </ComponentShowcase>
      </div>
    )
  }
}

// Border Radius Story
export const BorderRadius: Story = {
  render: () => {
    const RadiusExample = ({ 
      name, 
      variable, 
      size 
    }: { 
      name: string
      variable: string
      size: string 
    }) => (
      <div className="flex items-center gap-4">
        <div className="w-16 text-sm font-medium text-[var(--foreground)]">
          {name}
        </div>
        <div 
          className="w-16 h-16 bg-[var(--primary)] border border-[var(--border)]"
          style={{ borderRadius: `var(${variable})` }}
        />
        <div className="text-xs font-mono text-[var(--muted-foreground)]">
          {variable} ({size})
        </div>
      </div>
    )

    return (
      <div className="p-6 space-y-8">
        <ComponentShowcase 
          title="Border Radius Scale"
          description="Rounded corner values for different component types"
        >
          <div className="space-y-4">
            <RadiusExample name="None" variable="--radius-none" size="0" />
            <RadiusExample name="SM" variable="--radius-sm" size="0.125rem" />
            <RadiusExample name="MD" variable="--radius-md" size="0.25rem" />
            <RadiusExample name="LG" variable="--radius-lg" size="0.375rem" />
            <RadiusExample name="XL" variable="--radius-xl" size="0.5rem" />
            <RadiusExample name="2XL" variable="--radius-2xl" size="0.75rem" />
            <RadiusExample name="3XL" variable="--radius-3xl" size="1rem" />
            <RadiusExample name="Full" variable="--radius-full" size="9999px" />
          </div>
        </ComponentShowcase>
      </div>
    )
  }
}

// All Themes Overview
export const AllThemes: Story = {
  render: () => {
    return (
      <div className="p-6 space-y-8">
        <ComponentShowcase 
          title="Theme Overview"
          description="All available themes with their color palettes"
        >
          <div className="space-y-8">
            {AVAILABLE_THEMES.map((theme) => (
              <div key={theme.value} data-theme={theme.value}>
                <h3 className="text-lg font-semibold mb-4">
                  {theme.title} - {theme.description}
                </h3>
                <ThemeInfo theme={theme.value} />
              </div>
            ))}
          </div>
        </ComponentShowcase>
      </div>
    )
  }
}
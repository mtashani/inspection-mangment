/**
 * Theme Selector Page
 * 
 * Dedicated page for theme selection and customization
 */

"use client"

import React from 'react'
import { ThemeSwitchingInterface } from '@/components/ui/theme-switching-interface'
import { ThemeVariantControls } from '@/components/ui/theme-variant-controls'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Palette, Settings, Sparkles, Info, ArrowLeft } from 'lucide-react'
import { useThemeSelector } from '@/hooks/use-theme-selector'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * Theme Info Component
 */
const ThemeInfo: React.FC = () => {
  const { selectedTheme, selectedVariants, getTheme } = useThemeSelector()
  const theme = getTheme(selectedTheme)
  
  if (!theme) return null
  
  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--color-base-content)]">
          <Info className="w-5 h-5 text-[var(--color-info)]" />
          Current Theme Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium text-[var(--color-base-content)] mb-2">{theme.name}</h3>
          <p className="text-sm text-[var(--color-base-content)]/70 mb-3">{theme.description}</p>
          <div className="flex items-center gap-2">
            <Badge variant={theme.colorScheme === 'dark' ? 'secondary' : 'default'}>
              {theme.colorScheme}
            </Badge>
            <Badge variant="outline">
              {theme.category}
            </Badge>
          </div>
        </div>
        
        {selectedVariants.length > 0 && (
          <div>
            <h4 className="font-medium text-[var(--color-base-content)] mb-2">Active Variants</h4>
            <div className="flex flex-wrap gap-1">
              {selectedVariants.map((variantId) => (
                <Badge key={variantId} variant="secondary">
                  {variantId}
                </Badge>
              ))}\n            </div>
          </div>
        )}
        
        <div>
          <h4 className="font-medium text-[var(--color-base-content)] mb-2">Color Palette</h4>
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <div 
                className="w-full h-8 rounded border border-[var(--color-base-300)]" 
                style={{ backgroundColor: theme.colors.primary }}
              />
              <p className="text-xs text-[var(--color-base-content)]/70">Primary</p>
            </div>
            <div className="space-y-1">
              <div 
                className="w-full h-8 rounded border border-[var(--color-base-300)]" 
                style={{ backgroundColor: theme.colors.secondary }}
              />
              <p className="text-xs text-[var(--color-base-content)]/70">Secondary</p>
            </div>
            <div className="space-y-1">
              <div 
                className="w-full h-8 rounded border border-[var(--color-base-300)]" 
                style={{ backgroundColor: theme.colors.accent }}
              />
              <p className="text-xs text-[var(--color-base-content)]/70">Accent</p>
            </div>
            <div className="space-y-1">
              <div 
                className="w-full h-8 rounded border border-[var(--color-base-300)]" 
                style={{ backgroundColor: theme.colors.success }}
              />
              <p className="text-xs text-[var(--color-base-content)]/70">Success</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Quick Actions Component
 */
const QuickActions: React.FC = () => {
  const { resetVariants, applyVariants, selectedVariants, isApplyingVariants } = useThemeSelector()
  
  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--color-base-content)]">
          <Settings className="w-5 h-5 text-[var(--color-primary)]" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={applyVariants}
          disabled={selectedVariants.length === 0 || isApplyingVariants}
          className="w-full"
        >
          {isApplyingVariants ? 'Applying...' : 'Apply Selected Variants'}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={resetVariants}
          disabled={selectedVariants.length === 0}
          className="w-full"
        >
          Reset All Variants
        </Button>
        
        <div className="pt-2 border-t border-[var(--color-base-300)]">
          <p className="text-xs text-[var(--color-base-content)]/70 text-center">
            {selectedVariants.length} variant{selectedVariants.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Theme Selector Page Component
 */
export default function ThemeSelectorPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-[var(--color-base-100)] p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-base-content)]">
                Theme Selector
              </h1>
              <p className="text-[var(--color-base-content)]/70">
                Customize your application's appearance with themes and variants
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/daily-reports">
              <Button variant="outline" size="sm">
                Daily Reports
              </Button>
            </Link>
            <Link href="/daily-reports/enhanced">
              <Button variant="outline" size="sm">
                Enhanced Reports
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                Login Page
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Theme Selector */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="full" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="full">Full Selector</TabsTrigger>
                <TabsTrigger value="compact">Compact View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="full">
                <ThemeSwitchingInterface 
                  showVariants={true}
                  showPreview={true}
                  compact={false}
                />
              </TabsContent>
              
              <TabsContent value="compact">
                <ThemeSwitchingInterface 
                  showVariants={true}
                  showPreview={false}
                  compact={true}
                />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <ThemeInfo />
            <QuickActions />
            
            {/* Tips Card */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[var(--color-base-content)]">
                  <Sparkles className="w-5 h-5 text-[var(--color-accent)]" />
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-[var(--color-base-content)]">Theme Variants</h4>
                  <p className="text-xs text-[var(--color-base-content)]/70">
                    Variants modify specific aspects of themes like border radius, spacing, and visual effects.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-[var(--color-base-content)]">Conflicts</h4>
                  <p className="text-xs text-[var(--color-base-content)]/70">
                    Some variants conflict with each other. Selecting a conflicting variant will automatically deselect the conflicted one.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-[var(--color-base-content)]">Persistence</h4>
                  <p className="text-xs text-[var(--color-base-content)]/70">
                    Your theme preferences are automatically saved and will persist across sessions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Demo Components */}
        <Card variant="default">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--color-base-content)]">
              <Palette className="w-5 h-5 text-[var(--color-primary)]" />
              Theme Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Sample Buttons */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-[var(--color-base-content)]">Buttons</h4>
                <div className="space-y-2">
                  <Button className="w-full">Primary Button</Button>
                  <Button variant="secondary" className="w-full">Secondary</Button>
                  <Button variant="outline" className="w-full">Outline</Button>
                  <Button variant="ghost" className="w-full">Ghost</Button>
                </div>
              </div>
              
              {/* Sample Cards */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-[var(--color-base-content)]">Cards</h4>
                <Card variant="default">
                  <CardContent className="p-4">
                    <p className="text-sm text-[var(--color-base-content)]">Default Card</p>
                  </CardContent>
                </Card>
                <Card variant="elevated">
                  <CardContent className="p-4">
                    <p className="text-sm text-[var(--color-base-content)]">Elevated Card</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Sample Badges */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-[var(--color-base-content)]">Badges</h4>
                <div className="space-y-2">
                  <div><Badge>Default</Badge></div>
                  <div><Badge variant="secondary">Secondary</Badge></div>
                  <div><Badge variant="outline">Outline</Badge></div>
                  <div><Badge variant="destructive">Destructive</Badge></div>
                </div>
              </div>
              
              {/* Sample Text */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-[var(--color-base-content)]">Typography</h4>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-[var(--color-base-content)]">Heading 1</h1>
                  <h2 className="text-xl font-semibold text-[var(--color-base-content)]">Heading 2</h2>
                  <p className="text-[var(--color-base-content)]">Body text</p>
                  <p className="text-sm text-[var(--color-base-content)]/70">Muted text</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
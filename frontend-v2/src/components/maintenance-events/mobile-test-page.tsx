'use client'

import { useState } from 'react'
import { useMobileOptimization } from '@/hooks/use-mobile-optimization'
import { 
  ResponsiveShow, 
  ResponsiveHide, 
  MobileStack, 
  TouchFriendlyButton, 
  MobileCard, 
  ResponsiveGrid 
} from '@/components/ui/responsive-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Touch, 
  Mouse, 
  Eye, 
  Grid3X3, 
  Layout,
  Zap
} from 'lucide-react'

export function MobileTestPage() {
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    isTouchDevice, 
    screenSize, 
    orientation 
  } = useMobileOptimization()

  const [touchCount, setTouchCount] = useState(0)

  const handleTouchTest = () => {
    setTouchCount(prev => prev + 1)
  }

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* Device Info Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Mobile Optimization Test Page
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              {isMobile ? <Smartphone className="h-4 w-4 text-green-600" /> : <Smartphone className="h-4 w-4 text-gray-400" />}
              <span className={isMobile ? 'text-green-600 font-medium' : 'text-gray-400'}>
                Mobile: {isMobile ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isTablet ? <Tablet className="h-4 w-4 text-blue-600" /> : <Tablet className="h-4 w-4 text-gray-400" />}
              <span className={isTablet ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                Tablet: {isTablet ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isDesktop ? <Monitor className="h-4 w-4 text-purple-600" /> : <Monitor className="h-4 w-4 text-gray-400" />}
              <span className={isDesktop ? 'text-purple-600 font-medium' : 'text-gray-400'}>
                Desktop: {isDesktop ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isTouchDevice ? <Touch className="h-4 w-4 text-orange-600" /> : <Mouse className="h-4 w-4 text-gray-400" />}
              <span className={isTouchDevice ? 'text-orange-600 font-medium' : 'text-gray-400'}>
                Touch: {isTouchDevice ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Badge variant="outline">Screen: {screenSize}</Badge>
            <Badge variant="outline">Orientation: {orientation}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Responsive Visibility Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Responsive Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResponsiveShow on="mobile">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✅ This is only visible on mobile devices</p>
            </div>
          </ResponsiveShow>
          
          <ResponsiveShow on="tablet">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-medium">✅ This is only visible on tablet devices</p>
            </div>
          </ResponsiveShow>
          
          <ResponsiveShow on="desktop">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-purple-800 font-medium">✅ This is only visible on desktop devices</p>
            </div>
          </ResponsiveShow>

          <ResponsiveHide on="mobile">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">❌ This is hidden on mobile devices</p>
            </div>
          </ResponsiveHide>
        </CardContent>
      </Card>

      {/* Touch-Friendly Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Touch className="h-5 w-5" />
            Touch-Friendly Interactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <TouchFriendlyButton 
              onClick={handleTouchTest}
              className="flex-1"
            >
              Touch Test Button (Touched: {touchCount})
            </TouchFriendlyButton>
            
            <TouchFriendlyButton 
              variant="outline"
              onClick={handleTouchTest}
              className="flex-1"
            >
              Outline Touch Button
            </TouchFriendlyButton>
            
            <TouchFriendlyButton 
              variant="ghost"
              onClick={handleTouchTest}
              className="flex-1"
            >
              Ghost Touch Button
            </TouchFriendlyButton>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {isTouchDevice 
              ? "Touch buttons have enhanced touch targets and feedback" 
              : "Regular buttons for non-touch devices"
            }
          </p>
        </CardContent>
      </Card>

      {/* Mobile Stack Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Mobile Stack Layout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MobileStack spacing="lg">
            <div className="flex-1">
              <Input placeholder="Search..." />
            </div>
            <Button variant="outline">Filter</Button>
            <Button>Search</Button>
          </MobileStack>
          <p className="text-sm text-muted-foreground mt-4">
            This layout stacks vertically on mobile and horizontally on larger screens
          </p>
        </CardContent>
      </Card>

      {/* Responsive Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Responsive Grid System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveGrid 
            cols={{ mobile: 1, tablet: 2, desktop: 3 }}
            gap="md"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <MobileCard key={i} padding="md">
                <div className="text-center">
                  <h3 className="font-medium">Card {i + 1}</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Responsive grid item
                  </p>
                </div>
              </MobileCard>
            ))}
          </ResponsiveGrid>
          <p className="text-sm text-muted-foreground mt-4">
            Grid adapts: 1 column on mobile, 2 on tablet, 3 on desktop
          </p>
        </CardContent>
      </Card>

      {/* Form Elements Test */}
      <Card>
        <CardHeader>
          <CardTitle>Mobile-Optimized Forms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <Input placeholder="Enter your name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input type="email" placeholder="Enter your email" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <Textarea 
              placeholder="Enter your message..." 
              className="min-h-[100px]"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1 sm:flex-none">Submit</Button>
            <Button variant="outline" className="flex-1 sm:flex-none">Cancel</Button>
          </div>
        </CardContent>
      </Card>

      {/* CSS Classes Test */}
      <Card>
        <CardHeader>
          <CardTitle>CSS Mobile Optimizations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mobile-padding bg-muted rounded-lg p-4">
            <p className="font-medium">Mobile Padding</p>
            <p className="text-sm text-muted-foreground">
              This container has responsive padding that adjusts for mobile
            </p>
          </div>
          
          <div className="flex mobile-stack mobile-compact">
            <Badge>Item 1</Badge>
            <Badge>Item 2</Badge>
            <Badge>Item 3</Badge>
          </div>
          
          <div className="mobile-scroll max-h-32 overflow-y-auto border rounded p-4">
            <p>Scrollable content with touch-optimized scrolling:</p>
            {Array.from({ length: 10 }).map((_, i) => (
              <p key={i} className="py-1">Line {i + 1} of scrollable content</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
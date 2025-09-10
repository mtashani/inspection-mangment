/**
 * Card Component Stories
 * Visual regression tests for Card component across all themes
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card'
import { Button } from '../button'
import { Badge } from '../badge'
import { Settings, Heart, Share, MoreHorizontal } from 'lucide-react'

const meta: Meta<typeof Card> = {
  title: 'Enhanced UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Enhanced Card component with theme variable integration and compound structure.'
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'ghost'],
      description: 'Card variant style'
    }
  },
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof Card>

// Basic variants
export const Default: Story = {
  args: {
    children: (
      <CardContent>
        <p className="text-[var(--color-base-content)]">This is a default card with basic content.</p>
      </CardContent>
    )
  }
}

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <CardContent>
        <p className="text-[var(--color-base-content)]">This is an elevated card with shadow effects.</p>
      </CardContent>
    )
  }
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: (
      <CardContent>
        <p className="text-[var(--color-base-content)]">This is a ghost card with transparent background.</p>
      </CardContent>
    )
  }
}

// Complete card structure
export const CompleteCard: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>
            This is a card description that provides additional context about the card content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-[var(--color-base-content)]">
            This is the main content area of the card. It can contain any type of content
            including text, images, forms, or other components.
          </p>
        </CardContent>
        <CardFooter>
          <Button>Action</Button>
          <Button variant="outline">Cancel</Button>
        </CardFooter>
      </>
    )
  }
}

// Card with actions
export const WithActions: Story = {
  args: {
    variant: 'elevated',
    children: (
      <>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Settings</CardTitle>
              <CardDescription>Manage your project configuration</CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-base-content)]">Public visibility</span>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-base-content)]">Team access</span>
              <Badge variant="secondary">5 members</Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share className="h-4 w-4" />
            </Button>
          </div>
          <Button>
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
        </CardFooter>
      </>
    )
  }
}

// Card with image
export const WithImage: Story = {
  args: {
    variant: 'elevated',
    className: 'w-80',
    children: (
      <>
        <div className="aspect-video bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 rounded-t-[var(--radius-box)] flex items-center justify-center">
          <div className="text-6xl">🎨</div>
        </div>
        <CardHeader>
          <CardTitle>Design System</CardTitle>
          <CardDescription>
            A comprehensive design system with theme support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-[var(--color-base-content)]">
            This design system provides consistent styling across all components
            with full theme customization support.
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Learn More</Button>
        </CardFooter>
      </>
    )
  }
}

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--color-base-content)]">Card Variants</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="default">
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--color-base-content)]">Standard card with border</p>
            </CardContent>
          </Card>
          
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--color-base-content)]">Card with shadow effects</p>
            </CardContent>
          </Card>
          
          <Card variant="ghost">
            <CardHeader>
              <CardTitle>Ghost Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--color-base-content)]">Transparent background card</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--color-base-content)]">Card Structures</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent>
              <p className="text-[var(--color-base-content)]">Content only card</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Header + Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--color-base-content)]">Card with header and content</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Complete Structure</CardTitle>
              <CardDescription>With all sections</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--color-base-content)]">Full card structure</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardContent>
              <p className="text-[var(--color-base-content)]">Content</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline">Footer only</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Theme variations
export const ThemeVariations: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-[var(--color-base-100)]">
        <h3 className="text-lg font-semibold mb-4 text-[var(--color-base-content)]">Light Theme Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Light Default</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--color-base-content)]">Default card in light theme</p>
            </CardContent>
          </Card>
          
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Light Elevated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--color-base-content)]">Elevated card with shadows</p>
            </CardContent>
          </Card>
          
          <Card variant="ghost">
            <CardHeader>
              <CardTitle>Light Ghost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--color-base-content)]">Ghost card transparency</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="p-4 rounded-lg bg-gray-900">
        <h3 className="text-lg font-semibold mb-4 text-white">Dark Theme Simulation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
            <h4 className="font-semibold text-white mb-2">Dark Default</h4>
            <p className="text-gray-300">Default card in dark theme</p>
          </div>
          
          <div className="p-4 rounded-lg bg-gray-800 shadow-lg">
            <h4 className="font-semibold text-white mb-2">Dark Elevated</h4>
            <p className="text-gray-300">Elevated card with shadows</p>
          </div>
          
          <div className="p-4 rounded-lg bg-transparent">
            <h4 className="font-semibold text-white mb-2">Dark Ghost</h4>
            <p className="text-gray-300">Ghost card transparency</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Interactive states
export const InteractiveStates: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--color-base-content)]">Hover Effects</h3>
        <p className="text-sm text-[var(--color-base-content)]/70">Hover over elevated cards to see shadow changes</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="elevated" className="cursor-pointer">
            <CardHeader>
              <CardTitle>Hoverable Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--color-base-content)]">This card has hover effects</p>
            </CardContent>
          </Card>
          
          <Card variant="elevated" className="cursor-pointer">
            <CardHeader>
              <CardTitle>Interactive Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--color-base-content)]">Hover to see shadow transition</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--color-base-content)]">Focus States</h3>
        <p className="text-sm text-[var(--color-base-content)]/70">Tab through focusable cards</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card tabIndex={0} className="focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none">
            <CardHeader>
              <CardTitle>Focusable Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--color-base-content)]">This card can receive focus</p>
            </CardContent>
          </Card>
          
          <Card tabIndex={0} className="focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none">
            <CardHeader>
              <CardTitle>Another Focusable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--color-base-content)]">Tab to focus this card</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Nested cards
export const NestedCards: Story = {
  render: () => (
    <Card variant="elevated" className="w-96">
      <CardHeader>
        <CardTitle>Parent Card</CardTitle>
        <CardDescription>This card contains nested cards</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Card variant="ghost">
          <CardContent>
            <p className="text-[var(--color-base-content)]">Nested ghost card</p>
          </CardContent>
        </Card>
        
        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-base">Nested Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--color-base-content)]">This is a nested card with header</p>
          </CardContent>
        </Card>
      </CardContent>
      <CardFooter>
        <Button>Parent Action</Button>
      </CardFooter>
    </Card>
  )
}"
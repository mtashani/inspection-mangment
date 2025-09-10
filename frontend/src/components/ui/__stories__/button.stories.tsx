/**
 * Button Component Stories
 * Visual regression tests for Button component across all themes
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../button'
import { Download, Plus, Settings, Trash2, Heart, Search } from 'lucide-react'

const meta: Meta<typeof Button> = {
  title: 'Enhanced UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Enhanced Button component with theme variable integration and multiple variants.'
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Button variant style'
    },
    size: {
      control: 'select', 
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Button size'
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button'
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state'
    }
  },
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof Button>

// Basic variants
export const Default: Story = {
  args: {
    children: 'Default Button'
  }
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete Item'
  }
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button'
  }
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button'
  }
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button'
  }
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button'
  }
}

// Size variants
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button'
  }
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button'
  }
}

export const IconButton: Story = {
  args: {
    size: 'icon',
    children: <Settings className="h-4 w-4" />,
    'aria-label': 'Settings'
  }
}

// State variants
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button'
  }
}

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading Button'
  }
}

// With icons
export const WithLeftIcon: Story = {
  args: {
    children: (
      <>
        <Download className="mr-2 h-4 w-4" />
        Download
      </>
    )
  }
}

export const WithRightIcon: Story = {
  args: {
    children: (
      <>
        Add Item
        <Plus className="ml-2 h-4 w-4" />
      </>
    )
  }
}

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--color-base-content)]">Button Variants</h3>
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--color-base-content)]">Button Sizes</h3>
        <div className="flex items-center gap-2">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon"><Settings className="h-4 w-4" /></Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--color-base-content)]">Button States</h3>
        <div className="flex gap-2">
          <Button>Normal</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--color-base-content)]">With Icons</h3>
        <div className="flex gap-2">
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button variant="ghost">
            <Heart className="mr-2 h-4 w-4" />
            Like
          </Button>
        </div>
      </div>
    </div>
  )
}

// Theme testing
export const ThemeVariations: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-[var(--color-base-100)] border border-[var(--color-base-300)]">
        <h3 className="text-lg font-semibold mb-4 text-[var(--color-base-content)]">Light Theme</h3>
        <div className="flex gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </div>
      
      <div className="p-4 rounded-lg bg-gray-900 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">Dark Theme Simulation</h3>
        <div className="flex gap-2">
          <Button style={{ backgroundColor: '#3b82f6', color: 'white' }}>Primary</Button>
          <Button style={{ backgroundColor: '#6b7280', color: 'white' }}>Secondary</Button>
          <Button style={{ border: '1px solid #6b7280', color: '#d1d5db', backgroundColor: 'transparent' }}>Outline</Button>
          <Button style={{ color: '#d1d5db', backgroundColor: 'transparent' }}>Ghost</Button>
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
        <h3 className="text-lg font-semibold text-[var(--color-base-content)]">Hover States</h3>
        <p className="text-sm text-[var(--color-base-content)]/70">Hover over buttons to see effects</p>
        <div className="flex gap-2">
          <Button className="hover:bg-[var(--color-primary)]/90">Hover Me</Button>
          <Button variant="outline" className="hover:bg-[var(--color-base-200)]">Hover Outline</Button>
          <Button variant="ghost" className="hover:bg-[var(--color-base-200)]">Hover Ghost</Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--color-base-content)]">Focus States</h3>
        <p className="text-sm text-[var(--color-base-content)]/70">Tab through buttons to see focus rings</p>
        <div className="flex gap-2">
          <Button>Focus Test 1</Button>
          <Button variant="outline">Focus Test 2</Button>
          <Button variant="ghost">Focus Test 3</Button>
        </div>
      </div>
    </div>
  )
}"
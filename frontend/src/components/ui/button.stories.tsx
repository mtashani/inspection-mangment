import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { ComponentShowcase } from '../../../.storybook/theme-decorator'
import { Heart, Download, ArrowRight, Plus, X } from 'lucide-react'

/**
 * Button Component
 * 
 * The Button component is a fundamental interactive element that triggers actions when clicked.
 * It supports multiple variants, sizes, states, and can include icons.
 */

const meta: Meta<typeof Button> = {
  title: 'Components/Primitives/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: `
The Button component is built using our standardized base component patterns and supports:

- **Multiple variants**: primary, secondary, outline, ghost, and semantic variants
- **Three sizes**: sm, md (default), lg
- **Loading states**: with built-in spinner
- **Icon support**: left and right icons
- **Accessibility**: proper ARIA attributes and keyboard navigation
- **Theme support**: automatically adapts to all themes

## Usage

\`\`\`tsx
import { Button } from '@/components/ui/button'

// Basic usage
<Button>Click me</Button>

// With variant and size
<Button variant="secondary" size="lg">Large Secondary</Button>

// With icons
<Button leftIcon={<Plus />} rightIcon={<ArrowRight />}>
  Add Item
</Button>

// Loading state
<Button loading>Processing...</Button>
\`\`\`
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'success', 'warning', 'error', 'info'],
      description: 'Visual variant of the button'
    },
    size: {
      control: 'select', 
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button'
    },
    loading: {
      control: 'boolean',
      description: 'Whether the button is in loading state'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled'
    },
    asChild: {
      control: 'boolean',
      description: 'Render as child component (using Radix Slot)'
    },
    iconOnly: {
      control: 'boolean',
      description: 'Whether this is an icon-only button'
    }
  },
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    asChild: false,
    iconOnly: false
  }
}

export default meta
type Story = StoryObj<typeof Button>

// Default Story
export const Default: Story = {}

// Variants Story
export const Variants: Story = {
  render: () => (
    <ComponentShowcase 
      title="Button Variants"
      description="Different visual styles for various use cases"
    >
      <div className="flex flex-wrap gap-4">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="success">Success</Button>
        <Button variant="warning">Warning</Button>
        <Button variant="error">Error</Button>
        <Button variant="info">Info</Button>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available button variants with their semantic meanings.'
      }
    }
  }
}

// Sizes Story
export const Sizes: Story = {
  render: () => (
    <ComponentShowcase 
      title="Button Sizes"
      description="Three available sizes for different contexts"
    >
      <div className="flex items-center gap-4">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons come in three sizes: small (sm), medium (md), and large (lg).'
      }
    }
  }
}

// With Icons Story
export const WithIcons: Story = {
  render: () => (
    <ComponentShowcase 
      title="Buttons with Icons"
      description="Icons can be placed on the left or right side of the button text"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Add Item
          </Button>
          <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
            Continue
          </Button>
          <Button 
            leftIcon={<Download className="w-4 h-4" />}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Download & Continue
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" leftIcon={<Heart className="w-4 h-4" />}>
            Like
          </Button>
          <Button variant="ghost" rightIcon={<X className="w-4 h-4" />}>
            Close
          </Button>
        </div>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons can include icons on either side of the text using the leftIcon and rightIcon props.'
      }
    }
  }
}

// Icon Only Story
export const IconOnly: Story = {
  render: () => (
    <ComponentShowcase 
      title="Icon-Only Buttons"
      description="Buttons that contain only an icon, useful for toolbars and compact interfaces"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button iconOnly size="sm">
            <Plus className="w-3 h-3" />
          </Button>
          <Button iconOnly size="md">
            <Heart className="w-4 h-4" />
          </Button>
          <Button iconOnly size="lg">
            <Download className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <Button iconOnly variant="outline">
            <Plus className="w-4 h-4" />
          </Button>
          <Button iconOnly variant="ghost">
            <X className="w-4 h-4" />
          </Button>
          <Button iconOnly variant="error">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon-only buttons are perfect for toolbars, action bars, and compact interfaces where space is limited.'
      }
    }
  }
}

// States Story
export const States: Story = {
  render: () => (
    <ComponentShowcase 
      title="Button States"
      description="Different states that buttons can be in"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <Button>Normal</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Button variant="outline">Normal Outline</Button>
          <Button variant="outline" loading>Loading Outline</Button>
          <Button variant="outline" disabled>Disabled Outline</Button>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Button variant="ghost">Normal Ghost</Button>
          <Button variant="ghost" loading>Loading Ghost</Button>
          <Button variant="ghost" disabled>Disabled Ghost</Button>
        </div>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons have different visual states: normal, loading (with spinner), and disabled.'
      }
    }
  }
}

// Interactive Story
export const Interactive: Story = {
  render: () => {
    const handleClick = () => {
      alert('Button clicked!')
    }

    return (
      <ComponentShowcase 
        title="Interactive Buttons"
        description="Click these buttons to see them in action"
      >
        <div className="flex flex-wrap gap-4">
          <Button onClick={handleClick}>
            Click Me
          </Button>
          <Button variant="secondary" onClick={handleClick}>
            Secondary Action
          </Button>
          <Button 
            variant="outline" 
            leftIcon={<Heart className="w-4 h-4" />}
            onClick={handleClick}
          >
            Like This
          </Button>
          <Button 
            variant="error" 
            rightIcon={<X className="w-4 h-4" />}
            onClick={handleClick}
          >
            Delete Item
          </Button>
        </div>
      </ComponentShowcase>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive buttons that demonstrate click handling and user feedback.'
      }
    }
  }
}

// Responsive Story
export const Responsive: Story = {
  render: () => (
    <ComponentShowcase 
      title="Responsive Button Layout"
      description="Buttons adapt to different screen sizes"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button className="w-full">Full Width Mobile</Button>
          <Button className="w-full">Responsive Grid</Button>
          <Button className="w-full">Adapts to Screen</Button>
          <Button className="w-full">Size Changes</Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="flex-1">Flexible</Button>
          <Button className="flex-1">Layout</Button>
          <Button className="flex-1">System</Button>
        </div>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons can be made responsive using CSS classes and grid/flex layouts.'
      }
    }
  }
}

// All Combinations Story
export const AllCombinations: Story = {
  render: () => (
    <div className="space-y-8">
      {(['primary', 'secondary', 'outline', 'ghost', 'success', 'warning', 'error', 'info'] as const).map((variant) => (
        <ComponentShowcase 
          key={variant}
          title={`${variant.charAt(0).toUpperCase() + variant.slice(1)} Variant`}
          description={`All sizes and states for the ${variant} variant`}
        >
          <div className="space-y-4">
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <div key={size} className="flex items-center gap-4">
                <div className="w-12 text-sm font-medium text-[var(--muted-foreground)]">
                  {size.toUpperCase()}
                </div>
                <Button variant={variant} size={size}>
                  Normal
                </Button>
                <Button variant={variant} size={size} loading>
                  Loading
                </Button>
                <Button variant={variant} size={size} disabled>
                  Disabled
                </Button>
                <Button 
                  variant={variant} 
                  size={size}
                  leftIcon={<Plus className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
                >
                  With Icon
                </Button>
              </div>
            ))}
          </div>
        </ComponentShowcase>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete overview of all button variants, sizes, and states combinations.'
      }
    }
  }
}
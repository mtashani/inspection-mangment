import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './input'
import { ComponentShowcase } from '../../../.storybook/theme-decorator'
import { Search, Mail, Lock, User, Eye, EyeOff, Calendar, Phone } from 'lucide-react'
import { useState } from 'react'

/**
 * Input Component
 * 
 * The Input component is a form element that allows users to enter text, numbers, and other data.
 * It supports multiple types, states, sizes, and can include icons.
 */

const meta: Meta<typeof Input> = {
  title: 'Components/Primitives/Input',
  component: Input,
  parameters: {
    docs: {
      description: {
        component: `
The Input component is built using our standardized form component patterns and supports:

- **Multiple types**: text, email, password, number, search, url, tel
- **Three sizes**: sm, md (default), lg
- **State management**: default, error, success, warning states
- **Icon support**: left and right elements
- **Accessibility**: proper ARIA attributes and form integration
- **Theme support**: automatically adapts to all themes

## Usage

\`\`\`tsx
import { Input } from '@/components/ui/input'

// Basic usage
<Input placeholder="Enter text..." />

// With type and size
<Input type="email" size="lg" placeholder="Enter email..." />

// With icons
<Input 
  leftElement={<Search className="w-4 h-4" />}
  placeholder="Search..."
/>

// With error state
<Input 
  error="This field is required"
  placeholder="Required field"
/>
\`\`\`
        `
      }
    }
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'url', 'tel'],
      description: 'Input type'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the input'
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'success', 'warning'],
      description: 'Visual state of the input'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled'
    },
    required: {
      control: 'boolean',
      description: 'Whether the input is required'
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text'
    }
  },
  args: {
    type: 'text',
    size: 'md',
    state: 'default',
    disabled: false,
    required: false,
    placeholder: 'Enter text...'
  }
}

export default meta
type Story = StoryObj<typeof Input>

// Default Story
export const Default: Story = {}

// Types Story
export const Types: Story = {
  render: () => (
    <ComponentShowcase 
      title="Input Types"
      description="Different input types for various data formats"
    >
      <div className="space-y-4 max-w-md">
        <Input type="text" placeholder="Text input" />
        <Input type="email" placeholder="Email input" />
        <Input type="password" placeholder="Password input" />
        <Input type="number" placeholder="Number input" />
        <Input type="search" placeholder="Search input" />
        <Input type="url" placeholder="URL input" />
        <Input type="tel" placeholder="Phone input" />
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different input types with appropriate formatting and validation.'
      }
    }
  }
}

// Sizes Story
export const Sizes: Story = {
  render: () => (
    <ComponentShowcase 
      title="Input Sizes"
      description="Three available sizes for different contexts"
    >
      <div className="space-y-4 max-w-md">
        <Input size="sm" placeholder="Small input" />
        <Input size="md" placeholder="Medium input (default)" />
        <Input size="lg" placeholder="Large input" />
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Inputs come in three sizes: small (sm), medium (md), and large (lg).'
      }
    }
  }
}

// States Story
export const States: Story = {
  render: () => (
    <ComponentShowcase 
      title="Input States"
      description="Different visual states for validation and feedback"
    >
      <div className="space-y-4 max-w-md">
        <Input state="default" placeholder="Default state" />
        <Input state="error" error="This field has an error" placeholder="Error state" />
        <Input state="success" placeholder="Success state" />
        <Input state="warning" placeholder="Warning state" />
        <Input disabled placeholder="Disabled state" />
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different states provide visual feedback for validation and user interaction.'
      }
    }
  }
}

// With Icons Story
export const WithIcons: Story = {
  render: () => (
    <ComponentShowcase 
      title="Inputs with Icons"
      description="Icons can be placed on the left or right side of the input"
    >
      <div className="space-y-4 max-w-md">
        <Input 
          leftElement={<Search className="w-4 h-4" />}
          placeholder="Search..."
        />
        <Input 
          leftElement={<Mail className="w-4 h-4" />}
          type="email"
          placeholder="Email address"
        />
        <Input 
          leftElement={<User className="w-4 h-4" />}
          placeholder="Username"
        />
        <Input 
          leftElement={<Phone className="w-4 h-4" />}
          type="tel"
          placeholder="Phone number"
        />
        <Input 
          leftElement={<Calendar className="w-4 h-4" />}
          rightElement={<Search className="w-4 h-4" />}
          placeholder="Date range"
        />
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Inputs can include icons or other elements on either side using leftElement and rightElement props.'
      }
    }
  }
}

// Password Input Example
export const PasswordInput: Story = {
  render: () => {
    const [showPassword, setShowPassword] = useState(false)
    
    return (
      <ComponentShowcase 
        title="Password Input with Toggle"
        description="Interactive password input with show/hide functionality"
      >
        <div className="max-w-md">
          <Input 
            type={showPassword ? 'text' : 'password'}
            leftElement={<Lock className="w-4 h-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            placeholder="Enter password"
          />
        </div>
      </ComponentShowcase>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'A password input with toggle visibility functionality using rightElement.'
      }
    }
  }
}

// Form Integration Story
export const FormIntegration: Story = {
  render: () => (
    <ComponentShowcase 
      title="Form Integration"
      description="Inputs integrated with form labels and validation messages"
    >
      <div className="space-y-6 max-w-md">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--foreground)]">
            Email Address *
          </label>
          <Input 
            type="email"
            leftElement={<Mail className="w-4 h-4" />}
            placeholder="Enter your email"
            required
          />
          <p className="text-xs text-[var(--muted-foreground)]">
            We'll never share your email with anyone else.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--foreground)]">
            Username
          </label>
          <Input 
            leftElement={<User className="w-4 h-4" />}
            placeholder="Choose a username"
            error="Username is already taken"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--foreground)]">
            Phone Number
          </label>
          <Input 
            type="tel"
            leftElement={<Phone className="w-4 h-4" />}
            placeholder="+1 (555) 000-0000"
            state="success"
          />
          <p className="text-xs text-[var(--success)]">
            Phone number verified successfully.
          </p>
        </div>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Inputs properly integrated with labels, help text, and validation messages.'
      }
    }
  }
}

// Search Input Example
export const SearchInput: Story = {
  render: () => {
    const [searchValue, setSearchValue] = useState('')
    
    return (
      <ComponentShowcase 
        title="Search Input"
        description="Interactive search input with real-time feedback"
      >
        <div className="space-y-4 max-w-md">
          <Input 
            type="search"
            leftElement={<Search className="w-4 h-4" />}
            placeholder="Search products..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          {searchValue && (
            <div className="text-sm text-[var(--muted-foreground)]">
              Searching for: "{searchValue}"
            </div>
          )}
        </div>
      </ComponentShowcase>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'A search input with real-time value display and interaction handling.'
      }
    }
  }
}

// Responsive Inputs
export const ResponsiveInputs: Story = {
  render: () => (
    <ComponentShowcase 
      title="Responsive Input Layout"
      description="Inputs that adapt to different screen sizes"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input placeholder="First Name" />
          <Input placeholder="Last Name" />
        </div>
        
        <Input placeholder="Email Address" className="w-full" />
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input placeholder="City" />
          <Input placeholder="State" />
          <Input placeholder="ZIP Code" />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Input placeholder="Search..." className="flex-1" />
          <button className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl hover:bg-[var(--primary)]/90 transition-colors">
            Search
          </button>
        </div>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Inputs in responsive layouts that adapt to different screen sizes.'
      }
    }
  }
}

// All Combinations Story
export const AllCombinations: Story = {
  render: () => (
    <div className="space-y-8">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <ComponentShowcase 
          key={size}
          title={`${size.toUpperCase()} Size Inputs`}
          description={`All states and types for ${size} size inputs`}
        >
          <div className="space-y-4 max-w-md">
            <Input size={size} placeholder="Default state" />
            <Input size={size} state="error" error="Error message" placeholder="Error state" />
            <Input size={size} state="success" placeholder="Success state" />
            <Input size={size} disabled placeholder="Disabled state" />
            <Input 
              size={size}
              leftElement={<Search className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
              placeholder="With icon"
            />
          </div>
        </ComponentShowcase>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete overview of all input sizes, states, and configurations.'
      }
    }
  }
}
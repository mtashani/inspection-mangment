import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './badge'
import { ComponentShowcase } from '../../../.storybook/theme-decorator'
import { Star, Check, X, AlertTriangle, Info, User, Mail, Calendar } from 'lucide-react'

/**
 * Badge Component
 * 
 * The Badge component is used to display small pieces of information like status, counts, or labels.
 * It supports multiple variants, sizes, and can include icons or be removable.
 */

const meta: Meta<typeof Badge> = {
  title: 'Components/Composite/Badge',
  component: Badge,
  parameters: {
    docs: {
      description: {
        component: `
The Badge component is built using our standardized interactive patterns and supports:

- **Multiple variants**: primary, secondary, outline, and semantic variants
- **Three sizes**: sm, md (default), lg
- **Icon support**: display icons within badges
- **Dot mode**: small circular indicators
- **Removable badges**: with close functionality
- **Theme support**: automatically adapts to all themes

## Usage

\`\`\`tsx
import { Badge } from '@/components/ui/badge'

// Basic usage
<Badge>New</Badge>

// With variant and size
<Badge variant="success" size="lg">Completed</Badge>

// With icon
<Badge icon={<Star className="w-3 h-3" />} variant="warning">
  Featured
</Badge>

// Dot badge
<Badge dot variant="error" />

// Removable badge
<Badge removable onRemove={() => console.log('removed')}>
  Removable
</Badge>
\`\`\`
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'success', 'warning', 'error', 'info'],
      description: 'Visual variant of the badge'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the badge'
    },
    dot: {
      control: 'boolean',
      description: 'Whether to render as a dot badge'
    },
    removable: {
      control: 'boolean',
      description: 'Whether the badge is removable'
    }
  },
  args: {
    children: 'Badge',
    variant: 'primary',
    size: 'md',
    dot: false,
    removable: false
  }
}

export default meta
type Story = StoryObj<typeof Badge>

// Default Story
export const Default: Story = {}

// Variants Story
export const Variants: Story = {
  render: () => (
    <ComponentShowcase 
      title="Badge Variants"
      description="Different visual styles for various use cases"
    >
      <div className="flex flex-wrap gap-4">
        <Badge variant="primary">Primary</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="error">Error</Badge>
        <Badge variant="info">Info</Badge>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available badge variants with their semantic meanings.'
      }
    }
  }
}

// Sizes Story
export const Sizes: Story = {
  render: () => (
    <ComponentShowcase 
      title="Badge Sizes"
      description="Three available sizes for different contexts"
    >
      <div className="flex items-center gap-4">
        <Badge size="sm">Small</Badge>
        <Badge size="md">Medium</Badge>
        <Badge size="lg">Large</Badge>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges come in three sizes: small (sm), medium (md), and large (lg).'
      }
    }
  }
}

// With Icons Story
export const WithIcons: Story = {
  render: () => (
    <ComponentShowcase 
      title="Badges with Icons"
      description="Icons can be included to provide additional context"
    >
      <div className="flex flex-wrap gap-4">
        <Badge icon={<Star className="w-3 h-3" />} variant="warning">
          Featured
        </Badge>
        <Badge icon={<Check className="w-3 h-3" />} variant="success">
          Verified
        </Badge>
        <Badge icon={<AlertTriangle className="w-3 h-3" />} variant="error">
          Alert
        </Badge>
        <Badge icon={<Info className="w-3 h-3" />} variant="info">
          Information
        </Badge>
        <Badge icon={<User className="w-3 h-3" />} variant="outline">
          Admin
        </Badge>
        <Badge icon={<Mail className="w-3 h-3" />} variant="secondary">
          Unread
        </Badge>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges can include icons to provide additional visual context and meaning.'
      }
    }
  }
}

// Dot Badges Story
export const DotBadges: Story = {
  render: () => (
    <ComponentShowcase 
      title="Dot Badges"
      description="Small circular indicators for status or presence"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Badge dot variant="success" />
            <span className="text-sm text-[var(--foreground)]">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge dot variant="warning" />
            <span className="text-sm text-[var(--foreground)]">Away</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge dot variant="error" />
            <span className="text-sm text-[var(--foreground)]">Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge dot variant="info" />
            <span className="text-sm text-[var(--foreground)]">Busy</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 bg-[var(--muted)] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-[var(--muted-foreground)]" />
            </div>
            <Badge dot variant="success" className="absolute -top-1 -right-1" />
          </div>
          <div className="relative">
            <div className="w-10 h-10 bg-[var(--muted)] rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-[var(--muted-foreground)]" />
            </div>
            <Badge dot variant="error" className="absolute -top-1 -right-1" />
          </div>
        </div>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dot badges are perfect for status indicators and notification dots.'
      }
    }
  }
}

// Removable Badges Story
export const RemovableBadges: Story = {
  render: () => {
    const handleRemove = (tag: string) => {
      alert(`Removed: ${tag}`)
    }

    return (
      <ComponentShowcase 
        title="Removable Badges"
        description="Badges that can be removed by clicking the close button"
      >
        <div className="flex flex-wrap gap-3">
          <Badge removable onRemove={() => handleRemove('React')}>
            React
          </Badge>
          <Badge variant="secondary" removable onRemove={() => handleRemove('TypeScript')}>
            TypeScript
          </Badge>
          <Badge variant="outline" removable onRemove={() => handleRemove('Next.js')}>
            Next.js
          </Badge>
          <Badge variant="success" removable onRemove={() => handleRemove('Tailwind')}>
            Tailwind
          </Badge>
          <Badge variant="info" removable onRemove={() => handleRemove('Storybook')}>
            Storybook
          </Badge>
        </div>
      </ComponentShowcase>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Removable badges are useful for tags, filters, and selected items that users can dismiss.'
      }
    }
  }
}

// Status Badges Story
export const StatusBadges: Story = {
  render: () => (
    <ComponentShowcase 
      title="Status Badges"
      description="Common status indicators used in applications"
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Order Status</h4>
          <div className="flex flex-wrap gap-3">
            <Badge variant="info">Pending</Badge>
            <Badge variant="warning">Processing</Badge>
            <Badge variant="primary">Shipped</Badge>
            <Badge variant="success">Delivered</Badge>
            <Badge variant="error">Cancelled</Badge>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">User Roles</h4>
          <div className="flex flex-wrap gap-3">
            <Badge variant="error" icon={<User className="w-3 h-3" />}>
              Admin
            </Badge>
            <Badge variant="warning" icon={<User className="w-3 h-3" />}>
              Moderator
            </Badge>
            <Badge variant="info" icon={<User className="w-3 h-3" />}>
              Editor
            </Badge>
            <Badge variant="outline" icon={<User className="w-3 h-3" />}>
              User
            </Badge>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Priority Levels</h4>
          <div className="flex flex-wrap gap-3">
            <Badge variant="error">Critical</Badge>
            <Badge variant="warning">High</Badge>
            <Badge variant="info">Medium</Badge>
            <Badge variant="secondary">Low</Badge>
          </div>
        </div>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common status badge patterns used in real applications.'
      }
    }
  }
}

// Notification Badges Story
export const NotificationBadges: Story = {
  render: () => (
    <ComponentShowcase 
      title="Notification Badges"
      description="Badges used for counts and notifications"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-8">
          <div className="relative">
            <button className="p-3 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:bg-[var(--muted)] transition-colors">
              <Mail className="w-5 h-5 text-[var(--foreground)]" />
            </button>
            <Badge size="sm" className="absolute -top-2 -right-2">3</Badge>
          </div>
          
          <div className="relative">
            <button className="p-3 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:bg-[var(--muted)] transition-colors">
              <Calendar className="w-5 h-5 text-[var(--foreground)]" />
            </button>
            <Badge variant="error" size="sm" className="absolute -top-2 -right-2">12</Badge>
          </div>
          
          <div className="relative">
            <button className="p-3 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:bg-[var(--muted)] transition-colors">
              <User className="w-5 h-5 text-[var(--foreground)]" />
            </button>
            <Badge variant="success" size="sm" className="absolute -top-2 -right-2">99+</Badge>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[var(--card)] border border-[var(--border)] rounded-xl">
            <span className="text-[var(--card-foreground)]">Messages</span>
            <Badge variant="primary" size="sm">5</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-[var(--card)] border border-[var(--border)] rounded-xl">
            <span className="text-[var(--card-foreground)]">Notifications</span>
            <Badge variant="error" size="sm">23</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-[var(--card)] border border-[var(--border)] rounded-xl">
            <span className="text-[var(--card-foreground)]">Updates</span>
            <Badge variant="info" size="sm">7</Badge>
          </div>
        </div>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Notification badges for displaying counts and alerts in UI elements.'
      }
    }
  }
}

// All Combinations Story
export const AllCombinations: Story = {
  render: () => (
    <div className="space-y-8">
      {(['primary', 'secondary', 'outline', 'success', 'warning', 'error', 'info'] as const).map((variant) => (
        <ComponentShowcase 
          key={variant}
          title={`${variant.charAt(0).toUpperCase() + variant.slice(1)} Variant`}
          description={`All sizes and configurations for the ${variant} variant`}
        >
          <div className="space-y-4">
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <div key={size} className="flex items-center gap-4">
                <div className="w-12 text-sm font-medium text-[var(--muted-foreground)]">
                  {size.toUpperCase()}
                </div>
                <Badge variant={variant} size={size}>
                  Normal
                </Badge>
                <Badge 
                  variant={variant} 
                  size={size}
                  icon={<Star className={size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />}
                >
                  With Icon
                </Badge>
                <Badge variant={variant} size={size} removable onRemove={() => {}}>
                  Removable
                </Badge>
                <Badge variant={variant} dot />
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
        story: 'Complete overview of all badge variants, sizes, and configurations.'
      }
    }
  }
}
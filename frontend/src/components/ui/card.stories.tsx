import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Card } from './card'
import { Button } from './button'
import { Badge } from './badge'
import { ComponentShowcase } from '../../../.storybook/theme-decorator'
import { Heart, Share, MoreHorizontal, User, Calendar, MapPin } from 'lucide-react'

/**
 * Card Component
 * 
 * The Card component is a flexible container that groups related content and actions.
 * It supports different elevations, variants, and can be composed with Header, Content, and Footer sections.
 */

const meta: Meta<typeof Card.Root> = {
  title: 'Components/Primitives/Card',
  component: Card.Root,
  parameters: {
    docs: {
      description: {
        component: `
The Card component is a compound component built using our standardized base patterns:

- **Flexible composition**: Header, Content, Footer sections
- **Multiple variants**: default, outlined, filled, elevated
- **Elevation levels**: none, sm, md, lg, xl
- **Responsive design**: adapts to different screen sizes
- **Theme support**: automatically adapts to all themes

## Compound Structure

The Card component consists of several sub-components:
- \`Card.Root\` - Main container
- \`Card.Header\` - Header section with title and description
- \`Card.Title\` - Card title
- \`Card.Description\` - Card description
- \`Card.Content\` - Main content area
- \`Card.Footer\` - Footer with actions

## Usage

\`\`\`tsx
import { Card } from '@/components/ui/card'

<Card.Root elevation="md" variant="default">
  <Card.Header>
    <Card.Title>Card Title</Card.Title>
    <Card.Description>Card description goes here</Card.Description>
  </Card.Header>
  <Card.Content>
    <p>Main content of the card</p>
  </Card.Content>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card.Root>
\`\`\`
        `
      }
    }
  },
  argTypes: {
    elevation: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Shadow elevation level'
    },
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'filled', 'elevated'],
      description: 'Visual variant of the card'
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Internal padding'
    }
  },
  args: {
    elevation: 'md',
    variant: 'default',
    padding: 'md'
  }
}

export default meta
type Story = StoryObj<typeof Card.Root>

// Default Story
export const Default: Story = {
  render: (args) => (
    <Card.Root {...args}>
      <Card.Header>
        <Card.Title>Card Title</Card.Title>
        <Card.Description>
          This is a description of the card content. It provides context about what the card contains.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <p className="text-[var(--foreground)]">
          This is the main content area of the card. You can put any content here including text, 
          images, forms, or other components.
        </p>
      </Card.Content>
      <Card.Footer>
        <Button size="sm">Action</Button>
        <Button variant="outline" size="sm">Cancel</Button>
      </Card.Footer>
    </Card.Root>
  )
}

// Variants Story
export const Variants: Story = {
  render: () => (
    <ComponentShowcase 
      title="Card Variants"
      description="Different visual styles for various use cases"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card.Root variant="default" elevation="md">
          <Card.Header>
            <Card.Title>Default Card</Card.Title>
            <Card.Description>Standard card with background and border</Card.Description>
          </Card.Header>
          <Card.Content>
            <p className="text-sm text-[var(--muted-foreground)]">
              This is the default card variant with a subtle background and border.
            </p>
          </Card.Content>
        </Card.Root>

        <Card.Root variant="outlined" elevation="none">
          <Card.Header>
            <Card.Title>Outlined Card</Card.Title>
            <Card.Description>Transparent background with border</Card.Description>
          </Card.Header>
          <Card.Content>
            <p className="text-sm text-[var(--muted-foreground)]">
              This card has a transparent background with a prominent border.
            </p>
          </Card.Content>
        </Card.Root>

        <Card.Root variant="filled" elevation="sm">
          <Card.Header>
            <Card.Title>Filled Card</Card.Title>
            <Card.Description>Muted background without border</Card.Description>
          </Card.Header>
          <Card.Content>
            <p className="text-sm text-[var(--muted-foreground)]">
              This card uses a muted background color without any border.
            </p>
          </Card.Content>
        </Card.Root>

        <Card.Root variant="elevated" elevation="lg">
          <Card.Header>
            <Card.Title>Elevated Card</Card.Title>
            <Card.Description>Clean background with strong shadow</Card.Description>
          </Card.Header>
          <Card.Content>
            <p className="text-sm text-[var(--muted-foreground)]">
              This card emphasizes elevation with a strong shadow effect.
            </p>
          </Card.Content>
        </Card.Root>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different card variants for various design needs and contexts.'
      }
    }
  }
}

// Elevations Story
export const Elevations: Story = {
  render: () => (
    <ComponentShowcase 
      title="Card Elevations"
      description="Different shadow levels to create depth hierarchy"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {(['none', 'sm', 'md', 'lg', 'xl'] as const).map((elevation) => (
          <Card.Root key={elevation} elevation={elevation}>
            <Card.Header>
              <Card.Title className="text-center">{elevation.toUpperCase()}</Card.Title>
            </Card.Header>
            <Card.Content>
              <p className="text-sm text-center text-[var(--muted-foreground)]">
                Elevation: {elevation}
              </p>
            </Card.Content>
          </Card.Root>
        ))}
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different elevation levels create visual hierarchy through shadows.'
      }
    }
  }
}

// Product Card Example
export const ProductCard: Story = {
  render: () => (
    <ComponentShowcase 
      title="Product Card Example"
      description="Real-world example of a product card with image, details, and actions"
    >
      <div className="max-w-sm">
        <Card.Root elevation="md">
          <Card.Content padding="none">
            <div className="aspect-video bg-gradient-to-br from-[var(--primary)] to-[var(--info)] rounded-t-2xl" />
          </Card.Content>
          <Card.Header>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Card.Title>Premium Headphones</Card.Title>
                <Card.Description>High-quality wireless headphones</Card.Description>
              </div>
              <Badge variant="success" size="sm">In Stock</Badge>
            </div>
          </Card.Header>
          <Card.Content>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-[var(--foreground)]">$299</span>
                <span className="text-sm text-[var(--muted-foreground)] line-through">$399</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="w-4 h-4 text-yellow-400">★</div>
                  ))}
                </div>
                <span className="text-sm text-[var(--muted-foreground)]">(128 reviews)</span>
              </div>
            </div>
          </Card.Content>
          <Card.Footer justify="between">
            <Button variant="outline" size="sm">
              <Heart className="w-4 h-4" />
            </Button>
            <Button size="sm" className="flex-1 ml-2">
              Add to Cart
            </Button>
          </Card.Footer>
        </Card.Root>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A complete product card example showing how to compose different elements.'
      }
    }
  }
}

// Profile Card Example
export const ProfileCard: Story = {
  render: () => (
    <ComponentShowcase 
      title="Profile Card Example"
      description="User profile card with avatar, information, and social actions"
    >
      <div className="max-w-sm">
        <Card.Root elevation="lg">
          <Card.Header>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--info)] rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <Card.Title>Sarah Johnson</Card.Title>
                <Card.Description>Senior Product Designer</Card.Description>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <MapPin className="w-4 h-4" />
                San Francisco, CA
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Calendar className="w-4 h-4" />
                Joined March 2020
              </div>
              <p className="text-sm text-[var(--foreground)]">
                Passionate about creating intuitive user experiences and building design systems 
                that scale across products.
              </p>
            </div>
          </Card.Content>
          <Card.Footer justify="between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Message
              </Button>
              <Button size="sm">
                Follow
              </Button>
            </div>
            <Button variant="ghost" size="sm">
              <Share className="w-4 h-4" />
            </Button>
          </Card.Footer>
        </Card.Root>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A user profile card demonstrating complex layout and multiple content types.'
      }
    }
  }
}

// Stats Card Example
export const StatsCard: Story = {
  render: () => (
    <ComponentShowcase 
      title="Statistics Cards"
      description="Dashboard-style cards for displaying key metrics"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card.Root elevation="sm">
          <Card.Content>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--muted-foreground)]">Total Users</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">12,345</p>
                <p className="text-xs text-[var(--success)]">+12% from last month</p>
              </div>
              <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-[var(--primary)]" />
              </div>
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root elevation="sm">
          <Card.Content>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--muted-foreground)]">Revenue</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">$45,678</p>
                <p className="text-xs text-[var(--success)]">+8% from last month</p>
              </div>
              <div className="w-12 h-12 bg-[var(--success)]/10 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-[var(--success)]">$</span>
              </div>
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root elevation="sm">
          <Card.Content>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--muted-foreground)]">Orders</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">1,234</p>
                <p className="text-xs text-[var(--error)]">-3% from last month</p>
              </div>
              <div className="w-12 h-12 bg-[var(--info)]/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[var(--info)]" />
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Statistics cards commonly used in dashboards and analytics interfaces.'
      }
    }
  }
}

// Responsive Cards
export const ResponsiveCards: Story = {
  render: () => (
    <ComponentShowcase 
      title="Responsive Card Layout"
      description="Cards that adapt to different screen sizes and layouts"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }, (_, i) => (
          <Card.Root key={i} elevation="md">
            <Card.Header>
              <Card.Title>Card {i + 1}</Card.Title>
              <Card.Description>Responsive card example</Card.Description>
            </Card.Header>
            <Card.Content>
              <p className="text-sm text-[var(--muted-foreground)]">
                This card adapts to different screen sizes using responsive grid layouts.
              </p>
            </Card.Content>
            <Card.Footer>
              <Button size="sm" className="w-full">
                Action {i + 1}
              </Button>
            </Card.Footer>
          </Card.Root>
        ))}
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Cards in a responsive grid that adapts to different screen sizes.'
      }
    }
  }
}
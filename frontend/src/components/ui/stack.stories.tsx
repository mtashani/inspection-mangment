import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Stack, HStack, VStack } from './stack'
import { Button } from './button'
import { Card } from './card'
import { Badge } from './badge'
import { ComponentShowcase } from '../../../.storybook/theme-decorator'
import { Heart, Share, Download, Star } from 'lucide-react'

/**
 * Stack Component
 * 
 * The Stack component provides flexible Flexbox layouts for arranging items in rows or columns.
 * It includes convenience components HStack (horizontal) and VStack (vertical).
 */

const meta: Meta<typeof Stack> = {
  title: 'Components/Layout/Stack',
  component: Stack,
  parameters: {
    docs: {
      description: {
        component: `
The Stack component is built using our standardized layout patterns and provides:

- **Flexible direction**: row, column, row-reverse, column-reverse
- **Consistent gaps**: none, xs, sm, md, lg, xl spacing
- **Alignment control**: start, center, end, stretch, baseline
- **Justification**: start, center, end, between, around, evenly
- **Wrap support**: optional flex-wrap behavior
- **Convenience components**: HStack (horizontal), VStack (vertical)

## Usage

\`\`\`tsx
import { Stack, HStack, VStack } from '@/components/ui/stack'

// Basic vertical stack
<Stack direction="column" gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Stack>

// Horizontal stack with convenience component
<HStack gap="sm" align="center">
  <Button>Action</Button>
  <Button variant="outline">Cancel</Button>
</HStack>

// Vertical stack with convenience component
<VStack gap="lg" align="stretch">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
</VStack>
\`\`\`
        `
      }
    }
  },
  argTypes: {
    direction: {
      control: 'select',
      options: ['row', 'column', 'row-reverse', 'column-reverse'],
      description: 'Flex direction'
    },
    gap: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Gap between items'
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch', 'baseline'],
      description: 'Align items'
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'between', 'around', 'evenly'],
      description: 'Justify content'
    },
    wrap: {
      control: 'boolean',
      description: 'Whether items should wrap'
    }
  },
  args: {
    direction: 'column',
    gap: 'md',
    align: 'stretch',
    justify: 'start',
    wrap: false
  }
}

export default meta
type Story = StoryObj<typeof Stack>

// Default Story
export const Default: Story = {
  render: (args) => (
    <ComponentShowcase 
      title="Basic Stack"
      description="Simple stack layout with customizable properties"
    >
      <Stack {...args}>
        {Array.from({ length: 4 }, (_, i) => (
          <Card.Root key={i} elevation="sm">
            <Card.Content>
              <div className="text-center py-4">
                <p className="font-medium text-[var(--card-foreground)]">
                  Stack Item {i + 1}
                </p>
              </div>
            </Card.Content>
          </Card.Root>
        ))}
      </Stack>
    </ComponentShowcase>
  )
}

// Direction Variations Story
export const DirectionVariations: Story = {
  render: () => (
    <div className="space-y-8">
      {(['row', 'column', 'row-reverse', 'column-reverse'] as const).map((direction) => (
        <ComponentShowcase 
          key={direction}
          title={`${direction.charAt(0).toUpperCase() + direction.slice(1)} Direction`}
          description={`Stack with ${direction} direction`}
        >
          <Stack direction={direction} gap="md" className="max-w-2xl">
            {Array.from({ length: 3 }, (_, i) => (
              <Card.Root key={i} elevation="sm">
                <Card.Content>
                  <div className="text-center py-3">
                    <p className="font-medium text-[var(--card-foreground)]">
                      {i + 1}
                    </p>
                  </div>
                </Card.Content>
              </Card.Root>
            ))}
          </Stack>
        </ComponentShowcase>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different direction options for stack layout.'
      }
    }
  }
}

// Gap Variations Story
export const GapVariations: Story = {
  render: () => (
    <div className="space-y-8">
      {(['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const).map((gap) => (
        <ComponentShowcase 
          key={gap}
          title={`${gap.toUpperCase()} Gap`}
          description={`Stack with ${gap} gap spacing`}
        >
          <HStack gap={gap}>
            {Array.from({ length: 4 }, (_, i) => (
              <Card.Root key={i} elevation="sm">
                <Card.Content>
                  <div className="text-center py-2 px-4">
                    <p className="text-sm font-medium text-[var(--card-foreground)]">
                      {i + 1}
                    </p>
                  </div>
                </Card.Content>
              </Card.Root>
            ))}
          </HStack>
        </ComponentShowcase>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different gap sizes showing spacing between stack items.'
      }
    }
  }
}

// Alignment Options Story
export const AlignmentOptions: Story = {
  render: () => (
    <div className="space-y-8">
      {(['start', 'center', 'end', 'stretch'] as const).map((align) => (
        <ComponentShowcase 
          key={align}
          title={`Align ${align.charAt(0).toUpperCase() + align.slice(1)}`}
          description={`Items aligned to ${align}`}
        >
          <HStack align={align} gap="md" className="h-24 bg-[var(--muted)] p-4 rounded-xl">
            <Card.Root elevation="sm">
              <Card.Content>
                <div className="py-2 px-4">
                  <p className="text-sm font-medium">Short</p>
                </div>
              </Card.Content>
            </Card.Root>
            <Card.Root elevation="sm">
              <Card.Content>
                <div className="py-4 px-4">
                  <p className="text-sm font-medium">Medium Height</p>
                </div>
              </Card.Content>
            </Card.Root>
            <Card.Root elevation="sm">
              <Card.Content>
                <div className="py-6 px-4">
                  <p className="text-sm font-medium">Tall Item</p>
                </div>
              </Card.Content>
            </Card.Root>
          </HStack>
        </ComponentShowcase>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different alignment options for items with varying heights.'
      }
    }
  }
}

// Justification Options Story
export const JustificationOptions: Story = {
  render: () => (
    <div className="space-y-8">
      {(['start', 'center', 'end', 'between', 'around', 'evenly'] as const).map((justify) => (
        <ComponentShowcase 
          key={justify}
          title={`Justify ${justify.charAt(0).toUpperCase() + justify.slice(1)}`}
          description={`Content justified with ${justify}`}
        >
          <HStack justify={justify} gap="none" className="w-full bg-[var(--muted)] p-4 rounded-xl">
            {Array.from({ length: 3 }, (_, i) => (
              <Card.Root key={i} elevation="sm">
                <Card.Content>
                  <div className="py-2 px-4">
                    <p className="text-sm font-medium text-[var(--card-foreground)]">
                      {i + 1}
                    </p>
                  </div>
                </Card.Content>
              </Card.Root>
            ))}
          </HStack>
        </ComponentShowcase>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different justification options for distributing items along the main axis.'
      }
    }
  }
}

// HStack Examples Story
export const HStackExamples: Story = {
  render: () => (
    <div className="space-y-8">
      <ComponentShowcase 
        title="Button Group"
        description="Horizontal stack of buttons with consistent spacing"
      >
        <HStack gap="sm">
          <Button variant="primary">Save</Button>
          <Button variant="outline">Cancel</Button>
          <Button variant="ghost">Reset</Button>
        </HStack>
      </ComponentShowcase>

      <ComponentShowcase 
        title="Action Bar"
        description="Action bar with icons and buttons"
      >
        <HStack justify="between" align="center" className="w-full">
          <HStack gap="md" align="center">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Document Title
            </h3>
            <Badge variant="success" size="sm">Published</Badge>
          </HStack>
          <HStack gap="sm">
            <Button variant="ghost" size="sm">
              <Heart className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Share className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </HStack>
        </HStack>
      </ComponentShowcase>

      <ComponentShowcase 
        title="Rating Display"
        description="Horizontal layout for ratings and reviews"
      >
        <HStack gap="md" align="center">
          <HStack gap="xs">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
          </HStack>
          <span className="text-sm font-medium text-[var(--foreground)]">4.8</span>
          <span className="text-sm text-[var(--muted-foreground)]">(124 reviews)</span>
        </HStack>
      </ComponentShowcase>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world examples using HStack for horizontal layouts.'
      }
    }
  }
}

// VStack Examples Story
export const VStackExamples: Story = {
  render: () => (
    <div className="space-y-8">
      <ComponentShowcase 
        title="Form Layout"
        description="Vertical stack for form elements"
      >
        <VStack gap="lg" align="stretch" className="max-w-md">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Email Address
            </label>
            <input 
              type="email" 
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Password
            </label>
            <input 
              type="password" 
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
              placeholder="Enter your password"
            />
          </div>
          <Button>Sign In</Button>
        </VStack>
      </ComponentShowcase>

      <ComponentShowcase 
        title="Card Stack"
        description="Vertical stack of cards"
      >
        <VStack gap="md" className="max-w-md">
          {Array.from({ length: 3 }, (_, i) => (
            <Card.Root key={i} elevation="sm">
              <Card.Header>
                <Card.Title>Card {i + 1}</Card.Title>
                <Card.Description>
                  This is card number {i + 1} in the vertical stack.
                </Card.Description>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Some content for card {i + 1}.
                </p>
              </Card.Content>
            </Card.Root>
          ))}
        </VStack>
      </ComponentShowcase>

      <ComponentShowcase 
        title="Navigation Menu"
        description="Vertical navigation using VStack"
      >
        <VStack gap="xs" align="stretch" className="max-w-xs">
          {['Dashboard', 'Projects', 'Team', 'Settings'].map((item) => (
            <button
              key={item}
              className="px-4 py-2 text-left text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              {item}
            </button>
          ))}
        </VStack>
      </ComponentShowcase>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world examples using VStack for vertical layouts.'
      }
    }
  }
}

// Wrapping Stack Story
export const WrappingStack: Story = {
  render: () => (
    <ComponentShowcase 
      title="Wrapping Stack"
      description="Stack that wraps items to new lines when space is limited"
    >
      <Stack direction="row" gap="md" wrap={true} className="max-w-md">
        {Array.from({ length: 12 }, (_, i) => (
          <Badge key={i} variant="outline">
            Tag {i + 1}
          </Badge>
        ))}
      </Stack>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Stack with wrap enabled, allowing items to flow to new lines.'
      }
    }
  }
}

// Complex Layout Example
export const ComplexLayout: Story = {
  render: () => (
    <ComponentShowcase 
      title="Complex Layout with Nested Stacks"
      description="Real-world example combining multiple stack layouts"
    >
      <Card.Root elevation="lg" className="max-w-2xl">
        <Card.Header>
          <HStack justify="between" align="center">
            <VStack gap="xs" align="start">
              <Card.Title>Product Dashboard</Card.Title>
              <Card.Description>Manage your products and inventory</Card.Description>
            </VStack>
            <HStack gap="sm">
              <Button variant="outline" size="sm">Export</Button>
              <Button size="sm">Add Product</Button>
            </HStack>
          </HStack>
        </Card.Header>
        
        <Card.Content>
          <VStack gap="lg">
            {/* Stats Row */}
            <HStack gap="lg" justify="between">
              <VStack gap="xs" align="center">
                <span className="text-2xl font-bold text-[var(--foreground)]">1,234</span>
                <span className="text-sm text-[var(--muted-foreground)]">Total Products</span>
              </VStack>
              <VStack gap="xs" align="center">
                <span className="text-2xl font-bold text-[var(--foreground)]">$45,678</span>
                <span className="text-sm text-[var(--muted-foreground)]">Revenue</span>
              </VStack>
              <VStack gap="xs" align="center">
                <span className="text-2xl font-bold text-[var(--foreground)]">89%</span>
                <span className="text-sm text-[var(--muted-foreground)]">In Stock</span>
              </VStack>
            </HStack>
            
            {/* Action Items */}
            <VStack gap="sm" align="stretch">
              <h4 className="font-medium text-[var(--foreground)]">Quick Actions</h4>
              <HStack gap="sm" wrap={true}>
                <Button variant="outline" size="sm">Update Inventory</Button>
                <Button variant="outline" size="sm">Generate Report</Button>
                <Button variant="outline" size="sm">Bulk Edit</Button>
                <Button variant="outline" size="sm">Import Data</Button>
              </HStack>
            </VStack>
          </VStack>
        </Card.Content>
      </Card.Root>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complex layout combining HStack and VStack for a dashboard interface.'
      }
    }
  }
}
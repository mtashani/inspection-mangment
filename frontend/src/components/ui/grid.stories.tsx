import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Grid, GridItem } from './grid'
import { Card } from './card'
import { ComponentShowcase } from '../../../.storybook/theme-decorator'

/**
 * Grid Component
 * 
 * The Grid component provides a flexible CSS Grid layout system with responsive capabilities.
 * It includes both Grid container and GridItem components for precise layout control.
 */

const meta: Meta<typeof Grid> = {
  title: 'Components/Layout/Grid',
  component: Grid,
  parameters: {
    docs: {
      description: {
        component: `
The Grid component is built using our standardized layout patterns and provides:

- **Flexible columns**: 1-12 column layouts
- **Responsive design**: automatic responsive breakpoints
- **Consistent gaps**: none, sm, md, lg, xl spacing
- **Grid items**: precise positioning with span, start, end
- **Theme support**: automatically adapts to all themes

## Usage

\`\`\`tsx
import { Grid, GridItem } from '@/components/ui/grid'

// Basic grid
<Grid cols={3} gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Grid>

// Responsive grid
<Grid responsive gap="lg">
  <div>Responsive item 1</div>
  <div>Responsive item 2</div>
  <div>Responsive item 3</div>
</Grid>

// With GridItem positioning
<Grid cols={12} gap="md">
  <GridItem span={6}>Half width</GridItem>
  <GridItem span={3}>Quarter width</GridItem>
  <GridItem span={3}>Quarter width</GridItem>
</Grid>
\`\`\`
        `
      }
    }
  },
  argTypes: {
    cols: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6, 12],
      description: 'Number of columns'
    },
    gap: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Gap between grid items'
    },
    responsive: {
      control: 'boolean',
      description: 'Whether to use responsive columns'
    }
  },
  args: {
    cols: 3,
    gap: 'md',
    responsive: false
  }
}

export default meta
type Story = StoryObj<typeof Grid>

// Default Story
export const Default: Story = {
  render: (args) => (
    <ComponentShowcase 
      title="Basic Grid"
      description="Simple grid layout with equal-sized items"
    >
      <Grid {...args}>
        {Array.from({ length: 6 }, (_, i) => (
          <Card.Root key={i} elevation="sm">
            <Card.Content>
              <div className="text-center py-4">
                <p className="font-medium text-[var(--card-foreground)]">
                  Item {i + 1}
                </p>
              </div>
            </Card.Content>
          </Card.Root>
        ))}
      </Grid>
    </ComponentShowcase>
  )
}

// Column Variations Story
export const ColumnVariations: Story = {
  render: () => (
    <div className="space-y-8">
      {([1, 2, 3, 4, 6] as const).map((cols) => (
        <ComponentShowcase 
          key={cols}
          title={`${cols} Column${cols > 1 ? 's' : ''}`}
          description={`Grid with ${cols} column${cols > 1 ? 's' : ''}`}
        >
          <Grid cols={cols} gap="md">
            {Array.from({ length: cols * 2 }, (_, i) => (
              <Card.Root key={i} elevation="sm">
                <Card.Content>
                  <div className="text-center py-3">
                    <p className="text-sm font-medium text-[var(--card-foreground)]">
                      {i + 1}
                    </p>
                  </div>
                </Card.Content>
              </Card.Root>
            ))}
          </Grid>
        </ComponentShowcase>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different column configurations from 1 to 6 columns.'
      }
    }
  }
}

// Gap Variations Story
export const GapVariations: Story = {
  render: () => (
    <div className="space-y-8">
      {(['none', 'sm', 'md', 'lg', 'xl'] as const).map((gap) => (
        <ComponentShowcase 
          key={gap}
          title={`${gap.toUpperCase()} Gap`}
          description={`Grid with ${gap} gap spacing`}
        >
          <Grid cols={4} gap={gap}>
            {Array.from({ length: 8 }, (_, i) => (
              <Card.Root key={i} elevation="sm">
                <Card.Content>
                  <div className="text-center py-2">
                    <p className="text-xs font-medium text-[var(--card-foreground)]">
                      {i + 1}
                    </p>
                  </div>
                </Card.Content>
              </Card.Root>
            ))}
          </Grid>
        </ComponentShowcase>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different gap sizes showing spacing between grid items.'
      }
    }
  }
}

// Responsive Grid Story
export const ResponsiveGrid: Story = {
  render: () => (
    <ComponentShowcase 
      title="Responsive Grid"
      description="Grid that adapts to screen size: 1 column on mobile, 2 on tablet, 3 on desktop"
    >
      <Grid responsive gap="lg">
        {Array.from({ length: 9 }, (_, i) => (
          <Card.Root key={i} elevation="md">
            <Card.Content>
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-[var(--primary)] rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-[var(--primary-foreground)] font-bold">
                    {i + 1}
                  </span>
                </div>
                <p className="font-medium text-[var(--card-foreground)]">
                  Responsive Item {i + 1}
                </p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Adapts to screen size
                </p>
              </div>
            </Card.Content>
          </Card.Root>
        ))}
      </Grid>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Responsive grid that automatically adjusts columns based on screen size.'
      }
    }
  }
}

// Grid Items with Spans Story
export const GridItemSpans: Story = {
  render: () => (
    <ComponentShowcase 
      title="Grid Items with Custom Spans"
      description="Using GridItem component for precise control over item sizing"
    >
      <Grid cols={12} gap="md">
        <GridItem span={12}>
          <Card.Root elevation="sm">
            <Card.Content>
              <div className="text-center py-4">
                <p className="font-medium text-[var(--card-foreground)]">
                  Full Width (span 12)
                </p>
              </div>
            </Card.Content>
          </Card.Root>
        </GridItem>
        
        <GridItem span={6}>
          <Card.Root elevation="sm">
            <Card.Content>
              <div className="text-center py-4">
                <p className="font-medium text-[var(--card-foreground)]">
                  Half Width (span 6)
                </p>
              </div>
            </Card.Content>
          </Card.Root>
        </GridItem>
        
        <GridItem span={6}>
          <Card.Root elevation="sm">
            <Card.Content>
              <div className="text-center py-4">
                <p className="font-medium text-[var(--card-foreground)]">
                  Half Width (span 6)
                </p>
              </div>
            </Card.Content>
          </Card.Root>
        </GridItem>
        
        <GridItem span={4}>
          <Card.Root elevation="sm">
            <Card.Content>
              <div className="text-center py-4">
                <p className="font-medium text-[var(--card-foreground)]">
                  Third (span 4)
                </p>
              </div>
            </Card.Content>
          </Card.Root>
        </GridItem>
        
        <GridItem span={4}>
          <Card.Root elevation="sm">
            <Card.Content>
              <div className="text-center py-4">
                <p className="font-medium text-[var(--card-foreground)]">
                  Third (span 4)
                </p>
              </div>
            </Card.Content>
          </Card.Root>
        </GridItem>
        
        <GridItem span={4}>
          <Card.Root elevation="sm">
            <Card.Content>
              <div className="text-center py-4">
                <p className="font-medium text-[var(--card-foreground)]">
                  Third (span 4)
                </p>
              </div>
            </Card.Content>
          </Card.Root>
        </GridItem>
        
        <GridItem span={3}>
          <Card.Root elevation="sm">
            <Card.Content>
              <div className="text-center py-4">
                <p className="font-medium text-[var(--card-foreground)]">
                  Quarter (span 3)
                </p>
              </div>
            </Card.Content>
          </Card.Root>
        </GridItem>
        
        <GridItem span={3}>
          <Card.Root elevation="sm">
            <Card.Content>
              <div className="text-center py-4">
                <p className="font-medium text-[var(--card-foreground)]">
                  Quarter (span 3)
                </p>
              </div>
            </Card.Content>
          </Card.Root>
        </GridItem>
        
        <GridItem span={3}>
          <Card.Root elevation="sm">
            <Card.Content>
              <div className="text-center py-4">
                <p className="font-medium text-[var(--card-foreground)]">
                  Quarter (span 3)
                </p>
              </div>
            </Card.Content>
          </Card.Root>
        </GridItem>
        
        <GridItem span={3}>
          <Card.Root elevation="sm">
            <Card.Content>
              <div className="text-center py-4">
                <p className="font-medium text-[var(--card-foreground)]">
                  Quarter (span 3)
                </p>
              </div>
            </Card.Content>
          </Card.Root>
        </GridItem>
      </Grid>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'GridItem components with different span values for flexible layouts.'
      }
    }
  }
}

// Complex Layout Example
export const ComplexLayout: Story = {
  render: () => (
    <ComponentShowcase 
      title="Complex Grid Layout"
      description="Real-world example with mixed content and asymmetric layout"
    >
      <Grid cols={12} gap="lg">
        {/* Header */}
        <GridItem span={12}>
          <Card.Root elevation="md">
            <Card.Header>
              <Card.Title>Dashboard Overview</Card.Title>
              <Card.Description>
                Welcome to your dashboard. Here's what's happening today.
              </Card.Description>
            </Card.Header>
          </Card.Root>
        </GridItem>
        
        {/* Main Content */}
        <GridItem span={8}>
          <Card.Root elevation="sm">
            <Card.Header>
              <Card.Title>Main Content Area</Card.Title>
            </Card.Header>
            <Card.Content>
              <p className="text-[var(--muted-foreground)]">
                This is the main content area that takes up 8 columns. 
                It could contain charts, tables, or other primary content.
              </p>
              <div className="mt-4 h-32 bg-gradient-to-r from-[var(--primary)] to-[var(--info)] rounded-lg opacity-20" />
            </Card.Content>
          </Card.Root>
        </GridItem>
        
        {/* Sidebar */}
        <GridItem span={4}>
          <div className="space-y-4">
            <Card.Root elevation="sm">
              <Card.Header>
                <Card.Title>Quick Stats</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Users</span>
                    <span className="font-medium">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Revenue</span>
                    <span className="font-medium">$12,345</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Orders</span>
                    <span className="font-medium">567</span>
                  </div>
                </div>
              </Card.Content>
            </Card.Root>
            
            <Card.Root elevation="sm">
              <Card.Header>
                <Card.Title>Recent Activity</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-2">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    New user registered
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Order #1234 completed
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Payment received
                  </p>
                </div>
              </Card.Content>
            </Card.Root>
          </div>
        </GridItem>
        
        {/* Bottom Row */}
        <GridItem span={4}>
          <Card.Root elevation="sm">
            <Card.Header>
              <Card.Title>Analytics</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="h-24 bg-[var(--muted)] rounded-lg flex items-center justify-center">
                <span className="text-[var(--muted-foreground)]">Chart Area</span>
              </div>
            </Card.Content>
          </Card.Root>
        </GridItem>
        
        <GridItem span={4}>
          <Card.Root elevation="sm">
            <Card.Header>
              <Card.Title>Performance</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="h-24 bg-[var(--muted)] rounded-lg flex items-center justify-center">
                <span className="text-[var(--muted-foreground)]">Metrics</span>
              </div>
            </Card.Content>
          </Card.Root>
        </GridItem>
        
        <GridItem span={4}>
          <Card.Root elevation="sm">
            <Card.Header>
              <Card.Title>Reports</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="h-24 bg-[var(--muted)] rounded-lg flex items-center justify-center">
                <span className="text-[var(--muted-foreground)]">Data</span>
              </div>
            </Card.Content>
          </Card.Root>
        </GridItem>
      </Grid>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complex dashboard layout demonstrating real-world grid usage with mixed content.'
      }
    }
  }
}
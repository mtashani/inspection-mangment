import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton, SkeletonCard } from './skeleton'
import { Card } from './card'
import { ComponentShowcase } from '../../../.storybook/theme-decorator'

/**
 * Skeleton Component
 * 
 * The Skeleton component provides placeholder loading states that mimic the shape and size
 * of content while it's being loaded. It helps improve perceived performance.
 */

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Composite/Skeleton',
  component: Skeleton,
  parameters: {
    docs: {
      description: {
        component: `
The Skeleton component is built using our standardized layout patterns and provides:

- **Multiple variants**: default, shimmer, wave animations
- **Different shapes**: rectangle, circle, text, avatar
- **Four sizes**: sm, md, lg, xl
- **Multi-line support**: for text skeletons
- **Predefined components**: SkeletonText, SkeletonAvatar, SkeletonButton, SkeletonCard
- **Theme support**: automatically adapts to all themes

## Usage

\`\`\`tsx
import { 
  Skeleton, 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonButton, 
  SkeletonCard 
} from '@/components/ui/skeleton'

// Basic skeleton
<Skeleton width="200px" height="20px" />

// Text skeleton with multiple lines
<SkeletonText lines={3} />

// Avatar skeleton
<SkeletonAvatar size="lg" />

// Complete card skeleton
<SkeletonCard avatar lines={4} actions />
\`\`\`
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'shimmer', 'wave'],
      description: 'Skeleton animation variant'
    },
    shape: {
      control: 'select',
      options: ['rectangle', 'circle', 'text', 'avatar'],
      description: 'Skeleton shape'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Skeleton size (for height)'
    },
    width: {
      control: 'text',
      description: 'Custom width'
    },
    height: {
      control: 'text',
      description: 'Custom height'
    },
    lines: {
      control: 'number',
      description: 'Number of lines for text skeleton'
    }
  },
  args: {
    variant: 'default',
    shape: 'rectangle',
    size: 'md',
    width: '200px',
    height: '20px',
    lines: 1
  }
}

export default meta
type Story = StoryObj<typeof Skeleton>

// Default Story
export const Default: Story = {}

// Variants Story
export const Variants: Story = {
  render: () => (
    <ComponentShowcase 
      title="Skeleton Variants"
      description="Different animation styles for skeleton loading"
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Default</h4>
          <div className="space-y-2">
            <Skeleton variant="default" width="100%" height="20px" />
            <Skeleton variant="default" width="80%" height="20px" />
            <Skeleton variant="default" width="60%" height="20px" />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Shimmer</h4>
          <div className="space-y-2">
            <Skeleton variant="shimmer" width="100%" height="20px" />
            <Skeleton variant="shimmer" width="80%" height="20px" />
            <Skeleton variant="shimmer" width="60%" height="20px" />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Wave</h4>
          <div className="space-y-2">
            <Skeleton variant="wave" width="100%" height="20px" />
            <Skeleton variant="wave" width="80%" height="20px" />
            <Skeleton variant="wave" width="60%" height="20px" />
          </div>
        </div>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different animation variants: default (pulse), shimmer (sliding highlight), and wave (bouncing).'
      }
    }
  }
}

// Shapes Story
export const Shapes: Story = {
  render: () => (
    <ComponentShowcase 
      title="Skeleton Shapes"
      description="Different shapes for various content types"
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Rectangle</h4>
          <Skeleton shape="rectangle" width="200px" height="100px" />
        </div>

        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Circle</h4>
          <Skeleton shape="circle" width="60px" height="60px" />
        </div>

        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Text Lines</h4>
          <Skeleton shape="text" lines={4} />
        </div>

        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Avatar</h4>
          <Skeleton shape="avatar" size="lg" />
        </div>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different shapes optimized for specific content types like images, avatars, and text.'
      }
    }
  }
}

// Predefined Components Story
export const PredefinedComponents: Story = {
  render: () => (
    <ComponentShowcase 
      title="Predefined Skeleton Components"
      description="Ready-to-use skeleton components for common UI elements"
    >
      <div className="space-y-8">
        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Text Skeletons</h4>
          <div className="space-y-4">
            <SkeletonText lines={1} />
            <SkeletonText lines={3} />
            <SkeletonText lines={5} />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Avatar Skeletons</h4>
          <div className="flex items-center gap-4">
            <SkeletonAvatar size="sm" />
            <SkeletonAvatar size="md" />
            <SkeletonAvatar size="lg" />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Button Skeletons</h4>
          <div className="flex items-center gap-4">
            <SkeletonButton size="sm" />
            <SkeletonButton size="md" />
            <SkeletonButton size="lg" />
          </div>
        </div>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Predefined skeleton components for common UI elements like text, avatars, and buttons.'
      }
    }
  }
}

// Card Skeleton Story
export const CardSkeleton: Story = {
  render: () => (
    <ComponentShowcase 
      title="Card Skeletons"
      description="Complete card skeletons for different layouts"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard />
        <SkeletonCard avatar />
        <SkeletonCard avatar lines={2} />
        <SkeletonCard lines={4} actions />
        <SkeletonCard avatar lines={3} actions />
        <SkeletonCard avatar={false} lines={6} actions />
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete card skeletons with different configurations for various card layouts.'
      }
    }
  }
}

// Real-world Examples Story
export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-8">
      <ComponentShowcase 
        title="User Profile Loading"
        description="Skeleton for user profile card"
      >
        <Card.Root elevation="md" className="max-w-sm">
          <Card.Content>
            <div className="flex items-center gap-4 mb-4">
              <SkeletonAvatar size="lg" />
              <div className="flex-1 space-y-2">
                <Skeleton width="120px" height="16px" />
                <Skeleton width="80px" height="14px" />
              </div>
            </div>
            <SkeletonText lines={3} />
            <div className="flex gap-2 mt-4">
              <SkeletonButton size="sm" />
              <SkeletonButton size="sm" />
            </div>
          </Card.Content>
        </Card.Root>
      </ComponentShowcase>

      <ComponentShowcase 
        title="Article List Loading"
        description="Skeleton for article/blog post list"
      >
        <div className="space-y-4 max-w-2xl">
          {Array.from({ length: 3 }, (_, i) => (
            <Card.Root key={i} elevation="sm">
              <Card.Content>
                <div className="flex gap-4">
                  <Skeleton width="120px" height="80px" shape="rectangle" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="100%" height="20px" />
                    <Skeleton width="80%" height="16px" />
                    <SkeletonText lines={2} />
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <SkeletonAvatar size="sm" />
                        <Skeleton width="80px" height="14px" />
                      </div>
                      <Skeleton width="60px" height="14px" />
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card.Root>
          ))}
        </div>
      </ComponentShowcase>

      <ComponentShowcase 
        title="Dashboard Loading"
        description="Skeleton for dashboard with stats and charts"
      >
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Card.Root key={i} elevation="sm">
                <Card.Content>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton width="80px" height="14px" />
                      <Skeleton width="60px" height="24px" />
                      <Skeleton width="100px" height="12px" />
                    </div>
                    <Skeleton width="40px" height="40px" shape="circle" />
                  </div>
                </Card.Content>
              </Card.Root>
            ))}
          </div>

          {/* Chart Area */}
          <Card.Root elevation="md">
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton width="150px" height="20px" />
                  <Skeleton width="200px" height="14px" />
                </div>
                <SkeletonButton />
              </div>
            </Card.Header>
            <Card.Content>
              <Skeleton width="100%" height="300px" shape="rectangle" />
            </Card.Content>
          </Card.Root>
        </div>
      </ComponentShowcase>

      <ComponentShowcase 
        title="Table Loading"
        description="Skeleton for data table"
      >
        <Card.Root elevation="md">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Skeleton width="120px" height="20px" />
              <div className="flex gap-2">
                <SkeletonButton size="sm" />
                <SkeletonButton size="sm" />
              </div>
            </div>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-4 pb-2 border-b border-[var(--border)]">
                <Skeleton width="80px" height="14px" />
                <Skeleton width="100px" height="14px" />
                <Skeleton width="60px" height="14px" />
                <Skeleton width="70px" height="14px" />
              </div>
              
              {/* Table Rows */}
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="grid grid-cols-4 gap-4 py-2">
                  <div className="flex items-center gap-2">
                    <SkeletonAvatar size="sm" />
                    <Skeleton width="80px" height="14px" />
                  </div>
                  <Skeleton width="120px" height="14px" />
                  <Skeleton width="50px" height="14px" />
                  <div className="flex gap-1">
                    <Skeleton width="20px" height="20px" shape="circle" />
                    <Skeleton width="20px" height="20px" shape="circle" />
                  </div>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card.Root>
      </ComponentShowcase>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world skeleton examples for common UI patterns like profiles, articles, dashboards, and tables.'
      }
    }
  }
}

// Animation Comparison Story
export const AnimationComparison: Story = {
  render: () => (
    <ComponentShowcase 
      title="Animation Comparison"
      description="Side-by-side comparison of all skeleton animations"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <h4 className="text-center font-medium text-[var(--foreground)]">Default (Pulse)</h4>
          <Card.Root elevation="sm">
            <Card.Content>
              <div className="flex items-center gap-3 mb-4">
                <SkeletonAvatar variant="default" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="default" width="100px" height="16px" />
                  <Skeleton variant="default" width="80px" height="14px" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton variant="default" width="100%" height="14px" />
                <Skeleton variant="default" width="90%" height="14px" />
                <Skeleton variant="default" width="75%" height="14px" />
              </div>
            </Card.Content>
          </Card.Root>
        </div>

        <div className="space-y-4">
          <h4 className="text-center font-medium text-[var(--foreground)]">Shimmer</h4>
          <Card.Root elevation="sm">
            <Card.Content>
              <div className="flex items-center gap-3 mb-4">
                <SkeletonAvatar variant="shimmer" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="shimmer" width="100px" height="16px" />
                  <Skeleton variant="shimmer" width="80px" height="14px" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton variant="shimmer" width="100%" height="14px" />
                <Skeleton variant="shimmer" width="90%" height="14px" />
                <Skeleton variant="shimmer" width="75%" height="14px" />
              </div>
            </Card.Content>
          </Card.Root>
        </div>

        <div className="space-y-4">
          <h4 className="text-center font-medium text-[var(--foreground)]">Wave</h4>
          <Card.Root elevation="sm">
            <Card.Content>
              <div className="flex items-center gap-3 mb-4">
                <SkeletonAvatar variant="wave" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="wave" width="100px" height="16px" />
                  <Skeleton variant="wave" width="80px" height="14px" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton variant="wave" width="100%" height="14px" />
                <Skeleton variant="wave" width="90%" height="14px" />
                <Skeleton variant="wave" width="75%" height="14px" />
              </div>
            </Card.Content>
          </Card.Root>
        </div>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of all skeleton animation variants in identical layouts.'
      }
    }
  }
}
import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Loading, LoadingOverlay } from './loading'
import { Button } from './button'
import { Card } from './card'
import { ComponentShowcase } from '../../../.storybook/theme-decorator'
import { useState } from 'react'

/**
 * Loading Component
 * 
 * The Loading component provides visual feedback during asynchronous operations.
 * It supports multiple animation variants, sizes, and can display loading text.
 */

const meta: Meta<typeof Loading> = {
  title: 'Components/Composite/Loading',
  component: Loading,
  parameters: {
    docs: {
      description: {
        component: `
The Loading component is built using our standardized layout patterns and provides:

- **Multiple variants**: spinner, pulse, bounce animations
- **Four sizes**: sm, md, lg, xl
- **Color options**: primary, muted, current
- **Text support**: optional loading text display
- **Overlay mode**: full-screen loading overlay
- **Theme support**: automatically adapts to all themes

## Usage

\`\`\`tsx
import { Loading, LoadingOverlay } from '@/components/ui/loading'

// Basic loading spinner
<Loading />

// With custom variant and size
<Loading variant="pulse" size="lg" />

// With loading text
<Loading showText text="Loading data..." />

// Loading overlay
<LoadingOverlay visible={isLoading} text="Processing..." />
\`\`\`
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['spinner', 'pulse', 'bounce'],
      description: 'Loading animation variant'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Loading indicator size'
    },
    color: {
      control: 'select',
      options: ['primary', 'muted', 'current'],
      description: 'Loading indicator color'
    },
    showText: {
      control: 'boolean',
      description: 'Whether to show loading text'
    },
    text: {
      control: 'text',
      description: 'Loading text to display'
    }
  },
  args: {
    variant: 'spinner',
    size: 'md',
    color: 'primary',
    showText: false,
    text: 'Loading...'
  }
}

export default meta
type Story = StoryObj<typeof Loading>

// Default Story
export const Default: Story = {}

// Variants Story
export const Variants: Story = {
  render: () => (
    <ComponentShowcase 
      title="Loading Variants"
      description="Different animation styles for loading indicators"
    >
      <div className="flex items-center gap-8">
        <div className="text-center space-y-2">
          <Loading variant="spinner" size="lg" />
          <p className="text-sm text-[var(--muted-foreground)]">Spinner</p>
        </div>
        <div className="text-center space-y-2">
          <Loading variant="pulse" size="lg" />
          <p className="text-sm text-[var(--muted-foreground)]">Pulse</p>
        </div>
        <div className="text-center space-y-2">
          <Loading variant="bounce" size="lg" />
          <p className="text-sm text-[var(--muted-foreground)]">Bounce</p>
        </div>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different animation variants: spinner (rotating), pulse (fading), and bounce (bouncing).'
      }
    }
  }
}

// Sizes Story
export const Sizes: Story = {
  render: () => (
    <ComponentShowcase 
      title="Loading Sizes"
      description="Four available sizes for different contexts"
    >
      <div className="flex items-center gap-8">
        <div className="text-center space-y-2">
          <Loading size="sm" />
          <p className="text-sm text-[var(--muted-foreground)]">Small</p>
        </div>
        <div className="text-center space-y-2">
          <Loading size="md" />
          <p className="text-sm text-[var(--muted-foreground)]">Medium</p>
        </div>
        <div className="text-center space-y-2">
          <Loading size="lg" />
          <p className="text-sm text-[var(--muted-foreground)]">Large</p>
        </div>
        <div className="text-center space-y-2">
          <Loading size="xl" />
          <p className="text-sm text-[var(--muted-foreground)]">Extra Large</p>
        </div>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading indicators come in four sizes: sm, md, lg, and xl.'
      }
    }
  }
}

// Colors Story
export const Colors: Story = {
  render: () => (
    <ComponentShowcase 
      title="Loading Colors"
      description="Different color options for loading indicators"
    >
      <div className="flex items-center gap-8">
        <div className="text-center space-y-2">
          <Loading color="primary" size="lg" />
          <p className="text-sm text-[var(--muted-foreground)]">Primary</p>
        </div>
        <div className="text-center space-y-2">
          <Loading color="muted" size="lg" />
          <p className="text-sm text-[var(--muted-foreground)]">Muted</p>
        </div>
        <div className="text-center space-y-2 text-[var(--success)]">
          <Loading color="current" size="lg" />
          <p className="text-sm text-[var(--muted-foreground)]">Current (Success)</p>
        </div>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different color options: primary (brand color), muted (subtle), and current (inherits text color).'
      }
    }
  }
}

// With Text Story
export const WithText: Story = {
  render: () => (
    <ComponentShowcase 
      title="Loading with Text"
      description="Loading indicators with descriptive text"
    >
      <div className="space-y-6">
        <Loading showText text="Loading..." />
        <Loading showText text="Saving changes..." variant="pulse" />
        <Loading showText text="Processing data..." variant="bounce" size="lg" />
        <Loading showText text="Uploading files..." size="sm" />
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading indicators can include descriptive text to provide context about the operation.'
      }
    }
  }
}

// In Context Story
export const InContext: Story = {
  render: () => {
    const [loading, setLoading] = useState(false)
    const [buttonLoading, setButtonLoading] = useState(false)

    const handleLoad = () => {
      setLoading(true)
      setTimeout(() => setLoading(false), 3000)
    }

    const handleButtonLoad = () => {
      setButtonLoading(true)
      setTimeout(() => setButtonLoading(false), 2000)
    }

    return (
      <ComponentShowcase 
        title="Loading in Context"
        description="Loading indicators used within other components"
      >
        <div className="space-y-6">
          {/* Card with loading state */}
          <Card.Root elevation="md" className="max-w-md">
            <Card.Header>
              <Card.Title>Data Dashboard</Card.Title>
              <Card.Description>View your analytics and metrics</Card.Description>
            </Card.Header>
            <Card.Content>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loading showText text="Loading dashboard data..." />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Users</span>
                    <span className="font-medium">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue</span>
                    <span className="font-medium">$12,345</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Orders</span>
                    <span className="font-medium">567</span>
                  </div>
                </div>
              )}
            </Card.Content>
            <Card.Footer>
              <Button onClick={handleLoad} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh Data'}
              </Button>
            </Card.Footer>
          </Card.Root>

          {/* Button with loading state */}
          <div className="flex gap-4">
            <Button loading={buttonLoading} onClick={handleButtonLoad}>
              {buttonLoading ? 'Processing...' : 'Process Data'}
            </Button>
            <Button variant="outline">Cancel</Button>
          </div>

          {/* Inline loading */}
          <div className="flex items-center gap-3">
            <Loading size="sm" />
            <span className="text-sm text-[var(--muted-foreground)]">
              Syncing data in background...
            </span>
          </div>
        </div>
      </ComponentShowcase>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Examples of loading indicators used within cards, buttons, and inline contexts.'
      }
    }
  }
}

// Loading States Story
export const LoadingStates: Story = {
  render: () => (
    <ComponentShowcase 
      title="Different Loading States"
      description="Various loading states for different operations"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card.Root elevation="sm">
          <Card.Header>
            <Card.Title>File Upload</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex items-center gap-3">
              <Loading size="sm" variant="pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium">document.pdf</p>
                <p className="text-xs text-[var(--muted-foreground)]">Uploading... 45%</p>
              </div>
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root elevation="sm">
          <Card.Header>
            <Card.Title>Search Results</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-center py-4">
              <Loading showText text="Searching..." />
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root elevation="sm">
          <Card.Header>
            <Card.Title>Form Submission</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex items-center gap-3">
              <Loading size="sm" variant="bounce" color="primary" />
              <span className="text-sm">Saving your information...</span>
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root elevation="sm">
          <Card.Header>
            <Card.Title>Data Sync</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex items-center gap-3">
              <Loading size="sm" color="muted" />
              <span className="text-sm text-[var(--muted-foreground)]">
                Last synced: 2 minutes ago
              </span>
            </div>
          </Card.Content>
        </Card.Root>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different loading states for various operations like uploads, searches, and data sync.'
      }
    }
  }
}

// Loading Overlay Story
export const LoadingOverlayStory: Story = {
  render: () => {
    const [overlayVisible, setOverlayVisible] = useState(false)

    const showOverlay = () => {
      setOverlayVisible(true)
      setTimeout(() => setOverlayVisible(false), 3000)
    }

    return (
      <ComponentShowcase 
        title="Loading Overlay"
        description="Full-screen loading overlay for blocking operations"
      >
        <div className="space-y-4">
          <Button onClick={showOverlay}>
            Show Loading Overlay
          </Button>
          
          <p className="text-sm text-[var(--muted-foreground)]">
            Click the button above to see a full-screen loading overlay.
            It will automatically disappear after 3 seconds.
          </p>

          <LoadingOverlay 
            visible={overlayVisible}
            showText
            text="Processing your request..."
            backgroundOpacity={60}
          />
        </div>
      </ComponentShowcase>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Full-screen loading overlay that blocks user interaction during important operations.'
      }
    }
  }
}

// All Combinations Story
export const AllCombinations: Story = {
  render: () => (
    <div className="space-y-8">
      {(['spinner', 'pulse', 'bounce'] as const).map((variant) => (
        <ComponentShowcase 
          key={variant}
          title={`${variant.charAt(0).toUpperCase() + variant.slice(1)} Variant`}
          description={`All sizes and colors for the ${variant} variant`}
        >
          <div className="space-y-6">
            {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <div key={size} className="flex items-center gap-8">
                <div className="w-12 text-sm font-medium text-[var(--muted-foreground)]">
                  {size.toUpperCase()}
                </div>
                <div className="flex items-center gap-6">
                  <Loading variant={variant} size={size} color="primary" />
                  <Loading variant={variant} size={size} color="muted" />
                  <div className="text-[var(--success)]">
                    <Loading variant={variant} size={size} color="current" />
                  </div>
                </div>
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
        story: 'Complete overview of all loading variants, sizes, and color combinations.'
      }
    }
  }
}
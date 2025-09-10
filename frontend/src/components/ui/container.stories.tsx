import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Container } from './container'
import { ComponentShowcase } from '../../../.storybook/theme-decorator'

/**
 * Container Component
 * 
 * The Container component provides consistent max-width and padding for content layout.
 * It's the foundation for responsive page layouts and content organization.
 */

const meta: Meta<typeof Container> = {
  title: 'Components/Layout/Container',
  component: Container,
  parameters: {
    docs: {
      description: {
        component: `
The Container component is built using our standardized layout patterns and provides:

- **Responsive max-widths**: sm, md, lg, xl, 2xl, full
- **Consistent padding**: none, sm, md, lg
- **Auto-centering**: optional horizontal centering
- **Theme support**: automatically adapts to all themes

## Usage

\`\`\`tsx
import { Container } from '@/components/ui/container'

// Basic usage
<Container>
  <p>Content goes here</p>
</Container>

// With custom size and padding
<Container size="lg" padding="lg">
  <p>Large container with large padding</p>
</Container>

// Full width without centering
<Container size="full" center={false}>
  <p>Full width content</p>
</Container>
\`\`\`
        `
      }
    },
    layout: 'fullscreen'
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl', 'full'],
      description: 'Maximum width of the container'
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Horizontal padding'
    },
    center: {
      control: 'boolean',
      description: 'Whether to center the container'
    }
  },
  args: {
    size: 'xl',
    padding: 'md',
    center: true
  }
}

export default meta
type Story = StoryObj<typeof Container>

// Default Story
export const Default: Story = {
  render: (args) => (
    <div className="bg-[var(--muted)] min-h-screen">
      <Container {...args}>
        <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--card-foreground)] mb-4">
            Container Content
          </h2>
          <p className="text-[var(--muted-foreground)]">
            This content is inside a container with max-width and padding applied.
            The container provides consistent layout boundaries for your content.
          </p>
        </div>
      </Container>
    </div>
  )
}

// Container Sizes Story
export const Sizes: Story = {
  render: () => (
    <div className="bg-[var(--muted)] min-h-screen py-8 space-y-8">
      {(['sm', 'md', 'lg', 'xl', '2xl', 'full'] as const).map((size) => (
        <Container key={size} size={size} padding="md">
          <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
            <h3 className="font-semibold text-[var(--card-foreground)] mb-2">
              {size.toUpperCase()} Container
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Max width: {size === 'full' ? 'Full width' : `screen-${size}`}
            </p>
          </div>
        </Container>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different container sizes showing responsive max-width behavior.'
      }
    }
  }
}

// Padding Variations Story
export const PaddingVariations: Story = {
  render: () => (
    <div className="bg-[var(--muted)] min-h-screen py-8 space-y-8">
      {(['none', 'sm', 'md', 'lg'] as const).map((padding) => (
        <Container key={padding} size="lg" padding={padding}>
          <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
            <h3 className="font-semibold text-[var(--card-foreground)] mb-2">
              {padding.toUpperCase()} Padding
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Horizontal padding: {padding === 'none' ? 'No padding' : `${padding} padding`}
            </p>
          </div>
        </Container>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different padding options for container content spacing.'
      }
    }
  }
}

// Centered vs Non-Centered Story
export const CenteringOptions: Story = {
  render: () => (
    <div className="bg-[var(--muted)] min-h-screen py-8 space-y-8">
      <Container size="md" center={true}>
        <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
          <h3 className="font-semibold text-[var(--card-foreground)] mb-2">
            Centered Container
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            This container is centered horizontally with margin auto.
          </p>
        </div>
      </Container>
      
      <Container size="md" center={false}>
        <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
          <h3 className="font-semibold text-[var(--card-foreground)] mb-2">
            Left-Aligned Container
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            This container is not centered and aligns to the left.
          </p>
        </div>
      </Container>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison between centered and non-centered container alignment.'
      }
    }
  }
}

// Nested Containers Story
export const NestedContainers: Story = {
  render: () => (
    <div className="bg-[var(--muted)] min-h-screen py-8">
      <Container size="2xl" padding="lg">
        <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] mb-6">
          <h2 className="text-xl font-semibold text-[var(--card-foreground)] mb-4">
            Outer Container (2XL)
          </h2>
          
          <Container size="lg" padding="md">
            <div className="bg-[var(--muted)] p-4 rounded-lg border border-[var(--border)]">
              <h3 className="font-semibold text-[var(--foreground)] mb-2">
                Inner Container (LG)
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Containers can be nested to create complex layouts with different max-widths.
              </p>
            </div>
          </Container>
        </div>
      </Container>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of nested containers with different sizes for complex layouts.'
      }
    }
  }
}

// Real-world Layout Example
export const RealWorldExample: Story = {
  render: () => (
    <div className="bg-[var(--muted)] min-h-screen">
      {/* Header */}
      <div className="bg-[var(--card)] border-b border-[var(--border)]">
        <Container size="xl" padding="md">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-xl font-bold text-[var(--card-foreground)]">
              My Website
            </h1>
            <nav className="flex gap-4">
              <a href="#" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                Home
              </a>
              <a href="#" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                About
              </a>
              <a href="#" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                Contact
              </a>
            </nav>
          </div>
        </Container>
      </div>
      
      {/* Main Content */}
      <Container size="lg" padding="md">
        <div className="py-12">
          <div className="bg-[var(--card)] p-8 rounded-xl border border-[var(--border)] mb-8">
            <h2 className="text-2xl font-bold text-[var(--card-foreground)] mb-4">
              Welcome to Our Platform
            </h2>
            <p className="text-[var(--muted-foreground)] mb-6">
              This is an example of how containers work in a real-world layout. 
              The header uses an XL container while the main content uses a smaller LG container 
              for better readability.
            </p>
            <button className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors">
              Get Started
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)]">
                <h3 className="font-semibold text-[var(--card-foreground)] mb-2">
                  Feature {i}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Description of feature {i} and its benefits.
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
      
      {/* Footer */}
      <div className="bg-[var(--card)] border-t border-[var(--border)] mt-12">
        <Container size="xl" padding="md">
          <div className="py-8 text-center">
            <p className="text-[var(--muted-foreground)]">
              © 2024 My Website. All rights reserved.
            </p>
          </div>
        </Container>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete page layout example showing how containers work in practice.'
      }
    }
  }
}
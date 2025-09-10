import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Alert, AlertIcons } from './alert'
import { Button } from './button'
import { ComponentShowcase } from '../../../.storybook/theme-decorator'
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react'

/**
 * Alert Component
 * 
 * The Alert component displays important messages to users with different severity levels.
 * It supports multiple variants, sizes, icons, and can be dismissible.
 */

const meta: Meta<typeof Alert.Root> = {
  title: 'Components/Composite/Alert',
  component: Alert.Root,
  parameters: {
    docs: {
      description: {
        component: `
The Alert component is a compound component built using our standardized layout patterns:

- **Multiple variants**: default, success, warning, error, info
- **Three sizes**: sm, md (default), lg
- **Icon support**: built-in icons or custom icons
- **Dismissible**: optional close functionality
- **Compound structure**: Root, Title, Description components
- **Theme support**: automatically adapts to all themes

## Compound Structure

The Alert component consists of several sub-components:
- \`Alert.Root\` - Main container
- \`Alert.Title\` - Alert title
- \`Alert.Description\` - Alert description/content

## Usage

\`\`\`tsx
import { Alert, AlertIcons } from '@/components/ui/alert'

// Basic alert
<Alert.Root variant="info" icon={AlertIcons.info}>
  <Alert.Title>Information</Alert.Title>
  <Alert.Description>
    This is an informational message.
  </Alert.Description>
</Alert.Root>

// Dismissible alert
<Alert.Root 
  variant="warning" 
  icon={AlertIcons.warning}
  dismissible
  onDismiss={() => console.log('dismissed')}
>
  <Alert.Title>Warning</Alert.Title>
  <Alert.Description>
    Please review this warning message.
  </Alert.Description>
</Alert.Root>
\`\`\`
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error', 'info'],
      description: 'Alert variant for semantic styling'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Alert size'
    },
    dismissible: {
      control: 'boolean',
      description: 'Whether the alert is dismissible'
    }
  },
  args: {
    variant: 'info',
    size: 'md',
    dismissible: false
  }
}

export default meta
type Story = StoryObj<typeof Alert.Root>

// Default Story
export const Default: Story = {
  render: (args) => (
    <Alert.Root {...args} icon={AlertIcons.info}>
      <Alert.Title>Alert Title</Alert.Title>
      <Alert.Description>
        This is an alert message that provides important information to the user.
        It can contain multiple lines of text and additional context.
      </Alert.Description>
    </Alert.Root>
  )
}

// Variants Story
export const Variants: Story = {
  render: () => (
    <ComponentShowcase 
      title="Alert Variants"
      description="Different alert types for various message severities"
    >
      <div className="space-y-4">
        <Alert.Root variant="default">
          <Alert.Title>Default Alert</Alert.Title>
          <Alert.Description>
            This is a default alert for general information.
          </Alert.Description>
        </Alert.Root>

        <Alert.Root variant="success" icon={AlertIcons.success}>
          <Alert.Title>Success</Alert.Title>
          <Alert.Description>
            Your action was completed successfully!
          </Alert.Description>
        </Alert.Root>

        <Alert.Root variant="warning" icon={AlertIcons.warning}>
          <Alert.Title>Warning</Alert.Title>
          <Alert.Description>
            Please review this warning before proceeding.
          </Alert.Description>
        </Alert.Root>

        <Alert.Root variant="error" icon={AlertIcons.error}>
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>
            An error occurred while processing your request.
          </Alert.Description>
        </Alert.Root>

        <Alert.Root variant="info" icon={AlertIcons.info}>
          <Alert.Title>Information</Alert.Title>
          <Alert.Description>
            Here's some helpful information for you to know.
          </Alert.Description>
        </Alert.Root>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different alert variants with their semantic meanings and appropriate icons.'
      }
    }
  }
}

// Sizes Story
export const Sizes: Story = {
  render: () => (
    <ComponentShowcase 
      title="Alert Sizes"
      description="Three available sizes for different contexts"
    >
      <div className="space-y-4">
        <Alert.Root variant="info" size="sm" icon={AlertIcons.info}>
          <Alert.Title size="sm">Small Alert</Alert.Title>
          <Alert.Description size="sm">
            This is a small alert with compact spacing.
          </Alert.Description>
        </Alert.Root>

        <Alert.Root variant="warning" size="md" icon={AlertIcons.warning}>
          <Alert.Title size="md">Medium Alert</Alert.Title>
          <Alert.Description size="md">
            This is a medium alert with standard spacing (default size).
          </Alert.Description>
        </Alert.Root>

        <Alert.Root variant="success" size="lg" icon={AlertIcons.success}>
          <Alert.Title size="lg">Large Alert</Alert.Title>
          <Alert.Description size="lg">
            This is a large alert with generous spacing for important messages.
          </Alert.Description>
        </Alert.Root>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alerts come in three sizes: small (sm), medium (md), and large (lg).'
      }
    }
  }
}

// Dismissible Alerts Story
export const DismissibleAlerts: Story = {
  render: () => {
    const handleDismiss = (type: string) => {
      alert(`${type} alert dismissed`)
    }

    return (
      <ComponentShowcase 
        title="Dismissible Alerts"
        description="Alerts that can be closed by the user"
      >
        <div className="space-y-4">
          <Alert.Root 
            variant="success" 
            icon={AlertIcons.success}
            dismissible
            onDismiss={() => handleDismiss('Success')}
          >
            <Alert.Title>Success</Alert.Title>
            <Alert.Description>
              Your changes have been saved successfully. You can dismiss this message.
            </Alert.Description>
          </Alert.Root>

          <Alert.Root 
            variant="warning" 
            icon={AlertIcons.warning}
            dismissible
            onDismiss={() => handleDismiss('Warning')}
          >
            <Alert.Title>Warning</Alert.Title>
            <Alert.Description>
              Your session will expire in 5 minutes. Please save your work.
            </Alert.Description>
          </Alert.Root>

          <Alert.Root 
            variant="info" 
            icon={AlertIcons.info}
            dismissible
            onDismiss={() => handleDismiss('Info')}
          >
            <Alert.Title>New Feature Available</Alert.Title>
            <Alert.Description>
              We've added new functionality to improve your experience. Check it out!
            </Alert.Description>
          </Alert.Root>
        </div>
      </ComponentShowcase>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Dismissible alerts allow users to close messages they no longer need to see.'
      }
    }
  }
}

// Custom Icons Story
export const CustomIcons: Story = {
  render: () => (
    <ComponentShowcase 
      title="Alerts with Custom Icons"
      description="Using custom icons instead of the default ones"
    >
      <div className="space-y-4">
        <Alert.Root variant="success" icon={<CheckCircle className="w-5 h-5" />}>
          <Alert.Title>Task Completed</Alert.Title>
          <Alert.Description>
            Your task has been marked as complete.
          </Alert.Description>
        </Alert.Root>

        <Alert.Root variant="error" icon={<XCircle className="w-5 h-5" />}>
          <Alert.Title>Connection Failed</Alert.Title>
          <Alert.Description>
            Unable to connect to the server. Please try again.
          </Alert.Description>
        </Alert.Root>

        <Alert.Root variant="warning" icon={<AlertTriangle className="w-5 h-5" />}>
          <Alert.Title>Storage Almost Full</Alert.Title>
          <Alert.Description>
            You're using 90% of your storage space. Consider upgrading your plan.
          </Alert.Description>
        </Alert.Root>

        <Alert.Root variant="info" icon={<Info className="w-5 h-5" />}>
          <Alert.Title>System Maintenance</Alert.Title>
          <Alert.Description>
            Scheduled maintenance will occur tonight from 2-4 AM EST.
          </Alert.Description>
        </Alert.Root>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alerts can use custom icons to better match the specific message context.'
      }
    }
  }
}

// Without Icons Story
export const WithoutIcons: Story = {
  render: () => (
    <ComponentShowcase 
      title="Alerts Without Icons"
      description="Clean alerts that rely on color and typography for visual hierarchy"
    >
      <div className="space-y-4">
        <Alert.Root variant="success">
          <Alert.Title>Payment Successful</Alert.Title>
          <Alert.Description>
            Your payment of $99.99 has been processed successfully.
          </Alert.Description>
        </Alert.Root>

        <Alert.Root variant="warning">
          <Alert.Title>Incomplete Profile</Alert.Title>
          <Alert.Description>
            Please complete your profile to access all features.
          </Alert.Description>
        </Alert.Root>

        <Alert.Root variant="error">
          <Alert.Title>Validation Error</Alert.Title>
          <Alert.Description>
            Please check the form fields and correct any errors.
          </Alert.Description>
        </Alert.Root>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alerts can work without icons for a cleaner, more minimal appearance.'
      }
    }
  }
}

// With Actions Story
export const WithActions: Story = {
  render: () => (
    <ComponentShowcase 
      title="Alerts with Action Buttons"
      description="Alerts that include action buttons for user interaction"
    >
      <div className="space-y-4">
        <Alert.Root variant="info" icon={AlertIcons.info}>
          <Alert.Title>Update Available</Alert.Title>
          <Alert.Description>
            A new version of the application is available. Would you like to update now?
          </Alert.Description>
          <div className="flex gap-2 mt-4">
            <Button size="sm">Update Now</Button>
            <Button variant="outline" size="sm">Later</Button>
          </div>
        </Alert.Root>

        <Alert.Root variant="warning" icon={AlertIcons.warning}>
          <Alert.Title>Unsaved Changes</Alert.Title>
          <Alert.Description>
            You have unsaved changes. Do you want to save them before leaving?
          </Alert.Description>
          <div className="flex gap-2 mt-4">
            <Button variant="primary" size="sm">Save Changes</Button>
            <Button variant="error" size="sm">Discard</Button>
            <Button variant="outline" size="sm">Cancel</Button>
          </div>
        </Alert.Root>

        <Alert.Root variant="success" icon={AlertIcons.success}>
          <Alert.Title>Backup Complete</Alert.Title>
          <Alert.Description>
            Your data has been successfully backed up to the cloud.
          </Alert.Description>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm">View Details</Button>
          </div>
        </Alert.Root>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alerts can include action buttons to allow users to respond to the message.'
      }
    }
  }
}

// Inline Alerts Story
export const InlineAlerts: Story = {
  render: () => (
    <ComponentShowcase 
      title="Inline Form Alerts"
      description="Compact alerts used within forms and smaller spaces"
    >
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--foreground)]">
            Email Address
          </label>
          <input 
            type="email" 
            className="w-full px-3 py-2 border border-[var(--error)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
            placeholder="Enter your email"
          />
          <Alert.Root variant="error" size="sm">
            <Alert.Description size="sm">
              Please enter a valid email address.
            </Alert.Description>
          </Alert.Root>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--foreground)]">
            Password
          </label>
          <input 
            type="password" 
            className="w-full px-3 py-2 border border-[var(--success)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
            placeholder="Enter your password"
          />
          <Alert.Root variant="success" size="sm">
            <Alert.Description size="sm">
              Password strength: Strong
            </Alert.Description>
          </Alert.Root>
        </div>

        <Alert.Root variant="info" size="sm">
          <Alert.Description size="sm">
            Your password must be at least 8 characters long and include numbers.
          </Alert.Description>
        </Alert.Root>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact alerts perfect for inline validation and form feedback.'
      }
    }
  }
}

// Toast-style Alerts Story
export const ToastStyleAlerts: Story = {
  render: () => (
    <ComponentShowcase 
      title="Toast-style Alerts"
      description="Alerts styled to look like toast notifications"
    >
      <div className="space-y-4 max-w-sm">
        <Alert.Root 
          variant="success" 
          icon={AlertIcons.success}
          dismissible
          onDismiss={() => {}}
          className="shadow-lg"
        >
          <Alert.Title>File Uploaded</Alert.Title>
          <Alert.Description>
            document.pdf has been uploaded successfully.
          </Alert.Description>
        </Alert.Root>

        <Alert.Root 
          variant="error" 
          icon={AlertIcons.error}
          dismissible
          onDismiss={() => {}}
          className="shadow-lg"
        >
          <Alert.Title>Upload Failed</Alert.Title>
          <Alert.Description>
            Failed to upload file. Please try again.
          </Alert.Description>
        </Alert.Root>

        <Alert.Root 
          variant="info" 
          icon={AlertIcons.info}
          dismissible
          onDismiss={() => {}}
          className="shadow-lg"
        >
          <Alert.Title>New Message</Alert.Title>
          <Alert.Description>
            You have received a new message from John.
          </Alert.Description>
        </Alert.Root>
      </div>
    </ComponentShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alerts styled as toast notifications with shadows and dismissible functionality.'
      }
    }
  }
}
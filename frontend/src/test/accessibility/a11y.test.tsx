/**
 * Accessibility Tests for Design System Components
 * Comprehensive a11y testing using jest-axe and testing-library
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Import components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertIcons } from '@/components/ui/alert'
import { Container } from '@/components/ui/container'
import { Grid, GridItem } from '@/components/ui/grid'
import { Stack, HStack, VStack } from '@/components/ui/stack'

describe('Accessibility Tests', () => {
  describe('Keyboard Navigation', () => {
    it('Button supports keyboard navigation', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      
      render(<Button onClick={handleClick}>Test Button</Button>)
      const button = screen.getByRole('button')
      
      // Focus with Tab
      await user.tab()
      expect(button).toHaveFocus()
      
      // Activate with Enter
      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalledTimes(1)
      
      // Activate with Space
      await user.keyboard(' ')
      expect(handleClick).toHaveBeenCalledTimes(2)
    })

    it('Input supports keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <div>
          <label htmlFor="test-input">Test Input</label>
          <Input id="test-input" placeholder="Enter text" />
        </div>
      )
      
      const input = screen.getByLabelText('Test Input')
      
      // Focus with Tab
      await user.tab()
      expect(input).toHaveFocus()
      
      // Type text
      await user.type(input, 'Hello World')
      expect(input).toHaveValue('Hello World')
    })

    it('Alert dismiss button supports keyboard navigation', async () => {
      const user = userEvent.setup()
      const handleDismiss = jest.fn()
      
      render(
        <Alert.Root dismissible onDismiss={handleDismiss}>
          <Alert.Title>Dismissible Alert</Alert.Title>
          <Alert.Description>This alert can be dismissed</Alert.Description>
        </Alert.Root>
      )
      
      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i })
      
      // Focus with Tab
      await user.tab()
      expect(dismissButton).toHaveFocus()
      
      // Activate with Enter
      await user.keyboard('{Enter}')
      expect(handleDismiss).toHaveBeenCalledTimes(1)
    })
  })

  describe('ARIA Attributes', () => {
    it('Button has proper ARIA attributes', () => {
      render(<Button loading aria-label="Save document">Save</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveAttribute('aria-label', 'Save document')
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('Input has proper ARIA attributes', () => {
      render(
        <div>
          <label htmlFor="email">Email Address</label>
          <Input 
            id="email"
            type="email"
            required
            error="Please enter a valid email"
            aria-describedby="email-error"
          />
          <div id="email-error">Please enter a valid email</div>
        </div>
      )
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-required', 'true')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby', 'email-error')
    })

    it('Alert has proper ARIA role', () => {
      render(
        <Alert.Root variant="error">
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>Something went wrong</Alert.Description>
        </Alert.Root>
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })

    it('Badge with dot has proper ARIA label', () => {
      render(<Badge dot aria-label="Online status">Online</Badge>)
      const badge = screen.getByLabelText('Online status')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Color Contrast', () => {
    it('Button variants meet contrast requirements', async () => {
      const variants = ['primary', 'secondary', 'outline', 'success', 'warning', 'error', 'info'] as const
      
      for (const variant of variants) {
        const { container } = render(<Button variant={variant}>Test Button</Button>)
        const results = await axe(container, {
          rules: {
            'color-contrast': { enabled: true }
          }
        })
        expect(results).toHaveNoViolations()
      }
    })

    it('Alert variants meet contrast requirements', async () => {
      const variants = ['default', 'success', 'warning', 'error', 'info'] as const
      
      for (const variant of variants) {
        const { container } = render(
          <Alert.Root variant={variant}>
            <Alert.Title>Test Alert</Alert.Title>
            <Alert.Description>Test description</Alert.Description>
          </Alert.Root>
        )
        const results = await axe(container, {
          rules: {
            'color-contrast': { enabled: true }
          }
        })
        expect(results).toHaveNoViolations()
      }
    })

    it('Badge variants meet contrast requirements', async () => {
      const variants = ['primary', 'secondary', 'outline', 'success', 'warning', 'error', 'info'] as const
      
      for (const variant of variants) {
        const { container } = render(<Badge variant={variant}>Test Badge</Badge>)
        const results = await axe(container, {
          rules: {
            'color-contrast': { enabled: true }
          }
        })
        expect(results).toHaveNoViolations()
      }
    })
  })

  describe('Focus Management', () => {
    it('maintains focus order in complex layouts', async () => {
      const user = userEvent.setup()
      
      render(
        <Card.Root>
          <Card.Header>
            <Card.Title>User Profile</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <Input placeholder="Name" />
              <Input placeholder="Email" />
            </div>
          </Card.Content>
          <Card.Footer>
            <Button>Save</Button>
            <Button variant="outline">Cancel</Button>
          </Card.Footer>
        </Card.Root>
      )
      
      // Tab through elements in order
      await user.tab()
      expect(screen.getByPlaceholderText('Name')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByPlaceholderText('Email')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    })

    it('provides visible focus indicators', () => {
      render(<Button>Focusable Button</Button>)
      const button = screen.getByRole('button')
      
      // Check for focus-visible classes
      expect(button).toHaveClass('focus-visible:outline-none')
      expect(button).toHaveClass('focus-visible:ring-2')
    })
  })

  describe('Screen Reader Support', () => {
    it('provides proper labels for interactive elements', () => {
      render(
        <div>
          <Button aria-label="Close dialog">×</Button>
          <Input aria-label="Search products" placeholder="Search..." />
          <Badge removable onRemove={() => {}} aria-label="Remove tag">
            React
          </Badge>
        </div>
      )
      
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument()
      expect(screen.getByLabelText('Search products')).toBeInTheDocument()
      expect(screen.getByLabelText('Remove tag')).toBeInTheDocument()
    })

    it('announces dynamic content changes', () => {
      const { rerender } = render(
        <Alert.Root variant="info">
          <Alert.Title>Loading</Alert.Title>
          <Alert.Description>Please wait...</Alert.Description>
        </Alert.Root>
      )
      
      // Simulate content change
      rerender(
        <Alert.Root variant="success">
          <Alert.Title>Success</Alert.Title>
          <Alert.Description>Operation completed successfully</Alert.Description>
        </Alert.Root>
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('Success')
      expect(alert).toHaveTextContent('Operation completed successfully')
    })
  })

  describe('Semantic HTML', () => {
    it('uses proper heading hierarchy', () => {
      render(
        <Container>
          <h1>Main Title</h1>
          <Card.Root>
            <Card.Header>
              <Card.Title as="h2">Section Title</Card.Title>
            </Card.Header>
            <Card.Content>
              <h3>Subsection</h3>
              <p>Content</p>
            </Card.Content>
          </Card.Root>
        </Container>
      )
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Main Title')
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Subsection')
    })

    it('uses proper list semantics', () => {
      render(
        <ul>
          <li>
            <Badge>Item 1</Badge>
          </li>
          <li>
            <Badge>Item 2</Badge>
          </li>
          <li>
            <Badge>Item 3</Badge>
          </li>
        </ul>
      )
      
      const list = screen.getByRole('list')
      const items = screen.getAllByRole('listitem')
      
      expect(list).toBeInTheDocument()
      expect(items).toHaveLength(3)
    })
  })

  describe('Responsive Accessibility', () => {
    it('maintains accessibility across breakpoints', async () => {
      // Mock different viewport sizes
      const viewports = [
        { width: 375, height: 667 },  // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1200, height: 800 }  // Desktop
      ]
      
      for (const viewport of viewports) {
        // Mock viewport
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: viewport.width,
        })
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: viewport.height,
        })
        
        const { container } = render(
          <Grid responsive gap="md">
            <Card.Root>
              <Card.Header>
                <Card.Title>Card 1</Card.Title>
              </Card.Header>
              <Card.Content>Content 1</Card.Content>
            </Card.Root>
            <Card.Root>
              <Card.Header>
                <Card.Title>Card 2</Card.Title>
              </Card.Header>
              <Card.Content>Content 2</Card.Content>
            </Card.Root>
          </Grid>
        )
        
        const results = await axe(container)
        expect(results).toHaveNoViolations()
      }
    })
  })

  describe('Theme Accessibility', () => {
    it('maintains accessibility across all themes', async () => {
      const themes = ['base', 'cool-blue', 'warm-sand', 'midnight-purple', 'soft-gray', 'warm-cream']
      
      for (const theme of themes) {
        // Apply theme
        document.documentElement.setAttribute('data-theme', theme)
        
        const { container } = render(
          <div>
            <Button variant="primary">Primary Button</Button>
            <Alert.Root variant="warning" icon={AlertIcons.warning}>
              <Alert.Title>Warning</Alert.Title>
              <Alert.Description>This is a warning message</Alert.Description>
            </Alert.Root>
            <Badge variant="success">Success Badge</Badge>
          </div>
        )
        
        const results = await axe(container, {
          rules: {
            'color-contrast': { enabled: true }
          }
        })
        expect(results).toHaveNoViolations()
      }
      
      // Reset theme
      document.documentElement.setAttribute('data-theme', 'base')
    })
  })

  describe('Error States Accessibility', () => {
    it('properly announces form errors', () => {
      render(
        <div>
          <label htmlFor="email">Email</label>
          <Input 
            id="email"
            type="email"
            error="Please enter a valid email address"
            aria-describedby="email-error"
          />
          <div id="email-error" role="alert">
            Please enter a valid email address
          </div>
        </div>
      )
      
      const input = screen.getByRole('textbox')
      const errorMessage = screen.getByRole('alert')
      
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby', 'email-error')
      expect(errorMessage).toHaveTextContent('Please enter a valid email address')
    })

    it('provides accessible error alerts', async () => {
      const { container } = render(
        <Alert.Root variant="error" icon={AlertIcons.error}>
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>
            An error occurred while processing your request. Please try again.
          </Alert.Description>
        </Alert.Root>
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
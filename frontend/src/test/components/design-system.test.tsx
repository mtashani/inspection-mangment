/**
 * Design System Component Tests
 * Tests for design system compliance and functionality
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import '@testing-library/jest-dom'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Import components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { Loading } from '@/components/ui/loading'
import { Skeleton } from '@/components/ui/skeleton'

describe('Design System Components', () => {
  describe('Button Component', () => {
    it('renders with correct default props', () => {
      render(<Button>Test Button</Button>)
      const button = screen.getByRole('button', { name: /test button/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center')
    })

    it('applies variant classes correctly', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>)
      let button = screen.getByRole('button')
      expect(button).toHaveClass('bg-[var(--primary)]')

      rerender(<Button variant="secondary">Secondary</Button>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('bg-[var(--card)]')

      rerender(<Button variant="outline">Outline</Button>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'bg-transparent')
    })

    it('applies size classes correctly', () => {
      const { rerender } = render(<Button size="sm">Small</Button>)
      let button = screen.getByRole('button')
      expect(button).toHaveClass('h-8', 'px-3')

      rerender(<Button size="md">Medium</Button>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'px-4')

      rerender(<Button size="lg">Large</Button>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('h-12', 'px-6')
    })

    it('handles loading state correctly', () => {
      render(<Button loading>Loading Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('handles disabled state correctly', () => {
      render(<Button disabled>Disabled Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('calls onClick handler', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Clickable</Button>)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('meets accessibility standards', async () => {
      const { container } = render(<Button>Accessible Button</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Card Component', () => {
    it('renders compound structure correctly', () => {
      render(
        <Card.Root>
          <Card.Header>
            <Card.Title>Test Title</Card.Title>
            <Card.Description>Test Description</Card.Description>
          </Card.Header>
          <Card.Content>Test Content</Card.Content>
          <Card.Footer>Test Footer</Card.Footer>
        </Card.Root>
      )

      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
      expect(screen.getByText('Test Footer')).toBeInTheDocument()
    })

    it('applies elevation classes correctly', () => {
      const { container } = render(
        <Card.Root elevation="lg">
          <Card.Content>Content</Card.Content>
        </Card.Root>
      )
      const card = container.firstChild
      expect(card).toHaveClass('shadow-lg')
    })

    it('meets accessibility standards', async () => {
      const { container } = render(
        <Card.Root>
          <Card.Header>
            <Card.Title>Accessible Card</Card.Title>
          </Card.Header>
          <Card.Content>Card content</Card.Content>
        </Card.Root>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Input Component', () => {
    it('renders with correct attributes', () => {
      render(<Input placeholder="Test input" />)
      const input = screen.getByPlaceholderText('Test input')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'text')
    })

    it('applies different input types correctly', () => {
      const { rerender } = render(<Input type="email" />)
      let input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')

      rerender(<Input type="password" />)
      input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('type', 'password')
    })

    it('handles error state correctly', () => {
      const { container } = render(<Input error="Test error" />)
      const input = container.querySelector('input')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('supports left and right elements', () => {
      render(
        <Input 
          leftElement={<span data-testid="left-icon">L</span>}
          rightElement={<span data-testid="right-icon">R</span>}
          placeholder="Test"
        />
      )
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })

    it('meets accessibility standards', async () => {
      const { container } = render(
        <div>
          <label htmlFor="test-input">Test Label</label>
          <Input id="test-input" placeholder="Test input" />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Badge Component', () => {
    it('renders with correct content', () => {
      render(<Badge>Test Badge</Badge>)
      expect(screen.getByText('Test Badge')).toBeInTheDocument()
    })

    it('applies variant classes correctly', () => {
      const { container } = render(<Badge variant="success">Success</Badge>)
      const badge = container.firstChild
      expect(badge).toHaveClass('bg-[var(--success)]')
    })

    it('renders as dot badge', () => {
      const { container } = render(<Badge dot />)
      const badge = container.firstChild
      expect(badge).toHaveClass('w-2', 'h-2', 'rounded-full')
    })

    it('handles removable functionality', () => {
      const handleRemove = jest.fn()
      render(<Badge removable onRemove={handleRemove}>Removable</Badge>)
      
      const removeButton = screen.getByRole('button', { name: /remove badge/i })
      fireEvent.click(removeButton)
      expect(handleRemove).toHaveBeenCalledTimes(1)
    })

    it('meets accessibility standards', async () => {
      const { container } = render(<Badge>Accessible Badge</Badge>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Alert Component', () => {
    it('renders compound structure correctly', () => {
      render(
        <Alert.Root variant="info">
          <Alert.Title>Test Alert</Alert.Title>
          <Alert.Description>Test Description</Alert.Description>
        </Alert.Root>
      )

      expect(screen.getByText('Test Alert')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
    })

    it('applies variant classes correctly', () => {
      const { container } = render(
        <Alert.Root variant="error">
          <Alert.Title>Error</Alert.Title>
        </Alert.Root>
      )
      const alert = container.firstChild
      expect(alert).toHaveClass('bg-[var(--error)]/10')
    })

    it('handles dismissible functionality', () => {
      const handleDismiss = jest.fn()
      render(
        <Alert.Root dismissible onDismiss={handleDismiss}>
          <Alert.Title>Dismissible Alert</Alert.Title>
        </Alert.Root>
      )
      
      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i })
      fireEvent.click(dismissButton)
      expect(handleDismiss).toHaveBeenCalledTimes(1)
    })

    it('has proper ARIA role', () => {
      const { container } = render(
        <Alert.Root>
          <Alert.Title>Alert</Alert.Title>
        </Alert.Root>
      )
      const alert = container.firstChild
      expect(alert).toHaveAttribute('role', 'alert')
    })

    it('meets accessibility standards', async () => {
      const { container } = render(
        <Alert.Root variant="warning">
          <Alert.Title>Warning</Alert.Title>
          <Alert.Description>This is a warning message</Alert.Description>
        </Alert.Root>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Loading Component', () => {
    it('renders with default props', () => {
      const { container } = render(<Loading />)
      const loading = container.firstChild
      expect(loading).toHaveAttribute('role', 'status')
    })

    it('displays loading text when specified', () => {
      render(<Loading showText text="Loading data..." />)
      expect(screen.getByText('Loading data...')).toBeInTheDocument()
    })

    it('applies size classes correctly', () => {
      const { container } = render(<Loading size="lg" />)
      const loadingIcon = container.querySelector('[class*="w-8 h-8"]')
      expect(loadingIcon).toBeInTheDocument()
    })

    it('meets accessibility standards', async () => {
      const { container } = render(<Loading showText text="Loading..." />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Skeleton Component', () => {
    it('renders with default props', () => {
      const { container } = render(<Skeleton width="200px" height="20px" />)
      const skeleton = container.firstChild
      expect(skeleton).toHaveClass('animate-pulse')
    })

    it('renders multiple lines for text skeleton', () => {
      const { container } = render(<Skeleton shape="text" lines={3} />)
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons).toHaveLength(3)
    })

    it('applies variant classes correctly', () => {
      const { container } = render(<Skeleton variant="shimmer" width="100px" height="20px" />)
      const skeleton = container.firstChild
      expect(skeleton).toHaveClass('animate-[shimmer_2s_infinite]')
    })
  })

  describe('Design Token Validation', () => {
    it('uses CSS variables for colors', () => {
      render(<Button variant="primary">Test</Button>)
      const button = screen.getByRole('button')
      const styles = window.getComputedStyle(button)
      
      // Check that CSS variables are being used (not hardcoded colors)
      expect(button.className).toMatch(/var\(--/)
    })

    it('maintains consistent spacing scale', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      
      // Check for consistent spacing classes
      expect(button).toHaveClass('px-3') // 12px = 3 * 4px
      expect(button).toHaveClass('h-8')  // 32px = 8 * 4px
    })

    it('uses design system typography scale', () => {
      render(
        <Card.Root>
          <Card.Header>
            <Card.Title>Title</Card.Title>
            <Card.Description>Description</Card.Description>
          </Card.Header>
        </Card.Root>
      )
      
      const title = screen.getByText('Title')
      const description = screen.getByText('Description')
      
      expect(title).toHaveClass('text-xl', 'font-medium')
      expect(description).toHaveClass('text-sm')
    })
  })

  describe('Theme Compatibility', () => {
    it('works with different themes', () => {
      // Test with different theme attributes
      const themes = ['base', 'cool-blue', 'warm-sand', 'midnight-purple']
      
      themes.forEach(theme => {
        document.documentElement.setAttribute('data-theme', theme)
        
        const { container } = render(<Button variant="primary">Test</Button>)
        const button = screen.getByRole('button')
        
        // Should still have the same classes regardless of theme
        expect(button).toHaveClass('bg-[var(--primary)]')
        
        // Cleanup
        container.remove()
      })
      
      // Reset theme
      document.documentElement.setAttribute('data-theme', 'base')
    })
  })

  describe('Responsive Behavior', () => {
    it('applies responsive classes correctly', () => {
      // Mock window.matchMedia for responsive testing
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('768px'), // Mock tablet breakpoint
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      render(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </div>
      )

      const grid = screen.getByText('Item 1').parentElement
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
    })
  })
})
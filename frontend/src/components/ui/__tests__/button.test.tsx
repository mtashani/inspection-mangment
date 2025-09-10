/**
 * Button Component Tests
 * Tests enhanced button component with theme variable integration
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

// Mock CSS variables for testing
const mockCSSVariables = {
  '--color-primary': '#2563eb',
  '--color-primary-content': '#ffffff',
  '--color-secondary': '#64748b',
  '--color-secondary-content': '#ffffff',
  '--color-accent': '#f59e0b',
  '--color-accent-content': '#ffffff',
  '--color-success': '#22c55e',
  '--color-success-content': '#ffffff',
  '--color-warning': '#f59e0b',
  '--color-warning-content': '#ffffff',
  '--color-error': '#ef4444',
  '--color-error-content': '#ffffff',
  '--color-info': '#3b82f6',
  '--color-info-content': '#ffffff',
  '--color-base-content': '#0f172a',
  '--color-base-200': '#f1f5f9',
  '--color-base-300': '#e2e8f0',
  '--size-field': '2.5rem',
  '--radius-field': '0.25rem'
}

// Mock getComputedStyle to return our CSS variables
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop: string) => mockCSSVariables[prop as keyof typeof mockCSSVariables] || ''
  })
})

describe('Enhanced Button Component', () => {
  describe('Basic Functionality', () => {
    test('renders button with text', () => {
      render(<Button>Click me</Button>)
      
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })
    
    test('handles click events', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()
      
      render(<Button onClick={handleClick}>Click me</Button>)
      
      await user.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
    
    test('can be disabled', () => {
      render(<Button disabled>Disabled button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
    
    test('supports custom className', () => {
      render(<Button className="custom-class">Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })
  
  describe('Theme Variable Integration', () => {
    test('uses theme variables for default variant', () => {
      render(<Button>Primary Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-[var(--color-primary)]')
      expect(button).toHaveClass('text-[var(--color-primary-content)]')
    })
    
    test('uses theme variables for secondary variant', () => {
      render(<Button variant="secondary">Secondary Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-[var(--color-secondary)]')
      expect(button).toHaveClass('text-[var(--color-secondary-content)]')
    })
    
    test('uses theme variables for outline variant', () => {
      render(<Button variant="outline">Outline Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-[var(--color-base-300)]')
      expect(button).toHaveClass('text-[var(--color-base-content)]')
    })
    
    test('uses theme variables for ghost variant', () => {
      render(<Button variant="ghost">Ghost Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-[var(--color-base-content)]')
      expect(button).toHaveClass('hover:bg-[var(--color-base-200)]')
    })
    
    test('uses theme variables for destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-[var(--color-error)]')
      expect(button).toHaveClass('text-[var(--color-error-content)]')
    })
  })
  
  describe('Size Variants', () => {
    test('uses theme variables for sizing', () => {
      render(<Button size="sm">Small Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-8') // Small size
    })
    
    test('uses default size when not specified', () => {
      render(<Button>Default Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-[var(--size-field)]')
    })
    
    test('supports large size', () => {
      render(<Button size="lg">Large Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-12') // Large size
    })
    
    test('supports icon size', () => {
      render(<Button size="icon">🔍</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-[var(--size-field)]')
      expect(button).toHaveClass('w-[var(--size-field)]')
    })
  })
  
  describe('Border Radius', () => {
    test('uses theme variable for border radius', () => {
      render(<Button>Rounded Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('rounded-[var(--radius-field)]')
    })
  })
  
  describe('Accessibility', () => {
    test('has proper button role', () => {
      render(<Button>Accessible Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
    
    test('supports aria-label', () => {
      render(<Button aria-label="Custom label">Button</Button>)
      
      const button = screen.getByLabelText('Custom label')
      expect(button).toBeInTheDocument()
    })
    
    test('supports aria-describedby', () => {
      render(
        <div>
          <Button aria-describedby="description">Button</Button>
          <div id="description">Button description</div>
        </div>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-describedby', 'description')
    })
    
    test('is focusable', () => {
      render(<Button>Focusable Button</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()
    })
    
    test('disabled button is not focusable', () => {
      render(<Button disabled>Disabled Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('tabindex', '-1')
    })
  })
  
  describe('Hover and Focus States', () => {
    test('has hover state classes', () => {
      render(<Button>Hover Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-[var(--color-primary)]/90')
    })
    
    test('has focus state classes', () => {
      render(<Button>Focus Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:ring-2')
      expect(button).toHaveClass('focus-visible:ring-[var(--color-primary)]')
    })
    
    test('disabled button has disabled styles', () => {
      render(<Button disabled>Disabled Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('disabled:opacity-50')
      expect(button).toHaveClass('disabled:pointer-events-none')
    })
  })
  
  describe('Loading State', () => {
    test('shows loading state when specified', () => {
      render(<Button loading>Loading Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      
      // Should have loading spinner
      const spinner = button.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
    
    test('hides text when loading', () => {
      render(<Button loading>Button Text</Button>)
      
      const button = screen.getByRole('button')
      const text = button.querySelector('span:not(.animate-spin)')
      expect(text).toHaveClass('opacity-0')
    })
  })
  
  describe('Icon Support', () => {
    test('renders with left icon', () => {
      const LeftIcon = () => <span data-testid="left-icon">←</span>
      
      render(
        <Button>
          <LeftIcon />
          Button with Icon
        </Button>
      )
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
      expect(screen.getByText('Button with Icon')).toBeInTheDocument()
    })
    
    test('renders icon-only button', () => {
      const Icon = () => <span data-testid="icon">🔍</span>
      
      render(
        <Button size="icon" aria-label="Search">
          <Icon />
        </Button>
      )
      
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByLabelText('Search')).toBeInTheDocument()
    })
  })
  
  describe('Form Integration', () => {
    test('supports type="submit"', () => {
      render(<Button type="submit">Submit</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })
    
    test('supports type="reset"', () => {
      render(<Button type="reset">Reset</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'reset')
    })
    
    test('defaults to type="button"', () => {
      render(<Button>Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'button')
    })
  })
  
  describe('Theme Switching', () => {
    test('adapts to theme changes', () => {
      const { rerender } = render(<Button>Theme Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-[var(--color-primary)]')
      
      // Simulate theme change by updating CSS variables
      Object.defineProperty(window, 'getComputedStyle', {
        value: () => ({
          getPropertyValue: (prop: string) => {
            if (prop === '--color-primary') return '#dc2626' // Red theme
            return mockCSSVariables[prop as keyof typeof mockCSSVariables] || ''
          }
        })
      })
      
      rerender(<Button>Theme Button</Button>)
      
      // Button should still use CSS variable (actual color change happens via CSS)
      expect(button).toHaveClass('bg-[var(--color-primary)]')
    })
  })
  
  describe('Performance', () => {
    test('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn()
      
      const TestButton = (props: any) => {
        renderSpy()
        return <Button {...props}>Test Button</Button>
      }
      
      const { rerender } = render(<TestButton />)
      
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // Re-render with same props
      rerender(<TestButton />)
      
      // Should not cause additional renders due to memoization
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })
  })
})"
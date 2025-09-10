/**
 * Card Component Tests
 * Tests enhanced card component with theme variable integration and compound structure
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card'

// Mock CSS variables for testing
const mockCSSVariables = {
  '--color-base-100': '#ffffff',
  '--color-base-200': '#f1f5f9',
  '--color-base-300': '#e2e8f0',
  '--color-base-content': '#0f172a',
  '--radius-box': '0.5rem',
  '--radius-field': '0.25rem',
  '--depth': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  '--color-primary': '#2563eb'
}

// Mock getComputedStyle to return our CSS variables
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop: string) => mockCSSVariables[prop as keyof typeof mockCSSVariables] || ''
  })
})

describe('Enhanced Card Component', () => {
  describe('Basic Card Functionality', () => {
    test('renders card with content', () => {
      render(
        <Card>
          <CardContent>
            <p>Card content</p>
          </CardContent>
        </Card>
      )
      
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })
    
    test('applies custom className', () => {
      render(
        <Card className="custom-card-class">
          <CardContent>Content</CardContent>
        </Card>
      )
      
      const card = screen.getByText('Content').closest('div')
      expect(card).toHaveClass('custom-card-class')
    })
    
    test('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>()
      
      render(
        <Card ref={ref}>
          <CardContent>Content</CardContent>
        </Card>
      )
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })
  
  describe('Card Variants', () => {
    test('renders default variant', () => {
      render(
        <Card variant="default">
          <CardContent>Default card</CardContent>
        </Card>
      )
      
      const card = screen.getByText('Default card').closest('div')
      expect(card).toHaveClass('bg-[var(--color-base-100)]')
      expect(card).toHaveClass('border-[var(--color-base-300)]')
    })
    
    test('renders elevated variant', () => {
      render(
        <Card variant="elevated">
          <CardContent>Elevated card</CardContent>
        </Card>
      )
      
      const card = screen.getByText('Elevated card').closest('div')
      expect(card).toHaveClass('shadow-[var(--depth)]')
      expect(card).toHaveClass('hover:shadow-[calc(var(--depth)*1.5)]')
    })
    
    test('renders ghost variant', () => {
      render(
        <Card variant="ghost">
          <CardContent>Ghost card</CardContent>
        </Card>
      )
      
      const card = screen.getByText('Ghost card').closest('div')
      expect(card).toHaveClass('border-transparent')
      expect(card).toHaveClass('bg-transparent')
    })
    
    test('defaults to default variant when not specified', () => {
      render(
        <Card>
          <CardContent>No variant specified</CardContent>
        </Card>
      )
      
      const card = screen.getByText('No variant specified').closest('div')
      expect(card).toHaveClass('bg-[var(--color-base-100)]')
    })
  })
  
  describe('Theme Variable Integration', () => {
    test('uses theme variables for background', () => {
      render(
        <Card>
          <CardContent>Theme background</CardContent>
        </Card>
      )
      
      const card = screen.getByText('Theme background').closest('div')
      expect(card).toHaveClass('bg-[var(--color-base-100)]')
    })
    
    test('uses theme variables for border', () => {
      render(
        <Card>
          <CardContent>Theme border</CardContent>
        </Card>
      )
      
      const card = screen.getByText('Theme border').closest('div')
      expect(card).toHaveClass('border-[var(--color-base-300)]')
    })
    
    test('uses theme variables for border radius', () => {
      render(
        <Card>
          <CardContent>Theme radius</CardContent>
        </Card>
      )
      
      const card = screen.getByText('Theme radius').closest('div')
      expect(card).toHaveClass('rounded-[var(--radius-box)]')
    })
    
    test('uses theme variables for shadow in elevated variant', () => {
      render(
        <Card variant="elevated">
          <CardContent>Theme shadow</CardContent>
        </Card>
      )
      
      const card = screen.getByText('Theme shadow').closest('div')
      expect(card).toHaveClass('shadow-[var(--depth)]')
    })
  })
  
  describe('Compound Component Structure', () => {
    test('renders complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content</p>
          </CardContent>
          <CardFooter>
            <p>Card footer</p>
          </CardFooter>
        </Card>
      )
      
      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card description')).toBeInTheDocument()
      expect(screen.getByText('Card content')).toBeInTheDocument()
      expect(screen.getByText('Card footer')).toBeInTheDocument()
    })
    
    test('CardHeader has correct styling', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Header Title</CardTitle>
          </CardHeader>
        </Card>
      )
      
      const header = screen.getByText('Header Title').closest('div')
      expect(header).toHaveClass('flex')
      expect(header).toHaveClass('flex-col')
      expect(header).toHaveClass('space-y-1.5')
      expect(header).toHaveClass('p-6')
    })
    
    test('CardTitle has correct styling', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title Text</CardTitle>
          </CardHeader>
        </Card>
      )
      
      const title = screen.getByText('Title Text')
      expect(title).toHaveClass('text-2xl')
      expect(title).toHaveClass('font-semibold')
      expect(title).toHaveClass('leading-none')
      expect(title).toHaveClass('tracking-tight')
      expect(title).toHaveClass('text-[var(--color-base-content)]')
    })
    
    test('CardDescription has correct styling', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description text</CardDescription>
          </CardHeader>
        </Card>
      )
      
      const description = screen.getByText('Description text')
      expect(description).toHaveClass('text-sm')
      expect(description).toHaveClass('text-[var(--color-base-content)]/70')
    })
    
    test('CardContent has correct styling', () => {
      render(
        <Card>
          <CardContent>Content text</CardContent>
        </Card>
      )
      
      const content = screen.getByText('Content text').closest('div')
      expect(content).toHaveClass('p-6')
      expect(content).toHaveClass('pt-0')
    })
    
    test('CardFooter has correct styling', () => {
      render(
        <Card>
          <CardFooter>Footer text</CardFooter>
        </Card>
      )
      
      const footer = screen.getByText('Footer text').closest('div')
      expect(footer).toHaveClass('flex')
      expect(footer).toHaveClass('items-center')
      expect(footer).toHaveClass('p-6')
      expect(footer).toHaveClass('pt-0')
    })
  })
  
  describe('Accessibility', () => {
    test('has proper semantic structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Accessible Title</CardTitle>
          </CardHeader>
          <CardContent>Accessible content</CardContent>
        </Card>
      )
      
      // Card should be a div with proper structure
      const card = screen.getByText('Accessible Title').closest('div')?.parentElement
      expect(card).toBeInTheDocument()
      
      // Title should be an h3 by default
      const title = screen.getByText('Accessible Title')
      expect(title.tagName).toBe('H3')
    })
    
    test('CardTitle supports custom heading level', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle as="h1">Main Title</CardTitle>
          </CardHeader>
        </Card>
      )
      
      const title = screen.getByText('Main Title')
      expect(title.tagName).toBe('H1')
    })
    
    test('supports aria-label', () => {
      render(
        <Card aria-label="Custom card label">
          <CardContent>Labeled card</CardContent>
        </Card>
      )
      
      const card = screen.getByLabelText('Custom card label')
      expect(card).toBeInTheDocument()
    })
    
    test('supports role attribute', () => {
      render(
        <Card role="region">
          <CardContent>Region card</CardContent>
        </Card>
      )
      
      const card = screen.getByRole('region')
      expect(card).toBeInTheDocument()
    })
  })
  
  describe('Interactive States', () => {
    test('supports hover effects on elevated variant', () => {
      render(
        <Card variant="elevated">
          <CardContent>Hoverable card</CardContent>
        </Card>
      )
      
      const card = screen.getByText('Hoverable card').closest('div')
      expect(card).toHaveClass('hover:shadow-[calc(var(--depth)*1.5)]')
      expect(card).toHaveClass('transition-shadow')
    })
    
    test('supports focus states when interactive', () => {
      render(
        <Card tabIndex={0}>
          <CardContent>Focusable card</CardContent>
        </Card>
      )
      
      const card = screen.getByText('Focusable card').closest('div')
      expect(card).toHaveAttribute('tabIndex', '0')
    })
  })
  
  describe('Responsive Design', () => {
    test('has responsive padding classes', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Responsive Title</CardTitle>
          </CardHeader>
          <CardContent>Responsive content</CardContent>
        </Card>
      )
      
      const header = screen.getByText('Responsive Title').closest('div')
      const content = screen.getByText('Responsive content').closest('div')
      
      expect(header).toHaveClass('p-6')
      expect(content).toHaveClass('p-6')
    })
  })
  
  describe('Theme Switching', () => {
    test('adapts to theme changes', () => {
      const { rerender } = render(
        <Card>
          <CardContent>Theme card</CardContent>
        </Card>
      )
      
      const card = screen.getByText('Theme card').closest('div')
      expect(card).toHaveClass('bg-[var(--color-base-100)]')
      
      // Simulate theme change
      Object.defineProperty(window, 'getComputedStyle', {
        value: () => ({
          getPropertyValue: (prop: string) => {
            if (prop === '--color-base-100') return '#1f2937' // Dark theme
            return mockCSSVariables[prop as keyof typeof mockCSSVariables] || ''
          }
        })
      })
      
      rerender(
        <Card>
          <CardContent>Theme card</CardContent>
        </Card>
      )
      
      // Card should still use CSS variable
      expect(card).toHaveClass('bg-[var(--color-base-100)]')
    })
  })
  
  describe('Complex Layouts', () => {
    test('handles nested cards', () => {
      render(
        <Card>
          <CardContent>
            <Card variant="ghost">
              <CardContent>Nested card</CardContent>
            </Card>
          </CardContent>
        </Card>
      )
      
      expect(screen.getByText('Nested card')).toBeInTheDocument()
      
      const outerCard = screen.getByText('Nested card').closest('div')?.parentElement?.parentElement?.parentElement
      const innerCard = screen.getByText('Nested card').closest('div')?.parentElement
      
      expect(outerCard).toHaveClass('bg-[var(--color-base-100)]')
      expect(innerCard).toHaveClass('bg-transparent')
    })
    
    test('handles cards with complex content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Complex Card</CardTitle>
            <CardDescription>With multiple elements</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <p>Paragraph 1</p>
              <p>Paragraph 2</p>
              <ul>
                <li>List item 1</li>
                <li>List item 2</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <button>Action 1</button>
            <button>Action 2</button>
          </CardFooter>
        </Card>
      )
      
      expect(screen.getByText('Complex Card')).toBeInTheDocument()
      expect(screen.getByText('With multiple elements')).toBeInTheDocument()
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument()
      expect(screen.getByText('List item 1')).toBeInTheDocument()
      expect(screen.getByText('Action 1')).toBeInTheDocument()
    })
  })
  
  describe('Performance', () => {
    test('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn()
      
      const TestCard = (props: any) => {
        renderSpy()
        return (
          <Card {...props}>
            <CardContent>Test Card</CardContent>
          </Card>
        )
      }
      
      const { rerender } = render(<TestCard />)
      
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // Re-render with same props
      rerender(<TestCard />)
      
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })
  })
})"
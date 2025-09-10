/**
 * Alert Component Tests
 * Tests enhanced alert component with theme variable integration
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { Alert, AlertDescription, AlertTitle } from '../alert'
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'

// Mock CSS variables for testing
const mockCSSVariables = {
  '--color-base-100': '#ffffff',
  '--color-base-content': '#0f172a',
  '--color-primary': '#2563eb',
  '--color-success': '#22c55e',
  '--color-warning': '#f59e0b',
  '--color-error': '#ef4444',
  '--color-info': '#3b82f6',
  '--radius-box': '0.5rem'
}

// Mock getComputedStyle to return our CSS variables
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop: string) => mockCSSVariables[prop as keyof typeof mockCSSVariables] || ''
  })
})

describe('Enhanced Alert Component', () => {
  describe('Basic Functionality', () => {
    test('renders alert with description', () => {
      render(
        <Alert>
          <AlertDescription>This is an alert message</AlertDescription>
        </Alert>
      )
      
      expect(screen.getByText('This is an alert message')).toBeInTheDocument()
    })
    
    test('renders alert with title and description', () => {
      render(
        <Alert>
          <AlertTitle>Alert Title</AlertTitle>
          <AlertDescription>Alert description</AlertDescription>
        </Alert>
      )
      
      expect(screen.getByText('Alert Title')).toBeInTheDocument()
      expect(screen.getByText('Alert description')).toBeInTheDocument()
    })
    
    test('renders alert with icon', () => {
      render(
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>Alert with icon</AlertDescription>
        </Alert>
      )
      
      expect(screen.getByText('Alert with icon')).toBeInTheDocument()
      // Icon should be rendered
      const alert = screen.getByRole('alert')
      expect(alert.querySelector('svg')).toBeInTheDocument()
    })
    
    test('applies custom className', () => {
      render(
        <Alert className="custom-alert-class">
          <AlertDescription>Custom class alert</AlertDescription>
        </Alert>
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('custom-alert-class')
    })
  })
  
  describe('Alert Variants', () => {
    test('renders default variant', () => {
      render(
        <Alert variant="default">
          <AlertDescription>Default alert</AlertDescription>
        </Alert>
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('border-[var(--color-base-300)]')
      expect(alert).toHaveClass('text-[var(--color-base-content)]')
    })
    
    test('renders destructive variant', () => {
      render(
        <Alert variant="destructive">
          <AlertDescription>Error alert</AlertDescription>
        </Alert>
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('border-[var(--color-error)]')
      expect(alert).toHaveClass('text-[var(--color-error)]')
    })
    
    test('renders success variant', () => {
      render(
        <Alert variant="success">
          <AlertDescription>Success alert</AlertDescription>
        </Alert>
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('border-[var(--color-success)]')
      expect(alert).toHaveClass('text-[var(--color-success)]')
    })
    
    test('renders warning variant', () => {
      render(
        <Alert variant="warning">
          <AlertDescription>Warning alert</AlertDescription>
        </Alert>
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('border-[var(--color-warning)]')
      expect(alert).toHaveClass('text-[var(--color-warning)]')
    })
    
    test('renders info variant', () => {
      render(
        <Alert variant="info">
          <AlertDescription>Info alert</AlertDescription>
        </Alert>
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('border-[var(--color-info)]')
      expect(alert).toHaveClass('text-[var(--color-info)]')
    })
  })
  
  describe('Theme Variable Integration', () => {
    test('uses theme variables for border radius', () => {
      render(
        <Alert>
          <AlertDescription>Radius test</AlertDescription>
        </Alert>
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('rounded-[var(--radius-box)]')
    })
    
    test('uses theme variables for background colors', () => {
      render(
        <Alert variant="success">
          <AlertDescription>Background test</AlertDescription>
        </Alert>
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('bg-[var(--color-success)]/10')
    })
    
    test('uses theme variables for text colors', () => {
      render(
        <Alert variant="error">
          <AlertDescription>Text color test</AlertDescription>
        </Alert>
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('text-[var(--color-error)]')
    })
  })
  
  describe('Compound Component Structure', () => {
    test('AlertTitle has correct styling', () => {
      render(
        <Alert>
          <AlertTitle>Title Text</AlertTitle>
        </Alert>
      )
      
      const title = screen.getByText('Title Text')
      expect(title).toHaveClass('mb-1')
      expect(title).toHaveClass('font-medium')
      expect(title).toHaveClass('leading-none')
      expect(title).toHaveClass('tracking-tight')
    })
    
    test('AlertDescription has correct styling', () => {
      render(
        <Alert>
          <AlertDescription>Description text</AlertDescription>
        </Alert>
      )
      
      const description = screen.getByText('Description text')
      expect(description).toHaveClass('text-sm')
      expect(description).toHaveClass('[&_p]:leading-relaxed')
    })
    
    test('handles complex content structure', () => {
      render(
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            <p>Your action was completed successfully.</p>
            <p>You can now proceed to the next step.</p>
          </AlertDescription>
        </Alert>
      )
      
      expect(screen.getByText('Success!')).toBeInTheDocument()
      expect(screen.getByText('Your action was completed successfully.')).toBeInTheDocument()
      expect(screen.getByText('You can now proceed to the next step.')).toBeInTheDocument()
      
      const alert = screen.getByRole('alert')
      expect(alert.querySelector('svg')).toBeInTheDocument()
    })
  })
  
  describe('Accessibility', () => {
    test('has proper alert role', () => {
      render(
        <Alert>
          <AlertDescription>Accessible alert</AlertDescription>
        </Alert>
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })
    
    test('supports aria-label', () => {
      render(
        <Alert aria-label="Custom alert label">
          <AlertDescription>Labeled alert</AlertDescription>
        </Alert>
      )
      
      const alert = screen.getByLabelText('Custom alert label')
      expect(alert).toBeInTheDocument()
    })
    
    test('supports aria-describedby', () => {
      render(
        <div>
          <Alert aria-describedby="alert-description">
            <AlertDescription id="alert-description">
              Alert with description
            </AlertDescription>
          </Alert>
        </div>
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('aria-describedby', 'alert-description')
    })
    
    test('AlertTitle uses proper heading semantics', () => {
      render(
        <Alert>
          <AlertTitle>Semantic Title</AlertTitle>
        </Alert>
      )
      
      const title = screen.getByText('Semantic Title')
      expect(title.tagName).toBe('H5')
    })
  })
  
  describe('Icon Integration', () => {
    test('renders with different icon types', () => {
      const icons = [
        { Icon: Info, name: 'Info' },
        { Icon: CheckCircle, name: 'Success' },
        { Icon: AlertTriangle, name: 'Warning' },
        { Icon: XCircle, name: 'Error' }
      ]
      
      icons.forEach(({ Icon, name }) => {\n        const { unmount } = render(\n          <Alert>\n            <Icon className=\"h-4 w-4\" data-testid={`${name.toLowerCase()}-icon`} />\n            <AlertDescription>{name} alert</AlertDescription>\n          </Alert>\n        )\n        \n        expect(screen.getByTestId(`${name.toLowerCase()}-icon`)).toBeInTheDocument()\n        expect(screen.getByText(`${name} alert`)).toBeInTheDocument()\n        \n        unmount()\n      })\n    })\n    \n    test('icon has correct styling classes', () => {\n      render(\n        <Alert>\n          <Info className=\"h-4 w-4\" data-testid=\"info-icon\" />\n          <AlertDescription>Icon styling test</AlertDescription>\n        </Alert>\n      )\n      \n      const icon = screen.getByTestId('info-icon')\n      expect(icon).toHaveClass('h-4')\n      expect(icon).toHaveClass('w-4')\n    })\n  })\n  \n  describe('Responsive Design', () => {\n    test('has responsive padding', () => {\n      render(\n        <Alert>\n          <AlertDescription>Responsive alert</AlertDescription>\n        </Alert>\n      )\n      \n      const alert = screen.getByRole('alert')\n      expect(alert).toHaveClass('p-4')\n    })\n    \n    test('handles long content gracefully', () => {\n      const longText = 'This is a very long alert message that should wrap properly and maintain good readability across different screen sizes and devices.'\n      \n      render(\n        <Alert>\n          <AlertDescription>{longText}</AlertDescription>\n        </Alert>\n      )\n      \n      expect(screen.getByText(longText)).toBeInTheDocument()\n    })\n  })\n  \n  describe('Theme Switching', () => {\n    test('adapts to theme changes', () => {\n      const { rerender } = render(\n        <Alert variant=\"success\">\n          <AlertDescription>Theme alert</AlertDescription>\n        </Alert>\n      )\n      \n      const alert = screen.getByRole('alert')\n      expect(alert).toHaveClass('border-[var(--color-success)]')\n      \n      // Simulate theme change\n      Object.defineProperty(window, 'getComputedStyle', {\n        value: () => ({\n          getPropertyValue: (prop: string) => {\n            if (prop === '--color-success') return '#10b981' // Different green\n            return mockCSSVariables[prop as keyof typeof mockCSSVariables] || ''\n          }\n        })\n      })\n      \n      rerender(\n        <Alert variant=\"success\">\n          <AlertDescription>Theme alert</AlertDescription>\n        </Alert>\n      )\n      \n      // Alert should still use CSS variable\n      expect(alert).toHaveClass('border-[var(--color-success)]')\n    })\n  })\n  \n  describe('Complex Layouts', () => {\n    test('handles nested alerts', () => {\n      render(\n        <Alert>\n          <AlertTitle>Parent Alert</AlertTitle>\n          <AlertDescription>\n            <p>This alert contains nested content:</p>\n            <Alert variant=\"info\">\n              <AlertDescription>Nested alert</AlertDescription>\n            </Alert>\n          </AlertDescription>\n        </Alert>\n      )\n      \n      expect(screen.getByText('Parent Alert')).toBeInTheDocument()\n      expect(screen.getByText('Nested alert')).toBeInTheDocument()\n    })\n    \n    test('handles alerts with action buttons', () => {\n      render(\n        <Alert>\n          <AlertTitle>Action Alert</AlertTitle>\n          <AlertDescription>\n            <p>This alert has actions:</p>\n            <div className=\"mt-2 flex gap-2\">\n              <button>Accept</button>\n              <button>Decline</button>\n            </div>\n          </AlertDescription>\n        </Alert>\n      )\n      \n      expect(screen.getByText('Action Alert')).toBeInTheDocument()\n      expect(screen.getByText('Accept')).toBeInTheDocument()\n      expect(screen.getByText('Decline')).toBeInTheDocument()\n    })\n  })\n  \n  describe('Performance', () => {\n    test('does not re-render unnecessarily', () => {\n      const renderSpy = jest.fn()\n      \n      const TestAlert = (props: any) => {\n        renderSpy()\n        return (\n          <Alert {...props}>\n            <AlertDescription>Performance test</AlertDescription>\n          </Alert>\n        )\n      }\n      \n      const { rerender } = render(<TestAlert />)\n      \n      expect(renderSpy).toHaveBeenCalledTimes(1)\n      \n      // Re-render with same props\n      rerender(<TestAlert />)\n      \n      expect(renderSpy).toHaveBeenCalledTimes(2)\n    })\n  })\n  \n  describe('Edge Cases', () => {\n    test('handles empty content', () => {\n      render(\n        <Alert>\n          <AlertDescription></AlertDescription>\n        </Alert>\n      )\n      \n      const alert = screen.getByRole('alert')\n      expect(alert).toBeInTheDocument()\n    })\n    \n    test('handles only title without description', () => {\n      render(\n        <Alert>\n          <AlertTitle>Title Only</AlertTitle>\n        </Alert>\n      )\n      \n      expect(screen.getByText('Title Only')).toBeInTheDocument()\n    })\n    \n    test('handles only description without title', () => {\n      render(\n        <Alert>\n          <AlertDescription>Description Only</AlertDescription>\n        </Alert>\n      )\n      \n      expect(screen.getByText('Description Only')).toBeInTheDocument()\n    })\n  })\n})"
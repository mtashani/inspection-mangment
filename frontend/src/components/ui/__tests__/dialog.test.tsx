/**
 * Enhanced Dialog Component Tests
 * Tests theme variable integration and dialog functionality
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogClose
} from '../dialog'

// Mock CSS variables for testing
const mockCSSVariables = {
  '--color-base-100': '#ffffff',
  '--color-base-200': '#f8fafc',
  '--color-base-300': '#f1f5f9',
  '--color-base-content': '#0f172a',
  '--radius-box': '0.75rem',
  '--depth': '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
}

// Mock getComputedStyle to return our CSS variables
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop: string) => mockCSSVariables[prop as keyof typeof mockCSSVariables] || ''
  })
})

// Mock Radix UI Portal for testing
jest.mock('@radix-ui/react-dialog', () => {
  const actual = jest.requireActual('@radix-ui/react-dialog')
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-portal">{children}</div>
  }
})

describe('Enhanced Dialog Component', () => {
  describe('Theme Variable Integration', () => {
    test('dialog content uses --radius-box for border radius', async () => {
      render(
        <Dialog open>
          <DialogContent data-testid="dialog-content">
            Dialog content
          </DialogContent>
        </Dialog>
      )
      
      const content = screen.getByTestId('dialog-content')
      expect(content).toHaveClass('rounded-[var(--radius-box)]')
    })
    
    test('dialog content uses base color variables', async () => {
      render(
        <Dialog open>
          <DialogContent data-testid="dialog-content">
            Dialog content
          </DialogContent>
        </Dialog>
      )
      
      const content = screen.getByTestId('dialog-content')
      expect(content).toHaveClass('bg-[var(--color-base-100)]')
      expect(content).toHaveClass('text-[var(--color-base-content)]')
      expect(content).toHaveClass('border-[var(--color-base-300)]')
    })
    
    test('dialog content uses --depth variable for shadow', async () => {
      render(
        <Dialog open>
          <DialogContent data-testid="dialog-content">
            Dialog content
          </DialogContent>
        </Dialog>
      )
      
      const content = screen.getByTestId('dialog-content')
      expect(content).toHaveClass('shadow-[var(--depth)]')
    })
    
    test('dialog overlay uses base content color for background', async () => {
      render(
        <Dialog open>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      )
      
      // Overlay should be rendered
      const overlay = document.querySelector('[data-radix-dialog-overlay]')
      expect(overlay).toHaveClass('bg-[var(--color-base-content)]/80')
    })
  })
  
  describe('Dialog Structure', () => {
    test('renders complete dialog structure', async () => {
      render(
        <Dialog open>
          <DialogContent data-testid="dialog-content">
            <DialogHeader data-testid="dialog-header">
              <DialogTitle data-testid="dialog-title">Dialog Title</DialogTitle>
              <DialogDescription data-testid="dialog-description">
                Dialog description
              </DialogDescription>
            </DialogHeader>
            <div data-testid="dialog-body">Dialog body content</div>
            <DialogFooter data-testid="dialog-footer">
              <DialogClose data-testid="dialog-close">Close</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
      
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument()
      expect(screen.getByTestId('dialog-header')).toBeInTheDocument()
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      expect(screen.getByTestId('dialog-description')).toBeInTheDocument()
      expect(screen.getByTestId('dialog-body')).toBeInTheDocument()
      expect(screen.getByTestId('dialog-footer')).toBeInTheDocument()
      expect(screen.getByTestId('dialog-close')).toBeInTheDocument()
      
      expect(screen.getByText('Dialog Title')).toBeInTheDocument()
      expect(screen.getByText('Dialog description')).toBeInTheDocument()
      expect(screen.getByText('Dialog body content')).toBeInTheDocument()
    })
    
    test('renders with trigger', async () => {
      render(
        <Dialog>
          <DialogTrigger data-testid="dialog-trigger">Open Dialog</DialogTrigger>
          <DialogContent data-testid="dialog-content">
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )
      
      const trigger = screen.getByTestId('dialog-trigger')
      expect(trigger).toBeInTheDocument()
      expect(screen.getByText('Open Dialog')).toBeInTheDocument()
      
      // Dialog content should not be visible initially
      expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument()
    })
  })
  
  describe('Dialog Title Component', () => {
    test('renders with proper styling and theme variables', async () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle data-testid="dialog-title">Test Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )
      
      const title = screen.getByTestId('dialog-title')
      expect(title).toHaveClass('text-lg')
      expect(title).toHaveClass('font-semibold')
      expect(title).toHaveClass('leading-none')
      expect(title).toHaveClass('tracking-tight')
      expect(title).toHaveClass('text-[var(--color-base-content)]')
      expect(screen.getByText('Test Title')).toBeInTheDocument()
    })
    
    test('supports custom className', async () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle className="custom-title-class">Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )
      
      const title = screen.getByText('Title')
      expect(title).toHaveClass('custom-title-class')
      expect(title).toHaveClass('font-semibold') // Should still have base classes
    })
  })
  
  describe('Dialog Description Component', () => {
    test('renders with proper styling and theme variables', async () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogDescription data-testid="dialog-description">
              Test description
            </DialogDescription>
          </DialogContent>
        </Dialog>
      )
      
      const description = screen.getByTestId('dialog-description')
      expect(description).toHaveClass('text-sm')
      expect(description).toHaveClass('text-[var(--color-base-content)]/70')
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })
    
    test('supports custom className', async () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogDescription className="custom-description-class">
              Description
            </DialogDescription>
          </DialogContent>
        </Dialog>
      )
      
      const description = screen.getByText('Description')
      expect(description).toHaveClass('custom-description-class')
      expect(description).toHaveClass('text-sm') // Should still have base classes
    })
  })
  
  describe('Dialog Header Component', () => {
    test('renders with proper layout classes', async () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader data-testid="dialog-header">
              <DialogTitle>Title</DialogTitle>
              <DialogDescription>Description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )
      
      const header = screen.getByTestId('dialog-header')
      expect(header).toHaveClass('flex')
      expect(header).toHaveClass('flex-col')
      expect(header).toHaveClass('space-y-1.5')
      expect(header).toHaveClass('text-center')
      expect(header).toHaveClass('sm:text-left')
    })
    
    test('supports custom className', async () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader className="custom-header-class">
              Header content
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )
      
      const header = screen.getByText('Header content').parentElement
      expect(header).toHaveClass('custom-header-class')
      expect(header).toHaveClass('flex') // Should still have base classes
    })
  })
  
  describe('Dialog Footer Component', () => {
    test('renders with proper layout classes', async () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogFooter data-testid="dialog-footer">
              <button>Cancel</button>
              <button>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
      
      const footer = screen.getByTestId('dialog-footer')
      expect(footer).toHaveClass('flex')
      expect(footer).toHaveClass('flex-col-reverse')
      expect(footer).toHaveClass('sm:flex-row')
      expect(footer).toHaveClass('sm:justify-end')
      expect(footer).toHaveClass('sm:space-x-2')
    })
    
    test('supports custom className', async () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogFooter className="custom-footer-class">
              Footer content
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
      
      const footer = screen.getByText('Footer content').parentElement
      expect(footer).toHaveClass('custom-footer-class')
      expect(footer).toHaveClass('flex') // Should still have base classes
    })
  })
  
  describe('Dialog Close Button', () => {
    test('renders close button with proper styling', async () => {
      render(
        <Dialog open>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      )
      
      const closeButton = screen.getByRole('button', { name: 'Close' })
      expect(closeButton).toBeInTheDocument()
      expect(closeButton).toHaveClass('absolute')
      expect(closeButton).toHaveClass('right-4')
      expect(closeButton).toHaveClass('top-4')
      expect(closeButton).toHaveClass('opacity-70')
      expect(closeButton).toHaveClass('transition-opacity')
      expect(closeButton).toHaveClass('hover:opacity-100')
      expect(closeButton).toHaveClass('rounded-[calc(var(--radius-box)*0.5)]')
    })
    
    test('close button has focus styles', async () => {
      render(
        <Dialog open>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      )
      
      const closeButton = screen.getByRole('button', { name: 'Close' })
      expect(closeButton).toHaveClass('focus:outline-none')
      expect(closeButton).toHaveClass('focus:ring-2')
      expect(closeButton).toHaveClass('focus:ring-ring')
      expect(closeButton).toHaveClass('focus:ring-offset-2')
    })
    
    test('close button uses theme variables for open state', async () => {
      render(
        <Dialog open>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      )
      
      const closeButton = screen.getByRole('button', { name: 'Close' })
      expect(closeButton).toHaveClass('data-[state=open]:bg-[var(--color-base-200)]')
      expect(closeButton).toHaveClass('data-[state=open]:text-[var(--color-base-content)]')
    })
  })
  
  describe('Dialog Animations', () => {
    test('dialog content has proper animation classes', async () => {
      render(
        <Dialog open>
          <DialogContent data-testid="dialog-content">
            Dialog content
          </DialogContent>
        </Dialog>
      )
      
      const content = screen.getByTestId('dialog-content')
      expect(content).toHaveClass('duration-200')
      expect(content).toHaveClass('data-[state=open]:animate-in')
      expect(content).toHaveClass('data-[state=closed]:animate-out')
      expect(content).toHaveClass('data-[state=closed]:fade-out-0')
      expect(content).toHaveClass('data-[state=open]:fade-in-0')
      expect(content).toHaveClass('data-[state=closed]:zoom-out-95')
      expect(content).toHaveClass('data-[state=open]:zoom-in-95')
    })
    
    test('dialog overlay has animation classes', async () => {
      render(
        <Dialog open>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      )
      
      const overlay = document.querySelector('[data-radix-dialog-overlay]')
      expect(overlay).toHaveClass('data-[state=open]:animate-in')
      expect(overlay).toHaveClass('data-[state=closed]:animate-out')
      expect(overlay).toHaveClass('data-[state=closed]:fade-out-0')
      expect(overlay).toHaveClass('data-[state=open]:fade-in-0')
      expect(overlay).toHaveClass('transition-all')
      expect(overlay).toHaveClass('duration-200')
    })
  })
  
  describe('Dialog Positioning', () => {
    test('dialog content has proper positioning classes', async () => {
      render(
        <Dialog open>
          <DialogContent data-testid="dialog-content">
            Dialog content
          </DialogContent>
        </Dialog>
      )
      
      const content = screen.getByTestId('dialog-content')
      expect(content).toHaveClass('fixed')
      expect(content).toHaveClass('left-[50%]')
      expect(content).toHaveClass('top-[50%]')
      expect(content).toHaveClass('z-50')
      expect(content).toHaveClass('translate-x-[-50%]')
      expect(content).toHaveClass('translate-y-[-50%]')
      expect(content).toHaveClass('w-full')
      expect(content).toHaveClass('max-w-lg')
    })
    
    test('dialog overlay covers full screen', async () => {
      render(
        <Dialog open>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      )
      
      const overlay = document.querySelector('[data-radix-dialog-overlay]')
      expect(overlay).toHaveClass('fixed')
      expect(overlay).toHaveClass('inset-0')
      expect(overlay).toHaveClass('z-50')
    })
  })
  
  describe('Accessibility', () => {
    test('dialog content supports custom attributes', async () => {
      render(
        <Dialog open>
          <DialogContent 
            data-testid="dialog-content"
            aria-describedby="dialog-description"
            id="custom-dialog"
          >
            Dialog content
          </DialogContent>
        </Dialog>
      )
      
      const content = screen.getByTestId('dialog-content')
      expect(content).toHaveAttribute('aria-describedby', 'dialog-description')
      expect(content).toHaveAttribute('id', 'custom-dialog')
    })
    
    test('close button has screen reader text', async () => {
      render(
        <Dialog open>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      )
      
      const closeButton = screen.getByRole('button', { name: 'Close' })
      expect(closeButton.querySelector('.sr-only')).toHaveTextContent('Close')
    })
    
    test('dialog title and description have proper semantic structure', async () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Important Dialog</DialogTitle>
            <DialogDescription>This is an important message</DialogDescription>
          </DialogContent>
        </Dialog>
      )
      
      // Title should be accessible
      expect(screen.getByText('Important Dialog')).toBeInTheDocument()
      expect(screen.getByText('This is an important message')).toBeInTheDocument()
    })
  })
  
  describe('Custom Styling', () => {
    test('supports custom className on all components', async () => {
      render(
        <Dialog open>
          <DialogContent className="custom-content">
            <DialogHeader className="custom-header">
              <DialogTitle className="custom-title">Title</DialogTitle>
              <DialogDescription className="custom-description">Description</DialogDescription>
            </DialogHeader>
            <DialogFooter className="custom-footer">Footer</DialogFooter>
          </DialogContent>
        </Dialog>
      )
      
      expect(screen.getByText('Title').closest('[class*="custom-content"]')).toBeInTheDocument()
      expect(screen.getByText('Title').parentElement).toHaveClass('custom-header')
      expect(screen.getByText('Title')).toHaveClass('custom-title')
      expect(screen.getByText('Description')).toHaveClass('custom-description')
      expect(screen.getByText('Footer').parentElement).toHaveClass('custom-footer')
    })
  })
})
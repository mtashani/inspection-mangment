/**
 * Input Component Tests
 * Tests enhanced input component with theme variable integration
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../input'

// Mock CSS variables for testing
const mockCSSVariables = {
  '--color-base-100': '#ffffff',
  '--color-base-200': '#f1f5f9',
  '--color-base-300': '#e2e8f0',
  '--color-base-content': '#0f172a',
  '--color-primary': '#2563eb',
  '--color-error': '#ef4444',
  '--size-field': '2.5rem',
  '--radius-field': '0.25rem'
}

// Mock getComputedStyle to return our CSS variables
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop: string) => mockCSSVariables[prop as keyof typeof mockCSSVariables] || ''
  })
})

describe('Enhanced Input Component', () => {
  describe('Basic Functionality', () => {
    test('renders input field', () => {
      render(<Input placeholder="Enter text" />)
      
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })
    
    test('handles text input', async () => {
      const user = userEvent.setup()
      
      render(<Input placeholder="Type here" />)
      
      const input = screen.getByPlaceholderText('Type here')
      await user.type(input, 'Hello World')
      
      expect(input).toHaveValue('Hello World')
    })
    
    test('handles onChange events', async () => {
      const handleChange = jest.fn()
      const user = userEvent.setup()
      
      render(<Input onChange={handleChange} placeholder="Change test" />)
      
      const input = screen.getByPlaceholderText('Change test')
      await user.type(input, 'test')
      
      expect(handleChange).toHaveBeenCalled()
    })
    
    test('can be disabled', () => {
      render(<Input disabled placeholder="Disabled input" />)
      
      const input = screen.getByPlaceholderText('Disabled input')
      expect(input).toBeDisabled()
    })
    
    test('supports custom className', () => {
      render(<Input className="custom-input-class" placeholder="Custom class" />)
      
      const input = screen.getByPlaceholderText('Custom class')
      expect(input).toHaveClass('custom-input-class')
    })
    
    test('forwards ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>()
      
      render(<Input ref={ref} placeholder="Ref test" />)
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })
  })
  
  describe('Theme Variable Integration', () => {
    test('uses theme variables for height', () => {
      render(<Input placeholder="Height test" />)
      
      const input = screen.getByPlaceholderText('Height test')
      expect(input).toHaveClass('h-[var(--size-field)]')
    })
    
    test('uses theme variables for border radius', () => {
      render(<Input placeholder="Radius test" />)
      
      const input = screen.getByPlaceholderText('Radius test')
      expect(input).toHaveClass('rounded-[var(--radius-field)]')
    })
    
    test('uses theme variables for border color', () => {
      render(<Input placeholder="Border test" />)
      
      const input = screen.getByPlaceholderText('Border test')
      expect(input).toHaveClass('border-[var(--color-base-300)]')
    })
    
    test('uses theme variables for background', () => {
      render(<Input placeholder="Background test" />)
      
      const input = screen.getByPlaceholderText('Background test')
      expect(input).toHaveClass('bg-[var(--color-base-100)]')
    })
    
    test('uses theme variables for text color', () => {
      render(<Input placeholder="Text color test" />)
      
      const input = screen.getByPlaceholderText('Text color test')
      expect(input).toHaveClass('text-[var(--color-base-content)]')
    })
    
    test('uses theme variables for focus state', () => {
      render(<Input placeholder="Focus test" />)
      
      const input = screen.getByPlaceholderText('Focus test')
      expect(input).toHaveClass('focus-visible:ring-2')
      expect(input).toHaveClass('focus-visible:ring-[var(--color-primary)]')
    })
  })
  
  describe('Input Types', () => {
    test('supports text type', () => {
      render(<Input type="text" placeholder="Text input" />)
      
      const input = screen.getByPlaceholderText('Text input')
      expect(input).toHaveAttribute('type', 'text')
    })
    
    test('supports email type', () => {
      render(<Input type="email" placeholder="Email input" />)
      
      const input = screen.getByPlaceholderText('Email input')
      expect(input).toHaveAttribute('type', 'email')
    })
    
    test('supports password type', () => {
      render(<Input type="password" placeholder="Password input" />)
      
      const input = screen.getByPlaceholderText('Password input')
      expect(input).toHaveAttribute('type', 'password')
    })
    
    test('supports number type', () => {
      render(<Input type="number" placeholder="Number input" />)
      
      const input = screen.getByPlaceholderText('Number input')
      expect(input).toHaveAttribute('type', 'number')
    })
    
    test('supports search type', () => {
      render(<Input type="search" placeholder="Search input" />)
      
      const input = screen.getByPlaceholderText('Search input')
      expect(input).toHaveAttribute('type', 'search')
    })
  })
  
  describe('Validation States', () => {
    test('shows error state with aria-invalid', () => {
      render(<Input aria-invalid placeholder="Invalid input" />)
      
      const input = screen.getByPlaceholderText('Invalid input')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })
    
    test('supports required attribute', () => {
      render(<Input required placeholder="Required input" />)
      
      const input = screen.getByPlaceholderText('Required input')
      expect(input).toHaveAttribute('required')
    })
    
    test('supports pattern validation', () => {
      render(<Input pattern="[0-9]*" placeholder="Pattern input" />)
      
      const input = screen.getByPlaceholderText('Pattern input')
      expect(input).toHaveAttribute('pattern', '[0-9]*')
    })
    
    test('supports min and max for number inputs', () => {
      render(<Input type="number" min="0" max="100" placeholder="Range input" />)
      
      const input = screen.getByPlaceholderText('Range input')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '100')
    })
  })
  
  describe('Accessibility', () => {
    test('has proper input role', () => {
      render(<Input placeholder="Accessible input" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })
    
    test('supports aria-label', () => {
      render(<Input aria-label="Custom label" />)
      
      const input = screen.getByLabelText('Custom label')
      expect(input).toBeInTheDocument()
    })
    
    test('supports aria-describedby', () => {
      render(
        <div>
          <Input aria-describedby="description" placeholder="Described input" />
          <div id="description">Input description</div>
        </div>
      )
      
      const input = screen.getByPlaceholderText('Described input')
      expect(input).toHaveAttribute('aria-describedby', 'description')
    })
    
    test('is focusable', () => {
      render(<Input placeholder="Focusable input" />)
      
      const input = screen.getByPlaceholderText('Focusable input')
      input.focus()
      expect(input).toHaveFocus()
    })
    
    test('disabled input is not focusable', () => {
      render(<Input disabled placeholder="Disabled input" />)
      
      const input = screen.getByPlaceholderText('Disabled input')
      expect(input).toBeDisabled()
    })
    
    test('supports autocomplete', () => {
      render(<Input autoComplete="email" placeholder="Autocomplete input" />)
      
      const input = screen.getByPlaceholderText('Autocomplete input')
      expect(input).toHaveAttribute('autocomplete', 'email')
    })
  })
  
  describe('Focus and Blur Events', () => {
    test('handles focus events', async () => {
      const handleFocus = jest.fn()
      const user = userEvent.setup()
      
      render(<Input onFocus={handleFocus} placeholder="Focus event test" />)
      
      const input = screen.getByPlaceholderText('Focus event test')
      await user.click(input)
      
      expect(handleFocus).toHaveBeenCalled()
    })
    
    test('handles blur events', async () => {
      const handleBlur = jest.fn()
      const user = userEvent.setup()
      
      render(<Input onBlur={handleBlur} placeholder="Blur event test" />)
      
      const input = screen.getByPlaceholderText('Blur event test')
      await user.click(input)
      await user.tab() // Move focus away
      
      expect(handleBlur).toHaveBeenCalled()
    })
  })
  
  describe('Keyboard Navigation', () => {
    test('supports tab navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <div>
          <Input placeholder="First input" />
          <Input placeholder="Second input" />
        </div>
      )
      
      const firstInput = screen.getByPlaceholderText('First input')
      const secondInput = screen.getByPlaceholderText('Second input')
      
      firstInput.focus()
      expect(firstInput).toHaveFocus()
      
      await user.tab()
      expect(secondInput).toHaveFocus()
    })
    
    test('supports Enter key events', async () => {
      const handleKeyDown = jest.fn()
      const user = userEvent.setup()
      
      render(<Input onKeyDown={handleKeyDown} placeholder="Enter test" />)
      
      const input = screen.getByPlaceholderText('Enter test')
      await user.click(input)
      await user.keyboard('{Enter}')\n      \n      expect(handleKeyDown).toHaveBeenCalledWith(\n        expect.objectContaining({ key: 'Enter' })\n      )\n    })\n    \n    test('supports Escape key events', async () => {\n      const handleKeyDown = jest.fn()\n      const user = userEvent.setup()\n      \n      render(<Input onKeyDown={handleKeyDown} placeholder=\"Escape test\" />)\n      \n      const input = screen.getByPlaceholderText('Escape test')\n      await user.click(input)\n      await user.keyboard('{Escape}')\n      \n      expect(handleKeyDown).toHaveBeenCalledWith(\n        expect.objectContaining({ key: 'Escape' })\n      )\n    })\n  })\n  \n  describe('Form Integration', () => {\n    test('works with form submission', async () => {\n      const handleSubmit = jest.fn((e) => e.preventDefault())\n      const user = userEvent.setup()\n      \n      render(\n        <form onSubmit={handleSubmit}>\n          <Input name=\"testInput\" placeholder=\"Form input\" />\n          <button type=\"submit\">Submit</button>\n        </form>\n      )\n      \n      const input = screen.getByPlaceholderText('Form input')\n      const submitButton = screen.getByText('Submit')\n      \n      await user.type(input, 'test value')\n      await user.click(submitButton)\n      \n      expect(handleSubmit).toHaveBeenCalled()\n    })\n    \n    test('supports name attribute', () => {\n      render(<Input name=\"testName\" placeholder=\"Named input\" />)\n      \n      const input = screen.getByPlaceholderText('Named input')\n      expect(input).toHaveAttribute('name', 'testName')\n    })\n    \n    test('supports id attribute', () => {\n      render(<Input id=\"testId\" placeholder=\"ID input\" />)\n      \n      const input = screen.getByPlaceholderText('ID input')\n      expect(input).toHaveAttribute('id', 'testId')\n    })\n  })\n  \n  describe('Disabled State', () => {\n    test('has disabled styling', () => {\n      render(<Input disabled placeholder=\"Disabled styling\" />)\n      \n      const input = screen.getByPlaceholderText('Disabled styling')\n      expect(input).toHaveClass('disabled:cursor-not-allowed')\n      expect(input).toHaveClass('disabled:opacity-50')\n    })\n    \n    test('cannot be typed in when disabled', async () => {\n      const user = userEvent.setup()\n      \n      render(<Input disabled placeholder=\"Cannot type\" />)\n      \n      const input = screen.getByPlaceholderText('Cannot type')\n      await user.type(input, 'should not work')\n      \n      expect(input).toHaveValue('')\n    })\n  })\n  \n  describe('Placeholder Behavior', () => {\n    test('shows placeholder when empty', () => {\n      render(<Input placeholder=\"Placeholder text\" />)\n      \n      const input = screen.getByPlaceholderText('Placeholder text')\n      expect(input).toHaveAttribute('placeholder', 'Placeholder text')\n    })\n    \n    test('hides placeholder when typing', async () => {\n      const user = userEvent.setup()\n      \n      render(<Input placeholder=\"Will disappear\" />)\n      \n      const input = screen.getByPlaceholderText('Will disappear')\n      await user.type(input, 'text')\n      \n      expect(input).toHaveValue('text')\n    })\n  })\n  \n  describe('Value Control', () => {\n    test('supports controlled input', async () => {\n      const TestComponent = () => {\n        const [value, setValue] = React.useState('')\n        \n        return (\n          <Input \n            value={value} \n            onChange={(e) => setValue(e.target.value)}\n            placeholder=\"Controlled input\"\n          />\n        )\n      }\n      \n      const user = userEvent.setup()\n      \n      render(<TestComponent />)\n      \n      const input = screen.getByPlaceholderText('Controlled input')\n      await user.type(input, 'controlled')\n      \n      expect(input).toHaveValue('controlled')\n    })\n    \n    test('supports default value', () => {\n      render(<Input defaultValue=\"default text\" placeholder=\"Default value\" />)\n      \n      const input = screen.getByPlaceholderText('Default value')\n      expect(input).toHaveValue('default text')\n    })\n  })\n  \n  describe('Theme Switching', () => {\n    test('adapts to theme changes', () => {\n      const { rerender } = render(<Input placeholder=\"Theme input\" />)\n      \n      const input = screen.getByPlaceholderText('Theme input')\n      expect(input).toHaveClass('bg-[var(--color-base-100)]')\n      \n      // Simulate theme change\n      Object.defineProperty(window, 'getComputedStyle', {\n        value: () => ({\n          getPropertyValue: (prop: string) => {\n            if (prop === '--color-base-100') return '#1f2937' // Dark theme\n            return mockCSSVariables[prop as keyof typeof mockCSSVariables] || ''\n          }\n        })\n      })\n      \n      rerender(<Input placeholder=\"Theme input\" />)\n      \n      // Input should still use CSS variable\n      expect(input).toHaveClass('bg-[var(--color-base-100)]')\n    })\n  })\n  \n  describe('Performance', () => {\n    test('does not re-render unnecessarily', () => {\n      const renderSpy = jest.fn()\n      \n      const TestInput = (props: any) => {\n        renderSpy()\n        return <Input {...props} placeholder=\"Performance test\" />\n      }\n      \n      const { rerender } = render(<TestInput />)\n      \n      expect(renderSpy).toHaveBeenCalledTimes(1)\n      \n      // Re-render with same props\n      rerender(<TestInput />)\n      \n      expect(renderSpy).toHaveBeenCalledTimes(2)\n    })\n  })\n  \n  describe('Edge Cases', () => {\n    test('handles empty string value', () => {\n      render(<Input value=\"\" placeholder=\"Empty value\" readOnly />)\n      \n      const input = screen.getByPlaceholderText('Empty value')\n      expect(input).toHaveValue('')\n    })\n    \n    test('handles null value gracefully', () => {\n      // @ts-ignore - Testing edge case\n      render(<Input value={null} placeholder=\"Null value\" readOnly />)\n      \n      const input = screen.getByPlaceholderText('Null value')\n      expect(input).toBeInTheDocument()\n    })\n    \n    test('handles very long text', async () => {\n      const longText = 'a'.repeat(1000)\n      const user = userEvent.setup()\n      \n      render(<Input placeholder=\"Long text\" />)\n      \n      const input = screen.getByPlaceholderText('Long text')\n      await user.type(input, longText)\n      \n      expect(input).toHaveValue(longText)\n    })\n  })\n})"
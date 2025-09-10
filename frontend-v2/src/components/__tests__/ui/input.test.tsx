import { render, screen } from '@/test-utils'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  it('renders input element', () => {
    render(<Input placeholder="Test input" />)
    expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Input className="custom-class" data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('custom-class')
  })

  it('handles disabled state', () => {
    render(<Input disabled data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toBeDisabled()
  })

  it('accepts user input', async () => {
    const { user } = render(<Input data-testid="input" />)
    const input = screen.getByTestId('input')
    
    await user.type(input, 'Hello World')
    expect(input).toHaveValue('Hello World')
  })

  it('handles onChange events', async () => {
    const handleChange = jest.fn()
    const { user } = render(<Input onChange={handleChange} data-testid="input" />)
    
    await user.type(screen.getByTestId('input'), 'test')
    expect(handleChange).toHaveBeenCalled()
  })
})
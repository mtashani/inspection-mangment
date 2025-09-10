import { render, screen } from '@/test-utils'
import { Skeleton } from '@/components/ui/skeleton'

describe('Skeleton Component', () => {
  it('renders skeleton element', () => {
    render(<Skeleton data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toBeInTheDocument()
  })

  it('applies default classes', () => {
    render(<Skeleton data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted')
  })

  it('applies custom className', () => {
    render(<Skeleton className="h-4 w-20" data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('h-4', 'w-20')
  })

  it('accepts custom props', () => {
    render(<Skeleton data-testid="skeleton" role="status" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveAttribute('role', 'status')
  })
})
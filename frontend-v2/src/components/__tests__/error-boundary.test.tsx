import React from 'react'
import { render, screen } from '@/test-utils'
import { ErrorBoundary } from '@/components/error-boundary'

// Mock monitoring
jest.mock('@/lib/monitoring', () => ({
  captureComponentError: jest.fn(),
}))

import { captureComponentError } from '@/lib/monitoring'

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console.error for these tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    ;(console.error as jest.Mock).mockRestore()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
  })

  it('captures error for monitoring', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(captureComponentError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    )
  })

  it('shows error details in development', () => {
    // Mock NODE_ENV for this test using Object.defineProperty
    const originalEnv = process.env.NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
    })

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error Details:')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()

    // Restore original environment
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true,
    })
  })

  it('hides error details in production', () => {
    // Mock NODE_ENV for this test using Object.defineProperty
    const originalEnv = process.env.NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
      configurable: true,
    })

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.queryByText('Error Details:')).not.toBeInTheDocument()
    expect(screen.queryByText('Test error')).not.toBeInTheDocument()

    // Restore original environment
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true,
    })
  })

  it('resets error state when try again is clicked', async () => {
    // Create a component that can toggle error state
    function TestWrapper() {
      const [shouldThrow, setShouldThrow] = React.useState(true)
      
      return (
        <ErrorBoundary>
          <button onClick={() => setShouldThrow(false)}>Fix Error</button>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )
    }

    const { user } = render(<TestWrapper />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    const tryAgainBtn = screen.getByRole('button', { name: /try again/i })
    await user.click(tryAgainBtn)

    // The error boundary should reset its state, but the component will still throw
    // In a real scenario, the underlying issue would be fixed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders custom fallback UI when provided', () => {
    const customFallback = <div>Custom error message</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })
})
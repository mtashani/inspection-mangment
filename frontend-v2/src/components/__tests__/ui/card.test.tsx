import { render, screen } from '@/test-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

describe('Card Components', () => {
  it('renders card with all components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Test Content</p>
        </CardContent>
      </Card>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('applies correct CSS classes', () => {
    render(
      <Card data-testid="card">
        <CardHeader data-testid="header">
          <CardTitle data-testid="title">Title</CardTitle>
        </CardHeader>
      </Card>
    )

    expect(screen.getByTestId('card')).toHaveClass('rounded-lg', 'border', 'bg-card')
    expect(screen.getByTestId('header')).toHaveClass('flex', 'flex-col', 'space-y-1.5')
    expect(screen.getByTestId('title')).toHaveClass('text-2xl', 'font-semibold')
  })
})
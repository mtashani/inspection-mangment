import React from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { InspectorList } from '../inspector-list'

// Mock the API
jest.mock('@/lib/api/admin/inspectors', () => ({
  getInspectors: jest.fn()
}))

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

describe('InspectorList', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  it('should render inspector list component', () => {
    renderWithProviders(<InspectorList />)
    
    expect(screen.getByText('Inspector Management')).toBeInTheDocument()
    expect(screen.getByText('Create Inspector')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search by name or employee ID...')).toBeInTheDocument()
  })

  it('should render table headers', () => {
    renderWithProviders(<InspectorList />)
    
    expect(screen.getByText('Inspector')).toBeInTheDocument()
    expect(screen.getByText('Employee ID')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Specialties')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })
})
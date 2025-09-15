import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { InspectorForm } from '../inspector-form'
import { Inspector } from '@/types/admin'

// Mock the API functions
jest.mock('@/lib/api/admin/inspectors', () => ({
  createInspector: jest.fn(),
  updateInspector: jest.fn(),
}))

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}))

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const mockInspector: Inspector = {
  id: 1,
  name: 'John Doe',
  employeeId: 'EMP001',
  email: 'john@example.com',
  // inspectorType and specialties removed - no longer used
  active: true,
  canLogin: true,
  attendanceTrackingEnabled: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('InspectorForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders create form correctly', () => {
    render(<InspectorForm />, { wrapper: createWrapper() })
    
    expect(screen.getByText('Create New Inspector')).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/employee id/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
  })

  it('renders edit form correctly', () => {
    render(<InspectorForm inspector={mockInspector} />, { wrapper: createWrapper() })
    
    expect(screen.getByText('Edit Inspector')).toBeInTheDocument()
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('EMP001')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
  })

  it('shows validation errors for required fields', async () => {
    render(<InspectorForm />, { wrapper: createWrapper() })
    
    const submitButton = screen.getByRole('button', { name: /create inspector/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
      expect(screen.getByText('Employee ID is required')).toBeInTheDocument()
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
  })

  // Test for specialties removed - no longer applicable
    
    expect(psvCheckbox).toBeChecked()
  })

  it('handles image upload', () => {
    render(<InspectorForm />, { wrapper: createWrapper() })
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText(/upload/i, { selector: 'input[type="file"]' })
    
    fireEvent.change(input, { target: { files: [file] } })
    
    // The image preview should be updated (implementation detail)
    expect(input.files?.[0]).toBe(file)
  })
})
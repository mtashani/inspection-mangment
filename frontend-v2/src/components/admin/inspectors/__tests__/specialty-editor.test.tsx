import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SpecialtyEditor } from '../specialty-editor'
import { Inspector } from '@/types/admin'
import { updateInspectorSpecialties } from '@/lib/api/admin/inspectors'

// Mock the API function
jest.mock('@/lib/api/admin/inspectors', () => ({
  updateInspectorSpecialties: jest.fn(),
}))

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

const mockUpdateInspectorSpecialties = updateInspectorSpecialties as jest.MockedFunction<typeof updateInspectorSpecialties>

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
  inspectorType: 'INTERNAL',
  specialties: ['PSV'],
  active: true,
  canLogin: true,
  attendanceTrackingEnabled: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('SpecialtyEditor', () => {
  const defaultProps = {
    inspector: mockInspector,
    open: true,
    onOpenChange: jest.fn(),
    onSuccess: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with inspector data', () => {
    render(<SpecialtyEditor {...defaultProps} />, { wrapper: createWrapper() })
    
    expect(screen.getByText('Manage Inspector Specialties')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('EMP001')).toBeInTheDocument()
  })

  it('shows current specialties', () => {
    render(<SpecialtyEditor {...defaultProps} />, { wrapper: createWrapper() })
    
    expect(screen.getByText('1 active')).toBeInTheDocument()
    expect(screen.getByText('PSV')).toBeInTheDocument()
  })

  it('allows toggling specialties', () => {
    render(<SpecialtyEditor {...defaultProps} />, { wrapper: createWrapper() })
    
    // PSV should be checked (current specialty)
    const psvCheckbox = screen.getByRole('checkbox', { name: /pressure safety valve/i })
    expect(psvCheckbox).toBeChecked()
    
    // CRANE should not be checked
    const craneCheckbox = screen.getByRole('checkbox', { name: /crane inspection/i })
    expect(craneCheckbox).not.toBeChecked()
    
    // Toggle CRANE
    fireEvent.click(craneCheckbox)
    expect(craneCheckbox).toBeChecked()
  })

  it('shows save button when changes are made', () => {
    render(<SpecialtyEditor {...defaultProps} />, { wrapper: createWrapper() })
    
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    expect(saveButton).toBeDisabled()
    
    // Make a change
    const craneCheckbox = screen.getByRole('checkbox', { name: /crane inspection/i })
    fireEvent.click(craneCheckbox)
    
    expect(saveButton).not.toBeDisabled()
  })

  it('calls API when saving changes', async () => {
    mockUpdateInspectorSpecialties.mockResolvedValue(mockInspector)
    
    render(<SpecialtyEditor {...defaultProps} />, { wrapper: createWrapper() })
    
    // Add CRANE specialty
    const craneCheckbox = screen.getByRole('checkbox', { name: /crane inspection/i })
    fireEvent.click(craneCheckbox)
    
    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(mockUpdateInspectorSpecialties).toHaveBeenCalledWith(1, {
        PSV: true,
        CRANE: true,
        CORROSION: false,
      })
    })
  })

  it('shows warning when no specialties are selected', () => {
    render(<SpecialtyEditor {...defaultProps} />, { wrapper: createWrapper() })
    
    // Uncheck PSV (the only current specialty)
    const psvCheckbox = screen.getByRole('checkbox', { name: /pressure safety valve/i })
    fireEvent.click(psvCheckbox)
    
    expect(screen.getByText(/inspector will have no specialties assigned/i)).toBeInTheDocument()
  })

  it('resets changes when cancelled', () => {
    render(<SpecialtyEditor {...defaultProps} />, { wrapper: createWrapper() })
    
    // Make a change
    const craneCheckbox = screen.getByRole('checkbox', { name: /crane inspection/i })
    fireEvent.click(craneCheckbox)
    expect(craneCheckbox).toBeChecked()
    
    // Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows changes indicator when modifications are made', () => {
    render(<SpecialtyEditor {...defaultProps} />, { wrapper: createWrapper() })
    
    // Make a change
    const craneCheckbox = screen.getByRole('checkbox', { name: /crane inspection/i })
    fireEvent.click(craneCheckbox)
    
    expect(screen.getByText(/you have unsaved changes/i)).toBeInTheDocument()
  })
})
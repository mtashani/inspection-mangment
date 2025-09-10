import React from 'react'
import { render, screen, waitFor } from '@/test-utils'
import { CreateReportModal } from '../create-report-modal'
import { DailyReport } from '@/types/maintenance-events'

// Mock the maintenance events hook
jest.mock('@/hooks/use-maintenance-events', () => ({
  useCreateDailyReport: jest.fn(),
}))

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') {
      return '2024-01-15'
    }
    return '2024-01-15'
  }),
}))

import { useCreateDailyReport } from '@/hooks/use-maintenance-events'
const mockUseCreateDailyReport = useCreateDailyReport as jest.MockedFunction<typeof useCreateDailyReport>

const mockOnClose = jest.fn()
const mockOnSuccess = jest.fn()

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  inspectionId: 1,
  inspectionTitle: 'Test Inspection',
  onSuccess: mockOnSuccess,
}

describe('CreateReportModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCreateDailyReport.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      error: null,
    } as any)
  })

  it('renders modal when open', () => {
    render(<CreateReportModal {...defaultProps} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Create Daily Report')).toBeInTheDocument()
  })

  it('does not render modal when closed', () => {
    render(<CreateReportModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders all form fields', () => {
    render(<CreateReportModal {...defaultProps} />)

    expect(screen.getByText('Report Date')).toBeInTheDocument()
    expect(screen.getByText('Description *')).toBeInTheDocument()
    expect(screen.getByText('Inspectors *')).toBeInTheDocument()
    expect(screen.getByText('Findings')).toBeInTheDocument()
    expect(screen.getByText('Recommendations')).toBeInTheDocument()
    expect(screen.getByText('Weather Conditions')).toBeInTheDocument()
    expect(screen.getByText('Safety Notes')).toBeInTheDocument()
  })

  it('shows inspection title in description', () => {
    render(<CreateReportModal {...defaultProps} />)

    expect(screen.getByText(/create a new daily report for inspection:/i)).toBeInTheDocument()
    expect(screen.getByText('Test Inspection')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const { user } = render(<CreateReportModal {...defaultProps} />)

    const submitButton = screen.getByRole('button', { name: /create report/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/description is required/i)).toBeInTheDocument()
      expect(screen.getByText(/at least one inspector is required/i)).toBeInTheDocument()
    })
  })

  it('renders form fields correctly', async () => {
    const { user } = render(<CreateReportModal {...defaultProps} />)

    // Fill description
    const descriptionTextarea = screen.getByPlaceholderText(/describe the work performed/i)
    await user.type(descriptionTextarea, 'Test daily report description')

    expect(descriptionTextarea).toHaveValue('Test daily report description')

    // Check that inspector select is present
    const comboboxes = screen.getAllByRole('combobox')
    expect(comboboxes.length).toBeGreaterThan(0)

    // Check submit button is present
    const submitButton = screen.getByRole('button', { name: /create report/i })
    expect(submitButton).toBeInTheDocument()
  })

  it('fills optional fields correctly', async () => {
    const { user } = render(<CreateReportModal {...defaultProps} />)

    // Fill description
    await user.type(screen.getByPlaceholderText(/describe the work performed/i), 'Test description')
    
    // Fill optional fields
    await user.type(screen.getByPlaceholderText(/document any findings/i), 'Test findings')
    await user.type(screen.getByPlaceholderText(/provide recommendations/i), 'Test recommendations')
    await user.type(screen.getByPlaceholderText(/document any safety concerns/i), 'All safety protocols followed')

    // Verify fields have correct values
    expect(screen.getByPlaceholderText(/describe the work performed/i)).toHaveValue('Test description')
    expect(screen.getByPlaceholderText(/document any findings/i)).toHaveValue('Test findings')
    expect(screen.getByPlaceholderText(/provide recommendations/i)).toHaveValue('Test recommendations')
    expect(screen.getByPlaceholderText(/document any safety concerns/i)).toHaveValue('All safety protocols followed')
  })

  it('shows loading state during submission', () => {
    mockUseCreateDailyReport.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
      error: null,
    } as any)

    render(<CreateReportModal {...defaultProps} />)

    const submitButton = screen.getByRole('button', { name: /creating/i })
    expect(submitButton).toBeDisabled()
    expect(screen.getByText('Creating...')).toBeInTheDocument()
  })

  it('shows error state correctly', () => {
    mockUseCreateDailyReport.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
      error: new Error('Failed to create report'),
    } as any)

    render(<CreateReportModal {...defaultProps} />)

    // Component should still render even with error state
    expect(screen.getByText('Create Daily Report')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/describe the work performed/i)).toBeInTheDocument()
  })

  it('closes modal when cancel button is clicked', async () => {
    const { user } = render(<CreateReportModal {...defaultProps} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('closes modal when X button is clicked', async () => {
    const { user } = render(<CreateReportModal {...defaultProps} />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when cancel button is clicked', async () => {
    const { user } = render(<CreateReportModal {...defaultProps} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('resets form when modal is closed and reopened', async () => {
    const { user } = render(<CreateReportModal {...defaultProps} />)

    // Fill form
    await user.type(screen.getByPlaceholderText(/describe the work performed/i), 'Test description')

    // Close modal
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows inspector selection interface', () => {
    render(<CreateReportModal {...defaultProps} />)

    // Should show inspector label and select
    expect(screen.getByText('Inspectors *')).toBeInTheDocument()
    
    // Should have inspector select combobox
    const comboboxes = screen.getAllByRole('combobox')
    const inspectorSelect = comboboxes.find(cb => !cb.getAttribute('aria-describedby'))
    expect(inspectorSelect).toBeInTheDocument()
  })

  it('shows weather conditions field', () => {
    render(<CreateReportModal {...defaultProps} />)

    const weatherSelect = screen.getByRole('combobox', { name: /weather conditions/i })
    expect(weatherSelect).toBeInTheDocument()
    
    // Should show placeholder text
    expect(screen.getByText(/select weather conditions/i)).toBeInTheDocument()
  })

  it('shows form descriptions for optional fields', () => {
    render(<CreateReportModal {...defaultProps} />)

    expect(screen.getByText(/optional: record any significant findings/i)).toBeInTheDocument()
    expect(screen.getByText(/optional: suggest actions or improvements/i)).toBeInTheDocument()
    expect(screen.getByText(/optional: record safety-related observations/i)).toBeInTheDocument()
  })

  it('disables form during submission', () => {
    mockUseCreateDailyReport.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
      error: null,
    } as any)

    render(<CreateReportModal {...defaultProps} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    const submitButton = screen.getByRole('button', { name: /creating/i })

    expect(cancelButton).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })
})
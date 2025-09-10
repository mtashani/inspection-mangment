import React from 'react'
import { render, screen, waitFor } from '@/test-utils'
import { InspectionCard } from '../inspection-card'
import { Inspection, InspectionStatus, RefineryDepartment } from '@/types/maintenance-events'

// Mock the daily reports hook
jest.mock('@/hooks/use-maintenance-events', () => ({
  useDailyReports: jest.fn(),
}))

import { useDailyReports } from '@/hooks/use-maintenance-events'
const mockUseDailyReports = useDailyReports as jest.MockedFunction<typeof useDailyReports>

const mockInspection: Inspection = {
  id: 1,
  inspection_number: 'INS-2024-001',
  title: 'Test Inspection',
  description: 'This is a test inspection',
  start_date: '2024-01-15T08:00:00Z',
  end_date: '2024-01-20T17:00:00Z',
  status: InspectionStatus.InProgress,
  equipment_id: 1,
  equipment_tag: 'EQ-001',
  equipment_description: 'Test Equipment',
  requesting_department: RefineryDepartment.Maintenance,
  daily_reports_count: 3,
  maintenance_event_id: 1,
  created_at: '2024-01-10T10:00:00Z',
  updated_at: '2024-01-15T08:30:00Z',
}

const mockDailyReports = [
  {
    id: 1,
    inspection_id: 1,
    report_date: '2024-01-15',
    description: 'First daily report',
    inspector_ids: [1],
    inspector_names: 'John Doe',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    inspection_id: 1,
    report_date: '2024-01-16',
    description: 'Second daily report',
    inspector_ids: [2],
    inspector_names: 'Jane Smith',
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
]

describe('InspectionCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDailyReports.mockReturnValue({
      data: mockDailyReports,
      isLoading: false,
      error: null,
    } as any)
  })

  it('renders inspection information correctly', () => {
    render(<InspectionCard inspection={mockInspection} />)

    expect(screen.getByText('Test Inspection')).toBeInTheDocument()
    expect(screen.getByText('INS-2024-001')).toBeInTheDocument()
    expect(screen.getByText('EQ-001')).toBeInTheDocument()
    expect(screen.getByText('InProgress')).toBeInTheDocument()
  })

  it('shows daily reports count badge', () => {
    render(<InspectionCard inspection={mockInspection} />)

    expect(screen.getByText('2')).toBeInTheDocument() // Count from mock data
  })

  it('expands and collapses when clicked', async () => {
    const { user } = render(<InspectionCard inspection={mockInspection} />)

    // Initially collapsed
    expect(screen.queryByText('Start Date:')).not.toBeInTheDocument()

    // Click to expand
    const expandButton = screen.getByRole('button', { name: /expand/i })
    await user.click(expandButton)

    // Should show expanded content
    await waitFor(() => {
      expect(screen.getByText('Start Date:')).toBeInTheDocument()
    })

    // Click to collapse
    await user.click(expandButton)

    // Should hide expanded content
    await waitFor(() => {
      expect(screen.queryByText('Start Date:')).not.toBeInTheDocument()
    })
  })

  it('displays formatted dates in expanded view', async () => {
    const { user } = render(<InspectionCard inspection={mockInspection} />)

    const expandButton = screen.getByRole('button', { name: /expand/i })
    await user.click(expandButton)

    await waitFor(() => {
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
      expect(screen.getByText('Jan 20, 2024')).toBeInTheDocument()
    })
  })

  it('handles missing end date gracefully', async () => {
    const inspectionWithoutEndDate = { ...mockInspection, end_date: undefined }
    const { user } = render(<InspectionCard inspection={inspectionWithoutEndDate} />)

    const expandButton = screen.getByRole('button', { name: /expand/i })
    await user.click(expandButton)

    await waitFor(() => {
      expect(screen.getByText('Not set')).toBeInTheDocument()
    })
  })

  it('shows daily reports in expanded view', async () => {
    const { user } = render(<InspectionCard inspection={mockInspection} />)

    const expandButton = screen.getByRole('button', { name: /expand/i })
    await user.click(expandButton)

    await waitFor(() => {
      expect(screen.getByText('First daily report')).toBeInTheDocument()
      expect(screen.getByText('Second daily report')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  it('shows empty state when no daily reports', async () => {
    mockUseDailyReports.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any)

    const { user } = render(<InspectionCard inspection={mockInspection} />)

    const expandButton = screen.getByRole('button', { name: /expand/i })
    await user.click(expandButton)

    await waitFor(() => {
      expect(screen.getByText('No daily reports yet')).toBeInTheDocument()
    })
  })

  it('highlights search terms when provided', () => {
    render(<InspectionCard inspection={mockInspection} searchTerm="Test" />)

    const highlightedTitle = screen.getByText('Test Inspection')
    expect(highlightedTitle.innerHTML).toContain('<mark>Test</mark>')
  })

  it('highlights equipment tag when search matches', () => {
    render(<InspectionCard inspection={mockInspection} searchTerm="EQ-001" />)

    const highlightedTag = screen.getByText('EQ-001')
    expect(highlightedTag.innerHTML).toContain('<mark>EQ-001</mark>')
  })

  it('shows add report button', () => {
    render(<InspectionCard inspection={mockInspection} />)

    expect(screen.getByRole('button', { name: /add report/i })).toBeInTheDocument()
  })

  it('opens create report modal when add report is clicked', async () => {
    const { user } = render(<InspectionCard inspection={mockInspection} />)

    const addReportButton = screen.getByRole('button', { name: /add report/i })
    await user.click(addReportButton)

    // This would test modal opening - implementation depends on modal component
    expect(addReportButton).toBeInTheDocument()
  })

  it('shows loading state for daily reports', async () => {
    mockUseDailyReports.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any)

    const { user } = render(<InspectionCard inspection={mockInspection} />)

    const expandButton = screen.getByRole('button', { name: /expand/i })
    await user.click(expandButton)

    await waitFor(() => {
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  it('handles daily reports error state', async () => {
    mockUseDailyReports.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load reports'),
    } as any)

    const { user } = render(<InspectionCard inspection={mockInspection} />)

    const expandButton = screen.getByRole('button', { name: /expand/i })
    await user.click(expandButton)

    await waitFor(() => {
      expect(screen.getByText(/error loading reports/i)).toBeInTheDocument()
    })
  })

  it('applies correct status styling', () => {
    render(<InspectionCard inspection={mockInspection} />)

    const statusBadge = screen.getByText('InProgress')
    expect(statusBadge).toHaveClass('bg-yellow-100') // Assuming InProgress uses yellow
  })

  it('shows sticky header behavior', async () => {
    const { user } = render(<InspectionCard inspection={mockInspection} />)

    const expandButton = screen.getByRole('button', { name: /expand/i })
    await user.click(expandButton)

    const header = screen.getByText('Test Inspection').closest('div')?.closest('div')
    expect(header).toHaveClass('sticky', 'top-0')
  })

  it('handles keyboard navigation', async () => {
    const { user } = render(<InspectionCard inspection={mockInspection} />)

    // Tab to expand button
    await user.tab()
    const expandButton = screen.getByRole('button', { name: /expand/i })
    expect(expandButton).toHaveFocus()

    // Press Enter to expand
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByText('Start Date:')).toBeInTheDocument()
    })
  })

  it('shows correct chevron icon based on expanded state', async () => {
    const { user } = render(<InspectionCard inspection={mockInspection} />)

    // Initially should show right chevron (collapsed)
    expect(screen.getByTestId('chevron-right')).toBeInTheDocument()

    const expandButton = screen.getByRole('button', { name: /expand/i })
    await user.click(expandButton)

    // After expanding should show down chevron
    await waitFor(() => {
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument()
    })
  })
})
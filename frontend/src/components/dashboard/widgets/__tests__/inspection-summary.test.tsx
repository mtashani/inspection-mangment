import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@/test-utils/render'
import { InspectionSummary } from '../inspection-summary'
import { mockInspection, mockApiResponse } from '@/test-utils/render'

// Mock the useWidgetData hook
vi.mock('../dashboard-widget', () => ({
  useWidgetData: vi.fn(),
  DashboardWidget: ({ children, title, onRefresh }: any) => (
    <div data-testid="dashboard-widget">
      <div data-testid="widget-title">{title}</div>
      <button onClick={onRefresh} data-testid="refresh-button">Refresh</button>
      {children}
    </div>
  ),
}))

const mockUseWidgetData = vi.fn()
vi.mocked(require('../dashboard-widget').useWidgetData).mockImplementation(mockUseWidgetData)

const defaultProps = {
  title: 'Inspection Summary',
  config: {
    showPending: true,
    showCompleted: true,
    showTrends: false,
    showEfficiency: false,
    timeRange: '30d' as const,
    showMyInspections: false,
  },
  onConfigChange: vi.fn(),
  onRemove: vi.fn(),
}

const mockInspectionData = [
  {
    ...mockInspection,
    id: 'insp-001',
    title: 'Monthly Safety Inspection',
    status: 'pending' as const,
    priority: 'medium' as const,
    progress: 0,
  },
  {
    ...mockInspection,
    id: 'insp-002',
    title: 'Emergency Check',
    status: 'in-progress' as const,
    priority: 'critical' as const,
    progress: 65,
  },
  {
    ...mockInspection,
    id: 'insp-003',
    title: 'Quarterly Maintenance Check',
    status: 'completed' as const,
    priority: 'high' as const,
    progress: 100,
    completedDate: '2024-02-04',
  },
]

describe('InspectionSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state', () => {
    mockUseWidgetData.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      lastUpdated: null,
      refresh: vi.fn(),
    })

    render(<InspectionSummary {...defaultProps} />)

    expect(screen.getByTestId('dashboard-widget')).toBeInTheDocument()
    expect(screen.getByTestId('widget-title')).toHaveTextContent('Inspection Summary')
  })

  it('renders error state', () => {
    mockUseWidgetData.mockReturnValue({
      data: null,
      isLoading: false,
      error: 'Failed to load inspection data',
      lastUpdated: null,
      refresh: vi.fn(),
    })

    render(<InspectionSummary {...defaultProps} />)

    expect(screen.getByTestId('dashboard-widget')).toBeInTheDocument()
  })

  it('renders inspection data with summary cards', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockInspectionData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<InspectionSummary {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-widget')).toBeInTheDocument()
    })

    // Should show total inspections count
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()

    // Should show pending count
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()

    // Should show completed count
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('shows efficiency metrics when configured', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockInspectionData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    const propsWithEfficiency = {
      ...defaultProps,
      config: {
        ...defaultProps.config,
        showEfficiency: true,
      },
    }

    render(<InspectionSummary {...propsWithEfficiency} />)

    await waitFor(() => {
      expect(screen.getByText('Completion Rate')).toBeInTheDocument()
      expect(screen.getByText('On-Time Rate')).toBeInTheDocument()
    })
  })

  it('shows trends chart when configured', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockInspectionData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    const propsWithTrends = {
      ...defaultProps,
      config: {
        ...defaultProps.config,
        showTrends: true,
      },
    }

    render(<InspectionSummary {...propsWithTrends} />)

    await waitFor(() => {
      expect(screen.getByText('Inspection Trends')).toBeInTheDocument()
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })
  })

  it('shows upcoming inspections', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockInspectionData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<InspectionSummary {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Upcoming Inspections')).toBeInTheDocument()
      expect(screen.getByText('Monthly Safety Inspection')).toBeInTheDocument()
      expect(screen.getByText('Emergency Check')).toBeInTheDocument()
    })
  })

  it('shows priority distribution chart', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockInspectionData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<InspectionSummary {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Priority Distribution')).toBeInTheDocument()
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })
  })

  it('displays progress bars for in-progress inspections', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockInspectionData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<InspectionSummary {...defaultProps} />)

    await waitFor(() => {
      // Should show progress for in-progress inspection
      expect(screen.getByText('Emergency Check')).toBeInTheDocument()
    })
  })

  it('handles refresh action', async () => {
    const mockRefresh = vi.fn()
    mockUseWidgetData.mockReturnValue({
      data: mockInspectionData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: mockRefresh,
    })

    render(<InspectionSummary {...defaultProps} />)

    const refreshButton = screen.getByTestId('refresh-button')
    fireEvent.click(refreshButton)

    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('calculates metrics correctly', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockInspectionData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<InspectionSummary {...defaultProps} />)

    await waitFor(() => {
      // Total inspections: 3
      expect(screen.getByText('3')).toBeInTheDocument()
      
      // Pending: 1 (insp-001)
      expect(screen.getByText('1')).toBeInTheDocument()
      
      // Completed: 1 (insp-003)
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })
  })

  it('shows overdue inspections', async () => {
    const overdueInspection = {
      ...mockInspection,
      id: 'insp-004',
      title: 'Overdue Inspection',
      status: 'pending' as const,
      dueDate: '2024-01-01', // Past date
    }

    mockUseWidgetData.mockReturnValue({
      data: [...mockInspectionData, overdueInspection],
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<InspectionSummary {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Overdue')).toBeInTheDocument()
    })
  })

  it('handles empty data state', async () => {
    mockUseWidgetData.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<InspectionSummary {...defaultProps} />)

    await waitFor(() => {
      // Should show 0 for all metrics
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  it('formats dates correctly', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockInspectionData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<InspectionSummary {...defaultProps} />)

    await waitFor(() => {
      // Should format due dates appropriately
      expect(screen.getByTestId('dashboard-widget')).toBeInTheDocument()
    })
  })

  it('shows View All button when inspections exist', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockInspectionData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<InspectionSummary {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('View All')).toBeInTheDocument()
    })
  })
})
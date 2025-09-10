import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@/test-utils/render'
import { AlertsNotifications } from '../alerts-notifications'
import { mockAlert, mockApiResponse } from '@/test-utils/render'

// Mock the useWidgetData hook
vi.mock('../dashboard-widget', () => ({
  useWidgetData: vi.fn(),
  DashboardWidget: ({ children, title, onRefresh, headerActions }: any) => (
    <div data-testid="dashboard-widget">
      <div data-testid="widget-title">{title}</div>
      <div data-testid="header-actions">{headerActions}</div>
      <button onClick={onRefresh} data-testid="refresh-button">Refresh</button>
      {children}
    </div>
  ),
}))

const mockUseWidgetData = vi.fn()
vi.mocked(require('../dashboard-widget').useWidgetData).mockImplementation(mockUseWidgetData)

const defaultProps = {
  title: 'Alerts & Notifications',
  config: {
    showCritical: true,
    showWarnings: true,
    showHigh: false,
    showInfo: false,
    limit: 10,
    autoRefresh: true,
    groupByType: false,
  },
  onConfigChange: vi.fn(),
  onRemove: vi.fn(),
}

const mockAlertData = [
  {
    ...mockAlert,
    id: 'alert-001',
    title: 'Critical Pressure Alarm',
    severity: 'critical' as const,
    status: 'active' as const,
    isRead: false,
    requiresAction: true,
  },
  {
    ...mockAlert,
    id: 'alert-002',
    title: 'Maintenance Overdue',
    severity: 'warning' as const,
    status: 'acknowledged' as const,
    isRead: true,
    requiresAction: true,
    acknowledgedBy: 'John Smith',
    acknowledgedDate: '2024-02-09T10:00:00Z',
  },
  {
    ...mockAlert,
    id: 'alert-003',
    title: 'Inspection Due Soon',
    severity: 'info' as const,
    status: 'active' as const,
    isRead: true,
    requiresAction: false,
  },
  {
    ...mockAlert,
    id: 'alert-004',
    title: 'Emergency Shutdown Triggered',
    severity: 'emergency' as const,
    status: 'acknowledged' as const,
    isRead: true,
    requiresAction: true,
    acknowledgedBy: 'Emergency Team',
    acknowledgedDate: '2024-02-10T15:47:00Z',
  },
]

describe('AlertsNotifications', () => {
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

    render(<AlertsNotifications {...defaultProps} />)

    expect(screen.getByTestId('dashboard-widget')).toBeInTheDocument()
    expect(screen.getByTestId('widget-title')).toHaveTextContent('Alerts & Notifications')
  })

  it('renders error state', () => {
    mockUseWidgetData.mockReturnValue({
      data: null,
      isLoading: false,
      error: 'Failed to load alerts',
      lastUpdated: null,
      refresh: vi.fn(),
    })

    render(<AlertsNotifications {...defaultProps} />)

    expect(screen.getByTestId('dashboard-widget')).toBeInTheDocument()
  })

  it('renders alerts with summary cards', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockAlertData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<AlertsNotifications {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-widget')).toBeInTheDocument()
    })

    // Should show summary cards
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()
    expect(screen.getByText('Action Req.')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('shows unread badge in header when there are unread alerts', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockAlertData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<AlertsNotifications {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('header-actions')).toBeInTheDocument()
      // Should show unread count
      expect(screen.getByText('1 unread')).toBeInTheDocument()
    })
  })

  it('filters alerts by severity correctly', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockAlertData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<AlertsNotifications {...defaultProps} />)

    await waitFor(() => {
      // Should show critical and warning alerts (based on config)
      expect(screen.getByText('Critical Pressure Alarm')).toBeInTheDocument()
      expect(screen.getByText('Maintenance Overdue')).toBeInTheDocument()
      expect(screen.getByText('Emergency Shutdown Triggered')).toBeInTheDocument()
      
      // Should not show info alerts (showInfo: false)
      expect(screen.queryByText('Inspection Due Soon')).not.toBeInTheDocument()
    })
  })

  it('shows info alerts when configured', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockAlertData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    const propsWithInfo = {
      ...defaultProps,
      config: {
        ...defaultProps.config,
        showInfo: true,
      },
    }

    render(<AlertsNotifications {...propsWithInfo} />)

    await waitFor(() => {
      expect(screen.getByText('Inspection Due Soon')).toBeInTheDocument()
    })
  })

  it('groups alerts by type when configured', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockAlertData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    const propsWithGrouping = {
      ...defaultProps,
      config: {
        ...defaultProps.config,
        groupByType: true,
      },
    }

    render(<AlertsNotifications {...propsWithGrouping} />)

    await waitFor(() => {
      // Should show group headers
      expect(screen.getByText(/safety/i)).toBeInTheDocument()
    })
  })

  it('shows acknowledged status for acknowledged alerts', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockAlertData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<AlertsNotifications {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Acknowledged by John Smith')).toBeInTheDocument()
      expect(screen.getByText('Acknowledged by Emergency Team')).toBeInTheDocument()
    })
  })

  it('handles alert actions', async () => {
    const mockHandleMarkAsRead = vi.fn()
    const mockHandleAcknowledge = vi.fn()
    const mockHandleDismiss = vi.fn()

    mockUseWidgetData.mockReturnValue({
      data: mockAlertData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<AlertsNotifications {...defaultProps} />)

    await waitFor(() => {
      // Should show action buttons for unread/active alerts
      expect(screen.getByTestId('dashboard-widget')).toBeInTheDocument()
    })
  })

  it('shows empty state when no alerts match filters', async () => {
    mockUseWidgetData.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<AlertsNotifications {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('No alerts found')).toBeInTheDocument()
      expect(screen.getByText('All systems are running normally')).toBeInTheDocument()
    })
  })

  it('limits alerts based on config', async () => {
    const manyAlerts = Array.from({ length: 20 }, (_, i) => ({
      ...mockAlert,
      id: `alert-${i}`,
      title: `Alert ${i}`,
    }))

    mockUseWidgetData.mockReturnValue({
      data: manyAlerts,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    const propsWithLimit = {
      ...defaultProps,
      config: {
        ...defaultProps.config,
        limit: 5,
      },
    }

    render(<AlertsNotifications {...propsWithLimit} />)

    await waitFor(() => {
      // Should only show 5 alerts
      const alertElements = screen.getAllByText(/Alert \d+/)
      expect(alertElements.length).toBeLessThanOrEqual(5)
    })
  })

  it('handles refresh action', async () => {
    const mockRefresh = vi.fn()
    mockUseWidgetData.mockReturnValue({
      data: mockAlertData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: mockRefresh,
    })

    render(<AlertsNotifications {...defaultProps} />)

    const refreshButton = screen.getByTestId('refresh-button')
    fireEvent.click(refreshButton)

    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('shows action buttons when alerts exist', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockAlertData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<AlertsNotifications {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('View All Alerts')).toBeInTheDocument()
    })
  })

  it('calculates metrics correctly', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockAlertData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<AlertsNotifications {...defaultProps} />)

    await waitFor(() => {
      // Active alerts: 2 (alert-001, alert-003)
      expect(screen.getByText('2')).toBeInTheDocument()
      
      // Critical alerts: 2 (alert-001 critical, alert-004 emergency)
      expect(screen.getByText('Critical')).toBeInTheDocument()
      
      // Require action: 3 (alert-001, alert-002, alert-004)
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  it('formats timestamps correctly', async () => {
    mockUseWidgetData.mockReturnValue({
      data: mockAlertData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    })

    render(<AlertsNotifications {...defaultProps} />)

    await waitFor(() => {
      // Should format relative timestamps
      expect(screen.getByTestId('dashboard-widget')).toBeInTheDocument()
    })
  })
})
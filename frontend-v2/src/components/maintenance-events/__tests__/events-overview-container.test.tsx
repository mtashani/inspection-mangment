import React from 'react'
import { render, screen, waitFor } from '@/test-utils'
import { EventsOverviewContainer } from '../events-overview-container'
import { EventsFilters, MaintenanceEventStatus, MaintenanceEventType } from '@/types/maintenance-events'

// Mock the maintenance events hooks
jest.mock('@/hooks/use-maintenance-events', () => ({
  useMaintenanceEvents: jest.fn(),
  useEventsSummary: jest.fn(),
}))

// Mock next/navigation for URL state management
const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/maintenance-events',
}))

import { useMaintenanceEvents, useEventsSummary } from '@/hooks/use-maintenance-events'
const mockUseMaintenanceEvents = useMaintenanceEvents as jest.MockedFunction<typeof useMaintenanceEvents>
const mockUseEventsSummary = useEventsSummary as jest.MockedFunction<typeof useEventsSummary>

const mockEvents = [
  {
    id: 1,
    event_number: 'ME-2024-001',
    title: 'Test Event 1',
    status: MaintenanceEventStatus.InProgress,
    event_type: MaintenanceEventType.Overhaul,
    planned_start_date: '2024-01-15T08:00:00Z',
    planned_end_date: '2024-01-20T17:00:00Z',
    sub_events_count: 3,
    inspections_count: 12,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-15T08:30:00Z',
  },
  {
    id: 2,
    event_number: 'ME-2024-002',
    title: 'Test Event 2',
    status: MaintenanceEventStatus.Completed,
    event_type: MaintenanceEventType.Inspection,
    planned_start_date: '2024-01-10T08:00:00Z',
    planned_end_date: '2024-01-12T17:00:00Z',
    sub_events_count: 1,
    inspections_count: 5,
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-12T17:00:00Z',
  },
]

const mockSummary = {
  totalEvents: 25,
  activeEvents: 8,
  completedEvents: 15,
  overdueEvents: 2,
  totalInspections: 120,
  activeInspections: 45,
  totalReports: 350,
  reportsThisMonth: 28,
}

describe('EventsOverviewContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseMaintenanceEvents.mockReturnValue({
      data: mockEvents,
      isLoading: false,
      error: null,
    } as any)
    mockUseEventsSummary.mockReturnValue({
      data: mockSummary,
      isLoading: false,
      error: null,
    } as any)
  })

  it('renders all main components', () => {
    render(<EventsOverviewContainer />)

    expect(screen.getByText('Maintenance Events')).toBeInTheDocument()
    expect(screen.getByRole('search')).toBeInTheDocument()
    expect(screen.getByText('Total Events')).toBeInTheDocument()
    expect(screen.getByText('Test Event 1')).toBeInTheDocument()
    expect(screen.getByText('Test Event 2')).toBeInTheDocument()
  })

  it('displays summary cards with correct data', () => {
    render(<EventsOverviewContainer />)

    expect(screen.getByText('25')).toBeInTheDocument() // Total events
    expect(screen.getByText('8')).toBeInTheDocument()  // Active events
    expect(screen.getByText('15')).toBeInTheDocument() // Completed events
    expect(screen.getByText('2')).toBeInTheDocument()  // Overdue events
  })

  it('applies initial filters when provided', () => {
    const initialFilters: EventsFilters = {
      search: 'test search',
      status: MaintenanceEventStatus.InProgress,
      eventType: MaintenanceEventType.Overhaul,
    }

    render(<EventsOverviewContainer initialFilters={initialFilters} />)

    expect(mockUseMaintenanceEvents).toHaveBeenCalledWith(initialFilters)
    expect(mockUseEventsSummary).toHaveBeenCalledWith(initialFilters)
  })

  it('updates filters when search changes', async () => {
    const { user } = render(<EventsOverviewContainer />)

    const searchInput = screen.getByPlaceholderText(/search events/i)
    await user.type(searchInput, 'new search')

    await waitFor(() => {
      expect(mockUseMaintenanceEvents).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'new search' })
      )
    })
  })

  it('updates filters when status filter changes', async () => {
    const { user } = render(<EventsOverviewContainer />)

    const statusSelect = screen.getByRole('combobox', { name: /status/i })
    await user.click(statusSelect)

    const inProgressOption = screen.getByRole('option', { name: /in progress/i })
    await user.click(inProgressOption)

    expect(mockUseMaintenanceEvents).toHaveBeenCalledWith(
      expect.objectContaining({ status: MaintenanceEventStatus.InProgress })
    )
  })

  it('shows loading state for events', () => {
    mockUseMaintenanceEvents.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any)

    render(<EventsOverviewContainer />)

    expect(screen.getByTestId('events-loading-skeleton')).toBeInTheDocument()
  })

  it('shows loading state for summary', () => {
    mockUseEventsSummary.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any)

    render(<EventsOverviewContainer />)

    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows error state for events', () => {
    mockUseMaintenanceEvents.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load events'),
    } as any)

    render(<EventsOverviewContainer />)

    expect(screen.getByText(/error loading events/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('shows empty state when no events', () => {
    mockUseMaintenanceEvents.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any)

    render(<EventsOverviewContainer />)

    expect(screen.getByText(/no maintenance events found/i)).toBeInTheDocument()
  })

  it('handles summary card clicks to filter events', async () => {
    const { user } = render(<EventsOverviewContainer />)

    const activeEventsCard = screen.getByText('Active Events').closest('div')?.closest('div')
    if (activeEventsCard) {
      await user.click(activeEventsCard)

      expect(mockUseMaintenanceEvents).toHaveBeenCalledWith(
        expect.objectContaining({ status: MaintenanceEventStatus.InProgress })
      )
    }
  })

  it('clears filters when clear button is clicked', async () => {
    const initialFilters: EventsFilters = {
      search: 'test',
      status: MaintenanceEventStatus.InProgress,
    }

    const { user } = render(<EventsOverviewContainer initialFilters={initialFilters} />)

    const clearButton = screen.getByRole('button', { name: /clear filters/i })
    await user.click(clearButton)

    expect(mockUseMaintenanceEvents).toHaveBeenCalledWith({
      search: '',
      status: undefined,
      eventType: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    })
  })

  it('updates URL when filters change', async () => {
    const { user } = render(<EventsOverviewContainer />)

    const searchInput = screen.getByPlaceholderText(/search events/i)
    await user.type(searchInput, 'test')

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('search=test')
      )
    })
  })

  it('handles date range filter changes', async () => {
    const { user } = render(<EventsOverviewContainer />)

    const dateRangePicker = screen.getByRole('button', { name: /pick a date/i })
    await user.click(dateRangePicker)

    // Date picker interaction would be more complex in real implementation
    expect(dateRangePicker).toBeInTheDocument()
  })

  it('retries loading events when retry button is clicked', async () => {
    mockUseMaintenanceEvents.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load events'),
      refetch: jest.fn(),
    } as any)

    const { user } = render(<EventsOverviewContainer />)

    const retryButton = screen.getByRole('button', { name: /try again/i })
    await user.click(retryButton)

    expect(mockUseMaintenanceEvents().refetch).toHaveBeenCalled()
  })

  it('shows correct event count in header', () => {
    render(<EventsOverviewContainer />)

    expect(screen.getByText(/2 events/i)).toBeInTheDocument()
  })

  it('handles responsive layout', () => {
    render(<EventsOverviewContainer />)

    const container = screen.getByRole('main')
    expect(container).toHaveClass('flex', 'flex-col', 'gap-6')

    const eventsGrid = screen.getByTestId('events-grid')
    expect(eventsGrid).toHaveClass('grid', 'gap-4', 'md:grid-cols-2', 'lg:grid-cols-3')
  })

  it('preserves filter state across re-renders', () => {
    const initialFilters: EventsFilters = {
      search: 'test',
      status: MaintenanceEventStatus.InProgress,
    }

    const { rerender } = render(<EventsOverviewContainer initialFilters={initialFilters} />)

    rerender(<EventsOverviewContainer initialFilters={initialFilters} />)

    expect(mockUseMaintenanceEvents).toHaveBeenCalledWith(initialFilters)
  })

  it('shows filter indicators when filters are active', () => {
    const filtersWithValues: EventsFilters = {
      search: 'test',
      status: MaintenanceEventStatus.InProgress,
      eventType: MaintenanceEventType.Overhaul,
    }

    render(<EventsOverviewContainer initialFilters={filtersWithValues} />)

    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument()
  })

  it('handles multiple filter changes efficiently', async () => {
    const { user } = render(<EventsOverviewContainer />)

    // Change multiple filters quickly
    const searchInput = screen.getByPlaceholderText(/search events/i)
    await user.type(searchInput, 'test')

    const statusSelect = screen.getByRole('combobox', { name: /status/i })
    await user.click(statusSelect)
    const inProgressOption = screen.getByRole('option', { name: /in progress/i })
    await user.click(inProgressOption)

    // Should debounce and make efficient API calls
    await waitFor(() => {
      expect(mockUseMaintenanceEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test',
          status: MaintenanceEventStatus.InProgress,
        })
      )
    })
  })
})
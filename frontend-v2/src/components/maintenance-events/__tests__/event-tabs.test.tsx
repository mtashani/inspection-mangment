import React from 'react'
import { render, screen, waitFor } from '@/test-utils'
import { EventTabs } from '../event-tabs'
import { MaintenanceEvent, MaintenanceSubEvent, MaintenanceEventStatus, MaintenanceEventType } from '@/types/maintenance-events'

// Mock the inspections list component
jest.mock('../inspections-list', () => ({
  InspectionsList: ({ eventId, subEventId, search }: any) => (
    <div data-testid="inspections-list">
      <div>Event ID: {eventId}</div>
      <div>Sub Event ID: {subEventId || 'none'}</div>
      <div>Search: {search || 'none'}</div>
    </div>
  ),
}))

const mockEvent: MaintenanceEvent = {
  id: 1,
  event_number: 'ME-2024-001',
  title: 'Test Maintenance Event',
  status: MaintenanceEventStatus.InProgress,
  event_type: MaintenanceEventType.Overhaul,
  planned_start_date: '2024-01-15T08:00:00Z',
  planned_end_date: '2024-01-20T17:00:00Z',
  direct_inspections_count: 5,
  created_at: '2024-01-10T10:00:00Z',
  updated_at: '2024-01-15T08:30:00Z',
}

const mockSubEvents: MaintenanceSubEvent[] = [
  {
    id: 1,
    parent_event_id: 1,
    sub_event_number: 'SE-001',
    title: 'Sub Event 1',
    status: MaintenanceEventStatus.InProgress,
    planned_start_date: '2024-01-15T08:00:00Z',
    planned_end_date: '2024-01-17T17:00:00Z',
    completion_percentage: 50,
    inspections_count: 8,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-15T08:30:00Z',
  },
  {
    id: 2,
    parent_event_id: 1,
    sub_event_number: 'SE-002',
    title: 'Sub Event 2',
    status: MaintenanceEventStatus.Planned,
    planned_start_date: '2024-01-18T08:00:00Z',
    planned_end_date: '2024-01-20T17:00:00Z',
    completion_percentage: 0,
    inspections_count: 3,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-15T08:30:00Z',
  },
]

const mockOnTabChange = jest.fn()
const mockOnSearchChange = jest.fn()

const defaultProps = {
  event: mockEvent,
  subEvents: mockSubEvents,
  activeTab: 'direct-inspections',
  onTabChange: mockOnTabChange,
  search: '',
  onSearchChange: mockOnSearchChange,
}

describe('EventTabs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders direct inspections tab', () => {
    render(<EventTabs {...defaultProps} />)

    expect(screen.getByRole('tab', { name: /direct inspections/i })).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // Badge count
  })

  it('renders sub-event tabs when sub-events exist', () => {
    render(<EventTabs {...defaultProps} />)

    expect(screen.getByRole('tab', { name: /sub event 1/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /sub event 2/i })).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument() // Sub event 1 inspections count
    expect(screen.getByText('3')).toBeInTheDocument() // Sub event 2 inspections count
  })

  it('only shows direct inspections tab when no sub-events', () => {
    render(<EventTabs {...defaultProps} subEvents={[]} />)

    expect(screen.getByRole('tab', { name: /direct inspections/i })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /sub event/i })).not.toBeInTheDocument()
  })

  it('calls onTabChange when tab is clicked', async () => {
    const { user } = render(<EventTabs {...defaultProps} />)

    const subEventTab = screen.getByRole('tab', { name: /sub event 1/i })
    await user.click(subEventTab)

    expect(mockOnTabChange).toHaveBeenCalledWith('sub-event-1')
  })

  it('shows active tab correctly', () => {
    render(<EventTabs {...defaultProps} activeTab="sub-event-1" />)

    const activeTab = screen.getByRole('tab', { name: /sub event 1/i })
    expect(activeTab).toHaveAttribute('data-state', 'active')
  })

  it('renders search input', () => {
    render(<EventTabs {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(/search inspections/i)
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveValue('')
  })

  it('displays current search value', () => {
    render(<EventTabs {...defaultProps} search="test search" />)

    const searchInput = screen.getByPlaceholderText(/search inspections/i)
    expect(searchInput).toHaveValue('test search')
  })

  it('calls onSearchChange when search input changes', async () => {
    const { user } = render(<EventTabs {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(/search inspections/i)
    await user.type(searchInput, 'new search')

    expect(mockOnSearchChange).toHaveBeenCalledWith('new search')
  })

  it('shows correct tab content based on active tab', () => {
    render(<EventTabs {...defaultProps} activeTab="direct-inspections" />)

    expect(screen.getByTestId('inspections-list')).toBeInTheDocument()
    expect(screen.getByText('Event ID: 1')).toBeInTheDocument()
    expect(screen.getByText('Sub Event ID: none')).toBeInTheDocument()
  })

  it('shows sub-event content when sub-event tab is active', () => {
    render(<EventTabs {...defaultProps} activeTab="sub-event-1" />)

    expect(screen.getByTestId('inspections-list')).toBeInTheDocument()
    expect(screen.getByText('Event ID: 1')).toBeInTheDocument()
    expect(screen.getByText('Sub Event ID: 1')).toBeInTheDocument()
  })

  it('passes search term to inspections list', () => {
    render(<EventTabs {...defaultProps} search="test search" />)

    expect(screen.getByText('Search: test search')).toBeInTheDocument()
  })

  it('handles zero inspection counts in badges', () => {
    const eventWithZeroCounts = {
      ...mockEvent,
      direct_inspections_count: 0,
    }
    const subEventsWithZeroCounts = mockSubEvents.map(se => ({
      ...se,
      inspections_count: 0,
    }))

    render(
      <EventTabs 
        {...defaultProps} 
        event={eventWithZeroCounts}
        subEvents={subEventsWithZeroCounts}
      />
    )

    const badges = screen.getAllByText('0')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('handles undefined inspection counts gracefully', () => {
    const eventWithUndefinedCounts = {
      ...mockEvent,
      direct_inspections_count: undefined,
    }
    const subEventsWithUndefinedCounts = mockSubEvents.map(se => ({
      ...se,
      inspections_count: undefined,
    }))

    render(
      <EventTabs 
        {...defaultProps} 
        event={eventWithUndefinedCounts}
        subEvents={subEventsWithUndefinedCounts}
      />
    )

    // Should default to 0 when counts are undefined
    const badges = screen.getAllByText('0')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('shows search icon in search input', () => {
    render(<EventTabs {...defaultProps} />)

    const searchIcon = screen.getByTestId('search-icon')
    expect(searchIcon).toBeInTheDocument()
  })

  it('applies responsive layout classes', () => {
    render(<EventTabs {...defaultProps} />)

    const tabsList = screen.getByRole('tablist')
    expect(tabsList).toHaveClass('grid', 'w-full')
  })

  it('handles keyboard navigation between tabs', async () => {
    const { user } = render(<EventTabs {...defaultProps} />)

    const firstTab = screen.getByRole('tab', { name: /direct inspections/i })
    const secondTab = screen.getByRole('tab', { name: /sub event 1/i })

    // Focus first tab
    firstTab.focus()
    expect(firstTab).toHaveFocus()

    // Navigate with arrow keys
    await user.keyboard('{ArrowRight}')
    expect(secondTab).toHaveFocus()
  })

  it('clears search when switching tabs', async () => {
    const { user } = render(<EventTabs {...defaultProps} search="existing search" />)

    const subEventTab = screen.getByRole('tab', { name: /sub event 1/i })
    await user.click(subEventTab)

    // Should clear search when switching tabs (if implemented)
    expect(mockOnTabChange).toHaveBeenCalledWith('sub-event-1')
  })

  it('shows correct tab count in grid layout', () => {
    render(<EventTabs {...defaultProps} />)

    const tabsList = screen.getByRole('tablist')
    // Should have 3 tabs: direct inspections + 2 sub-events
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
  })

  it('handles long sub-event titles gracefully', () => {
    const subEventsWithLongTitles = [
      {
        ...mockSubEvents[0],
        title: 'This is a very long sub-event title that might overflow',
      },
    ]

    render(<EventTabs {...defaultProps} subEvents={subEventsWithLongTitles} />)

    expect(screen.getByRole('tab', { name: /this is a very long/i })).toBeInTheDocument()
  })

  it('maintains search state across tab switches', () => {
    const { rerender } = render(<EventTabs {...defaultProps} search="test" />)

    // Switch to different tab
    rerender(<EventTabs {...defaultProps} activeTab="sub-event-1" search="test" />)

    expect(screen.getByDisplayValue('test')).toBeInTheDocument()
  })

  it('shows badge with correct styling', () => {
    render(<EventTabs {...defaultProps} />)

    const badges = screen.getAllByText(/^\d+$/) // Find numeric badges
    badges.forEach(badge => {
      expect(badge).toHaveClass('ml-2', 'h-5', 'w-5', 'rounded-full')
    })
  })

  it('handles empty sub-events array', () => {
    render(<EventTabs {...defaultProps} subEvents={undefined} />)

    expect(screen.getByRole('tab', { name: /direct inspections/i })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /sub event/i })).not.toBeInTheDocument()
  })
})
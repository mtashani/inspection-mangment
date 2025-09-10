import React from 'react'
import { render, screen } from '@/test-utils'
import { EventCard } from '../event-card'
import { MaintenanceEvent, MaintenanceEventStatus, MaintenanceEventType } from '@/types/maintenance-events'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const mockEvent: MaintenanceEvent = {
  id: 1,
  event_number: 'ME-2024-001',
  title: 'Test Maintenance Event',
  description: 'This is a test maintenance event description',
  event_type: MaintenanceEventType.Overhaul,
  status: MaintenanceEventStatus.InProgress,
  planned_start_date: '2024-01-15T08:00:00Z',
  planned_end_date: '2024-01-20T17:00:00Z',
  actual_start_date: '2024-01-15T08:30:00Z',
  sub_events_count: 3,
  inspections_count: 12,
  direct_inspections_count: 5,
  created_at: '2024-01-10T10:00:00Z',
  updated_at: '2024-01-15T08:30:00Z',
}

describe('EventCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders event information correctly', () => {
    render(<EventCard event={mockEvent} />)

    expect(screen.getByText('Test Maintenance Event')).toBeInTheDocument()
    expect(screen.getByText('ME-2024-001')).toBeInTheDocument()
    expect(screen.getByText('InProgress')).toBeInTheDocument()
    expect(screen.getByText('3 Sub-events')).toBeInTheDocument()
    expect(screen.getByText('12 Inspections')).toBeInTheDocument()
  })

  it('displays formatted dates correctly', () => {
    render(<EventCard event={mockEvent} />)

    expect(screen.getByText(/Jan 15, 2024 - Jan 20, 2024/)).toBeInTheDocument()
  })

  it('shows description when provided', () => {
    render(<EventCard event={mockEvent} />)

    expect(screen.getByText('This is a test maintenance event description')).toBeInTheDocument()
  })

  it('handles missing description gracefully', () => {
    const eventWithoutDescription = { ...mockEvent, description: undefined }
    render(<EventCard event={eventWithoutDescription} />)

    expect(screen.queryByText('This is a test maintenance event description')).not.toBeInTheDocument()
  })

  it('navigates to event details on click', async () => {
    const { user } = render(<EventCard event={mockEvent} />)

    const card = screen.getByRole('button')
    await user.click(card)

    expect(mockPush).toHaveBeenCalledWith('/maintenance-events/1')
  })

  it('displays correct status badge variant', () => {
    render(<EventCard event={mockEvent} />)

    const statusBadge = screen.getByText('InProgress')
    expect(statusBadge).toBeInTheDocument()
    expect(statusBadge).toHaveClass('bg-yellow-100') // Assuming InProgress uses yellow variant
  })

  it('handles zero counts gracefully', () => {
    const eventWithZeroCounts = {
      ...mockEvent,
      sub_events_count: 0,
      inspections_count: 0,
    }
    render(<EventCard event={eventWithZeroCounts} />)

    expect(screen.getByText('0 Sub-events')).toBeInTheDocument()
    expect(screen.getByText('0 Inspections')).toBeInTheDocument()
  })

  it('handles undefined counts gracefully', () => {
    const eventWithUndefinedCounts = {
      ...mockEvent,
      sub_events_count: undefined,
      inspections_count: undefined,
    }
    render(<EventCard event={eventWithUndefinedCounts} />)

    expect(screen.getByText('0 Sub-events')).toBeInTheDocument()
    expect(screen.getByText('0 Inspections')).toBeInTheDocument()
  })

  it('applies hover effects', async () => {
    const { user } = render(<EventCard event={mockEvent} />)

    const card = screen.getByRole('button')
    await user.hover(card)

    expect(card).toHaveClass('hover:shadow-md')
  })

  it('renders with different event statuses', () => {
    const completedEvent = { ...mockEvent, status: MaintenanceEventStatus.Completed }
    const { rerender } = render(<EventCard event={completedEvent} />)

    expect(screen.getByText('Completed')).toBeInTheDocument()

    const plannedEvent = { ...mockEvent, status: MaintenanceEventStatus.Planned }
    rerender(<EventCard event={plannedEvent} />)

    expect(screen.getByText('Planned')).toBeInTheDocument()
  })

  it('truncates long descriptions', () => {
    const longDescription = 'This is a very long description that should be truncated when displayed in the card component to maintain proper layout and readability'
    const eventWithLongDescription = { ...mockEvent, description: longDescription }
    
    render(<EventCard event={eventWithLongDescription} />)

    const descriptionElement = screen.getByText(longDescription)
    expect(descriptionElement).toHaveClass('line-clamp-2')
  })
})
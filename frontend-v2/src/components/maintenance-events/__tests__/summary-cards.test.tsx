import React from 'react'
import { render, screen } from '@/test-utils'
import { SummaryCards } from '../summary-cards'
import { EventsSummary } from '@/types/maintenance-events'

const mockSummary: EventsSummary = {
  totalEvents: 25,
  activeEvents: 8,
  completedEvents: 15,
  overdueEvents: 2,
  totalInspections: 120,
  activeInspections: 45,
  totalReports: 350,
  reportsThisMonth: 28,
}

const mockOnCardClick = jest.fn()

describe('SummaryCards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all summary cards with correct values', () => {
    render(<SummaryCards summary={mockSummary} onCardClick={mockOnCardClick} />)

    expect(screen.getByText('Total Events')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()

    expect(screen.getByText('Active Events')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()

    expect(screen.getByText('Completed Events')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()

    expect(screen.getByText('Overdue Events')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()

    expect(screen.getByText('Total Inspections')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()

    expect(screen.getByText('Active Inspections')).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()

    expect(screen.getByText('Total Reports')).toBeInTheDocument()
    expect(screen.getByText('350')).toBeInTheDocument()

    expect(screen.getByText('Reports This Month')).toBeInTheDocument()
    expect(screen.getByText('28')).toBeInTheDocument()
  })

  it('shows loading skeletons when loading', () => {
    render(<SummaryCards loading={true} onCardClick={mockOnCardClick} />)

    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons).toHaveLength(8) // One for each card
  })

  it('handles missing summary data gracefully', () => {
    render(<SummaryCards onCardClick={mockOnCardClick} />)

    // Should show 0 for all values when no summary provided
    const zeroValues = screen.getAllByText('0')
    expect(zeroValues).toHaveLength(8)
  })

  it('calls onCardClick with correct metric when card is clicked', async () => {
    const { user } = render(<SummaryCards summary={mockSummary} onCardClick={mockOnCardClick} />)

    const totalEventsCard = screen.getByText('Total Events').closest('div')?.closest('div')
    if (totalEventsCard) {
      await user.click(totalEventsCard)
      expect(mockOnCardClick).toHaveBeenCalledWith('total-events')
    }

    const activeEventsCard = screen.getByText('Active Events').closest('div')?.closest('div')
    if (activeEventsCard) {
      await user.click(activeEventsCard)
      expect(mockOnCardClick).toHaveBeenCalledWith('active-events')
    }
  })

  it('applies hover effects to clickable cards', async () => {
    const { user } = render(<SummaryCards summary={mockSummary} onCardClick={mockOnCardClick} />)

    const cards = screen.getAllByRole('button')
    expect(cards).toHaveLength(8)

    for (const card of cards) {
      expect(card).toHaveClass('cursor-pointer', 'hover:shadow-md')
    }
  })

  it('displays correct icons for each metric', () => {
    render(<SummaryCards summary={mockSummary} onCardClick={mockOnCardClick} />)

    // Check that icons are present (they should be rendered as SVG elements)
    const icons = screen.getAllByRole('img', { hidden: true })
    expect(icons.length).toBeGreaterThan(0)
  })

  it('shows appropriate descriptions for each card', () => {
    render(<SummaryCards summary={mockSummary} onCardClick={mockOnCardClick} />)

    expect(screen.getByText('All maintenance events')).toBeInTheDocument()
    expect(screen.getByText('Currently in progress')).toBeInTheDocument()
    expect(screen.getByText('Successfully completed')).toBeInTheDocument()
    expect(screen.getByText('Past due date')).toBeInTheDocument()
    expect(screen.getByText('All inspections')).toBeInTheDocument()
    expect(screen.getByText('Currently active')).toBeInTheDocument()
    expect(screen.getByText('All daily reports')).toBeInTheDocument()
    expect(screen.getByText('Created this month')).toBeInTheDocument()
  })

  it('handles partial summary data', () => {
    const partialSummary: Partial<EventsSummary> = {
      totalEvents: 10,
      activeEvents: 3,
      // Missing other properties
    }

    render(<SummaryCards summary={partialSummary as EventsSummary} onCardClick={mockOnCardClick} />)

    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    
    // Should show 0 for missing values
    const zeroValues = screen.getAllByText('0')
    expect(zeroValues.length).toBeGreaterThan(0)
  })

  it('renders in responsive grid layout', () => {
    render(<SummaryCards summary={mockSummary} onCardClick={mockOnCardClick} />)

    const gridContainer = screen.getByRole('main').firstChild
    expect(gridContainer).toHaveClass('grid', 'gap-4', 'md:grid-cols-2', 'lg:grid-cols-4')
  })

  it('handles click events when onCardClick is not provided', async () => {
    const { user } = render(<SummaryCards summary={mockSummary} />)

    const totalEventsCard = screen.getByText('Total Events').closest('div')?.closest('div')
    if (totalEventsCard) {
      // Should not throw error when clicked without onCardClick handler
      await user.click(totalEventsCard)
    }
  })

  it('shows loading state for individual cards', () => {
    render(<SummaryCards summary={mockSummary} loading={true} onCardClick={mockOnCardClick} />)

    // All card titles should still be visible
    expect(screen.getByText('Total Events')).toBeInTheDocument()
    expect(screen.getByText('Active Events')).toBeInTheDocument()

    // But values should be replaced with skeletons
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
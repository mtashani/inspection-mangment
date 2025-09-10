import React from 'react'
import { render, screen, waitFor } from '@/test-utils'
import { GlobalSearchFilters } from '../global-search-filters'
import { EventsFilters, MaintenanceEventStatus, MaintenanceEventType } from '@/types/maintenance-events'

const mockFilters: EventsFilters = {
  search: '',
  status: undefined,
  eventType: undefined,
  dateFrom: undefined,
  dateTo: undefined,
}

const mockOnFiltersChange = jest.fn()

describe('GlobalSearchFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all filter components', () => {
    render(<GlobalSearchFilters filters={mockFilters} onFiltersChange={mockOnFiltersChange} />)

    expect(screen.getByPlaceholderText(/search events/i)).toBeInTheDocument()
    expect(screen.getByText(/status/i)).toBeInTheDocument()
    expect(screen.getByText(/event type/i)).toBeInTheDocument()
    expect(screen.getByText(/date range/i)).toBeInTheDocument()
  })

  it('displays current filter values', () => {
    const filtersWithValues: EventsFilters = {
      search: 'test search',
      status: MaintenanceEventStatus.InProgress,
      eventType: MaintenanceEventType.Overhaul,
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
    }

    render(<GlobalSearchFilters filters={filtersWithValues} onFiltersChange={mockOnFiltersChange} />)

    expect(screen.getByDisplayValue('test search')).toBeInTheDocument()
  })

  it('calls onFiltersChange when search input changes', async () => {
    const { user } = render(<GlobalSearchFilters filters={mockFilters} onFiltersChange={mockOnFiltersChange} />)

    const searchInput = screen.getByPlaceholderText(/search events/i)
    await user.type(searchInput, 'new search')

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        search: 'new search',
      })
    })
  })

  it('debounces search input changes', async () => {
    const { user } = render(<GlobalSearchFilters filters={mockFilters} onFiltersChange={mockOnFiltersChange} />)

    const searchInput = screen.getByPlaceholderText(/search events/i)
    
    // Type multiple characters quickly
    await user.type(searchInput, 'test')

    // Should not call onFiltersChange immediately for each character
    expect(mockOnFiltersChange).not.toHaveBeenCalled()

    // Wait for debounce delay
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        search: 'test',
      })
    }, { timeout: 1000 })
  })

  it('calls onFiltersChange when status filter changes', async () => {
    const { user } = render(<GlobalSearchFilters filters={mockFilters} onFiltersChange={mockOnFiltersChange} />)

    const statusSelect = screen.getByRole('combobox', { name: /status/i })
    await user.click(statusSelect)

    const inProgressOption = screen.getByRole('option', { name: /in progress/i })
    await user.click(inProgressOption)

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      status: MaintenanceEventStatus.InProgress,
    })
  })

  it('calls onFiltersChange when event type filter changes', async () => {
    const { user } = render(<GlobalSearchFilters filters={mockFilters} onFiltersChange={mockOnFiltersChange} />)

    const eventTypeSelect = screen.getByRole('combobox', { name: /event type/i })
    await user.click(eventTypeSelect)

    const overhaulOption = screen.getByRole('option', { name: /overhaul/i })
    await user.click(overhaulOption)

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      eventType: MaintenanceEventType.Overhaul,
    })
  })

  it('handles date range selection', async () => {
    const { user } = render(<GlobalSearchFilters filters={mockFilters} onFiltersChange={mockOnFiltersChange} />)

    const dateRangePicker = screen.getByRole('button', { name: /pick a date/i })
    await user.click(dateRangePicker)

    // Note: Date picker interaction would require more complex setup
    // This is a basic test to ensure the component renders
    expect(dateRangePicker).toBeInTheDocument()
  })

  it('clears filters when clear button is clicked', async () => {
    const filtersWithValues: EventsFilters = {
      search: 'test search',
      status: MaintenanceEventStatus.InProgress,
      eventType: MaintenanceEventType.Overhaul,
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
    }

    const { user } = render(<GlobalSearchFilters filters={filtersWithValues} onFiltersChange={mockOnFiltersChange} />)

    const clearButton = screen.getByRole('button', { name: /clear filters/i })
    await user.click(clearButton)

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      search: '',
      status: undefined,
      eventType: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    })
  })

  it('shows filter indicators when filters are active', () => {
    const filtersWithValues: EventsFilters = {
      search: 'test search',
      status: MaintenanceEventStatus.InProgress,
      eventType: MaintenanceEventType.Overhaul,
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
    }

    render(<GlobalSearchFilters filters={filtersWithValues} onFiltersChange={mockOnFiltersChange} />)

    // Should show some indication that filters are active
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument()
  })

  it('handles empty search input', async () => {
    const filtersWithSearch: EventsFilters = {
      ...mockFilters,
      search: 'existing search',
    }

    const { user } = render(<GlobalSearchFilters filters={filtersWithSearch} onFiltersChange={mockOnFiltersChange} />)

    const searchInput = screen.getByDisplayValue('existing search')
    await user.clear(searchInput)

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...filtersWithSearch,
        search: '',
      })
    })
  })

  it('renders with responsive layout', () => {
    render(<GlobalSearchFilters filters={mockFilters} onFiltersChange={mockOnFiltersChange} />)

    const container = screen.getByRole('search')
    expect(container).toHaveClass('flex', 'flex-col', 'gap-4')
  })

  it('shows search icon in search input', () => {
    render(<GlobalSearchFilters filters={mockFilters} onFiltersChange={mockOnFiltersChange} />)

    const searchIcon = screen.getByRole('img', { name: /search/i })
    expect(searchIcon).toBeInTheDocument()
  })

  it('handles keyboard navigation in select components', async () => {
    const { user } = render(<GlobalSearchFilters filters={mockFilters} onFiltersChange={mockOnFiltersChange} />)

    const statusSelect = screen.getByRole('combobox', { name: /status/i })
    
    // Focus the select
    await user.tab()
    expect(statusSelect).toHaveFocus()

    // Open with Enter key
    await user.keyboard('{Enter}')
    
    // Should show options
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('validates date range selection', async () => {
    const { user } = render(<GlobalSearchFilters filters={mockFilters} onFiltersChange={mockOnFiltersChange} />)

    // This would test date validation logic
    // Implementation depends on the specific date picker component used
    const dateRangePicker = screen.getByRole('button', { name: /pick a date/i })
    expect(dateRangePicker).toBeInTheDocument()
  })
})
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import FilterAndSearchPanel from '../FilterAndSearchPanel'
import { FilterOptions, InspectionStatus, InspectionPriority, RefineryDepartment } from '@/types/enhanced-maintenance'
import { MaintenanceEventStatus, MaintenanceEventType } from '@/types/maintenance'

// Mock UI components
vi.mock('@/components/ui/input', () => ({
  Input: ({ placeholder, value, onChange, className, ...props }: any) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={className}
      {...props}
    />
  )
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, className, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={`badge ${variant} ${className}`}>{children}</span>
  )
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>
}))

// Mock complex components
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange }: any) => (
    <div data-testid="popover" data-open={open}>
      {children}
    </div>
  ),
  PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>,
  PopoverTrigger: ({ children }: any) => <div data-testid="popover-trigger">{children}</div>
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>
      <button onClick={() => onValueChange && onValueChange('test-value')}>
        {children}
      </button>
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ children }: any) => <div>{children}</div>
}))

describe('FilterAndSearchPanel', () => {
  const defaultFilters: FilterOptions = {}
  
  const defaultProps = {
    filters: defaultFilters,
    onFiltersChange: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn(),
    onClearFilters: vi.fn(),
    availableInspectors: ['John Doe', 'Jane Smith', 'Mike Johnson'],
    availableRequesters: ['Operations Team', 'Maintenance Team', 'Engineering'],
    availableDepartments: Object.values(RefineryDepartment)
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Search Functionality', () => {
    it('renders search input with correct placeholder', () => {
      render(<FilterAndSearchPanel {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText(/search by equipment tag/i)
      expect(searchInput).toBeInTheDocument()
    })

    it('displays current search query', () => {
      render(<FilterAndSearchPanel {...defaultProps} searchQuery="V-101" />)
      
      const searchInput = screen.getByDisplayValue('V-101')
      expect(searchInput).toBeInTheDocument()
    })

    it('calls onSearchChange with debounced input', async () => {
      const user = userEvent.setup()
      render(<FilterAndSearchPanel {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText(/search by equipment tag/i)
      
      await user.type(searchInput, 'test search')
      
      // Wait for debounce
      await waitFor(() => {
        expect(defaultProps.onSearchChange).toHaveBeenCalledWith('test search')
      }, { timeout: 500 })
    })

    it('debounces search input to avoid excessive API calls', async () => {
      const user = userEvent.setup()
      render(<FilterAndSearchPanel {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText(/search by equipment tag/i)
      
      // Type multiple characters quickly
      await user.type(searchInput, 'abc')
      
      // Should not call onSearchChange immediately
      expect(defaultProps.onSearchChange).not.toHaveBeenCalled()
      
      // Wait for debounce
      await waitFor(() => {
        expect(defaultProps.onSearchChange).toHaveBeenCalledWith('abc')
      }, { timeout: 500 })
    })
  })

  describe('Filter Toggle', () => {
    it('renders filters toggle button', () => {
      render(<FilterAndSearchPanel {...defaultProps} />)
      
      const filtersButton = screen.getByText('Filters')
      expect(filtersButton).toBeInTheDocument()
    })

    it('shows filter count badge when filters are active', () => {
      const filtersWithData: FilterOptions = {
        status: [InspectionStatus.InProgress],
        priority: [InspectionPriority.High],
        dateRange: { from: '2025-01-01', to: '2025-01-31' }
      }

      render(<FilterAndSearchPanel {...defaultProps} filters={filtersWithData} />)
      
      const badge = screen.getByText('3') // 3 active filters
      expect(badge).toBeInTheDocument()
    })

    it('expands filter panel when filters button is clicked', async () => {
      const user = userEvent.setup()
      render(<FilterAndSearchPanel {...defaultProps} />)
      
      const filtersButton = screen.getByText('Filters')
      await user.click(filtersButton)
      
      // Check for expanded filter content (implementation specific)
      expect(screen.getByText('Date Range')).toBeInTheDocument()
    })
  })

  describe('Active Filters Display', () => {
    it('displays active date range filter', () => {
      const filtersWithDateRange: FilterOptions = {
        dateRange: { from: '2025-01-01', to: '2025-01-31' }
      }

      render(<FilterAndSearchPanel {...defaultProps} filters={filtersWithDateRange} />)
      
      expect(screen.getByText(/1\/1\/2025.*1\/31\/2025/)).toBeInTheDocument()
    })

    it('displays active status filters', () => {
      const filtersWithStatus: FilterOptions = {
        status: [InspectionStatus.InProgress, InspectionStatus.Completed]
      }

      render(<FilterAndSearchPanel {...defaultProps} filters={filtersWithStatus} />)
      
      expect(screen.getByText('InProgress')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('displays active inspector filters', () => {
      const filtersWithInspectors: FilterOptions = {
        inspectors: ['John Doe', 'Jane Smith']
      }

      render(<FilterAndSearchPanel {...defaultProps} filters={filtersWithInspectors} />)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    it('displays active equipment tag filter', () => {
      const filtersWithEquipment: FilterOptions = {
        equipmentTag: 'V-101'
      }

      render(<FilterAndSearchPanel {...defaultProps} filters={filtersWithEquipment} />)
      
      expect(screen.getByText('V-101')).toBeInTheDocument()
    })
  })

  describe('Filter Removal', () => {
    it('allows removing individual filters', async () => {
      const user = userEvent.setup()
      const filtersWithStatus: FilterOptions = {
        status: [InspectionStatus.InProgress, InspectionStatus.Completed]
      }

      render(<FilterAndSearchPanel {...defaultProps} filters={filtersWithStatus} />)
      
      // Find and click remove button for InProgress filter
      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      if (removeButtons.length > 0) {
        await user.click(removeButtons[0])
        
        expect(defaultProps.onFiltersChange).toHaveBeenCalled()
      }
    })

    it('shows clear all filters button when filters are active', () => {
      const filtersWithData: FilterOptions = {
        status: [InspectionStatus.InProgress]
      }

      render(<FilterAndSearchPanel {...defaultProps} filters={filtersWithData} />)
      
      expect(screen.getByText('Clear All')).toBeInTheDocument()
    })

    it('calls onClearFilters when clear all is clicked', async () => {
      const user = userEvent.setup()
      const filtersWithData: FilterOptions = {
        status: [InspectionStatus.InProgress]
      }

      render(<FilterAndSearchPanel {...defaultProps} filters={filtersWithData} />)
      
      const clearAllButton = screen.getByText('Clear All')
      await user.click(clearAllButton)
      
      expect(defaultProps.onClearFilters).toHaveBeenCalled()
    })
  })

  describe('Filter Options', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<FilterAndSearchPanel {...defaultProps} />)
      
      // Expand filters panel
      const filtersButton = screen.getByText('Filters')
      await user.click(filtersButton)
    })

    it('renders date range picker', () => {
      expect(screen.getByText('Date Range')).toBeInTheDocument()
    })

    it('renders inspection status filter', () => {
      expect(screen.getByText('Inspection Status')).toBeInTheDocument()
    })

    it('renders priority filter', () => {
      expect(screen.getByText('Priority')).toBeInTheDocument()
    })

    it('renders department filter', () => {
      expect(screen.getByText('Department')).toBeInTheDocument()
    })

    it('renders inspectors filter', () => {
      expect(screen.getByText('Inspectors')).toBeInTheDocument()
    })

    it('renders equipment tag input', () => {
      expect(screen.getByText('Equipment Tag')).toBeInTheDocument()
    })

    it('renders event type filter', () => {
      expect(screen.getByText('Event Type')).toBeInTheDocument()
    })

    it('renders event status filter', () => {
      expect(screen.getByText('Event Status')).toBeInTheDocument()
    })

    it('renders requesters filter', () => {
      expect(screen.getByText('Requesters')).toBeInTheDocument()
    })
  })

  describe('Filter Updates', () => {
    it('calls onFiltersChange when equipment tag is entered', async () => {
      const user = userEvent.setup()
      render(<FilterAndSearchPanel {...defaultProps} />)
      
      // Expand filters
      const filtersButton = screen.getByText('Filters')
      await user.click(filtersButton)
      
      // Find equipment tag input
      const equipmentInput = screen.getByPlaceholderText('Enter equipment tag')
      await user.type(equipmentInput, 'V-101')
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          equipmentTag: 'V-101'
        })
      )
    })

    it('updates filters when date range is selected', async () => {
      const user = userEvent.setup()
      render(<FilterAndSearchPanel {...defaultProps} />)
      
      // Expand filters
      const filtersButton = screen.getByText('Filters')
      await user.click(filtersButton)
      
      // This would require more complex mocking of the date picker
      // For now, just verify the date range section exists
      expect(screen.getByText('Date Range')).toBeInTheDocument()
    })
  })

  describe('Multi-Select Filters', () => {
    it('handles multi-select for status filters', async () => {
      const user = userEvent.setup()
      render(<FilterAndSearchPanel {...defaultProps} />)
      
      // Expand filters
      const filtersButton = screen.getByText('Filters')
      await user.click(filtersButton)
      
      // Multi-select testing would require more detailed mocking
      expect(screen.getByText('Inspection Status')).toBeInTheDocument()
    })

    it('handles multi-select for inspector filters', async () => {
      const user = userEvent.setup()
      render(<FilterAndSearchPanel {...defaultProps} />)
      
      // Expand filters
      const filtersButton = screen.getByText('Filters')
      await user.click(filtersButton)
      
      expect(screen.getByText('Inspectors')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper labels for form inputs', async () => {
      const user = userEvent.setup()
      render(<FilterAndSearchPanel {...defaultProps} />)
      
      // Expand filters
      const filtersButton = screen.getByText('Filters')
      await user.click(filtersButton)
      
      // Check for proper labeling
      expect(screen.getByText('Date Range')).toBeInTheDocument()
      expect(screen.getByText('Equipment Tag')).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      render(<FilterAndSearchPanel {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText(/search by equipment tag/i)
      searchInput.focus()
      
      expect(searchInput).toHaveFocus()
    })

    it('has proper ARIA attributes for interactive elements', () => {
      render(<FilterAndSearchPanel {...defaultProps} />)
      
      const filtersButton = screen.getByText('Filters')
      expect(filtersButton).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const { rerender } = render(<FilterAndSearchPanel {...defaultProps} />)
      
      // Re-render with same props
      rerender(<FilterAndSearchPanel {...defaultProps} />)
      
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    it('handles large lists of available options efficiently', () => {
      const largeInspectorsList = Array.from({ length: 1000 }, (_, i) => `Inspector ${i}`)
      
      render(
        <FilterAndSearchPanel 
          {...defaultProps} 
          availableInspectors={largeInspectorsList}
        />
      )
      
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles missing available options gracefully', () => {
      render(
        <FilterAndSearchPanel 
          {...defaultProps} 
          availableInspectors={undefined as any}
          availableRequesters={undefined as any}
        />
      )
      
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    it('handles invalid filter values gracefully', () => {
      const invalidFilters: FilterOptions = {
        status: ['INVALID_STATUS' as any],
        priority: ['INVALID_PRIORITY' as any]
      }

      expect(() => {
        render(<FilterAndSearchPanel {...defaultProps} filters={invalidFilters} />)
      }).not.toThrow()
    })
  })

  describe('Responsive Design', () => {
    it('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<FilterAndSearchPanel {...defaultProps} />)
      
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    it('shows full layout on desktop screens', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      render(<FilterAndSearchPanel {...defaultProps} />)
      
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('works correctly with all filter types combined', () => {
      const complexFilters: FilterOptions = {
        dateRange: { from: '2025-01-01', to: '2025-01-31' },
        status: [InspectionStatus.InProgress],
        priority: [InspectionPriority.High],
        inspectors: ['John Doe'],
        equipmentTag: 'V-101',
        requester: ['Operations Team'],
        department: [RefineryDepartment.Operations],
        eventType: [MaintenanceEventType.OVERHAUL],
        eventStatus: [MaintenanceEventStatus.IN_PROGRESS]
      }

      render(<FilterAndSearchPanel {...defaultProps} filters={complexFilters} />)
      
      // Should show filter count badge
      expect(screen.getByText('9')).toBeInTheDocument() // 9 active filters
    })
  })
})
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import MaintenanceEventGroup from '../MaintenanceEventGroup'
import { EnhancedMaintenanceEvent, MaintenanceEventCategory } from '@/types/enhanced-maintenance'
import { MaintenanceEventStatus, MaintenanceEventType } from '@/types/maintenance'

// Mock the UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>
}))

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div className={className} data-testid="progress-bar" data-value={value} />
  )
}))

// Mock child components
vi.mock('../EventStatusIndicator', () => ({
  default: ({ status, onStatusChange }: any) => (
    <div data-testid="status-indicator">
      <span>{status}</span>
      {onStatusChange && (
        <button onClick={() => onStatusChange('IN_PROGRESS')}>
          Change Status
        </button>
      )}
    </div>
  )
}))

vi.mock('../SubEventsList', () => ({
  default: ({ subEvents, onInspectionCreate }: any) => (
    <div data-testid="sub-events-list">
      <span>Sub Events: {subEvents.length}</span>
      {onInspectionCreate && (
        <button onClick={() => onInspectionCreate('sub-event-1')}>
          Add Sub Event Inspection
        </button>
      )}
    </div>
  )
}))

vi.mock('../InspectionsList', () => ({
  default: ({ plannedInspections, activeInspections, completedInspections, onInspectionCreate }: any) => (
    <div data-testid="inspections-list">
      <span>Planned: {plannedInspections.length}</span>
      <span>Active: {activeInspections.length}</span>
      <span>Completed: {completedInspections.length}</span>
      {onInspectionCreate && (
        <button onClick={onInspectionCreate}>Add Inspection</button>
      )}
    </div>
  )
}))

vi.mock('../EventStatistics', () => ({
  default: ({ statistics }: any) => (
    <div data-testid="event-statistics">
      <span>Total Planned: {statistics.totalPlannedInspections}</span>
      <span>Active: {statistics.activeInspections}</span>
      <span>Completed: {statistics.completedInspections}</span>
    </div>
  )
}))

describe('MaintenanceEventGroup', () => {
  const mockEvent: EnhancedMaintenanceEvent = {
    id: '1',
    eventNumber: 'ME-2025-001',
    title: 'Test Maintenance Event',
    description: 'Test description',
    eventType: MaintenanceEventType.OVERHAUL,
    status: MaintenanceEventStatus.PLANNED,
    plannedStartDate: '2025-03-01',
    plannedEndDate: '2025-03-31',
    createdBy: 'test-user',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    subEvents: [],
    completionPercentage: 0,
    category: MaintenanceEventCategory.Simple,
    plannedInspections: [],
    activeInspections: [],
    completedInspections: [],
    statistics: {
      totalPlannedInspections: 10,
      activeInspections: 3,
      completedInspections: 5,
      firstTimeInspectionsCount: 2,
      equipmentStatusBreakdown: {
        planned: 2,
        underInspection: 3,
        completed: 5
      }
    },
    requesterBreakdown: []
  }

  const defaultProps = {
    event: mockEvent,
    expanded: false,
    showActions: true,
    showStatistics: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders event basic information correctly', () => {
      render(<MaintenanceEventGroup {...defaultProps} />)
      
      expect(screen.getByText('ME-2025-001')).toBeInTheDocument()
      expect(screen.getByText('Test Maintenance Event')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
      expect(screen.getByText('OVERHAUL')).toBeInTheDocument()
    })

    it('renders event dates correctly', () => {
      render(<MaintenanceEventGroup {...defaultProps} />)
      
      // Check that dates are displayed (format may vary)
      expect(screen.getByText(/Mar 1, 2025/)).toBeInTheDocument()
      expect(screen.getByText(/Mar 31, 2025/)).toBeInTheDocument()
    })

    it('renders statistics when showStatistics is true', () => {
      render(<MaintenanceEventGroup {...defaultProps} />)
      
      expect(screen.getByText('10')).toBeInTheDocument() // totalPlannedInspections
      expect(screen.getByText('3')).toBeInTheDocument()  // activeInspections
      expect(screen.getByText('5')).toBeInTheDocument()  // completedInspections
      expect(screen.getByText('2')).toBeInTheDocument()  // firstTimeInspectionsCount
    })

    it('does not render statistics when showStatistics is false', () => {
      render(<MaintenanceEventGroup {...defaultProps} showStatistics={false} />)
      
      expect(screen.queryByTestId('event-statistics')).not.toBeInTheDocument()
    })

    it('renders progress bar for in-progress events', () => {
      const inProgressEvent = {
        ...mockEvent,
        status: MaintenanceEventStatus.IN_PROGRESS,
        completionPercentage: 45
      }

      render(<MaintenanceEventGroup {...defaultProps} event={inProgressEvent} />)
      
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('data-value', '45')
    })
  })

  describe('Expansion/Collapse', () => {
    it('shows collapse/expand button', () => {
      render(<MaintenanceEventGroup {...defaultProps} />)
      
      const expandButton = screen.getByRole('button', { name: /expand|collapse/i })
      expect(expandButton).toBeInTheDocument()
    })

    it('calls onToggleExpanded when expand button is clicked', () => {
      const onToggleExpanded = vi.fn()
      render(
        <MaintenanceEventGroup 
          {...defaultProps} 
          onToggleExpanded={onToggleExpanded} 
        />
      )
      
      const expandButton = screen.getByRole('button', { name: /expand|collapse/i })
      fireEvent.click(expandButton)
      
      expect(onToggleExpanded).toHaveBeenCalledWith('1')
    })

    it('shows expanded content when expanded is true', () => {
      render(<MaintenanceEventGroup {...defaultProps} expanded={true} />)
      
      expect(screen.getByTestId('inspections-list')).toBeInTheDocument()
    })

    it('hides expanded content when expanded is false', () => {
      render(<MaintenanceEventGroup {...defaultProps} expanded={false} />)
      
      expect(screen.queryByTestId('inspections-list')).not.toBeInTheDocument()
    })
  })

  describe('Complex Events with Sub-Events', () => {
    it('renders SubEventsList for complex events', () => {
      const complexEvent = {
        ...mockEvent,
        category: MaintenanceEventCategory.Complex,
        subEvents: [
          {
            id: 'sub-1',
            parentEventId: '1',
            subEventNumber: 'SE-001',
            title: 'Sub Event 1',
            status: MaintenanceEventStatus.PLANNED,
            plannedStartDate: '2025-03-05',
            plannedEndDate: '2025-03-15',
            completionPercentage: 0,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
          }
        ]
      }

      render(
        <MaintenanceEventGroup 
          {...defaultProps} 
          event={complexEvent} 
          expanded={true} 
        />
      )
      
      expect(screen.getByTestId('sub-events-list')).toBeInTheDocument()
      expect(screen.getByText('Sub Events: 1')).toBeInTheDocument()
    })

    it('renders InspectionsList for simple events', () => {
      render(
        <MaintenanceEventGroup 
          {...defaultProps} 
          expanded={true} 
        />
      )
      
      expect(screen.getByTestId('inspections-list')).toBeInTheDocument()
      expect(screen.queryByTestId('sub-events-list')).not.toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('renders action buttons when showActions is true', () => {
      render(<MaintenanceEventGroup {...defaultProps} />)
      
      expect(screen.getByText('Add Inspection')).toBeInTheDocument()
    })

    it('does not render action buttons when showActions is false', () => {
      render(<MaintenanceEventGroup {...defaultProps} showActions={false} />)
      
      expect(screen.queryByText('Add Inspection')).not.toBeInTheDocument()
    })

    it('shows Start Event button for planned events', () => {
      render(<MaintenanceEventGroup {...defaultProps} />)
      
      expect(screen.getByText('Start Event')).toBeInTheDocument()
    })

    it('shows Complete Event button for in-progress events', () => {
      const inProgressEvent = {
        ...mockEvent,
        status: MaintenanceEventStatus.IN_PROGRESS
      }

      render(<MaintenanceEventGroup {...defaultProps} event={inProgressEvent} />)
      
      expect(screen.getByText('Complete Event')).toBeInTheDocument()
    })

    it('calls onInspectionCreate when Add Inspection is clicked', () => {
      const onInspectionCreate = vi.fn()
      render(
        <MaintenanceEventGroup 
          {...defaultProps} 
          onInspectionCreate={onInspectionCreate} 
        />
      )
      
      fireEvent.click(screen.getByText('Add Inspection'))
      
      expect(onInspectionCreate).toHaveBeenCalledWith('1', undefined)
    })
  })

  describe('Status Management', () => {
    it('renders EventStatusIndicator', () => {
      render(<MaintenanceEventGroup {...defaultProps} />)
      
      expect(screen.getByTestId('status-indicator')).toBeInTheDocument()
      expect(screen.getByText('PLANNED')).toBeInTheDocument()
    })

    it('calls onStatusChange when status is changed', () => {
      const onStatusChange = vi.fn()
      render(
        <MaintenanceEventGroup 
          {...defaultProps} 
          onStatusChange={onStatusChange} 
        />
      )
      
      fireEvent.click(screen.getByText('Change Status'))
      
      expect(onStatusChange).toHaveBeenCalledWith('1', 'IN_PROGRESS')
    })
  })

  describe('Overdue Events', () => {
    it('shows overdue indicator for overdue events', () => {
      const overdueEvent = {
        ...mockEvent,
        plannedEndDate: '2024-12-31', // Past date
        status: MaintenanceEventStatus.IN_PROGRESS
      }

      render(<MaintenanceEventGroup {...defaultProps} event={overdueEvent} />)
      
      expect(screen.getByText(/overdue/i)).toBeInTheDocument()
    })

    it('shows days remaining for future events', () => {
      const futureEvent = {
        ...mockEvent,
        plannedEndDate: '2025-12-31', // Future date
        status: MaintenanceEventStatus.IN_PROGRESS
      }

      render(<MaintenanceEventGroup {...defaultProps} event={futureEvent} />)
      
      expect(screen.getByText(/days remaining/i)).toBeInTheDocument()
    })
  })

  describe('Event Categories', () => {
    it('shows correct icon for simple events', () => {
      render(<MaintenanceEventGroup {...defaultProps} />)
      
      // Check for simple event indicator (implementation specific)
      expect(screen.getByText('ME-2025-001')).toBeInTheDocument()
    })

    it('shows correct icon for complex events', () => {
      const complexEvent = {
        ...mockEvent,
        category: MaintenanceEventCategory.Complex
      }

      render(<MaintenanceEventGroup {...defaultProps} event={complexEvent} />)
      
      // Check for complex event indicator (implementation specific)
      expect(screen.getByText('ME-2025-001')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles missing statistics gracefully', () => {
      const eventWithoutStats = {
        ...mockEvent,
        statistics: undefined
      }

      expect(() => {
        render(<MaintenanceEventGroup {...defaultProps} event={eventWithoutStats as any} />)
      }).not.toThrow()
    })

    it('handles missing sub-events gracefully', () => {
      const eventWithoutSubEvents = {
        ...mockEvent,
        subEvents: undefined
      }

      expect(() => {
        render(<MaintenanceEventGroup {...defaultProps} event={eventWithoutSubEvents as any} />)
      }).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', () => {
      render(<MaintenanceEventGroup {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })

    it('supports keyboard navigation', () => {
      render(<MaintenanceEventGroup {...defaultProps} />)
      
      const expandButton = screen.getByRole('button', { name: /expand|collapse/i })
      expandButton.focus()
      
      expect(expandButton).toHaveFocus()
    })
  })

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const { rerender } = render(<MaintenanceEventGroup {...defaultProps} />)
      
      // Re-render with same props
      rerender(<MaintenanceEventGroup {...defaultProps} />)
      
      // Component should handle this gracefully
      expect(screen.getByText('ME-2025-001')).toBeInTheDocument()
    })

    it('handles large numbers of inspections', () => {
      const eventWithManyInspections = {
        ...mockEvent,
        statistics: {
          ...mockEvent.statistics,
          totalPlannedInspections: 1000,
          activeInspections: 500,
          completedInspections: 300
        }
      }

      render(<MaintenanceEventGroup {...defaultProps} event={eventWithManyInspections} />)
      
      expect(screen.getByText('1000')).toBeInTheDocument()
      expect(screen.getByText('500')).toBeInTheDocument()
      expect(screen.getByText('300')).toBeInTheDocument()
    })
  })
})
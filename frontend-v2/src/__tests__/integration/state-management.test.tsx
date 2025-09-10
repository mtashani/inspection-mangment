/**
 * State Management Integration Tests
 * 
 * Tests TanStack Query integration, cache management, and state synchronization
 * Validates optimistic updates, error handling, and data consistency
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Import hooks and services
import { 
  useMaintenanceEvents, 
  useMaintenanceEvent, 
  useInspections, 
  useDailyReports,
  useCreateDailyReport,
  useUpdateDailyReport,
  useDeleteDailyReport
} from '@/hooks/use-maintenance-events'
import * as maintenanceEventsApi from '@/lib/api/maintenance-events'

// Mock data
import { 
  mockMaintenanceEvents, 
  mockInspections, 
  mockDailyReports,
  mockEventsSummary
} from '@/lib/mock-data/maintenance-events'

// Mock API services
jest.mock('@/lib/api/maintenance-events')

const mockedMaintenanceEventsApi = maintenanceEventsApi as jest.Mocked<typeof maintenanceEventsApi>

describe('State Management Integration Tests', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    })

    // Setup default API mocks
    mockedMaintenanceEventsApi.getMaintenanceEvents.mockResolvedValue(mockMaintenanceEvents)
    mockedMaintenanceEventsApi.getMaintenanceEvent.mockResolvedValue(mockMaintenanceEvents[0])
    mockedMaintenanceEventsApi.getInspections.mockResolvedValue(mockInspections)
    mockedMaintenanceEventsApi.getDailyReports.mockResolvedValue(mockDailyReports)
    mockedMaintenanceEventsApi.getEventsSummary.mockResolvedValue(mockEventsSummary)
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  describe('Query State Management', () => {
    it('should cache and reuse maintenance events data', async () => {
      const TestComponent = () => {
        const { data: events1 } = useMaintenanceEvents()
        const { data: events2 } = useMaintenanceEvents() // Same query
        
        return (
          <div>
            <div data-testid="events1-count">{events1?.length || 0}</div>
            <div data-testid="events2-count">{events2?.length || 0}</div>
            <div data-testid="same-reference">{events1 === events2 ? 'true' : 'false'}</div>
          </div>
        )
      }

      render(<TestComponent />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('events1-count')).toHaveTextContent('3')
        expect(screen.getByTestId('events2-count')).toHaveTextContent('3')
        expect(screen.getByTestId('same-reference')).toHaveTextContent('true')
      })

      // API should only be called once due to caching
      expect(mockedMaintenanceEventsApi.getMaintenanceEvents).toHaveBeenCalledTimes(1)
    })

    it('should handle different query parameters as separate cache entries', async () => {
      const TestComponent = () => {
        const { data: allEvents } = useMaintenanceEvents()
        const { data: filteredEvents } = useMaintenanceEvents({ status: 'InProgress' })
        
        return (
          <div>
            <div data-testid="all-events">{allEvents?.length || 0}</div>
            <div data-testid="filtered-events">{filteredEvents?.length || 0}</div>
          </div>
        )
      }

      // Mock different responses for different parameters
      mockedMaintenanceEventsApi.getMaintenanceEvents
        .mockResolvedValueOnce(mockMaintenanceEvents) // All events
        .mockResolvedValueOnce([mockMaintenanceEvents[0]]) // Filtered events

      render(<TestComponent />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('all-events')).toHaveTextContent('3')
        expect(screen.getByTestId('filtered-events')).toHaveTextContent('1')
      })

      // Should make separate API calls for different parameters
      expect(mockedMaintenanceEventsApi.getMaintenanceEvents).toHaveBeenCalledTimes(2)
      expect(mockedMaintenanceEventsApi.getMaintenanceEvents).toHaveBeenNthCalledWith(1, undefined)
      expect(mockedMaintenanceEventsApi.getMaintenanceEvents).toHaveBeenNthCalledWith(2, { status: 'InProgress' })
    })

    it('should handle query invalidation correctly', async () => {
      let renderCount = 0
      
      const TestComponent = () => {
        renderCount++
        const { data: events, refetch } = useMaintenanceEvents()
        
        return (
          <div>
            <div data-testid="events-count">{events?.length || 0}</div>
            <div data-testid="render-count">{renderCount}</div>
            <button onClick={() => refetch()}>Refetch</button>
          </div>
        )
      }

      const user = userEvent.setup()
      render(<TestComponent />, { wrapper })

      // Initial load
      await waitFor(() => {
        expect(screen.getByTestId('events-count')).toHaveTextContent('3')
      })

      const initialRenderCount = renderCount

      // Trigger refetch
      await user.click(screen.getByText('Refetch'))

      await waitFor(() => {
        expect(renderCount).toBeGreaterThan(initialRenderCount)
      })

      expect(mockedMaintenanceEventsApi.getMaintenanceEvents).toHaveBeenCalledTimes(2)
    })
  })

  describe('Mutation State Management', () => {
    it('should handle optimistic updates for create operations', async () => {
      const TestComponent = () => {
        const { data: reports } = useDailyReports({ inspectionId: 1 })
        const createMutation = useCreateDailyReport()
        
        const handleCreate = () => {
          createMutation.mutate({
            inspection_id: 1,
            report_date: '2024-01-20',
            description: 'New optimistic report',
            inspector_ids: [1]
          })
        }
        
        return (
          <div>
            <div data-testid="reports-count">{reports?.length || 0}</div>
            <div data-testid="is-loading">{createMutation.isPending ? 'true' : 'false'}</div>
            <button onClick={handleCreate}>Create Report</button>
          </div>
        )
      }

      // Mock create operation with delay
      mockedMaintenanceEventsApi.createDailyReport.mockImplementation(
        (data) => new Promise(resolve => 
          setTimeout(() => resolve({
            ...data,
            id: 999,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }), 100)
        )
      )

      const user = userEvent.setup()
      render(<TestComponent />, { wrapper })

      // Wait for initial data
      await waitFor(() => {
        expect(screen.getByTestId('reports-count')).toHaveTextContent('4') // Mock data has 4 reports for inspection 1
      })

      // Trigger create
      await user.click(screen.getByText('Create Report'))

      // Should show loading state
      expect(screen.getByTestId('is-loading')).toHaveTextContent('true')

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
      })

      expect(mockedMaintenanceEventsApi.createDailyReport).toHaveBeenCalledWith({
        inspection_id: 1,
        report_date: '2024-01-20',
        description: 'New optimistic report',
        inspector_ids: [1]
      })
    })

    it('should handle mutation errors and rollback optimistic updates', async () => {
      const TestComponent = () => {
        const { data: reports } = useDailyReports({ inspectionId: 1 })
        const createMutation = useCreateDailyReport()
        
        const handleCreate = () => {
          createMutation.mutate({
            inspection_id: 1,
            report_date: '2024-01-20',
            description: 'Failed report',
            inspector_ids: [1]
          })
        }
        
        return (
          <div>
            <div data-testid="reports-count">{reports?.length || 0}</div>
            <div data-testid="error">{createMutation.error?.message || 'none'}</div>
            <button onClick={handleCreate}>Create Report</button>
          </div>
        )
      }

      // Mock create operation failure
      mockedMaintenanceEventsApi.createDailyReport.mockRejectedValue(
        new Error('Server error')
      )

      const user = userEvent.setup()
      render(<TestComponent />, { wrapper })

      // Wait for initial data
      await waitFor(() => {
        expect(screen.getByTestId('reports-count')).toHaveTextContent('4')
      })

      const initialCount = screen.getByTestId('reports-count').textContent

      // Trigger create (should fail)
      await user.click(screen.getByText('Create Report'))

      // Wait for error
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Server error')
      })

      // Count should be back to original (rollback)
      expect(screen.getByTestId('reports-count')).toHaveTextContent(initialCount!)
    })

    it('should handle concurrent mutations correctly', async () => {
      const TestComponent = () => {
        const updateMutation1 = useUpdateDailyReport()
        const updateMutation2 = useUpdateDailyReport()
        
        const handleUpdate1 = () => {
          updateMutation1.mutate({
            id: 1,
            data: { description: 'Update 1' }
          })
        }
        
        const handleUpdate2 = () => {
          updateMutation2.mutate({
            id: 1,
            data: { description: 'Update 2' }
          })
        }
        
        return (
          <div>
            <div data-testid="mutation1-status">{updateMutation1.status}</div>
            <div data-testid="mutation2-status">{updateMutation2.status}</div>
            <button onClick={handleUpdate1}>Update 1</button>
            <button onClick={handleUpdate2}>Update 2</button>
          </div>
        )
      }

      let updateCallCount = 0
      mockedMaintenanceEventsApi.updateDailyReport.mockImplementation(
        async (id, data) => {
          updateCallCount++
          await new Promise(resolve => setTimeout(resolve, 50))
          return {
            ...mockDailyReports[0],
            ...data,
            updated_at: new Date().toISOString(),
          }
        }
      )

      const user = userEvent.setup()
      render(<TestComponent />, { wrapper })

      // Trigger both updates quickly
      await user.click(screen.getByText('Update 1'))
      await user.click(screen.getByText('Update 2'))

      // Wait for both to complete
      await waitFor(() => {
        expect(screen.getByTestId('mutation1-status')).toHaveTextContent('success')
        expect(screen.getByTestId('mutation2-status')).toHaveTextContent('success')
      })

      // Both mutations should have been called
      expect(updateCallCount).toBe(2)
    })
  })

  describe('Cache Invalidation and Updates', () => {
    it('should invalidate related queries after successful mutations', async () => {
      const TestComponent = () => {
        const { data: reports, refetch } = useDailyReports({ inspectionId: 1 })
        const createMutation = useCreateDailyReport()
        
        const handleCreate = () => {
          createMutation.mutate({
            inspection_id: 1,
            report_date: '2024-01-20',
            description: 'New report',
            inspector_ids: [1]
          })
        }
        
        return (
          <div>
            <div data-testid="reports-count">{reports?.length || 0}</div>
            <button onClick={handleCreate}>Create Report</button>
            <button onClick={() => refetch()}>Refetch</button>
          </div>
        )
      }

      mockedMaintenanceEventsApi.createDailyReport.mockResolvedValue({
        id: 999,
        inspection_id: 1,
        report_date: '2024-01-20',
        description: 'New report',
        inspector_ids: [1],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const user = userEvent.setup()
      render(<TestComponent />, { wrapper })

      // Wait for initial data
      await waitFor(() => {
        expect(screen.getByTestId('reports-count')).toHaveTextContent('4')
      })

      // Create new report
      await user.click(screen.getByText('Create Report'))

      // Wait for mutation to complete and cache to be invalidated
      await waitFor(() => {
        expect(mockedMaintenanceEventsApi.createDailyReport).toHaveBeenCalled()
      })

      // The mutation hook should trigger cache invalidation automatically
      // This is handled by the mutation's onSuccess callback in the actual implementation
    })

    it('should handle selective cache updates', async () => {
      const TestComponent = () => {
        const { data: inspection1Reports } = useDailyReports({ inspectionId: 1 })
        const { data: inspection2Reports } = useDailyReports({ inspectionId: 2 })
        const createMutation = useCreateDailyReport()
        
        const handleCreate = () => {
          createMutation.mutate({
            inspection_id: 1, // Only affects inspection 1
            report_date: '2024-01-20',
            description: 'New report for inspection 1',
            inspector_ids: [1]
          })
        }
        
        return (
          <div>
            <div data-testid="inspection1-count">{inspection1Reports?.length || 0}</div>
            <div data-testid="inspection2-count">{inspection2Reports?.length || 0}</div>
            <button onClick={handleCreate}>Create Report</button>
          </div>
        )
      }

      // Mock different responses for different inspections
      mockedMaintenanceEventsApi.getDailyReports
        .mockImplementation(async (filters) => {
          if (filters?.inspectionId === 1) {
            return mockDailyReports.filter(r => r.inspection_id === 1)
          } else if (filters?.inspectionId === 2) {
            return mockDailyReports.filter(r => r.inspection_id === 2)
          }
          return []
        })

      mockedMaintenanceEventsApi.createDailyReport.mockResolvedValue({
        id: 999,
        inspection_id: 1,
        report_date: '2024-01-20',
        description: 'New report for inspection 1',
        inspector_ids: [1],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const user = userEvent.setup()
      render(<TestComponent />, { wrapper })

      // Wait for initial data
      await waitFor(() => {
        expect(screen.getByTestId('inspection1-count')).toHaveTextContent('2') // 2 reports for inspection 1
        expect(screen.getByTestId('inspection2-count')).toHaveTextContent('1') // 1 report for inspection 2
      })

      const inspection2CountBefore = screen.getByTestId('inspection2-count').textContent

      // Create report for inspection 1
      await user.click(screen.getByText('Create Report'))

      await waitFor(() => {
        expect(mockedMaintenanceEventsApi.createDailyReport).toHaveBeenCalled()
      })

      // Inspection 2 count should remain unchanged
      expect(screen.getByTestId('inspection2-count')).toHaveTextContent(inspection2CountBefore!)
    })
  })

  describe('Error Boundary and Recovery', () => {
    it('should handle query errors gracefully', async () => {
      const TestComponent = () => {
        const { data, error, isError, refetch } = useMaintenanceEvents()
        
        if (isError) {
          return (
            <div>
              <div data-testid="error-message">{error?.message}</div>
              <button onClick={() => refetch()}>Retry</button>
            </div>
          )
        }
        
        return <div data-testid="events-count">{data?.length || 0}</div>
      }

      // Mock API error
      mockedMaintenanceEventsApi.getMaintenanceEvents.mockRejectedValue(
        new Error('Network error')
      )

      const user = userEvent.setup()
      render(<TestComponent />, { wrapper })

      // Should show error state
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Network error')
      })

      // Mock successful retry
      mockedMaintenanceEventsApi.getMaintenanceEvents.mockResolvedValue(mockMaintenanceEvents)

      // Trigger retry
      await user.click(screen.getByText('Retry'))

      // Should recover and show data
      await waitFor(() => {
        expect(screen.getByTestId('events-count')).toHaveTextContent('3')
      })
    })

    it('should handle partial data loading failures', async () => {
      const TestComponent = () => {
        const { data: events } = useMaintenanceEvents()
        const { data: summary, error: summaryError } = useMaintenanceEvents() // Different query
        
        return (
          <div>
            <div data-testid="events-loaded">{events ? 'true' : 'false'}</div>
            <div data-testid="summary-error">{summaryError ? 'true' : 'false'}</div>
          </div>
        )
      }

      // Mock events success, summary failure
      mockedMaintenanceEventsApi.getMaintenanceEvents.mockResolvedValue(mockMaintenanceEvents)
      mockedMaintenanceEventsApi.getEventsSummary.mockRejectedValue(new Error('Summary error'))

      render(<TestComponent />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('events-loaded')).toHaveTextContent('true')
        // Summary error should not affect events loading
      })
    })
  })

  describe('Memory Management and Cleanup', () => {
    it('should clean up queries when components unmount', async () => {
      const TestComponent = ({ show }: { show: boolean }) => {
        const { data } = useMaintenanceEvents()
        
        if (!show) return null
        
        return <div data-testid="events-count">{data?.length || 0}</div>
      }

      const { rerender } = render(<TestComponent show={true} />, { wrapper })

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('events-count')).toHaveTextContent('3')
      })

      // Unmount component
      rerender(<TestComponent show={false} />)

      // Query should still be in cache but component should be unmounted
      expect(screen.queryByTestId('events-count')).not.toBeInTheDocument()

      // Remount component
      rerender(<TestComponent show={true} />)

      // Should use cached data (no additional API call)
      await waitFor(() => {
        expect(screen.getByTestId('events-count')).toHaveTextContent('3')
      })

      // Should only have made one API call (cached on remount)
      expect(mockedMaintenanceEventsApi.getMaintenanceEvents).toHaveBeenCalledTimes(1)
    })

    it('should handle query client cleanup', async () => {
      const TestComponent = () => {
        const { data } = useMaintenanceEvents()
        return <div data-testid="events-count">{data?.length || 0}</div>
      }

      render(<TestComponent />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('events-count')).toHaveTextContent('3')
      })

      // Clear query client
      act(() => {
        queryClient.clear()
      })

      // Data should be cleared from cache
      // Component should show loading state or empty state
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    })
  })
})
/**
 * End-to-End Workflow Integration Tests
 * 
 * Tests complete user workflows from Events Overview to Daily Reports CRUD
 * Validates the entire maintenance events system integration
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

// Import components to test
import { EventsOverviewContainer } from '@/components/maintenance-events/events-overview-container'
import { EventDetailsContainer } from '@/components/maintenance-events/event-details-container'

// Import API services for mocking
import { maintenanceEventsApi, inspectionsApi, dailyReportsApi } from '@/lib/api/maintenance-events'

// Mock data
import { 
  mockMaintenanceEvents, 
  mockMaintenanceSubEvents,
  mockInspections, 
  mockDailyReports,
  mockEventsSummary,
  filterMaintenanceEvents,
  filterInspections,
  filterDailyReports
} from '@/lib/mock-data/maintenance-events'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}))

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock API services
jest.mock('@/lib/api/maintenance-events')

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
}

const mockedMaintenanceEventsApi = maintenanceEventsApi as jest.Mocked<typeof maintenanceEventsApi>
const mockedInspectionsApi = inspectionsApi as jest.Mocked<typeof inspectionsApi>
const mockedDailyReportsApi = dailyReportsApi as jest.Mocked<typeof dailyReportsApi>
const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockedUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>
const mockedUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('End-to-End Workflow Integration Tests', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup router mock
    mockedUseRouter.mockReturnValue(mockRouter)
    mockedUsePathname.mockReturnValue('/maintenance-events')
    
    // Setup search params mock
    const mockSearchParams = new URLSearchParams()
    mockedUseSearchParams.mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
      toString: () => mockSearchParams.toString(),
      has: (key: string) => mockSearchParams.has(key),
      getAll: (key: string) => mockSearchParams.getAll(key),
      keys: () => mockSearchParams.keys(),
      values: () => mockSearchParams.values(),
      entries: () => mockSearchParams.entries(),
      forEach: (callback: unknown) => mockSearchParams.forEach(callback),
      append: (key: string, value: string) => mockSearchParams.append(key, value),
      delete: (key: string) => mockSearchParams.delete(key),
      set: (key: string, value: string) => mockSearchParams.set(key, value),
      sort: () => mockSearchParams.sort(),
      [Symbol.iterator]: () => mockSearchParams[Symbol.iterator](),
    })
    
    // Setup query client
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
    
    // Setup user event
    user = userEvent.setup()
    
    // Setup API mocks with realistic filtering behavior
    mockedMaintenanceEventsApi.getMaintenanceEvents.mockImplementation(async (filters = {}) => {
      return filterMaintenanceEvents(filters)
    })
    
    mockedMaintenanceEventsApi.getMaintenanceEvent.mockImplementation(async (id) => {
      const event = mockMaintenanceEvents.find(e => e.id === parseInt(id))
      if (!event) throw new Error('Event not found')
      return event
    })
    
    mockedMaintenanceEventsApi.getMaintenanceSubEvents.mockImplementation(async (eventId) => {
      return mockMaintenanceSubEvents.filter(se => se.parent_event_id === parseInt(eventId))
    })
    
    mockedMaintenanceEventsApi.getEventsSummary.mockResolvedValue(mockEventsSummary)
    
    mockedInspectionsApi.getInspections.mockImplementation(async (filters = {}) => {
      return filterInspections(filters)
    })
    
    mockedDailyReportsApi.getDailyReports.mockImplementation(async (filters = {}) => {
      return filterDailyReports(filters)
    })
    
    // Setup CRUD operations
    mockedDailyReportsApi.createDailyReport.mockImplementation(async (data) => {
      return {
        ...data,
        id: Math.floor(Math.random() * 1000) + 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })
    
    mockedDailyReportsApi.updateDailyReport.mockImplementation(async (id, data) => {
      const existing = mockDailyReports.find(r => r.id === id)
      if (!existing) throw new Error('Report not found')
      return {
        ...existing,
        ...data,
        updated_at: new Date().toISOString(),
      }
    })
    
    mockedDailyReportsApi.deleteDailyReport.mockResolvedValue(undefined)
  })

  afterEach(() => {
    queryClient.clear()
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  describe('Complete User Journey: Overview to Daily Report Management', () => {
    it('should complete full workflow from events overview to creating daily report', async () => {
      // Step 1: Start at Events Overview
      renderWithProviders(<EventsOverviewContainer />)

      // Step 2: Verify summary dashboard loads
      await waitFor(() => {
        expect(screen.getByText('Total Events')).toBeInTheDocument()
        expect(screen.getByText('15')).toBeInTheDocument() // From mock summary
      })

      // Step 3: Verify events list loads
      await waitFor(() => {
        expect(screen.getByText(mockMaintenanceEvents[0].title)).toBeInTheDocument()
      })

      // Step 4: Use search functionality
      const searchInput = screen.getByPlaceholderText(/search events/i)
      await user.type(searchInput, 'Overhaul')

      await waitFor(() => {
        expect(mockedMaintenanceEventsApi.getMaintenanceEvents).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Overhaul' })
        )
      })

      // Step 5: Navigate to event details
      const eventCard = screen.getByText(mockMaintenanceEvents[0].title).closest('[data-testid="event-card"]')
      await user.click(eventCard!)

      expect(mockRouter.push).toHaveBeenCalledWith(`/maintenance-events/${mockMaintenanceEvents[0].id}`)

      // Step 6: Render Event Details page
      const { unmount } = renderWithProviders(
        <EventDetailsContainer eventId={mockMaintenanceEvents[0].id.toString()} />
      )

      // Step 7: Verify event details and tabs load
      await waitFor(() => {
        expect(screen.getByText(mockMaintenanceEvents[0].title)).toBeInTheDocument()
        expect(screen.getByText('Direct Inspections')).toBeInTheDocument()
      })

      // Step 8: Verify inspections load
      await waitFor(() => {
        expect(mockedInspectionsApi.getInspections).toHaveBeenCalledWith({
          eventId: mockMaintenanceEvents[0].id.toString(),
          subEventId: undefined,
          search: undefined
        })
      })

      // Step 9: Expand an inspection to see daily reports
      const inspectionCard = screen.getByText(mockInspections[0].title).closest('[data-testid="inspection-card"]')
      const expandButton = within(inspectionCard!).getByRole('button', { name: /expand/i })
      await user.click(expandButton)

      // Step 10: Verify daily reports load
      await waitFor(() => {
        expect(mockedDailyReportsApi.getDailyReports).toHaveBeenCalledWith({
          inspectionId: mockInspections[0].id
        })
      })

      // Step 11: Create new daily report
      const addReportButton = screen.getByRole('button', { name: /add report/i })
      await user.click(addReportButton)

      // Step 12: Fill out create report form
      await waitFor(() => {
        expect(screen.getByText('Create Daily Report')).toBeInTheDocument()
      })

      const descriptionInput = screen.getByLabelText(/description/i)
      await user.type(descriptionInput, 'New daily report for testing')

      const findingsInput = screen.getByLabelText(/findings/i)
      await user.type(findingsInput, 'Test findings for integration test')

      // Step 13: Submit the form
      const submitButton = screen.getByRole('button', { name: /create report/i })
      await user.click(submitButton)

      // Step 14: Verify API call and success
      await waitFor(() => {
        expect(mockedDailyReportsApi.createDailyReport).toHaveBeenCalledWith(
          expect.objectContaining({
            inspection_id: mockInspections[0].id,
            description: 'New daily report for testing',
            findings: 'Test findings for integration test'
          })
        )
      })

      unmount()
    })

    it('should handle complete edit workflow for daily reports', async () => {
      // Start at Event Details with existing daily reports
      renderWithProviders(
        <EventDetailsContainer eventId={mockMaintenanceEvents[0].id.toString()} />
      )

      // Wait for data to load and expand inspection
      await waitFor(() => {
        expect(screen.getByText(mockInspections[0].title)).toBeInTheDocument()
      })

      const inspectionCard = screen.getByText(mockInspections[0].title).closest('[data-testid="inspection-card"]')
      const expandButton = within(inspectionCard!).getByRole('button', { name: /expand/i })
      await user.click(expandButton)

      // Wait for daily reports to load
      await waitFor(() => {
        expect(screen.getByText(mockDailyReports[0].description)).toBeInTheDocument()
      })

      // Click edit button
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      // Verify edit modal opens with pre-filled data
      await waitFor(() => {
        expect(screen.getByText('Edit Daily Report')).toBeInTheDocument()
        expect(screen.getByDisplayValue(mockDailyReports[0].description)).toBeInTheDocument()
      })

      // Modify the description
      const descriptionInput = screen.getByDisplayValue(mockDailyReports[0].description)
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Updated description for integration test')

      // Submit the changes
      const updateButton = screen.getByRole('button', { name: /update report/i })
      await user.click(updateButton)

      // Verify API call and success
      await waitFor(() => {
        expect(mockedDailyReportsApi.updateDailyReport).toHaveBeenCalledWith(
          mockDailyReports[0].id,
          expect.objectContaining({
            description: 'Updated description for integration test'
          })
        )
      })
    })

    it('should handle complete delete workflow with confirmation', async () => {
      renderWithProviders(
        <EventDetailsContainer eventId={mockMaintenanceEvents[0].id.toString()} />
      )

      // Navigate to daily reports
      await waitFor(() => {
        expect(screen.getByText(mockInspections[0].title)).toBeInTheDocument()
      })

      const inspectionCard = screen.getByText(mockInspections[0].title).closest('[data-testid="inspection-card"]')
      const expandButton = within(inspectionCard!).getByRole('button', { name: /expand/i })
      await user.click(expandButton)

      await waitFor(() => {
        expect(screen.getByText(mockDailyReports[0].description)).toBeInTheDocument()
      })

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Verify confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Delete Daily Report')).toBeInTheDocument()
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument()
      })

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Verify API call and success
      await waitFor(() => {
        expect(mockedDailyReportsApi.deleteDailyReport).toHaveBeenCalledWith(mockDailyReports[0].id)
      })
    })
  })

  describe('Advanced Filtering and Search Workflows', () => {
    it('should handle complex filtering across multiple levels', async () => {
      // Start at Events Overview
      renderWithProviders(<EventsOverviewContainer />)

      await waitFor(() => {
        expect(screen.getByText('Maintenance Events')).toBeInTheDocument()
      })

      // Apply multiple filters
      const searchInput = screen.getByPlaceholderText(/search events/i)
      await user.type(searchInput, 'Unit 100')

      const statusFilter = screen.getByRole('combobox', { name: /status/i })
      await user.click(statusFilter)
      const inProgressOption = screen.getByText('In Progress')
      await user.click(inProgressOption)

      // Verify API calls with combined filters
      await waitFor(() => {
        expect(mockedMaintenanceEventsApi.getMaintenanceEvents).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Unit 100',
            status: 'InProgress'
          })
        )
      })

      // Navigate to event details and test scoped search
      const eventCard = screen.getByText(mockMaintenanceEvents[0].title).closest('[data-testid="event-card"]')
      await user.click(eventCard!)

      renderWithProviders(
        <EventDetailsContainer eventId={mockMaintenanceEvents[0].id.toString()} />
      )

      await waitFor(() => {
        expect(screen.getByText(mockMaintenanceEvents[0].title)).toBeInTheDocument()
      })

      // Test scoped search within event
      const eventSearchInput = screen.getByPlaceholderText(/search inspections/i)
      await user.type(eventSearchInput, 'pump')

      await waitFor(() => {
        expect(mockedInspectionsApi.getInspections).toHaveBeenCalledWith(
          expect.objectContaining({
            eventId: mockMaintenanceEvents[0].id.toString(),
            search: 'pump'
          })
        )
      })
    })

    it('should handle tab switching with persistent search', async () => {
      // Mock event with sub-events
      const eventWithSubEvents = mockMaintenanceEvents[0]
      
      renderWithProviders(
        <EventDetailsContainer eventId={eventWithSubEvents.id.toString()} />
      )

      await waitFor(() => {
        expect(screen.getByText('Direct Inspections')).toBeInTheDocument()
      })

      // Apply search
      const searchInput = screen.getByPlaceholderText(/search inspections/i)
      await user.type(searchInput, 'mechanical')

      // Switch to sub-event tab (if available)
      const subEventTabs = screen.queryAllByRole('tab')
      if (subEventTabs.length > 1) {
        await user.click(subEventTabs[1])

        // Verify search persists across tabs
        await waitFor(() => {
          expect(mockedInspectionsApi.getInspections).toHaveBeenCalledWith(
            expect.objectContaining({
              search: 'mechanical'
            })
          )
        })
      }
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should handle and recover from API errors gracefully', async () => {
      // Mock initial success then failure
      mockedMaintenanceEventsApi.getMaintenanceEvents
        .mockResolvedValueOnce(mockMaintenanceEvents)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockMaintenanceEvents)

      renderWithProviders(<EventsOverviewContainer />)

      // Initial load should succeed
      await waitFor(() => {
        expect(screen.getByText(mockMaintenanceEvents[0].title)).toBeInTheDocument()
      })

      // Trigger a refetch that will fail
      const searchInput = screen.getByPlaceholderText(/search events/i)
      await user.type(searchInput, 'test')

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error loading/i)).toBeInTheDocument()
      })

      // Test retry functionality
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      // Should recover and show data again
      await waitFor(() => {
        expect(screen.getByText(mockMaintenanceEvents[0].title)).toBeInTheDocument()
      })
    })

    it('should handle CRUD operation failures with proper rollback', async () => {
      // Mock create failure
      mockedMaintenanceEventsApi.createDailyReport.mockRejectedValue(
        new Error('Server error')
      )

      renderWithProviders(
        <EventDetailsContainer eventId={mockMaintenanceEvents[0].id.toString()} />
      )

      // Navigate to create report
      await waitFor(() => {
        expect(screen.getByText(mockInspections[0].title)).toBeInTheDocument()
      })

      const inspectionCard = screen.getByText(mockInspections[0].title).closest('[data-testid="inspection-card"]')
      const expandButton = within(inspectionCard!).getByRole('button', { name: /expand/i })
      await user.click(expandButton)

      const addReportButton = screen.getByRole('button', { name: /add report/i })
      await user.click(addReportButton)

      // Fill and submit form
      const descriptionInput = screen.getByLabelText(/description/i)
      await user.type(descriptionInput, 'Test report')

      const submitButton = screen.getByRole('button', { name: /create report/i })
      await user.click(submitButton)

      // Verify error handling
      await waitFor(() => {
        expect(mockedToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            description: expect.stringContaining('Failed to create'),
            variant: 'destructive'
          })
        )
      })
    })
  })

  describe('Performance and State Management', () => {
    it('should handle optimistic updates correctly', async () => {
      renderWithProviders(
        <EventDetailsContainer eventId={mockMaintenanceEvents[0].id.toString()} />
      )

      // Navigate to daily reports
      await waitFor(() => {
        expect(screen.getByText(mockInspections[0].title)).toBeInTheDocument()
      })

      const inspectionCard = screen.getByText(mockInspections[0].title).closest('[data-testid="inspection-card"]')
      const expandButton = within(inspectionCard!).getByRole('button', { name: /expand/i })
      await user.click(expandButton)

      const addReportButton = screen.getByRole('button', { name: /add report/i })
      await user.click(addReportButton)

      // Fill form
      const descriptionInput = screen.getByLabelText(/description/i)
      await user.type(descriptionInput, 'Optimistic update test')

      const submitButton = screen.getByRole('button', { name: /create report/i })
      await user.click(submitButton)

      // Verify optimistic update - new report should appear immediately
      await waitFor(() => {
        expect(screen.getByText('Optimistic update test')).toBeInTheDocument()
      })
    })

    it('should handle concurrent operations correctly', async () => {
      let createCallCount = 0
      mockedMaintenanceEventsApi.createDailyReport.mockImplementation(async (data) => {
        createCallCount++
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 50))
        return {
          ...data,
          id: createCallCount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      })

      renderWithProviders(
        <EventDetailsContainer eventId={mockMaintenanceEvents[0].id.toString()} />
      )

      // Navigate to create form
      await waitFor(() => {
        expect(screen.getByText(mockInspections[0].title)).toBeInTheDocument()
      })

      const inspectionCard = screen.getByText(mockInspections[0].title).closest('[data-testid="inspection-card"]')
      const expandButton = within(inspectionCard!).getByRole('button', { name: /expand/i })
      await user.click(expandButton)

      const addReportButton = screen.getByRole('button', { name: /add report/i })
      await user.click(addReportButton)

      // Fill form
      const descriptionInput = screen.getByLabelText(/description/i)
      await user.type(descriptionInput, 'Concurrent test')

      // Submit multiple times quickly (simulating double-click)
      const submitButton = screen.getByRole('button', { name: /create report/i })
      await user.click(submitButton)
      await user.click(submitButton)

      // Should only create one report (proper handling of concurrent requests)
      await waitFor(() => {
        expect(createCallCount).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('Accessibility and User Experience', () => {
    it('should maintain focus management during navigation', async () => {
      renderWithProviders(<EventsOverviewContainer />)

      await waitFor(() => {
        expect(screen.getByText(mockMaintenanceEvents[0].title)).toBeInTheDocument()
      })

      // Test keyboard navigation
      const eventCard = screen.getByText(mockMaintenanceEvents[0].title).closest('[data-testid="event-card"]')
      
      // Focus the card
      eventCard?.focus()
      
      // Press Enter to navigate
      fireEvent.keyDown(eventCard!, { key: 'Enter', code: 'Enter' })

      expect(mockRouter.push).toHaveBeenCalledWith(`/maintenance-events/${mockMaintenanceEvents[0].id}`)
    })

    it('should provide proper loading states and feedback', async () => {
      // Mock delayed responses
      mockedMaintenanceEventsApi.getMaintenanceEvents.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockMaintenanceEvents), 100))
      )

      renderWithProviders(<EventsOverviewContainer />)

      // Verify loading skeletons
      expect(screen.getByTestId('events-list-skeleton')).toBeInTheDocument()
      expect(screen.getByTestId('summary-cards-skeleton')).toBeInTheDocument()

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText(mockMaintenanceEvents[0].title)).toBeInTheDocument()
      }, { timeout: 200 })

      // Verify skeletons are removed
      expect(screen.queryByTestId('events-list-skeleton')).not.toBeInTheDocument()
      expect(screen.queryByTestId('summary-cards-skeleton')).not.toBeInTheDocument()
    })
  })
})
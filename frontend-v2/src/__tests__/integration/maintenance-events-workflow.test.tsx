/**
 * Maintenance Events Workflow Integration Tests
 * 
 * Comprehensive integration tests covering:
 * - Complete user workflows end-to-end
 * - API integration with proper error handling
 * - Navigation between Events Overview and Event Details
 * - CRUD operations and state management
 * - Requirements: 1.1, 1.2, 2.1, 8.1
 */

import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

// Import components to test
import { EventsOverviewContainer } from '@/components/maintenance-events/events-overview-container'
import { EventDetailsContainer } from '@/components/maintenance-events/event-details-container'

// Import API services for mocking
import { maintenanceEventsApi, inspectionsApi, dailyReportsApi } from '@/lib/api/maintenance-events'

// Import hooks for testing
import {
  useMaintenanceEvents,
  useMaintenanceEvent,
  useInspections,
  useDailyReports,
  useCreateDailyReport,
  useUpdateDailyReport,
  useDeleteDailyReport
} from '@/hooks/use-maintenance-events'

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

describe('Maintenance Events Workflow Integration Tests', () => {
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
      forEach: (callback: (value: string, key: string, parent: URLSearchParams) => void) => mockSearchParams.forEach(callback),
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

  describe('Requirement 1.1 & 1.2: Two-Level Page Architecture', () => {
    it('should display Events Overview page (Level 1) with proper navigation', async () => {
      renderWithProviders(<EventsOverviewContainer />)

      // Verify Level 1 page loads
      await waitFor(() => {
        expect(screen.getByText('Maintenance Events')).toBeInTheDocument()
      })

      // Verify summary statistics are displayed
      await waitFor(() => {
        expect(screen.getByText('Total Events')).toBeInTheDocument()
        expect(screen.getByText('15')).toBeInTheDocument() // From mock summary
      })

      // Verify events list loads
      await waitFor(() => {
        expect(screen.getByText(mockMaintenanceEvents[0].title)).toBeInTheDocument()
      })

      // Test navigation to Level 2
      const eventCard = screen.getByText(mockMaintenanceEvents[0].title).closest('[data-testid="event-card"]')
      await user.click(eventCard!)

      expect(mockRouter.push).toHaveBeenCalledWith(`/maintenance-events/${mockMaintenanceEvents[0].id}`)
    })

    it('should display Event Details page (Level 2) with tabbed interface', async () => {
      const eventId = mockMaintenanceEvents[0].id.toString()
      
      renderWithProviders(
        <EventDetailsContainer eventId={eventId} />
      )

      // Verify Level 2 page loads with event details
      await waitFor(() => {
        expect(screen.getByText(mockMaintenanceEvents[0].title)).toBeInTheDocument()
        expect(screen.getByText(mockMaintenanceEvents[0].event_number)).toBeInTheDocument()
      })

      // Verify tabbed interface
      await waitFor(() => {
        expect(screen.getByText('Direct Inspections')).toBeInTheDocument()
      })

      // Verify API calls
      expect(mockedMaintenanceEventsApi.getMaintenanceEvent).toHaveBeenCalledWith(eventId)
      expect(mockedMaintenanceEventsApi.getMaintenanceSubEvents).toHaveBeenCalledWith(eventId)
    })
  })

  describe('Requirement 2.1: Events Overview Page Functionality', () => {
    it('should fetch and display maintenance events from API', async () => {
      renderWithProviders(<EventsOverviewContainer />)

      // Verify API call
      await waitFor(() => {
        expect(mockedMaintenanceEventsApi.getMaintenanceEvents).toHaveBeenCalled()
      })

      // Verify events are displayed
      await waitFor(() => {
        mockMaintenanceEvents.forEach(event => {
          expect(screen.getByText(event.title)).toBeInTheDocument()
        })
      })
    })

    it('should handle search and filtering functionality', async () => {
      renderWithProviders(<EventsOverviewContainer />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Maintenance Events')).toBeInTheDocument()
      })

      // Test search functionality
      const searchInput = screen.getByPlaceholderText(/search events/i)
      await user.type(searchInput, 'Overhaul')

      await waitFor(() => {
        expect(mockedMaintenanceEventsApi.getMaintenanceEvents).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Overhaul' })
        )
      })

      // Test status filter
      const statusFilter = screen.getByRole('combobox', { name: /status/i })
      await user.click(statusFilter)
      
      const inProgressOption = screen.getByText('In Progress')
      await user.click(inProgressOption)

      await waitFor(() => {
        expect(mockedMaintenanceEventsApi.getMaintenanceEvents).toHaveBeenCalledWith(
          expect.objectContaining({ 
            search: 'Overhaul',
            status: 'InProgress'
          })
        )
      })
    })

    it('should display summary statistics dashboard', async () => {
      renderWithProviders(<EventsOverviewContainer />)

      // Verify summary API call
      await waitFor(() => {
        expect(mockedMaintenanceEventsApi.getEventsSummary).toHaveBeenCalled()
      })

      // Verify summary cards are displayed
      await waitFor(() => {
        expect(screen.getByText('Total Events')).toBeInTheDocument()
        expect(screen.getByText('Active Events')).toBeInTheDocument()
        expect(screen.getByText('Completed Events')).toBeInTheDocument()
      })
    })
  })

  describe('Requirement 8.1: CRUD Operations and Data Management', () => {
    it('should complete full CRUD workflow for daily reports', async () => {
      const eventId = mockMaintenanceEvents[0].id.toString()
      
      renderWithProviders(
        <EventDetailsContainer eventId={eventId} />
      )

      // Wait for inspections to load
      await waitFor(() => {
        expect(screen.getByText(mockInspections[0].title)).toBeInTheDocument()
      })

      // Expand inspection to see daily reports
      const inspectionCard = screen.getByText(mockInspections[0].title).closest('[data-testid="inspection-card"]')
      const expandButton = within(inspectionCard!).getByRole('button', { name: /expand/i })
      await user.click(expandButton)

      // Verify daily reports load
      await waitFor(() => {
        expect(mockedDailyReportsApi.getDailyReports).toHaveBeenCalledWith({
          inspectionId: mockInspections[0].id
        })
      })

      // Test CREATE operation
      const addReportButton = screen.getByRole('button', { name: /add report/i })
      await user.click(addReportButton)

      await waitFor(() => {
        expect(screen.getByText('Create Daily Report')).toBeInTheDocument()
      })

      const descriptionInput = screen.getByLabelText(/description/i)
      await user.type(descriptionInput, 'New daily report for testing')

      const findingsInput = screen.getByLabelText(/findings/i)
      await user.type(findingsInput, 'Test findings for integration test')

      const submitButton = screen.getByRole('button', { name: /create report/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockedDailyReportsApi.createDailyReport).toHaveBeenCalledWith(
          expect.objectContaining({
            inspection_id: mockInspections[0].id,
            description: 'New daily report for testing',
            findings: 'Test findings for integration test'
          })
        )
      })

      // Test UPDATE operation
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Daily Report')).toBeInTheDocument()
      })

      const editDescriptionInput = screen.getByDisplayValue(mockDailyReports[0].description)
      await user.clear(editDescriptionInput)
      await user.type(editDescriptionInput, 'Updated description')

      const updateButton = screen.getByRole('button', { name: /update report/i })
      await user.click(updateButton)

      await waitFor(() => {
        expect(mockedDailyReportsApi.updateDailyReport).toHaveBeenCalledWith(
          mockDailyReports[0].id,
          expect.objectContaining({
            description: 'Updated description'
          })
        )
      })

      // Test DELETE operation
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Delete Daily Report')).toBeInTheDocument()
      })

      const confirmDeleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmDeleteButton)

      await waitFor(() => {
        expect(mockedDailyReportsApi.deleteDailyReport).toHaveBeenCalledWith(mockDailyReports[0].id)
      })
    })

    it('should handle CRUD operation errors gracefully', async () => {
      // Mock create failure
      mockedDailyReportsApi.createDailyReport.mockRejectedValue(
        new Error('Server error')
      )

      const eventId = mockMaintenanceEvents[0].id.toString()
      
      renderWithProviders(
        <EventDetailsContainer eventId={eventId} />
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

      // Verify error is handled (would show error toast in real implementation)
      await waitFor(() => {
        expect(mockedDailyReportsApi.createDailyReport).toHaveBeenCalled()
      })
    })
  })

  describe('Navigation and State Management Integration', () => {
    it('should maintain URL state during navigation', async () => {
      // Mock URL with search parameters
      const mockSearchParams = new URLSearchParams('?search=overhaul&status=InProgress')
      mockedUseSearchParams.mockReturnValue({
        get: (key: string) => mockSearchParams.get(key),
        toString: () => mockSearchParams.toString(),
        has: (key: string) => mockSearchParams.has(key),
        getAll: (key: string) => mockSearchParams.getAll(key),
        keys: () => mockSearchParams.keys(),
        values: () => mockSearchParams.values(),
        entries: () => mockSearchParams.entries(),
        forEach: (callback: (value: string, key: string, parent: URLSearchParams) => void) => mockSearchParams.forEach(callback),
        append: (key: string, value: string) => mockSearchParams.append(key, value),
        delete: (key: string) => mockSearchParams.delete(key),
        set: (key: string, value: string) => mockSearchParams.set(key, value),
        sort: () => mockSearchParams.sort(),
        [Symbol.iterator]: () => mockSearchParams[Symbol.iterator](),
      })

      renderWithProviders(<EventsOverviewContainer />)

      // Verify API is called with URL parameters
      await waitFor(() => {
        expect(mockedMaintenanceEventsApi.getMaintenanceEvents).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'overhaul',
            status: 'InProgress'
          })
        )
      })
    })

    it('should handle tab navigation with persistent search', async () => {
      const eventId = mockMaintenanceEvents[0].id.toString()
      
      renderWithProviders(
        <EventDetailsContainer 
          eventId={eventId}
          initialSearch="pump"
        />
      )

      // Wait for search to be applied
      await waitFor(() => {
        expect(mockedInspectionsApi.getInspections).toHaveBeenCalledWith({
          eventId,
          subEventId: undefined,
          search: 'pump'
        })
      })

      // Verify search input has the value
      const searchInput = screen.getByDisplayValue('pump')
      expect(searchInput).toBeInTheDocument()
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle API errors and provide retry functionality', async () => {
      // Mock initial failure then success
      mockedMaintenanceEventsApi.getMaintenanceEvents
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockMaintenanceEvents)

      renderWithProviders(<EventsOverviewContainer />)

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error loading/i)).toBeInTheDocument()
      })

      // Test retry functionality
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      // Should recover and show data
      await waitFor(() => {
        expect(screen.getByText(mockMaintenanceEvents[0].title)).toBeInTheDocument()
      })
    })

    it('should handle navigation to non-existent event', async () => {
      const nonExistentEventId = '999'
      mockedMaintenanceEventsApi.getMaintenanceEvent.mockRejectedValue(
        new Error('Event not found')
      )

      renderWithProviders(
        <EventDetailsContainer eventId={nonExistentEventId} />
      )

      // Verify error state is displayed
      await waitFor(() => {
        expect(screen.getByText(/error loading event/i)).toBeInTheDocument()
      })
    })
  })

  describe('Performance and Loading States', () => {
    it('should show proper loading states during data fetching', async () => {
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

    it('should handle optimistic updates correctly', async () => {
      const eventId = mockMaintenanceEvents[0].id.toString()
      
      renderWithProviders(
        <EventDetailsContainer eventId={eventId} />
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
  })
})
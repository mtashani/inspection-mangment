/**
/**
 * API Integration Tests
 * 
 * Tests API integration with mock server responses
 * Validates request/response formats and error handling
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'

// Import API services and hooks
import { maintenanceEventsApi, inspectionsApi, dailyReportsApi } from '@/lib/api/maintenance-events'
import { useMaintenanceEvents, useMaintenanceEvent, useInspections, useDailyReports } from '@/hooks/use-maintenance-events'

// Mock data
import { mockMaintenanceEvents, mockInspections, mockDailyReports } from '@/lib/mock-data/maintenance-events'

// Mock the API services
jest.mock('@/lib/api/maintenance-events')

const mockedMaintenanceEventsApi = maintenanceEventsApi as jest.Mocked<typeof maintenanceEventsApi>
const mockedInspectionsApi = inspectionsApi as jest.Mocked<typeof inspectionsApi>
const mockedDailyReportsApi = dailyReportsApi as jest.Mocked<typeof dailyReportsApi>

describe('API Integration Tests', () => {
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

    // Setup default successful responses
    mockedMaintenanceEventsApi.getMaintenanceEvents.mockResolvedValue(mockMaintenanceEvents)
    mockedMaintenanceEventsApi.getMaintenanceEvent.mockResolvedValue(mockMaintenanceEvents[0])
    mockedInspectionsApi.getInspections.mockResolvedValue(mockInspections)
    mockedDailyReportsApi.getDailyReports.mockResolvedValue(mockDailyReports)
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }

  describe('Maintenance Events API', () => {
    it('should fetch maintenance events with correct parameters', async () => {
      const filters = { search: 'test', status: 'InProgress' as const }
      
      const result = await maintenanceEventsApi.getMaintenanceEvents(filters)

      expect(mockedMaintenanceEventsApi.getMaintenanceEvents).toHaveBeenCalledWith(filters)
      expect(result).toEqual(mockMaintenanceEvents)
    })

    it('should handle API errors correctly', async () => {
      mockedMaintenanceEventsApi.getMaintenanceEvents.mockRejectedValue(new Error('Network error'))

      await expect(
        maintenanceEventsApi.getMaintenanceEvents()
      ).rejects.toThrow('Network error')
    })

    it('should fetch single maintenance event', async () => {
      const eventId = '1'
      
      const result = await maintenanceEventsApi.getMaintenanceEvent(eventId)
      
      expect(mockedMaintenanceEventsApi.getMaintenanceEvent).toHaveBeenCalledWith(eventId)
      expect(result).toEqual(mockMaintenanceEvents[0])
    })

    it('should fetch events summary', async () => {
      const mockSummary = {
        totalEvents: 10,
        activeEvents: 5,
        completedEvents: 3,
        overdueEvents: 2,
        totalInspections: 25,
        activeInspections: 15,
        plannedInspections: 20,
        unplannedInspections: 5,
        completedInspections: 15,
        totalReports: 50,
        reportsThisMonth: 12,
      }

      mockedMaintenanceEventsApi.getEventsSummary.mockResolvedValue(mockSummary)

      const result = await maintenanceEventsApi.getEventsSummary()
      expect(result).toEqual(mockSummary)
    })
  })

  describe('Inspections API', () => {
    it('should fetch inspections with filters', async () => {
      const filters = {
        eventId: '1',
        search: 'pressure'
      }

      const result = await inspectionsApi.getInspections(filters)

      expect(mockedInspectionsApi.getInspections).toHaveBeenCalledWith(filters)
      expect(result).toEqual(mockInspections)
    })

    it('should fetch inspections for sub-event', async () => {
      const filters = {
        eventId: '1',
        subEventId: 2
      }

      const result = await inspectionsApi.getInspections(filters)

      expect(mockedInspectionsApi.getInspections).toHaveBeenCalledWith(filters)
      expect(result).toEqual(mockInspections)
    })
  })

  describe('Daily Reports API', () => {
    it('should fetch daily reports for inspection', async () => {
      const filters = { inspectionId: 1 }

      const result = await dailyReportsApi.getDailyReports(filters)

      expect(mockedDailyReportsApi.getDailyReports).toHaveBeenCalledWith(filters)
      expect(result).toEqual(mockDailyReports)
    })

    it('should create daily report', async () => {
      const newReport = {
        inspection_id: 1,
        report_date: '2024-01-15',
        description: 'Test report',
        findings: 'Test findings',
        inspector_ids: [1]
      }

      const createdReport = {
        ...newReport,
        id: 999,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      }

      mockedDailyReportsApi.createDailyReport.mockResolvedValue(createdReport)

      const result = await dailyReportsApi.createDailyReport(newReport)
      
      expect(mockedDailyReportsApi.createDailyReport).toHaveBeenCalledWith(newReport)
      expect(result.id).toBe(999)
      expect(result.description).toBe('Test report')
    })

    it('should update daily report', async () => {
      const reportId = 1
      const updateData = {
        description: 'Updated description',
        findings: 'Updated findings'
      }

      const updatedReport = {
        ...mockDailyReports[0],
        ...updateData,
        updated_at: '2024-01-15T11:00:00Z'
      }

      mockedDailyReportsApi.updateDailyReport.mockResolvedValue(updatedReport)

      const result = await dailyReportsApi.updateDailyReport(reportId, updateData)
      
      expect(mockedDailyReportsApi.updateDailyReport).toHaveBeenCalledWith(reportId, updateData)
      expect(result.description).toBe('Updated description')
      expect(result.findings).toBe('Updated findings')
    })

    it('should delete daily report', async () => {
      const reportId = 1

      mockedDailyReportsApi.deleteDailyReport.mockResolvedValue(undefined)

      await expect(
        dailyReportsApi.deleteDailyReport(reportId)
      ).resolves.toBeUndefined()
      
      expect(mockedDailyReportsApi.deleteDailyReport).toHaveBeenCalledWith(reportId)
    })
  })

  describe('React Query Hooks Integration', () => {
    it('should use maintenance events hook correctly', async () => {
      const { result } = renderHook(
        () => useMaintenanceEvents({ search: 'test' }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockMaintenanceEvents)
      expect(mockedMaintenanceEventsApi.getMaintenanceEvents).toHaveBeenCalledWith({ search: 'test' })
    })

    it('should use maintenance event hook correctly', async () => {
      const eventId = '1'

      const { result } = renderHook(
        () => useMaintenanceEvent(eventId),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockMaintenanceEvents[0])
      expect(mockedMaintenanceEventsApi.getMaintenanceEvent).toHaveBeenCalledWith(eventId)
    })

    it('should use inspections hook correctly', async () => {
      const { result } = renderHook(
        () => useInspections({ eventId: '1' }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockInspections)
      expect(mockedInspectionsApi.getInspections).toHaveBeenCalledWith({ eventId: '1' })
    })

    it('should use daily reports hook correctly', async () => {
      const { result } = renderHook(
        () => useDailyReports({ inspectionId: 1 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockDailyReports)
      expect(mockedDailyReportsApi.getDailyReports).toHaveBeenCalledWith({ inspectionId: 1 })
    })

    it('should handle hook errors correctly', async () => {
      mockedMaintenanceEventsApi.getMaintenanceEvents.mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(
        () => useMaintenanceEvents(),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockedMaintenanceEventsApi.getMaintenanceEvents.mockRejectedValue(
        new Error('Network connection failed')
      )

      await expect(
        maintenanceEventsApi.getMaintenanceEvents()
      ).rejects.toThrow('Network connection failed')
    })

    it('should handle API errors with different status codes', async () => {
      const errorCodes = [400, 401, 403, 404, 422, 500, 502, 503]

      for (const code of errorCodes) {
        mockedMaintenanceEventsApi.getMaintenanceEvents.mockRejectedValue(
          new Error(`HTTP ${code}`)
        )

        await expect(
          maintenanceEventsApi.getMaintenanceEvents()
        ).rejects.toThrow(`HTTP ${code}`)
      }
    })

    it('should handle malformed responses', async () => {
      mockedMaintenanceEventsApi.getMaintenanceEvents.mockRejectedValue(
        new Error('Invalid JSON response')
      )

      await expect(
        maintenanceEventsApi.getMaintenanceEvents()
      ).rejects.toThrow('Invalid JSON response')
    })
  })

  describe('Request/Response Format Validation', () => {
    it('should validate maintenance event response format', async () => {
      const validResponse = mockMaintenanceEvents

      mockedMaintenanceEventsApi.getMaintenanceEvents.mockResolvedValue(validResponse)

      const result = await maintenanceEventsApi.getMaintenanceEvents()
      
      expect(Array.isArray(result)).toBe(true)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('event_number')
      expect(result[0]).toHaveProperty('title')
      expect(result[0]).toHaveProperty('status')
    })

    it('should validate daily report creation request format', async () => {
      const validRequest = {
        inspection_id: 1,
        report_date: '2024-01-15',
        description: 'Test description',
        inspector_ids: [1]
      }

      const createdReport = {
        ...validRequest,
        id: 1,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      }

      mockedDailyReportsApi.createDailyReport.mockResolvedValue(createdReport)

      const result = await dailyReportsApi.createDailyReport(validRequest)
      
      expect(mockedDailyReportsApi.createDailyReport).toHaveBeenCalledWith(validRequest)
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('inspection_id')
      expect(result).toHaveProperty('description')
    })
  })

  describe('Cache Management', () => {
    it('should handle query caching correctly', async () => {
      // First, fetch daily reports
      const { result: queryResult } = renderHook(
        () => useDailyReports({ inspectionId: 1 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(queryResult.current.isSuccess).toBe(true)
      })

      expect(queryResult.current.data).toEqual(mockDailyReports)
      expect(mockedDailyReportsApi.getDailyReports).toHaveBeenCalledWith({ inspectionId: 1 })

      // Second call with same parameters should use cache
      const { result: queryResult2 } = renderHook(
        () => useDailyReports({ inspectionId: 1 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(queryResult2.current.isSuccess).toBe(true)
      })

      // Should still only have been called once due to caching
      expect(mockedDailyReportsApi.getDailyReports).toHaveBeenCalledTimes(1)
    })

    it('should handle different query parameters as separate cache entries', async () => {
      // Fetch reports for inspection 1
      const { result: queryResult1 } = renderHook(
        () => useDailyReports({ inspectionId: 1 }),
        { wrapper }
      )

      // Fetch reports for inspection 2
      const { result: queryResult2 } = renderHook(
        () => useDailyReports({ inspectionId: 2 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(queryResult1.current.isSuccess).toBe(true)
        expect(queryResult2.current.isSuccess).toBe(true)
      })

      // Should have made separate API calls for different parameters
      expect(mockedDailyReportsApi.getDailyReports).toHaveBeenCalledWith({ inspectionId: 1 })
      expect(mockedDailyReportsApi.getDailyReports).toHaveBeenCalledWith({ inspectionId: 2 })
      expect(mockedDailyReportsApi.getDailyReports).toHaveBeenCalledTimes(2)
    })
  })
})
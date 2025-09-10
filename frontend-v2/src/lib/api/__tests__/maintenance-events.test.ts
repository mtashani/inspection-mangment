import { MaintenanceEventsApiService } from '../maintenance-events'
import { EventsFilters, MaintenanceEventStatus, MaintenanceEventType } from '@/types/maintenance-events'

// Mock fetch
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('MaintenanceEventsApiService', () => {
  let apiService: MaintenanceEventsApiService

  beforeEach(() => {
    jest.clearAllMocks()
    apiService = new MaintenanceEventsApiService()
  })

  describe('getMaintenanceEvents', () => {
    it('fetches events without filters', async () => {
      const mockEvents = [
        {
          id: 1,
          event_number: 'ME-2024-001',
          title: 'Test Event',
          status: MaintenanceEventStatus.InProgress,
          event_type: MaintenanceEventType.Overhaul,
          planned_start_date: '2024-01-15T08:00:00Z',
          planned_end_date: '2024-01-20T17:00:00Z',
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-01-15T08:30:00Z',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      } as Response)

      const result = await apiService.getMaintenanceEvents()

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/maintenance/events')
      expect(result).toEqual(mockEvents)
    })

    it('fetches events with filters', async () => {
      const filters: EventsFilters = {
        search: 'test',
        status: MaintenanceEventStatus.InProgress,
        eventType: MaintenanceEventType.Overhaul,
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      await apiService.getMaintenanceEvents(filters)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/maintenance/events?search=test&status=InProgress&eventType=Overhaul&dateFrom=2024-01-01&dateTo=2024-01-31'
      )
    })

    it('handles undefined filter values', async () => {
      const filters: EventsFilters = {
        search: 'test',
        status: undefined,
        eventType: undefined,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      await apiService.getMaintenanceEvents(filters)

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/maintenance/events?search=test')
    })

    it('throws error when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      } as Response)

      await expect(apiService.getMaintenanceEvents()).rejects.toThrow('Server error')
    })

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiService.getMaintenanceEvents()).rejects.toThrow('Network error')
    })
  })

  describe('getMaintenanceEvent', () => {
    it('fetches single event by id', async () => {
      const mockEvent = {
        id: 1,
        event_number: 'ME-2024-001',
        title: 'Test Event',
        status: MaintenanceEventStatus.InProgress,
        event_type: MaintenanceEventType.Overhaul,
        planned_start_date: '2024-01-15T08:00:00Z',
        planned_end_date: '2024-01-20T17:00:00Z',
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-15T08:30:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvent,
      } as Response)

      const result = await apiService.getMaintenanceEvent('1')

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/maintenance/events/1')
      expect(result).toEqual(mockEvent)
    })

    it('throws error for non-existent event', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Event not found',
      } as Response)

      await expect(apiService.getMaintenanceEvent('999')).rejects.toThrow('Event not found')
    })
  })

  describe('getEventsSummary', () => {
    it('fetches summary statistics', async () => {
      const mockSummary = {
        totalEvents: 25,
        activeEvents: 8,
        completedEvents: 15,
        overdueEvents: 2,
        totalInspections: 120,
        activeInspections: 45,
        totalReports: 350,
        reportsThisMonth: 28,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      } as Response)

      const result = await apiService.getEventsSummary()

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/maintenance/events/summary')
      expect(result).toEqual(mockSummary)
    })

    it('fetches summary with filters', async () => {
      const filters: EventsFilters = {
        status: MaintenanceEventStatus.InProgress,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response)

      await apiService.getEventsSummary(filters)

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/maintenance/events/summary?status=InProgress')
    })
  })

  describe('getInspections', () => {
    it('fetches inspections for event', async () => {
      const mockInspections = [
        {
          id: 1,
          inspection_number: 'INS-2024-001',
          title: 'Test Inspection',
          status: 'InProgress',
          equipment_id: 1,
          maintenance_event_id: 1,
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-01-15T08:30:00Z',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInspections,
      } as Response)

      const result = await apiService.getInspections({ eventId: '1' })

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/inspections?eventId=1')
      expect(result).toEqual(mockInspections)
    })

    it('fetches inspections with multiple filters', async () => {
      const filters = {
        eventId: '1',
        subEventId: 2,
        search: 'test',
        status: 'InProgress' as any,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      await apiService.getInspections(filters)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/inspections?eventId=1&subEventId=2&search=test&status=InProgress'
      )
    })
  })

  describe('getDailyReports', () => {
    it('fetches daily reports for inspection', async () => {
      const mockReports = [
        {
          id: 1,
          inspection_id: 1,
          report_date: '2024-01-15',
          description: 'Test report',
          inspector_ids: [1],
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReports,
      } as Response)

      const result = await apiService.getDailyReports({ inspectionId: '1' })

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/daily-reports?inspectionId=1')
      expect(result).toEqual(mockReports)
    })
  })

  describe('createDailyReport', () => {
    it('creates new daily report', async () => {
      const reportData = {
        inspection_id: 1,
        report_date: '2024-01-15',
        description: 'Test report',
        inspector_names: 'John Doe',
      }

      const mockCreatedReport = {
        id: 1,
        ...reportData,
        inspector_ids: [],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedReport,
      } as Response)

      const result = await apiService.createDailyReport(reportData)

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      })
      expect(result).toEqual(mockCreatedReport)
    })

    it('throws error when creation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid data',
      } as Response)

      await expect(
        apiService.createDailyReport({
          inspection_id: 1,
          report_date: '2024-01-15',
          description: 'Test',
          inspector_names: 'John',
        })
      ).rejects.toThrow('Invalid data')
    })
  })

  describe('updateDailyReport', () => {
    it('updates existing daily report', async () => {
      const reportData = {
        description: 'Updated description',
        findings: 'Updated findings',
      }

      const mockUpdatedReport = {
        id: 1,
        inspection_id: 1,
        report_date: '2024-01-15',
        ...reportData,
        inspector_ids: [],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T14:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedReport,
      } as Response)

      const result = await apiService.updateDailyReport('1', reportData)

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/daily-reports/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      })
      expect(result).toEqual(mockUpdatedReport)
    })
  })

  describe('deleteDailyReport', () => {
    it('deletes daily report', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const result = await apiService.deleteDailyReport('1')

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/daily-reports/1', {
        method: 'DELETE',
      })
      expect(result).toEqual({ success: true })
    })

    it('throws error when deletion fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Report not found',
      } as Response)

      await expect(apiService.deleteDailyReport('999')).rejects.toThrow('Report not found')
    })
  })

  describe('Error handling', () => {
    it('handles JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      } as Response)

      await expect(apiService.getMaintenanceEvents()).rejects.toThrow('Invalid JSON')
    })

    it('handles empty response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => '',
      } as Response)

      await expect(apiService.getMaintenanceEvents()).rejects.toThrow('HTTP 500: Internal Server Error')
    })

    it('includes status code in error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Access denied',
      } as Response)

      await expect(apiService.getMaintenanceEvents()).rejects.toThrow('Access denied')
    })
  })

  describe('URL construction', () => {
    it('handles special characters in search params', async () => {
      const filters: EventsFilters = {
        search: 'test & special chars',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      await apiService.getMaintenanceEvents(filters)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/maintenance/events?search=test%20%26%20special%20chars'
      )
    })

    it('handles empty string parameters', async () => {
      const filters: EventsFilters = {
        search: '',
        status: undefined,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      await apiService.getMaintenanceEvents(filters)

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/maintenance/events')
    })
  })
})
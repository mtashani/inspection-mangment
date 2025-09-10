import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import {
  useMaintenanceEvents,
  useMaintenanceEvent,
  useEventsSummary,
  useInspections,
  useDailyReports,
  useCreateDailyReport,
  useUpdateDailyReport,
  useDeleteDailyReport,
} from '../use-maintenance-events'
import { EventsFilters, MaintenanceEventStatus } from '@/types/maintenance-events'

// Mock the API services
jest.mock('@/lib/api/maintenance-events', () => ({
  maintenanceEventsApi: {
    getMaintenanceEvents: jest.fn(),
    getMaintenanceEvent: jest.fn(),
    getEventsSummary: jest.fn(),
  },
  inspectionsApi: {
    getInspections: jest.fn(),
  },
  dailyReportsApi: {
    getDailyReports: jest.fn(),
    createDailyReport: jest.fn(),
    updateDailyReport: jest.fn(),
    deleteDailyReport: jest.fn(),
  },
}))

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

import { maintenanceEventsApi, inspectionsApi, dailyReportsApi } from '@/lib/api/maintenance-events'
const mockMaintenanceEventsApi = maintenanceEventsApi as jest.Mocked<typeof maintenanceEventsApi>
const mockInspectionsApi = inspectionsApi as jest.Mocked<typeof inspectionsApi>
const mockDailyReportsApi = dailyReportsApi as jest.Mocked<typeof dailyReportsApi>

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
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

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useMaintenanceEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches maintenance events successfully', async () => {
    const mockEvents = [
      {
        id: 1,
        event_number: 'ME-2024-001',
        title: 'Test Event',
        status: MaintenanceEventStatus.InProgress,
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-15T08:30:00Z',
      },
    ]

    mockMaintenanceEventsApi.getMaintenanceEvents.mockResolvedValue(mockEvents)

    const { result } = renderHook(() => useMaintenanceEvents(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockEvents)
    expect(mockMaintenanceEventsApi.getMaintenanceEvents).toHaveBeenCalledWith({})
  })

  it('passes filters to API service', async () => {
    const filters: EventsFilters = {
      search: 'test',
      status: MaintenanceEventStatus.InProgress,
    }

    mockMaintenanceEventsApi.getMaintenanceEvents.mockResolvedValue([])

    const { result } = renderHook(() => useMaintenanceEvents(filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockMaintenanceEventsApi.getMaintenanceEvents).toHaveBeenCalledWith(filters)
  })

  it('handles API errors', async () => {
    const error = new Error('API Error')
    mockMaintenanceEventsApi.getMaintenanceEvents.mockRejectedValue(error)

    const { result } = renderHook(() => useMaintenanceEvents(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(error)
  })

  it('shows loading state initially', () => {
    mockMaintenanceEventsApi.getMaintenanceEvents.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const { result } = renderHook(() => useMaintenanceEvents(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('uses correct query key', async () => {
    const filters: EventsFilters = { search: 'test' }
    mockMaintenanceEventsApi.getMaintenanceEvents.mockResolvedValue([])

    const { result } = renderHook(() => useMaintenanceEvents(filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Query key should include filters for proper caching
    expect(mockMaintenanceEventsApi.getMaintenanceEvents).toHaveBeenCalledWith(filters)
  })
})

describe('useMaintenanceEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches single event by id', async () => {
    const mockEvent = {
      id: 1,
      event_number: 'ME-2024-001',
      title: 'Test Event',
      status: MaintenanceEventStatus.InProgress,
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-15T08:30:00Z',
    }

    mockMaintenanceEventsApi.getMaintenanceEvent.mockResolvedValue(mockEvent)

    const { result } = renderHook(() => useMaintenanceEvent('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockEvent)
    expect(mockMaintenanceEventsApi.getMaintenanceEvent).toHaveBeenCalledWith('1')
  })

  it('handles invalid event id', async () => {
    const error = new Error('Event not found')
    mockMaintenanceEventsApi.getMaintenanceEvent.mockRejectedValue(error)

    const { result } = renderHook(() => useMaintenanceEvent('999'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(error)
  })
})

describe('useEventsSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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

    mockMaintenanceEventsApi.getEventsSummary.mockResolvedValue(mockSummary)

    const { result } = renderHook(() => useEventsSummary(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockSummary)
    expect(mockMaintenanceEventsApi.getEventsSummary).toHaveBeenCalledWith({})
  })

  it('passes filters to summary API', async () => {
    const filters: EventsFilters = { status: MaintenanceEventStatus.InProgress }
    mockMaintenanceEventsApi.getEventsSummary.mockResolvedValue({} as any)

    const { result } = renderHook(() => useEventsSummary(filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockMaintenanceEventsApi.getEventsSummary).toHaveBeenCalledWith(filters)
  })
})

describe('useCreateDailyReport', () => {
  let mockApiService: jest.Mocked<MaintenanceEventsApiService>

  beforeEach(() => {
    mockApiService = new MockedApiService() as jest.Mocked<MaintenanceEventsApiService>
  })

  it('creates daily report successfully', async () => {
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

    mockApiService.createDailyReport.mockResolvedValue(mockCreatedReport)

    const { result } = renderHook(() => useCreateDailyReport(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(reportData)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockCreatedReport)
    expect(mockApiService.createDailyReport).toHaveBeenCalledWith(reportData)
  })

  it('handles creation errors', async () => {
    const error = new Error('Validation failed')
    mockApiService.createDailyReport.mockRejectedValue(error)

    const { result } = renderHook(() => useCreateDailyReport(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      inspection_id: 1,
      report_date: '2024-01-15',
      description: 'Test',
      inspector_names: 'John',
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(error)
  })

  it('shows loading state during creation', () => {
    mockApiService.createDailyReport.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const { result } = renderHook(() => useCreateDailyReport(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      inspection_id: 1,
      report_date: '2024-01-15',
      description: 'Test',
      inspector_names: 'John',
    })

    expect(result.current.isPending).toBe(true)
  })
})

describe('useUpdateDailyReport', () => {
  let mockApiService: jest.Mocked<MaintenanceEventsApiService>

  beforeEach(() => {
    mockApiService = new MockedApiService() as jest.Mocked<MaintenanceEventsApiService>
  })

  it('updates daily report successfully', async () => {
    const updateData = {
      description: 'Updated description',
      findings: 'Updated findings',
    }

    const mockUpdatedReport = {
      id: 1,
      inspection_id: 1,
      report_date: '2024-01-15',
      ...updateData,
      inspector_ids: [],
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T14:00:00Z',
    }

    mockApiService.updateDailyReport.mockResolvedValue(mockUpdatedReport)

    const { result } = renderHook(() => useUpdateDailyReport(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ id: '1', data: updateData })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockUpdatedReport)
    expect(mockApiService.updateDailyReport).toHaveBeenCalledWith('1', updateData)
  })
})

describe('useDeleteDailyReport', () => {
  let mockApiService: jest.Mocked<MaintenanceEventsApiService>

  beforeEach(() => {
    mockApiService = new MockedApiService() as jest.Mocked<MaintenanceEventsApiService>
  })

  it('deletes daily report successfully', async () => {
    mockApiService.deleteDailyReport.mockResolvedValue({ success: true })

    const { result } = renderHook(() => useDeleteDailyReport(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockApiService.deleteDailyReport).toHaveBeenCalledWith('1')
  })

  it('handles deletion errors', async () => {
    const error = new Error('Report not found')
    mockApiService.deleteDailyReport.mockRejectedValue(error)

    const { result } = renderHook(() => useDeleteDailyReport(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('999')

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(error)
  })
})

describe('useInspections', () => {
  let mockApiService: jest.Mocked<MaintenanceEventsApiService>

  beforeEach(() => {
    mockApiService = new MockedApiService() as jest.Mocked<MaintenanceEventsApiService>
  })

  it('fetches inspections with filters', async () => {
    const mockInspections = [
      {
        id: 1,
        inspection_number: 'INS-2024-001',
        title: 'Test Inspection',
        status: 'InProgress' as any,
        equipment_id: 1,
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-15T08:30:00Z',
      },
    ]

    mockApiService.getInspections.mockResolvedValue(mockInspections)

    const filters = { eventId: '1', search: 'test' }
    const { result } = renderHook(() => useInspections(filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockInspections)
    expect(mockApiService.getInspections).toHaveBeenCalledWith(filters)
  })
})

describe('useDailyReports', () => {
  let mockApiService: jest.Mocked<MaintenanceEventsApiService>

  beforeEach(() => {
    mockApiService = new MockedApiService() as jest.Mocked<MaintenanceEventsApiService>
  })

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

    mockApiService.getDailyReports.mockResolvedValue(mockReports)

    const filters = { inspectionId: '1' }
    const { result } = renderHook(() => useDailyReports(filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockReports)
    expect(mockApiService.getDailyReports).toHaveBeenCalledWith(filters)
  })
})
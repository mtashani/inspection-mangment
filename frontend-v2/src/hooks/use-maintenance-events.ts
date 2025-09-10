import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { toastMessages, formatApiError } from '@/lib/utils/toast-messages'
import {
  maintenanceEventsApi,
  inspectionsApi,
  dailyReportsApi
} from '@/lib/api/maintenance-events'
// Import the correct inspections API that has all methods
import { InspectionsApiService } from '@/lib/api/daily-reports'
import {
  MaintenanceEvent,
  MaintenanceSubEvent,
  Inspection,
  DailyReport,
  EventsSummary,
  EventsFilters,
  InspectionsFilters,
  DailyReportsFilters,
  CreateDailyReportRequest,
  UpdateDailyReportRequest,
  CreateMaintenanceEventRequest,
  UpdateMaintenanceEventRequest,
  UpdateInspectionRequest
} from '@/types/maintenance-events'
import { ApiError } from '@/lib/utils/error-handling'

// Use the complete inspections API service
const completeInspectionsApi = new InspectionsApiService()

// Query keys factory
export const queryKeys = {
  maintenanceEvents: {
    all: ['maintenance-events'] as const,
    lists: () => [...queryKeys.maintenanceEvents.all, 'list'] as const,
    list: (filters: EventsFilters) => [...queryKeys.maintenanceEvents.lists(), filters] as const,
    details: () => [...queryKeys.maintenanceEvents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.maintenanceEvents.details(), id] as const,
    summary: (filters: EventsFilters) => [...queryKeys.maintenanceEvents.all, 'summary', filters] as const,
    subEvents: (parentId: string) => [...queryKeys.maintenanceEvents.all, 'sub-events', parentId] as const,
  },
  inspections: {
    all: ['inspections'] as const,
    lists: () => [...queryKeys.inspections.all, 'list'] as const,
    list: (filters: InspectionsFilters) => [...queryKeys.inspections.lists(), filters] as const,
    details: () => [...queryKeys.inspections.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.inspections.details(), id] as const,
  },
  dailyReports: {
    all: ['daily-reports'] as const,
    lists: () => [...queryKeys.dailyReports.all, 'list'] as const,
    list: (filters: DailyReportsFilters) => [...queryKeys.dailyReports.lists(), filters] as const,
    details: () => [...queryKeys.dailyReports.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.dailyReports.details(), id] as const,
  },
}

// Error handler
const handleError = (error: unknown) => {
  console.log('🚨 Hook Error Handler - Raw error:', error)
  console.log('🚨 Hook Error Handler - Error type:', typeof error)
  console.log('🚨 Hook Error Handler - Error constructor:', error?.constructor?.name)
  
  const errorMessage = formatApiError(error)
  
  console.log('💬 Hook Error Handler - Formatted message:', errorMessage)
  
  // Only show toast for non-401 errors or in production
  if (!(error instanceof Error && error.message.includes('401')) || process.env.NODE_ENV === 'production') {
    toast.error(errorMessage)
  }
  
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', error)
  }
}

// Maintenance Events hooks
export function useMaintenanceEvents(filters: EventsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.maintenanceEvents.list(filters),
    queryFn: () => maintenanceEventsApi.getMaintenanceEvents(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useMaintenanceEvent(id: string) {
  return useQuery({
    queryKey: queryKeys.maintenanceEvents.detail(id),
    queryFn: () => maintenanceEventsApi.getMaintenanceEvent(id),
    staleTime: 30 * 60 * 1000, // 30 minutes - longer cache for events
    enabled: !!id,
    retry: 3,
  })
}

export function useMaintenanceSubEvents(parentEventId: string) {
  return useQuery({
    queryKey: queryKeys.maintenanceEvents.subEvents(parentEventId),
    queryFn: () => maintenanceEventsApi.getMaintenanceSubEvents(parentEventId),
    staleTime: 30 * 60 * 1000, // 30 minutes - longer cache for sub-events
    enabled: !!parentEventId,
    retry: 3,
  })
}

export function useEventsSummary(filters: EventsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.maintenanceEvents.summary(filters),
    queryFn: () => maintenanceEventsApi.getEventsSummary(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
  })
}

export function useEventStatistics(eventId: string) {
  return useQuery({
    queryKey: ['event-statistics', eventId],
    queryFn: () => maintenanceEventsApi.getEventStatistics(eventId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!eventId,
    retry: 3,
  })
}

// Inspections hooks
export function useInspections(filters: InspectionsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.inspections.list(filters),
    queryFn: async () => {
      const response = await inspectionsApi.getInspections(filters)
      return response.data // Return only the data array for backward compatibility
    },
    staleTime: 5 * 60 * 1000,
    // Enable the query when either specific filters are provided OR when no filters (to fetch all)
    enabled: !!(filters.eventId || filters.subEventId || Object.keys(filters).length === 0),
    retry: 3,
  })
}

// New paginated inspections hook
export function usePaginatedInspections(filters: InspectionsFilters = {}) {
  return useQuery({
    queryKey: [...queryKeys.inspections.list(filters), 'paginated'],
    queryFn: () => inspectionsApi.getInspections(filters),
    staleTime: 5 * 60 * 1000,
    // Enable the query for:
    // 1. When we have specific filters (eventId, subEventId, search, equipmentTag)
    // 2. When we have pagination params (skip is always provided, even if 0)
    // 3. Always enable for global search (when no eventId but pagination is provided)
    enabled: true, // Always enable since we always have pagination params
    retry: 3,
  })
}

export function useInspection(id: number) {
  return useQuery({
    queryKey: queryKeys.inspections.detail(id),
    queryFn: () => inspectionsApi.getInspection(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
    retry: 3,
  })
}

// Daily Reports hooks
export function useDailyReports(filters: DailyReportsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.dailyReports.list(filters),
    queryFn: () => dailyReportsApi.getDailyReports(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
  })
}

export function useDailyReport(id: number) {
  return useQuery({
    queryKey: queryKeys.dailyReports.detail(id),
    queryFn: () => dailyReportsApi.getDailyReport(id),
    staleTime: 2 * 60 * 1000,
    enabled: !!id,
    retry: 3,
  })
}

// Custom hook to fetch daily reports for multiple inspection IDs
export function useDailyReportsByInspectionIds(inspectionIds: number[]) {
  const safeInspectionIds = useMemo(() => {
    return Array.isArray(inspectionIds) ? inspectionIds : [];
  }, [inspectionIds]);

  // Use a single query to fetch all daily reports for all inspection IDs
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.dailyReports.list({ inspectionId: safeInspectionIds[0] || 0 }),
    queryFn: () => {
      // If no inspection IDs, return empty array
      if (safeInspectionIds.length === 0) {
        return Promise.resolve([]);
      }
      // For now, fetch for the first inspection ID - API may need enhancement for multiple IDs
      return dailyReportsApi.getDailyReports({ inspectionId: safeInspectionIds[0] });
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    // Only enable query if there are inspection IDs
    enabled: safeInspectionIds.length > 0
  });

  return {
    data: data || [],
    isLoading,
    error
  };
}

// Maintenance Events mutations
export function useCreateMaintenanceEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateMaintenanceEventRequest) => maintenanceEventsApi.createMaintenanceEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceEvents.all })
      toast.success(toastMessages.maintenanceEvent.created)
    },
    onError: handleError,
  })
}

export function useUpdateMaintenanceEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMaintenanceEventRequest }) =>
      maintenanceEventsApi.updateMaintenanceEvent(id, data),
    onSuccess: (response) => {
      console.log('🔄 Update Event API Response:', response)
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceEvents.all })
      toast.success('Maintenance event updated successfully')
    },
    onError: handleError,
  })
}

export function useDeleteMaintenanceEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => maintenanceEventsApi.deleteMaintenanceEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceEvents.all })
      toast.success('Maintenance event deleted successfully')
    },
    onError: handleError,
  })
}

export function useStartMaintenanceEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => maintenanceEventsApi.startMaintenanceEvent(id),
    onSuccess: (response) => {
      // Log the actual response to understand the format
      console.log('🚀 Start Event API Response:', response)
      console.log('🚀 Response type:', typeof response)
      console.log('🚀 Response keys:', Object.keys(response || {}))
      
      // For now, just invalidate all queries and show success
      // Once we understand the response format, we can optimize this
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceEvents.all })
      toast.success('Maintenance event started successfully')
    },
    onError: handleError,
  })
}

export function useCompleteMaintenanceEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      maintenanceEventsApi.completeMaintenanceEvent(id, notes),
    onSuccess: (response) => {
      console.log('✅ Complete Event API Response:', response)
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceEvents.all })
      toast.success('Maintenance event completed successfully')
    },
    onError: handleError,
  })
}

export function useReopenMaintenanceEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => maintenanceEventsApi.reopenMaintenanceEvent(id),
    onSuccess: (response) => {
      console.log('🔄 Reopen Event API Response:', response)
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceEvents.all })
      toast.success('Maintenance event reopened successfully')
    },
    onError: handleError,
  })
}

export function useRevertMaintenanceEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => maintenanceEventsApi.revertMaintenanceEvent(id),
    onSuccess: (response) => {
      console.log('↩️ Revert Event API Response:', response)
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceEvents.all })
      toast.success('Maintenance event reverted to planning successfully')
    },
    onError: handleError,
  })
}

export function useReactivateMaintenanceEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => maintenanceEventsApi.reactivateMaintenanceEvent(id),
    onSuccess: (response) => {
      console.log('🔄 Reactivate Event API Response:', response)
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceEvents.all })
      toast.success('Maintenance event reactivated successfully')
    },
    onError: handleError,
  })
}

export function useApproveMaintenanceEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy?: string }) => 
      maintenanceEventsApi.approveMaintenanceEvent(id, approvedBy),
    onSuccess: (response) => {
      console.log('✅ Approve Event API Response:', response)
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceEvents.all })
      toast.success('Maintenance event approved successfully')
    },
    onError: handleError,
  })
}

export function useRevertApprovalMaintenanceEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => maintenanceEventsApi.revertApprovalMaintenanceEvent(id),
    onSuccess: (response) => {
      console.log('↩️ Revert Approval API Response:', response)
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceEvents.all })
      toast.success('Event approval reverted successfully')
    },
    onError: handleError,
  })
}

// Add this new hook for creating sub-events
export function useCreateMaintenanceSubEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => maintenanceEventsApi.createMaintenanceSubEvent(data),
    onSuccess: (response) => {
      console.log('➕ Create Sub-Event API Response:', response)
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceEvents.all })
      toast.success('Sub-event created successfully')
    },
    onError: handleError,
  })
}

// Add hook for updating sub-events
export function useUpdateMaintenanceSubEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      maintenanceEventsApi.updateMaintenanceSubEvent(id, data),
    onSuccess: (response) => {
      console.log('🔄 Update Sub-Event API Response:', response)
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceEvents.all })
      toast.success('Sub-event updated successfully')
    },
    onError: handleError,
  })
}

// Inspection mutations
export function useCreatePlanInspection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => {
      console.log('🚀 CreatePlanInspection - Request data:', data)
      return inspectionsApi.createPlanInspection(data)
    },
    onSuccess: (newInspection) => {
      console.log('✅ CreatePlanInspection - Success response:', newInspection)
      // Invalidate inspections for the event/sub-event
      if (newInspection.maintenance_event_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.inspections.list({ eventId: newInspection.maintenance_event_id.toString() })
        })
      }
      if (newInspection.maintenance_sub_event_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.inspections.list({ subEventId: newInspection.maintenance_sub_event_id })
        })
      }
      // Invalidate parent event to update counts
      if (newInspection.maintenance_event_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.maintenanceEvents.detail(newInspection.maintenance_event_id.toString()) 
        })
      }
      toast.success('Inspection planned successfully')
    },
    onError: (error) => {
      console.log('❌ CreatePlanInspection - Error:', error)
      handleError(error)
    },
  })
}

// Add this new hook for starting inspections
export function useStartInspection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => {
      console.log('🚀 StartInspection - Request ID:', id)
      return inspectionsApi.startInspection(id)
    },
    onSuccess: (response) => {
      console.log('✅ StartInspection - Success response:', response)
      // Invalidate all inspection lists to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.inspections.all })
      // Invalidate maintenance events to update counts
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceEvents.all })
      toast.success('Inspection started successfully')
    },
    onError: (error) => {
      console.log('❌ StartInspection - Error:', error)
      handleError(error)
    },
  })
}

// Add this new hook for creating unplanned inspections
export function useCreateUnplannedInspection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => {
      console.log('🚀 CreateUnplannedInspection - Request data:', data)
      return inspectionsApi.createUnplannedInspection(data)
    },
    onSuccess: (newInspection) => {
      console.log('✅ CreateUnplannedInspection - Success response:', newInspection)
      // Invalidate inspections for the event/sub-event
      if (newInspection.maintenance_event_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.inspections.list({ eventId: newInspection.maintenance_event_id.toString() })
        })
      }
      if (newInspection.maintenance_sub_event_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.inspections.list({ subEventId: newInspection.maintenance_sub_event_id })
        })
      }
      // Invalidate parent event to update counts
      if (newInspection.maintenance_event_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.maintenanceEvents.detail(newInspection.maintenance_event_id.toString()) 
        })
      }
      toast.success('Unplanned inspection created successfully')
    },
    onError: (error) => {
      console.log('❌ CreateUnplannedInspection - Error:', error)
      handleError(error)
    },
  })
}

export function useUpdateInspectionStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      inspectionsApi.updateInspectionStatus(id, status),
    onSuccess: (updatedInspection) => {
      queryClient.setQueryData(
        queryKeys.inspections.detail(updatedInspection.id),
        updatedInspection
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.inspections.lists() })
      toast.success('Inspection status updated successfully')
    },
    onError: handleError,
  })
}

export function useUpdateInspection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInspectionRequest }) =>
      inspectionsApi.updateInspection(id, data),
    onSuccess: (updatedInspection) => {
      queryClient.setQueryData(
        queryKeys.inspections.detail(updatedInspection.id),
        updatedInspection
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.inspections.lists() })
      // Invalidate parent event to update counts
      if (updatedInspection.maintenance_event_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.maintenanceEvents.detail(updatedInspection.maintenance_event_id.toString()) 
        })
      }
      toast.success('Inspection updated successfully')
    },
    onError: handleError,
  })
}

export function useCompleteInspection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => {
      console.log('🚀 CompleteInspection - Request ID:', id)
      return inspectionsApi.completeInspection(id)
    },
    onSuccess: (response) => {
      console.log('✅ CompleteInspection - Success response:', response)
      // Invalidate all inspection lists to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.inspections.all })
      // Invalidate maintenance events to update counts
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceEvents.all })
      toast.success('Inspection completed successfully')
    },
    onError: (error) => {
      console.log('❌ CompleteInspection - Error:', error)
      handleError(error)
    },
  })
}

export function useDeleteInspection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => {
      console.log('🚀 DeleteInspection - Request ID:', id)
      return inspectionsApi.deleteInspection(id)
    },
    onSuccess: (response) => {
      console.log('✅ DeleteInspection - Success response:', response)
      // Invalidate all inspection lists to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.inspections.all })
      // Invalidate maintenance events to update counts
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceEvents.all })
      toast.success('Inspection deleted successfully')
    },
    onError: (error) => {
      console.log('❌ DeleteInspection - Error:', error)
      handleError(error)
    },
  })
}

// Daily Reports mutations
export function useCreateDailyReport() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateDailyReportRequest) => dailyReportsApi.createDailyReport(data),
    onSuccess: (newReport) => {
      // Invalidate daily reports list for the inspection
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dailyReports.list({ inspectionId: newReport.inspection_id })
      })
      // Invalidate inspections to update counts
      queryClient.invalidateQueries({ queryKey: queryKeys.inspections.all })
      toast.success('Daily report created successfully')
    },
    onError: handleError,
  })
}

export function useUpdateDailyReport() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDailyReportRequest }) =>
      dailyReportsApi.updateDailyReport(id, data),
    onSuccess: (updatedReport) => {
      queryClient.setQueryData(
        queryKeys.dailyReports.detail(updatedReport.id),
        updatedReport
      )
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dailyReports.list({ inspectionId: updatedReport.inspection_id })
      })
      toast.success('Daily report updated successfully')
    },
    onError: handleError,
  })
}

export function useDeleteDailyReport() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => dailyReportsApi.deleteDailyReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyReports.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.inspections.all })
      toast.success(toastMessages.dailyReport.deleted)
    },
    onError: handleError,
  })
}

// Enhanced error handling hooks
export function useMaintenanceEventWithRetry(id: string, maxRetries: number = 3) {
  return useQuery({
    queryKey: queryKeys.maintenanceEvents.detail(id),
    queryFn: () => maintenanceEventsApi.getMaintenanceEvent(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
    retry: (failureCount, error: Error) => {
      if (error instanceof Error && error.message.includes('404')) {
        return false // Don't retry on 404 - event doesn't exist
      }
      return failureCount < maxRetries
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

// Optimistic update hook for better UX
export function useOptimisticDailyReportUpdate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDailyReportRequest }) =>
      dailyReportsApi.updateDailyReport(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.dailyReports.detail(id) })
      
      // Snapshot previous value
      const previousReport = queryClient.getQueryData(queryKeys.dailyReports.detail(id))
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.dailyReports.detail(id), (old: DailyReport | undefined) => {
        if (!old) return old
        return { ...old, ...data }
      })
      
      return { previousReport }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousReport) {
        queryClient.setQueryData(queryKeys.dailyReports.detail(id), context.previousReport)
      }
      handleError(err)
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyReports.detail(id) })
    },
    onSuccess: () => {
      toast.success('Daily report updated successfully')
    },
  })
}

// Bulk operations hook for efficiency
export function useBulkEventOperations() {
  const queryClient = useQueryClient()
  
  return {
    bulkApprove: useMutation({
      mutationFn: (eventIds: string[]) => 
        Promise.all(eventIds.map(id => 
          maintenanceEventsApi.updateMaintenanceEvent(id, { approved_by: 'admin' })
        )),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceEvents.all })
        toast.success('Events approved successfully')
      },
      onError: handleError,
    }),
    
    bulkStatusUpdate: useMutation({
      mutationFn: ({ eventIds, status }: { eventIds: string[], status: any }) => 
        Promise.all(eventIds.map(id => 
          maintenanceEventsApi.updateMaintenanceEvent(id, { status })
        )),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceEvents.all })
        toast.success('Events updated successfully')
      },
      onError: handleError,
    })
  }
}
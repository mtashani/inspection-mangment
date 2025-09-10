// Daily Reports TanStack Query Hooks
// This file contains all React Query hooks for Daily Reports functionality

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  DailyReport,
  Inspection,
  MaintenanceEvent,
  DailyReportsSummary,
  DailyReportsFilters,
  CreateDailyReportRequest,
  UpdateDailyReportRequest,
  CreateInspectionRequest,
  UpdateInspectionRequest,
  UpdateMaintenanceEventStatusRequest,
  InspectionStatus,
  MaintenanceEventStatus,
  UseDailyReportsResult,
  UseDailyReportsSummaryResult,
  UseMaintenanceEventsResult,
  UseInspectionsResult
} from '@/types/daily-reports'
import {
  dailyReportsApi,
  inspectionsApi,
  maintenanceEventsApi,
  equipmentApi,
  inspectorsApi,
  apiHelpers
} from '@/lib/api/daily-reports'

// Query Keys Factory
export const dailyReportsKeys = {
  all: ['daily-reports'] as const,
  lists: () => [...dailyReportsKeys.all, 'list'] as const,
  list: (filters: DailyReportsFilters) => [...dailyReportsKeys.lists(), filters] as const,
  details: () => [...dailyReportsKeys.all, 'detail'] as const,
  detail: (id: number) => [...dailyReportsKeys.details(), id] as const,
  byInspection: (inspectionId: number) => [...dailyReportsKeys.all, 'by-inspection', inspectionId] as const,
  summary: (filters: DailyReportsFilters) => [...dailyReportsKeys.all, 'summary', filters] as const,
}

export const inspectionsKeys = {
  all: ['inspections'] as const,
  lists: () => [...inspectionsKeys.all, 'list'] as const,
  list: (filters: any) => [...inspectionsKeys.lists(), filters] as const,
  details: () => [...inspectionsKeys.all, 'detail'] as const,
  detail: (id: number) => [...inspectionsKeys.details(), id] as const,
}

export const maintenanceEventsKeys = {
  all: ['maintenance-events'] as const,
  lists: () => [...maintenanceEventsKeys.all, 'list'] as const,
  list: (filters: any) => [...maintenanceEventsKeys.lists(), filters] as const,
  details: () => [...maintenanceEventsKeys.all, 'detail'] as const,
  detail: (id: number) => [...maintenanceEventsKeys.details(), id] as const,
  statistics: (id: number) => [...maintenanceEventsKeys.all, 'statistics', id] as const,
}

export const equipmentKeys = {
  all: ['equipment'] as const,
  tags: (query?: string) => [...equipmentKeys.all, 'tags', query] as const,
  list: (params: any) => [...equipmentKeys.all, 'list', params] as const,
}

export const inspectorsKeys = {
  all: ['inspectors'] as const,
  list: (query?: string, available?: boolean) => [...inspectorsKeys.all, 'list', query, available] as const,
  names: () => [...inspectorsKeys.all, 'names'] as const,
}

// Daily Reports Hooks
export function useDailyReports(filters: DailyReportsFilters = {}): UseDailyReportsResult {
  const query = useQuery({
    queryKey: dailyReportsKeys.list(filters),
    queryFn: () => dailyReportsApi.getDailyReports(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const refetch = useCallback(async () => {
    await query.refetch()
  }, [query])

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch
  }
}

export function useDailyReport(reportId: number) {
  return useQuery({
    queryKey: dailyReportsKeys.detail(reportId),
    queryFn: () => dailyReportsApi.getDailyReport(reportId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!reportId,
  })
}

export function useDailyReportsByInspection(inspectionId: number) {
  return useQuery({
    queryKey: dailyReportsKeys.byInspection(inspectionId),
    queryFn: () => dailyReportsApi.getDailyReportsByInspection(inspectionId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!inspectionId,
  })
}

export function useDailyReportsSummary(filters: DailyReportsFilters = {}): UseDailyReportsSummaryResult {
  const query = useQuery({
    queryKey: dailyReportsKeys.summary(filters),
    queryFn: () => dailyReportsApi.getSummary(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  })

  const refetch = useCallback(async () => {
    await query.refetch()
  }, [query])

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch
  }
}

// Daily Reports Mutations
export function useCreateDailyReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDailyReportRequest) => dailyReportsApi.createDailyReport(data),
    onSuccess: (newReport, variables) => {
      // Invalidate and refetch daily reports lists
      queryClient.invalidateQueries({ queryKey: dailyReportsKeys.lists() })
      
      // Invalidate summary
      queryClient.invalidateQueries({ queryKey: dailyReportsKeys.all })
      
      // Invalidate inspection-specific reports
      queryClient.invalidateQueries({ 
        queryKey: dailyReportsKeys.byInspection(variables.inspectionId) 
      })
      
      // Update inspection details if cached
      queryClient.invalidateQueries({ 
        queryKey: inspectionsKeys.detail(variables.inspectionId) 
      })
    },
    onError: (error) => {
      console.error('Failed to create daily report:', error)
    }
  })
}

export function useUpdateDailyReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDailyReportRequest }) =>
      dailyReportsApi.updateDailyReport(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: dailyReportsKeys.detail(id) })

      // Snapshot previous value
      const previousReport = queryClient.getQueryData(dailyReportsKeys.detail(id))

      // Optimistically update
      queryClient.setQueryData(dailyReportsKeys.detail(id), (old: any) => ({
        ...old,
        ...data,
        updatedAt: new Date().toISOString()
      }))

      return { previousReport }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousReport) {
        queryClient.setQueryData(dailyReportsKeys.detail(id), context.previousReport)
      }
    },
    onSuccess: (updatedReport, { id }) => {
      // Update the specific report in cache
      queryClient.setQueryData(dailyReportsKeys.detail(id), updatedReport)
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: dailyReportsKeys.lists() })
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: dailyReportsKeys.detail(id) })
    },
  })
}

export function useDeleteDailyReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reportId: number) => dailyReportsApi.deleteDailyReport(reportId),
    onSuccess: (_, reportId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: dailyReportsKeys.detail(reportId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: dailyReportsKeys.lists() })
      
      // Invalidate summary
      queryClient.invalidateQueries({ queryKey: dailyReportsKeys.all })
    },
    onError: (error) => {
      console.error('Failed to delete daily report:', error)
    }
  })
}

// Inspections Hooks
export function useInspections(filters: any = {}): UseInspectionsResult {
  const query = useQuery({
    queryKey: inspectionsKeys.list(filters),
    queryFn: () => inspectionsApi.getInspections(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  })

  const refetch = useCallback(async () => {
    await query.refetch()
  }, [query])

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch
  }
}

export function useInspection(inspectionId: number) {
  return useQuery({
    queryKey: inspectionsKeys.detail(inspectionId),
    queryFn: () => inspectionsApi.getInspection(inspectionId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!inspectionId,
  })
}

// Inspection Mutations
export function useCreateInspection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInspectionRequest) => inspectionsApi.createInspection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dailyReportsKeys.all })
    }
  })
}

export function useUpdateInspection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInspectionRequest }) =>
      inspectionsApi.updateInspection(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: inspectionsKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: inspectionsKeys.lists() })
    }
  })
}

export function useCompleteInspection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: any }) =>
      inspectionsApi.completeInspection(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: inspectionsKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: inspectionsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dailyReportsKeys.all })
    }
  })
}

export function useDeleteInspection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (inspectionId: number) => inspectionsApi.deleteInspection(inspectionId),
    onSuccess: (_, inspectionId) => {
      queryClient.removeQueries({ queryKey: inspectionsKeys.detail(inspectionId) })
      queryClient.invalidateQueries({ queryKey: inspectionsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dailyReportsKeys.all })
    }
  })
}

// Maintenance Events Hooks
export function useMaintenanceEvents(filters: any = {}): UseMaintenanceEventsResult {
  const query = useQuery({
    queryKey: maintenanceEventsKeys.list(filters),
    queryFn: () => maintenanceEventsApi.getMaintenanceEvents(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  })

  const refetch = useCallback(async () => {
    await query.refetch()
  }, [query])

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch
  }
}

export function useMaintenanceEvent(eventId: number) {
  return useQuery({
    queryKey: maintenanceEventsKeys.detail(eventId),
    queryFn: () => maintenanceEventsApi.getMaintenanceEvent(eventId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!eventId,
  })
}

export function useMaintenanceEventStatistics(eventId: number) {
  return useQuery({
    queryKey: maintenanceEventsKeys.statistics(eventId),
    queryFn: () => maintenanceEventsApi.getMaintenanceEventStatistics(eventId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!eventId,
  })
}

// Maintenance Event Mutations
export function useUpdateMaintenanceEventStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMaintenanceEventStatusRequest }) =>
      maintenanceEventsApi.updateMaintenanceEventStatus(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: maintenanceEventsKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: maintenanceEventsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dailyReportsKeys.all })
    }
  })
}

export function useCreateMaintenanceEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => maintenanceEventsApi.createMaintenanceEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceEventsKeys.all })
      queryClient.invalidateQueries({ queryKey: maintenanceEventsKeys.lists() })
    },
    onError: (error) => {
      console.error('Failed to create maintenance event:', error)
    }
  })
}

// Equipment and Inspectors Hooks
export function useEquipmentTags(query?: string) {
  return useQuery({
    queryKey: equipmentKeys.tags(query),
    queryFn: () => equipmentApi.getEquipmentTags(query),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: query !== undefined && query.length > 0,
  })
}

export function useEquipment(params: any = {}) {
  return useQuery({
    queryKey: equipmentKeys.list(params),
    queryFn: () => equipmentApi.getEquipment(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useInspectors(query?: string, available?: boolean) {
  return useQuery({
    queryKey: inspectorsKeys.list(query, available),
    queryFn: () => inspectorsApi.getInspectors(query, available),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useInspectorNames() {
  return useQuery({
    queryKey: inspectorsKeys.names(),
    queryFn: () => inspectorsApi.getInspectorNames(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Utility Hooks
export function useInvalidateAllDailyReports() {
  const queryClient = useQueryClient()

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: dailyReportsKeys.all })
  }, [queryClient])
}

export function useRefreshAllData() {
  const queryClient = useQueryClient()

  return useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: dailyReportsKeys.all }),
      queryClient.invalidateQueries({ queryKey: inspectionsKeys.all }),
      queryClient.invalidateQueries({ queryKey: maintenanceEventsKeys.all }),
    ])
  }, [queryClient])
}

// Prefetch Hooks for Performance
export function usePrefetchDailyReports() {
  const queryClient = useQueryClient()

  return useCallback((filters: DailyReportsFilters) => {
    queryClient.prefetchQuery({
      queryKey: dailyReportsKeys.list(filters),
      queryFn: () => dailyReportsApi.getDailyReports(filters),
      staleTime: 5 * 60 * 1000,
    })
  }, [queryClient])
}

export function usePrefetchInspection() {
  const queryClient = useQueryClient()

  return useCallback((inspectionId: number) => {
    queryClient.prefetchQuery({
      queryKey: inspectionsKeys.detail(inspectionId),
      queryFn: () => inspectionsApi.getInspection(inspectionId),
      staleTime: 2 * 60 * 1000,
    })
  }, [queryClient])
}

// Error Handling Hook
export function useApiErrorHandler() {
  return useCallback((error: any) => {
    console.error('API Error:', error)
    
    // You can add toast notifications here
    // toast.error(error.message || 'An error occurred')
    
    // Handle specific error types
    if (error.statusCode === 401) {
      // Redirect to login
      window.location.href = '/login'
    }
  }, [])
}
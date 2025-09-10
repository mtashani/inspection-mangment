'use client'

// Daily Reports Container Component
// Main container component that manages state and data fetching for Daily Reports

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  RefreshCw,
  Download,
  AlertTriangle,
  FileText,
  BarChart3
} from 'lucide-react'

import {
  DailyReportsFilters,
  DailyReportsContainerProps,
  HierarchicalItem,
  MaintenanceEventItem,
  InspectionItem,
  CreateDailyReportRequest,
  UpdateDailyReportRequest,
  MaintenanceEventStatus,
  InspectionStatus
} from '@/types/daily-reports'

import {
  useDailyReports,
  useDailyReportsSummary,
  useInspections,
  useMaintenanceEvents,
  useCreateDailyReport,
  useUpdateDailyReport,
  useDeleteDailyReport,
  useUpdateMaintenanceEventStatus,
  useCompleteInspection,
  useRefreshAllData,
  useApiErrorHandler
} from '@/hooks/use-daily-reports'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

import { SummaryCards } from './summary-cards'
import { FilterPanel } from './filter-panel'
import { HierarchicalList } from './hierarchical-list'
import { CreateReportModal } from './create-report-modal'
import { EditReportModal } from './edit-report-modal'
import { DailyReportsPageSkeleton, InlineLoadingSkeleton } from './daily-reports-skeleton'

/**
 * Daily Reports Container Component
 * 
 * This component manages the entire Daily Reports functionality including:
 * - Data fetching and state management
 * - Filter state and URL synchronization
 * - CRUD operations for daily reports
 * - Error handling and loading states
 */
export function DailyReportsContainer({ initialFilters = {} }: DailyReportsContainerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const handleApiError = useApiErrorHandler()
  const refreshAllData = useRefreshAllData()

  // State management
  const [filters, setFilters] = useState<DailyReportsFilters>(initialFilters)
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '')
  const [currentView, setCurrentView] = useState<'hierarchical' | 'analytics'>('hierarchical')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = useState(false)

  // Modal states
  const [createReportModal, setCreateReportModal] = useState<{
    isOpen: boolean
    inspectionId?: number
  }>({ isOpen: false })

  const [editReportModal, setEditReportModal] = useState<{
    isOpen: boolean
    reportId?: number
  }>({ isOpen: false })

  // Data fetching hooks
  const {
    data: dailyReports,
    loading: dailyReportsLoading,
    error: dailyReportsError,
    refetch: refetchDailyReports
  } = useDailyReports(filters)

  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary
  } = useDailyReportsSummary(filters)

  const {
    data: inspections,
    loading: inspectionsLoading,
    error: inspectionsError,
    refetch: refetchInspections
  } = useInspections(filters)

  const {
    data: maintenanceEvents,
    loading: maintenanceEventsLoading,
    error: maintenanceEventsError,
    refetch: refetchMaintenanceEvents
  } = useMaintenanceEvents(filters)

  // Mutation hooks
  const createDailyReportMutation = useCreateDailyReport()
  const updateDailyReportMutation = useUpdateDailyReport()
  const deleteDailyReportMutation = useDeleteDailyReport()
  const updateMaintenanceEventStatusMutation = useUpdateMaintenanceEventStatus()
  const completeInspectionMutation = useCompleteInspection()

  // Combine loading states
  const isLoading = dailyReportsLoading || summaryLoading || inspectionsLoading || maintenanceEventsLoading
  const hasError = dailyReportsError || summaryError || inspectionsError || maintenanceEventsError

  // Transform data into hierarchical structure
  const hierarchicalItems = useMemo((): HierarchicalItem[] => {
    const items: HierarchicalItem[] = []

    // Add maintenance events with their inspections
    if (maintenanceEvents) {
      maintenanceEvents.forEach(event => {
        const eventInspections = inspections?.filter(
          inspection => inspection.equipmentId && event.inspections?.some(
            eventInsp => eventInsp.id === inspection.id
          )
        ) || []

        const eventItem: MaintenanceEventItem = {
          type: 'maintenance',
          id: `maintenance-${event.id}`,
          data: event,
          children: eventInspections.map(inspection => ({
            type: 'inspection',
            id: `inspection-${inspection.id}`,
            data: inspection,
            children: inspection.dailyReports?.map(report => ({
              type: 'daily-report',
              id: `report-${report.id}`,
              data: report
            })) || []
          }))
        }

        items.push(eventItem)
      })
    }

    // Add standalone inspections (not part of maintenance events)
    if (inspections) {
      const standaloneInspections = inspections.filter(
        inspection => !maintenanceEvents?.some(event =>
          event.inspections?.some(eventInsp => eventInsp.id === inspection.id)
        )
      )

      standaloneInspections.forEach(inspection => {
        const inspectionItem: InspectionItem = {
          type: 'inspection',
          id: `inspection-${inspection.id}`,
          data: inspection,
          children: inspection.dailyReports?.map(report => ({
            type: 'daily-report',
            id: `report-${report.id}`,
            data: report
          })) || []
        }

        items.push(inspectionItem)
      })
    }

    return items
  }, [maintenanceEvents, inspections])

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return hierarchicalItems

    const query = searchQuery.toLowerCase()
    return hierarchicalItems.filter(item => {
      if (item.type === 'maintenance') {
        return (
          item.data.eventNumber.toLowerCase().includes(query) ||
          item.data.title.toLowerCase().includes(query) ||
          item.data.description?.toLowerCase().includes(query)
        )
      } else {
        return (
          item.data.inspectionNumber.toLowerCase().includes(query) ||
          item.data.title.toLowerCase().includes(query) ||
          item.data.description?.toLowerCase().includes(query) ||
          item.data.equipment?.tag.toLowerCase().includes(query)
        )
      }
    })
  }, [hierarchicalItems, searchQuery])

  // URL synchronization
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (filters.search) params.set('search', filters.search)
    if (filters.status) params.set('status', filters.status)
    if (filters.inspector) params.set('inspector', filters.inspector)
    if (filters.dateRange?.from) params.set('dateFrom', filters.dateRange.from)
    if (filters.dateRange?.to) params.set('dateTo', filters.dateRange.to)

    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.replace(`/daily-reports${newUrl}`, { scroll: false })
  }, [filters, router])

  // Event handlers
  const handleFiltersChange = useCallback((newFilters: DailyReportsFilters) => {
    setFilters(newFilters)
  }, [])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    setFilters(prev => ({ ...prev, search: query }))
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters({})
    setSearchQuery('')
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshAllData()
      toast({
        title: 'Data refreshed',
        description: 'All data has been updated successfully.',
      })
    } catch (error) {
      handleApiError(error)
    } finally {
      setRefreshing(false)
    }
  }, [refreshAllData, toast, handleApiError])

  const handleToggleExpanded = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }, [])

  const handleCreateReport = useCallback((inspectionId: number) => {
    setCreateReportModal({ isOpen: true, inspectionId })
  }, [])

  const handleEditReport = useCallback((reportId: number) => {
    setEditReportModal({ isOpen: true, reportId })
  }, [])

  const handleCreateReportSubmit = useCallback(async (data: CreateDailyReportRequest) => {
    try {
      await createDailyReportMutation.mutateAsync(data)
      setCreateReportModal({ isOpen: false })
      toast({
        title: 'Report created',
        description: 'Daily report has been created successfully.',
      })
    } catch (error) {
      handleApiError(error)
    }
  }, [createDailyReportMutation, toast, handleApiError])

  const handleUpdateReportSubmit = useCallback(async (reportId: number, data: UpdateDailyReportRequest) => {
    try {
      await updateDailyReportMutation.mutateAsync({ id: reportId, data })
      setEditReportModal({ isOpen: false })
      toast({
        title: 'Report updated',
        description: 'Daily report has been updated successfully.',
      })
    } catch (error) {
      handleApiError(error)
    }
  }, [updateDailyReportMutation, toast, handleApiError])

  const handleDeleteReport = useCallback(async (reportId: number) => {
    try {
      await deleteDailyReportMutation.mutateAsync(reportId)
      toast({
        title: 'Report deleted',
        description: 'Daily report has been deleted successfully.',
      })
    } catch (error) {
      handleApiError(error)
    }
  }, [deleteDailyReportMutation, toast, handleApiError])

  const handleStatusChange = useCallback(async (eventId: number, status: MaintenanceEventStatus) => {
    try {
      await updateMaintenanceEventStatusMutation.mutateAsync({ id: eventId, data: { status } })
      toast({
        title: 'Status updated',
        description: 'Maintenance event status has been updated successfully.',
      })
    } catch (error) {
      handleApiError(error)
    }
  }, [updateMaintenanceEventStatusMutation, toast, handleApiError])

  const handleCompleteInspection = useCallback(async (inspectionId: number) => {
    try {
      await completeInspectionMutation.mutateAsync({ id: inspectionId })
      toast({
        title: 'Inspection completed',
        description: 'Inspection has been marked as completed successfully.',
      })
    } catch (error) {
      handleApiError(error)
    }
  }, [completeInspectionMutation, toast, handleApiError])

  const handleSummaryCardClick = useCallback((metric: string) => {
    // Apply filters based on clicked metric
    switch (metric) {
      case 'activeInspections':
        setFilters(prev => ({ ...prev, status: InspectionStatus.IN_PROGRESS }))
        break
      case 'completedInspections':
        setFilters(prev => ({ ...prev, status: InspectionStatus.COMPLETED }))
        break
      case 'activeMaintenanceEvents':
        setFilters(prev => ({ ...prev, status: MaintenanceEventStatus.IN_PROGRESS }))
        break
      case 'overdueItems':
        // Filter for overdue items
        setFilters(prev => ({ 
          ...prev, 
          dateRange: { 
            from: '2020-01-01', 
            to: new Date().toISOString().split('T')[0] 
          } 
        }))
        break
    }
  }, [])

  // Render loading state
  if (isLoading && !refreshing) {
    return <DailyReportsPageSkeleton />
  }

  // Render error state
  if (hasError && !isLoading) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {dailyReportsError?.message || 
             summaryError?.message || 
             inspectionsError?.message || 
             maintenanceEventsError?.message ||
             'Failed to load data. Please try again.'}
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Showing {filteredItems.length} items
          </span>
          {searchQuery && (
            <span className="text-xs bg-muted px-2 py-1 rounded">
              Search: &quot;{searchQuery}&quot;
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <div className="flex items-center border rounded-md">
            <Button
              variant={currentView === 'hierarchical' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('hierarchical')}
              className="rounded-r-none"
            >
              <FileText className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              variant={currentView === 'analytics' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('analytics')}
              className="rounded-l-none"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Analytics
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <SummaryCards
          summary={summary}
          loading={summaryLoading}
          onCardClick={handleSummaryCardClick}
        />
      )}

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClearFilters={handleClearFilters}
      />

      {/* Main Content */}
      {currentView === 'hierarchical' ? (
        filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No items found</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Try adjusting your search query or filters'
                  : 'No maintenance events or inspections match your current filters'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <HierarchicalList
            items={filteredItems}
            loading={refreshing}
            onCreateReport={handleCreateReport}
            onEditReport={handleEditReport}
            onDeleteReport={handleDeleteReport}
            onStatusChange={handleStatusChange}
            onCompleteInspection={handleCompleteInspection}
            expandedItems={expandedItems}
            onToggleExpanded={handleToggleExpanded}
          />
        )
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Analytics View</h3>
          <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
        </div>
      )}

      {/* Modals */}
      <CreateReportModal
        isOpen={createReportModal.isOpen}
        onClose={() => setCreateReportModal({ isOpen: false })}
        inspectionId={createReportModal.inspectionId!}
        onSubmit={handleCreateReportSubmit}
      />

      <EditReportModal
        isOpen={editReportModal.isOpen}
        onClose={() => setEditReportModal({ isOpen: false })}
        reportId={editReportModal.reportId!}
        onSubmit={handleUpdateReportSubmit}
      />
    </div>
  )
}
'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

import {
  EnhancedMaintenanceEvent,
  FilterOptions,
  DailyReportsSummary,
  HierarchicalItem,
  InspectionGroup,
  MaintenanceEventGroup as MaintenanceEventGroupType,
  InspectionPlanCreateRequest
} from '@/types/enhanced-maintenance'

import { MaintenanceEventStatus, MaintenanceEventStatusEnum } from '@/types/maintenance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { PageLoadingSkeleton } from './LoadingSkeletons'
import { useMaintenanceToasts } from './ToastNotifications'

import {
  MaintenanceEventGroup,
  FilterAndSearchPanel,
  InspectionPlanningModal
} from '@/components/maintenance'

interface EnhancedDailyReportsPageProps {
  initialFilters?: FilterOptions
  defaultView?: 'hierarchical' | 'timeline' | 'analytics'
  enableExport?: boolean
  enableBulkOperations?: boolean
}

interface PageState {
  events: EnhancedMaintenanceEvent[]
  loading: boolean
  error: string | null
  summary: DailyReportsSummary | null
  selectedItems: string[]
  expandedEvents: Set<string>
}

const EnhancedDailyReportsPage: React.FC<EnhancedDailyReportsPageProps> = ({
  initialFilters = {},
  defaultView = 'hierarchical',
  enableExport = true,
  enableBulkOperations = false
}) => {
  const toast = useMaintenanceToasts()
  // State management
  const [pageState, setPageState] = useState<PageState>({
    events: [],
    loading: true,
    error: null,
    summary: null,
    selectedItems: [],
    expandedEvents: new Set()
  })

  const [filters, setFilters] = useState<FilterOptions>(initialFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentView, setCurrentView] = useState(defaultView)
  const [refreshing, setRefreshing] = useState(false)

  // Modal states
  const [inspectionPlanningModal, setInspectionPlanningModal] = useState<{
    isOpen: boolean
    eventId?: string
    subEventId?: string
  }>({
    isOpen: false
  })

  // Mock data for development - replace with actual API calls
  const mockEvents = useMemo((): EnhancedMaintenanceEvent[] => [
    {
      id: '1',
      eventNumber: 'MAINT-2025-001',
      title: 'Annual Overhaul GTU6',
      description: 'Complete overhaul of Gas Turbine Unit 6',
      eventType: 'OVERHAUL',
      status: MaintenanceEventStatusEnum.IN_PROGRESS,
      plannedStartDate: '2025-01-15',
      plannedEndDate: '2025-02-15',
      actualStartDate: '2025-01-16',
      createdBy: 'admin',
      createdAt: '2025-01-10T08:00:00Z',
      updatedAt: '2025-01-16T10:30:00Z',
      subEvents: [],
      completionPercentage: 45,
      category: 'Complex',
      plannedInspections: [],
      activeInspections: [],
      completedInspections: [],
      statistics: {
        totalPlannedInspections: 25,
        activeInspections: 8,
        completedInspections: 12,
        firstTimeInspectionsCount: 3,
        equipmentStatusBreakdown: {
          planned: 5,
          underInspection: 8,
          completed: 12
        }
      },
      requesterBreakdown: [
        {
          requester: 'Operations Team',
          department: 'Operations',
          plannedCount: 10,
          activeCount: 3,
          completedCount: 5,
          totalCount: 18
        },
        {
          requester: 'Maintenance Team',
          department: 'Maintenance',
          plannedCount: 5,
          activeCount: 2,
          completedCount: 4,
          totalCount: 11
        }
      ]
    }
  ], [])

  const mockSummary = useMemo((): DailyReportsSummary => ({
    activeInspections: 15,
    completedInspections: 45,
    activeMaintenanceEvents: 3,
    completedMaintenanceEvents: 12,
    reportsThisMonth: 128,
    activeInspectors: 8,
    overdueItems: 2,
    upcomingDeadlines: 6
  }), [])

  // Load data
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setPageState(prev => ({ ...prev, loading: true, error: null }))
    } else {
      setRefreshing(true)
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In real implementation, call API with filters
      // const response = await enhancedMaintenanceApi.getFilteredEvents(filters)
      
      setPageState(prev => ({
        ...prev,
        events: mockEvents,
        summary: mockSummary,
        loading: false,
        error: null
      }))
    } catch (error) {
      setPageState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }))
    } finally {
      setRefreshing(false)
    }
  }, [mockEvents, mockSummary])

  // Initial load
  useEffect(() => {
    loadData()
  }, [loadData])

  // Reload when filters change (excluding initial load)
  useEffect(() => {
    // Skip initial load - only reload if we already have data or error
    const hasInitialData = pageState.events.length > 0 || pageState.error !== null
    if (hasInitialData) {
      loadData(false)
    }
  }, [filters, loadData, pageState.events.length, pageState.error])

  // Event handlers
  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const handleEventUpdate = (updatedEvent: EnhancedMaintenanceEvent) => {
    setPageState(prev => ({
      ...prev,
      events: prev.events.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      )
    }))
  }

  const handleInspectionCreate = (eventId: string, subEventId?: string) => {
    setInspectionPlanningModal({
      isOpen: true,
      eventId,
      subEventId
    })
  }

  const handleInspectionPlanSubmit = async (data: InspectionPlanCreateRequest) => {
    try {
      // In real implementation, call API
      // await inspectionPlanningApi.createInspectionPlan(data)
      console.log('Creating inspection plan:', data)
      
      // Show success toast
      toast.notifyInspectionPlanCreated(data.equipmentTag || 'Equipment')
      
      // Refresh data
      await loadData(false)
    } catch (error) {
      console.error('Failed to create inspection plan:', error)
      toast.notifyValidationError('inspection plan')
    }
  }

  const handleStatusChange = async (eventId: string, status: MaintenanceEventStatus) => {
    try {
      // In real implementation, call API
      // await maintenanceApi.updateEventStatus(eventId, status)
      console.log('Changing status:', eventId, status)
      
      // Update local state
      setPageState(prev => ({
        ...prev,
        events: prev.events.map(event => 
          event.id === eventId ? { ...event, status } : event
        )
      }))
    } catch (error) {
      console.error('Failed to change status:', error)
    }
  }

  const handleToggleExpanded = (eventId: string) => {
    setPageState(prev => {
      const newExpanded = new Set(prev.expandedEvents)
      if (newExpanded.has(eventId)) {
        newExpanded.delete(eventId)
      } else {
        newExpanded.add(eventId)
      }
      return { ...prev, expandedEvents: newExpanded }
    })
  }

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return pageState.events

    const query = searchQuery.toLowerCase()
    return pageState.events.filter(event =>
      event.eventNumber.toLowerCase().includes(query) ||
      event.title.toLowerCase().includes(query) ||
      event.description?.toLowerCase().includes(query)
    )
  }, [pageState.events, searchQuery])

  // Render loading state
  if (pageState.loading) {
    return <PageLoadingSkeleton />
  }

  // Render error state
  if (pageState.error) {
    return (
      <div className="space-y-6">
        <Alert variant="error">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            {pageState.error}
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center">
          <Button onClick={() => loadData()} variant="outline">
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-base-content)]">Enhanced Daily Reports</h1>
          <p className="text-[var(--color-base-content)]/70 mt-1">
            Comprehensive view of maintenance events, inspections, and daily reports
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => loadData(false)}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {enableExport && (
            <Button variant="outline">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {pageState.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card variant="elevated">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-info)]">
                {pageState.summary.activeInspections}
              </div>
              <div className="text-sm text-[var(--color-base-content)]/70">Active Inspections</div>
            </CardContent>
          </Card>
          
          <Card variant="elevated">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-success)]">
                {pageState.summary.completedInspections}
              </div>
              <div className="text-sm text-[var(--color-base-content)]/70">Completed</div>
            </CardContent>
          </Card>
          
          <Card variant="elevated">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-primary)]">
                {pageState.summary.activeMaintenanceEvents}
              </div>
              <div className="text-sm text-[var(--color-base-content)]/70">Active Events</div>
            </CardContent>
          </Card>
          
          <Card variant="elevated">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-accent)]">
                {pageState.summary.reportsThisMonth}
              </div>
              <div className="text-sm text-[var(--color-base-content)]/70">Reports This Month</div>
            </CardContent>
          </Card>
          
          <Card variant="elevated">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-info)]">
                {pageState.summary.activeInspectors}
              </div>
              <div className="text-sm text-[var(--color-base-content)]/70">Active Inspectors</div>
            </CardContent>
          </Card>
          
          <Card variant="elevated">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-error)]">
                {pageState.summary.overdueItems}
              </div>
              <div className="text-sm text-[var(--color-base-content)]/70">Overdue Items</div>
            </CardContent>
          </Card>
          
          <Card variant="elevated">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-warning)]">
                {pageState.summary.upcomingDeadlines}
              </div>
              <div className="text-sm text-[var(--color-base-content)]/70">Upcoming Deadlines</div>
            </CardContent>
          </Card>
          
          <Card variant="elevated">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-secondary)]">
                {pageState.summary.completedMaintenanceEvents}
              </div>
              <div className="text-sm text-[var(--color-base-content)]/70">Completed Events</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <FilterAndSearchPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClearFilters={handleClearFilters}
        availableInspectors={['John Doe', 'Jane Smith', 'Mike Johnson']}
        availableRequesters={['Operations Team', 'Maintenance Team', 'Engineering']}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-[var(--color-base-content)]/70">
            Showing {filteredEvents.length} of {pageState.events.length} events
          </span>
          
          {searchQuery && (
            <Badge variant="outline">
              Search: "{searchQuery}&quot;
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={currentView === 'hierarchical' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('hierarchical')}
          >
            <DocumentTextIcon className="h-4 w-4 mr-1" />
            Hierarchical
          </Button>
          
          <Button
            variant={currentView === 'analytics' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('analytics')}
          >
            <ChartBarIcon className="h-4 w-4 mr-1" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {filteredEvents.length === 0 ? (
        <Card variant="ghost">
          <CardContent className="p-8 text-center">
            <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-[var(--color-base-content)]/30" />
            <h3 className="text-lg font-medium text-[var(--color-base-content)] mb-2">No events found</h3>
            <p className="text-[var(--color-base-content)]/70">
              {searchQuery 
                ? 'Try adjusting your search query or filters'
                : 'No maintenance events match your current filters'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <MaintenanceEventGroup
              key={event.id}
              event={event}
              onEventUpdate={handleEventUpdate}
              onInspectionCreate={handleInspectionCreate}
              onStatusChange={handleStatusChange}
              expanded={pageState.expandedEvents.has(event.id)}
              onToggleExpanded={handleToggleExpanded}
              showActions={true}
              showStatistics={true}
            />
          ))}
        </div>
      )}

      {/* Inspection Planning Modal */}
      <InspectionPlanningModal
        isOpen={inspectionPlanningModal.isOpen}
        onClose={() => setInspectionPlanningModal({ isOpen: false })}
        eventId={inspectionPlanningModal.eventId}
        subEventId={inspectionPlanningModal.subEventId}
        onSubmit={handleInspectionPlanSubmit}
        availableEquipment={[]} // In real implementation, fetch from API
        availableRequesters={['Operations Team', 'Maintenance Team', 'Engineering']}
      />
    </div>
  )
}

export default EnhancedDailyReportsPage
'use client'

import { FC, useState, useCallback, useEffect, useMemo } from 'react'
import { DateRange } from "react-day-picker"
import { NewInspectionFormValues, ReportFormValues, InspectionGroup, InspectionStatus } from "@/components/daily-reports/types"
import { NewInspectionForm } from "@/components/daily-reports/new-inspection-form"
import { Filters } from "@/components/daily-reports/filters"
import { InspectionGroupCard } from "@/components/daily-reports/inspection-group"
import { getInspections, createInspection, createDailyReport, updateDailyReport, deleteDailyReport, deleteInspection, toggleInspectionStatus } from "@/api/daily-reports"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const getBackendStatus = (status: string): InspectionStatus | undefined => {
  if (status === 'all') return undefined
  return status as InspectionStatus
}

const formatDateForAPI = (date: Date): string => {
  return format(date, 'yyyy-MM-dd')
}

const CARD_HEIGHT = 84 // px

const getLatestReportDate = (group: InspectionGroup): Date => {
  if (group.reports.length === 0) {
    return new Date(group.startDate)
  }
  return new Date(Math.max(...group.reports.map(report => new Date(report.date).getTime())))
}

const DailyReportsPage: FC = () => {
  // Data state
  const [inspectionGroups, setInspectionGroups] = useState<InspectionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Filters state
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedInspector, setSelectedInspector] = useState("all")
  
  // UI state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [editingReportId, setEditingReportId] = useState<string | null>(null)
  const [addingReportToGroup, setAddingReportToGroup] = useState<string | null>(null)

  // Fetch data
  const fetchInspections = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const dateRangeParam = dateRange?.from && dateRange?.to ? {
        from: formatDateForAPI(dateRange.from),
        to: formatDateForAPI(dateRange.to)
      } : undefined

      const { data } = await getInspections(
        getBackendStatus(selectedStatus),
        1,  // page
        1000,  // large page size to get all items
        dateRangeParam
      )

      // Sort inspections by latest report date
      const sortedData = [...data].sort((a, b) => {
        const dateA = getLatestReportDate(a)
        const dateB = getLatestReportDate(b)
        return dateB.getTime() - dateA.getTime()
      })

      setInspectionGroups(sortedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inspections')
    } finally {
      setLoading(false)
    }
  }, [selectedStatus, dateRange])

  useEffect(() => {
    fetchInspections()
  }, [fetchInspections])

  // Filter inspections based on search and inspector filter
  const filteredGroups = useMemo(() => {
    return inspectionGroups.filter(group => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const matchesEquipment = group.equipmentTag.toLowerCase().includes(searchLower)
        if (!matchesEquipment) {
          return false
        }
      }

      if (selectedInspector !== "all") {
        if (!group.reports.some(report => report.inspectors.includes(selectedInspector))) {
          return false
        }
      }

      return true
    })
  }, [inspectionGroups, searchQuery, selectedInspector])

  // Update CSS variables when filtered groups change
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--card-height', `${CARD_HEIGHT}px`)
    root.style.setProperty('--item-count', String(filteredGroups.length))
  }, [filteredGroups.length])

  const handleNewInspection = async (data: NewInspectionFormValues) => {
    try {
      setError(null)
      await createInspection(data)
      await fetchInspections()
    } catch (err) {
      if (err instanceof Error) {
        throw err
      }
      throw new Error('Failed to create inspection')
    }
  }

  const handleEditReport = async (reportId: string, data: ReportFormValues) => {
    try {
      setError(null)
      if (reportId === "new") {
        await handleAddReport(addingReportToGroup!, data)
      } else {
        await updateDailyReport(reportId, data)
        await fetchInspections()
      }
      setEditingReportId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report')
    }
  }

  const handleAddReport = async (groupId: string, data: ReportFormValues) => {
    try {
      setError(null)
      await createDailyReport(groupId, data)
      await fetchInspections()
      setAddingReportToGroup(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add report')
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    try {
      setError(null)
      await deleteDailyReport(reportId)
      await fetchInspections()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report')
    }
  }

  const handleDeleteInspection = async (inspectionId: string) => {
    try {
      setError(null)
      await deleteInspection(inspectionId)
      await fetchInspections()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete inspection')
    }
  }

  const handleToggleStatus = async (inspectionId: string) => {
    try {
      setError(null)
      await toggleInspectionStatus(inspectionId)
      await fetchInspections()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle inspection status')
    }
  }

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }, [])

  return (
    <div className="container mx-auto p-6 flex flex-col min-h-0">
      <h1 className="text-3xl font-bold mb-6 flex-none">Daily Inspection Reports</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex-none">
          {error}
        </div>
      )}

      <div className="flex-none mb-6">
        <NewInspectionForm onSubmit={handleNewInspection} />

        <Filters
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedInspector={selectedInspector}
          onInspectorChange={setSelectedInspector}
        />
      </div>

      <div className="inspection-list flex-none">
        <div className={cn(
          "inspection-list-content",
          filteredGroups.length > 10 && "scrollable"
        )}>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No inspection reports found
            </div>
          ) : (
            filteredGroups.map((group) => (
              <InspectionGroupCard
                key={group.id}
                group={group}
                isExpanded={expandedGroups.has(group.id)}
                editingReportId={editingReportId}
                onToggle={() => toggleGroup(group.id)}
                onEditReport={setEditingReportId}
                onSaveEdit={handleEditReport}
                onCancelEdit={() => {
                  setEditingReportId(null)
                  setAddingReportToGroup(null)
                }}
                onAddReport={() => setAddingReportToGroup(group.id)}
                onDeleteReport={handleDeleteReport}
                onDeleteInspection={handleDeleteInspection}
                onToggleStatus={handleToggleStatus}
                showAddForm={addingReportToGroup === group.id}
                dateRange={dateRange?.from && dateRange?.to ? {
                  from: dateRange.from,
                  to: dateRange.to
                } : undefined}
                selectedInspector={selectedInspector}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default DailyReportsPage

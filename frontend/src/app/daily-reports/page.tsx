'use client'

import { FC, useState, useCallback, useEffect, useMemo } from 'react'
import { DateRange } from "react-day-picker"
import { Card } from "@/components/ui/card"
import { NewInspectionForm } from "@/components/daily-reports/new-inspection-form"
import { Filters } from "@/components/daily-reports/filters"
import { InspectionGroupCard } from "@/components/daily-reports/inspection-group"
import { getInspections, createInspection, createDailyReport, updateDailyReport, deleteDailyReport, deleteInspection, toggleInspectionStatus } from "@/api/daily-reports"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ClipboardList, CheckCircle, Clock, Users } from "lucide-react"
import { NewInspectionFormValues, ReportFormValues, InspectionGroup, InspectionStatus } from "@/components/daily-reports/types"
import { SummaryCard } from "@/components/daily-reports/summary-card"

const DailyReportsPage: FC = () => {
  const [inspectionGroups, setInspectionGroups] = useState<InspectionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [searchQuery, setSearchQuery] = useState("_all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedInspector, setSelectedInspector] = useState("all")
  
  const existingInspections = useMemo(() => {
    return inspectionGroups
      .filter(group => group.status === 'IN_PROGRESS')
      .map(group => group.equipmentTag)
  }, [inspectionGroups])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [editingReportId, setEditingReportId] = useState<string | null>(null)
  const [addingReportToGroup, setAddingReportToGroup] = useState<string | null>(null)

  const equipmentTags = useMemo(() => {
    const tags = new Set(inspectionGroups.map(group => group.equipmentTag))
    return Array.from(tags).sort()
  }, [inspectionGroups])

  const stats = useMemo(() => {
    const totalActive = inspectionGroups.filter(g => g.status === 'IN_PROGRESS').length
    const totalCompleted = inspectionGroups.filter(g => g.status === 'COMPLETED').length
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)
    const reportsThisMonth = inspectionGroups.reduce((sum, group) => {
      return sum + group.reports.filter(report => {
        const reportDate = new Date(report.date)
        return reportDate >= thirtyDaysAgo && reportDate <= today
      }).length
    }, 0)
    const activeInspectors = new Set()
    inspectionGroups.forEach(group => {
      group.reports.forEach(report => {
        const reportDate = new Date(report.date)
        if (reportDate >= thirtyDaysAgo && reportDate <= today) {
          report.inspectors.forEach(inspector => activeInspectors.add(inspector))
        }
      })
    })
    return {
      activeInspections: totalActive,
      completedInspections: totalCompleted,
      reportsThisMonth,
      activeInspectors: activeInspectors.size
    }
  }, [inspectionGroups])

  const filteredGroups = useMemo(() => {
    return inspectionGroups.filter(group => {
      // Skip filtering if "_all" is selected
      if (searchQuery && searchQuery !== "_all" && !group.equipmentTag.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (selectedInspector !== "all" && !group.reports.some(report => 
        report.inspectors.includes(selectedInspector)
      )) {
        return false
      }
      return true
    })
  }, [inspectionGroups, searchQuery, selectedInspector])

  const fetchInspections = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const dateRangeParam = dateRange?.from && dateRange?.to ? {
        from: format(dateRange.from, 'yyyy-MM-dd'),
        to: format(dateRange.to, 'yyyy-MM-dd')
      } : undefined
      const { data } = await getInspections(
        selectedStatus !== 'all' ? selectedStatus as InspectionStatus : undefined,
        1,
        1000,
        dateRangeParam
      )
      const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.startDate)
        const dateB = new Date(b.startDate)
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

  const handleNewInspection = async (data: NewInspectionFormValues) => {
    try {
      setError(null)
      await createInspection(data)
      await fetchInspections()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create inspection')
    }
  }

  const handleEditReport = async (reportId: string, data: ReportFormValues) => {
    try {
      setError(null)
      if (reportId === "new") {
        await createDailyReport(addingReportToGroup!, data)
      } else {
        await updateDailyReport(reportId, data)
      }
      await fetchInspections()
      setEditingReportId(null)
      setAddingReportToGroup(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report')
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
      setError(err instanceof Error ? err.message : 'Failed to toggle status')
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
    <div className="container mx-auto py-10 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-base-content)]">Daily Inspection Reports</h1>
        <p className="text-sm text-[var(--color-base-content)]/70">
          Track and manage equipment inspection reports and progress
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Active Inspections"
          count={stats.activeInspections}
          variant="info"
          icon={ClipboardList}
        />
        <SummaryCard
          title="Completed Inspections"
          count={stats.completedInspections}
          variant="success"
          icon={CheckCircle}
        />
        <SummaryCard
          title="Reports This Month"
          count={stats.reportsThisMonth}
          variant="primary"
          icon={Clock}
        />
        <SummaryCard
          title="Active Inspectors"
          count={stats.activeInspectors}
          variant="warning"
          icon={Users}
        />
      </div>

      <Card variant="default" className="p-6">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <h2 className="text-lg font-semibold tracking-tight mb-4">New Inspection</h2>
              <NewInspectionForm
                onSubmit={handleNewInspection}
                equipmentTags={equipmentTags}
                existingInspections={existingInspections}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <Filters
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedInspector={selectedInspector}
              onInspectorChange={setSelectedInspector}
              equipmentTags={equipmentTags}
            />
          </div>
        </div>
      </Card>

      <div className={cn(
        "inspection-list space-y-4",
        loading ? "opacity-50" : ""
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
  )
}

export default DailyReportsPage

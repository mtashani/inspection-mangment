'use client'

import { useState } from 'react'
import { useDailyReports } from '@/hooks/use-maintenance-events'
import { DailyReportsList } from './daily-reports-list'
import { DailyReportsSkeleton } from './daily-reports-skeleton'
import { DailyReportsError } from './daily-reports-error'
import { DailyReportsEmpty } from './daily-reports-empty'
import { CreateReportModal } from './create-report-modal'
import { EditReportModal } from './edit-report-modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DailyReport, DailyReportsFilters } from '@/types/maintenance-events'
import { Plus, Search, FileText } from 'lucide-react'

interface EventDailyReportsTabProps {
  inspectionId: number
  inspectionTitle?: string
}

export function EventDailyReportsTab({ 
  inspectionId, 
  inspectionTitle 
}: EventDailyReportsTabProps) {
  const [filters, setFilters] = useState<DailyReportsFilters>({ 
    inspectionId 
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null)
  const [searchValue, setSearchValue] = useState('')

  // Fetch daily reports for this inspection
  const { data: reports, isLoading, error, refetch } = useDailyReports(filters)

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    setFilters(prev => ({
      ...prev,
      search: value || undefined
    }))
  }

  const handleCreateReport = () => {
    setShowCreateModal(true)
  }

  const handleEditReport = (report: DailyReport) => {
    setEditingReport(report)
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
  }

  const handleCloseEditModal = () => {
    setEditingReport(null)
  }

  const handleReportCreated = () => {
    setShowCreateModal(false)
    refetch()
  }

  const handleReportUpdated = () => {
    setEditingReport(null)
    refetch()
  }

  const handleRetry = () => {
    refetch()
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Daily Reports
                </CardTitle>
                {inspectionTitle && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Reports for: {inspectionTitle}
                  </p>
                )}
              </div>
              <Button onClick={handleCreateReport} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Report
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports by description or findings..."
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {isLoading ? (
          <DailyReportsSkeleton count={3} compact={true} />
        ) : error ? (
          <DailyReportsError error={error} onRetry={handleRetry} />
        ) : !reports || reports.length === 0 ? (
          <DailyReportsEmpty 
            title={searchValue ? "No matching reports found" : "No daily reports yet"}
            description={
              searchValue 
                ? "No reports match your search criteria. Try different keywords."
                : "No daily reports have been created for this inspection yet."
            }
            showCreateButton={!searchValue}
            onCreateReport={handleCreateReport}
          />
        ) : (
          <DailyReportsList 
            reports={reports}
            compact={true}
            showInspectionInfo={false}
            onEdit={handleEditReport}
          />
        )}
      </div>

      {/* Create Report Modal */}
      <CreateReportModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onSuccess={handleReportCreated}
        inspectionId={inspectionId}
      />

      {/* Edit Report Modal */}
      {editingReport && (
        <EditReportModal
          isOpen={true}
          onClose={handleCloseEditModal}
          onSuccess={handleReportUpdated}
          report={editingReport}
        />
      )}
    </>
  )
}
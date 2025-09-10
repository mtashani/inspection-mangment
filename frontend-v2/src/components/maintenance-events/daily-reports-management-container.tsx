'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DailyReportsFilters } from '@/types/maintenance-events'
import { useDailyReports } from '@/hooks/use-maintenance-events'
import { DailyReportsFilter } from './daily-reports-filter'
import { DailyReportsList } from './daily-reports-list'
import { DailyReportsSkeleton } from './daily-reports-skeleton'
import { DailyReportsError } from './daily-reports-error'
import { DailyReportsEmpty } from './daily-reports-empty'
import { BulkDeleteDialog } from './bulk-delete-dialog'
import { Button } from '@/components/ui/button'
import { ErrorBoundary, NetworkStatus } from '@/components/ui'
import { FileText, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'

interface DailyReportsManagementContainerProps {
  initialFilters?: Partial<DailyReportsFilters>
}

export function DailyReportsManagementContainer({ 
  initialFilters = {} 
}: DailyReportsManagementContainerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<DailyReportsFilters>(initialFilters as DailyReportsFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  // Fetch data
  const { data: reports, isLoading, error, refetch } = useDailyReports(filters)

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (searchQuery) params.set('search', searchQuery)
    if (filters.search) params.set('search', filters.search)
    if (filters.inspectionId) params.set('inspectionId', filters.inspectionId.toString())
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dateTo', filters.dateTo)
    
    const queryString = params.toString()
    const newUrl = queryString ? `?${queryString}` : ''
    
    // Only update URL if it's different from current
    if (newUrl !== `?${searchParams.toString()}`) {
      router.replace(`/daily-reports${newUrl}`, { scroll: false })
    }
  }, [filters, searchQuery, router, searchParams])

  const handleFiltersChange = (newFilters: DailyReportsFilters) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const handleRetry = () => {
    refetch()
  }

  const handleBulkDelete = (reportIds: number[]) => {
    // TODO: Implement bulk delete API call
    console.log('Bulk delete reports:', reportIds)
    setShowBulkDeleteDialog(false)
    refetch()
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6">
        {/* Network Status */}
        <NetworkStatus onRetry={handleRetry} />
        
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Daily Reports Management
          </h1>
          <p className="text-muted-foreground">
            Search and filter daily reports across all inspections
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reports && reports.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setShowBulkDeleteDialog(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Bulk Delete
            </Button>
          )}
          <Button asChild>
            <Link href="/daily-reports/create" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Report
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <DailyReportsFilter 
        filters={filters}
        onFiltersChange={handleFiltersChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearFilters={handleClearFilters}
      />
      
      {/* Results */}
      <div className="space-y-4">
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            {isLoading ? (
              <span>Loading reports...</span>
            ) : (
              <span>
                {reports?.length || 0} report{reports?.length !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
        </div>
        
        {/* Reports Content */}
        {isLoading ? (
          <DailyReportsSkeleton count={3} compact={false} />
        ) : error ? (
          <DailyReportsError error={error} onRetry={handleRetry} />
        ) : !reports || reports.length === 0 ? (
          <DailyReportsEmpty 
            title="No reports found"
            description="No daily reports match your current filters. Try adjusting your search criteria."
          />
        ) : (
          <DailyReportsList 
            reports={reports}
            compact={false}
            showInspectionInfo={true}
          />
        )}
      </div>

      {/* Bulk Delete Dialog */}
      {reports && (
        <BulkDeleteDialog
          isOpen={showBulkDeleteDialog}
          onClose={() => setShowBulkDeleteDialog(false)}
          onConfirm={handleBulkDelete}
          reports={reports}
          isLoading={false}
        />
      )}
      </div>
    </ErrorBoundary>
  )
}
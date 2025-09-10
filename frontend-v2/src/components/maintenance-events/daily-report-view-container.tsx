'use client'

import { useState } from 'react'
import { useDailyReport, useDeleteDailyReport } from '@/hooks/use-maintenance-events'
import { DailyReportView } from './daily-report-view'
import { DeleteConfirmationDialog } from './delete-confirmation-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Edit, FileText, AlertCircle, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'

interface DailyReportViewContainerProps {
  reportId: number
}

export function DailyReportViewContainer({ reportId }: DailyReportViewContainerProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { data: report, isLoading, error } = useDailyReport(reportId)
  const deleteReportMutation = useDeleteDailyReport()

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-16" />
          </div>
        </div>

        {/* Content Skeleton */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            
            <div className="space-y-4">
              <Skeleton className="h-4 w-20" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Daily Report</h1>
            <p className="text-muted-foreground">Report not found</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Error State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Failed to load report</h3>
              <p className="text-sm text-muted-foreground">
                {error.message || 'The requested daily report could not be found or loaded.'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button asChild>
                <Link href="/daily-reports">
                  <FileText className="mr-2 h-4 w-4" />
                  All Reports
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Daily Report</h1>
            <p className="text-muted-foreground">Report not found</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Not Found State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Report not found</h3>
              <p className="text-sm text-muted-foreground">
                The daily report with ID #{reportId} does not exist.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button asChild>
                <Link href="/daily-reports">
                  <FileText className="mr-2 h-4 w-4" />
                  All Reports
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Daily Report #{report.id}
          </h1>
          <p className="text-muted-foreground">
            View report details and findings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button asChild>
            <Link href={`/daily-reports/${report.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button 
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Report View */}
      <DailyReportView 
        report={report} 
        showInspectionInfo={true}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          deleteReportMutation.mutate(reportId, {
            onSuccess: () => {
              router.push('/daily-reports')
            }
          })
          setShowDeleteDialog(false)
        }}
        title="Delete Daily Report"
        description={`Are you sure you want to delete the daily report from ${report ? format(new Date(report.report_date), 'MMM dd, yyyy') : 'this date'}? This action cannot be undone.`}
        confirmText="delete"
        isLoading={deleteReportMutation.isPending}
      />
    </div>
  )
}
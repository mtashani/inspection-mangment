'use client'

import { useDailyReport, useUpdateDailyReport } from '@/hooks/use-maintenance-events'
import { DailyReportEditForm } from './daily-report-edit-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, AlertCircle, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DailyReportEditContainerProps {
  reportId: number
}

export function DailyReportEditContainer({ reportId }: DailyReportEditContainerProps) {
  const router = useRouter()
  const { data: report, isLoading, error } = useDailyReport(reportId)
  const updateReportMutation = useUpdateDailyReport()

  const handleSave = async (data: any) => {
    try {
      await updateReportMutation.mutateAsync({ id: reportId, data })
      router.push(`/daily-reports/${reportId}`)
    } catch (error) {
      // Error is handled by the mutation
      console.error('Failed to update report:', error)
    }
  }

  const handleCancel = () => {
    router.push(`/daily-reports/${reportId}`)
  }

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

        {/* Form Skeleton */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-20 w-full" />
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
            <h1 className="text-3xl font-bold tracking-tight">Edit Daily Report</h1>
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
            <h1 className="text-3xl font-bold tracking-tight">Edit Daily Report</h1>
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
            Edit Daily Report #{report.id}
          </h1>
          <p className="text-muted-foreground">
            Update report details and findings
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      {/* Edit Form */}
      <DailyReportEditForm 
        report={report}
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={updateReportMutation.isPending}
      />
    </div>
  )
}
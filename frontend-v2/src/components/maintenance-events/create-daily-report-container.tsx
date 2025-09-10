'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateDailyReport, useInspections } from '@/hooks/use-maintenance-events'
import { CreateDailyReportForm } from './create-daily-report-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText } from 'lucide-react'

interface CreateDailyReportContainerProps {
  preselectedInspectionId?: number
}

export function CreateDailyReportContainer({ 
  preselectedInspectionId 
}: CreateDailyReportContainerProps) {
  const router = useRouter()
  const createReportMutation = useCreateDailyReport()
  
  // Fetch inspections for selection
  const { data: inspections } = useInspections({})

  const handleSave = async (data: any) => {
    try {
      const newReport = await createReportMutation.mutateAsync(data)
      router.push(`/daily-reports/${newReport.id}`)
    } catch (error) {
      // Error is handled by the mutation
      console.error('Failed to create report:', error)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create Daily Report
          </h1>
          <p className="text-muted-foreground">
            Create a new daily report for an inspection
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            New Daily Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreateDailyReportForm 
            onSave={handleSave}
            onCancel={handleCancel}
            isLoading={createReportMutation.isPending}
            inspections={inspections}
            preselectedInspectionId={preselectedInspectionId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
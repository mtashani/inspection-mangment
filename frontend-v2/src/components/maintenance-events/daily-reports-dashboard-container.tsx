'use client'

import { useState } from 'react'
import { useDailyReports } from '@/hooks/use-maintenance-events'
import { DailyReportsStats } from './daily-reports-stats'
import { DailyReportsList } from './daily-reports-list'
import { DailyReportsSkeleton } from './daily-reports-skeleton'
import { DailyReportsError } from './daily-reports-error'
import { DailyReportsEmpty } from './daily-reports-empty'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  FileText, 
  Calendar, 
  TrendingUp,
  Filter,
  Download
} from 'lucide-react'
import Link from 'next/link'

export function DailyReportsDashboardContainer() {
  const [activeTab, setActiveTab] = useState('overview')
  
  // Fetch all daily reports for dashboard
  const { data: reports, isLoading, error, refetch } = useDailyReports({})

  const handleRetry = () => {
    refetch()
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export reports')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-muted animate-pulse rounded" />
            <div className="h-9 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-12 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Skeleton */}
        <DailyReportsSkeleton count={3} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Daily Reports Dashboard
            </h1>
            <p className="text-muted-foreground">
              Overview and analytics for all daily reports
            </p>
          </div>
        </div>

        <DailyReportsError error={error} onRetry={handleRetry} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Daily Reports Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview and analytics for all daily reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/daily-reports" className="gap-2">
              <Filter className="h-4 w-4" />
              Manage Reports
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      {!reports || reports.length === 0 ? (
        <DailyReportsEmpty 
          title="No daily reports available"
          description="No daily reports have been created yet across all inspections."
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-2">
              <Calendar className="h-4 w-4" />
              Recent Reports
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DailyReportsStats reports={reports} />
            
            {/* Recent Reports Preview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Reports
                  </CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/daily-reports">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DailyReportsList 
                  reports={reports.slice(0, 5)} // Show only first 5
                  compact={true}
                  showInspectionInfo={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  All Recent Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DailyReportsList 
                  reports={reports}
                  compact={false}
                  showInspectionInfo={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Placeholder for charts */}
              <Card>
                <CardHeader>
                  <CardTitle>Reports by Month</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Chart coming soon</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Findings Trends</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                    <p>Chart coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
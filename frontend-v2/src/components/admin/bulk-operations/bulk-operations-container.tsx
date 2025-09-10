'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileSpreadsheet, Upload, Download, History, Settings } from 'lucide-react'

import { ExcelImportExport } from './excel-import-export'
import { BatchOperationsInterface } from './batch-operations-interface'
import { OperationProgressTracker } from './operation-progress-tracker'
import { BulkOperationsHistory } from './bulk-operations-history'
import { getBulkOperationsStats } from '@/lib/api/admin/bulk-operations'

export function BulkOperationsContainer() {
  const [activeTab, setActiveTab] = useState('excel')

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['bulk-operations-stats'],
    queryFn: getBulkOperationsStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.totalOperations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statsLoading ? '...' : stats?.inProgressOperations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? '...' : stats?.completedOperations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsLoading ? '...' : stats?.failedOperations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Failed operations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Operation Types Overview */}
      {stats?.byType && Object.keys(stats.byType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Operations by Type</CardTitle>
            <CardDescription>
              Breakdown of operations by data type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byType).map(([type, count]) => (
                <Badge key={type} variant="secondary" className="text-sm">
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="excel" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Excel Import/Export
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Batch Operations
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Progress Tracking
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="excel" className="space-y-6">
          <ExcelImportExport />
        </TabsContent>

        <TabsContent value="batch" className="space-y-6">
          <BatchOperationsInterface />
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <OperationProgressTracker />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <BulkOperationsHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
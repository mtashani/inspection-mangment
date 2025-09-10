'use client'

import { FileText, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReportType } from '@/types/admin'

interface TemplateStats {
  total: number
  active: number
  inactive: number
  byType: Record<ReportType, number>
  recentlyCreated: number
  recentlyUsed: number
}

interface TemplateStatsCardsProps {
  stats: TemplateStats
}

export function TemplateStatsCards({ stats }: TemplateStatsCardsProps) {
  const reportTypeLabels: Record<ReportType, string> = {
    PSV: 'PSV',
    CRANE: 'Crane',
    CORROSION: 'Corrosion',
    GENERAL: 'General',
    MAINTENANCE: 'Maintenance'
  }

  const reportTypeColors: Record<ReportType, string> = {
    PSV: 'bg-blue-100 text-blue-800',
    CRANE: 'bg-green-100 text-green-800',
    CORROSION: 'bg-orange-100 text-orange-800',
    GENERAL: 'bg-gray-100 text-gray-800',
    MAINTENANCE: 'bg-purple-100 text-purple-800'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {/* Total Templates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            All report templates
          </p>
        </CardContent>
      </Card>

      {/* Active Templates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
          </p>
        </CardContent>
      </Card>

      {/* Inactive Templates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inactive Templates</CardTitle>
          <XCircle className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}% of total
          </p>
        </CardContent>
      </Card>

      {/* Recently Created */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recently Created</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.recentlyCreated}</div>
          <p className="text-xs text-muted-foreground">
            Last 7 days
          </p>
        </CardContent>
      </Card>

      {/* Recently Used */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recently Used</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.recentlyUsed}</div>
          <p className="text-xs text-muted-foreground">
            Last 7 days
          </p>
        </CardContent>
      </Card>

      {/* Templates by Type */}
      {Object.keys(stats.byType).length > 0 && (
        <Card className="md:col-span-2 lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Templates by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byType).map(([type, count]) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className={reportTypeColors[type as ReportType]}
                >
                  {reportTypeLabels[type as ReportType]}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
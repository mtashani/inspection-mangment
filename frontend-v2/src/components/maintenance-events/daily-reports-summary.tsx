'use client'

import { useMemo } from 'react'
import { DailyReport } from '@/types/maintenance-events'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Calendar, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday, startOfWeek, endOfWeek, subDays } from 'date-fns'

interface DailyReportsSummaryProps {
  reports: DailyReport[]
  inspectionId?: number
  className?: string
}

export function DailyReportsSummary({ reports, inspectionId, className }: DailyReportsSummaryProps) {
  const stats = useMemo(() => {
    const total = reports.length
    
    // Recent activity
    const today = reports.filter(r => isToday(new Date(r.report_date))).length
    const yesterday = reports.filter(r => isYesterday(new Date(r.report_date))).length
    
    // This week
    const weekStart = startOfWeek(new Date())
    const weekEnd = endOfWeek(new Date())
    const thisWeek = reports.filter(r => {
      const reportDate = new Date(r.report_date)
      return reportDate >= weekStart && reportDate <= weekEnd
    }).length

    // Reports with findings/issues
    const withFindings = reports.filter(r => 
      r.findings && r.findings.trim().length > 0
    ).length
    
    const withRecommendations = reports.filter(r => 
      r.recommendations && r.recommendations.trim().length > 0
    ).length

    // Unique inspectors
    const allInspectorIds = reports.flatMap(r => r.inspector_ids || [])
    const uniqueInspectors = [...new Set(allInspectorIds)].length

    // Recent streak (consecutive days with reports)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i)
      return format(date, 'yyyy-MM-dd')
    }).reverse()
    
    let currentStreak = 0
    for (const dateStr of last7Days.reverse()) {
      const hasReport = reports.some(r => 
        format(new Date(r.report_date), 'yyyy-MM-dd') === dateStr
      )
      if (hasReport) {
        currentStreak++
      } else {
        break
      }
    }

    // Latest report
    const latestReport = reports.length > 0 
      ? reports.reduce((latest, current) => 
          new Date(current.report_date) > new Date(latest.report_date) ? current : latest
        )
      : null

    return {
      total,
      today,
      yesterday,
      thisWeek,
      withFindings,
      withRecommendations,
      uniqueInspectors,
      currentStreak,
      latestReport
    }
  }, [reports])

  if (stats.total === 0) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-3">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-1">
            <h3 className="text-sm font-medium">No Daily Reports</h3>
            <p className="text-xs text-muted-foreground">
              Daily reports will appear here once inspectors start logging their activities
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Daily Reports Summary
            </CardTitle>
            <CardDescription>
              {stats.total} total report{stats.total !== 1 ? 's' : ''} • {stats.uniqueInspectors} inspector{stats.uniqueInspectors !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          {stats.currentStreak > 0 && (
            <Badge variant="outline" className="gap-1">
              <Target className="h-3 w-3" />
              {stats.currentStreak} day streak
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Recent Activity */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-lg font-bold text-green-600">{stats.today}</span>
            </div>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-lg font-bold text-blue-600">{stats.yesterday}</span>
            </div>
            <p className="text-xs text-muted-foreground">Yesterday</p>
          </div>
          
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-lg font-bold text-purple-600">{stats.thisWeek}</span>
            </div>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  {stats.withFindings} with Findings
                </p>
                <p className="text-xs text-yellow-600">
                  {stats.total > 0 ? Math.round((stats.withFindings / stats.total) * 100) : 0}% of reports
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">
                  {stats.withRecommendations} with Recommendations
                </p>
                <p className="text-xs text-blue-600">
                  {stats.total > 0 ? Math.round((stats.withRecommendations / stats.total) * 100) : 0}% of reports
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Report */}
        {stats.latestReport && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Latest Report</h4>
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {format(new Date(stats.latestReport.report_date), 'MMM dd, yyyy')}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {isToday(new Date(stats.latestReport.report_date)) ? 'Today' : 
                   isYesterday(new Date(stats.latestReport.report_date)) ? 'Yesterday' : 
                   format(new Date(stats.latestReport.report_date), 'MMM dd')}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground line-clamp-2">
                {stats.latestReport.description || 'No description provided'}
              </p>
              
              {stats.latestReport.inspector_names && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {stats.latestReport.inspector_names}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reporting Streak Info */}
        {stats.currentStreak > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Target className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  {stats.currentStreak} Day Reporting Streak! 🔥
                </p>
                <p className="text-xs text-green-600">
                  Keep up the consistent reporting
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
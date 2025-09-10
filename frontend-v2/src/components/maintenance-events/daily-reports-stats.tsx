'use client'

import { DailyReport } from '@/types/maintenance-events'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Clock
} from 'lucide-react'
import { format, isToday, isYesterday, startOfWeek, endOfWeek } from 'date-fns'

interface DailyReportsStatsProps {
  reports: DailyReport[]
}

export function DailyReportsStats({ reports }: DailyReportsStatsProps) {
  // Calculate stats
  const totalReports = reports.length
  const reportsWithFindings = reports.filter(r => r.findings && r.findings.trim().length > 0).length
  const reportsWithRecommendations = reports.filter(r => r.recommendations && r.recommendations.trim().length > 0).length
  
  // Recent reports (today and yesterday)
  const todayReports = reports.filter(r => isToday(new Date(r.report_date))).length
  const yesterdayReports = reports.filter(r => isYesterday(new Date(r.report_date))).length
  
  // This week reports
  const weekStart = startOfWeek(new Date())
  const weekEnd = endOfWeek(new Date())
  const thisWeekReports = reports.filter(r => {
    const reportDate = new Date(r.report_date)
    return reportDate >= weekStart && reportDate <= weekEnd
  }).length

  // Latest report
  const latestReport = reports.length > 0 
    ? reports.reduce((latest, current) => 
        new Date(current.report_date) > new Date(latest.report_date) ? current : latest
      )
    : null

  const stats = [
    {
      title: 'Total Reports',
      value: totalReports,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'With Findings',
      value: reportsWithFindings,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'With Recommendations',
      value: reportsWithRecommendations,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'This Week',
      value: thisWeekReports,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{todayReports}</p>
              <p className="text-sm text-muted-foreground">Reports Today</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{yesterdayReports}</p>
              <p className="text-sm text-muted-foreground">Reports Yesterday</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{thisWeekReports}</p>
              <p className="text-sm text-muted-foreground">Reports This Week</p>
            </div>
          </div>

          {/* Latest Report Info */}
          {latestReport && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Latest Report</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(latestReport.report_date), 'MMM dd, yyyy')} by {latestReport.inspector_name}
                  </p>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {isToday(new Date(latestReport.report_date)) 
                    ? 'Today' 
                    : isYesterday(new Date(latestReport.report_date))
                    ? 'Yesterday'
                    : format(new Date(latestReport.report_date), 'MMM dd')
                  }
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
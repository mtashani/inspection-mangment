'use client'

import { useMemo } from 'react'
import { Inspection, InspectionStatus } from '@/types/maintenance-events'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Pause,
  Target,
  TrendingUp,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, differenceInDays, isAfter, isBefore } from 'date-fns'

interface InspectionProgressTrackerProps {
  inspections: Inspection[]
  className?: string
}

export function InspectionProgressTracker({ inspections, className }: InspectionProgressTrackerProps) {
  const stats = useMemo(() => {
    const total = inspections.length
    const completed = inspections.filter(i => i.status === InspectionStatus.Completed).length
    const inProgress = inspections.filter(i => i.status === InspectionStatus.InProgress).length
    const onHold = inspections.filter(i => i.status === InspectionStatus.OnHold).length
    const cancelled = inspections.filter(i => i.status === InspectionStatus.Cancelled).length
    const overdue = inspections.filter(i => 
      i.end_date && 
      isAfter(new Date(), new Date(i.end_date)) && 
      i.status !== InspectionStatus.Completed
    ).length

    const completionRate = total > 0 ? (completed / total) * 100 : 0
    
    // Calculate upcoming deadlines (next 7 days)
    const upcomingDeadlines = inspections.filter(i => {
      if (!i.end_date || i.status === InspectionStatus.Completed) return false
      const daysUntilDeadline = differenceInDays(new Date(i.end_date), new Date())
      return daysUntilDeadline >= 0 && daysUntilDeadline <= 7
    }).length

    return {
      total,
      completed,
      inProgress,
      onHold,
      cancelled,
      overdue,
      completionRate,
      upcomingDeadlines
    }
  }, [inspections])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'inProgress':
        return 'text-blue-600'
      case 'planned':
        return 'text-orange-600'
      case 'overdue':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500'
    if (rate >= 60) return 'bg-blue-500'
    if (rate >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Inspection Progress
            </CardTitle>
            <CardDescription>
              {stats.total} total inspections • {stats.completionRate.toFixed(0)}% complete
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            {stats.completionRate.toFixed(0)}%
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{stats.completed}/{stats.total}</span>
          </div>
          <div className="relative">
            <Progress value={stats.completionRate} className="h-3" />
            <div 
              className={cn(
                'absolute inset-y-0 left-0 rounded-full transition-all',
                getProgressColor(stats.completionRate)
              )}
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className={cn('h-4 w-4', getStatusColor('completed'))} />
              <span className="text-lg font-bold text-green-600">{stats.completed}</span>
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Clock className={cn('h-4 w-4', getStatusColor('inProgress'))} />
              <span className="text-lg font-bold text-blue-600">{stats.inProgress}</span>
            </div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
          
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Pause className={cn('h-4 w-4', getStatusColor('onHold'))} />
              <span className="text-lg font-bold text-orange-600">{stats.onHold}</span>
            </div>
            <p className="text-xs text-muted-foreground">On Hold</p>
          </div>
          
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className={cn('h-4 w-4', getStatusColor('overdue'))} />
              <span className="text-lg font-bold text-red-600">{stats.overdue}</span>
            </div>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </div>
        </div>

        {/* Alerts */}
        {(stats.overdue > 0 || stats.upcomingDeadlines > 0) && (
          <div className="space-y-2">
            {stats.overdue > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">
                    {stats.overdue} inspection{stats.overdue !== 1 ? 's' : ''} overdue
                  </p>
                  <p className="text-xs text-red-600">
                    Requires immediate attention
                  </p>
                </div>
              </div>
            )}
            
            {stats.upcomingDeadlines > 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Calendar className="h-4 w-4 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    {stats.upcomingDeadlines} deadline{stats.upcomingDeadlines !== 1 ? 's' : ''} this week
                  </p>
                  <p className="text-xs text-yellow-600">
                    Plan ahead to avoid delays
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity Preview */}
        {stats.total > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
            <div className="space-y-1">
              {inspections
                .filter(i => i.status === InspectionStatus.Completed)
                .slice(0, 2)
                .map(inspection => (
                  <div key={inspection.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate">
                      {inspection.inspection_number} - {inspection.equipment_tag}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Completed
                    </Badge>
                  </div>
                ))}
              {stats.completed === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No completed inspections yet
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
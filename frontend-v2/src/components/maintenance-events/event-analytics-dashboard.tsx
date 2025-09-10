'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Users,
  Calendar
} from 'lucide-react'
import { useEventAnalytics } from '@/hooks/use-event-analytics'
import { cn } from '@/lib/utils'

interface EventAnalyticsDashboardProps {
  eventId: string | number
  className?: string
}

export function EventAnalyticsDashboard({ eventId, className }: EventAnalyticsDashboardProps) {
  const { summary, gapAnalysis, departmentPerformance, inspectionPlans, isLoading, hasError } = useEventAnalytics(eventId)

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Failed to load analytics</h3>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Planned Inspections</p>
                <p className="text-2xl font-bold">{summary.data?.planned_count || 0}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                {summary.data?.planned_done || 0} completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unplanned Inspections</p>
                <p className="text-2xl font-bold">{summary.data?.unplanned_count || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                {summary.data?.unplanned_done || 0} completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold">{summary.data?.overall_completion_rate || 0}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <Progress value={summary.data?.overall_completion_rate || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Completed</p>
                <p className="text-2xl font-bold">{summary.data?.total_completed || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                of {summary.data?.total_inspections || 0} total
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="gap-analysis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gap-analysis">Gap Analysis</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="plans">Inspection Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="gap-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Equipment Coverage Analysis
              </CardTitle>
              <CardDescription>
                Planned vs actual inspection coverage by equipment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gapAnalysis.data?.equipment_analysis.length ? (
                <div className="space-y-4">
                  {gapAnalysis.data.equipment_analysis.map((equipment) => (
                    <div key={equipment.equipment_tag} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{equipment.equipment_tag}</h4>
                          <p className="text-sm text-muted-foreground">{equipment.equipment_description}</p>
                        </div>
                        <Badge variant={equipment.gap > 0 ? "destructive" : "default"}>
                          {equipment.gap > 0 ? `${equipment.gap} gap` : 'Complete'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Planned:</span>
                          <span className="ml-2 font-medium">{equipment.planned_count}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Done:</span>
                          <span className="ml-2 font-medium">{equipment.planned_done}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Unplanned:</span>
                          <span className="ml-2 font-medium">{equipment.unplanned_done}</span>
                        </div>
                      </div>
                      {equipment.coverage_rate !== null && (
                        <div className="mt-2">
                          <Progress value={equipment.coverage_rate} className="h-2" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No equipment data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Department Performance
              </CardTitle>
              <CardDescription>
                Inspection completion rates by requesting department
              </CardDescription>
            </CardHeader>
            <CardContent>
              {departmentPerformance.data?.department_performance.length ? (
                <div className="space-y-4">
                  {departmentPerformance.data.department_performance.map((dept) => (
                    <div key={dept.department} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{dept.department.replace(/([A-Z])/g, ' $1').trim()}</h4>
                        <Badge variant={dept.completion_rate >= 80 ? "default" : "secondary"}>
                          {dept.completion_rate}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-muted-foreground">Planned:</span>
                          <span className="ml-2 font-medium">{dept.planned_count}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Completed:</span>
                          <span className="ml-2 font-medium">{dept.completed_count}</span>
                        </div>
                      </div>
                      <Progress value={dept.completion_rate} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No department data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Inspection Plans Overview
              </CardTitle>
              <CardDescription>
                Status of all planned inspections for this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inspectionPlans.data?.length ? (
                <div className="space-y-3">
                  {inspectionPlans.data.map((plan) => (
                    <div key={plan.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{plan.equipment_tag}</h4>
                          <p className="text-sm text-muted-foreground">{plan.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            plan.status === 'Completed' ? 'default' :
                            plan.status === 'InProgress' ? 'secondary' :
                            'outline'
                          }>
                            {plan.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{plan.requester}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No inspection plans found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
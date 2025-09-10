'use client'

import React from 'react'
import { 
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  StarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

import { 
  EventStatistics as EventStatisticsType, 
  RequesterBreakdown,
  RefineryDepartment 
} from '@/types/enhanced-maintenance'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface EventStatisticsProps {
  statistics: EventStatisticsType
  requesterBreakdown: RequesterBreakdown[]
  eventId: string
  compact?: boolean
}

interface StatisticCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  description?: string
  compact?: boolean
}

const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  description,
  compact = false
}) => {
  return (
    <Card className={cn(compact ? "p-3" : "p-4")}>
      <CardContent className="p-0">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "p-2 rounded-lg",
            color
          )}>
            <Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5", "text-white")} />
          </div>
          
          <div className="flex-1">
            <div className={cn(
              "font-bold text-gray-900",
              compact ? "text-lg" : "text-2xl"
            )}>
              {value}
            </div>
            <div className={cn(
              "text-gray-600",
              compact ? "text-xs" : "text-sm"
            )}>
              {title}
            </div>
            {description && !compact && (
              <div className="text-xs text-gray-500 mt-1">
                {description}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface RequesterBreakdownCardProps {
  breakdown: RequesterBreakdown[]
  compact?: boolean
}

const RequesterBreakdownCard: React.FC<RequesterBreakdownCardProps> = ({
  breakdown,
  compact = false
}) => {
  const getDepartmentColor = (department: RefineryDepartment): string => {
    switch (department) {
      case RefineryDepartment.Operations:
        return 'bg-blue-500'
      case RefineryDepartment.Maintenance:
        return 'bg-orange-500'
      case RefineryDepartment.Engineering:
        return 'bg-purple-500'
      case RefineryDepartment.Safety:
        return 'bg-red-500'
      case RefineryDepartment.Quality:
        return 'bg-green-500'
      case RefineryDepartment.Inspection:
        return 'bg-teal-500'
      default:
        return 'bg-gray-500'
    }
  }

  const sortedBreakdown = [...breakdown].sort((a, b) => b.totalCount - a.totalCount)

  if (breakdown.length === 0) {
    return (
      <Card>
        <CardHeader className={cn(compact ? "pb-2" : "pb-3")}>
          <CardTitle className={cn(compact ? "text-sm" : "text-base")}>
            Requester Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <UserGroupIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No requester data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className={cn(compact ? "pb-2" : "pb-3")}>
        <CardTitle className={cn(compact ? "text-sm" : "text-base")}>
          Requester Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedBreakdown.map((item, index) => {
          const completionRate = item.totalCount > 0 
            ? Math.round((item.completedCount / item.totalCount) * 100)
            : 0

          return (
            <div key={`${item.requester}-${index}`} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    getDepartmentColor(item.department)
                  )} />
                  <div>
                    <span className={cn(
                      "font-medium text-gray-900",
                      compact ? "text-sm" : "text-base"
                    )}>
                      {item.requester}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={cn("ml-2", compact ? "text-xs" : "text-xs")}
                    >
                      {item.department}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={cn(
                    "font-semibold text-gray-900",
                    compact ? "text-sm" : "text-base"
                  )}>
                    {item.totalCount}
                  </div>
                  <div className="text-xs text-gray-500">
                    {completionRate}% complete
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Progress value={completionRate} className="h-2" />
                
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>{item.plannedCount} planned</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span>{item.activeCount} active</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>{item.completedCount} completed</span>
                    </span>
                  </div>
                </div>
              </div>

              {index < sortedBreakdown.length - 1 && (
                <Separator className="mt-3" />
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

interface EquipmentStatusOverviewProps {
  equipmentStatusBreakdown: {
    planned: number
    underInspection: number
    completed: number
  }
  compact?: boolean
}

const EquipmentStatusOverview: React.FC<EquipmentStatusOverviewProps> = ({
  equipmentStatusBreakdown,
  compact = false
}) => {
  const total = equipmentStatusBreakdown.planned + 
                equipmentStatusBreakdown.underInspection + 
                equipmentStatusBreakdown.completed

  const plannedPercentage = total > 0 ? (equipmentStatusBreakdown.planned / total) * 100 : 0
  const underInspectionPercentage = total > 0 ? (equipmentStatusBreakdown.underInspection / total) * 100 : 0
  const completedPercentage = total > 0 ? (equipmentStatusBreakdown.completed / total) * 100 : 0

  return (
    <Card>
      <CardHeader className={cn(compact ? "pb-2" : "pb-3")}>
        <CardTitle className={cn(compact ? "text-sm" : "text-base")}>
          Equipment Status Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className={cn(
              "font-bold text-blue-600",
              compact ? "text-lg" : "text-xl"
            )}>
              {equipmentStatusBreakdown.planned}
            </div>
            <div className="text-xs text-blue-800">Planned</div>
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className={cn(
              "font-bold text-yellow-600",
              compact ? "text-lg" : "text-xl"
            )}>
              {equipmentStatusBreakdown.underInspection}
            </div>
            <div className="text-xs text-yellow-800">Under Inspection</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className={cn(
              "font-bold text-green-600",
              compact ? "text-lg" : "text-xl"
            )}>
              {equipmentStatusBreakdown.completed}
            </div>
            <div className="text-xs text-green-800">Completed</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-medium">
              {total > 0 ? Math.round(completedPercentage) : 0}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="h-full flex">
              <div 
                className="bg-green-500 transition-all duration-300"
                style={{ width: `${completedPercentage}%` }}
              />
              <div 
                className="bg-yellow-500 transition-all duration-300"
                style={{ width: `${underInspectionPercentage}%` }}
              />
              <div 
                className="bg-blue-500 transition-all duration-300"
                style={{ width: `${plannedPercentage}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{Math.round(completedPercentage)}% completed</span>
            <span>{Math.round(underInspectionPercentage)}% in progress</span>
            <span>{Math.round(plannedPercentage)}% planned</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const EventStatistics: React.FC<EventStatisticsProps> = ({
  statistics,
  requesterBreakdown,
  eventId,
  compact = false
}) => {
  const totalInspections = statistics.totalPlannedInspections + 
                          statistics.activeInspections + 
                          statistics.completedInspections

  const completionRate = totalInspections > 0 
    ? Math.round((statistics.completedInspections / totalInspections) * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Main Statistics Grid */}
      <div className={cn(
        "grid gap-4",
        compact ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      )}>
        <StatisticCard
          title="Total Planned"
          value={statistics.totalPlannedInspections}
          icon={ClockIcon}
          color="bg-blue-500"
          description="Inspections in planning phase"
          compact={compact}
        />
        
        <StatisticCard
          title="Active"
          value={statistics.activeInspections}
          icon={ExclamationTriangleIcon}
          color="bg-yellow-500"
          description="Currently in progress"
          compact={compact}
        />
        
        <StatisticCard
          title="Completed"
          value={statistics.completedInspections}
          icon={CheckCircleIcon}
          color="bg-green-500"
          description={`${completionRate}% completion rate`}
          compact={compact}
        />
        
        <StatisticCard
          title="First Time"
          value={statistics.firstTimeInspectionsCount}
          icon={StarIcon}
          color="bg-purple-500"
          description="New equipment inspections"
          compact={compact}
        />
      </div>

      {/* Detailed Breakdown */}
      {!compact && (
        <div className="grid gap-4 md:grid-cols-2">
          <EquipmentStatusOverview
            equipmentStatusBreakdown={statistics.equipmentStatusBreakdown}
            compact={compact}
          />
          
          <RequesterBreakdownCard
            breakdown={requesterBreakdown}
            compact={compact}
          />
        </div>
      )}

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h4 className="font-medium text-gray-900">
                Event Progress Summary
              </h4>
              <p className="text-sm text-gray-600">
                {statistics.completedInspections} of {totalInspections} inspections completed
                {statistics.firstTimeInspectionsCount > 0 && 
                  `, including ${statistics.firstTimeInspectionsCount} first-time inspections`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EventStatistics
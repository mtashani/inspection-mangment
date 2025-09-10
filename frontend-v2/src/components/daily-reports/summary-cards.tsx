'use client'

// Summary Cards Component
// Displays key metrics and statistics for Daily Reports

import React from 'react'
import { 
  Activity,
  CheckCircle,
  Settings,
  FileText,
  Users,
  AlertTriangle,
  Clock,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DailyReportsSummary, SummaryCardsProps } from '@/types/daily-reports'

/**
 * Summary Cards Component
 * 
 * Displays a grid of metric cards showing key statistics for daily reports.
 * Each card is clickable and can trigger filters.
 */
export function SummaryCards({ 
  summary, 
  loading = false, 
  onCardClick 
}: SummaryCardsProps) {
  if (loading) {
    return <SummaryCardsSkeleton />
  }

  if (!summary) {
    return null
  }

  const cards = [
    {
      id: 'activeInspections',
      title: 'Active Inspections',
      value: summary.activeInspections,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Currently in progress',
      trend: summary.activeInspections > 0 ? 'stable' : 'none'
    },
    {
      id: 'completedInspections',
      title: 'Completed',
      value: summary.completedInspections,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'Successfully finished',
      trend: 'up'
    },
    {
      id: 'activeMaintenanceEvents',
      title: 'Active Events',
      value: summary.activeMaintenanceEvents,
      icon: Settings,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Maintenance ongoing',
      trend: summary.activeMaintenanceEvents > 0 ? 'stable' : 'none'
    },
    {
      id: 'reportsThisMonth',
      title: 'Reports This Month',
      value: summary.reportsThisMonth,
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      description: 'Monthly reports',
      trend: 'up'
    },
    {
      id: 'activeInspectors',
      title: 'Active Inspectors',
      value: summary.activeInspectors,
      icon: Users,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      description: 'Currently working',
      trend: 'stable'
    },
    {
      id: 'overdueItems',
      title: 'Overdue Items',
      value: summary.overdueItems,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: 'Require attention',
      trend: summary.overdueItems > 0 ? 'warning' : 'none',
      isWarning: summary.overdueItems > 0
    },
    {
      id: 'upcomingDeadlines',
      title: 'Upcoming Deadlines',
      value: summary.upcomingDeadlines,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      description: 'Next 7 days',
      trend: summary.upcomingDeadlines > 0 ? 'warning' : 'none'
    },
    {
      id: 'completedMaintenanceEvents',
      title: 'Completed Events',
      value: summary.completedMaintenanceEvents,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      description: 'Maintenance finished',
      trend: 'up'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {cards.map((card) => (
        <SummaryCard
          key={card.id}
          {...card}
          onClick={() => onCardClick?.(card.id)}
        />
      ))}
    </div>
  )
}

/**
 * Individual Summary Card Component
 */
interface SummaryCardData {
  id: string
  title: string
  value: number
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  description: string
  trend: 'up' | 'down' | 'stable' | 'warning' | 'none'
  isWarning?: boolean
  onClick?: () => void
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  borderColor,
  description,
  trend,
  isWarning = false,
  onClick
}: SummaryCardData) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105",
        "border-2",
        borderColor,
        isWarning && "ring-2 ring-red-200 ring-opacity-50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={cn("p-2 rounded-lg", bgColor)}>
            <Icon className={cn("h-4 w-4", color)} />
          </div>
          {trend !== 'none' && <TrendIndicator trend={trend} />}
        </div>
        
        <div className="space-y-1">
          <div className="text-2xl font-bold tracking-tight">
            {value.toLocaleString()}
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            {title}
          </div>
          <div className="text-xs text-muted-foreground">
            {description}
          </div>
        </div>

        {isWarning && value > 0 && (
          <Badge variant="destructive" className="mt-2 text-xs">
            Needs Attention
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Trend Indicator Component
 */
function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'stable' | 'warning' | 'none' }) {
  if (trend === 'none') return null

  const indicators = {
    up: { icon: '↗', color: 'text-green-600', bg: 'bg-green-100' },
    down: { icon: '↘', color: 'text-red-600', bg: 'bg-red-100' },
    stable: { icon: '→', color: 'text-blue-600', bg: 'bg-blue-100' },
    warning: { icon: '⚠', color: 'text-orange-600', bg: 'bg-orange-100' }
  }

  const indicator = indicators[trend]

  return (
    <div className={cn(
      "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
      indicator.color,
      indicator.bg
    )}>
      {indicator.icon}
    </div>
  )
}

/**
 * Loading Skeleton for Summary Cards
 */
export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index} className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Compact Summary Cards for Mobile
 */
export function CompactSummaryCards({ summary, onCardClick }: SummaryCardsProps) {
  if (!summary) return null

  const priorityCards = [
    {
      id: 'activeInspections',
      title: 'Active',
      value: summary.activeInspections,
      color: 'text-blue-600'
    },
    {
      id: 'completedInspections',
      title: 'Completed',
      value: summary.completedInspections,
      color: 'text-green-600'
    },
    {
      id: 'overdueItems',
      title: 'Overdue',
      value: summary.overdueItems,
      color: 'text-red-600',
      isWarning: summary.overdueItems > 0
    },
    {
      id: 'reportsThisMonth',
      title: 'This Month',
      value: summary.reportsThisMonth,
      color: 'text-indigo-600'
    }
  ]

  return (
    <div className="grid grid-cols-4 gap-2">
      {priorityCards.map((card) => (
        <Card 
          key={card.id}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-sm",
            card.isWarning && "ring-1 ring-red-200"
          )}
          onClick={() => onCardClick?.(card.id)}
        >
          <CardContent className="p-3 text-center">
            <div className={cn("text-lg font-bold", card.color)}>
              {card.value}
            </div>
            <div className="text-xs text-muted-foreground">
              {card.title}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Summary Cards with Detailed View
 */
export function DetailedSummaryCards({ summary, onCardClick }: SummaryCardsProps) {
  if (!summary) return null

  const totalInspections = summary.activeInspections + summary.completedInspections
  const totalEvents = summary.activeMaintenanceEvents + summary.completedMaintenanceEvents
  const completionRate = totalInspections > 0 ? (summary.completedInspections / totalInspections) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Main Summary Cards */}
      <SummaryCards summary={summary} onCardClick={onCardClick} />
      
      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Completion Rate
            </div>
            <div className="text-2xl font-bold text-green-600">
              {completionRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {summary.completedInspections} of {totalInspections} inspections
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Average Reports per Inspector
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {summary.activeInspectors > 0 
                ? (summary.reportsThisMonth / summary.activeInspectors).toFixed(1)
                : '0'
              }
            </div>
            <div className="text-xs text-muted-foreground">
              This month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Workload Status
            </div>
            <div className={cn(
              "text-2xl font-bold",
              summary.overdueItems > 0 ? "text-red-600" : "text-green-600"
            )}>
              {summary.overdueItems > 0 ? 'High' : 'Normal'}
            </div>
            <div className="text-xs text-muted-foreground">
              {summary.overdueItems} overdue items
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
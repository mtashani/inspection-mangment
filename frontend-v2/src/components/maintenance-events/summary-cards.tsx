'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SummaryCardSkeleton } from '@/components/ui/advanced-skeleton'
import { EventsSummary } from '@/types/maintenance-events'
import { 
  Wrench, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  ClipboardList, 
  Users, 
  FileText, 
  Calendar,
  Clock
} from 'lucide-react'

interface SummaryCardsProps {
  summary?: EventsSummary
  loading?: boolean
  onCardClick?: (metric: string) => void
}

export function SummaryCards({ summary, loading, onCardClick }: SummaryCardsProps) {
  const cards = [
    {
      id: 'total-events',
      title: 'Total Events',
      value: summary?.totalEvents || 0,
      icon: <Wrench className="h-4 w-4" />,
      description: 'All maintenance events',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'active-events',
      title: 'Active Events',
      value: summary?.activeEvents || 0,
      icon: <Activity className="h-4 w-4" />,
      description: 'Currently in progress',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      id: 'completed-events',
      title: 'Completed Events',
      value: summary?.completedEvents || 0,
      icon: <CheckCircle className="h-4 w-4" />,
      description: 'Successfully completed',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'total-inspections',
      title: 'Total Inspections',
      value: summary?.totalInspections || 0,
      icon: <ClipboardList className="h-4 w-4" />,
      description: 'All inspections',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      id: 'planned-inspections',
      title: 'Planned Inspections',
      value: summary?.plannedInspections || 0,
      icon: <Calendar className="h-4 w-4" />,
      description: 'Pre-planned inspections',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'unplanned-inspections',
      title: 'Unplanned Inspections',
      value: summary?.unplannedInspections || 0,
      icon: <AlertTriangle className="h-4 w-4" />,
      description: 'Added during event',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'active-inspections',
      title: 'Active Inspections',
      value: summary?.activeInspections || 0,
      icon: <Users className="h-4 w-4" />,
      description: 'Currently ongoing',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      id: 'total-reports',
      title: 'Total Reports',
      value: summary?.totalReports || 0,
      icon: <FileText className="h-4 w-4" />,
      description: 'All daily reports',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      id: 'reports-this-month',
      title: 'Reports This Month',
      value: summary?.reportsThisMonth || 0,
      icon: <Calendar className="h-4 w-4" />,
      description: 'Current month reports',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'pending-inspections',
      title: 'Pending Inspections',
      value: (summary?.totalInspections || 0) - (summary?.completedInspections || 0) - (summary?.activeInspections || 0),
      icon: <Clock className="h-4 w-4" />,
      description: 'Waiting to start',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
      {cards.map((card) => (
        <Card 
          key={card.id}
          className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 hover:border-primary/20"
          onClick={() => onCardClick?.(card.id)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-md ${card.bgColor}`}>
              <div className={card.color}>
                {card.icon}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {card.value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
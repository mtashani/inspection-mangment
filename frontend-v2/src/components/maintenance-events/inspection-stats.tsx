'use client';

import { Inspection } from '@/types/maintenance-events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  calculateInspectionStats, 
  getPlannedCompletionRate 
} from '@/lib/utils/inspection-utils';
import { 
  ClipboardList, 
  CheckCircle, 
  Calendar, 
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface InspectionStatsProps {
  inspections: Inspection[];
  className?: string;
}

export function InspectionStats({ inspections, className }: InspectionStatsProps) {
  const stats = calculateInspectionStats(inspections);
  const completionRate = getPlannedCompletionRate(inspections);

  const statCards = [
    {
      title: 'Total Inspections',
      value: stats.total,
      icon: <ClipboardList className="h-4 w-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Planned',
      value: stats.planned,
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      subtitle: `${stats.plannedCompleted} completed`
    },
    {
      title: 'Unplanned',
      value: stats.unplanned,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      subtitle: `${stats.unplannedCompleted} completed`
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      subtitle: 'Planned inspections'
    }
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-3">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <div className={`p-2 rounded-md ${stat.bgColor}`}>
                  <div className={stat.color}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Bar for Planned Completion */}
      {stats.planned > 0 && (
        <Card className="p-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Planned Inspections Progress</span>
              <Badge variant="outline">
                {stats.plannedCompleted}/{stats.planned}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Progress 
              value={completionRate} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span>{completionRate}% Complete</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
'use client'

import { DailyReport } from '@/types/maintenance-events'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar'
import { 
  Calendar, 
  User, 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  MapPin,
  Wrench
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface DailyReportViewProps {
  report: DailyReport
  className?: string
  showInspectionInfo?: boolean
}

export function DailyReportView({ 
  report, 
  className,
  showInspectionInfo = true 
}: DailyReportViewProps) {
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-xl">Daily Report #{report.id}</CardTitle>
            </div>
            
            {showInspectionInfo && report.inspection && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wrench className="h-4 w-4" />
                <span>Inspection: {report.inspection.title}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn('gap-1', getStatusColor(report.status))}
            >
              {getStatusIcon(report.status)}
              {formatStatus(report.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Report Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Report Date</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(report.report_date), 'EEEE, MMMM dd, yyyy')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Inspector</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    <AvatarInitials name={report.inspector_name} />
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground">
                  {report.inspector_name}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Report Content */}
        <div className="space-y-4">
          {/* Description */}
          {report.description && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </h4>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {report.description}
                </p>
              </div>
            </div>
          )}

          {/* Findings */}
          {report.findings && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Findings
              </h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {report.findings}
                </p>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Recommendations
              </h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {report.recommendations}
                </p>
              </div>
            </div>
          )}

          {/* Location */}
          {report.location && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </h4>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  {report.location}
                </p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Timestamps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>Created: {format(new Date(report.created_at), 'MMM dd, yyyy HH:mm')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>Updated: {format(new Date(report.updated_at), 'MMM dd, yyyy HH:mm')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
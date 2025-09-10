'use client'

import { useMemo } from 'react'
import {
  ExclamationTriangleIcon,
  BellIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  FireIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DashboardWidget, useWidgetData } from '../dashboard-widget'

export interface AlertData {
  id: string
  title: string
  message: string
  type: 'safety' | 'maintenance' | 'inspection' | 'system' | 'compliance'
  severity: 'info' | 'warning' | 'critical' | 'emergency'
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed'
  source: string
  equipmentId?: string
  equipmentName?: string
  location: string
  createdDate: string
  acknowledgedBy?: string
  acknowledgedDate?: string
  resolvedDate?: string
  isRead: boolean
  requiresAction: boolean
}

export interface AlertsNotificationsProps {
  title: string
  config: {
    showCritical?: boolean
    showWarnings?: boolean
    showHigh?: boolean
    showInfo?: boolean
    limit?: number
    autoRefresh?: boolean
    groupByType?: boolean
  }
  onConfigChange?: (config: Record<string, any>) => void
  onRemove?: () => void
}

// Mock data
const MOCK_ALERTS: AlertData[] = [
  {
    id: 'alert-001',
    title: 'Critical Pressure Alarm',
    message: 'Pressure vessel A1 has exceeded safe operating pressure limits',
    type: 'safety',
    severity: 'critical',
    status: 'active',
    source: 'Pressure Monitoring System',
    equipmentId: 'eq-001',
    equipmentName: 'Pressure Vessel A1',
    location: 'Unit 1',
    createdDate: '2024-02-10T14:30:00Z',
    isRead: false,
    requiresAction: true
  },
  {
    id: 'alert-002',
    title: 'Maintenance Overdue',
    message: 'Scheduled maintenance for Heat Exchanger B2 is 5 days overdue',
    type: 'maintenance',
    severity: 'warning',
    status: 'acknowledged',
    source: 'Maintenance Management System',
    equipmentId: 'eq-002',
    equipmentName: 'Heat Exchanger B2',
    location: 'Unit 2',
    createdDate: '2024-02-08T09:15:00Z',
    acknowledgedBy: 'John Smith',
    acknowledgedDate: '2024-02-09T10:00:00Z',
    isRead: true,
    requiresAction: true
  },
  {
    id: 'alert-003',
    title: 'Inspection Due Soon',
    message: 'Monthly safety inspection for Pump C3 is due in 2 days',
    type: 'inspection',
    severity: 'info',
    status: 'active',
    source: 'Inspection Scheduler',
    equipmentId: 'eq-003',
    equipmentName: 'Pump C3',
    location: 'Unit 1',
    createdDate: '2024-02-09T16:45:00Z',
    isRead: true,
    requiresAction: false
  },
  {
    id: 'alert-004',
    title: 'System Performance Warning',
    message: 'Database response time has increased by 40% in the last hour',
    type: 'system',
    severity: 'warning',
    status: 'active',
    source: 'System Monitor',
    location: 'Server Room',
    createdDate: '2024-02-10T13:20:00Z',
    isRead: false,
    requiresAction: false
  },
  {
    id: 'alert-005',
    title: 'Compliance Violation',
    message: 'Equipment certification for Tank D1 has expired',
    type: 'compliance',
    severity: 'critical',
    status: 'resolved',
    source: 'Compliance Monitor',
    equipmentId: 'eq-004',
    equipmentName: 'Tank D1',
    location: 'Unit 3',
    createdDate: '2024-02-07T11:30:00Z',
    resolvedDate: '2024-02-08T14:15:00Z',
    isRead: true,
    requiresAction: false
  },
  {
    id: 'alert-006',
    title: 'Emergency Shutdown Triggered',
    message: 'Emergency shutdown system activated in Unit 2 due to gas leak detection',
    type: 'safety',
    severity: 'emergency',
    status: 'acknowledged',
    source: 'Emergency Response System',
    location: 'Unit 2',
    createdDate: '2024-02-10T15:45:00Z',
    acknowledgedBy: 'Emergency Team',
    acknowledgedDate: '2024-02-10T15:47:00Z',
    isRead: true,
    requiresAction: true
  }
]

const SEVERITY_COLORS = {
  info: '#3b82f6',
  warning: '#f59e0b',
  critical: '#ef4444',
  emergency: '#dc2626'
}

const SEVERITY_ICONS = {
  info: BellIcon,
  warning: ExclamationTriangleIcon,
  critical: ShieldExclamationIcon,
  emergency: FireIcon
}

const TYPE_COLORS = {
  safety: '#ef4444',
  maintenance: '#f59e0b',
  inspection: '#3b82f6',
  system: '#6b7280',
  compliance: '#8b5cf6'
}

export function AlertsNotifications({
  title,
  config,
  onConfigChange,
  onRemove
}: AlertsNotificationsProps) {
  const {
    showCritical = true,
    showWarnings = true,
    showHigh = false,
    showInfo = false,
    limit = 10,
    autoRefresh = true,
    groupByType = false
  } = config

  // Fetch alerts data
  const { data, isLoading, error, lastUpdated, refresh } = useWidgetData(
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      return MOCK_ALERTS
    },
    autoRefresh ? 60000 : undefined // 1 minute if auto-refresh enabled
  )

  // Filter and process alerts
  const filteredAlerts = useMemo(() => {
    if (!data) return []
    
    let filtered = data
    
    // Filter by severity
    const allowedSeverities = []
    if (showCritical) allowedSeverities.push('critical', 'emergency')
    if (showWarnings) allowedSeverities.push('warning')
    if (showInfo) allowedSeverities.push('info')
    
    if (allowedSeverities.length > 0) {
      filtered = filtered.filter(alert => allowedSeverities.includes(alert.severity))
    }
    
    // Sort by severity (emergency > critical > warning > info) and then by date
    const severityOrder = { emergency: 4, critical: 3, warning: 2, info: 1 }
    filtered.sort((a, b) => {
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
      if (severityDiff !== 0) return severityDiff
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    })
    
    // Limit results
    return filtered.slice(0, limit)
  }, [data, showCritical, showWarnings, showInfo, limit])

  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (!data) return null

    const total = data.length
    const active = data.filter(a => a.status === 'active').length
    const critical = data.filter(a => a.severity === 'critical' || a.severity === 'emergency').length
    const unread = data.filter(a => !a.isRead).length
    const requiresAction = data.filter(a => a.requiresAction && a.status === 'active').length

    const byType = data.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      active,
      critical,
      unread,
      requiresAction,
      byType
    }
  }, [data])

  // Group alerts by type if enabled
  const groupedAlerts = useMemo(() => {
    if (!groupByType || !filteredAlerts) return { ungrouped: filteredAlerts }
    
    return filteredAlerts.reduce((acc, alert) => {
      const type = alert.type
      if (!acc[type]) acc[type] = []
      acc[type].push(alert)
      return acc
    }, {} as Record<string, AlertData[]>)
  }, [filteredAlerts, groupByType])

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  // Handle alert actions
  const handleAcknowledge = (alertId: string) => {
    console.log('Acknowledge alert:', alertId)
    // In real app, call API to acknowledge alert
  }

  const handleDismiss = (alertId: string) => {
    console.log('Dismiss alert:', alertId)
    // In real app, call API to dismiss alert
  }

  const handleMarkAsRead = (alertId: string) => {
    console.log('Mark as read:', alertId)
    // In real app, call API to mark as read
  }

  // Render alert item
  const renderAlert = (alert: AlertData) => {
    const SeverityIcon = SEVERITY_ICONS[alert.severity]
    
    return (
      <Card 
        key={alert.id} 
        className={cn(
          'p-3 transition-all',
          !alert.isRead && 'border-l-4',
          alert.severity === 'emergency' && 'border-l-red-600 bg-red-50',
          alert.severity === 'critical' && 'border-l-red-500 bg-red-50',
          alert.severity === 'warning' && 'border-l-yellow-500 bg-yellow-50',
          alert.severity === 'info' && 'border-l-blue-500 bg-blue-50'
        )}
      >
        <CardContent className="p-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <SeverityIcon 
                className={cn(
                  'h-5 w-5 mt-0.5',
                  alert.severity === 'emergency' && 'text-red-600',
                  alert.severity === 'critical' && 'text-red-500',
                  alert.severity === 'warning' && 'text-yellow-500',
                  alert.severity === 'info' && 'text-blue-500'
                )}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={cn(
                    'text-sm truncate',
                    !alert.isRead ? 'font-semibold' : 'font-medium'
                  )}>
                    {alert.title}
                  </h4>
                  
                  <Badge
                    variant={
                      alert.severity === 'emergency' || alert.severity === 'critical' ? 'destructive' :
                      alert.severity === 'warning' ? 'secondary' : 'outline'
                    }
                    className="text-xs"
                  >
                    {alert.severity}
                  </Badge>
                  
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: TYPE_COLORS[alert.type] }}
                  >
                    {alert.type}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {alert.message}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>{alert.location}</span>
                  {alert.equipmentName && <span>{alert.equipmentName}</span>}
                  <span>{formatDate(alert.createdDate)}</span>
                  <span>{alert.source}</span>
                </div>
                
                {alert.status === 'acknowledged' && alert.acknowledgedBy && (
                  <p className="text-xs text-green-600 mt-1">
                    Acknowledged by {alert.acknowledgedBy}
                  </p>
                )}
                
                {alert.status === 'resolved' && (
                  <p className="text-xs text-green-600 mt-1">
                    Resolved {alert.resolvedDate && formatDate(alert.resolvedDate)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1 ml-2">
              {!alert.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkAsRead(alert.id)}
                  className="h-6 w-6 p-0"
                  title="Mark as read"
                >
                  <CheckCircleIcon className="h-3 w-3" />
                </Button>
              )}
              
              {alert.status === 'active' && alert.requiresAction && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAcknowledge(alert.id)}
                  className="h-6 w-6 p-0 text-blue-600"
                  title="Acknowledge"
                >
                  <BellIcon className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(alert.id)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                title="Dismiss"
              >
                <XMarkIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <DashboardWidget
      title={title}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
      onConfigChange={onConfigChange}
      onRemove={onRemove}
      headerActions={
        <div className="flex items-center space-x-2">
          {metrics && metrics.unread > 0 && (
            <Badge variant="destructive" className="text-xs">
              {metrics.unread} unread
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {filteredAlerts?.length || 0} Alerts
          </Badge>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Summary Cards */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-2">
              <CardContent className="p-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{metrics.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-2">
              <CardContent className="p-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">{metrics.critical}</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-2">
              <CardContent className="p-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-yellow-600">{metrics.requiresAction}</p>
                  <p className="text-xs text-muted-foreground">Action Req.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-2">
              <CardContent className="p-0">
                <div className="text-center">
                  <p className="text-lg font-bold">{metrics.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alerts List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {groupByType ? (
            Object.entries(groupedAlerts).map(([type, alerts]) => (
              <div key={type}>
                <h5 className="text-sm font-medium mb-2 capitalize flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: TYPE_COLORS[type] }}
                  />
                  <span>{type} ({alerts.length})</span>
                </h5>
                <div className="space-y-2 ml-5">
                  {alerts.map(renderAlert)}
                </div>
              </div>
            ))
          ) : (
            filteredAlerts.map(renderAlert)
          )}
        </div>

        {/* Empty State */}
        {filteredAlerts.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <BellIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No alerts found</p>
            <p className="text-sm">All systems are running normally</p>
          </div>
        )}

        {/* Actions */}
        {filteredAlerts.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-2">
              {metrics && metrics.unread > 0 && (
                <Button variant="ghost" size="sm" className="text-xs">
                  Mark All Read
                </Button>
              )}
              {metrics && metrics.requiresAction > 0 && (
                <Button variant="ghost" size="sm" className="text-xs">
                  Acknowledge All
                </Button>
              )}
            </div>
            
            <Button variant="ghost" size="sm" className="text-xs">
              View All Alerts
            </Button>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

export type { AlertsNotificationsProps, AlertData }
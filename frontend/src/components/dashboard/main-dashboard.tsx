'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ChartBarIcon,
  Cog6ToothIcon,
  PlusIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { DashboardWidget } from './dashboard-widget'
import { WidgetConfigDialog } from './widget-config-dialog'
import { DashboardMetrics } from './dashboard-metrics'
import { EquipmentOverview } from './widgets/equipment-overview'
import { InspectionSummary } from './widgets/inspection-summary'
import { MaintenanceStatus } from './widgets/maintenance-status'
import { RBIAnalytics } from './widgets/rbi-analytics'
import { RecentReports } from './widgets/recent-reports'
import { AlertsNotifications } from './widgets/alerts-notifications'
import { PerformanceMetrics } from './widgets/performance-metrics'
import { UserActivity } from './widgets/user-activity'

export interface DashboardConfig {
  id: string
  name: string
  role: 'inspector' | 'admin' | 'analyst' | 'manager'
  widgets: DashboardWidgetConfig[]
  layout: 'grid' | 'masonry' | 'flex'
  refreshInterval: number
  isDefault: boolean
}

export interface DashboardWidgetConfig {
  id: string
  type: string
  title: string
  position: { x: number; y: number; w: number; h: number }
  config: Record<string, any>
  isVisible: boolean
  refreshInterval?: number
}

export interface MainDashboardProps {
  userRole: 'inspector' | 'admin' | 'analyst' | 'manager'
  userId: string
  className?: string
}

const DEFAULT_WIDGETS: Record<string, DashboardWidgetConfig[]> = {
  inspector: [
    {
      id: 'equipment-overview',
      type: 'equipment-overview',
      title: 'Equipment Overview',
      position: { x: 0, y: 0, w: 6, h: 4 },
      config: { showRiskLevels: true, showStatus: true },
      isVisible: true
    },
    {
      id: 'inspection-summary',
      type: 'inspection-summary',
      title: 'My Inspections',
      position: { x: 6, y: 0, w: 6, h: 4 },
      config: { showPending: true, showCompleted: true },
      isVisible: true
    },
    {
      id: 'recent-reports',
      type: 'recent-reports',
      title: 'Recent Reports',
      position: { x: 0, y: 4, w: 8, h: 3 },
      config: { limit: 10, showStatus: true },
      isVisible: true
    },
    {
      id: 'alerts',
      type: 'alerts-notifications',
      title: 'Alerts & Notifications',
      position: { x: 8, y: 4, w: 4, h: 3 },
      config: { showCritical: true, showWarnings: true },
      isVisible: true
    }
  ],
  admin: [
    {
      id: 'system-metrics',
      type: 'performance-metrics',
      title: 'System Performance',
      position: { x: 0, y: 0, w: 4, h: 3 },
      config: { showCPU: true, showMemory: true, showNetwork: true },
      isVisible: true
    },
    {
      id: 'user-activity',
      type: 'user-activity',
      title: 'User Activity',
      position: { x: 4, y: 0, w: 4, h: 3 },
      config: { timeRange: '24h', showActiveUsers: true },
      isVisible: true
    },
    {
      id: 'equipment-overview',
      type: 'equipment-overview',
      title: 'Equipment Status',
      position: { x: 8, y: 0, w: 4, h: 3 },
      config: { showRiskLevels: true, showMaintenance: true },
      isVisible: true
    },
    {
      id: 'maintenance-status',
      type: 'maintenance-status',
      title: 'Maintenance Overview',
      position: { x: 0, y: 3, w: 6, h: 4 },
      config: { showScheduled: true, showOverdue: true },
      isVisible: true
    },
    {
      id: 'rbi-analytics',
      type: 'rbi-analytics',
      title: 'RBI Analytics',
      position: { x: 6, y: 3, w: 6, h: 4 },
      config: { showTrends: true, showPredictions: true },
      isVisible: true
    }
  ],
  analyst: [
    {
      id: 'rbi-analytics',
      type: 'rbi-analytics',
      title: 'RBI Analysis',
      position: { x: 0, y: 0, w: 8, h: 5 },
      config: { showTrends: true, showPredictions: true, showDetails: true },
      isVisible: true
    },
    {
      id: 'equipment-overview',
      type: 'equipment-overview',
      title: 'Equipment Risk Profile',
      position: { x: 8, y: 0, w: 4, h: 5 },
      config: { showRiskLevels: true, showTrends: true },
      isVisible: true
    },
    {
      id: 'inspection-summary',
      type: 'inspection-summary',
      title: 'Inspection Analytics',
      position: { x: 0, y: 5, w: 6, h: 3 },
      config: { showTrends: true, showEfficiency: true },
      isVisible: true
    },
    {
      id: 'performance-metrics',
      type: 'performance-metrics',
      title: 'System Analytics',
      position: { x: 6, y: 5, w: 6, h: 3 },
      config: { showTrends: true, showPredictions: true },
      isVisible: true
    }
  ],
  manager: [
    {
      id: 'overview-metrics',
      type: 'dashboard-metrics',
      title: 'Key Metrics',
      position: { x: 0, y: 0, w: 12, h: 2 },
      config: { showKPIs: true, showTrends: true },
      isVisible: true
    },
    {
      id: 'equipment-overview',
      type: 'equipment-overview',
      title: 'Equipment Status',
      position: { x: 0, y: 2, w: 4, h: 4 },
      config: { showRiskLevels: true, showMaintenance: true },
      isVisible: true
    },
    {
      id: 'maintenance-status',
      type: 'maintenance-status',
      title: 'Maintenance Overview',
      position: { x: 4, y: 2, w: 4, h: 4 },
      config: { showScheduled: true, showOverdue: true, showCosts: true },
      isVisible: true
    },
    {
      id: 'rbi-analytics',
      type: 'rbi-analytics',
      title: 'Risk Analysis',
      position: { x: 8, y: 2, w: 4, h: 4 },
      config: { showSummary: true, showTrends: true },
      isVisible: true
    },
    {
      id: 'recent-reports',
      type: 'recent-reports',
      title: 'Recent Reports',
      position: { x: 0, y: 6, w: 8, h: 3 },
      config: { limit: 15, showStatus: true, showPriority: true },
      isVisible: true
    },
    {
      id: 'alerts',
      type: 'alerts-notifications',
      title: 'Critical Alerts',
      position: { x: 8, y: 6, w: 4, h: 3 },
      config: { showCritical: true, showHigh: true },
      isVisible: true
    }
  ]
}

export function MainDashboard({ userRole, userId, className }: MainDashboardProps) {
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidgetConfig | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Initialize dashboard config
  useEffect(() => {
    const loadDashboardConfig = async () => {
      try {
        // In real app, load from API
        const savedConfig = localStorage.getItem(`dashboard-${userId}-${userRole}`)
        
        if (savedConfig) {
          setDashboardConfig(JSON.parse(savedConfig))
        } else {
          // Create default config
          const defaultConfig: DashboardConfig = {
            id: `default-${userRole}`,
            name: `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard`,
            role: userRole,
            widgets: DEFAULT_WIDGETS[userRole] || [],
            layout: 'grid',
            refreshInterval: 300000, // 5 minutes
            isDefault: true
          }
          setDashboardConfig(defaultConfig)
        }
      } catch (error) {
        console.error('Failed to load dashboard config:', error)
      }
    }

    loadDashboardConfig()
  }, [userId, userRole])

  // Save dashboard config
  const saveDashboardConfig = async (config: DashboardConfig) => {
    try {
      localStorage.setItem(`dashboard-${userId}-${userRole}`, JSON.stringify(config))
      setDashboardConfig(config)
    } catch (error) {
      console.error('Failed to save dashboard config:', error)
    }
  }

  // Refresh dashboard
  const refreshDashboard = async () => {
    setIsRefreshing(true)
    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLastRefresh(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }

  // Toggle widget visibility
  const toggleWidgetVisibility = (widgetId: string) => {
    if (!dashboardConfig) return

    const updatedConfig = {
      ...dashboardConfig,
      widgets: dashboardConfig.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, isVisible: !widget.isVisible }
          : widget
      )
    }
    saveDashboardConfig(updatedConfig)
  }

  // Update widget config
  const updateWidgetConfig = (widgetId: string, newConfig: Record<string, any>) => {
    if (!dashboardConfig) return

    const updatedConfig = {
      ...dashboardConfig,
      widgets: dashboardConfig.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, config: { ...widget.config, ...newConfig } }
          : widget
      )
    }
    saveDashboardConfig(updatedConfig)
  }

  // Add new widget
  const addWidget = (widgetType: string) => {
    if (!dashboardConfig) return

    const newWidget: DashboardWidgetConfig = {
      id: `${widgetType}-${Date.now()}`,
      type: widgetType,
      title: `New ${widgetType.replace('-', ' ')}`,
      position: { x: 0, y: 0, w: 4, h: 3 },
      config: {},
      isVisible: true
    }

    const updatedConfig = {
      ...dashboardConfig,
      widgets: [...dashboardConfig.widgets, newWidget]
    }
    saveDashboardConfig(updatedConfig)
  }

  // Remove widget
  const removeWidget = (widgetId: string) => {
    if (!dashboardConfig) return

    const updatedConfig = {
      ...dashboardConfig,
      widgets: dashboardConfig.widgets.filter(widget => widget.id !== widgetId)
    }
    saveDashboardConfig(updatedConfig)
  }

  // Render widget based on type
  const renderWidget = (widget: DashboardWidgetConfig) => {
    if (!widget.isVisible) return null

    const commonProps = {
      key: widget.id,
      title: widget.title,
      config: widget.config,
      onConfigChange: (newConfig: Record<string, any>) => updateWidgetConfig(widget.id, newConfig),
      onRemove: () => removeWidget(widget.id)
    }

    switch (widget.type) {
      case 'equipment-overview':
        return <EquipmentOverview {...commonProps} />
      case 'inspection-summary':
        return <InspectionSummary {...commonProps} />
      case 'maintenance-status':
        return <MaintenanceStatus {...commonProps} />
      case 'rbi-analytics':
        return <RBIAnalytics {...commonProps} />
      case 'recent-reports':
        return <RecentReports {...commonProps} />
      case 'alerts-notifications':
        return <AlertsNotifications {...commonProps} />
      case 'performance-metrics':
        return <PerformanceMetrics {...commonProps} />
      case 'user-activity':
        return <UserActivity {...commonProps} />
      case 'dashboard-metrics':
        return <DashboardMetrics {...commonProps} />
      default:
        return (
          <DashboardWidget {...commonProps}>
            <div className="p-4 text-center text-muted-foreground">
              Unknown widget type: {widget.type}
            </div>
          </DashboardWidget>
        )
    }
  }

  // Available widget types for current role
  const availableWidgets = useMemo(() => {
    const baseWidgets = [
      { type: 'equipment-overview', name: 'Equipment Overview', icon: '🔧' },
      { type: 'inspection-summary', name: 'Inspection Summary', icon: '📋' },
      { type: 'recent-reports', name: 'Recent Reports', icon: '📄' },
      { type: 'alerts-notifications', name: 'Alerts & Notifications', icon: '🚨' }
    ]

    const roleSpecificWidgets = {
      admin: [
        { type: 'performance-metrics', name: 'Performance Metrics', icon: '📊' },
        { type: 'user-activity', name: 'User Activity', icon: '👥' }
      ],
      analyst: [
        { type: 'rbi-analytics', name: 'RBI Analytics', icon: '📈' },
        { type: 'performance-metrics', name: 'System Analytics', icon: '📊' }
      ],
      manager: [
        { type: 'dashboard-metrics', name: 'Key Metrics', icon: '📊' },
        { type: 'maintenance-status', name: 'Maintenance Status', icon: '🔨' },
        { type: 'rbi-analytics', name: 'Risk Analysis', icon: '📈' }
      ],
      inspector: []
    }

    return [...baseWidgets, ...(roleSpecificWidgets[userRole] || [])]
  }, [userRole])

  if (!dashboardConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{dashboardConfig.name}</h1>
          <p className="text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Refresh Button */}
          <Button
            onClick={refreshDashboard}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <ArrowPathIcon className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>

          {/* Widget Visibility Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <EyeIcon className="h-4 w-4 mr-2" />
                Widgets
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {dashboardConfig.widgets.map(widget => (
                <DropdownMenuItem
                  key={widget.id}
                  onClick={() => toggleWidgetVisibility(widget.id)}
                  className="flex items-center justify-between"
                >
                  <span>{widget.title}</span>
                  {widget.isVisible ? (
                    <EyeIcon className="h-4 w-4" />
                  ) : (
                    <EyeSlashIcon className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Widget */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {availableWidgets.map(widget => (
                <DropdownMenuItem
                  key={widget.type}
                  onClick={() => addWidget(widget.type)}
                >
                  <span className="mr-2">{widget.icon}</span>
                  {widget.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dashboard Settings */}
          <Button
            onClick={() => setIsConfigOpen(true)}
            variant="outline"
            size="sm"
          >
            <Cog6ToothIcon className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-12 gap-4 auto-rows-min">
        {dashboardConfig.widgets
          .filter(widget => widget.isVisible)
          .map(widget => (
            <div
              key={widget.id}
              className={cn(
                'col-span-12',
                widget.position.w <= 3 && 'md:col-span-3',
                widget.position.w === 4 && 'md:col-span-4',
                widget.position.w === 6 && 'md:col-span-6',
                widget.position.w === 8 && 'md:col-span-8',
                widget.position.w >= 12 && 'md:col-span-12'
              )}
              style={{
                minHeight: `${widget.position.h * 80}px`
              }}
            >
              {renderWidget(widget)}
            </div>
          ))}
      </div>

      {/* Widget Configuration Dialog */}
      <WidgetConfigDialog
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={dashboardConfig}
        onConfigChange={saveDashboardConfig}
      />
    </div>
  )
}

export type { DashboardConfig, DashboardWidgetConfig, MainDashboardProps }
'use client'

import React, { useState, useMemo } from 'react'
import { MaintenanceEvent, DailyReport, Inspection } from '@/types/maintenance-events'
import { VirtualizedEventsList } from './virtualized-events-list'
import { VirtualizedDailyReportsList } from './virtualized-daily-reports-list'
import { VirtualizedInspectionsList } from './virtualized-inspections-list'
import { useVirtualizationPerformance } from '@/hooks/use-virtualization-performance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { 
  Activity, 
  BarChart3, 
  Clock, 
  Database, 
  Gauge, 
  RefreshCw,
  Settings,
  Zap
} from 'lucide-react'

// Mock data generators
function generateMockEvents(count: number): MaintenanceEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    event_number: `ME-${String(i + 1).padStart(4, '0')}`,
    title: `Maintenance Event ${i + 1}`,
    description: `Description for maintenance event ${i + 1}. This is a longer description to test text wrapping and card height variations.`,
    event_type: ['Overhaul', 'Inspection', 'Repair', 'Preventive', 'Emergency'][i % 5] as any,
    status: ['Planned', 'InProgress', 'Completed', 'Cancelled'][i % 4] as any,
    planned_start_date: new Date(Date.now() + (i - count/2) * 24 * 60 * 60 * 1000).toISOString(),
    planned_end_date: new Date(Date.now() + (i - count/2 + 7) * 24 * 60 * 60 * 1000).toISOString(),
    sub_events_count: Math.floor(Math.random() * 5),
    inspections_count: Math.floor(Math.random() * 10),
    created_by: `User ${i % 10 + 1}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))
}

function generateMockReports(count: number): DailyReport[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    inspection_id: Math.floor(i / 3) + 1,
    report_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    description: `Daily report ${i + 1} description. This report contains detailed information about the inspection activities performed on this date.`,
    inspector_ids: [1, 2],
    inspector_names: `Inspector ${(i % 5) + 1}, Inspector ${((i + 1) % 5) + 1}`,
    findings: i % 3 === 0 ? `Findings for report ${i + 1}` : undefined,
    recommendations: i % 4 === 0 ? `Recommendations for report ${i + 1}` : undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))
}

function generateMockInspections(count: number): Inspection[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    inspection_number: `INS-${String(i + 1).padStart(4, '0')}`,
    title: `Inspection ${i + 1}`,
    description: `Detailed inspection ${i + 1} for equipment maintenance and safety verification.`,
    start_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    end_date: i % 3 === 0 ? new Date(Date.now() - (i - 7) * 24 * 60 * 60 * 1000).toISOString() : undefined,
    status: ['InProgress', 'Completed', 'Cancelled', 'OnHold'][i % 4] as any,
    equipment_id: i + 1,
    equipment_tag: `EQ-${String(i + 1).padStart(3, '0')}`,
    equipment_description: `Equipment ${i + 1} description`,
    requesting_department: ['Operations', 'Maintenance', 'Safety', 'Engineering'][i % 4] as unknown,
    daily_reports_count: Math.floor(Math.random() * 8),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))
}

export function VirtualizationDemo() {
  const [activeTab, setActiveTab] = useState('events')
  const [itemCount, setItemCount] = useState([100])
  const [enableVirtualization, setEnableVirtualization] = useState(true)
  const [enablePerformanceMonitoring, setEnablePerformanceMonitoring] = useState(true)
  
  const { 
    metrics, 
    startRenderMeasurement, 
    endRenderMeasurement,
    measureMemoryUsage 
  } = useVirtualizationPerformance(enablePerformanceMonitoring)

  // Generate mock data based on item count
  const mockEvents = useMemo(() => generateMockEvents(itemCount[0]), [itemCount])
  const mockReports = useMemo(() => generateMockReports(itemCount[0]), [itemCount])
  const mockInspections = useMemo(() => generateMockInspections(itemCount[0]), [itemCount])

  const handleRegenerateData = () => {
    // Force regeneration by changing a dependency
    setItemCount([itemCount[0]])
    measureMemoryUsage()
  }

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold">Virtualization Demo</h2>
          <p className="text-muted-foreground">
            Test and compare performance with and without virtualization for large datasets.
          </p>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Demo Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Item Count Slider */}
              <div className="space-y-2">
                <Label>Item Count: {itemCount[0]}</Label>
                <Slider
                  value={itemCount}
                  onValueChange={setItemCount}
                  min={10}
                  max={1000}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* Virtualization Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="virtualization"
                  checked={enableVirtualization}
                  onCheckedChange={setEnableVirtualization}
                />
                <Label htmlFor="virtualization">Enable Virtualization</Label>
              </div>

              {/* Performance Monitoring Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="performance"
                  checked={enablePerformanceMonitoring}
                  onCheckedChange={setEnablePerformanceMonitoring}
                />
                <Label htmlFor="performance">Performance Monitoring</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleRegenerateData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        {enablePerformanceMonitoring && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Real-time performance monitoring for virtualized components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-sm font-medium">FPS</div>
                    <div className={`text-lg font-bold ${getPerformanceColor(60 - metrics.fps, { good: 5, warning: 15 })}`}>
                      {metrics.fps}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-sm font-medium">Render Time</div>
                    <div className={`text-lg font-bold ${getPerformanceColor(metrics.renderTime, { good: 16, warning: 33 })}`}>
                      {metrics.renderTime.toFixed(1)}ms
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="text-sm font-medium">Memory</div>
                    <div className={`text-lg font-bold ${getPerformanceColor(metrics.memoryUsage, { good: 50, warning: 75 })}`}>
                      {metrics.memoryUsage}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="text-sm font-medium">Items Rendered</div>
                    <div className="text-lg font-bold">
                      {metrics.itemsRendered}/{metrics.totalItems}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Demo Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Events ({mockEvents.length})
          </TabsTrigger>
          <TabsTrigger value="inspections" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Inspections ({mockInspections.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Reports ({mockReports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Maintenance Events Demo</span>
                <Badge variant={enableVirtualization ? 'default' : 'secondary'}>
                  {enableVirtualization ? 'Virtualized' : 'Standard'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Testing virtualization with {mockEvents.length} maintenance events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VirtualizedEventsList
                events={mockEvents}
                enableVirtualization={enableVirtualization}
                height={500}
                threshold={enableVirtualization ? 20 : 999999}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Inspections Demo</span>
                <Badge variant={enableVirtualization ? 'default' : 'secondary'}>
                  {enableVirtualization ? 'Virtualized' : 'Standard'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Testing virtualization with {mockInspections.length} inspections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VirtualizedInspectionsList
                inspections={mockInspections}
                enableVirtualization={enableVirtualization}
                height={500}
                threshold={enableVirtualization ? 15 : 999999}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Daily Reports Demo</span>
                <Badge variant={enableVirtualization ? 'default' : 'secondary'}>
                  {enableVirtualization ? 'Virtualized' : 'Standard'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Testing virtualization with {mockReports.length} daily reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VirtualizedDailyReportsList
                reports={mockReports}
                enableVirtualization={enableVirtualization}
                height={500}
                threshold={enableVirtualization ? 25 : 999999}
                compact={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">Tip</Badge>
            <span>Virtualization automatically enables when item count exceeds the threshold (typically 20-50 items).</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">Tip</Badge>
            <span>Dynamic height calculation adapts to content changes but may impact performance with frequent updates.</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">Tip</Badge>
            <span>Scroll position is automatically restored when navigating between pages.</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="Tip">Tip</Badge>
            <span>Performance monitoring helps identify bottlenecks in development mode.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
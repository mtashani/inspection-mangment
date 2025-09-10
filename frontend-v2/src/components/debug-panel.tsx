'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { debug } from '@/lib/debug'
import { monitoring } from '@/lib/monitoring'
import { analytics } from '@/lib/analytics'
import { Bug, Download, Trash2, X } from 'lucide-react'

interface DebugPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function DebugPanel({ isOpen, onClose }: DebugPanelProps) {
  const [logs, setLogs] = useState(debug.getLogs())
  const [errors, setErrors] = useState(monitoring.getStoredErrors())
  const [metrics, setMetrics] = useState(monitoring.getStoredMetrics())
  const [analyticsData, setAnalyticsData] = useState(analytics.getStoredAnalytics())

  useEffect(() => {
    if (isOpen) {
      // Refresh data when panel opens
      setLogs(debug.getLogs())
      setErrors(monitoring.getStoredErrors())
      setMetrics(monitoring.getStoredMetrics())
      setAnalyticsData(analytics.getStoredAnalytics())
    }
  }, [isOpen])

  const handleExportLogs = () => {
    const data = {
      logs: debug.getLogs(),
      errors: monitoring.getStoredErrors(),
      metrics: monitoring.getStoredMetrics(),
      analytics: analytics.getStoredAnalytics(),
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-data-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClearAll = () => {
    debug.clearLogs()
    monitoring.clearStoredData()
    analytics.clearStoredAnalytics()
    setLogs([])
    setErrors([])
    setMetrics([])
    setAnalyticsData({ pageviews: [], events: [] })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Debug Panel
            </CardTitle>
            <CardDescription>
              Development debugging and monitoring information
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <Tabs defaultValue="logs" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="logs">
                Logs ({logs.length})
              </TabsTrigger>
              <TabsTrigger value="errors">
                Errors ({errors.length})
              </TabsTrigger>
              <TabsTrigger value="metrics">
                Metrics ({metrics.length})
              </TabsTrigger>
              <TabsTrigger value="analytics">
                Analytics ({analyticsData.events.length + analyticsData.pageviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="logs" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={
                          log.level === 'error' ? 'destructive' :
                          log.level === 'warn' ? 'secondary' :
                          log.level === 'info' ? 'default' : 'outline'
                        }>
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{log.message}</p>
                      {log.data ? (
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No logs available
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="errors" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {errors.map((error, index) => (
                    <div key={index} className="p-3 border rounded-lg border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="destructive">ERROR</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-red-800">{error.message}</p>
                      {error.stack ? (
                        <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-x-auto">
                          {error.stack}
                        </pre>
                      ) : null}
                    </div>
                  ))}
                  {errors.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No errors captured
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="metrics" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {metrics.map((metric, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">METRIC</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(metric.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{metric.name}: {metric.value}</p>
                    </div>
                  ))}
                  {metrics.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No metrics available
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {analyticsData.pageviews.map((pageview, index) => (
                    <div key={`pv-${index}`} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="default">PAGEVIEW</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(pageview.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{pageview.path}</p>
                      <p className="text-xs text-muted-foreground">{pageview.title}</p>
                    </div>
                  ))}
                  {analyticsData.events.map((event, index) => (
                    <div key={`ev-${index}`} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">EVENT</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{event.name}</p>
                      {event.properties ? (
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(event.properties, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  ))}
                  {analyticsData.pageviews.length === 0 && analyticsData.events.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No analytics data available
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Debug panel trigger (only in development)
export function DebugTrigger() {
  const [isOpen, setIsOpen] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const enabled = 
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true' ||
      window.location.search.includes('debug=true')
    
    setIsEnabled(enabled)

    // Keyboard shortcut: Ctrl+Shift+D
    const handleKeyDown = (e: KeyboardEvent) => {
      if (enabled && e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Only render on client side after hydration to prevent SSR mismatch
  if (!mounted || !isEnabled) return null

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug
        </Button>
      </div>
      <DebugPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
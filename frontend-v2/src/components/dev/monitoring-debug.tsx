'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { monitoring } from '@/lib/monitoring'
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Trash2, Minimize2, Maximize2 } from 'lucide-react'

export function MonitoringDebug() {
  const [mounted, setMounted] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [status, setStatus] = useState(monitoring.getStatus())
  const [errors, setErrors] = useState(monitoring.getStoredErrors())
  const [metrics, setMetrics] = useState(monitoring.getStoredMetrics())

  const refresh = () => {
    if (typeof window !== 'undefined') {
      setStatus(monitoring.getStatus())
      setErrors(monitoring.getStoredErrors())
      setMetrics(monitoring.getStoredMetrics())
    }
  }

  const clearData = () => {
    monitoring.clearStoredData()
    refresh()
  }

  const testError = () => {
    monitoring.captureError(new Error('Test error from debug panel'))
    setTimeout(refresh, 100)
  }

  const testEmptyError = () => {
    // This should reproduce the original error
    monitoring.captureError({})
    setTimeout(refresh, 100)
  }

  useEffect(() => {
    setMounted(true)
    refresh()
  }, [])

  // Only render on client side after hydration to prevent SSR mismatch
  if (!mounted || process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[80vh] overflow-auto z-50">
      <Card className="border-2 border-orange-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              🐛 Monitoring Debug Panel
              <Badge variant={status.enabled ? 'default' : 'destructive'}>
                {status.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMinimized(!minimized)}
              className="h-6 w-6 p-0"
            >
              {minimized ? (
                <Maximize2 className="h-3 w-3" />
              ) : (
                <Minimize2 className="h-3 w-3" />
              )}
            </Button>
          </div>
          {!minimized && (
            <CardDescription className="text-xs">
              Development debugging tool for monitoring service
            </CardDescription>
          )}
        </CardHeader>
        
        {!minimized && (
          <CardContent className="space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-1">
              {status.enabled ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              Status
            </h4>
            <div className="text-xs space-y-1">
              <div>Session: <code className="text-xs">{status.sessionId}</code></div>
              {status.userId && <div>User: <code className="text-xs">{status.userId}</code></div>}
              <div>Stored Errors: {status.errorCount}</div>
              <div>Stored Metrics: {metrics.length}</div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={refresh}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
              <Button size="sm" variant="outline" onClick={clearData}>
                <Trash2 className="h-3 w-3 mr-1" />
                Clear Data
              </Button>
              <Button size="sm" variant="outline" onClick={testError}>
                Test Error
              </Button>
              <Button size="sm" variant="outline" onClick={testEmptyError}>
                Test Empty Error
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  if (status.enabled) {
                    monitoring.disable()
                  } else {
                    monitoring.enable()
                  }
                  refresh()
                }}
              >
                {status.enabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </div>

          {/* Recent Errors */}
          {errors.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  Recent Errors ({errors.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {errors.slice(-5).reverse().map((error, index) => (
                    <div key={index} className="p-2 bg-muted rounded text-xs">
                      <div className="font-medium text-red-600">{error.message}</div>
                      <div className="text-muted-foreground">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </div>
                      {error.stack && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-blue-600">Stack trace</summary>
                          <pre className="text-xs mt-1 whitespace-pre-wrap break-all">
                            {error.stack.slice(0, 200)}...
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Environment Info */}
          <Separator />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Environment</h4>
            <div className="text-xs space-y-1">
              <div>NODE_ENV: {process.env.NODE_ENV}</div>
              <div>Monitoring Endpoint: {process.env.NEXT_PUBLIC_MONITORING_ENDPOINT || 'Not set'}</div>
              <div>Enable Monitoring: {process.env.NEXT_PUBLIC_ENABLE_MONITORING || 'Not set'}</div>
            </div>
          </div>
        </CardContent>
        )}
      </Card>
    </div>
  )
}

// Helper hook to add monitoring debug to any component
export function useMonitoringDebug() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Add global debugging functions
      ;(window as any).__monitoring_debug = {
        status: () => monitoring.getStatus(),
        errors: () => monitoring.getStoredErrors(),
        metrics: () => monitoring.getStoredMetrics(),
        clear: () => monitoring.clearStoredData(),
        disable: () => monitoring.disable(),
        enable: () => monitoring.enable(),
        testError: (message?: string) => monitoring.captureError(new Error(message || 'Test error'))
      }
      
      console.log('🐛 Monitoring debug functions available at window.__monitoring_debug')
    }
  }, [])
}
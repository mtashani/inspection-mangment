'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { inspectionsApi, maintenanceEventsApi } from '@/lib/api/maintenance-events'
import { inspectionsApi as dailyReportsInspectionsApi } from '@/lib/api/daily-reports'
import { RefreshCw, Zap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface ApiTestResult {
  endpoint: string
  success: boolean
  data?: any
  error?: string
  responseTime?: number
}

export function ApiDebugComponent() {
  const queryClient = useQueryClient()
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<ApiTestResult[]>([])

  const testApi = async (
    name: string,
    endpoint: string,
    apiCall: () => Promise<any>
  ): Promise<ApiTestResult> => {
    const startTime = Date.now()
    try {
      const data = await apiCall()
      const responseTime = Date.now() - startTime
      return {
        endpoint: `${name}: ${endpoint}`,
        success: true,
        data,
        responseTime
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        endpoint: `${name}: ${endpoint}`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      }
    }
  }

  const runApiTests = async () => {
    setTesting(true)
    setResults([])

    const tests = [
      // Test inspections API for event 14 (user's problem case)
      () => testApi(
        'Inspections API (maintenance-events.ts)',
        'GET /api/v1/inspections?maintenance_event_id=14',
        () => inspectionsApi.getInspections({ eventId: '14' })
      ),
      
      // Test inspections API for event 14 with sub-event
      () => testApi(
        'Inspections API with sub-event',
        'GET /api/v1/inspections?maintenance_event_id=14&maintenance_sub_event_id=1',
        () => inspectionsApi.getInspections({ eventId: '14', subEventId: 1 })
      ),

      // Test the daily-reports inspections API
      () => testApi(
        'Inspections API (daily-reports.ts)',
        'GET /api/v1/inspections?maintenance_event_id=14',
        () => dailyReportsInspectionsApi.getInspections({ eventId: '14' })
      ),

      // Test maintenance event 14
      () => testApi(
        'Maintenance Event API',
        'GET /api/v1/maintenance/events/14',
        () => maintenanceEventsApi.getMaintenanceEvent('14')
      ),

      // Test backend connectivity
      () => testApi(
        'Backend Health Check',
        'Test connection to backend',
        async () => {
          const response = await fetch('http://localhost:8000/health')
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          return await response.json()
        }
      ),
    ]

    const testResults: ApiTestResult[] = []
    for (const test of tests) {
      try {
        const result = await test()
        testResults.push(result)
        setResults([...testResults])
      } catch (error) {
        testResults.push({
          endpoint: 'Test execution failed',
          success: false,
          error: error instanceof Error ? error.message : 'Test failed'
        })
        setResults([...testResults])
      }
    }

    setTesting(false)
  }

  const clearAllCaches = () => {
    // Clear React Query cache
    queryClient.clear()
    
    // Clear localStorage cache if any
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.includes('query') || key.includes('cache') || key.includes('event') || key.includes('inspection')) {
          localStorage.removeItem(key)
        }
      })
    }
    
    console.log('🧹 All caches cleared')
  }

  const invalidateEventCaches = () => {
    // Specifically invalidate caches for event 14
    queryClient.invalidateQueries({ queryKey: ['inspections'] })
    queryClient.invalidateQueries({ queryKey: ['maintenance-events', '14'] })
    queryClient.invalidateQueries({ queryKey: ['maintenance-sub-events', '14'] })
    
    console.log('🔄 Event 14 caches invalidated')
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          API Debug & Cache Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test API connectivity and manage React Query cache for event 14 troubleshooting
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={runApiTests} 
            disabled={testing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} />
            Test APIs
          </Button>
          
          <Button 
            variant="outline" 
            onClick={clearAllCaches}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Clear All Caches
          </Button>
          
          <Button 
            variant="outline" 
            onClick={invalidateEventCaches}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Invalidate Event 14
          </Button>
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Test Results:</h3>
            {results.map((result, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium text-sm">{result.endpoint}</span>
                      {result.responseTime && (
                        <Badge variant="outline" className="text-xs">
                          {result.responseTime}ms
                        </Badge>
                      )}
                    </div>
                    
                    {result.success && result.data && (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded mt-2">
                        <strong>Response:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {JSON.stringify(result.data, null, 2).slice(0, 500)}
                          {JSON.stringify(result.data, null, 2).length > 500 ? '...' : ''}
                        </pre>
                      </div>
                    )}
                    
                    {!result.success && result.error && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
          <strong>How to use:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Click &quot;Test APIs&quot; to check backend connectivity for event 14</li>
            <li>If APIs return mock data, the backend is working but using fallback data</li>
            <li>Click &quot;Clear All Caches&quot; to remove all cached data</li>
            <li>Click &quot;Invalidate Event 14&quot; to refresh just this event&apos;s data</li>
            <li>After clearing caches, refresh the page and check if the issue persists</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
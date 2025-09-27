/**
 * Auth Debug Component
 * A React component to test authentication and session issues
 */

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Clock, Key, RefreshCw, Shield, User, Wifi } from 'lucide-react'
import AuthSessionTester from '@/lib/debug/auth-session-test'

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  details?: any
}

interface TestSummary {
  total: number
  passed: number
  failed: number
  warnings: number
}

export function AuthDebugComponent() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [summary, setSummary] = useState<TestSummary | null>(null)
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<string[]>([])

  const runTests = async () => {
    setIsRunning(true)
    try {
      const tester = new AuthSessionTester()
      const testResults = await tester.runAllTests()
      
      setResults(testResults.results)
      setSummary(testResults.summary)
      setSessionInfo(testResults.sessionInfo)
      setRecommendations(testResults.recommendations)
      
      // Also print to console for debugging
      tester.printResults(testResults)
    } catch (error) {
      console.error('Error running auth tests:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAIL':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'WARNING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'FAIL':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const clearCookiesAndReload = () => {
    // Clear all cookies for this domain
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=")
      const name = eqPos > -1 ? c.substr(0, eqPos) : c
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
    })
    
    // Clear localStorage and sessionStorage
    localStorage.clear()
    sessionStorage.clear()
    
    // Reload page
    window.location.reload()
  }

  const goToLogin = () => {
    window.location.href = '/login'
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication & Session Debugger
          </CardTitle>
          <CardDescription>
            تشخیص مشکلات احراز هویت و session در سیستم - Diagnose authentication and session issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              {isRunning ? 'Running Tests...' : 'Run Authentication Test'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={clearCookiesAndReload}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Clear Session & Reload
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={goToLogin}
              className="flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {sessionInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Session Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Token Present:</span>
                  <Badge className={sessionInfo.hasToken ? 'ml-2 bg-green-100 text-green-800' : 'ml-2 bg-red-100 text-red-800'}>
                    {sessionInfo.hasToken ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {sessionInfo.hasToken && (
                  <>
                    <div>
                      <span className="font-medium">Token Expired:</span>
                      <Badge className={sessionInfo.isExpired ? 'ml-2 bg-red-100 text-red-800' : 'ml-2 bg-green-100 text-green-800'}>
                        {sessionInfo.isExpired ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    {sessionInfo.expiryDate && (
                      <div className="col-span-2">
                        <span className="font-medium">Token Expires:</span>
                        <span className="ml-2 text-sm font-mono">{sessionInfo.expiryDate}</span>
                      </div>
                    )}
                    {sessionInfo.roles && sessionInfo.roles.length > 0 && (
                      <div className="col-span-2">
                        <span className="font-medium">Roles:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sessionInfo.roles.map((role: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {sessionInfo.permissions && sessionInfo.permissions.length > 0 && (
                      <div className="col-span-2">
                        <span className="font-medium">Permissions:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sessionInfo.permissions.map((permission: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <p className="text-sm mt-1">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer hover:underline">Show Details</summary>
                      <pre className="text-xs mt-1 p-2 bg-black/5 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                  <div className="text-blue-600 text-sm">💡</div>
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">نحوه استفاده - How to Use</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-700">
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Run Authentication Test" to check your current session</li>
            <li>Review the test results to identify issues</li>
            <li>Follow the recommendations to fix problems</li>
            <li>If session is expired, use "Clear Session & Reload" then "Go to Login"</li>
            <li>Check browser console for detailed technical information</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthDebugComponent
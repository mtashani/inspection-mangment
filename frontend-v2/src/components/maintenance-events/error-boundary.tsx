'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, RefreshCw, Home, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

export class MaintenanceEventsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('MaintenanceEventsErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Report to error tracking service (if available)
    this.reportError(error, errorInfo)

    // Show user-friendly toast
    toast.error('Something went wrong with the maintenance events. Please try refreshing the page.')
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to your error tracking service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    }

    // Example: Send to error tracking service
    // errorTrackingService.report(errorReport)
    
    // For now, just log to console
    console.group('🚨 Error Report')
    console.error('Error ID:', errorReport.errorId)
    console.error('Message:', errorReport.message)
    console.error('Stack:', errorReport.stack)
    console.error('Component Stack:', errorReport.componentStack)
    console.error('Full Report:', errorReport)
    console.groupEnd()
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  private handleGoHome = () => {
    window.location.href = '/maintenance-events'
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorId } = this.state
      const isNetworkError = error?.message.includes('fetch') || error?.message.includes('network')
      const isValidationError = error?.message.includes('validation') || error?.message.includes('invalid')
      const isPermissionError = error?.message.includes('permission') || error?.message.includes('403')

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Maintenance Events Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Type Badge */}
              <div className="flex gap-2">
                {isNetworkError && (
                  <Badge variant="destructive">Network Error</Badge>
                )}
                {isValidationError && (
                  <Badge variant="destructive">Validation Error</Badge>
                )}
                {isPermissionError && (
                  <Badge variant="destructive">Permission Error</Badge>
                )}
                {!isNetworkError && !isValidationError && !isPermissionError && (
                  <Badge variant="destructive">Application Error</Badge>
                )}
              </div>

              {/* User-friendly message based on error type */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {isNetworkError && (
                    <div>
                      <strong>Connection Problem:</strong> Unable to connect to the server. Please check your internet connection and try again.
                    </div>
                  )}
                  {isValidationError && (
                    <div>
                      <strong>Data Validation Error:</strong> There was a problem with the data format. Please refresh the page and try again.
                    </div>
                  )}
                  {isPermissionError && (
                    <div>
                      <strong>Permission Denied:</strong> You don&apos;t have permission to perform this action. Please contact your administrator.
                    </div>
                  )}
                  {!isNetworkError && !isValidationError && !isPermissionError && (
                    <div>
                      <strong>Unexpected Error:</strong> Something went wrong while processing your request. We&apos;ve been notified and are working on a fix.
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              {/* Error Details (for development) */}
              {process.env.NODE_ENV === 'development' && error && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Error Details (Development Only)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-xs">
                      <strong>Error ID:</strong> {errorId}
                    </div>
                    <div className="text-xs">
                      <strong>Message:</strong> {error.message}
                    </div>
                    {error.stack && (
                      <details className="text-xs">
                        <summary className="cursor-pointer font-medium">Stack Trace</summary>
                        <pre className="mt-2 whitespace-pre-wrap bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Recovery Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.handleRetry}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={this.handleReload}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go to Events List
                </Button>
              </div>

              {/* Support Information */}
              <div className="text-xs text-muted-foreground border-t pt-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  <span>
                    If this problem persists, please contact support with Error ID: 
                    <code className="ml-1 bg-muted px-1 rounded">{errorId}</code>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for manual error reporting
export function useErrorReporting() {
  const reportError = (error: Error, context?: string) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    console.error('Manual Error Report:', errorReport)
    
    // Show user feedback
    toast.error(`Error: ${error.message}`)
    
    return errorReport.errorId
  }

  const reportValidationError = (field: string, message: string) => {
    const error = new Error(`Validation error in ${field}: ${message}`)
    return reportError(error, 'validation')
  }

  const reportNetworkError = (endpoint: string, message: string) => {
    const error = new Error(`Network error for ${endpoint}: ${message}`)
    return reportError(error, 'network')
  }

  return {
    reportError,
    reportValidationError,
    reportNetworkError
  }
}
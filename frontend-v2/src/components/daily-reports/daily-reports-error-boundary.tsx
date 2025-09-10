'use client'

// Daily Reports Error Boundary
// Error boundary component specifically for Daily Reports functionality

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  children: ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

interface State {
  hasError: boolean
  error?: Error
}

export class DailyReportsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Daily Reports Error Boundary caught an error:', error, errorInfo)
    
    // You can log the error to an error reporting service here
    // logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback
      return <Fallback error={this.state.error!} resetError={this.handleReset} />
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network')
  const isAuthError = error.message.includes('401') || error.message.includes('unauthorized')

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              {isAuthError 
                ? 'You are not authorized to view this page. Please log in again.'
                : isNetworkError
                ? 'Unable to connect to the server. Please check your internet connection.'
                : error.message || 'An unexpected error occurred while loading the daily reports.'
              }
            </AlertDescription>
          </Alert>

          <div className="flex flex-col space-y-2">
            <Button onClick={resetError} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Reload Page
            </Button>

            {isAuthError && (
              <Button 
                variant="secondary" 
                onClick={() => window.location.href = '/login'} 
                className="w-full"
              >
                Go to Login
              </Button>
            )}
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Error Details (Development)
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Hook for using error boundary programmatically
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack: string }) => {
    console.error('Daily Reports Error:', error, errorInfo)
    
    // You can add additional error handling logic here
    // such as sending to error tracking service
  }
}
'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error: Error | null
  resetError: () => void
  errorInfo?: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to monitoring service
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Something went wrong
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          We&apos;re sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
        </p>
        
        {isDevelopment && error && (
          <details className="bg-muted p-4 rounded-lg">
            <summary className="cursor-pointer font-medium mb-2">
              Error Details (Development Only)
            </summary>
            <pre className="text-xs overflow-auto whitespace-pre-wrap">
              {error.toString()}
              {error.stack}
            </pre>
          </details>
        )}
        
        <div className="flex items-center gap-2">
          <Button onClick={resetError} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard'}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
          {isDevelopment && (
            <Button 
              variant="outline" 
              onClick={() => {
                console.error('Error details:', error)
                alert('Error logged to console')
              }}
              className="gap-2"
            >
              <Bug className="h-4 w-4" />
              Debug
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Specialized error fallbacks
export function PageErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <DefaultErrorFallback error={error} resetError={resetError} />
    </div>
  )
}

export function ComponentErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Card className="border-destructive">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-destructive mb-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">Component Error</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          This component failed to load properly.
        </p>
        <Button size="sm" onClick={resetError} className="gap-2">
          <RefreshCw className="h-3 w-3" />
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}

// Hook for using error boundary in functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo)
    // You can also report to error tracking service here
  }
}
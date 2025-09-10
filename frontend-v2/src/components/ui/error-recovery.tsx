'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Trash2, 
  Bug,
  Wifi,
  Server
} from 'lucide-react'
import { classifyError, errorRecoveryStrategies } from '@/lib/utils/error-handling'

interface ErrorRecoveryProps {
  error: Error | null
  onRetry?: () => void | Promise<void>
  onReset?: () => void
  showDetails?: boolean
  className?: string
}

export function ErrorRecovery({ 
  error, 
  onRetry, 
  onReset,
  showDetails = false,
  className 
}: ErrorRecoveryProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [showErrorDetails, setShowErrorDetails] = useState(showDetails)

  if (!error) return null

  const errorInfo = classifyError(error)
  const isDevelopment = process.env.NODE_ENV === 'development'

  const handleRetry = async () => {
    if (!onRetry) return
    
    setIsRetrying(true)
    try {
      await onRetry()
    } catch (retryError) {
      console.error('Retry failed:', retryError)
    } finally {
      setIsRetrying(false)
    }
  }

  const getErrorIcon = () => {
    switch (errorInfo.type) {
      case 'network':
        return <Wifi className="h-5 w-5" />
      case 'api':
        return <Server className="h-5 w-5" />
      default:
        return <AlertTriangle className="h-5 w-5" />
    }
  }

  const getErrorTitle = () => {
    switch (errorInfo.type) {
      case 'network':
        return 'Connection Problem'
      case 'api':
        return 'Server Error'
      case 'validation':
        return 'Validation Error'
      default:
        return 'Something went wrong'
    }
  }

  const getErrorMessage = () => {
    switch (errorInfo.type) {
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection.'
      case 'api':
        return errorInfo.statusCode === 500 
          ? 'The server encountered an error. Please try again later.'
          : errorInfo.message
      case 'validation':
        return 'Please check your input and try again.'
      default:
        return errorInfo.message
    }
  }

  const getRecoveryActions = () => {
    const actions = []

    // Retry action
    if (errorInfo.retryable && onRetry) {
      actions.push(
        <Button
          key="retry"
          onClick={handleRetry}
          disabled={isRetrying}
          className="gap-2"
        >
          {isRetrying ? (
            <LoadingSpinner size="sm" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </Button>
      )
    }

    // Reset action
    if (onReset) {
      actions.push(
        <Button
          key="reset"
          variant="outline"
          onClick={onReset}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reset
        </Button>
      )
    }

    // Go home action
    actions.push(
      <Button
        key="home"
        variant="outline"
        onClick={errorRecoveryStrategies.goHome}
        className="gap-2"
      >
        <Home className="h-4 w-4" />
        Go Home
      </Button>
    )

    // Clear storage action (for persistent errors)
    if (errorInfo.type === 'client') {
      actions.push(
        <Button
          key="clear"
          variant="outline"
          onClick={errorRecoveryStrategies.clearStorageAndRefresh}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear & Refresh
        </Button>
      )
    }

    return actions
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          {getErrorIcon()}
          {getErrorTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            {getErrorMessage()}
          </AlertDescription>
        </Alert>

        {/* Error details for development */}
        {isDevelopment && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              className="gap-2"
            >
              <Bug className="h-3 w-3" />
              {showErrorDetails ? 'Hide' : 'Show'} Error Details
            </Button>
            
            {showErrorDetails && (
              <details className="bg-muted p-4 rounded-lg">
                <summary className="cursor-pointer font-medium mb-2">
                  Technical Details
                </summary>
                <div className="space-y-2 text-xs">
                  <div>
                    <strong>Type:</strong> {errorInfo.type}
                  </div>
                  {errorInfo.statusCode && (
                    <div>
                      <strong>Status Code:</strong> {errorInfo.statusCode}
                    </div>
                  )}
                  <div>
                    <strong>Retryable:</strong> {errorInfo.retryable ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Message:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 overflow-auto whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Recovery actions */}
        <div className="flex flex-wrap items-center gap-2">
          {getRecoveryActions()}
        </div>
      </CardContent>
    </Card>
  )
}

// Compact error recovery for inline use
export function InlineErrorRecovery({ 
  error, 
  onRetry, 
  className 
}: Pick<ErrorRecoveryProps, 'error' | 'onRetry' | 'className'>) {
  const [isRetrying, setIsRetrying] = useState(false)

  if (!error) return null

  const errorInfo = classifyError(error)

  const handleRetry = async () => {
    if (!onRetry) return
    
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{errorInfo.message}</span>
        {errorInfo.retryable && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="ml-4"
          >
            {isRetrying ? (
              <LoadingSpinner size="sm" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            {isRetrying ? 'Retrying...' : 'Retry'}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
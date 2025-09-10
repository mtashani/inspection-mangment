'use client';

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface AdminErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

function AdminErrorFallback({ error, resetError }: AdminErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl text-destructive">
            Admin Panel Error
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              An error occurred in the admin panel. Please try again.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                  {error.message}
                  {error.stack && '\n\n' + error.stack}
                </pre>
              </details>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={resetError} variant="outline" className="w-full sm:w-auto">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/admin">
                <Home className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AdminErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<AdminErrorFallbackProps>;
}

interface AdminErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary specifically for admin panel components
 * Provides a consistent error handling experience for admin features
 */
export class AdminErrorBoundary extends Component<AdminErrorBoundaryProps, AdminErrorBoundaryState> {
  constructor(props: AdminErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AdminErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error('Admin Panel Error:', error);
    
    // Only log error info in development and if it contains meaningful data
    if (process.env.NODE_ENV === 'development' && errorInfo && errorInfo.componentStack && errorInfo.componentStack.trim().length > 0) {
      console.error('Error Info:', errorInfo);
    }
    
    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || AdminErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}
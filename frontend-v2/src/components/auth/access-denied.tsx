'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, Home, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  showContactAdmin?: boolean;
}

/**
 * AccessDenied component for unauthorized access scenarios
 * Shows appropriate error message and navigation options
 */
export function AccessDenied({
  title = 'Access Denied',
  message = 'You do not have permission to access this resource.',
  showBackButton = true,
  showHomeButton = true,
  showContactAdmin = true,
}: AccessDeniedProps) {
  const router = useRouter();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">
            {title}
          </CardTitle>
          <CardDescription className="text-base">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {user && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">Current User:</p>
              <p className="text-muted-foreground">{user.name} ({user.username})</p>
              {user.roles && user.roles.length > 0 && (
                <p className="text-muted-foreground">
                  Roles: {user.roles.join(', ')}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {showBackButton && (
              <Button 
                variant="outline" 
                onClick={handleGoBack}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            )}
            
            {showHomeButton && (
              <Button 
                onClick={handleGoHome}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            )}
          </div>

          {showContactAdmin && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Need Access?</p>
                  <p className="text-muted-foreground">
                    Contact your system administrator to request the necessary permissions for this resource.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Minimal AccessDenied component for inline use
 */
export function InlineAccessDenied({ 
  message = 'You do not have permission to view this content.' 
}: { 
  message?: string 
}) {
  return (
    <div className="flex items-center justify-center p-8 text-center">
      <div className="space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <Shield className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-destructive">Access Denied</h3>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}
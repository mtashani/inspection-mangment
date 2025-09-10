'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface InspectionsListErrorProps {
  error: Error
}

export function InspectionsListError({ error }: InspectionsListErrorProps) {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Failed to load inspections</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {error.message || 'An unexpected error occurred while loading the inspections.'}
          </p>
        </div>
        <Button onClick={handleRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}
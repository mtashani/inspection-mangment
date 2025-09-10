'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface DailyReportsErrorProps {
  error: Error | null
  onRetry?: () => void
}

export function DailyReportsError({ error, onRetry }: DailyReportsErrorProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
        <AlertCircle className="h-16 w-16 text-red-500" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Failed to load daily reports</h3>
          <p className="text-sm text-muted-foreground">
            {error?.message || 'An error occurred while loading the daily reports.'}
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
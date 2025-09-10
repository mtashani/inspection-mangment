'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EventNotFoundProps {
  eventId: string
}

export function EventNotFound({ eventId }: EventNotFoundProps) {
  const router = useRouter()

  const handleGoBack = () => {
    router.push('/maintenance-events')
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
        <AlertTriangle className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Maintenance Event Not Found</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            The maintenance event with ID &quot;{eventId}&quot; could not be found. 
            It may have been deleted or you may not have permission to view it.
          </p>
        </div>
        <Button onClick={handleGoBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Button>
      </CardContent>
    </Card>
  )
}
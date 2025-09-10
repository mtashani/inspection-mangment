'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus } from 'lucide-react'

interface DailyReportsEmptyProps {
  title?: string
  description?: string
  showCreateButton?: boolean
  onCreateReport?: () => void
}

export function DailyReportsEmpty({ 
  title = "No daily reports found",
  description = "No daily reports have been created yet for this inspection.",
  showCreateButton = false,
  onCreateReport
}: DailyReportsEmptyProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        {showCreateButton && onCreateReport && (
          <Button onClick={onCreateReport} className="gap-2">
            <Plus className="h-4 w-4" />
            Create First Report
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { ReportTemplate } from '@/types/admin'

interface TemplateDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: ReportTemplate
  onDelete: () => void
}

export function TemplateDeleteDialog({
  open,
  onOpenChange,
  template,
  onDelete
}: TemplateDeleteDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await onDelete()
      toast({
        title: 'Template Deleted',
        description: `Template "${template.name}" has been deleted successfully`,
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!isLoading) {
      onOpenChange(open)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Delete Template
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The template and all its data will be permanently removed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{template.name}</h4>
              <Badge variant="secondary">{template.reportType}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{template.sections.length} sections</span>
              <span>{template.fieldsCount} fields</span>
              <span>v{template.version}</span>
              <span>
                Status: {template.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Warning for Active Templates */}
          {template.isActive && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This template is currently active and may be in use. Deleting it could affect existing reports or workflows.
              </AlertDescription>
            </Alert>
          )}

          {/* Usage Warning */}
          {template.lastUsedAt && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This template was last used on {new Date(template.lastUsedAt).toLocaleDateString()}. 
                Deleting it may affect historical data or reports.
              </AlertDescription>
            </Alert>
          )}

          {/* Confirmation Text */}
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm font-medium text-destructive mb-2">
              Are you sure you want to delete this template?
            </p>
            <ul className="text-xs text-destructive/80 space-y-1">
              <li>• All template sections and fields will be permanently removed</li>
              <li>• Template history and versions will be lost</li>
              <li>• This action cannot be undone</li>
              {template.isActive && (
                <li>• Any active workflows using this template may be affected</li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
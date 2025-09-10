'use client'

import { useState } from 'react'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ReportTemplate } from '@/types/admin'

interface TemplateCloneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: ReportTemplate
  onClone: (newName: string) => void
}

export function TemplateCloneDialog({
  open,
  onOpenChange,
  template,
  onClone
}: TemplateCloneDialogProps) {
  const { toast } = useToast()
  const [newName, setNewName] = useState(`${template.name} (Copy)`)
  const [isLoading, setIsLoading] = useState(false)

  const handleClone = async () => {
    if (!newName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the cloned template',
        variant: 'destructive',
      })
      return
    }

    if (newName.trim() === template.name) {
      toast({
        title: 'Error',
        description: 'The new name must be different from the original template name',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      await onClone(newName.trim())
      toast({
        title: 'Template Cloned',
        description: `Template "${newName}" has been created successfully`,
      })
      onOpenChange(false)
      setNewName(`${template.name} (Copy)`) // Reset for next time
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clone template. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!isLoading) {
      onOpenChange(open)
      if (!open) {
        setNewName(`${template.name} (Copy)`) // Reset when closing
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Clone Template
          </DialogTitle>
          <DialogDescription>
            Create a copy of the selected template with a new name. All sections and fields will be duplicated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original Template Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Original Template</h4>
              <Badge variant="secondary">{template.reportType}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{template.name}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{template.sections.length} sections</span>
              <span>{template.fieldsCount} fields</span>
              <span>v{template.version}</span>
            </div>
          </div>

          {/* New Template Name */}
          <div className="space-y-2">
            <Label htmlFor="newName">New Template Name</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter name for the cloned template"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              The cloned template will have the same structure and fields as the original.
            </p>
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
            onClick={handleClone}
            disabled={isLoading || !newName.trim()}
          >
            {isLoading ? 'Cloning...' : 'Clone Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
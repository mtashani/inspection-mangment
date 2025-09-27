'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, FileText, Calendar, Info } from 'lucide-react'
import { DocumentInfo as Document } from '@/lib/api/admin/files'

interface EnhancedDocumentDeleteDialogProps {
  document: Document | null
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

export function EnhancedDocumentDeleteDialog({
  document,
  open,
  onClose,
  onConfirm,
  isLoading
}: EnhancedDocumentDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState('')

  // Reset state when dialog opens/closes
  const resetDialogState = useCallback(() => {
    setConfirmText('')
  }, [])

  const handleClose = useCallback(() => {
    resetDialogState()
    onClose()
  }, [resetDialogState, onClose])

  const handleDelete = useCallback(() => {
    if (confirmText !== 'delete') return
    onConfirm()
  }, [confirmText, onConfirm])

  if (!document) return null

  const isConfirmValid = confirmText === 'delete'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-md max-h-[80vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          e.preventDefault()
          handleClose()
        }}
        onEscapeKeyDown={() => {
          handleClose()
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Document
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete `{document.original_filename}`?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Document Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Filename:</span>
                <span className="font-medium">{document.original_filename}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{document.document_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Size:</span>
                <span className="font-medium">{document.file_size_mb.toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uploaded:</span>
                <span className="font-medium">{new Date(document.upload_date).toLocaleDateString()}</span>
              </div>
              {document.description && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="font-medium">{document.description}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">MIME Type:</span>
                <span className="font-medium">
                  <Badge variant="secondary" className="text-xs">{document.mime_type || 'Unknown'}</Badge>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label htmlFor="confirm-text" className="text-sm font-medium">
              Type `delete` to confirm:
            </label>
            <Input
              id="confirm-text"
              placeholder="Type 'delete' to confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <Separator />

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isLoading}
            type="button"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmValid || isLoading}
            type="button"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : null}
            {isLoading ? 'Deleting...' : 'Delete Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
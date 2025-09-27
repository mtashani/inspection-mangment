'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, Info, Users, FileText, Bell, Settings } from 'lucide-react'
import { Inspector } from '@/types/admin'
import { getInspectorRelatedRecords } from '@/lib/api/admin/inspectors'

interface EnhancedDeleteDialogProps {
  inspector: Inspector | null
  open: boolean
  onClose: () => void
  onConfirm: (force: boolean) => void
  isLoading: boolean
}

export function EnhancedDeleteDialog({
  inspector,
  open,
  onClose,
  onConfirm,
  isLoading
}: EnhancedDeleteDialogProps) {
  const queryClient = useQueryClient()
  const [confirmText, setConfirmText] = useState('')
  const [showForceOptions, setShowForceOptions] = useState(false)
  const [attempted, setAttempted] = useState(false)

  // Fetch related records when dialog opens
  const {
    data: relatedRecords,
    isLoading: loadingRelated,
    error: relatedError
  } = useQuery({
    queryKey: ['inspector-related-records', inspector?.id],
    queryFn: () => inspector ? getInspectorRelatedRecords(inspector.id) : null,
    enabled: open && !!inspector,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0 // Don't cache this data
  })

  // Proper cleanup function
  const resetDialogState = useCallback(() => {
    setConfirmText('')
    setShowForceOptions(false)
    setAttempted(false)
    // Clear the query when dialog closes
    if (!open) {
      queryClient.removeQueries({ 
        queryKey: ['inspector-related-records'], 
        exact: false 
      })
    }
  }, [open, queryClient])

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      resetDialogState()
    } else {
      // Cleanup when dialog closes
      resetDialogState()
    }
  }, [open, resetDialogState])

  // Show force options if there are related records
  useEffect(() => {
    if (relatedRecords && !relatedRecords.can_delete_safely) {
      setShowForceOptions(true)
    }
  }, [relatedRecords])

  // Enhanced close handler
  const handleClose = useCallback(() => {
    resetDialogState()
    onClose()
  }, [resetDialogState, onClose])

  // Enhanced delete handler
  const handleDelete = useCallback((force = false) => {
    if (confirmText !== 'delete') return
    setAttempted(true)
    onConfirm(force)
  }, [confirmText, onConfirm])

  if (!inspector) return null

  const isConfirmValid = confirmText === 'delete'
  const hasRelatedRecords = relatedRecords && relatedRecords.total_related_records > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // Prevent background click issues
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
            Delete Inspector
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete inspector "{inspector.name}"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Inspector Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Inspector Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{inspector.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Employee ID:</span>
                <span className="font-medium">{inspector.employeeId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{inspector.email}</span>
              </div>
            </CardContent>
          </Card>

          {/* Related Records Information */}
          {loadingRelated && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">Checking related records...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {relatedError && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to check related records. Proceeding may cause deletion errors.
              </AlertDescription>
            </Alert>
          )}

          {relatedRecords && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Related Records Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {relatedRecords.can_delete_safely ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      ✅ This inspector can be safely deleted with no related records.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        ⚠️ This inspector has {relatedRecords.total_related_records} related records that will prevent deletion.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-2 gap-4">
                      {relatedRecords.related_records.roles.count > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Role Assignments</span>
                          <Badge variant="secondary">{relatedRecords.related_records.roles.count}</Badge>
                        </div>
                      )}
                      
                      {relatedRecords.related_records.documents.count > 0 && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Documents</span>
                          <Badge variant="secondary">{relatedRecords.related_records.documents.count}</Badge>
                        </div>
                      )}
                      
                      {relatedRecords.related_records.notifications.count > 0 && (
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">Notifications</span>
                          <Badge variant="secondary">{relatedRecords.related_records.notifications.count}</Badge>
                        </div>
                      )}
                      
                      {relatedRecords.related_records.notification_preferences.count > 0 && (
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-purple-500" />
                          <span className="text-sm">Preferences</span>
                          <Badge variant="secondary">{relatedRecords.related_records.notification_preferences.count}</Badge>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Deletion Options */}
          {showForceOptions && hasRelatedRecords && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Force Delete Option:</strong> You can force delete this inspector, which will also remove all related records (roles, documents, notifications, etc.). This action cannot be undone.
              </AlertDescription>
            </Alert>
          )}

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label htmlFor="confirm-text" className="text-sm font-medium">
              Type "delete" to confirm:
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
          
          {showForceOptions && hasRelatedRecords ? (
            <div className="flex gap-2">
              <Button 
                variant="destructive"
                onClick={() => handleDelete(true)}
                disabled={!isConfirmValid || isLoading}
                className="bg-red-600 hover:bg-red-700"
                type="button"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                Force Delete All
              </Button>
            </div>
          ) : (
            <Button 
              variant="destructive"
              onClick={() => handleDelete(false)}
              disabled={!isConfirmValid || isLoading}
              type="button"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : null}
              Delete Inspector
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
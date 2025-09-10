'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Loader2, Calendar, FileText } from 'lucide-react'
import { DailyReport } from '@/types/maintenance-events'
import { format } from 'date-fns'

interface BulkDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reportIds: number[]) => void
  reports: DailyReport[]
  isLoading?: boolean
}

export function BulkDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  reports,
  isLoading = false
}: BulkDeleteDialogProps) {
  const [selectedReports, setSelectedReports] = useState<number[]>([])
  const [confirmationInput, setConfirmationInput] = useState('')

  const handleReportToggle = (reportId: number, checked: boolean) => {
    if (checked) {
      setSelectedReports(prev => [...prev, reportId])
    } else {
      setSelectedReports(prev => prev.filter(id => id !== reportId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReports(reports.map(r => r.id))
    } else {
      setSelectedReports([])
    }
  }

  const handleConfirm = () => {
    if (confirmationInput.toLowerCase() !== 'delete' || selectedReports.length === 0) {
      return
    }
    onConfirm(selectedReports)
  }

  const handleClose = () => {
    if (!isLoading) {
      setSelectedReports([])
      setConfirmationInput('')
      onClose()
    }
  }

  const isConfirmDisabled = 
    confirmationInput.toLowerCase() !== 'delete' || 
    selectedReports.length === 0 || 
    isLoading

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Daily Reports
          </DialogTitle>
          <DialogDescription>
            Select the daily reports you want to delete. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center space-x-2 pb-2 border-b">
            <Checkbox
              id="select-all"
              checked={selectedReports.length === reports.length && reports.length > 0}
              onCheckedChange={handleSelectAll}
              disabled={isLoading}
            />
            <Label htmlFor="select-all" className="font-medium">
              Select All ({reports.length} reports)
            </Label>
            {selectedReports.length > 0 && (
              <Badge variant="secondary">
                {selectedReports.length} selected
              </Badge>
            )}
          </div>

          {/* Reports List */}
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50"
                >
                  <Checkbox
                    id={`report-${report.id}`}
                    checked={selectedReports.includes(report.id)}
                    onCheckedChange={(checked) => 
                      handleReportToggle(report.id, checked as boolean)
                    }
                    disabled={isLoading}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(report.report_date), 'MMM dd, yyyy')}
                      </span>
                      {report.inspector_name && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            {report.inspector_name}
                          </span>
                        </>
                      )}
                    </div>
                    {report.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {report.description}
                      </p>
                    )}
                  </div>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Confirmation Input */}
          {selectedReports.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="confirmation">
                Type <span className="font-mono font-semibold">delete</span> to confirm deletion of {selectedReports.length} report{selectedReports.length !== 1 ? 's' : ''}:
              </Label>
              <Input
                id="confirmation"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="delete"
                disabled={isLoading}
                className="font-mono"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading 
              ? `Deleting ${selectedReports.length} report${selectedReports.length !== 1 ? 's' : ''}...`
              : `Delete ${selectedReports.length} report${selectedReports.length !== 1 ? 's' : ''}`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
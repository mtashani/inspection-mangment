'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { 
  Download, 
  Upload, 
  Trash2, 
  Edit, 
  FileSpreadsheet, 
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { Inspector, InspectorFormData } from '@/types/admin'
import { 
  bulkUpdateInspectors, 
  bulkDeleteInspectors,
  exportInspectorData,
  importInspectorData 
} from '@/lib/api/admin/inspectors'
import { BulkRoleAssignment } from './bulk-role-assignment'

interface BulkOperationsProps {
  selectedInspectors: Inspector[]
  onSelectionChange: (inspectors: Inspector[]) => void
  onOperationComplete: () => void
}

type BulkOperation = 'update' | 'delete' | 'export' | 'import' | 'assign-roles'

interface BulkUpdateData {
  active?: boolean
  canLogin?: boolean
  attendanceTrackingEnabled?: boolean
  notes?: string
}

export function BulkOperations({ 
  selectedInspectors, 
  onSelectionChange, 
  onOperationComplete 
}: BulkOperationsProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [currentOperation, setCurrentOperation] = useState<BulkOperation | null>(null)
  const [bulkUpdateData, setBulkUpdateData] = useState<BulkUpdateData>({})
  const [importFile, setImportFile] = useState<File | null>(null)
  const [showRoleAssignment, setShowRoleAssignment] = useState(false)

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ inspectorIds, updates }: { inspectorIds: number[], updates: Partial<InspectorFormData> }) =>
      bulkUpdateInspectors(inspectorIds, updates),
    onSuccess: () => {
      toast.success(`Successfully updated ${selectedInspectors.length} inspectors`)
      handleOperationComplete()
    },
    onError: (error) => {
      toast.error(`Failed to update inspectors: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (inspectorIds: number[]) => bulkDeleteInspectors(inspectorIds),
    onSuccess: () => {
      toast.success(`Successfully deleted ${selectedInspectors.length} inspectors`)
      handleOperationComplete()
    },
    onError: (error) => {
      toast.error(`Failed to delete inspectors: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const exportMutation = useMutation({
    mutationFn: () => exportInspectorData(selectedInspectors.map(i => i.id)),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inspectors-export-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(`Exported ${selectedInspectors.length} inspectors`)
      handleOperationComplete()
    },
    onError: (error) => {
      toast.error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const importMutation = useMutation({
    mutationFn: (file: File) => importInspectorData(file),
    onSuccess: (result) => {
      toast.success(`Successfully imported ${result.successCount} inspectors`)
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} rows had errors`)
      }
      handleOperationComplete()
    },
    onError: (error) => {
      toast.error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const handleOperationComplete = () => {
    setShowDialog(false)
    setCurrentOperation(null)
    setBulkUpdateData({})
    setImportFile(null)
    onSelectionChange([])
    onOperationComplete()
  }

  const handleBulkUpdate = () => {
    setCurrentOperation('update')
    setShowDialog(true)
  }

  const handleBulkDelete = () => {
    setCurrentOperation('delete')
    setShowDialog(true)
  }

  const handleExport = () => {
    if (selectedInspectors.length === 0) {
      toast.error('Please select inspectors to export')
      return
    }
    exportMutation.mutate()
  }

  const handleImport = () => {
    setCurrentOperation('import')
    setShowDialog(true)
  }

  const handleBulkRoleAssignment = () => {
    if (selectedInspectors.length === 0) {
      toast.error('Please select inspectors to assign roles')
      return
    }
    setShowRoleAssignment(true)
  }

  const confirmBulkUpdate = () => {
    const inspectorIds = selectedInspectors.map(i => i.id)
    const updates: Partial<InspectorFormData> = {}
    
    if (bulkUpdateData.active !== undefined) updates.active = bulkUpdateData.active
    if (bulkUpdateData.canLogin !== undefined) updates.canLogin = bulkUpdateData.canLogin
    if (bulkUpdateData.attendanceTrackingEnabled !== undefined) {
      updates.attendanceTrackingEnabled = bulkUpdateData.attendanceTrackingEnabled
    }
    if (bulkUpdateData.notes) updates.notes = bulkUpdateData.notes

    bulkUpdateMutation.mutate({ inspectorIds, updates })
  }

  const confirmBulkDelete = () => {
    const inspectorIds = selectedInspectors.map(i => i.id)
    bulkDeleteMutation.mutate(inspectorIds)
  }

  const confirmImport = () => {
    if (!importFile) {
      toast.error('Please select a file to import')
      return
    }
    importMutation.mutate(importFile)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
        toast.error('Please select an Excel (.xlsx) or CSV file')
        return
      }
      setImportFile(file)
    }
  }

  const isLoading = bulkUpdateMutation.isPending || 
                   bulkDeleteMutation.isPending || 
                   exportMutation.isPending || 
                   importMutation.isPending

  return (
    <>
      <div className="flex items-center gap-2">
        {selectedInspectors.length > 0 && (
          <Badge variant="secondary" className="mr-2">
            {selectedInspectors.length} selected
          </Badge>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Bulk Operations
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export Selected ({selectedInspectors.length})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import from File
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleBulkRoleAssignment}
              disabled={selectedInspectors.length === 0}
            >
              <Shield className="w-4 h-4 mr-2" />
              Assign Roles ({selectedInspectors.length})
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleBulkUpdate}
              disabled={selectedInspectors.length === 0}
            >
              <Edit className="w-4 h-4 mr-2" />
              Bulk Update ({selectedInspectors.length})
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleBulkDelete}
              disabled={selectedInspectors.length === 0}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Bulk Delete ({selectedInspectors.length})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bulk Update Dialog */}
      <Dialog open={showDialog && currentOperation === 'update'} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Bulk Update Inspectors
            </DialogTitle>
            <DialogDescription>
              Update settings for {selectedInspectors.length} selected inspectors
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulk-active"
                  checked={bulkUpdateData.active === true}
                  onCheckedChange={(checked) => 
                    setBulkUpdateData(prev => ({ ...prev, active: checked ? true : undefined }))
                  }
                />
                <Label htmlFor="bulk-active">Set as Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulk-login"
                  checked={bulkUpdateData.canLogin === true}
                  onCheckedChange={(checked) => 
                    setBulkUpdateData(prev => ({ ...prev, canLogin: checked ? true : undefined }))
                  }
                />
                <Label htmlFor="bulk-login">Enable Login</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulk-attendance"
                  checked={bulkUpdateData.attendanceTrackingEnabled === true}
                  onCheckedChange={(checked) => 
                    setBulkUpdateData(prev => ({ 
                      ...prev, 
                      attendanceTrackingEnabled: checked ? true : undefined 
                    }))
                  }
                />
                <Label htmlFor="bulk-attendance">Enable Attendance Tracking</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-notes">Add Notes</Label>
              <Textarea
                id="bulk-notes"
                placeholder="Additional notes to add to all selected inspectors..."
                value={bulkUpdateData.notes || ''}
                onChange={(e) => 
                  setBulkUpdateData(prev => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmBulkUpdate} disabled={isLoading}>
              {bulkUpdateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update {selectedInspectors.length} Inspectors
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={showDialog && currentOperation === 'delete'} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Inspectors
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete {selectedInspectors.length} inspectors 
              and all their associated data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Inspectors to be deleted:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedInspectors.map(inspector => (
                  <div key={inspector.id} className="text-sm text-red-700">
                    {inspector.name} ({inspector.employeeId})
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                All attendance records, reports, and associated data will also be deleted.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmBulkDelete} 
              disabled={isLoading}
            >
              {bulkDeleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete {selectedInspectors.length} Inspectors
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showDialog && currentOperation === 'import'} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Inspectors
            </DialogTitle>
            <DialogDescription>
              Import inspector data from an Excel or CSV file
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-file">Select File</Label>
              <input
                id="import-file"
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {importFile && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  {importFile.name}
                </div>
              )}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">File Format Requirements:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Required columns: name, employeeId, email</li>
                <li>• Optional columns: phone, active, canLogin</li>
                <li>• Boolean fields should be true/false or 1/0</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmImport} 
              disabled={!importFile || isLoading}
            >
              {importMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Import Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Role Assignment Dialog */}
      <BulkRoleAssignment
        selectedInspectors={selectedInspectors}
        isOpen={showRoleAssignment}
        onClose={() => setShowRoleAssignment(false)}
        onSuccess={handleOperationComplete}
      />
    </>
  )
}
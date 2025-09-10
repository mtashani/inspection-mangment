'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'

interface TemplateImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (file: File) => Promise<void>
}

interface ImportState {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error'
  progress: number
  message?: string
  error?: string
}

export function TemplateImportDialog({
  open,
  onOpenChange,
  onImport
}: TemplateImportDialogProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importState, setImportState] = useState<ImportState>({
    status: 'idle',
    progress: 0
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['application/json', 'text/yaml', 'application/x-yaml']
      const validExtensions = ['.json', '.yaml', '.yml']
      
      const hasValidType = validTypes.includes(file.type)
      const hasValidExtension = validExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      )

      if (!hasValidType && !hasValidExtension) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a JSON or YAML file',
          variant: 'destructive',
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please select a file smaller than 5MB',
          variant: 'destructive',
        })
        return
      }

      setSelectedFile(file)
      setImportState({ status: 'idle', progress: 0 })
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setImportState({ status: 'uploading', progress: 20, message: 'Uploading file...' })

    try {
      // Simulate upload progress
      await new Promise(resolve => setTimeout(resolve, 500))
      setImportState({ status: 'processing', progress: 60, message: 'Processing template...' })

      await onImport(selectedFile)

      setImportState({ 
        status: 'success', 
        progress: 100, 
        message: 'Template imported successfully!' 
      })

      toast({
        title: 'Import Successful',
        description: `Template from "${selectedFile.name}" has been imported successfully`,
      })

      // Close dialog after a short delay
      setTimeout(() => {
        handleClose()
      }, 1500)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import template'
      setImportState({ 
        status: 'error', 
        progress: 0, 
        error: errorMessage 
      })
      
      toast({
        title: 'Import Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const handleClose = () => {
    if (importState.status === 'uploading' || importState.status === 'processing') {
      return // Don't allow closing during import
    }
    
    onOpenChange(false)
    // Reset state when closing
    setTimeout(() => {
      setSelectedFile(null)
      setImportState({ status: 'idle', progress: 0 })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }, 200)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isImporting = importState.status === 'uploading' || importState.status === 'processing'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Template
          </DialogTitle>
          <DialogDescription>
            Import a template from a JSON or YAML file. The file should contain a valid template structure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Selection */}
          {importState.status === 'idle' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Select a template file</p>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: JSON, YAML (max 5MB)
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.yaml,.yml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {selectedFile && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Make sure the template file follows the correct format. Invalid templates will be rejected during import.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
                <p className="text-sm font-medium">{importState.message}</p>
              </div>
              <Progress value={importState.progress} className="w-full" />
            </div>
          )}

          {/* Success State */}
          {importState.status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-600">{importState.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The dialog will close automatically
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {importState.status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {importState.error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isImporting}
          >
            {importState.status === 'success' ? 'Close' : 'Cancel'}
          </Button>
          {importState.status === 'idle' && (
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
            >
              Import Template
            </Button>
          )}
          {importState.status === 'error' && (
            <Button
              onClick={() => {
                setImportState({ status: 'idle', progress: 0 })
                setSelectedFile(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
            >
              Try Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
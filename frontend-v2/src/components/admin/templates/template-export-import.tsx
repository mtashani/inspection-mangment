'use client'

import { useState } from 'react'
import { Download, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { 
  useExportTemplate, 
  useImportTemplate 
} from '@/hooks/admin/use-templates'
import { ReportTemplate } from '@/types/admin'

interface TemplateExportImportProps {
  template?: ReportTemplate
  onImportSuccess?: (template: ReportTemplate) => void
}

interface ExportOptions {
  format: 'JSON' | 'YAML'
  includeMetadata: boolean
  includeVersionHistory: boolean
  minifyOutput: boolean
}

export function TemplateExportImport({ 
  template, 
  onImportSuccess 
}: TemplateExportImportProps) {
  const { toast } = useToast()
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'JSON',
    includeMetadata: true,
    includeVersionHistory: false,
    minifyOutput: false
  })

  const exportTemplateMutation = useExportTemplate()
  const importTemplateMutation = useImportTemplate()

  const handleExport = async () => {
    if (!template) return

    try {
      await exportTemplateMutation.mutateAsync({
        id: template.id,
        format: exportOptions.format
      })
      
      setShowExportDialog(false)
      
      toast({
        title: 'Export Successful',
        description: `Template exported as ${exportOptions.format}`,
      })
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export template',
        variant: 'destructive',
      })
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    try {
      const importedTemplate = await importTemplateMutation.mutateAsync(selectedFile)
      
      setShowImportDialog(false)
      setSelectedFile(null)
      
      if (onImportSuccess) {
        onImportSuccess(importedTemplate)
      }
      
      toast({
        title: 'Import Successful',
        description: `Template "${importedTemplate.name}" imported successfully`,
      })
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import template',
        variant: 'destructive',
      })
    }
  }

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

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please select a file smaller than 10MB',
          variant: 'destructive',
        })
        return
      }

      setSelectedFile(file)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Export & Import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Section */}
          {template && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Export Template</h4>
                  <p className="text-sm text-muted-foreground">
                    Download template as JSON or YAML file
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowExportDialog(true)}
                  disabled={exportTemplateMutation.isPending}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {template.sections.length} sections, {template.fieldsCount} fields
                    </div>
                  </div>
                  <Badge variant="outline">{template.reportType}</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Import Section */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Import Template</h4>
                <p className="text-sm text-muted-foreground">
                  Upload a template file to import
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowImportDialog(true)}
                disabled={importTemplateMutation.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
            
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Supported formats: JSON (.json), YAML (.yaml, .yml). Maximum file size: 10MB
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Template
            </DialogTitle>
            <DialogDescription>
              Configure export options for the template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select
                value={exportOptions.format}
                onValueChange={(value: 'JSON' | 'YAML') => 
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JSON">JSON (.json)</SelectItem>
                  <SelectItem value="YAML">YAML (.yaml)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Options */}
            <div className="space-y-3">
              <Label>Export Options</Label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeMetadata"
                    checked={exportOptions.includeMetadata}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeMetadata: Boolean(checked) }))
                    }
                  />
                  <Label htmlFor="includeMetadata" className="text-sm">
                    Include metadata (creation date, author, etc.)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeVersionHistory"
                    checked={exportOptions.includeVersionHistory}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeVersionHistory: Boolean(checked) }))
                    }
                  />
                  <Label htmlFor="includeVersionHistory" className="text-sm">
                    Include version history
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="minifyOutput"
                    checked={exportOptions.minifyOutput}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, minifyOutput: Boolean(checked) }))
                    }
                  />
                  <Label htmlFor="minifyOutput" className="text-sm">
                    Minify output (smaller file size)
                  </Label>
                </div>
              </div>
            </div>

            {/* Preview */}
            {template && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm">
                  <div className="font-medium mb-1">Export Preview:</div>
                  <div className="text-muted-foreground">
                    Template: {template.name}<br />
                    Format: {exportOptions.format}<br />
                    Estimated size: ~{Math.round(JSON.stringify(template).length / 1024)}KB
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
              disabled={exportTemplateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={exportTemplateMutation.isPending}
            >
              {exportTemplateMutation.isPending ? 'Exporting...' : 'Export Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Template
            </DialogTitle>
            <DialogDescription>
              Select a template file to import into the system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Selection */}
            <div className="space-y-2">
              <Label>Template File</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Select a template file</p>
                  <p className="text-xs text-muted-foreground">
                    Supported: JSON, YAML (max 10MB)
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => document.getElementById('template-file-input')?.click()}
                >
                  Choose File
                </Button>
                <input
                  id="template-file-input"
                  type="file"
                  accept=".json,.yaml,.yml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Selected File Info */}
            {selectedFile && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Import Warnings */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Important:</strong> Importing will create a new template. 
                Make sure the file contains valid template data to avoid import errors.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false)
                setSelectedFile(null)
              }}
              disabled={importTemplateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || importTemplateMutation.isPending}
            >
              {importTemplateMutation.isPending ? 'Importing...' : 'Import Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
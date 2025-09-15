'use client'

import { useState, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Loader2,
  Eye,
  FileText,
  Users,
  Calendar,
  Template
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { 
  importDataFromFile,
  exportDataToFile,
  validateImportFile,
  getImportTemplate,
  getBulkOperationProgress
} from '@/lib/api/admin/bulk-operations'

type DataType = 'INSPECTORS' | 'ATTENDANCE' | 'TEMPLATES'
type ExportFormat = 'EXCEL' | 'CSV'

interface ImportOptions {
  skipFirstRow: boolean
  updateExisting: boolean
  validateOnly: boolean
  batchSize: number
}

interface ExportOptions {
  format: ExportFormat
  includeInactive: boolean
  dateRange?: {
    start: string
    end: string
  }
  columns?: string[]
}

interface ValidationResult {
  isValid: boolean
  totalRows: number
  validRows: number
  errors: Array<{
    row: number
    field?: string
    message: string
    value?: unknown
  }>
  preview: Array<Record<string, unknown>>
}

const DATA_TYPE_CONFIG = {
  INSPECTORS: {
    label: 'Inspectors',
    icon: Users,
    description: 'Import/export inspector data including personal info and settings',
    requiredColumns: ['name', 'employeeId', 'email'],
    optionalColumns: ['phone', 'active', 'canLogin', 'attendanceTrackingEnabled']
  },
  ATTENDANCE: {
    label: 'Attendance Records',
    icon: Calendar,
    description: 'Import/export attendance data including work hours and status',
    requiredColumns: ['inspectorId', 'date', 'status'],
    optionalColumns: ['workHours', 'overtimeHours', 'notes']
  },
  TEMPLATES: {
    label: 'Report Templates',
    icon: Template,
    description: 'Import/export report templates and configurations',
    requiredColumns: ['name', 'reportType'],
    optionalColumns: ['description', 'isActive', 'sections']
  }
} as const

export function ExcelImportExport() {
  const [selectedDataType, setSelectedDataType] = useState<DataType>('INSPECTORS')
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showValidationDialog, setShowValidationDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipFirstRow: true,
    updateExisting: false,
    validateOnly: false,
    batchSize: 100
  })
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'EXCEL',
    includeInactive: false
  })
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [currentOperationId, setCurrentOperationId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Validation mutation
  const validateMutation = useMutation({
    mutationFn: ({ file, type, options }: { file: File, type: DataType, options: ImportOptions }) =>
      validateImportFile(file, type, options),
    onSuccess: (result) => {
      setValidationResult(result)
      setShowValidationDialog(true)
      if (result.errors.length > 0) {
        toast.warning(`Validation found ${result.errors.length} errors in ${result.totalRows} rows`)
      } else {
        toast.success(`File validation successful: ${result.validRows} valid rows`)
      }
    },
    onError: (error) => {
      toast.error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  // Import mutation
  const importMutation = useMutation({
    mutationFn: ({ file, type, options }: { file: File, type: DataType, options: ImportOptions }) =>
      importDataFromFile(file, type, options),
    onSuccess: (operation) => {
      setCurrentOperationId(operation.id)
      toast.success('Import started successfully')
      setShowImportDialog(false)
      setImportFile(null)
    },
    onError: (error) => {
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: (options: ExportOptions & { type: DataType }) =>
      exportDataToFile(options),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const extension = exportOptions.format.toLowerCase()
      a.download = `${selectedDataType.toLowerCase()}-export-${new Date().toISOString().split('T')[0]}.${extension}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(`${selectedDataType} data exported successfully`)
      setShowExportDialog(false)
    },
    onError: (error) => {
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  // Template download mutation
  const templateMutation = useMutation({
    mutationFn: ({ type, format }: { type: DataType, format: ExportFormat }) =>
      getImportTemplate(type, format),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const extension = exportOptions.format.toLowerCase()
      a.download = `${selectedDataType.toLowerCase()}-template.${extension}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Template downloaded successfully')
    },
    onError: (error) => {
      toast.error(`Template download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  // Progress tracking
  const { data: progressData } = useQuery({
    queryKey: ['bulk-operation-progress', currentOperationId],
    queryFn: () => currentOperationId ? getBulkOperationProgress(currentOperationId) : null,
    enabled: !!currentOperationId,
    refetchInterval: 2000,
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validExtensions = ['.xlsx', '.xls', '.csv']
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      
      if (!validExtensions.includes(fileExtension)) {
        toast.error('Please select a valid Excel (.xlsx, .xls) or CSV file')
        return
      }
      
      setImportFile(file)
    }
  }

  const handleValidateFile = () => {
    if (!importFile) {
      toast.error('Please select a file first')
      return
    }
    
    validateMutation.mutate({
      file: importFile,
      type: selectedDataType,
      options: { ...importOptions, validateOnly: true }
    })
  }

  const handleImport = () => {
    if (!importFile) {
      toast.error('Please select a file first')
      return
    }
    
    importMutation.mutate({
      file: importFile,
      type: selectedDataType,
      options: importOptions
    })
  }

  const handleExport = () => {
    exportMutation.mutate({
      ...exportOptions,
      type: selectedDataType
    })
  }

  const handleDownloadTemplate = () => {
    templateMutation.mutate({
      type: selectedDataType,
      format: exportOptions.format
    })
  }

  const config = DATA_TYPE_CONFIG[selectedDataType]
  const IconComponent = config.icon

  const isLoading = validateMutation.isPending || 
                   importMutation.isPending || 
                   exportMutation.isPending || 
                   templateMutation.isPending

  return (
    <div className="space-y-6">
      {/* Data Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel Import/Export
          </CardTitle>
          <CardDescription>
            Import and export data using Excel or CSV files with validation and progress tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="data-type">Data Type</Label>
            <Select value={selectedDataType} onValueChange={(value: DataType) => setSelectedDataType(value)}>
              <SelectTrigger id="data-type">
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DATA_TYPE_CONFIG).map(([key, config]) => {
                  const Icon = config.icon
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <IconComponent className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium">{config.label}</h4>
                <p className="text-sm text-muted-foreground">{config.description}</p>
                <div className="mt-2 space-y-1">
                  <div className="text-xs">
                    <span className="font-medium">Required columns:</span>{' '}
                    {config.requiredColumns.join(', ')}
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Optional columns:</span>{' '}
                    {config.optionalColumns.join(', ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Template
            </CardTitle>
            <CardDescription>
              Get a template file with the correct format and columns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleDownloadTemplate} 
              disabled={isLoading}
              className="w-full"
            >
              {templateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Download {config.label} Template
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
            <CardDescription>
              Upload and import data from Excel or CSV files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowImportDialog(true)}
              className="w-full"
            >
              Import {config.label}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>
              Export existing data to Excel or CSV format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowExportDialog(true)}
              variant="outline"
              className="w-full"
            >
              Export {config.label}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Progress Tracking */}
      {currentOperationId && progressData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Import Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progressData.progress)}%</span>
              </div>
              <Progress value={progressData.progress} className="w-full" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Total Records</div>
                <div className="text-muted-foreground">{progressData.totalRecords}</div>
              </div>
              <div>
                <div className="font-medium">Processed</div>
                <div className="text-muted-foreground">{progressData.processedRecords}</div>
              </div>
              <div>
                <div className="font-medium">Successful</div>
                <div className="text-green-600">{progressData.successfulRecords}</div>
              </div>
              <div>
                <div className="font-medium">Failed</div>
                <div className="text-red-600">{progressData.failedRecords}</div>
              </div>
            </div>

            {progressData.currentStep && (
              <div className="text-sm">
                <span className="font-medium">Current Step:</span> {progressData.currentStep}
              </div>
            )}

            {progressData.estimatedTimeRemaining && (
              <div className="text-sm">
                <span className="font-medium">Estimated Time Remaining:</span>{' '}
                {Math.round(progressData.estimatedTimeRemaining / 60)} minutes
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import {config.label}
            </DialogTitle>
            <DialogDescription>
              Upload and configure import settings for {config.label.toLowerCase()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Selection */}
            <div className="space-y-2">
              <Label htmlFor="import-file">Select File</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {importFile ? importFile.name : 'Choose File'}
                </Button>
                {importFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleValidateFile}
                    disabled={isLoading}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Validate
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              {importFile && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  {importFile.name} ({(importFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <Separator />

            {/* Import Options */}
            <div className="space-y-4">
              <h4 className="font-medium">Import Options</h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skip-first-row"
                    checked={importOptions.skipFirstRow}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, skipFirstRow: !!checked }))
                    }
                  />
                  <Label htmlFor="skip-first-row">Skip first row (headers)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="update-existing"
                    checked={importOptions.updateExisting}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, updateExisting: !!checked }))
                    }
                  />
                  <Label htmlFor="update-existing">Update existing records</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch-size">Batch Size</Label>
                  <Select 
                    value={importOptions.batchSize.toString()} 
                    onValueChange={(value) => 
                      setImportOptions(prev => ({ ...prev, batchSize: parseInt(value) }))
                    }
                  >
                    <SelectTrigger id="batch-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50 records</SelectItem>
                      <SelectItem value="100">100 records</SelectItem>
                      <SelectItem value="200">200 records</SelectItem>
                      <SelectItem value="500">500 records</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!importFile || isLoading}
            >
              {importMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Start Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export {config.label}
            </DialogTitle>
            <DialogDescription>
              Configure export settings and download data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="export-format">Export Format</Label>
              <Select 
                value={exportOptions.format} 
                onValueChange={(value: ExportFormat) => 
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger id="export-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXCEL">Excel (.xlsx)</SelectItem>
                  <SelectItem value="CSV">CSV (.csv)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-inactive"
                checked={exportOptions.includeInactive}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, includeInactive: !!checked }))
                }
              />
              <Label htmlFor="include-inactive">Include inactive records</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isLoading}>
              {exportMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Export Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation Results Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {validationResult?.isValid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              Validation Results
            </DialogTitle>
            <DialogDescription>
              File validation completed for {importFile?.name}
            </DialogDescription>
          </DialogHeader>

          {validationResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{validationResult.totalRows}</div>
                  <div className="text-sm text-blue-700">Total Rows</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{validationResult.validRows}</div>
                  <div className="text-sm text-green-700">Valid Rows</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{validationResult.errors.length}</div>
                  <div className="text-sm text-red-700">Errors</div>
                </div>
              </div>

              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Validation Errors</h4>
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>Field</TableHead>
                          <TableHead>Error</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationResult.errors.slice(0, 10).map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>{error.row}</TableCell>
                            <TableCell>{error.field || '-'}</TableCell>
                            <TableCell className="text-red-600">{error.message}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {error.value ? String(error.value).substring(0, 20) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {validationResult.errors.length > 10 && (
                      <div className="p-2 text-center text-sm text-muted-foreground border-t">
                        ... and {validationResult.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview */}
              {validationResult.preview.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Data Preview</h4>
                  <div className="max-h-40 overflow-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(validationResult.preview[0]).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationResult.preview.slice(0, 5).map((row, index) => (
                          <TableRow key={index}>
                            {Object.values(row).map((value, cellIndex) => (
                              <TableCell key={cellIndex} className="font-mono text-xs">
                                {String(value).substring(0, 20)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidationDialog(false)}>
              Close
            </Button>
            {validationResult?.isValid && (
              <Button onClick={() => {
                setShowValidationDialog(false)
                setShowImportDialog(true)
              }}>
                Proceed with Import
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
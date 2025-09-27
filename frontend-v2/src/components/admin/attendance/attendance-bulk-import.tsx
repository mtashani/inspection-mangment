'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  FileSpreadsheet,
  Info
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface AttendanceBulkImportProps {
  onImport: (data: any[], options: ImportOptions) => Promise<ImportResult>
  onClose?: () => void
  loading?: boolean
  className?: string
}

interface ImportOptions {
  overwriteExisting: boolean
  validateData: boolean
  skipErrors: boolean
}

interface ImportResult {
  totalRecords: number
  imported: number
  skipped: number
  failed: number
  errors: Array<{
    row: number
    error: string
  }>
}

interface ImportPreview {
  headers: string[]
  rows: any[][]
  totalRows: number
}

const SAMPLE_DATA = [
  ['Inspector ID', 'Date (YYYY-MM-DD)', 'Jalali Date (YYYY-MM-DD)', 'Status', 'Regular Hours', 'Overtime Hours', 'Notes'],
  ['1', '2024-01-15', '1402-10-25', 'WORKING', '8', '2', 'Normal working day'],
  ['2', '2024-01-15', '1402-10-25', 'RESTING', '0', '0', 'Rest day'],
  ['3', '2024-01-15', '1402-10-25', 'OVERTIME', '8', '4', 'Extended shift'],
  ['1', '2024-01-16', '1402-10-26', 'ABSENT', '0', '0', 'Sick leave']
]

const VALID_STATUSES = ['WORKING', 'RESTING', 'OVERTIME', 'ABSENT', 'SICK_LEAVE', 'VACATION']

export function AttendanceBulkImport({
  onImport,
  onClose,
  loading = false,
  className
}: AttendanceBulkImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    overwriteExisting: false,
    validateData: true,
    skipErrors: true
  })
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'options' | 'result'>('upload')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ]

    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select an Excel (.xlsx, .xls) or CSV file',
        variant: 'destructive'
      })
      return
    }

    setFile(selectedFile)
    parseFile(selectedFile)
  }

  const parseFile = async (file: File) => {
    try {
      const text = await file.text()
      
      // Simple CSV parsing (for demo - in production use a proper CSV parser)
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const rows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      )

      setPreview({
        headers,
        rows: rows.slice(0, 10), // Show first 10 rows for preview
        totalRows: rows.length
      })

      // Validate data structure
      validateImportData(headers, rows)
      setStep('preview')
    } catch (error) {
      toast({
        title: 'File Parse Error',
        description: 'Failed to parse the selected file',
        variant: 'destructive'
      })
    }
  }

  const validateImportData = (headers: string[], rows: any[][]) => {
    const errors: string[] = []
    
    // Check required headers
    const requiredHeaders = ['Inspector ID', 'Status']
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
    )
    
    if (missingHeaders.length > 0) {
      errors.push(`Missing required columns: ${missingHeaders.join(', ')}`)
    }

    // Check for date column (either Date or Jalali Date)
    const hasDate = headers.some(h => 
      h.toLowerCase().includes('date') || h.toLowerCase().includes('jalali')
    )
    if (!hasDate) {
      errors.push('Missing date column (Date or Jalali Date required)')
    }

    // Validate sample rows
    rows.slice(0, 5).forEach((row, index) => {
      const statusIndex = headers.findIndex(h => h.toLowerCase().includes('status'))
      if (statusIndex >= 0 && row[statusIndex]) {
        const status = row[statusIndex].toUpperCase()
        if (!VALID_STATUSES.includes(status)) {
          errors.push(`Row ${index + 2}: Invalid status "${status}". Valid statuses: ${VALID_STATUSES.join(', ')}`)
        }
      }
    })

    setValidationErrors(errors)
  }

  const handleImport = async () => {
    if (!preview) return

    try {
      setStep('result')
      
      // Convert preview data to import format
      const importData = preview.rows.map((row, index) => {
        const record: any = {}
        preview.headers.forEach((header, headerIndex) => {
          const value = row[headerIndex]
          
          // Map headers to expected field names
          if (header.toLowerCase().includes('inspector id')) {
            record.inspector_id = parseInt(value) || 0
          } else if (header.toLowerCase().includes('date') && !header.toLowerCase().includes('jalali')) {
            record.date = value
          } else if (header.toLowerCase().includes('jalali')) {
            record.jalali_date = value
          } else if (header.toLowerCase().includes('status')) {
            record.status = value.toUpperCase()
          } else if (header.toLowerCase().includes('regular hours')) {
            record.regular_hours = parseFloat(value) || 0
          } else if (header.toLowerCase().includes('overtime hours')) {
            record.overtime_hours = parseFloat(value) || 0
          } else if (header.toLowerCase().includes('notes')) {
            record.notes = value
          }
        })
        
        return record
      })

      const result = await onImport(importData, importOptions)
      setImportResult(result)
      
      toast({
        title: 'Import Completed',
        description: `Successfully imported ${result.imported} out of ${result.totalRecords} records`
      })
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Failed to import attendance data',
        variant: 'destructive'
      })
    }
  }

  const downloadSampleFile = () => {
    const csvContent = SAMPLE_DATA.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'attendance_import_sample.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetImport = () => {
    setFile(null)
    setPreview(null)
    setImportResult(null)
    setValidationErrors([])
    setStep('upload')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className={cn('w-full max-w-4xl', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk Import Attendance Data
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {['Upload', 'Preview', 'Options', 'Result'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                index <= ['upload', 'preview', 'options', 'result'].indexOf(step)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}>
                {index + 1}
              </div>
              <span className={cn(
                'ml-2 text-sm',
                index <= ['upload', 'preview', 'options', 'result'].indexOf(step)
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}>
                {stepName}
              </span>
              {index < 3 && (
                <div className={cn(
                  'w-12 h-0.5 mx-4',
                  index < ['upload', 'preview', 'options', 'result'].indexOf(step)
                    ? 'bg-primary'
                    : 'bg-muted'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 'upload' && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Upload an Excel or CSV file containing attendance data. 
                Make sure your file includes Inspector ID, Date, and Status columns.
              </AlertDescription>
            </Alert>

            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select File to Import</h3>
              <p className="text-muted-foreground mb-4">
                Choose an Excel (.xlsx, .xls) or CSV file
              </p>
              
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={downloadSampleFile}>
                <Download className="w-4 h-4 mr-2" />
                Download Sample File
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Data Preview</h3>
              <Badge variant="secondary">
                {preview.totalRows} total rows
              </Badge>
            </div>

            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Validation Errors:</p>
                    {validationErrors.map((error, index) => (
                      <p key={index} className="text-sm">• {error}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      {preview.headers.map((header, index) => (
                        <th key={index} className="px-4 py-2 text-left text-sm font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-2 text-sm">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={resetImport}>
                Back to Upload
              </Button>
              <Button 
                onClick={() => setStep('options')}
                disabled={validationErrors.length > 0}
              >
                Continue to Options
              </Button>
            </div>
          </div>
        )}

        {step === 'options' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Import Options</h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="overwrite"
                  checked={importOptions.overwriteExisting}
                  onCheckedChange={(checked) =>
                    setImportOptions(prev => ({ ...prev, overwriteExisting: checked as boolean }))
                  }
                />
                <Label htmlFor="overwrite">
                  Overwrite existing records
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validate"
                  checked={importOptions.validateData}
                  onCheckedChange={(checked) =>
                    setImportOptions(prev => ({ ...prev, validateData: checked as boolean }))
                  }
                />
                <Label htmlFor="validate">
                  Validate data before import
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skipErrors"
                  checked={importOptions.skipErrors}
                  onCheckedChange={(checked) =>
                    setImportOptions(prev => ({ ...prev, skipErrors: checked as boolean }))
                  }
                />
                <Label htmlFor="skipErrors">
                  Skip rows with errors and continue
                </Label>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {importOptions.overwriteExisting 
                  ? 'Existing attendance records will be updated with new data.'
                  : 'Existing records will be skipped to prevent duplicates.'
                }
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep('preview')}>
                Back to Preview
              </Button>
              <Button onClick={handleImport} disabled={loading}>
                {loading ? 'Importing...' : 'Start Import'}
              </Button>
            </div>
          </div>
        )}

        {step === 'result' && importResult && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Import Results</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {importResult.totalRecords}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.imported}
                  </div>
                  <p className="text-sm text-muted-foreground">Imported</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {importResult.skipped}
                  </div>
                  <p className="text-sm text-muted-foreground">Skipped</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.failed}
                  </div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </CardContent>
              </Card>
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Import Errors:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {importResult.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Row {error.row}: {error.error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={resetImport}>
                Import Another File
              </Button>
              {onClose && (
                <Button onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
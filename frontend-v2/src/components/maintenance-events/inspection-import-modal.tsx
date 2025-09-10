'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react'
import { toast } from 'sonner'

interface InspectionImportModalProps {
  eventId?: string
  subEventId?: number
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: () => void
}

interface ImportResult {
  totalRows: number
  successfulImports: number
  failedImports: number
  errors: string[]
  warnings: string[]
}

export function InspectionImportModal({
  eventId,
  subEventId,
  isOpen,
  onOpenChange,
  onImportComplete
}: InspectionImportModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (validateFile(droppedFile)) {
        setFile(droppedFile)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (validateFile(selectedFile)) {
        setFile(selectedFile)
      }
    }
  }

  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
    
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid Excel file (.xlsx, .xls) or CSV file')
      return false
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB')
      return false
    }
    
    return true
  }

  const downloadTemplate = () => {
    // Create a sample Excel template for PLANNED inspections (no inspector assigned yet)
    const templateData = [
      ['inspection_title', 'equipment_tag', 'equipment_description', 'priority', 'planned_start_date', 'planned_end_date', 'notes'],
      ['Visual Inspection - Tank T-101', 'T-101', 'Main Storage Tank', 'High', '2024-03-01', '2024-03-03', 'Check for corrosion'],
      ['Pressure Test - Pump P-201', 'P-201', 'Primary Pump', 'Medium', '2024-03-05', '2024-03-06', 'Annual pressure test'],
      ['Calibration - Sensor S-301', 'S-301', 'Temperature Sensor', 'Low', '2024-03-08', '2024-03-08', 'Routine calibration']
    ]
    
    // Convert to CSV
    const csvContent = templateData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inspection_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success('Template downloaded successfully')
  }

  const handleImport = async () => {
    if (!file) return
    
    setImporting(true)
    setProgress(0)
    
    try {
      // Simulate file processing
      const formData = new FormData()
      formData.append('file', file)
      formData.append('event_id', eventId || '')
      if (subEventId) {
        formData.append('sub_event_id', subEventId.toString())
      }
      
      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      // Mock API call - replace with actual API endpoint
      // const response = await fetch('/api/v1/inspections/import', {
      //   method: 'POST',
      //   body: formData,
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      //   }
      // })
      
      // Mock result for demonstration
      const mockResult: ImportResult = {
        totalRows: 15,
        successfulImports: 12,
        failedImports: 3,
        errors: [
          'Row 5: Invalid equipment tag "INVALID-TAG"',
          'Row 8: Missing inspector name',
          'Row 12: Invalid date format'
        ],
        warnings: [
          'Row 3: Inspector "John Smith" not found, using default',
          'Row 7: Priority defaulted to "Medium"'
        ]
      }
      
      setImportResult(mockResult)
      
      if (mockResult.successfulImports > 0) {
        toast.success(`Successfully imported ${mockResult.successfulImports} inspections`)
        onImportComplete?.()
      }
      
    } catch (error) {
      toast.error('Failed to import inspections')
      console.error('Import error:', error)
    } finally {
      setImporting(false)
    }
  }

  const resetImport = () => {
    setFile(null)
    setProgress(0)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    resetImport()
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Planned Inspections
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 1: Download Planning Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Download the Excel template for planned inspections (inspectors will be assigned later)
                </div>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 2: Upload Your Planning File</CardTitle>
            </CardHeader>
            <CardContent>
              {!file ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <FileSpreadsheet className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-2">
                    Drag and drop your Excel file here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Supports .xlsx, .xls, and .csv files (max 10MB)
                  </p>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetImport}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Import Progress */}
          {importing && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Importing inspections...</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {importResult && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Import Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {importResult.totalRows}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Rows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importResult.successfulImports}
                    </div>
                    <div className="text-sm text-muted-foreground">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {importResult.failedImports}
                    </div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-2">Errors:</div>
                      <ul className="text-sm space-y-1">
                        {importResult.errors.map((error, index) => (
                          <li key={index} className="text-red-600">• {error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {importResult.warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-2">Warnings:</div>
                      <ul className="text-sm space-y-1">
                        {importResult.warnings.map((warning, index) => (
                          <li key={index} className="text-yellow-600">• {warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleClose}>
              {importResult ? 'Close' : 'Cancel'}
            </Button>
            {file && !importing && !importResult && (
              <Button onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Import Inspections
              </Button>
            )}
            {importResult && (
              <Button onClick={resetImport}>
                Import Another File
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
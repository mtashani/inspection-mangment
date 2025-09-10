'use client'

import { useState, useMemo } from 'react'
import { 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Download, 
  FileText,
  BarChart3,
  Filter,
  X
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

import { 
  ValidationResult, 
  ValidationError, 
  groupErrorsByField, 
  getErrorSummary 
} from '@/lib/validation/bulk-operations'

interface DataValidationPreviewProps {
  validationResult: ValidationResult
  fileName: string
  dataType: string
  onClose: () => void
  onProceed?: () => void
  onDownloadErrors?: () => void
}

export function DataValidationPreview({
  validationResult,
  fileName,
  dataType,
  onClose,
  onProceed,
  onDownloadErrors
}: DataValidationPreviewProps) {
  const [selectedErrorField, setSelectedErrorField] = useState<string>('all')
  const [errorSearchTerm, setErrorSearchTerm] = useState('')
  const [previewPage, setPreviewPage] = useState(1)
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const [selectedError, setSelectedError] = useState<ValidationError | null>(null)

  const errorSummary = useMemo(() => getErrorSummary(validationResult.errors), [validationResult.errors])
  const errorsByField = useMemo(() => groupErrorsByField(validationResult.errors), [validationResult.errors])

  const filteredErrors = useMemo(() => {
    let errors = validationResult.errors

    if (selectedErrorField !== 'all') {
      errors = errorsByField[selectedErrorField] || []
    }

    if (errorSearchTerm) {
      errors = errors.filter(error => 
        error.message.toLowerCase().includes(errorSearchTerm.toLowerCase()) ||
        (error.field && error.field.toLowerCase().includes(errorSearchTerm.toLowerCase()))
      )
    }

    return errors
  }, [validationResult.errors, errorsByField, selectedErrorField, errorSearchTerm])

  const previewData = useMemo(() => {
    const pageSize = 10
    const startIndex = (previewPage - 1) * pageSize
    return validationResult.validData.slice(startIndex, startIndex + pageSize)
  }, [validationResult.validData, previewPage])

  const successRate = validationResult.totalRows > 0 
    ? (validationResult.validRows / validationResult.totalRows) * 100 
    : 0

  const getValidationStatusColor = () => {
    if (validationResult.isValid) return 'text-green-600'
    if (successRate >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getValidationStatusIcon = () => {
    if (validationResult.isValid) return CheckCircle
    return AlertTriangle
  }

  const StatusIcon = getValidationStatusIcon()

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${getValidationStatusColor()}`} />
            Data Validation Results
          </DialogTitle>
          <DialogDescription>
            Validation results for {fileName} ({dataType})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{validationResult.totalRows}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{validationResult.validRows}</div>
                <div className="text-sm text-muted-foreground">Valid Rows</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{validationResult.errors.length}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{Math.round(successRate)}%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* Success Rate Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Validation Success Rate</span>
                  <span>{Math.round(successRate)}%</span>
                </div>
                <Progress value={successRate} className="w-full" />
                <div className="text-xs text-muted-foreground">
                  {validationResult.validRows} of {validationResult.totalRows} rows passed validation
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Status */}
          <Card>
            <CardContent className="p-4">
              {validationResult.isValid ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <div>
                    <div className="font-medium">Validation Passed</div>
                    <div className="text-sm text-muted-foreground">
                      All rows passed validation. You can proceed with the import.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  <div>
                    <div className="font-medium">Validation Issues Found</div>
                    <div className="text-sm text-muted-foreground">
                      {validationResult.errors.length} validation errors found. 
                      Review errors below or fix the data and try again.
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs for different views */}
          <Tabs defaultValue="errors" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="errors" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Errors ({validationResult.errors.length})
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Data Preview
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Error Summary
              </TabsTrigger>
            </TabsList>

            {/* Errors Tab */}
            <TabsContent value="errors" className="space-y-4">
              {validationResult.errors.length > 0 ? (
                <>
                  {/* Error Filters */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor="error-search">Search Errors</Label>
                      <Input
                        id="error-search"
                        placeholder="Search by message or field..."
                        value={errorSearchTerm}
                        onChange={(e) => setErrorSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="w-48">
                      <Label htmlFor="error-field">Filter by Field</Label>
                      <Select value={selectedErrorField} onValueChange={setSelectedErrorField}>
                        <SelectTrigger id="error-field">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Fields</SelectItem>
                          {Object.keys(errorsByField).map(field => (
                            <SelectItem key={field} value={field}>
                              {field} ({errorsByField[field].length})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Errors Table */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>Field</TableHead>
                          <TableHead>Error Message</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredErrors.slice(0, 20).map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>{error.row}</TableCell>
                            <TableCell>
                              {error.field ? (
                                <Badge variant="outline">{error.field}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={error.message}>
                                {error.message}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="font-mono text-xs truncate" title={String(error.value)}>
                                {error.value !== undefined ? String(error.value) : '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedError(error)
                                  setShowErrorDetails(true)
                                }}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {filteredErrors.length > 20 && (
                      <div className="p-3 text-center text-sm text-muted-foreground border-t">
                        Showing first 20 of {filteredErrors.length} errors
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No validation errors found
                </div>
              )}
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              {validationResult.validData.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing valid data preview ({validationResult.validRows} total valid rows)
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewPage(prev => Math.max(1, prev - 1))}
                        disabled={previewPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {previewPage} of {Math.ceil(validationResult.validRows / 10)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewPage(prev => prev + 1)}
                        disabled={previewPage >= Math.ceil(validationResult.validRows / 10)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {previewData.length > 0 && Object.keys(previewData[0] as object).map(key => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, index) => (
                          <TableRow key={index}>
                            {Object.values(row as object).map((value, cellIndex) => (
                              <TableCell key={cellIndex} className="font-mono text-xs">
                                {value !== null && value !== undefined ? String(value) : '-'}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No valid data to preview
                </div>
              )}
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Error Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Error Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Errors by Field</div>
                      <div className="space-y-2">
                        {Object.entries(errorSummary.errorsByField).map(([field, count]) => (
                          <div key={field} className="flex justify-between items-center">
                            <Badge variant="outline">{field}</Badge>
                            <span className="text-sm text-red-600">{count} errors</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Most Common Errors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Most Common Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {errorSummary.mostCommonErrors.map((error, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-start">
                            <div className="text-sm font-medium text-red-600 flex-1">
                              {error.message}
                            </div>
                            <Badge variant="destructive" className="ml-2">
                              {error.count}
                            </Badge>
                          </div>
                          <Progress 
                            value={(error.count / errorSummary.totalErrors) * 100} 
                            className="h-1"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              {validationResult.errors.length > 0 && onDownloadErrors && (
                <Button variant="outline" onClick={onDownloadErrors}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Error Report
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {onProceed && (
                <Button 
                  onClick={onProceed}
                  disabled={!validationResult.isValid && validationResult.validRows === 0}
                >
                  {validationResult.isValid 
                    ? 'Proceed with Import' 
                    : `Import ${validationResult.validRows} Valid Rows`
                  }
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Error Details Dialog */}
        <Dialog open={showErrorDetails} onOpenChange={setShowErrorDetails}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Error Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedError && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Row Number</Label>
                    <div className="text-sm">{selectedError.row}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Field</Label>
                    <div className="text-sm">
                      {selectedError.field ? (
                        <Badge variant="outline">{selectedError.field}</Badge>
                      ) : (
                        <span className="text-muted-foreground">General</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Error Message</Label>
                  <div className="text-sm p-3 bg-red-50 border border-red-200 rounded-lg">
                    {selectedError.message}
                  </div>
                </div>
                
                {selectedError.value !== undefined && (
                  <div>
                    <Label className="text-sm font-medium">Invalid Value</Label>
                    <div className="text-sm font-mono p-3 bg-muted rounded-lg">
                      {String(selectedError.value)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
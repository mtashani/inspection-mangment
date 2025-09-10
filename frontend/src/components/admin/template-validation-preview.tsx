'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  EyeIcon,
  PlayIcon,
  DocumentTextIcon,
  ClockIcon,
  InformationCircleIcon,
  BugAntIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Template, TemplateSection, TemplateField } from '@/types/professional-reports'

export interface TemplateValidationPreviewProps {
  template: Template
  onClose: () => void
  className?: string
}

type ValidationSeverity = 'error' | 'warning' | 'info'

interface ValidationIssue {
  id: string
  severity: ValidationSeverity
  category: 'structure' | 'fields' | 'logic' | 'performance' | 'accessibility'
  title: string
  description: string
  location?: string
  suggestion?: string
  autoFixable?: boolean
}

interface ValidationResult {
  isValid: boolean
  score: number
  issues: ValidationIssue[]
  summary: {
    errors: number
    warnings: number
    info: number
  }
  performance: {
    estimatedRenderTime: number
    fieldCount: number
    complexityScore: number
  }
}

interface PreviewData {
  [fieldName: string]: any
}

export function TemplateValidationPreview({
  template,
  onClose,
  className
}: TemplateValidationPreviewProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [previewData, setPreviewData] = useState<PreviewData>({})
  const [isValidating, setIsValidating] = useState(false)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [activeTab, setActiveTab] = useState('validation')
  const [selectedSeverity, setSelectedSeverity] = useState<ValidationSeverity | 'all'>('all')

  // Run validation on mount
  useEffect(() => {
    runValidation()
    generatePreviewData()
  }, [template])

  const runValidation = async () => {
    try {
      setIsValidating(true)
      
      // Mock validation process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock validation issues
      const mockIssues: ValidationIssue[] = [
        {
          id: '1',
          severity: 'error',
          category: 'structure',
          title: 'Missing Required Field Labels',
          description: 'Some fields are missing user-friendly labels',
          location: 'Section: Equipment Details, Field: equipment_condition',
          suggestion: 'Add descriptive labels for all fields to improve user experience',
          autoFixable: true
        },
        {
          id: '2',
          severity: 'warning',
          category: 'fields',
          title: 'Duplicate Field Names',
          description: 'Field name "date" appears multiple times',
          location: 'Sections: General Information, Equipment Details',
          suggestion: 'Use unique field names like "inspection_date" and "equipment_date"',
          autoFixable: false
        },
        {
          id: '3',
          severity: 'warning',
          category: 'performance',
          title: 'High Field Count',
          description: 'Template has many fields which may impact performance',
          location: 'Overall template structure',
          suggestion: 'Consider grouping related fields or splitting into multiple sections',
          autoFixable: false
        },
        {
          id: '4',
          severity: 'info',
          category: 'accessibility',
          title: 'Missing Field Descriptions',
          description: 'Some fields could benefit from help text',
          location: 'Multiple fields',
          suggestion: 'Add description text to complex or technical fields',
          autoFixable: false
        },
        {
          id: '5',
          severity: 'error',
          category: 'logic',
          title: 'Invalid Field Dependencies',
          description: 'Conditional field logic references non-existent fields',
          location: 'Section: Calculations',
          suggestion: 'Update field dependencies to reference existing fields',
          autoFixable: true
        }
      ]
      
      const summary = {
        errors: mockIssues.filter(i => i.severity === 'error').length,
        warnings: mockIssues.filter(i => i.severity === 'warning').length,
        info: mockIssues.filter(i => i.severity === 'info').length
      }
      
      const fieldCount = template.sections.reduce((count, section) => count + section.fields.length, 0)
      
      const result: ValidationResult = {
        isValid: summary.errors === 0,
        score: Math.max(0, 100 - (summary.errors * 20) - (summary.warnings * 5) - (summary.info * 1)),
        issues: mockIssues,
        summary,
        performance: {
          estimatedRenderTime: fieldCount * 15 + Math.random() * 100,
          fieldCount,
          complexityScore: Math.min(10, fieldCount / 5 + template.sections.length)
        }
      }
      
      setValidationResult(result)
    } catch (err) {
      console.error('Validation failed:', err)
    } finally {
      setIsValidating(false)
    }
  }

  const generatePreviewData = async () => {
    try {
      setIsGeneratingPreview(true)
      
      // Mock preview data generation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockData: PreviewData = {}
      
      template.sections.forEach(section => {
        section.fields.forEach(field => {
          switch (field.type) {
            case 'text':
              mockData[field.name] = `Sample ${field.label}`
              break
            case 'textarea':
              mockData[field.name] = `This is a sample text for ${field.label}. It demonstrates how longer text content will appear in the field.`
              break
            case 'select':
              mockData[field.name] = field.options?.[0] || 'Option 1'
              break
            case 'date':
              mockData[field.name] = new Date().toISOString().split('T')[0]
              break
            case 'number':
              mockData[field.name] = Math.floor(Math.random() * 100) + 1
              break
            case 'checkbox':
              mockData[field.name] = Math.random() > 0.5
              break
            case 'image':
              mockData[field.name] = 'sample-image.jpg'
              break
            default:
              mockData[field.name] = `Sample value`
          }
        })
      })
      
      setPreviewData(mockData)
    } catch (err) {
      console.error('Preview data generation failed:', err)
    } finally {
      setIsGeneratingPreview(false)
    }
  }

  // Filter issues by severity
  const filteredIssues = validationResult?.issues.filter(issue => 
    selectedSeverity === 'all' || issue.severity === selectedSeverity
  ) || []

  // Get severity display
  const getSeverityDisplay = (severity: ValidationSeverity) => {
    switch (severity) {
      case 'error':
        return { color: 'bg-red-100 text-red-800', icon: <XCircleIcon className="h-4 w-4" /> }
      case 'warning':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <ExclamationTriangleIcon className="h-4 w-4" /> }
      case 'info':
        return { color: 'bg-blue-100 text-blue-800', icon: <InformationCircleIcon className="h-4 w-4" /> }
    }
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'structure':
        return <DocumentTextIcon className="h-4 w-4" />
      case 'fields':
        return <BugAntIcon className="h-4 w-4" />
      case 'logic':
        return <CpuChipIcon className="h-4 w-4" />
      case 'performance':
        return <ClockIcon className="h-4 w-4" />
      case 'accessibility':
        return <UserIcon className="h-4 w-4" />
      default:
        return <InformationCircleIcon className="h-4 w-4" />
    }
  }

  // Render field preview
  const renderFieldPreview = (field: TemplateField, value: any) => {
    const baseClasses = "w-full p-3 border rounded-md text-sm"
    
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            className={baseClasses}
            placeholder={field.placeholder || field.label}
            readOnly
          />
        )
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            className={cn(baseClasses, "h-24 resize-none")}
            placeholder={field.placeholder || field.label}
            readOnly
          />
        )
      case 'select':
        return (
          <select className={baseClasses} value={value || ''} disabled>
            <option value="">Select {field.label}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        )
      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            className={baseClasses}
            readOnly
          />
        )
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            className={baseClasses}
            placeholder={field.placeholder || field.label}
            readOnly
          />
        )
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input type="checkbox" checked={value || false} readOnly />
            <label className="text-sm">{field.label}</label>
          </div>
        )
      case 'image':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
            <div className="text-gray-400 mb-2">📷</div>
            <p className="text-sm text-gray-500">
              {value ? `Uploaded: ${value}` : `Upload ${field.label}`}
            </p>
          </div>
        )
      default:
        return <div className="text-sm text-gray-500">Unknown field type</div>
    }
  }

  // Get validation score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={cn('max-w-6xl max-h-[90vh] overflow-hidden', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShieldCheckIcon className="h-5 w-5" />
            <span>Template Validation & Preview</span>
          </DialogTitle>
          <DialogDescription>
            Validate template structure and preview how it will appear to users.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 overflow-hidden">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Validation Score</div>
                    <div className={cn('text-2xl font-bold', getScoreColor(validationResult?.score || 0))}>
                      {validationResult?.score || 0}%
                    </div>
                  </div>
                  <ShieldCheckIcon className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Fields</div>
                    <div className="text-2xl font-bold">{validationResult?.performance.fieldCount || 0}</div>
                  </div>
                  <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Issues Found</div>
                    <div className="text-2xl font-bold text-red-600">
                      {validationResult?.summary.errors || 0}
                    </div>
                  </div>
                  <XCircleIcon className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Render Time</div>
                    <div className="text-2xl font-bold">
                      {validationResult?.performance.estimatedRenderTime.toFixed(0) || 0}ms
                    </div>
                  </div>
                  <ClockIcon className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
            <TabsList>
              <TabsTrigger value="validation">Validation Results</TabsTrigger>
              <TabsTrigger value="preview">Template Preview</TabsTrigger>
              <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
            </TabsList>

            {/* Validation Tab */}
            <TabsContent value="validation" className="flex-1 overflow-y-auto space-y-4">
              {isValidating ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p>Running validation checks...</p>
                  </div>
                </div>
              ) : validationResult ? (
                <>
                  {/* Validation Summary */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Validation Summary</CardTitle>
                        <Button onClick={runValidation} size="sm">
                          <PlayIcon className="h-4 w-4 mr-2" />
                          Re-validate
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{validationResult.summary.errors}</div>
                          <div className="text-sm text-muted-foreground">Errors</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{validationResult.summary.warnings}</div>
                          <div className="text-sm text-muted-foreground">Warnings</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{validationResult.summary.info}</div>
                          <div className="text-sm text-muted-foreground">Info</div>
                        </div>
                      </div>
                      
                      {validationResult.isValid ? (
                        <Alert>
                          <CheckCircleIcon className="h-4 w-4" />
                          <AlertDescription>
                            Template validation passed! The template is ready for use.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert variant="destructive">
                          <XCircleIcon className="h-4 w-4" />
                          <AlertDescription>
                            Template has validation errors that must be fixed before activation.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* Issues List */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Issues ({filteredIssues.length})</CardTitle>
                        <Select value={selectedSeverity} onValueChange={(value) => setSelectedSeverity(value as any)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Issues</SelectItem>
                            <SelectItem value="error">Errors</SelectItem>
                            <SelectItem value="warning">Warnings</SelectItem>
                            <SelectItem value="info">Info</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {filteredIssues.map((issue) => {
                        const severityDisplay = getSeverityDisplay(issue.severity)
                        
                        return (
                          <div key={issue.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {getCategoryIcon(issue.category)}
                                <h4 className="font-medium">{issue.title}</h4>
                                <Badge className={cn('text-xs', severityDisplay.color)}>
                                  <div className="flex items-center space-x-1">
                                    {severityDisplay.icon}
                                    <span className="capitalize">{issue.severity}</span>
                                  </div>
                                </Badge>
                                {issue.autoFixable && (
                                  <Badge variant="outline" className="text-xs">
                                    Auto-fixable
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                            {issue.location && (
                              <p className="text-xs text-muted-foreground mb-2">
                                <strong>Location:</strong> {issue.location}
                              </p>
                            )}
                            {issue.suggestion && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                <p className="text-xs text-blue-800">
                                  <strong>Suggestion:</strong> {issue.suggestion}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                      
                      {filteredIssues.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No issues found for the selected severity level.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="flex-1 overflow-y-auto space-y-4">
              {isGeneratingPreview ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p>Generating preview data...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Template Preview</h3>
                    <Button onClick={generatePreviewData} size="sm">
                      <PlayIcon className="h-4 w-4 mr-2" />
                      Regenerate Data
                    </Button>
                  </div>
                  
                  {template.sections.map((section) => (
                    <Card key={section.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {section.fields.map((field) => (
                          <div key={field.id} className="space-y-2">
                            <Label className="text-sm font-medium">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            {renderFieldPreview(field, previewData[field.name])}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="flex-1 overflow-y-auto space-y-4">
              {validationResult && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Estimated Render Time</Label>
                          <div className="text-2xl font-bold">
                            {validationResult.performance.estimatedRenderTime.toFixed(0)}ms
                          </div>
                          <Progress 
                            value={Math.min(100, validationResult.performance.estimatedRenderTime / 10)} 
                            className="mt-2" 
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Complexity Score</Label>
                          <div className="text-2xl font-bold">
                            {validationResult.performance.complexityScore.toFixed(1)}/10
                          </div>
                          <Progress 
                            value={validationResult.performance.complexityScore * 10} 
                            className="mt-2" 
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-3">
                        <h4 className="font-medium">Performance Recommendations</h4>
                        {validationResult.performance.fieldCount > 20 && (
                          <Alert>
                            <ClockIcon className="h-4 w-4" />
                            <AlertDescription>
                              Consider splitting this template into multiple sections or pages for better performance.
                            </AlertDescription>
                          </Alert>
                        )}
                        {validationResult.performance.complexityScore > 7 && (
                          <Alert>
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            <AlertDescription>
                              High complexity detected. Consider simplifying field logic and dependencies.
                            </AlertDescription>
                          </Alert>
                        )}
                        {validationResult.performance.estimatedRenderTime > 500 && (
                          <Alert variant="destructive">
                            <ClockIcon className="h-4 w-4" />
                            <AlertDescription>
                              Slow render time detected. Consider reducing the number of fields or optimizing field types.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {validationResult?.isValid && (
            <Button>
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Approve Template
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { TemplateValidationPreviewProps }
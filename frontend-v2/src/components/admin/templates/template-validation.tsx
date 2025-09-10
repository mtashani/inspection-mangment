'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Play, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { TemplateFormData } from '@/types/admin'
import { TemplateTestRunner } from './template-test-runner'
import { TemplateValidationReport } from './template-validation-report'

interface TemplateValidationProps {
  templateData: TemplateFormData
  onValidate?: (data: TemplateFormData) => Promise<ValidationResult>
  onTest?: (data: TemplateFormData, sampleData: Record<string, unknown>) => Promise<TestResult>
}

interface ValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    severity: 'error' | 'warning' | 'info'
  }>
  warnings: Array<{
    field: string
    message: string
  }>
  suggestions: Array<{
    field: string
    message: string
    action?: string
  }>
}

interface TestResult {
  success: boolean
  renderedTemplate?: string
  errors?: string[]
  performance?: {
    renderTime: number
    fieldCount: number
    sectionCount: number
  }
}

export function TemplateValidation({
  templateData,
  onValidate,
  onTest
}: TemplateValidationProps) {
  const { toast } = useToast()
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [validationProgress, setValidationProgress] = useState(0)

  // Perform client-side validation
  const performClientValidation = (): ValidationResult => {
    const errors: ValidationResult['errors'] = []
    const warnings: ValidationResult['warnings'] = []
    const suggestions: ValidationResult['suggestions'] = []

    // Basic template validation
    if (!templateData.name.trim()) {
      errors.push({
        field: 'name',
        message: 'Template name is required',
        severity: 'error'
      })
    } else if (templateData.name.length < 3) {
      warnings.push({
        field: 'name',
        message: 'Template name should be at least 3 characters long'
      })
    }

    if (!templateData.description.trim()) {
      errors.push({
        field: 'description',
        message: 'Template description is required',
        severity: 'error'
      })
    } else if (templateData.description.length < 10) {
      warnings.push({
        field: 'description',
        message: 'Consider adding a more detailed description'
      })
    }

    if (templateData.sections.length === 0) {
      errors.push({
        field: 'sections',
        message: 'Template must have at least one section',
        severity: 'error'
      })
    }

    // Section validation
    templateData.sections.forEach((section, sectionIndex) => {
      if (!section.title.trim()) {
        errors.push({
          field: `sections.${sectionIndex}.title`,
          message: `Section ${sectionIndex + 1} title is required`,
          severity: 'error'
        })
      }

      if (section.fields.length === 0) {
        warnings.push({
          field: `sections.${sectionIndex}.fields`,
          message: `Section "${section.title}" has no fields`
        })
      }

      // Field validation
      section.fields.forEach((field, fieldIndex) => {
        const fieldPath = `sections.${sectionIndex}.fields.${fieldIndex}`

        if (!field.name.trim()) {
          errors.push({
            field: `${fieldPath}.name`,
            message: `Field name is required in section "${section.title}"`,
            severity: 'error'
          })
        } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.name)) {
          errors.push({
            field: `${fieldPath}.name`,
            message: `Field name "${field.name}" must be a valid identifier`,
            severity: 'error'
          })
        }

        if (!field.label.trim()) {
          errors.push({
            field: `${fieldPath}.label`,
            message: `Field label is required in section "${section.title}"`,
            severity: 'error'
          })
        }

        // Check for duplicate field names
        const duplicateField = templateData.sections
          .flatMap(s => s.fields)
          .find((f, i) => f.name === field.name && i !== templateData.sections
            .slice(0, sectionIndex)
            .reduce((sum, s) => sum + s.fields.length, 0) + fieldIndex)

        if (duplicateField) {
          errors.push({
            field: `${fieldPath}.name`,
            message: `Duplicate field name "${field.name}" found`,
            severity: 'error'
          })
        }

        // Field type specific validation
        if ((field.type === 'select' || field.type === 'multiselect') && (!field.options || field.options.length === 0)) {
          errors.push({
            field: `${fieldPath}.options`,
            message: `${field.type} field "${field.label}" must have at least one option`,
            severity: 'error'
          })
        }

        if (field.type === 'number' && field.validation?.min !== undefined && field.validation?.max !== undefined) {
          if (field.validation.min >= field.validation.max) {
            errors.push({
              field: `${fieldPath}.validation`,
              message: `Min value must be less than max value for field "${field.label}"`,
              severity: 'error'
            })
          }
        }

        // Suggestions
        if (!field.description) {
          suggestions.push({
            field: `${fieldPath}.description`,
            message: `Consider adding a description for field "${field.label}"`,
            action: 'Add description'
          })
        }

        if (field.required && !field.validation) {
          suggestions.push({
            field: `${fieldPath}.validation`,
            message: `Consider adding validation rules for required field "${field.label}"`,
            action: 'Add validation'
          })
        }
      })
    })

    // Template structure suggestions
    const totalFields = templateData.sections.reduce((sum, section) => sum + section.fields.length, 0)
    const requiredFields = templateData.sections.reduce(
      (sum, section) => sum + section.fields.filter(field => field.required).length,
      0
    )

    if (totalFields > 50) {
      warnings.push({
        field: 'structure',
        message: 'Template has many fields. Consider breaking it into multiple templates.'
      })
    }

    if (requiredFields === 0) {
      suggestions.push({
        field: 'structure',
        message: 'Consider marking some fields as required to ensure data quality',
        action: 'Mark fields as required'
      })
    }

    if (templateData.sections.length > 10) {
      warnings.push({
        field: 'structure',
        message: 'Template has many sections. Consider consolidating related fields.'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  const handleValidate = async () => {
    setIsValidating(true)
    setValidationProgress(0)

    try {
      // Simulate validation progress
      const progressInterval = setInterval(() => {
        setValidationProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      let result: ValidationResult

      if (onValidate) {
        // Use server-side validation if available
        result = await onValidate(templateData)
      } else {
        // Use client-side validation
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate delay
        result = performClientValidation()
      }

      clearInterval(progressInterval)
      setValidationProgress(100)
      setValidationResult(result)

      toast({
        title: result.isValid ? 'Validation Passed' : 'Validation Issues Found',
        description: result.isValid 
          ? 'Template validation completed successfully'
          : `Found ${result.errors.length} error(s) and ${result.warnings.length} warning(s)`,
        variant: result.isValid ? 'default' : 'destructive',
      })

    } catch (error) {
      toast({
        title: 'Validation Failed',
        description: error instanceof Error ? error.message : 'Failed to validate template',
        variant: 'destructive',
      })
    } finally {
      setIsValidating(false)
      setTimeout(() => setValidationProgress(0), 2000)
    }
  }

  const handleTest = async (sampleData: Record<string, unknown>) => {
    if (!onTest) {
      toast({
        title: 'Testing Not Available',
        description: 'Template testing is not configured',
        variant: 'destructive',
      })
      return
    }

    setIsTesting(true)

    try {
      const result = await onTest(templateData, sampleData)
      setTestResult(result)

      toast({
        title: result.success ? 'Test Passed' : 'Test Failed',
        description: result.success 
          ? 'Template test completed successfully'
          : 'Template test encountered errors',
        variant: result.success ? 'default' : 'destructive',
      })

    } catch (error) {
      toast({
        title: 'Test Failed',
        description: error instanceof Error ? error.message : 'Failed to test template',
        variant: 'destructive',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const exportValidationReport = () => {
    if (!validationResult) return

    const report = {
      templateName: templateData.name,
      validationDate: new Date().toISOString(),
      isValid: validationResult.isValid,
      summary: {
        errors: validationResult.errors.length,
        warnings: validationResult.warnings.length,
        suggestions: validationResult.suggestions.length
      },
      details: validationResult
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template-validation-${templateData.name.replace(/\s+/g, '-').toLowerCase()}.json`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-6">
      {/* Validation Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Template Validation & Testing</h2>
          <p className="text-sm text-muted-foreground">
            Validate template structure and test with sample data
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {validationResult && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportValidationReport}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          )}
          <Button
            onClick={handleValidate}
            disabled={isValidating}
          >
            <Play className="w-4 h-4 mr-2" />
            {isValidating ? 'Validating...' : 'Validate Template'}
          </Button>
        </div>
      </div>

      {/* Validation Progress */}
      {isValidating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Validating template...</span>
                <span>{validationProgress}%</span>
              </div>
              <Progress value={validationProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {validationResult && (
        <Tabs defaultValue="summary" className="w-full">
          <TabsList>
            <TabsTrigger value="summary">
              Summary
              {!validationResult.isValid && (
                <Badge variant="destructive" className="ml-2">
                  {validationResult.errors.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="details">
              Details
            </TabsTrigger>
            <TabsTrigger value="testing">
              Testing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    {validationResult.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-semibold">
                        {validationResult.isValid ? 'Valid' : 'Invalid'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Template Status
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-semibold text-red-600">
                        {validationResult.errors.length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Errors
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <div className="font-semibold text-yellow-600">
                        {validationResult.warnings.length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Warnings
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Issues Overview */}
            {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Issues Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {validationResult.errors.slice(0, 3).map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>{error.field}:</strong> {error.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                  
                  {validationResult.warnings.slice(0, 2).map((warning, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>{warning.field}:</strong> {warning.message}
                      </AlertDescription>
                    </Alert>
                  ))}

                  {(validationResult.errors.length > 3 || validationResult.warnings.length > 2) && (
                    <p className="text-sm text-muted-foreground">
                      View the Details tab for all issues...
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <TemplateValidationReport validationResult={validationResult} />
          </TabsContent>

          <TabsContent value="testing" className="mt-6">
            <TemplateTestRunner
              templateData={templateData}
              onTest={handleTest}
              testResult={testResult}
              isLoading={isTesting}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
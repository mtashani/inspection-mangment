'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  DocumentTextIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PhotoIcon,
  PaperClipIcon,
  PencilIcon,
  ArrowPathIcon,
  EyeIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Template, 
  TemplateField, 
  FieldType, 
  ValueSource,
  FormValidationResult 
} from '@/types/professional-reports'

export interface DynamicReportFormProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  onSubmit: (formData: Record<string, any>) => void
  onSaveDraft: (formData: Record<string, any>) => void
  template: Template
  initialData?: Record<string, any>
  autoPopulatedData?: Record<string, any>
  isLoading?: boolean
  isSaving?: boolean
  validationErrors?: Record<string, string[]>
  inspectionId: string
  className?: string
}

export function DynamicReportForm({
  isOpen,
  onClose,
  onBack,
  onSubmit,
  onSaveDraft,
  template,
  initialData = {},
  autoPopulatedData = {},
  isLoading = false,
  isSaving = false,
  validationErrors = {},
  inspectionId,
  className
}: DynamicReportFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
  const [activeSection, setActiveSection] = useState(0)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Initialize form data when dialog opens
  useEffect(() => {
    if (isOpen) {
      const mergedData = { ...autoPopulatedData, ...initialData }
      setFormData(mergedData)
      setHasUnsavedChanges(false)
      setActiveSection(0)
    }
  }, [isOpen, initialData, autoPopulatedData])

  // Calculate completion percentage
  useEffect(() => {
    const totalFields = getAllFields().length
    const completedFields = getAllFields().filter(field => {
      const value = formData[field.id]
      return value !== null && value !== undefined && value !== ''
    }).length

    const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0
    setCompletionPercentage(percentage)
  }, [formData, template])

  // Get all fields from template
  const getAllFields = useCallback((): TemplateField[] => {
    const fields: TemplateField[] = []
    template.sections?.forEach(section => {
      section.subsections?.forEach(subsection => {
        subsection.fields?.forEach(field => {
          fields.push(field)
        })
      })
    })
    return fields
  }, [template])

  // Handle field value change
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
    setHasUnsavedChanges(true)
  }

  // Validate field
  const validateField = (field: TemplateField, value: any): string[] => {
    const errors: string[] = []
    
    // Required field validation
    if (field.isRequired && (value === null || value === undefined || value === '')) {
      errors.push(`${field.label} is required`)
    }

    // Type-specific validation
    if (value !== null && value !== undefined && value !== '') {
      switch (field.fieldType) {
        case FieldType.NUMBER:
          if (isNaN(Number(value))) {
            errors.push(`${field.label} must be a valid number`)
          } else {
            const numValue = Number(value)
            if (field.validationRules?.minValue !== undefined && numValue < field.validationRules.minValue) {
              errors.push(`${field.label} must be at least ${field.validationRules.minValue}`)
            }
            if (field.validationRules?.maxValue !== undefined && numValue > field.validationRules.maxValue) {
              errors.push(`${field.label} must be at most ${field.validationRules.maxValue}`)
            }
          }
          break

        case FieldType.TEXT:
        case FieldType.TEXTAREA:
          const strValue = String(value)
          if (field.validationRules?.minLength !== undefined && strValue.length < field.validationRules.minLength) {
            errors.push(`${field.label} must be at least ${field.validationRules.minLength} characters`)
          }
          if (field.validationRules?.maxLength !== undefined && strValue.length > field.validationRules.maxLength) {
            errors.push(`${field.label} must be at most ${field.validationRules.maxLength} characters`)
          }
          break

        case FieldType.DATE:
          const dateValue = new Date(value)
          if (isNaN(dateValue.getTime())) {
            errors.push(`${field.label} must be a valid date`)
          }
          break
      }
    }

    return errors
  }

  // Get field validation errors
  const getFieldErrors = (fieldId: string): string[] => {
    return validationErrors[fieldId] || []
  }

  // Check if form is valid
  const isFormValid = (): boolean => {
    const allFields = getAllFields()
    return allFields.every(field => {
      const value = formData[field.id]
      const errors = validateField(field, value)
      return errors.length === 0
    })
  }

  // Handle form submission
  const handleSubmit = () => {
    if (isFormValid() && !isLoading && !isSaving) {
      onSubmit(formData)
    }
  }

  // Handle save draft
  const handleSaveDraft = () => {
    if (!isSaving) {
      onSaveDraft(formData)
      setHasUnsavedChanges(false)
      setLastSaved(new Date())
    }
  }

  // Handle back navigation
  const handleBack = () => {
    if (!isLoading && !isSaving) {
      if (hasUnsavedChanges) {
        // Show confirmation dialog
        if (confirm('You have unsaved changes. Are you sure you want to go back?')) {
          onBack()
        }
      } else {
        onBack()
      }
    }
  }

  // Handle close
  const handleClose = () => {
    if (!isLoading && !isSaving) {
      if (hasUnsavedChanges) {
        // Show confirmation dialog
        if (confirm('You have unsaved changes. Are you sure you want to close?')) {
          onClose()
        }
      } else {
        onClose()
      }
    }
  }

  // Auto-save every 30 seconds
  useEffect(() => {
    if (hasUnsavedChanges && isOpen) {
      const autoSaveTimer = setTimeout(() => {
        handleSaveDraft()
      }, 30000) // 30 seconds

      return () => clearTimeout(autoSaveTimer)
    }
  }, [hasUnsavedChanges, isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn('max-w-7xl max-h-[95vh]', className)}>
        <DialogHeader>
          <DialogTitle className=\"flex items-center space-x-2\">
            <DocumentTextIcon className=\"h-5 w-5 text-primary\" />
            <span>{template.name}</span>
          </DialogTitle>
          <DialogDescription>
            Complete the form below to create your professional report.
          </DialogDescription>
        </DialogHeader>

        <div className=\"space-y-4\">
          {/* Progress Bar */}
          <Card>
            <CardContent className=\"p-4\">
              <div className=\"flex items-center justify-between mb-2\">
                <span className=\"text-sm font-medium\">Form Completion</span>
                <span className=\"text-sm text-muted-foreground\">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className=\"h-2\" />
              <div className=\"flex items-center justify-between mt-2 text-xs text-muted-foreground\">
                <span>
                  {getAllFields().filter(f => formData[f.id] != null && formData[f.id] !== '').length} of {getAllFields().length} fields completed
                </span>
                {lastSaved && (
                  <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Content */}
          <div className=\"grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]\">
            {/* Section Navigation */}
            <div className=\"lg:col-span-1\">
              <Card className=\"h-full\">
                <CardHeader className=\"pb-3\">
                  <CardTitle className=\"text-sm\">Sections</CardTitle>
                </CardHeader>
                <CardContent className=\"p-0\">
                  <ScrollArea className=\"h-[520px]\">
                    <div className=\"space-y-1 p-4 pt-0\">
                      {template.sections?.map((section, index) => {
                        const sectionFields = section.subsections?.flatMap(sub => sub.fields || []) || []
                        const completedFields = sectionFields.filter(field => {
                          const value = formData[field.id]
                          return value !== null && value !== undefined && value !== ''
                        }).length
                        const sectionCompletion = sectionFields.length > 0 ? 
                          Math.round((completedFields / sectionFields.length) * 100) : 100

                        return (
                          <Button
                            key={section.id}
                            variant={activeSection === index ? \"default\" : \"ghost\"}
                            className=\"w-full justify-start h-auto p-3\"
                            onClick={() => setActiveSection(index)}
                          >
                            <div className=\"flex-1 text-left\">
                              <div className=\"font-medium text-sm\">{section.title}</div>
                              <div className=\"text-xs text-muted-foreground mt-1\">
                                {completedFields}/{sectionFields.length} completed ({sectionCompletion}%)
                              </div>
                            </div>
                            {sectionCompletion === 100 && (
                              <CheckCircleIcon className=\"h-4 w-4 text-green-500\" />
                            )}
                          </Button>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Form Fields */}
            <div className=\"lg:col-span-3\">
              <Card className=\"h-full\">
                <CardHeader>
                  <CardTitle className=\"text-lg\">
                    {template.sections?.[activeSection]?.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className=\"h-[500px] pr-4\">
                    {template.sections?.[activeSection] && (
                      <FormSection
                        section={template.sections[activeSection]}
                        formData={formData}
                        onFieldChange={handleFieldChange}
                        validationErrors={validationErrors}
                        autoPopulatedData={autoPopulatedData}
                      />
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Validation Summary */}
          {Object.keys(validationErrors).length > 0 && (
            <Alert>
              <ExclamationTriangleIcon className=\"h-4 w-4\" />
              <AlertDescription>
                Please fix the validation errors before submitting the form.
                {Object.keys(validationErrors).length} fields have errors.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className=\"flex items-center justify-between\">
          <div className=\"flex items-center space-x-4\">
            {/* Status indicators */}
            <div className=\"flex items-center space-x-2 text-sm text-muted-foreground\">
              {hasUnsavedChanges && (
                <div className=\"flex items-center space-x-1 text-yellow-600\">
                  <ExclamationTriangleIcon className=\"h-4 w-4\" />
                  <span>Unsaved changes</span>
                </div>
              )}
              {isSaving && (
                <div className=\"flex items-center space-x-1 text-blue-600\">
                  <ArrowPathIcon className=\"h-4 w-4 animate-spin\" />
                  <span>Saving...</span>
                </div>
              )}
            </div>

            {/* Save Draft Button */}
            <Button
              variant=\"outline\"
              onClick={handleSaveDraft}
              disabled={isSaving || !hasUnsavedChanges}
              className=\"flex items-center space-x-1\"
            >
              <CloudArrowUpIcon className=\"h-4 w-4\" />
              <span>Save Draft</span>
            </Button>
          </div>

          <div className=\"flex items-center space-x-2\">
            <Button
              variant=\"outline\"
              onClick={handleBack}
              disabled={isLoading || isSaving}
              className=\"flex items-center space-x-1\"
            >
              <ChevronLeftIcon className=\"h-4 w-4\" />
              <span>Back</span>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || isSaving || !isFormValid()}
              className=\"flex items-center space-x-1\"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className=\"h-4 w-4 animate-spin\" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className=\"h-4 w-4\" />
                  <span>Submit Report</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Form section component
interface FormSectionProps {
  section: any
  formData: Record<string, any>
  onFieldChange: (fieldId: string, value: any) => void
  validationErrors: Record<string, string[]>
  autoPopulatedData: Record<string, any>
}

function FormSection({ 
  section, 
  formData, 
  onFieldChange, 
  validationErrors, 
  autoPopulatedData 
}: FormSectionProps) {
  return (
    <div className=\"space-y-6\">
      {section.subsections?.map((subsection: any) => (
        <div key={subsection.id} className=\"space-y-4\">
          <div>
            <h3 className=\"font-medium text-base mb-2\">{subsection.title}</h3>
            <Separator />
          </div>
          
          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
            {subsection.fields?.map((field: TemplateField) => (
              <div
                key={field.id}
                className={cn(
                  'space-y-2',
                  field.colspan > 1 && 'md:col-span-2'
                )}
              >
                <DynamicField
                  field={field}
                  value={formData[field.id]}
                  onChange={(value) => onFieldChange(field.id, value)}
                  errors={validationErrors[field.id] || []}
                  isAutoFilled={field.id in autoPopulatedData}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Dynamic field component
interface DynamicFieldProps {
  field: TemplateField
  value: any
  onChange: (value: any) => void
  errors: string[]
  isAutoFilled: boolean
}

function DynamicField({ field, value, onChange, errors, isAutoFilled }: DynamicFieldProps) {
  const hasErrors = errors.length > 0
  const isReadonly = field.valueSource === ValueSource.AUTO || field.valueSource === ValueSource.CALCULATED

  const getValueSourceIndicator = () => {
    switch (field.valueSource) {
      case ValueSource.AUTO:
        return (
          <Badge variant=\"secondary\" className=\"text-xs\">
            <ArrowPathIcon className=\"h-3 w-3 mr-1\" />
            Auto
          </Badge>
        )
      case ValueSource.CALCULATED:
        return (
          <Badge variant=\"secondary\" className=\"text-xs\">
            <PencilIcon className=\"h-3 w-3 mr-1\" />
            Calculated
          </Badge>
        )
      default:
        return null
    }
  }

  const renderField = () => {
    switch (field.fieldType) {
      case FieldType.TEXT:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={isReadonly}
            className={cn(hasErrors && 'border-red-500')}
          />
        )

      case FieldType.TEXTAREA:
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={isReadonly}
            className={cn(hasErrors && 'border-red-500')}
            rows={3}
          />
        )

      case FieldType.NUMBER:
        return (
          <Input
            type=\"number\"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={isReadonly}
            className={cn(hasErrors && 'border-red-500')}
          />
        )

      case FieldType.DATE:
        return (
          <Input
            type=\"date\"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={isReadonly}
            className={cn(hasErrors && 'border-red-500')}
          />
        )

      case FieldType.CHECKBOX:
        return (
          <div className=\"flex items-center space-x-2\">
            <Checkbox
              checked={value || false}
              onCheckedChange={onChange}
              disabled={isReadonly}
            />
            <Label className=\"text-sm\">{field.label}</Label>
          </div>
        )

      case FieldType.SELECT:
        return (
          <Select
            value={value || ''}
            onValueChange={onChange}
            disabled={isReadonly}
          >
            <SelectTrigger className={cn(hasErrors && 'border-red-500')}>
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case FieldType.MULTI_SELECT:
        const selectedValues = Array.isArray(value) ? value : []
        return (
          <div className=\"space-y-2\">
            {field.options?.map(option => (
              <div key={option} className=\"flex items-center space-x-2\">
                <Checkbox
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, option]
                      : selectedValues.filter(v => v !== option)
                    onChange(newValues)
                  }}
                  disabled={isReadonly}
                />
                <Label className=\"text-sm\">{option}</Label>
              </div>
            ))}
          </div>
        )

      case FieldType.IMAGE:
        return (
          <div className=\"space-y-2\">
            <Input
              type=\"file\"
              accept=\"image/*\"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // Handle file upload
                  onChange(file)
                }
              }}
              disabled={isReadonly}
              className={cn(hasErrors && 'border-red-500')}
            />
            {value && (
              <div className=\"flex items-center space-x-2 text-sm text-muted-foreground\">
                <PhotoIcon className=\"h-4 w-4\" />
                <span>{typeof value === 'string' ? value : value.name}</span>
              </div>
            )}
          </div>
        )

      case FieldType.FILE:
        return (
          <div className=\"space-y-2\">
            <Input
              type=\"file\"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  onChange(file)
                }
              }}
              disabled={isReadonly}
              className={cn(hasErrors && 'border-red-500')}
            />
            {value && (
              <div className=\"flex items-center space-x-2 text-sm text-muted-foreground\">
                <PaperClipIcon className=\"h-4 w-4\" />
                <span>{typeof value === 'string' ? value : value.name}</span>
              </div>
            )}
          </div>
        )

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={isReadonly}
            className={cn(hasErrors && 'border-red-500')}
          />
        )
    }
  }

  if (field.fieldType === FieldType.CHECKBOX) {
    return (
      <div className=\"space-y-2\">
        {renderField()}
        {field.helpText && (
          <p className=\"text-xs text-muted-foreground\">{field.helpText}</p>
        )}
        {hasErrors && (
          <div className=\"text-xs text-red-600 space-y-1\">
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className=\"space-y-2\">
      <div className=\"flex items-center justify-between\">
        <Label className={cn(
          'text-sm font-medium',
          field.isRequired && 'after:content-[\"*\"] after:text-red-500 after:ml-1'
        )}>
          {field.label}
        </Label>
        {getValueSourceIndicator()}
      </div>
      
      {renderField()}
      
      {field.helpText && (
        <p className=\"text-xs text-muted-foreground\">{field.helpText}</p>
      )}
      
      {hasErrors && (
        <div className=\"text-xs text-red-600 space-y-1\">
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export type { DynamicReportFormProps }
'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { TemplateFormData, ReportType } from '@/types/admin'

interface TemplateSettingsProps {
  templateData: TemplateFormData
  onTemplateDataChange: (data: TemplateFormData) => void
  validationErrors: Array<{ field: string; message: string }>
}

const reportTypeOptions: { value: ReportType; label: string; description: string }[] = [
  {
    value: 'PSV',
    label: 'PSV Inspection',
    description: 'Pressure Safety Valve inspection reports'
  },
  {
    value: 'CRANE',
    label: 'Crane Inspection',
    description: 'Crane and lifting equipment inspection reports'
  },
  {
    value: 'CORROSION',
    label: 'Corrosion Assessment',
    description: 'Corrosion monitoring and assessment reports'
  },
  {
    value: 'GENERAL',
    label: 'General Inspection',
    description: 'General equipment inspection reports'
  },
  {
    value: 'MAINTENANCE',
    label: 'Maintenance Report',
    description: 'Maintenance activity and completion reports'
  }
]

export function TemplateSettings({
  templateData,
  onTemplateDataChange,
  validationErrors
}: TemplateSettingsProps) {
  const updateTemplateData = (updates: Partial<TemplateFormData>) => {
    onTemplateDataChange({
      ...templateData,
      ...updates
    })
  }

  // Get validation errors for template settings
  const nameErrors = validationErrors.filter(error => error.field === 'name')
  const descriptionErrors = validationErrors.filter(error => error.field === 'description')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Template Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure basic template information and behavior
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="template-name">
                Template Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="template-name"
                value={templateData.name}
                onChange={(e) => updateTemplateData({ name: e.target.value })}
                placeholder="Enter template name"
                className={nameErrors.length > 0 ? 'border-destructive' : ''}
              />
              {nameErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {nameErrors[0].message}
                  </AlertDescription>
                </Alert>
              )}
              <p className="text-xs text-muted-foreground">
                A clear, descriptive name for this template
              </p>
            </div>

            {/* Template Description */}
            <div className="space-y-2">
              <Label htmlFor="template-description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="template-description"
                value={templateData.description}
                onChange={(e) => updateTemplateData({ description: e.target.value })}
                placeholder="Describe what this template is used for"
                rows={3}
                className={descriptionErrors.length > 0 ? 'border-destructive' : ''}
              />
              {descriptionErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {descriptionErrors[0].message}
                  </AlertDescription>
                </Alert>
              )}
              <p className="text-xs text-muted-foreground">
                Explain the purpose and use case for this template
              </p>
            </div>

            {/* Report Type */}
            <div className="space-y-2">
              <Label htmlFor="report-type">
                Report Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={templateData.reportType}
                onValueChange={(value: ReportType) => updateTemplateData({ reportType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The type of inspection or report this template is designed for
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Template Status and Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status & Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Active Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="template-active">Active Template</Label>
                  <p className="text-xs text-muted-foreground">
                    Active templates are available for use in creating reports
                  </p>
                </div>
                <Switch
                  id="template-active"
                  checked={templateData.isActive}
                  onCheckedChange={(checked) => updateTemplateData({ isActive: checked })}
                />
              </div>
            </div>

            {/* Template Statistics */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">Template Statistics</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-muted rounded">
                  <div className="font-semibold text-lg">
                    {templateData.sections.length}
                  </div>
                  <div className="text-muted-foreground text-xs">Sections</div>
                </div>
                
                <div className="text-center p-3 bg-muted rounded">
                  <div className="font-semibold text-lg">
                    {templateData.sections.reduce((sum, section) => sum + section.fields.length, 0)}
                  </div>
                  <div className="text-muted-foreground text-xs">Total Fields</div>
                </div>
                
                <div className="text-center p-3 bg-muted rounded">
                  <div className="font-semibold text-lg">
                    {templateData.sections.reduce(
                      (sum, section) => sum + section.fields.filter(field => field.required).length, 
                      0
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">Required Fields</div>
                </div>
                
                <div className="text-center p-3 bg-muted rounded">
                  <div className="font-semibold text-lg">
                    {templateData.sections.filter(section => section.isRequired).length}
                  </div>
                  <div className="text-muted-foreground text-xs">Required Sections</div>
                </div>
              </div>
            </div>

            {/* Field Type Distribution */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">Field Type Distribution</h4>
              
              {(() => {
                const fieldTypes = templateData.sections.reduce((acc, section) => {
                  section.fields.forEach(field => {
                    acc[field.type] = (acc[field.type] || 0) + 1
                  })
                  return acc
                }, {} as Record<string, number>)

                const fieldTypeLabels: Record<string, string> = {
                  text: 'Text',
                  textarea: 'Text Area',
                  number: 'Number',
                  date: 'Date',
                  select: 'Dropdown',
                  multiselect: 'Multi-Select',
                  checkbox: 'Checkbox',
                  file: 'File',
                  image: 'Image'
                }

                return Object.keys(fieldTypes).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(fieldTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {fieldTypeLabels[type] || type}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No fields added yet
                  </p>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Summary */}
      {validationErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Validation Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationErrors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>{error.field}:</strong> {error.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Template Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
              <span>
                <strong>Template Name:</strong> Use a clear, descriptive name that indicates the template's purpose
              </span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
              <span>
                <strong>Report Type:</strong> Choose the appropriate type to ensure proper categorization and workflow
              </span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
              <span>
                <strong>Active Status:</strong> Only active templates are available for creating new reports
              </span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
              <span>
                <strong>Required Fields:</strong> Mark fields as required when they are essential for the report
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
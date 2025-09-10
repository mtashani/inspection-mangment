'use client'

import { useState } from 'react'
import { Eye, Code, Smartphone, Monitor, Tablet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TemplateFormData, FieldType } from '@/types/admin'

interface TemplatePreviewProps {
  templateData: TemplateFormData
}

type ViewMode = 'desktop' | 'tablet' | 'mobile'

export function TemplatePreview({ templateData }: TemplatePreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')
  const [previewData, setPreviewData] = useState<Record<string, unknown>>({})

  const getViewModeClass = () => {
    switch (viewMode) {
      case 'mobile':
        return 'max-w-sm mx-auto'
      case 'tablet':
        return 'max-w-2xl mx-auto'
      default:
        return 'max-w-4xl mx-auto'
    }
  }

  const renderField = (field: any, sectionIndex: number, fieldIndex: number) => {
    const fieldKey = `section_${sectionIndex}_field_${fieldIndex}`
    const fieldValue = previewData[fieldKey]

    const updateFieldValue = (value: unknown) => {
      setPreviewData(prev => ({
        ...prev,
        [fieldKey]: value
      }))
    }

    const commonProps = {
      id: fieldKey,
      disabled: false, // Preview mode - fields are interactive
    }

    switch (field.type as FieldType) {
      case 'text':
        return (
          <Input
            {...commonProps}
            type="text"
            value={String(fieldValue || field.defaultValue || '')}
            onChange={(e) => updateFieldValue(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        )

      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            value={String(fieldValue || field.defaultValue || '')}
            onChange={(e) => updateFieldValue(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows={3}
          />
        )

      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            value={String(fieldValue || field.defaultValue || '')}
            onChange={(e) => updateFieldValue(Number(e.target.value))}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        )

      case 'date':
        return (
          <Input
            {...commonProps}
            type="date"
            value={String(fieldValue || field.defaultValue || '')}
            onChange={(e) => updateFieldValue(e.target.value)}
          />
        )

      case 'select':
        return (
          <Select
            value={String(fieldValue || field.defaultValue || '')}
            onValueChange={updateFieldValue}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'multiselect':
        return (
          <div className="space-y-2">
            {(field.options || []).map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${fieldKey}_${index}`}
                  checked={Array.isArray(fieldValue) && fieldValue.includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(fieldValue) ? fieldValue : []
                    if (checked) {
                      updateFieldValue([...currentValues, option])
                    } else {
                      updateFieldValue(currentValues.filter(v => v !== option))
                    }
                  }}
                />
                <Label htmlFor={`${fieldKey}_${index}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              {...commonProps}
              checked={Boolean(fieldValue ?? field.defaultValue)}
              onCheckedChange={updateFieldValue}
            />
            <Label htmlFor={fieldKey} className="text-sm">
              {field.label}
            </Label>
          </div>
        )

      case 'file':
        return (
          <Input
            {...commonProps}
            type="file"
            onChange={(e) => updateFieldValue(e.target.files?.[0]?.name || '')}
            accept={field.validation?.pattern}
          />
        )

      case 'image':
        return (
          <div className="space-y-2">
            <Input
              {...commonProps}
              type="file"
              accept="image/*"
              onChange={(e) => updateFieldValue(e.target.files?.[0]?.name || '')}
            />
            {fieldValue && (
              <div className="text-xs text-muted-foreground">
                Selected: {String(fieldValue)}
              </div>
            )}
          </div>
        )

      default:
        return (
          <div className="p-4 bg-muted rounded border-dashed border-2">
            <p className="text-sm text-muted-foreground">
              Unsupported field type: {field.type}
            </p>
          </div>
        )
    }
  }

  const generatePreviewJSON = () => {
    const result: any = {
      templateId: 'preview',
      templateName: templateData.name,
      templateType: templateData.reportType,
      sections: {}
    }

    templateData.sections.forEach((section, sectionIndex) => {
      result.sections[section.title] = {
        fields: {}
      }

      section.fields.forEach((field, fieldIndex) => {
        const fieldKey = `section_${sectionIndex}_field_${fieldIndex}`
        result.sections[section.title].fields[field.name] = {
          label: field.label,
          type: field.type,
          value: previewData[fieldKey] || field.defaultValue || null,
          required: field.required
        }
      })
    })

    return JSON.stringify(result, null, 2)
  }

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Template Preview</h2>
          <p className="text-sm text-muted-foreground">
            See how your template will look to users
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('desktop')}
          >
            <Monitor className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'tablet' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('tablet')}
          >
            <Tablet className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('mobile')}
          >
            <Smartphone className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="visual" className="w-full">
        <TabsList>
          <TabsTrigger value="visual">
            <Eye className="w-4 h-4 mr-2" />
            Visual Preview
          </TabsTrigger>
          <TabsTrigger value="json">
            <Code className="w-4 h-4 mr-2" />
            JSON Output
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="mt-6">
          <div className={getViewModeClass()}>
            {/* Template Header */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{templateData.name || 'Untitled Template'}</CardTitle>
                    {templateData.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {templateData.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{templateData.reportType}</Badge>
                    <Badge variant={templateData.isActive ? 'default' : 'secondary'}>
                      {templateData.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Template Sections */}
            {templateData.sections.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center text-muted-foreground">
                    <Eye className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No sections to preview</h3>
                    <p className="text-sm">
                      Add sections and fields to see the template preview
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {templateData.sections.map((section, sectionIndex) => (
                  <Card key={sectionIndex}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                          {section.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {section.description}
                            </p>
                          )}
                        </div>
                        {section.isRequired && (
                          <Badge variant="secondary">Required</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {section.fields.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <p className="text-sm">No fields in this section</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {section.fields.map((field, fieldIndex) => (
                            <div key={fieldIndex} className="space-y-2">
                              <Label htmlFor={`section_${sectionIndex}_field_${fieldIndex}`}>
                                {field.label}
                                {field.required && (
                                  <span className="text-destructive ml-1">*</span>
                                )}
                              </Label>
                              {field.description && (
                                <p className="text-xs text-muted-foreground">
                                  {field.description}
                                </p>
                              )}
                              {renderField(field, sectionIndex, fieldIndex)}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="json" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">JSON Output</CardTitle>
              <p className="text-sm text-muted-foreground">
                This is how the template data would be structured when submitted
              </p>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                <code>{generatePreviewJSON()}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
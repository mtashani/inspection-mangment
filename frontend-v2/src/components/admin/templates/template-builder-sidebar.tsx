'use client'

import { useState } from 'react'
import { 
  Type, 
  Hash, 
  Calendar, 
  List, 
  CheckSquare, 
  FileText, 
  Image, 
  Upload,
  AlertCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TemplateFormData, FieldType } from '@/types/admin'

interface TemplateBuilderSidebarProps {
  templateData: TemplateFormData
  onTemplateDataChange: (data: TemplateFormData) => void
  validationErrors: Array<{ field: string; message: string }>
}

interface FieldTypeOption {
  type: FieldType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: 'basic' | 'advanced' | 'media'
}

const fieldTypes: FieldTypeOption[] = [
  {
    type: 'text',
    label: 'Text Input',
    description: 'Single line text input',
    icon: Type,
    category: 'basic'
  },
  {
    type: 'textarea',
    label: 'Text Area',
    description: 'Multi-line text input',
    icon: FileText,
    category: 'basic'
  },
  {
    type: 'number',
    label: 'Number',
    description: 'Numeric input field',
    icon: Hash,
    category: 'basic'
  },
  {
    type: 'date',
    label: 'Date',
    description: 'Date picker input',
    icon: Calendar,
    category: 'basic'
  },
  {
    type: 'select',
    label: 'Dropdown',
    description: 'Single selection dropdown',
    icon: List,
    category: 'basic'
  },
  {
    type: 'multiselect',
    label: 'Multi-Select',
    description: 'Multiple selection dropdown',
    icon: List,
    category: 'advanced'
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    description: 'Boolean checkbox input',
    icon: CheckSquare,
    category: 'basic'
  },
  {
    type: 'file',
    label: 'File Upload',
    description: 'File upload input',
    icon: Upload,
    category: 'media'
  },
  {
    type: 'image',
    label: 'Image Upload',
    description: 'Image upload with preview',
    icon: Image,
    category: 'media'
  }
]

const fieldCategories = {
  basic: 'Basic Fields',
  advanced: 'Advanced Fields',
  media: 'Media Fields'
}

export function TemplateBuilderSidebar({
  templateData,
  onTemplateDataChange,
  validationErrors
}: TemplateBuilderSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    basic: true,
    advanced: false,
    media: false
  })

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const getFieldsByCategory = (category: string) => {
    return fieldTypes.filter(field => field.category === category)
  }

  const getTemplateStats = () => {
    const totalSections = templateData.sections.length
    const totalFields = templateData.sections.reduce((sum, section) => sum + section.fields.length, 0)
    const requiredFields = templateData.sections.reduce(
      (sum, section) => sum + section.fields.filter(field => field.required).length, 
      0
    )

    return { totalSections, totalFields, requiredFields }
  }

  const stats = getTemplateStats()
  const hasErrors = validationErrors.length > 0

  return (
    <div className="h-full flex flex-col">
      {/* Template Overview */}
      <Card className="m-4 mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Template Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-semibold text-lg">{stats.totalSections}</div>
              <div className="text-muted-foreground text-xs">Sections</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-semibold text-lg">{stats.totalFields}</div>
              <div className="text-muted-foreground text-xs">Fields</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Required Fields:</span>
            <Badge variant="secondary">{stats.requiredFields}</Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Template Type:</span>
            <Badge variant="outline">{templateData.reportType}</Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={templateData.isActive ? 'default' : 'secondary'}>
              {templateData.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {hasErrors && (
        <Alert className="mx-4 mb-2" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {validationErrors.length} validation error{validationErrors.length !== 1 ? 's' : ''} found
          </AlertDescription>
        </Alert>
      )}

      {/* Field Types */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pt-2">
          <h3 className="text-sm font-medium mb-3">Field Types</h3>
          
          {Object.entries(fieldCategories).map(([categoryKey, categoryLabel]) => (
            <Collapsible
              key={categoryKey}
              open={expandedCategories[categoryKey]}
              onOpenChange={() => toggleCategory(categoryKey)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-2 h-auto mb-2"
                >
                  <span className="text-sm font-medium">{categoryLabel}</span>
                  {expandedCategories[categoryKey] ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-1 mb-4">
                {getFieldsByCategory(categoryKey).map((fieldType) => (
                  <div
                    key={fieldType.type}
                    className="p-3 border rounded-lg cursor-move hover:bg-muted/50 transition-colors"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({
                        type: 'field-type',
                        fieldType: fieldType.type
                      }))
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <fieldType.icon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{fieldType.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {fieldType.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <Card className="m-4 mt-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
            <span>Drag field types from the sidebar to add them to sections</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
            <span>Drag sections and fields to reorder them</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
            <span>Use the preview tab to see how your template will look</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
            <span>Configure template settings in the settings tab</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  GripVertical, 
  Settings, 
  Trash2, 
  Type, 
  Hash, 
  Calendar, 
  List, 
  CheckSquare, 
  FileText, 
  Image, 
  Upload,
  AlertCircle,
  Plus,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TemplateFieldData, FieldType } from '@/types/admin'

interface TemplateFieldBuilderProps {
  field: TemplateFieldData
  fieldIndex: number
  sectionIndex: number
  onUpdateField: (updates: Partial<TemplateFieldData>) => void
  onDeleteField: () => void
  validationErrors: Array<{ field: string; message: string }>
}

const fieldTypeIcons: Record<FieldType, React.ComponentType<{ className?: string }>> = {
  text: Type,
  textarea: FileText,
  number: Hash,
  date: Calendar,
  select: List,
  multiselect: List,
  checkbox: CheckSquare,
  file: Upload,
  image: Image,
}

const fieldTypeLabels: Record<FieldType, string> = {
  text: 'Text Input',
  textarea: 'Text Area',
  number: 'Number',
  date: 'Date',
  select: 'Dropdown',
  multiselect: 'Multi-Select',
  checkbox: 'Checkbox',
  file: 'File Upload',
  image: 'Image Upload',
}

export function TemplateFieldBuilder({
  field,
  fieldIndex,
  sectionIndex,
  onUpdateField,
  onDeleteField,
  validationErrors
}: TemplateFieldBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `field-${sectionIndex}-${fieldIndex}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Get validation errors for this field
  const fieldErrors = validationErrors.filter(error => 
    error.field.startsWith(`sections.${sectionIndex}.fields.${fieldIndex}`)
  )

  const FieldIcon = fieldTypeIcons[field.type]

  const handleAddOption = () => {
    const currentOptions = field.options || []
    const newOption = `Option ${currentOptions.length + 1}`
    onUpdateField({
      options: [...currentOptions, newOption]
    })
  }

  const handleUpdateOption = (optionIndex: number, value: string) => {
    const currentOptions = field.options || []
    const updatedOptions = currentOptions.map((option, index) => 
      index === optionIndex ? value : option
    )
    onUpdateField({ options: updatedOptions })
  }

  const handleRemoveOption = (optionIndex: number) => {
    const currentOptions = field.options || []
    const updatedOptions = currentOptions.filter((_, index) => index !== optionIndex)
    onUpdateField({ options: updatedOptions })
  }

  const renderFieldTypeSpecificSettings = () => {
    switch (field.type) {
      case 'select':
      case 'multiselect':
        return (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Options</Label>
            <div className="space-y-2">
              {(field.options || []).map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => handleUpdateOption(optionIndex, e.target.value)}
                    placeholder={`Option ${optionIndex + 1}`}
                    className="text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOption(optionIndex)}
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="w-full text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Option
              </Button>
            </div>
          </div>
        )

      case 'number':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-medium">Min Value</Label>
              <Input
                type="number"
                value={field.validation?.min || ''}
                onChange={(e) => onUpdateField({
                  validation: {
                    ...field.validation,
                    min: e.target.value ? Number(e.target.value) : undefined
                  }
                })}
                placeholder="Min"
                className="text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Max Value</Label>
              <Input
                type="number"
                value={field.validation?.max || ''}
                onChange={(e) => onUpdateField({
                  validation: {
                    ...field.validation,
                    max: e.target.value ? Number(e.target.value) : undefined
                  }
                })}
                placeholder="Max"
                className="text-xs"
              />
            </div>
          </div>
        )

      case 'text':
      case 'textarea':
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium">Min Length</Label>
                <Input
                  type="number"
                  value={field.validation?.min || ''}
                  onChange={(e) => onUpdateField({
                    validation: {
                      ...field.validation,
                      min: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  placeholder="Min"
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Max Length</Label>
                <Input
                  type="number"
                  value={field.validation?.max || ''}
                  onChange={(e) => onUpdateField({
                    validation: {
                      ...field.validation,
                      max: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  placeholder="Max"
                  className="text-xs"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Pattern (Regex)</Label>
              <Input
                value={field.validation?.pattern || ''}
                onChange={(e) => onUpdateField({
                  validation: {
                    ...field.validation,
                    pattern: e.target.value || undefined
                  }
                })}
                placeholder="^[A-Za-z0-9]+$"
                className="text-xs"
              />
            </div>
          </div>
        )

      case 'file':
      case 'image':
        return (
          <div className="space-y-2">
            <div>
              <Label className="text-xs font-medium">Max File Size (MB)</Label>
              <Input
                type="number"
                value={field.validation?.max || ''}
                onChange={(e) => onUpdateField({
                  validation: {
                    ...field.validation,
                    max: e.target.value ? Number(e.target.value) : undefined
                  }
                })}
                placeholder="5"
                className="text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Accepted File Types</Label>
              <Input
                value={field.validation?.pattern || ''}
                onChange={(e) => onUpdateField({
                  validation: {
                    ...field.validation,
                    pattern: e.target.value || undefined
                  }
                })}
                placeholder=".jpg,.png,.pdf"
                className="text-xs"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`${isDragging ? 'shadow-lg' : ''} ${fieldErrors.length > 0 ? 'border-destructive' : ''}`}
    >
      <CardContent className="p-3">
        <div className="space-y-3">
          {/* Field Header */}
          <div className="flex items-center gap-2">
            {/* Drag Handle */}
            <Button
              variant="ghost"
              size="sm"
              className="cursor-grab active:cursor-grabbing p-1 h-auto"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </Button>

            {/* Field Icon and Type */}
            <div className="flex items-center gap-2">
              <FieldIcon className="w-4 h-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                {fieldTypeLabels[field.type]}
              </Badge>
            </div>

            {/* Field Name */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{field.label}</div>
              <div className="text-xs text-muted-foreground truncate">{field.name}</div>
            </div>

            {/* Field Status */}
            <div className="flex items-center gap-1">
              {field.required && (
                <Badge variant="secondary" className="text-xs">Required</Badge>
              )}
              {fieldErrors.length > 0 && (
                <AlertCircle className="w-4 h-4 text-destructive" />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 px-2"
              >
                <Settings className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteField}
                className="h-6 px-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Validation Errors */}
          {fieldErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {fieldErrors.map(error => error.message).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Field Settings (when expanded) */}
          {isExpanded && (
            <div className="space-y-3 pt-3 border-t">
              {/* Basic Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Field Name</Label>
                  <Input
                    value={field.name}
                    onChange={(e) => onUpdateField({ name: e.target.value })}
                    placeholder="field_name"
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Field Label</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => onUpdateField({ label: e.target.value })}
                    placeholder="Field Label"
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium">Description</Label>
                <Textarea
                  value={field.description || ''}
                  onChange={(e) => onUpdateField({ description: e.target.value })}
                  placeholder="Field description (optional)"
                  className="text-xs resize-none"
                  rows={2}
                />
              </div>

              {/* Field Type Specific Settings */}
              {renderFieldTypeSpecificSettings()}

              {/* Default Value */}
              {field.type !== 'file' && field.type !== 'image' && (
                <div>
                  <Label className="text-xs font-medium">Default Value</Label>
                  {field.type === 'checkbox' ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <Switch
                        checked={Boolean(field.defaultValue)}
                        onCheckedChange={(checked) => onUpdateField({ defaultValue: checked })}
                      />
                      <Label className="text-xs">Default to checked</Label>
                    </div>
                  ) : field.type === 'select' ? (
                    <Select
                      value={String(field.defaultValue || '')}
                      onValueChange={(value) => onUpdateField({ defaultValue: value })}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select default option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No default</SelectItem>
                        {(field.options || []).map((option, index) => (
                          <SelectItem key={index} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={String(field.defaultValue || '')}
                      onChange={(e) => onUpdateField({ defaultValue: e.target.value })}
                      placeholder="Default value"
                      className="text-xs"
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    />
                  )}
                </div>
              )}

              {/* Required Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={field.required}
                  onCheckedChange={(checked) => onUpdateField({ required: checked })}
                />
                <Label className="text-xs">Required field</Label>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
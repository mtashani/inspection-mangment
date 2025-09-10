'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  GripVertical, 
  Plus, 
  Settings, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TemplateSectionData, TemplateFieldData, FieldType } from '@/types/admin'
import { TemplateFieldBuilder } from './template-field-builder'

interface TemplateSectionBuilderProps {
  section: TemplateSectionData
  sectionIndex: number
  onUpdateSection: (updates: Partial<TemplateSectionData>) => void
  onDeleteSection: () => void
  onAddField: (fieldType: FieldType) => void
  onUpdateField: (fieldIndex: number, updates: Partial<TemplateFieldData>) => void
  onDeleteField: (fieldIndex: number) => void
  validationErrors: Array<{ field: string; message: string }>
}

const fieldTypeOptions: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'file', label: 'File Upload' },
  { value: 'image', label: 'Image Upload' },
]

export function TemplateSectionBuilder({
  section,
  sectionIndex,
  onUpdateSection,
  onDeleteSection,
  onAddField,
  onUpdateField,
  onDeleteField,
  validationErrors
}: TemplateSectionBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `section-${sectionIndex}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Get validation errors for this section
  const sectionErrors = validationErrors.filter(error => 
    error.field.startsWith(`sections.${sectionIndex}`)
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type === 'field-type' && data.fieldType) {
        onAddField(data.fieldType as FieldType)
      }
    } catch (error) {
      console.error('Failed to parse drop data:', error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`${isDragging ? 'shadow-lg' : ''} ${sectionErrors.length > 0 ? 'border-destructive' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <Button
            variant="ghost"
            size="sm"
            className="cursor-grab active:cursor-grabbing p-1 h-auto"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </Button>

          {/* Expand/Collapse */}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 h-auto">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>

          {/* Section Info */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={section.title}
                  onChange={(e) => onUpdateSection({ title: e.target.value })}
                  placeholder="Section title"
                  className="text-sm"
                />
                <Textarea
                  value={section.description || ''}
                  onChange={(e) => onUpdateSection({ description: e.target.value })}
                  placeholder="Section description (optional)"
                  className="text-xs resize-none"
                  rows={2}
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm truncate">{section.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
                  </Badge>
                  {section.isRequired && (
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  )}
                  {sectionErrors.length > 0 && (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                {section.description && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {section.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Section Actions */}
          <div className="flex items-center gap-1">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="h-8 px-2 text-xs"
                >
                  Done
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 px-2"
                >
                  <Settings className="w-3 h-3" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Add Field</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {fieldTypeOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => onAddField(option.value)}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDeleteSection}
                  className="h-8 px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Section Settings (when editing) */}
        {isEditing && (
          <div className="pt-3 border-t space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id={`section-${sectionIndex}-required`}
                checked={section.isRequired}
                onCheckedChange={(checked) => onUpdateSection({ isRequired: checked })}
              />
              <Label htmlFor={`section-${sectionIndex}-required`} className="text-sm">
                Required section
              </Label>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {sectionErrors.length > 0 && (
          <Alert variant="destructive" className="mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {sectionErrors.map(error => error.message).join(', ')}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent 
            className="pt-0"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {section.fields.length === 0 ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <div className="text-muted-foreground">
                  <Plus className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No fields in this section</p>
                  <p className="text-xs">Drag field types here or use the + button above</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {section.fields.map((field, fieldIndex) => (
                  <TemplateFieldBuilder
                    key={fieldIndex}
                    field={field}
                    fieldIndex={fieldIndex}
                    sectionIndex={sectionIndex}
                    onUpdateField={(updates) => onUpdateField(fieldIndex, updates)}
                    onDeleteField={() => onDeleteField(fieldIndex)}
                    validationErrors={validationErrors}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
'use client'

import { useState, useCallback } from 'react'
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, Eye, Save, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  TemplateFormData, 
  TemplateSectionData, 
  TemplateFieldData, 
  FieldType,
  ReportType 
} from '@/types/admin'
import { TemplateBuilderSidebar } from './template-builder-sidebar'
import { TemplateSectionBuilder } from './template-section-builder'
import { TemplatePreview } from './template-preview'
import { TemplateSettings } from './template-settings'
import { generateId } from '@/lib/utils'

interface TemplateBuilderProps {
  initialData?: Partial<TemplateFormData>
  onSave: (data: TemplateFormData) => Promise<void>
  onValidate?: (data: TemplateFormData) => Promise<{ isValid: boolean; errors: Array<{ field: string; message: string }> }>
  isLoading?: boolean
}

export function TemplateBuilder({ 
  initialData, 
  onSave, 
  onValidate,
  isLoading = false 
}: TemplateBuilderProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('builder')
  const [draggedItem, setDraggedItem] = useState<{
    type: 'section' | 'field'
    id: string
    sectionId?: string
  } | null>(null)

  // Template data state
  const [templateData, setTemplateData] = useState<TemplateFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    reportType: initialData?.reportType || 'GENERAL',
    isActive: initialData?.isActive ?? true,
    sections: initialData?.sections || []
  })

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Array<{ field: string; message: string }>>([])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Add new section
  const addSection = useCallback(() => {
    const newSection: TemplateSectionData = {
      title: `Section ${templateData.sections.length + 1}`,
      description: '',
      order: templateData.sections.length,
      fields: [],
      isRequired: false
    }

    setTemplateData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }))
  }, [templateData.sections.length])

  // Update section
  const updateSection = useCallback((sectionIndex: number, updates: Partial<TemplateSectionData>) => {
    setTemplateData(prev => ({
      ...prev,
      sections: prev.sections.map((section, index) => 
        index === sectionIndex ? { ...section, ...updates } : section
      )
    }))
  }, [])

  // Delete section
  const deleteSection = useCallback((sectionIndex: number) => {
    setTemplateData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, index) => index !== sectionIndex)
        .map((section, index) => ({ ...section, order: index }))
    }))
  }, [])

  // Add field to section
  const addFieldToSection = useCallback((sectionIndex: number, fieldType: FieldType) => {
    const newField: TemplateFieldData = {
      name: `field_${generateId()}`,
      type: fieldType,
      label: `New ${fieldType} Field`,
      description: '',
      required: false,
      order: templateData.sections[sectionIndex]?.fields.length || 0,
      options: fieldType === 'select' || fieldType === 'multiselect' ? ['Option 1', 'Option 2'] : undefined,
      validation: {},
      defaultValue: undefined
    }

    updateSection(sectionIndex, {
      fields: [...(templateData.sections[sectionIndex]?.fields || []), newField]
    })
  }, [templateData.sections, updateSection])

  // Update field in section
  const updateFieldInSection = useCallback((
    sectionIndex: number, 
    fieldIndex: number, 
    updates: Partial<TemplateFieldData>
  ) => {
    const section = templateData.sections[sectionIndex]
    if (!section) return

    const updatedFields = section.fields.map((field, index) => 
      index === fieldIndex ? { ...field, ...updates } : field
    )

    updateSection(sectionIndex, { fields: updatedFields })
  }, [templateData.sections, updateSection])

  // Delete field from section
  const deleteFieldFromSection = useCallback((sectionIndex: number, fieldIndex: number) => {
    const section = templateData.sections[sectionIndex]
    if (!section) return

    const updatedFields = section.fields
      .filter((_, index) => index !== fieldIndex)
      .map((field, index) => ({ ...field, order: index }))

    updateSection(sectionIndex, { fields: updatedFields })
  }, [updateSection])

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeId = active.id as string
    
    // Determine if dragging a section or field
    if (activeId.startsWith('section-')) {
      setDraggedItem({
        type: 'section',
        id: activeId.replace('section-', '')
      })
    } else if (activeId.startsWith('field-')) {
      const [, sectionId, fieldId] = activeId.split('-')
      setDraggedItem({
        type: 'field',
        id: fieldId,
        sectionId
      })
    }
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || !draggedItem) {
      setDraggedItem(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    if (draggedItem.type === 'section') {
      // Reorder sections
      const oldIndex = templateData.sections.findIndex((_, index) => 
        `section-${index}` === activeId
      )
      const newIndex = templateData.sections.findIndex((_, index) => 
        `section-${index}` === overId
      )

      if (oldIndex !== newIndex) {
        const reorderedSections = arrayMove(templateData.sections, oldIndex, newIndex)
          .map((section, index) => ({ ...section, order: index }))

        setTemplateData(prev => ({
          ...prev,
          sections: reorderedSections
        }))
      }
    } else if (draggedItem.type === 'field' && draggedItem.sectionId) {
      // Reorder fields within section
      const sectionIndex = parseInt(draggedItem.sectionId)
      const section = templateData.sections[sectionIndex]
      
      if (section) {
        const oldIndex = section.fields.findIndex((_, index) => 
          `field-${sectionIndex}-${index}` === activeId
        )
        const newIndex = section.fields.findIndex((_, index) => 
          `field-${sectionIndex}-${index}` === overId
        )

        if (oldIndex !== newIndex) {
          const reorderedFields = arrayMove(section.fields, oldIndex, newIndex)
            .map((field, index) => ({ ...field, order: index }))

          updateSection(sectionIndex, { fields: reorderedFields })
        }
      }
    }

    setDraggedItem(null)
  }

  // Validate template
  const validateTemplate = async () => {
    if (onValidate) {
      try {
        const result = await onValidate(templateData)
        setValidationErrors(result.errors)
        return result.isValid
      } catch (error) {
        toast({
          title: 'Validation Error',
          description: 'Failed to validate template',
          variant: 'destructive',
        })
        return false
      }
    }

    // Basic client-side validation
    const errors: Array<{ field: string; message: string }> = []

    if (!templateData.name.trim()) {
      errors.push({ field: 'name', message: 'Template name is required' })
    }

    if (!templateData.description.trim()) {
      errors.push({ field: 'description', message: 'Template description is required' })
    }

    if (templateData.sections.length === 0) {
      errors.push({ field: 'sections', message: 'Template must have at least one section' })
    }

    templateData.sections.forEach((section, sectionIndex) => {
      if (!section.title.trim()) {
        errors.push({ 
          field: `sections.${sectionIndex}.title`, 
          message: `Section ${sectionIndex + 1} title is required` 
        })
      }

      section.fields.forEach((field, fieldIndex) => {
        if (!field.name.trim()) {
          errors.push({ 
            field: `sections.${sectionIndex}.fields.${fieldIndex}.name`, 
            message: `Field name is required in section ${sectionIndex + 1}` 
          })
        }

        if (!field.label.trim()) {
          errors.push({ 
            field: `sections.${sectionIndex}.fields.${fieldIndex}.label`, 
            message: `Field label is required in section ${sectionIndex + 1}` 
          })
        }
      })
    })

    setValidationErrors(errors)
    return errors.length === 0
  }

  // Save template
  const handleSave = async () => {
    const isValid = await validateTemplate()
    
    if (!isValid) {
      toast({
        title: 'Validation Failed',
        description: 'Please fix the validation errors before saving',
        variant: 'destructive',
      })
      return
    }

    try {
      await onSave(templateData)
      toast({
        title: 'Template Saved',
        description: 'Template has been saved successfully',
      })
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">Template Builder</h1>
          <p className="text-muted-foreground">
            Create and customize report templates with drag-and-drop functionality
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={validateTemplate}
            disabled={isLoading}
          >
            <Settings className="w-4 h-4 mr-2" />
            Validate
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r bg-muted/30">
          <TemplateBuilderSidebar
            templateData={templateData}
            onTemplateDataChange={setTemplateData}
            validationErrors={validationErrors}
          />
        </div>

        {/* Builder Area */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
              <TabsTrigger value="builder">Builder</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="flex-1 p-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="space-y-4">
                  {templateData.sections.length === 0 ? (
                    <Card className="border-dashed border-2">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="text-center space-y-4">
                          <div className="text-muted-foreground">
                            <Plus className="w-12 h-12 mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No sections yet</h3>
                            <p className="text-sm">
                              Add your first section to start building your template
                            </p>
                          </div>
                          <Button onClick={addSection}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Section
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <SortableContext
                      items={templateData.sections.map((_, index) => `section-${index}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      {templateData.sections.map((section, sectionIndex) => (
                        <TemplateSectionBuilder
                          key={sectionIndex}
                          section={section}
                          sectionIndex={sectionIndex}
                          onUpdateSection={(updates) => updateSection(sectionIndex, updates)}
                          onDeleteSection={() => deleteSection(sectionIndex)}
                          onAddField={(fieldType) => addFieldToSection(sectionIndex, fieldType)}
                          onUpdateField={(fieldIndex, updates) => 
                            updateFieldInSection(sectionIndex, fieldIndex, updates)
                          }
                          onDeleteField={(fieldIndex) => 
                            deleteFieldFromSection(sectionIndex, fieldIndex)
                          }
                          validationErrors={validationErrors}
                        />
                      ))}
                    </SortableContext>
                  )}

                  {templateData.sections.length > 0 && (
                    <div className="flex justify-center pt-4">
                      <Button variant="outline" onClick={addSection}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Section
                      </Button>
                    </div>
                  )}
                </div>
              </DndContext>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 p-6">
              <TemplatePreview templateData={templateData} />
            </TabsContent>

            <TabsContent value="settings" className="flex-1 p-6">
              <TemplateSettings
                templateData={templateData}
                onTemplateDataChange={setTemplateData}
                validationErrors={validationErrors}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
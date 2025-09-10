"use client";

import { useState, useEffect, useRef } from "react";
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CalendarIcon,
  PhotoIcon,
  HashtagIcon,
  CheckSquareIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  GripVerticalIcon,
  CogIcon,
  ArrowLeftIcon,
  FloppyDiskIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Template,
  TemplateSection,
  TemplateField,
  FieldType,
} from "@/types/professional-reports";

export interface TemplateBuilderProps {
  templateId?: string;
  onSave: (template: Template) => void;
  onCancel: () => void;
  className?: string;
}

interface DraggedField {
  type: FieldType;
  label: string;
  icon: React.ReactNode;
}

interface FieldConfiguration {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  order: number;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export function TemplateBuilder({
  templateId,
  onSave,
  onCancel,
  className,
}: TemplateBuilderProps) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showFieldConfig, setShowFieldConfig] = useState(false);
  const [fieldConfig, setFieldConfig] = useState<FieldConfiguration | null>(
    null
  );
  const [draggedField, setDraggedField] = useState<DraggedField | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Available field types
  const fieldTypes: {
    type: FieldType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      type: "text",
      label: "Text Input",
      icon: <DocumentTextIcon className="h-4 w-4" />,
    },
    {
      type: "textarea",
      label: "Text Area",
      icon: <Squares2X2Icon className="h-4 w-4" />,
    },
    {
      type: "select",
      label: "Dropdown",
      icon: <ListBulletIcon className="h-4 w-4" />,
    },
    {
      type: "date",
      label: "Date Picker",
      icon: <CalendarIcon className="h-4 w-4" />,
    },
    {
      type: "number",
      label: "Number",
      icon: <HashtagIcon className="h-4 w-4" />,
    },
    {
      type: "checkbox",
      label: "Checkbox",
      icon: <CheckSquareIcon className="h-4 w-4" />,
    },
    {
      type: "image",
      label: "Image Upload",
      icon: <PhotoIcon className="h-4 w-4" />,
    },
  ];

  // Load template data
  useEffect(() => {
    if (templateId) {
      loadTemplate();
    } else {
      // Initialize new template
      setTemplate({
        id: "",
        name: "New Template",
        description: "",
        reportTypeId: "",
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: [],
      });
      setSections([]);
    }
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setIsLoading(true);

      // Mock API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock template data
      const mockTemplate: Template = {
        id: templateId!,
        name: "Pressure Vessel Inspection Report",
        description: "Standard template for pressure vessel inspections",
        reportTypeId: "equipment",
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-15T10:30:00Z",
        sections: [
          {
            id: "1",
            title: "General Information",
            order: 1,
            fields: [
              {
                id: "1",
                name: "inspection_date",
                label: "Inspection Date",
                type: "date",
                required: true,
                order: 1,
              },
              {
                id: "2",
                name: "inspector_name",
                label: "Inspector Name",
                type: "text",
                required: true,
                order: 2,
              },
            ],
          },
          {
            id: "2",
            title: "Equipment Details",
            order: 2,
            fields: [
              {
                id: "3",
                name: "equipment_condition",
                label: "Equipment Condition",
                type: "select",
                required: true,
                order: 1,
                options: ["Excellent", "Good", "Fair", "Poor"],
              },
            ],
          },
        ],
      };

      setTemplate(mockTemplate);
      setSections(mockTemplate.sections);
    } catch (err) {
      console.error("Failed to load template:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new section
  const addSection = () => {
    const newSection: TemplateSection = {
      id: Date.now().toString(),
      title: "New Section",
      order: sections.length + 1,
      fields: [],
    };
    setSections((prev) => [...prev, newSection]);
    setSelectedSection(newSection.id);
  };

  // Update section
  const updateSection = (
    sectionId: string,
    updates: Partial<TemplateSection>
  ) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    );
  };

  // Delete section
  const deleteSection = (sectionId: string) => {
    setSections((prev) => prev.filter((section) => section.id !== sectionId));
    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
  };

  // Move section
  const moveSection = (sectionId: string, direction: "up" | "down") => {
    setSections((prev) => {
      const index = prev.findIndex((s) => s.id === sectionId);
      if (index === -1) return prev;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newSections = [...prev];
      const [movedSection] = newSections.splice(index, 1);
      newSections.splice(newIndex, 0, movedSection);

      // Update order
      return newSections.map((section, idx) => ({
        ...section,
        order: idx + 1,
      }));
    });
  };

  // Add field to section
  const addFieldToSection = (sectionId: string, fieldType: FieldType) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const newField: TemplateField = {
      id: Date.now().toString(),
      name: `field_${Date.now()}`,
      label: `New ${fieldType} Field`,
      type: fieldType,
      required: false,
      order: section.fields.length + 1,
    };

    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s
      )
    );

    // Open field configuration
    setFieldConfig({
      id: newField.id,
      name: newField.name,
      label: newField.label,
      type: newField.type,
      required: newField.required,
      order: newField.order,
      placeholder: "",
      options: fieldType === "select" ? ["Option 1", "Option 2"] : undefined,
    });
    setShowFieldConfig(true);
  };

  // Update field
  const updateField = (
    sectionId: string,
    fieldId: string,
    updates: Partial<TemplateField>
  ) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.map((field) =>
                field.id === fieldId ? { ...field, ...updates } : field
              ),
            }
          : section
      )
    );
  };

  // Delete field
  const deleteField = (sectionId: string, fieldId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.filter((field) => field.id !== fieldId),
            }
          : section
      )
    );
  };

  // Handle field configuration save
  const handleFieldConfigSave = () => {
    if (!fieldConfig) return;

    const sectionId = sections.find((s) =>
      s.fields.some((f) => f.id === fieldConfig.id)
    )?.id;

    if (sectionId) {
      updateField(sectionId, fieldConfig.id, {
        name: fieldConfig.name,
        label: fieldConfig.label,
        required: fieldConfig.required,
        placeholder: fieldConfig.placeholder,
        options: fieldConfig.options,
      });
    }

    setShowFieldConfig(false);
    setFieldConfig(null);
  };

  // Handle drag start
  const handleDragStart = (fieldType: DraggedField) => {
    setDraggedField(fieldType);
  };

  // Handle drop on section
  const handleDropOnSection = (sectionId: string) => {
    if (draggedField) {
      addFieldToSection(sectionId, draggedField.type);
      setDraggedField(null);
    }
  };

  // Save template
  const handleSave = async () => {
    if (!template) return;

    try {
      const updatedTemplate: Template = {
        ...template,
        sections: sections,
        updatedAt: new Date().toISOString(),
      };

      await onSave(updatedTemplate);
    } catch (err) {
      console.error("Failed to save template:", err);
    }
  };

  // Render field preview
  const renderFieldPreview = (field: TemplateField) => {
    const baseClasses = "w-full p-2 border rounded text-sm";

    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            placeholder={field.placeholder || field.label}
            className={baseClasses}
            disabled
          />
        );
      case "textarea":
        return (
          <textarea
            placeholder={field.placeholder || field.label}
            className={cn(baseClasses, "h-20 resize-none")}
            disabled
          />
        );
      case "select":
        return (
          <select className={baseClasses} disabled>
            <option>Select {field.label}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case "date":
        return <input type="date" className={baseClasses} disabled />;
      case "number":
        return (
          <input
            type="number"
            placeholder={field.placeholder || field.label}
            className={baseClasses}
            disabled
          />
        );
      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <input type="checkbox" disabled />
            <label className="text-sm">{field.label}</label>
          </div>
        );
      case "image":
        return (
          <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center">
            <PhotoIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Upload {field.label}</p>
          </div>
        );
      default:
        return <div className="text-sm text-gray-500">Unknown field type</div>;
    }
  };

  if (isLoading) {
    return <TemplateBuilderSkeleton />;
  }

  return (
    <div className={cn("h-screen flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onCancel}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {template?.name || "Template Builder"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {templateId ? "Edit template structure" : "Create new template"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <EyeIcon className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave}>
            <FloppyDiskIcon className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Field Types */}
        <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
          <h3 className="font-medium mb-4">Field Types</h3>
          <div className="space-y-2">
            {fieldTypes.map((fieldType) => (
              <div
                key={fieldType.type}
                draggable
                onDragStart={() => handleDragStart(fieldType)}
                className="flex items-center space-x-2 p-2 bg-white border rounded cursor-move hover:bg-gray-50 transition-colors"
              >
                {fieldType.icon}
                <span className="text-sm">{fieldType.label}</span>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <Button onClick={addSection} className="w-full" size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 overflow-y-auto">
          <div ref={canvasRef} className="p-6 space-y-6">
            {sections.length === 0 ? (
              <div className="text-center py-12">
                <Squares2X2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Sections Yet
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Start building your template by adding sections and fields.
                </p>
                <Button onClick={addSection}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add First Section
                </Button>
              </div>
            ) : (
              sections.map((section, sectionIndex) => (
                <Card
                  key={section.id}
                  className={cn(
                    "transition-all duration-200",
                    selectedSection === section.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedSection(section.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1">
                        <GripVerticalIcon className="h-4 w-4 text-gray-400" />
                        <Input
                          value={section.title}
                          onChange={(e) =>
                            updateSection(section.id, { title: e.target.value })
                          }
                          className="font-medium border-none p-0 h-auto focus-visible:ring-0"
                          placeholder="Section Title"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(section.id, "up");
                          }}
                          disabled={sectionIndex === 0}
                        >
                          <ChevronUpIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(section.id, "down");
                          }}
                          disabled={sectionIndex === sections.length - 1}
                        >
                          <ChevronDownIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSection(section.id);
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent
                    className="space-y-4 min-h-[100px] border-2 border-dashed border-transparent hover:border-gray-300 transition-colors"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropOnSection(section.id);
                    }}
                  >
                    {section.fields.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">
                          Drop fields here or click to add
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3 justify-center">
                          {fieldTypes.slice(0, 3).map((fieldType) => (
                            <Button
                              key={fieldType.type}
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                addFieldToSection(section.id, fieldType.type)
                              }
                            >
                              {fieldType.icon}
                              <span className="ml-1 text-xs">
                                {fieldType.label}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      section.fields.map((field) => (
                        <div
                          key={field.id}
                          className="group relative p-3 border rounded hover:bg-gray-50 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedField(field.id);
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm font-medium">
                                {field.label}
                                {field.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </Label>
                              <Badge variant="outline" className="text-xs">
                                {field.type}
                              </Badge>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFieldConfig({
                                    id: field.id,
                                    name: field.name,
                                    label: field.label,
                                    type: field.type,
                                    required: field.required,
                                    order: field.order,
                                    placeholder: field.placeholder || "",
                                    options: field.options,
                                  });
                                  setShowFieldConfig(true);
                                }}
                              >
                                <CogIcon className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteField(section.id, field.id);
                                }}
                              >
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {renderFieldPreview(field)}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Field Configuration Dialog */}
      <Dialog open={showFieldConfig} onOpenChange={setShowFieldConfig}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Field Configuration</DialogTitle>
            <DialogDescription>
              Configure the properties and behavior of this field.
            </DialogDescription>
          </DialogHeader>
          {fieldConfig && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fieldName">Field Name</Label>
                  <Input
                    id="fieldName"
                    value={fieldConfig.name}
                    onChange={(e) =>
                      setFieldConfig((prev) =>
                        prev ? { ...prev, name: e.target.value } : null
                      )
                    }
                    placeholder="field_name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fieldLabel">Field Label</Label>
                  <Input
                    id="fieldLabel"
                    value={fieldConfig.label}
                    onChange={(e) =>
                      setFieldConfig((prev) =>
                        prev ? { ...prev, label: e.target.value } : null
                      )
                    }
                    placeholder="Field Label"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="placeholder">Placeholder Text</Label>
                <Input
                  id="placeholder"
                  value={fieldConfig.placeholder}
                  onChange={(e) =>
                    setFieldConfig((prev) =>
                      prev ? { ...prev, placeholder: e.target.value } : null
                    )
                  }
                  placeholder="Enter placeholder text..."
                />
              </div>
              {fieldConfig.type === "select" && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="space-y-2">
                    {fieldConfig.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(fieldConfig.options || [])];
                            newOptions[index] = e.target.value;
                            setFieldConfig((prev) =>
                              prev ? { ...prev, options: newOptions } : null
                            );
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newOptions = fieldConfig.options?.filter(
                              (_, i) => i !== index
                            );
                            setFieldConfig((prev) =>
                              prev ? { ...prev, options: newOptions } : null
                            );
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOptions = [
                          ...(fieldConfig.options || []),
                          `Option ${(fieldConfig.options?.length || 0) + 1}`,
                        ];
                        setFieldConfig((prev) =>
                          prev ? { ...prev, options: newOptions } : null
                        );
                      }}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Switch
                  id="required"
                  checked={fieldConfig.required}
                  onCheckedChange={(checked) =>
                    setFieldConfig((prev) =>
                      prev ? { ...prev, required: checked } : null
                    )
                  }
                />
                <Label htmlFor="required">Required Field</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFieldConfig(false)}>
              Cancel
            </Button>
            <Button onClick={handleFieldConfigSave}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview how this template will appear to users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label className="text-sm font-medium">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      {renderFieldPreview(field)}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Loading Skeleton Component
function TemplateBuilderSkeleton() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-9 w-16" />
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="w-64 border-r bg-gray-50 p-4">
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
          <Skeleton className="h-9 w-full mt-4" />
        </div>

        {/* Canvas Skeleton */}
        <div className="flex-1 p-6 space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, fieldIndex) => (
                  <div key={fieldIndex} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export type { TemplateBuilderProps };

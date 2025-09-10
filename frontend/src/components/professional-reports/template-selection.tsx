'use client'

import React, { useState, useEffect } from 'react'
import {
  DocumentTextIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  TagIcon,
  EyeIcon,
  StarIcon,
  CalendarIcon,
  UserIcon,
  DocumentDuplicateIcon
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Template, ReportType } from '@/types/professional-reports'

export interface TemplateSelectionProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  onNext: (selectedTemplate: Template) => void
  onPreview: (template: Template) => void
  templates: Template[]
  selectedReportType: ReportType
  isLoading?: boolean
  inspectionId: string
  className?: string
}

export function TemplateSelection({
  isOpen,
  onClose,
  onBack,
  onNext,
  onPreview,
  templates,
  selectedReportType,
  isLoading = false,
  inspectionId,
  className
}: TemplateSelectionProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'complexity' | 'usage'>('name')
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>(templates)

  // Filter and sort templates
  useEffect(() => {
    let filtered = templates

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'complexity':
          // Assume we have a complexity calculation
          const aComplexity = calculateComplexity(a)
          const bComplexity = calculateComplexity(b)
          return aComplexity - bComplexity
        case 'usage':
          // Sort by most used (would need usage data from API)
          return 0
        default:
          return 0
      }
    })

    setFilteredTemplates(filtered)
  }, [searchQuery, sortBy, templates])

  // Reset selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate(null)
      setSearchQuery('')
      setSortBy('name')
    }
  }, [isOpen])

  // Calculate template complexity
  const calculateComplexity = (template: Template): number => {
    const sectionCount = template.sections?.length || 0
    const fieldCount = template.sections?.reduce((total, section) => {
      return total + (section.subsections?.reduce((subTotal, subsection) => {
        return subTotal + (subsection.fields?.length || 0)
      }, 0) || 0)
    }, 0) || 0
    
    return sectionCount + fieldCount
  }

  // Get complexity level
  const getComplexityLevel = (template: Template): 'Simple' | 'Moderate' | 'Complex' => {
    const complexity = calculateComplexity(template)
    if (complexity < 10) return 'Simple'
    if (complexity < 25) return 'Moderate'
    return 'Complex'
  }

  // Get complexity color
  const getComplexityColor = (level: string) => {
    switch (level) {
      case 'Simple':
        return 'bg-green-100 text-green-800'
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800'
      case 'Complex':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Estimate completion time
  const estimateCompletionTime = (template: Template): string => {
    const complexity = calculateComplexity(template)
    const minutes = Math.max(10, complexity * 2) // 2 minutes per field/section, minimum 10 minutes
    
    if (minutes < 60) {
      return `${minutes} min`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
    }
  }

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
  }

  const handleNext = () => {
    if (selectedTemplate && !isLoading) {
      onNext(selectedTemplate)
    }
  }

  const handleBack = () => {
    if (!isLoading) {
      onBack()
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  const handlePreview = (template: Template) => {
    onPreview(template)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn('max-w-6xl max-h-[90vh]', className)}>
        <DialogHeader>
          <DialogTitle className=\"flex items-center space-x-2\">
            <DocumentTextIcon className=\"h-5 w-5 text-primary\" />
            <span>Select Report Template</span>
          </DialogTitle>
          <DialogDescription>
            Choose a template for your <strong>{selectedReportType.name}</strong> report.
          </DialogDescription>
        </DialogHeader>

        <div className=\"space-y-4\">
          {/* Search and Filter Bar */}
          <div className=\"flex items-center space-x-4\">
            <div className=\"flex-1 relative\">
              <MagnifyingGlassIcon className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground\" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder=\"Search templates...\"
                className=\"pl-10\"
              />
            </div>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className=\"w-48\">
                <SelectValue placeholder=\"Sort by\" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=\"name\">Name (A-Z)</SelectItem>
                <SelectItem value=\"updated\">Recently Updated</SelectItem>
                <SelectItem value=\"complexity\">Complexity</SelectItem>
                <SelectItem value=\"usage\">Most Used</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className=\"flex items-center justify-center py-8\">
              <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-primary\" />
              <span className=\"ml-2 text-muted-foreground\">Loading templates...</span>
            </div>
          )}

          {/* No Results */}
          {!isLoading && filteredTemplates.length === 0 && (
            <Alert>
              <InformationCircleIcon className=\"h-4 w-4\" />
              <AlertDescription>
                {searchQuery ? 
                  `No templates found matching \"${searchQuery}\". Try a different search term.` :
                  `No templates are available for ${selectedReportType.name} reports.`
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Templates Grid */}
          {!isLoading && filteredTemplates.length > 0 && (
            <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-4 h-[500px]\">
              {/* Templates List */}
              <div className=\"space-y-2\">
                <div className=\"flex items-center justify-between mb-3\">
                  <h3 className=\"font-medium text-sm\">
                    Available Templates ({filteredTemplates.length})
                  </h3>
                </div>
                <ScrollArea className=\"h-[460px] pr-4\">
                  <div className=\"space-y-2\">
                    {filteredTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        isSelected={selectedTemplate?.id === template.id}
                        onSelect={() => handleTemplateSelect(template)}
                        onPreview={() => handlePreview(template)}
                        complexityLevel={getComplexityLevel(template)}
                        estimatedTime={estimateCompletionTime(template)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Template Details */}
              <div className=\"border-l pl-4\">
                {selectedTemplate ? (
                  <TemplateDetails
                    template={selectedTemplate}
                    complexityLevel={getComplexityLevel(selectedTemplate)}
                    estimatedTime={estimateCompletionTime(selectedTemplate)}
                    onPreview={() => handlePreview(selectedTemplate)}
                  />
                ) : (
                  <div className=\"flex items-center justify-center h-full text-center\">
                    <div className=\"text-muted-foreground\">
                      <DocumentTextIcon className=\"h-12 w-12 mx-auto mb-4 opacity-50\" />
                      <p className=\"text-sm\">Select a template to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className=\"flex items-center justify-between\">
          <div className=\"flex items-center space-x-2 text-sm text-muted-foreground\">
            {selectedTemplate ? (
              <div className=\"flex items-center space-x-1 text-green-600\">
                <CheckCircleIcon className=\"h-4 w-4\" />
                <span>Template selected</span>
              </div>
            ) : (
              <div className=\"flex items-center space-x-1\">
                <InformationCircleIcon className=\"h-4 w-4\" />
                <span>Select a template to continue</span>
              </div>
            )}
          </div>

          <div className=\"flex items-center space-x-2\">
            <Button
              variant=\"outline\"
              onClick={handleBack}
              disabled={isLoading}
              className=\"flex items-center space-x-1\"
            >
              <ChevronLeftIcon className=\"h-4 w-4\" />
              <span>Back</span>
            </Button>
            <Button
              onClick={handleNext}
              disabled={isLoading || !selectedTemplate}
              className=\"flex items-center space-x-1\"
            >
              <span>Create Report</span>
              <ChevronRightIcon className=\"h-4 w-4\" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Individual template card component
interface TemplateCardProps {
  template: Template
  isSelected: boolean
  onSelect: () => void
  onPreview: () => void
  complexityLevel: string
  estimatedTime: string
}

function TemplateCard({ 
  template, 
  isSelected, 
  onSelect, 
  onPreview, 
  complexityLevel, 
  estimatedTime 
}: TemplateCardProps) {
  const getComplexityColor = (level: string) => {
    switch (level) {
      case 'Simple':
        return 'bg-green-100 text-green-800'
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800'
      case 'Complex':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        isSelected && 'ring-2 ring-primary ring-offset-2 bg-primary/5'
      )}
      onClick={onSelect}
    >
      <CardContent className=\"p-4\">
        <div className=\"space-y-3\">
          {/* Header */}
          <div className=\"flex items-start justify-between\">
            <div className=\"flex-1 min-w-0\">
              <h3 className=\"font-medium text-sm mb-1 line-clamp-1\">{template.name}</h3>
              <p className=\"text-xs text-muted-foreground line-clamp-2\">
                {template.description}
              </p>
            </div>
            {isSelected && (
              <CheckCircleIcon className=\"h-4 w-4 text-primary flex-shrink-0 ml-2\" />
            )}
          </div>

          {/* Badges */}
          <div className=\"flex items-center space-x-2\">
            <Badge className={cn('text-xs', getComplexityColor(complexityLevel))}>
              {complexityLevel}
            </Badge>
            <Badge variant=\"secondary\" className=\"text-xs\">
              v{template.version}
            </Badge>
          </div>

          {/* Stats */}
          <div className=\"flex items-center justify-between text-xs text-muted-foreground\">
            <div className=\"flex items-center space-x-3\">
              <div className=\"flex items-center space-x-1\">
                <ClockIcon className=\"h-3 w-3\" />
                <span>{estimatedTime}</span>
              </div>
              <div className=\"flex items-center space-x-1\">
                <DocumentDuplicateIcon className=\"h-3 w-3\" />
                <span>{template.sections?.length || 0} sections</span>
              </div>
            </div>
            <Button
              variant=\"ghost\"
              size=\"sm\"
              onClick={(e) => {
                e.stopPropagation()
                onPreview()
              }}
              className=\"h-6 px-2 text-xs\"
            >
              <EyeIcon className=\"h-3 w-3 mr-1\" />
              Preview
            </Button>
          </div>

          {/* Last updated */}
          <div className=\"flex items-center space-x-1 text-xs text-muted-foreground\">
            <CalendarIcon className=\"h-3 w-3\" />
            <span>Updated {formatDate(template.updatedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Template details component
interface TemplateDetailsProps {
  template: Template
  complexityLevel: string
  estimatedTime: string
  onPreview: () => void
}

function TemplateDetails({ template, complexityLevel, estimatedTime, onPreview }: TemplateDetailsProps) {
  const getComplexityColor = (level: string) => {
    switch (level) {
      case 'Simple':
        return 'bg-green-100 text-green-800'
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800'
      case 'Complex':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const totalFields = template.sections?.reduce((total, section) => {
    return total + (section.subsections?.reduce((subTotal, subsection) => {
      return subTotal + (subsection.fields?.length || 0)
    }, 0) || 0)
  }, 0) || 0

  const autoFields = template.sections?.reduce((total, section) => {
    return total + (section.subsections?.reduce((subTotal, subsection) => {
      return subTotal + (subsection.fields?.filter(field => field.valueSource === 'AUTO').length || 0)
    }, 0) || 0)
  }, 0) || 0

  return (
    <div className=\"space-y-4 h-[460px] overflow-y-auto\">
      {/* Header */}
      <div className=\"space-y-2\">
        <h3 className=\"font-semibold text-lg\">{template.name}</h3>
        <p className=\"text-sm text-muted-foreground\">{template.description}</p>
      </div>

      <Separator />

      {/* Quick Stats */}
      <div className=\"grid grid-cols-2 gap-4\">
        <div className=\"space-y-2\">
          <div className=\"flex items-center space-x-2\">
            <Badge className={cn('text-xs', getComplexityColor(complexityLevel))}>
              {complexityLevel}
            </Badge>
            <Badge variant=\"secondary\" className=\"text-xs\">
              v{template.version}
            </Badge>
          </div>
          <div className=\"text-sm space-y-1\">
            <div className=\"flex items-center space-x-2\">
              <ClockIcon className=\"h-4 w-4 text-muted-foreground\" />
              <span>Est. {estimatedTime}</span>
            </div>
            <div className=\"flex items-center space-x-2\">
              <DocumentDuplicateIcon className=\"h-4 w-4 text-muted-foreground\" />
              <span>{template.sections?.length || 0} sections</span>
            </div>
          </div>
        </div>
        <div className=\"text-sm space-y-1\">
          <div className=\"flex items-center space-x-2\">
            <TagIcon className=\"h-4 w-4 text-muted-foreground\" />
            <span>{totalFields} total fields</span>
          </div>
          <div className=\"flex items-center space-x-2\">
            <StarIcon className=\"h-4 w-4 text-muted-foreground\" />
            <span>{autoFields} auto-filled</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Template Structure */}
      <div className=\"space-y-3\">
        <div className=\"flex items-center justify-between\">
          <h4 className=\"font-medium text-sm\">Template Structure</h4>
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={onPreview}
            className=\"h-7 text-xs\"
          >
            <EyeIcon className=\"h-3 w-3 mr-1\" />
            Preview
          </Button>
        </div>
        
        <ScrollArea className=\"h-48\">
          <div className=\"space-y-2\">
            {template.sections?.map((section, index) => (
              <div key={section.id} className=\"text-sm\">
                <div className=\"font-medium text-gray-900\">
                  {index + 1}. {section.title}
                </div>
                {section.subsections?.map((subsection, subIndex) => (
                  <div key={subsection.id} className=\"ml-4 text-muted-foreground\">
                    {index + 1}.{subIndex + 1} {subsection.title}
                    <span className=\"ml-2 text-xs\">
                      ({subsection.fields?.length || 0} fields)
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Metadata */}
      <div className=\"space-y-2 text-sm text-muted-foreground\">
        <div className=\"flex items-center space-x-2\">
          <CalendarIcon className=\"h-4 w-4\" />
          <span>Created: {formatDate(template.createdAt)}</span>
        </div>
        <div className=\"flex items-center space-x-2\">
          <CalendarIcon className=\"h-4 w-4\" />
          <span>Updated: {formatDate(template.updatedAt)}</span>
        </div>
        {template.createdBy && (
          <div className=\"flex items-center space-x-2\">
            <UserIcon className=\"h-4 w-4\" />
            <span>Created by: {template.createdBy}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Hook for managing template selection state
export function useTemplateSelection() {
  const [isOpen, setIsOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  const showSelection = (reportType: ReportType, availableTemplates: Template[]) => {
    setSelectedReportType(reportType)
    setTemplates(availableTemplates)
    setIsOpen(true)
    setSelectedTemplate(null)
  }

  const hideSelection = () => {
    setIsOpen(false)
    setTemplates([])
    setSelectedReportType(null)
    setSelectedTemplate(null)
    setIsLoading(false)
  }

  const setLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template)
  }

  return {
    isOpen,
    templates,
    selectedReportType,
    isLoading,
    selectedTemplate,
    showSelection,
    hideSelection,
    setLoading,
    selectTemplate
  }
}

export type { TemplateSelectionProps }
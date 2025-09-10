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
  TagIcon
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
import { ReportType } from '@/types/professional-reports'

export interface ReportTypeSelectionProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  onNext: (selectedType: ReportType) => void
  reportTypes: ReportType[]
  isLoading?: boolean
  inspectionId: string
  className?: string
}

export function ReportTypeSelection({
  isOpen,
  onClose,
  onBack,
  onNext,
  reportTypes,
  isLoading = false,
  inspectionId,
  className
}: ReportTypeSelectionProps) {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTypes, setFilteredTypes] = useState<ReportType[]>(reportTypes)

  // Filter report types based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTypes(reportTypes)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = reportTypes.filter(type =>
        type.name.toLowerCase().includes(query) ||
        type.description.toLowerCase().includes(query) ||
        type.category.toLowerCase().includes(query)
      )
      setFilteredTypes(filtered)
    }
  }, [searchQuery, reportTypes])

  // Reset selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedType(null)
      setSearchQuery('')
    }
  }, [isOpen])

  // Group report types by category
  const groupedTypes = filteredTypes.reduce((groups, type) => {
    const category = type.category || 'Other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(type)
    return groups
  }, {} as Record<string, ReportType[]>)

  const handleTypeSelect = (type: ReportType) => {
    setSelectedType(type)
  }

  const handleNext = () => {
    if (selectedType && !isLoading) {
      onNext(selectedType)
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

  // Get type icon based on category or name
  const getTypeIcon = (type: ReportType) => {
    if (type.icon) return type.icon
    
    // Default icons based on category
    switch (type.category.toLowerCase()) {
      case 'equipment':
        return '⚙️'
      case 'safety':
        return '🛡️'
      case 'quality':
        return '✅'
      case 'environmental':
        return '🌱'
      case 'maintenance':
        return '🔧'
      default:
        return '📋'
    }
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'equipment':
        return 'bg-blue-100 text-blue-800'
      case 'safety':
        return 'bg-red-100 text-red-800'
      case 'quality':
        return 'bg-green-100 text-green-800'
      case 'environmental':
        return 'bg-emerald-100 text-emerald-800'
      case 'maintenance':
        return 'bg-orange-100 text-orange-800'
      case 'compliance':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn('max-w-4xl max-h-[90vh]', className)}>
        <DialogHeader>
          <DialogTitle className=\"flex items-center space-x-2\">
            <DocumentTextIcon className=\"h-5 w-5 text-primary\" />
            <span>Select Report Type</span>
          </DialogTitle>
          <DialogDescription>
            Choose the type of professional report you want to create for this inspection.
          </DialogDescription>
        </DialogHeader>

        <div className=\"space-y-4\">
          {/* Search Bar */}
          <div className=\"relative\">
            <MagnifyingGlassIcon className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground\" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder=\"Search report types...\"
              className=\"pl-10\"
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className=\"flex items-center justify-center py-8\">
              <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-primary\" />
              <span className=\"ml-2 text-muted-foreground\">Loading report types...</span>
            </div>
          )}

          {/* No Results */}
          {!isLoading && filteredTypes.length === 0 && (
            <Alert>
              <InformationCircleIcon className=\"h-4 w-4\" />
              <AlertDescription>
                {searchQuery ? 
                  `No report types found matching "${searchQuery}". Try a different search term.` :
                  'No report types are available for this inspection.'
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Report Types Grid */}
          {!isLoading && filteredTypes.length > 0 && (
            <ScrollArea className=\"h-[500px] pr-4\">
              <div className=\"space-y-6\">
                {Object.entries(groupedTypes).map(([category, types]) => (
                  <div key={category} className=\"space-y-3\">
                    {/* Category Header */}
                    <div className=\"flex items-center space-x-2\">
                      <Badge className={cn('text-sm', getCategoryColor(category))}>
                        {category}
                      </Badge>
                      <span className=\"text-sm text-muted-foreground\">
                        {types.length} {types.length === 1 ? 'type' : 'types'}
                      </span>
                    </div>

                    {/* Types Grid */}
                    <div className=\"grid grid-cols-1 md:grid-cols-2 gap-3\">
                      {types.map((type) => (
                        <ReportTypeCard
                          key={type.id}
                          type={type}
                          isSelected={selectedType?.id === type.id}
                          onSelect={() => handleTypeSelect(type)}
                          icon={getTypeIcon(type)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Selected Type Details */}
          {selectedType && (
            <Card className=\"border-primary bg-primary/5\">
              <CardHeader className=\"pb-3\">
                <div className=\"flex items-start justify-between\">
                  <div className=\"flex items-center space-x-3\">
                    <div className=\"text-2xl\">{getTypeIcon(selectedType)}</div>
                    <div>
                      <CardTitle className=\"text-lg\">{selectedType.name}</CardTitle>
                      <CardDescription>{selectedType.description}</CardDescription>
                    </div>
                  </div>
                  <Badge className={cn('text-sm', getCategoryColor(selectedType.category))}>
                    {selectedType.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className=\"pt-0\">
                <div className=\"grid grid-cols-2 gap-4 text-sm\">
                  <div className=\"flex items-center space-x-2\">
                    <TagIcon className=\"h-4 w-4 text-muted-foreground\" />
                    <span className=\"text-muted-foreground\">Templates:</span>
                    <span className=\"font-medium\">{selectedType.templates.length} available</span>
                  </div>
                  <div className=\"flex items-center space-x-2\">
                    <ClockIcon className=\"h-4 w-4 text-muted-foreground\" />
                    <span className=\"text-muted-foreground\">Est. Time:</span>
                    <span className=\"font-medium\">15-30 minutes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className=\"flex items-center justify-between\">
          <div className=\"flex items-center space-x-2 text-sm text-muted-foreground\">
            {selectedType ? (
              <div className=\"flex items-center space-x-1 text-green-600\">
                <CheckCircleIcon className=\"h-4 w-4\" />
                <span>Report type selected</span>
              </div>
            ) : (
              <div className=\"flex items-center space-x-1\">
                <InformationCircleIcon className=\"h-4 w-4\" />
                <span>Select a report type to continue</span>
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
              disabled={isLoading || !selectedType}
              className=\"flex items-center space-x-1\"
            >
              <span>Next</span>
              <ChevronRightIcon className=\"h-4 w-4\" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Individual report type card component
interface ReportTypeCardProps {
  type: ReportType
  isSelected: boolean
  onSelect: () => void
  icon: string
}

function ReportTypeCard({ type, isSelected, onSelect, icon }: ReportTypeCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        isSelected && 'ring-2 ring-primary ring-offset-2 bg-primary/5'
      )}
      onClick={onSelect}
    >
      <CardContent className=\"p-4\">
        <div className=\"flex items-start space-x-3\">
          <div className=\"text-xl flex-shrink-0\">{icon}</div>
          <div className=\"flex-1 min-w-0\">
            <h3 className=\"font-medium text-sm mb-1 line-clamp-1\">{type.name}</h3>
            <p className=\"text-xs text-muted-foreground line-clamp-2 mb-2\">
              {type.description}
            </p>
            <div className=\"flex items-center justify-between\">
              <span className=\"text-xs text-muted-foreground\">
                {type.templates.length} templates
              </span>
              {isSelected && (
                <CheckCircleIcon className=\"h-4 w-4 text-primary\" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for managing report type selection state
export function useReportTypeSelection() {
  const [isOpen, setIsOpen] = useState(false)
  const [reportTypes, setReportTypes] = useState<ReportType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<ReportType | null>(null)

  const showSelection = (types: ReportType[]) => {
    setReportTypes(types)
    setIsOpen(true)
    setSelectedType(null)
  }

  const hideSelection = () => {
    setIsOpen(false)
    setReportTypes([])
    setSelectedType(null)
    setIsLoading(false)
  }

  const setLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  const selectType = (type: ReportType) => {
    setSelectedType(type)
  }

  return {
    isOpen,
    reportTypes,
    isLoading,
    selectedType,
    showSelection,
    hideSelection,
    setLoading,
    selectType
  }
}

export type { ReportTypeSelectionProps }
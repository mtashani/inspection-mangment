'use client'

import { XCircle, AlertTriangle, Info, CheckCircle, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface ValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    severity: 'error' | 'warning' | 'info'
  }>
  warnings: Array<{
    field: string
    message: string
  }>
  suggestions: Array<{
    field: string
    message: string
    action?: string
  }>
}

interface TemplateValidationReportProps {
  validationResult: ValidationResult
}

export function TemplateValidationReport({ validationResult }: TemplateValidationReportProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    errors: true,
    warnings: false,
    suggestions: false
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getFieldDisplayName = (field: string) => {
    // Convert field paths to readable names
    if (field === 'name') return 'Template Name'
    if (field === 'description') return 'Template Description'
    if (field === 'sections') return 'Template Sections'
    if (field === 'structure') return 'Template Structure'
    
    // Handle nested field paths
    if (field.includes('sections.')) {
      const parts = field.split('.')
      if (parts.length >= 3) {
        const sectionIndex = parseInt(parts[1])
        const fieldType = parts[2]
        
        if (fieldType === 'title') {
          return `Section ${sectionIndex + 1} Title`
        } else if (fieldType === 'fields') {
          return `Section ${sectionIndex + 1} Fields`
        } else if (parts.length >= 5 && parts[2] === 'fields') {
          const fieldIndex = parseInt(parts[3])
          const fieldProperty = parts[4]
          return `Section ${sectionIndex + 1}, Field ${fieldIndex + 1} ${fieldProperty}`
        }
      }
    }
    
    return field
  }

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getSeverityColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'info':
        return 'text-blue-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {validationResult.isValid ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            Validation Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {validationResult.isValid ? 'PASS' : 'FAIL'}
              </div>
              <div className="text-xs text-muted-foreground">Overall Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {validationResult.errors.length}
              </div>
              <div className="text-xs text-muted-foreground">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {validationResult.warnings.length}
              </div>
              <div className="text-xs text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {validationResult.suggestions.length}
              </div>
              <div className="text-xs text-muted-foreground">Suggestions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Errors Section */}
      {validationResult.errors.length > 0 && (
        <Card>
          <Collapsible
            open={expandedSections.errors}
            onOpenChange={() => toggleSection('errors')}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    Errors
                    <Badge variant="destructive">{validationResult.errors.length}</Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    {expandedSections.errors ? 'Collapse' : 'Expand'}
                  </Button>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {validationResult.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      {getSeverityIcon(error.severity)}
                      <AlertDescription>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {getFieldDisplayName(error.field)}
                          </div>
                          <div className="text-sm">
                            {error.message}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Warnings Section */}
      {validationResult.warnings.length > 0 && (
        <Card>
          <Collapsible
            open={expandedSections.warnings}
            onOpenChange={() => toggleSection('warnings')}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    Warnings
                    <Badge variant="secondary">{validationResult.warnings.length}</Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    {expandedSections.warnings ? 'Collapse' : 'Expand'}
                  </Button>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {validationResult.warnings.map((warning, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {getFieldDisplayName(warning.field)}
                          </div>
                          <div className="text-sm">
                            {warning.message}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Suggestions Section */}
      {validationResult.suggestions.length > 0 && (
        <Card>
          <Collapsible
            open={expandedSections.suggestions}
            onOpenChange={() => toggleSection('suggestions')}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                    Suggestions
                    <Badge variant="outline">{validationResult.suggestions.length}</Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    {expandedSections.suggestions ? 'Collapse' : 'Expand'}
                  </Button>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {validationResult.suggestions.map((suggestion, index) => (
                    <Alert key={index}>
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div>
                            <div className="font-medium">
                              {getFieldDisplayName(suggestion.field)}
                            </div>
                            <div className="text-sm">
                              {suggestion.message}
                            </div>
                          </div>
                          {suggestion.action && (
                            <Button variant="outline" size="sm">
                              {suggestion.action}
                            </Button>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* No Issues */}
      {validationResult.isValid && 
       validationResult.errors.length === 0 && 
       validationResult.warnings.length === 0 && 
       validationResult.suggestions.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-4" />
              <h3 className="text-lg font-medium text-green-600 mb-2">
                Perfect Template!
              </h3>
              <p className="text-sm text-muted-foreground">
                Your template passed all validation checks with no issues found.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
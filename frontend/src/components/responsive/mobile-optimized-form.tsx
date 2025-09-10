'use client'

import { useState, useEffect } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

export interface MobileOptimizedFormProps {
  children: React.ReactNode
  title?: string
  description?: string
  sections?: FormSection[]
  currentSection?: number
  onSectionChange?: (section: number) => void
  onSubmit?: () => void
  onCancel?: () => void
  isSubmitting?: boolean
  showProgress?: boolean
  className?: string
}

export interface FormSection {
  id: string
  title: string
  description?: string
  isCompleted?: boolean
  hasErrors?: boolean
  isRequired?: boolean
}

export function MobileOptimizedForm({
  children,
  title,
  description,
  sections = [],
  currentSection = 0,
  onSectionChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  showProgress = true,
  className
}: MobileOptimizedFormProps) {
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Calculate progress
  const completedSections = sections.filter(section => section.isCompleted).length
  const progressPercentage = sections.length > 0 ? (completedSections / sections.length) * 100 : 0

  // Navigation handlers
  const handlePrevious = () => {
    if (currentSection > 0) {
      onSectionChange?.(currentSection - 1)
    }
  }

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      onSectionChange?.(currentSection + 1)
    }
  }

  const canGoNext = currentSection < sections.length - 1
  const canGoPrevious = currentSection > 0
  const isLastSection = currentSection === sections.length - 1

  // Get current section info
  const currentSectionInfo = sections[currentSection]

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      {(title || description) && (
        <div className="text-center md:text-left">
          {title && (
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          )}
          {description && (
            <p className="text-gray-600">{description}</p>
          )}
        </div>
      )}

      {/* Progress Indicator */}
      {showProgress && sections.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Progress Bar */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progressPercentage)}% Complete</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              
              {/* Section Indicators - Desktop */}
              <div className="hidden md:flex items-center justify-between">
                {sections.map((section, index) => (
                  <div
                    key={section.id}
                    className={cn(
                      'flex items-center space-x-2 cursor-pointer transition-colors',
                      index === currentSection && 'text-primary',
                      section.isCompleted && 'text-green-600',
                      section.hasErrors && 'text-red-600'
                    )}
                    onClick={() => onSectionChange?.(index)}
                  >
                    <div className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium',
                      index === currentSection && 'border-primary bg-primary text-white',
                      section.isCompleted && 'border-green-600 bg-green-600 text-white',
                      section.hasErrors && 'border-red-600 bg-red-600 text-white',
                      !section.isCompleted && !section.hasErrors && index !== currentSection && 'border-gray-300'
                    )}>
                      {section.isCompleted ? (
                        <CheckCircleIcon className="h-3 w-3" />
                      ) : section.hasErrors ? (
                        <ExclamationTriangleIcon className="h-3 w-3" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className="text-sm font-medium hidden lg:block">
                      {section.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Current Section Info - Mobile */}
              {isMobile && currentSectionInfo && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{currentSectionInfo.title}</div>
                    {currentSectionInfo.description && (
                      <div className="text-sm text-muted-foreground">
                        {currentSectionInfo.description}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline">
                    {currentSection + 1} of {sections.length}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Validation Alerts */}
      {currentSectionInfo?.hasErrors && (
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            Please fix the errors in this section before continuing.
          </AlertDescription>
        </Alert>
      )}

      {/* Form Content */}
      <Card>
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {canGoPrevious && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isSubmitting}
            >
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {canGoNext ? (
            <Button
              onClick={handleNext}
              disabled={isSubmitting || currentSectionInfo?.hasErrors}
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={isSubmitting || sections.some(s => s.hasErrors)}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </div>
              ) : (
                'Submit'
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile-specific bottom navigation */}
      {isMobile && sections.length > 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-pb">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={!canGoPrevious || isSubmitting}
              className="flex-1 mr-2"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="px-4 text-sm text-muted-foreground">
              {currentSection + 1} / {sections.length}
            </div>
            
            {canGoNext ? (
              <Button
                size="sm"
                onClick={handleNext}
                disabled={isSubmitting || currentSectionInfo?.hasErrors}
                className="flex-1 ml-2"
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onSubmit}
                disabled={isSubmitting || sections.some(s => s.hasErrors)}
                className="flex-1 ml-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Form Field Wrapper for consistent mobile styling
export interface MobileFormFieldProps {
  label: string
  description?: string
  required?: boolean
  error?: string
  children: React.ReactNode
  className?: string
}

export function MobileFormField({
  label,
  description,
  required = false,
  error,
  children,
  className
}: MobileFormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="space-y-1">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <ExclamationTriangleIcon className="h-3 w-3" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

export type { MobileOptimizedFormProps, FormSection, MobileFormFieldProps }
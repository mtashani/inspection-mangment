'use client'

// Edit Daily Report Modal Component
// Modal for editing existing daily reports

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarIcon, Save, X } from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'

// Helper function for safe date formatting
function safeFormatDate(dateString: string | undefined, formatStr: string = 'MMM dd, yyyy'): string {
  if (!dateString) return 'N/A'
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
    if (!isValid(date)) return 'Invalid Date'
    return format(date, formatStr)
  } catch (error) {
    console.warn('Date formatting error:', error, 'for date:', dateString)
    return 'Invalid Date'
  }
}

import {
  UpdateDailyReportRequest,
  EditReportModalProps,
  DailyReport
} from '@/types/daily-reports'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useDailyReport, useInspectorNames } from '@/hooks/use-daily-reports'

// Form validation schema
const editReportSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
  inspectorIds: z.array(z.number()).min(1, 'At least one inspector must be selected'),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  weatherConditions: z.string().optional(),
  safetyNotes: z.string().optional(),
})

type EditReportFormData = z.infer<typeof editReportSchema>

/**
 * Edit Daily Report Modal Component
 * 
 * Provides a form interface for editing existing daily reports with:
 * - Pre-populated form data
 * - Inspector selection (multi-select)
 * - Description and findings editing
 * - Weather conditions and safety notes
 * - Form validation with Zod
 */
export function EditReportModal({
  isOpen,
  onClose,
  reportId,
  onSubmit
}: EditReportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedInspectors, setSelectedInspectors] = useState<Array<{ id: number; name: string }>>([])
  
  // Fetch report data and available inspectors
  const { data: reportData, isLoading: reportLoading, error: reportError } = useDailyReport(reportId)
  const { data: inspectorNames = [] } = useInspectorNames()

  // Form setup
  const form = useForm<EditReportFormData>({
    resolver: zodResolver(editReportSchema),
    defaultValues: {
      description: '',
      inspectorIds: [],
      findings: '',
      recommendations: '',
      weatherConditions: '',
      safetyNotes: '',
    },
  })

  // Populate form when report data is loaded
  useEffect(() => {
    if (reportData && isOpen) {
      form.reset({
        description: reportData.description || '',
        inspectorIds: reportData.inspectorIds || [],
        findings: reportData.findings || '',
        recommendations: reportData.recommendations || '',
        weatherConditions: reportData.weatherConditions || '',
        safetyNotes: reportData.safetyNotes || '',
      })

      // Set selected inspectors
      if (reportData.inspectorNames) {
        const inspectorNamesList = reportData.inspectorNames.split(',').map(name => name.trim())
        const inspectors = inspectorNamesList.map((name, index) => ({
          id: reportData.inspectorIds?.[index] || index + 1,
          name
        }))
        setSelectedInspectors(inspectors)
      }
    }
  }, [reportData, isOpen, form])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedInspectors([])
    }
  }, [isOpen])

  // Handle form submission
  const handleSubmit = async (data: EditReportFormData) => {
    setIsSubmitting(true)
    
    try {
      const updateData: UpdateDailyReportRequest = {
        description: data.description,
        inspectorIds: data.inspectorIds,
        findings: data.findings || undefined,
        recommendations: data.recommendations || undefined,
        weatherConditions: data.weatherConditions || undefined,
        safetyNotes: data.safetyNotes || undefined,
      }

      await onSubmit?.(reportId, updateData)
      onClose()
    } catch (error) {
      console.error('Failed to update report:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle inspector selection
  const handleInspectorAdd = (inspectorName: string) => {
    // Generate a mock ID for the inspector (in real app, this would come from API)
    const inspectorId = inspectorNames.indexOf(inspectorName) + 1
    
    if (!selectedInspectors.find(i => i.name === inspectorName)) {
      const newInspectors = [...selectedInspectors, { id: inspectorId, name: inspectorName }]
      setSelectedInspectors(newInspectors)
      form.setValue('inspectorIds', newInspectors.map(i => i.id))
    }
  }

  const handleInspectorRemove = (inspectorName: string) => {
    const newInspectors = selectedInspectors.filter(i => i.name !== inspectorName)
    setSelectedInspectors(newInspectors)
    form.setValue('inspectorIds', newInspectors.map(i => i.id))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Daily Report</DialogTitle>
          <DialogDescription>
            Modify the daily report details and content.
          </DialogDescription>
        </DialogHeader>

        {reportLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : reportError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load report data. Please try again.
            </AlertDescription>
          </Alert>
        ) : reportData ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Report Information */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">Report Information</h3>
                    <Badge variant="outline">
                      {safeFormatDate(reportData.reportDate)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Report ID:</span>
                      <span className="ml-2 font-medium">{reportData.id}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <span className="ml-2 font-medium">
                        {safeFormatDate(reportData.createdAt, 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                  </div>

                  {/* Weather Conditions */}
                  <FormField
                    control={form.control}
                    name="weatherConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weather Conditions</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select weather conditions" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Not specified</SelectItem>
                            <SelectItem value="clear">Clear</SelectItem>
                            <SelectItem value="cloudy">Cloudy</SelectItem>
                            <SelectItem value="rainy">Rainy</SelectItem>
                            <SelectItem value="windy">Windy</SelectItem>
                            <SelectItem value="hot">Hot</SelectItem>
                            <SelectItem value="cold">Cold</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Inspector Selection */}
                  <div className="space-y-3">
                    <FormLabel>Inspectors</FormLabel>
                    
                    {/* Selected Inspectors */}
                    {selectedInspectors.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedInspectors.map((inspector) => (
                          <Badge
                            key={inspector.name}
                            variant="secondary"
                            className="flex items-center space-x-1"
                          >
                            <span>{inspector.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleInspectorRemove(inspector.name)}
                              className="h-4 w-4 p-0 hover:bg-transparent"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Inspector Selection */}
                    <Select onValueChange={handleInspectorAdd}>
                      <SelectTrigger>
                        <SelectValue placeholder="Add inspector" />
                      </SelectTrigger>
                      <SelectContent>
                        {inspectorNames
                          .filter(name => !selectedInspectors.find(i => i.name === name))
                          .map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    
                    {form.formState.errors.inspectorIds && (
                      <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.inspectorIds.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Report Content */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-medium text-sm">Report Content</h3>
                  
                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the work performed, observations, and activities..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed description of the inspection activities and observations.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Findings */}
                  <FormField
                    control={form.control}
                    name="findings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Findings</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Document any findings, issues, or anomalies discovered..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Record any significant findings or issues identified during the inspection.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Recommendations */}
                  <FormField
                    control={form.control}
                    name="recommendations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recommendations</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide recommendations for follow-up actions..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Suggest any recommended actions or follow-up activities.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Safety Notes */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-medium text-sm">Safety & Additional Notes</h3>
                  
                  <FormField
                    control={form.control}
                    name="safetyNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Safety Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Document any safety observations, incidents, or precautions..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Record any safety-related observations or incidents.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[100px]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </div>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
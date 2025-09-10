'use client'

import React, { useState, useEffect } from 'react'
import { Plus, X, Calendar, Wrench, AlertTriangle, CheckCircle2, Settings2, Target, Clock, User } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { MaintenanceEventType, MaintenanceEventStatus, RefineryDepartment, MaintenanceEventCategory } from '@/types/maintenance-events'
import { useInspectors, useCreateMaintenanceEvent } from '@/hooks/use-daily-reports'

interface Inspector {
  id: number
  name: string
  employee_id: string
  inspector_type: string
}

export interface CreateEventModalProps {
  trigger?: React.ReactNode
  onEventCreated?: () => void
}

interface CreateEventFormData {
  event_number: string
  title: string
  description?: string
  event_type: MaintenanceEventType
  event_category: MaintenanceEventCategory
  planned_start_date: string
  planned_end_date: string
  created_by?: string
  notes?: string
  requesting_department?: RefineryDepartment
}

const eventTypeOptions = [
  { 
    value: MaintenanceEventType.Routine, 
    label: '🔧 Routine', 
    icon: Clock, 
    color: 'bg-blue-500',
    description: 'Regular scheduled maintenance'
  },
  { 
    value: MaintenanceEventType.Overhaul, 
    label: '⚙️ Overhaul', 
    icon: Settings2, 
    color: 'bg-purple-500',
    description: 'Complete equipment overhaul'
  },
  { 
    value: MaintenanceEventType.Emergency, 
    label: '🚨 Emergency', 
    icon: AlertTriangle, 
    color: 'bg-red-500',
    description: 'Urgent repair required'
  },
  { 
    value: MaintenanceEventType.Preventive, 
    label: '✅ Preventive', 
    icon: CheckCircle2, 
    color: 'bg-green-500',
    description: 'Prevent future issues'
  },
  { 
    value: MaintenanceEventType.Corrective, 
    label: '🔨 Corrective', 
    icon: Wrench, 
    color: 'bg-orange-500',
    description: 'Fix existing problems'
  },
  { 
    value: MaintenanceEventType.Custom, 
    label: '🎯 Custom', 
    icon: Target, 
    color: 'bg-gray-500',
    description: 'Custom maintenance task'
  }
]

const departmentOptions = Object.values(RefineryDepartment).map(dept => ({
  value: dept,
  label: `🏢 ${dept}`,
  icon: '🏢'
}))

export function CreateEventModal({ trigger, onEventCreated }: CreateEventModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<CreateEventFormData>>({
    event_type: MaintenanceEventType.Routine,
    event_category: MaintenanceEventCategory.Simple
  })
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Fetch available inspectors
  const { data: inspectorData, isLoading: inspectorsLoading } = useInspectors()
  const inspectors = inspectorData?.inspectors || []

  // Generate unique event number with the new format
  const generateUniqueEventNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `EVT-${dateStr}-${randomSuffix}`;
  }

  // Generate event number when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        event_number: generateUniqueEventNumber()
      }))
    }
  }, [isOpen])

  const handleInputChange = (field: keyof CreateEventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      // Convert dates to local date string to avoid timezone issues
      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      
      setFormData(prev => ({
        ...prev,
        planned_start_date: formatLocalDate(range.from!),
        planned_end_date: formatLocalDate(range.to!)
      }))
      
      // Clear date errors
      if (errors.planned_start_date || errors.planned_end_date) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.planned_start_date
          delete newErrors.planned_end_date
          return newErrors
        })
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields validation
    if (!formData.event_number?.trim()) {
      newErrors.event_number = 'Event number is required'
    }
    if (!formData.title?.trim()) {
      newErrors.title = 'Event title is required'
    }
    if (!formData.event_type) {
      newErrors.event_type = 'Event type is required'
    }
    if (!formData.planned_start_date || !formData.planned_end_date) {
      newErrors.dateRange = 'Both start and end dates are required'
    }

    // Date validation
    if (formData.planned_start_date && formData.planned_end_date) {
      const startDate = new Date(formData.planned_start_date)
      const endDate = new Date(formData.planned_end_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (startDate < today) {
        newErrors.planned_start_date = 'Start date cannot be in the past'
      }
      if (endDate < startDate) {
        newErrors.planned_end_date = 'End date must be after start date'
      }
    }

    // Note: We're not validating the event number format since it's auto-generated
    // and we know it will always match our expected format

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Use the mutation hook for creating events
  const createEventMutation = useCreateMaintenanceEvent()

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      // Create the event data in the format expected by the API
      const eventData = {
        event_number: formData.event_number!,
        title: formData.title!,
        description: formData.description,
        event_type: formData.event_type!,
        event_category: formData.event_category!,
        planned_start_date: formData.planned_start_date!,
        planned_end_date: formData.planned_end_date!,
        created_by: formData.created_by,
        notes: formData.notes,
        requesting_department: formData.requesting_department
      }

      console.log('Creating event:', eventData)
      
      // Call the actual API
      await createEventMutation.mutateAsync(eventData)
      
      // Close modal and reset form
      handleClose()
      onEventCreated?.()
      
    } catch (error) {
      console.error('Failed to create event:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create event. Please try again.'
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({ 
      event_type: MaintenanceEventType.Routine,
      event_category: MaintenanceEventCategory.Simple
    })
    setDateRange(undefined)
    setErrors({})
    setIsSubmitting(false)
    setIsOpen(false)
  }

  const selectedEventType = eventTypeOptions.find(option => option.value === formData.event_type)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[90vh] max-h-[85vh] overflow-y-auto scrollbar-hide">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            Create New Maintenance Event
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create a new maintenance event with scheduled timeline and detailed specifications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Alert */}
          {errors.submit && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                📝 Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_number" className="text-sm font-medium">
                    Event Number *
                  </Label>
                  <Input
                    id="event_number"
                    placeholder="Auto-generated"
                    value={formData.event_number || ''}
                    onChange={(e) => handleInputChange('event_number', e.target.value)}
                    className={cn("h-9", errors.event_number && "border-destructive")}
                    readOnly // Auto-generated
                  />
                  {errors.event_number && (
                    <p className="text-sm text-destructive">{errors.event_number}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Event Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter event title"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={cn("h-9", errors.title && "border-destructive")}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Enter detailed description..."
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Event Configuration */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                ⚙️ Event Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {/* Event Type - Full Width */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Event Type *</Label>
                  <Select 
                    value={formData.event_type || ''} 
                    onValueChange={(value) => handleInputChange('event_type', value)}
                  >
                    <SelectTrigger className={cn("h-9", errors.event_type && "border-destructive")}>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.event_type && (
                    <p className="text-sm text-destructive">{errors.event_type}</p>
                  )}
                </div>

                {/* Event Category - Full Width */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category *</Label>
                  <Select 
                    value={formData.event_category || MaintenanceEventCategory.Simple} 
                    onValueChange={(value) => handleInputChange('event_category', value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MaintenanceEventCategory.Simple}>
                        <span>🔧 Simple</span>
                      </SelectItem>
                      <SelectItem value={MaintenanceEventCategory.Complex}>
                        <span>⚙️ Complex</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Department and Created By - 2 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Department</Label>
                    <Select 
                      value={formData.requesting_department || ''} 
                      onValueChange={(value) => handleInputChange('requesting_department', value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Created By
                    </Label>
                    <Select 
                      value={formData.created_by || ''} 
                      onValueChange={(value) => handleInputChange('created_by', value)}
                      disabled={inspectorsLoading}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={
                          inspectorsLoading 
                            ? "Loading inspectors..." 
                            : "Select inspector"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {inspectors.length > 0 ? (
                          inspectors.map((inspector: Inspector) => (
                            <SelectItem key={inspector.id} value={inspector.name}>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-col">
                                  <span className="font-medium">{inspector.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {inspector.employee_id} • {inspector.inspector_type}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-inspectors" disabled>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>No inspectors available</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                📅 Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Planned Duration *
                </Label>
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  placeholder="Select date range"
                  className={cn(
                    (errors.dateRange || errors.planned_start_date || errors.planned_end_date) && "border-destructive"
                  )}
                  disablePast={true}
                  modal={true}
                />
                {(errors.dateRange || errors.planned_start_date || errors.planned_end_date) && (
                  <p className="text-sm text-destructive">
                    {errors.dateRange || errors.planned_start_date || errors.planned_end_date}
                  </p>
                )}
              </div>

              {dateRange?.from && dateRange?.to && (
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between text-sm">
                    <div className="space-y-1">
                      <p className="font-medium">Selected Duration:</p>
                      <p className="text-muted-foreground">
                        {dateRange.from.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} 
                        {' → '}
                        {dateRange.to.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} days
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                📋 Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Enter any additional notes..."
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {(formData.title || selectedEventType) && (
            <Card className="border-dashed">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  👁️ Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {selectedEventType && (
                      <selectedEventType.icon className="h-4 w-4" />
                    )}
                    <span className="font-medium">{formData.title || 'Untitled Event'}</span>
                  </div>
                  
                  {formData.event_number && (
                    <p className="text-sm text-muted-foreground">Event #{formData.event_number}</p>
                  )}
                  
                  {selectedEventType && (
                    <p className="text-sm text-muted-foreground">{selectedEventType.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[100px] gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Create Event
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { 
  MaintenanceEvent, 
  MaintenanceEventType, 
  MaintenanceEventCategory, 
  RefineryDepartment,
  UpdateMaintenanceEventRequest 
} from '@/types/maintenance-events'
import { useUpdateMaintenanceEvent } from '@/hooks/use-maintenance-events'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { cn } from '@/lib/utils'
import { 
  Edit, 
  AlertTriangle, 
  CheckCircle2,
  Wrench,
  Calendar,
  Settings
} from 'lucide-react'

interface DateRange {
  from?: Date
  to?: Date
}

interface EditEventFormData {
  title: string
  description?: string
  event_type: MaintenanceEventType
  event_category: MaintenanceEventCategory
  planned_start_date: string
  planned_end_date: string
  notes?: string
}

interface EditEventModalProps {
  trigger?: React.ReactNode
  event: MaintenanceEvent
  onEventUpdated?: () => void
}

const eventTypeOptions = [
  { value: MaintenanceEventType.Routine, label: '🔧 Routine', icon: Wrench },
  { value: MaintenanceEventType.Overhaul, label: '⚙️ Overhaul', icon: Settings },
  { value: MaintenanceEventType.Emergency, label: '🚨 Emergency', icon: AlertTriangle },
  { value: MaintenanceEventType.Preventive, label: '🛡️ Preventive', icon: CheckCircle2 },
  { value: MaintenanceEventType.Corrective, label: '🔨 Corrective', icon: Wrench },
]

export function EditEventModal({ trigger, event, onEventUpdated }: EditEventModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<EditEventFormData>({
    title: event.title,
    description: event.description,
    event_type: event.event_type,
    event_category: event.event_category || MaintenanceEventCategory.Simple,
    planned_start_date: event.planned_start_date,
    planned_end_date: event.planned_end_date,
    notes: event.notes
  })
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(event.planned_start_date),
    to: new Date(event.planned_end_date)
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const updateEventMutation = useUpdateMaintenanceEvent()

  // Reset form data when event changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: event.title,
        description: event.description,
        event_type: event.event_type,
        event_category: event.event_category || MaintenanceEventCategory.Simple,
        planned_start_date: event.planned_start_date,
        planned_end_date: event.planned_end_date,
        notes: event.notes
      })
      setDateRange({
        from: new Date(event.planned_start_date),
        to: new Date(event.planned_end_date)
      })
      setErrors({})
    }
  }, [isOpen, event])

  const handleInputChange = (field: keyof EditEventFormData, value: string) => {
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

      if (endDate < startDate) {
        newErrors.planned_end_date = 'End date must be after start date'
      }

      // Only validate against current date if event is still planned
      if (event.status === 'Planned') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (startDate < today) {
          newErrors.planned_start_date = 'Start date cannot be in the past'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      // Create the update data - only include changed fields
      const updateData: UpdateMaintenanceEventRequest = {}
      
      if (formData.title !== event.title) {
        updateData.title = formData.title
      }
      if (formData.description !== event.description) {
        updateData.description = formData.description
      }
      if (formData.event_type !== event.event_type) {
        updateData.event_type = formData.event_type
      }
      if (formData.event_category !== (event.event_category || MaintenanceEventCategory.Simple)) {
        updateData.event_category = formData.event_category
      }
      if (formData.planned_start_date !== event.planned_start_date) {
        updateData.planned_start_date = formData.planned_start_date
      }
      if (formData.planned_end_date !== event.planned_end_date) {
        updateData.planned_end_date = formData.planned_end_date
      }
      if (formData.notes !== event.notes) {
        updateData.notes = formData.notes
      }

      // Only update if there are actual changes
      if (Object.keys(updateData).length === 0) {
        toast.info('No changes detected')
        handleClose()
        return
      }

      console.log('Updating event:', updateData)
      
      await updateEventMutation.mutateAsync({
        id: event.id.toString(),
        data: updateData
      })
      
      handleClose()
      onEventUpdated?.()
      
    } catch (error) {
      console.error('Failed to update event:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update event. Please try again.'
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setErrors({})
    setIsSubmitting(false)
    setIsOpen(false)
  }

  // Check if there are any changes
  const hasChanges = () => {
    return (
      formData.title !== event.title ||
      formData.description !== event.description ||
      formData.event_type !== event.event_type ||
      formData.event_category !== (event.event_category || MaintenanceEventCategory.Simple) ||
      formData.planned_start_date !== event.planned_start_date ||
      formData.planned_end_date !== event.planned_end_date ||
      formData.notes !== event.notes
    )
  }

  const selectedEventType = eventTypeOptions.find(option => option.value === formData.event_type)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Event
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[90vh] max-h-[85vh] overflow-y-auto scrollbar-hide">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="p-2 rounded-lg bg-primary/10">
              <Edit className="h-5 w-5 text-primary" />
            </div>
            Edit Maintenance Event
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Edit &quot;{event.title}&quot; ({event.event_number}). You can only edit events that are in planned status.
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

          {/* Event Info */}
          <Card className="border-dashed bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                📋 Event Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Event Number:</span>
                <Badge variant="secondary">{event.event_number}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="secondary">{event.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Created: {format(new Date(event.created_at), 'MMM dd, yyyy')}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                📝 Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        <span>{option.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.event_type && (
                  <p className="text-sm text-destructive">{errors.event_type}</p>
                )}
              </div>
              
              {/* Event Category */}
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
                  disablePast={event.status === 'Planned'}
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

          {/* Changes Preview */}
          {hasChanges() && (
            <Card className="border-dashed border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base text-blue-700">
                  🔄 Changes Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {formData.title !== event.title && (
                    <div>
                      <span className="font-medium">Title:</span>
                      <span className="ml-2 text-muted-foreground line-through">{event.title}</span>
                      <span className="ml-2 text-blue-700">→ {formData.title}</span>
                    </div>
                  )}
                  {formData.event_type !== event.event_type && (
                    <div>
                      <span className="font-medium">Type:</span>
                      <span className="ml-2 text-muted-foreground line-through">{event.event_type}</span>
                      <span className="ml-2 text-blue-700">→ {formData.event_type}</span>
                    </div>
                  )}
                  {formData.event_category !== (event.event_category || MaintenanceEventCategory.Simple) && (
                    <div>
                      <span className="font-medium">Category:</span>
                      <span className="ml-2 text-muted-foreground line-through">{event.event_category || 'Simple'}</span>
                      <span className="ml-2 text-blue-700">→ {formData.event_category}</span>
                    </div>
                  )}
                  {(formData.planned_start_date !== event.planned_start_date || formData.planned_end_date !== event.planned_end_date) && (
                    <div>
                      <span className="font-medium">Schedule:</span>
                      <div className="ml-2 text-xs">
                        <span className="text-muted-foreground line-through">
                          {format(new Date(event.planned_start_date), 'MMM dd, yyyy')} → {format(new Date(event.planned_end_date), 'MMM dd, yyyy')}
                        </span>
                        <br />
                        <span className="text-blue-700">
                          {format(new Date(formData.planned_start_date), 'MMM dd, yyyy')} → {format(new Date(formData.planned_end_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
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
            disabled={isSubmitting || !hasChanges()}
            className="min-w-[100px] gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Update Event
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { MaintenanceEvent, MaintenanceEventStatus, OverhaulSubType } from '@/types/maintenance-events'
import { canEventHaveSubEvents } from '@/lib/utils/maintenance-event-state'
import { useCreateMaintenanceSubEvent } from '@/hooks/use-maintenance-events'
import { toast } from 'sonner'
import { DateRange } from 'react-day-picker'
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
  Plus, 
  Wrench, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2,
  Settings,
  Clock
} from 'lucide-react'

interface CreateSubEventFormData {
  sub_event_number: string
  title: string
  description?: string
  sub_type?: OverhaulSubType
  planned_start_date: string
  planned_end_date: string
  notes?: string
}

interface CreateSubEventModalProps {
  trigger?: React.ReactNode
  parentEvent: MaintenanceEvent
  onSubEventCreated?: () => void
}

const subTypeOptions = [
  { value: OverhaulSubType.TotalOverhaul, label: '🔧 Total Overhaul', description: 'Complete system overhaul' },
  { value: OverhaulSubType.TrainOverhaul, label: '🚂 Train Overhaul', description: 'Specific train maintenance' },
  { value: OverhaulSubType.UnitOverhaul, label: '⚙️ Unit Overhaul', description: 'Individual unit maintenance' },
  { value: OverhaulSubType.NormalOverhaul, label: '🔨 Normal Overhaul', description: 'Standard maintenance procedure' },
]

export function CreateSubEventModal({ trigger, parentEvent, onSubEventCreated }: CreateSubEventModalProps) {
  // Always declare hooks at the top - before any conditional logic
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<CreateSubEventFormData>>({
    sub_type: OverhaulSubType.NormalOverhaul
  })
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const createSubEventMutation = useCreateMaintenanceSubEvent()

  // Check if parent event allows sub-events
  const canCreateSubEvents = canEventHaveSubEvents(parentEvent)
  
  // Don't render if sub-events are not allowed
  if (!canCreateSubEvents) {
    return null
  }

  // Generate unique sub-event number with the new format
  const generateUniqueSubEventNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SUB-${dateStr}-${randomSuffix}`;
  }

  // Generate sub-event number when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        sub_event_number: generateUniqueSubEventNumber()
      }))
    }
  }, [isOpen])

  const handleInputChange = (field: keyof CreateSubEventFormData, value: string) => {
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
    if (!formData.sub_event_number?.trim()) {
      newErrors.sub_event_number = 'Sub-event number is required'
    }
    if (!formData.title?.trim()) {
      newErrors.title = 'Sub-event title is required'
    }
    if (!formData.planned_start_date || !formData.planned_end_date) {
      newErrors.dateRange = 'Both start and end dates are required'
    }

    // Date validation
    if (formData.planned_start_date && formData.planned_end_date) {
      const startDate = new Date(formData.planned_start_date)
      const endDate = new Date(formData.planned_end_date)
      const parentStartDate = new Date(parentEvent.planned_start_date)
      const parentEndDate = new Date(parentEvent.planned_end_date)

      // These checks are now mainly for edge cases since date picker prevents most invalid selections
      if (startDate < parentStartDate) {
        newErrors.planned_start_date = `Sub-event cannot start before parent event start date (${parentStartDate.toLocaleDateString()})`
      }
      if (endDate > parentEndDate) {
        newErrors.planned_end_date = `Sub-event cannot end after parent event end date (${parentEndDate.toLocaleDateString()})`
      }
      if (endDate < startDate) {
        newErrors.planned_end_date = 'End date must be after start date'
      }
    }

    // Note: We're not validating the sub-event number format since it's auto-generated
    // and we know it will always match our expected format

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const subEventData = {
        parent_event_id: parentEvent.id,
        sub_event_number: formData.sub_event_number!,
        title: formData.title!,
        description: formData.description,
        sub_type: formData.sub_type,
        planned_start_date: formData.planned_start_date!,
        planned_end_date: formData.planned_end_date!,
        notes: formData.notes,
      }

      await createSubEventMutation.mutateAsync(subEventData)
      
      handleClose()
      onSubEventCreated?.()
      toast.success('Sub-event created successfully')
      
    } catch (error) {
      console.error('Failed to create sub-event:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create sub-event. Please try again.'
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({ sub_type: OverhaulSubType.NormalOverhaul })
    setDateRange(undefined)
    setErrors({})
    setIsSubmitting(false)
    setIsOpen(false)
  }

  const selectedSubType = subTypeOptions.find(option => option.value === formData.sub_type)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Sub-event
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[90vh] max-h-[85vh] overflow-y-auto scrollbar-hide">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            Create New Sub-event
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create a sub-event under &quot;{parentEvent.title}&quot; with detailed specifications and timeline.
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

          {/* Parent Event Context */}
          <Card className="border-dashed bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                🔗 Parent Event Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{parentEvent.title}</span>
                <Badge variant="secondary">{parentEvent.event_number}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Duration: {format(new Date(parentEvent.planned_start_date), 'MMM dd, yyyy')} → {format(new Date(parentEvent.planned_end_date), 'MMM dd, yyyy')}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sub_event_number" className="text-sm font-medium">
                    Sub-event Number *
                  </Label>
                  <Input
                    id="sub_event_number"
                    placeholder="Auto-generated"
                    value={formData.sub_event_number || ''}
                    onChange={(e) => handleInputChange('sub_event_number', e.target.value)}
                    className={cn("h-9", errors.sub_event_number && "border-destructive")}
                    readOnly // Auto-generated
                  />
                  {errors.sub_event_number && (
                    <p className="text-sm text-destructive">{errors.sub_event_number}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Sub-event Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter sub-event title"
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
                  placeholder="Enter detailed description of the sub-event..."
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Sub-event Configuration */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                ⚙️ Sub-event Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sub-event Type</Label>
                <Select 
                  value={formData.sub_type || OverhaulSubType.NormalOverhaul} 
                  onValueChange={(value) => handleInputChange('sub_type', value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
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
                <div className="space-y-2">
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={handleDateRangeChange}
                    placeholder="Select date range"
                    className={cn(
                      (errors.dateRange || errors.planned_start_date || errors.planned_end_date) && "border-destructive"
                    )}
                    disablePast={false}
                    minDate={new Date(parentEvent.planned_start_date)}
                    maxDate={new Date(parentEvent.planned_end_date)}
                    modal={true}
                  />
                  <p className="text-xs text-muted-foreground">
                    📅 Must be within parent event period: {new Date(parentEvent.planned_start_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })} - {new Date(parentEvent.planned_end_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
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
                  placeholder="Enter any additional notes or special requirements..."
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {(formData.title || selectedSubType) && (
            <Card className="border-dashed">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  👁️ Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="font-medium">{formData.title || 'Untitled Sub-event'}</span>
                  </div>
                  
                  {formData.sub_event_number && (
                    <p className="text-sm text-muted-foreground">Sub-event #{formData.sub_event_number}</p>
                  )}
                  
                  {selectedSubType && (
                    <p className="text-sm text-muted-foreground">{selectedSubType.description}</p>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Part of: {parentEvent.title} ({parentEvent.event_number})
                  </div>
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
                Create Sub-event
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
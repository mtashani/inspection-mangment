'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { MaintenanceEvent, MaintenanceSubEvent, RefineryDepartment, CreatePlanInspectionRequest } from '@/types/maintenance-events'
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
  Calendar, 
  AlertTriangle, 
  CheckCircle2,
  ClipboardList,
  Search,
  Factory
} from 'lucide-react'
import { canPerformInspectionAction } from '@/lib/utils/maintenance-event-state'
import { useCreatePlanInspection } from '@/hooks/use-maintenance-events'

interface CreatePlanInspectionFormData {
  inspection_number: string
  title: string
  description?: string
  equipment_id: number
  equipment_tag?: string
  planned_start_date: string
  planned_end_date: string
  requesting_department: RefineryDepartment
  work_order?: string
  permit_number?: string
}

interface CreatePlanInspectionModalProps {
  trigger?: React.ReactNode
  parentEvent: MaintenanceEvent
  subEvent?: MaintenanceSubEvent
  onInspectionPlanned?: () => void
}

// Mock equipment data - in real app this would come from API
const mockEquipment = [
  { id: 1, tag: 'P-101', description: 'Main Process Pump', unit: 'Unit 1', type: 'Pump' },
  { id: 2, tag: 'V-201', description: 'Distillation Column', unit: 'Unit 2', type: 'Vessel' },
  { id: 3, tag: 'E-301', description: 'Heat Exchanger', unit: 'Unit 3', type: 'Exchanger' },
  { id: 4, tag: 'C-401', description: 'Compressor', unit: 'Unit 4', type: 'Compressor' },
  { id: 5, tag: 'T-501', description: 'Storage Tank', unit: 'Unit 5', type: 'Tank' }
]

const departmentOptions = [
  { value: RefineryDepartment.Operations, label: '🏭 Operations' },
  { value: RefineryDepartment.Inspection, label: '🔍 Inspection' },
  { value: RefineryDepartment.Maintenance, label: '🔧 Maintenance' },
  { value: RefineryDepartment.Engineering, label: '⚙️ Engineering' },
  { value: RefineryDepartment.Safety, label: '🛡️ Safety' },
  { value: RefineryDepartment.ProcessEngineering, label: '🧪 Process Engineering' }
]

export function CreatePlanInspectionModal({ trigger, parentEvent, subEvent, onInspectionPlanned }: CreatePlanInspectionModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<CreatePlanInspectionFormData>>({
    requesting_department: RefineryDepartment.Inspection
  })
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [equipmentSearch, setEquipmentSearch] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Use the API hook
  const createPlanInspectionMutation = useCreatePlanInspection()

  // Check if inspection planning is allowed
  const planningAllowed = canPerformInspectionAction(parentEvent, 'plan')

  // Generate unique inspection number with timestamp-based approach
  const generateUniqueInspectionNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Get last 2 digits of year
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const timeStr = `${hour}${minute}`;
    return `INS-P-${dateStr}-${timeStr}`;
  }

  // Generate inspection number when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        inspection_number: generateUniqueInspectionNumber()
      }))
    }
  }, [isOpen])

  const handleInputChange = (field: keyof CreatePlanInspectionFormData, value: string | number) => {
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
      setFormData(prev => ({
        ...prev,
        planned_start_date: range.from!.toISOString().split('T')[0],
        planned_end_date: range.to!.toISOString().split('T')[0]
      }))
      
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
    if (!formData.inspection_number?.trim()) {
      newErrors.inspection_number = 'Inspection number is required'
    }
    if (!formData.title?.trim()) {
      newErrors.title = 'Inspection title is required'
    }
    if (!formData.equipment_id) {
      newErrors.equipment_id = 'Equipment selection is required'
    }
    if (!formData.planned_start_date) {
      newErrors.planned_start_date = 'Planned start date is required'
    }
    if (!formData.planned_end_date) {
      newErrors.planned_end_date = 'Planned end date is required'
    }
    if (!formData.requesting_department) {
      newErrors.requesting_department = 'Requesting department is required'
    }

    // Date validation - planned inspections should be within event timeframe
    if (formData.planned_start_date && formData.planned_end_date) {
      const plannedStartDate = new Date(formData.planned_start_date)
      const plannedEndDate = new Date(formData.planned_end_date)
      const eventStartDate = new Date(parentEvent.planned_start_date)
      const eventEndDate = new Date(parentEvent.planned_end_date)

      if (plannedStartDate < eventStartDate) {
        newErrors.planned_start_date = 'Inspection start cannot be before event start date'
      }
      if (plannedEndDate > eventEndDate) {
        newErrors.planned_end_date = 'Inspection end cannot be after event end date'
      }
      if (plannedStartDate >= plannedEndDate) {
        newErrors.planned_end_date = 'End date must be after start date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    if (isSubmitting) return // Prevent double submission

    setIsSubmitting(true)
    try {
      const planInspectionData: CreatePlanInspectionRequest = {
        inspection_number: formData.inspection_number!,
        title: formData.title!,
        description: formData.description,
        equipment_id: formData.equipment_id!,
        maintenance_event_id: subEvent ? undefined : parentEvent.id,
        maintenance_sub_event_id: subEvent?.id,
        planned_start_date: formData.planned_start_date!,
        planned_end_date: formData.planned_end_date!,
        requesting_department: formData.requesting_department!,
        work_order: formData.work_order,
        permit_number: formData.permit_number,
        is_planned: true // Explicitly set for planned inspections
      }

      // Call API to create planned inspection
      await createPlanInspectionMutation.mutateAsync(planInspectionData)
      
      handleClose()
      onInspectionPlanned?.()
      
    } catch (error) {
      console.error('Failed to plan inspection:', error)
      
      // Enhanced error handling to prevent React child errors
      let errorMessage = 'Failed to plan inspection. Please try again.'
      
      // Handle different error types safely
      if (error && typeof error === 'object') {
        // Check for common error patterns
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message
        } else if ('response' in error && error.response) {
          // Handle API response errors
          const response = error.response
          if (typeof response === 'string') {
            errorMessage = response
          } else if (response && typeof response === 'object') {
            if ('data' in response && response.data) {
              if (typeof response.data === 'string') {
                errorMessage = response.data
              } else if (response.data.detail && typeof response.data.detail === 'string') {
                errorMessage = response.data.detail
              } else if (response.data.message && typeof response.data.message === 'string') {
                errorMessage = response.data.message
              } else if (Array.isArray(response.data)) {
                // Handle validation errors array
                const messages = response.data
                  .map(err => {
                    if (typeof err === 'string') return err
                    if (err && typeof err === 'object') {
                      if (err.msg) return err.msg
                      if (err.message) return err.message
                      if (err.detail) return err.detail
                    }
                    return 'Validation error'
                  })
                  .filter(msg => msg && msg.length > 0)
                
                if (messages.length > 0) {
                  errorMessage = messages.join(', ')
                }
              }
            } else if ('detail' in response && typeof response.detail === 'string') {
              errorMessage = response.detail
            } else if ('message' in response && typeof response.message === 'string') {
              errorMessage = response.message
            }
          }
        } else if ('detail' in error && typeof error.detail === 'string') {
          errorMessage = error.detail
        }
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // Final safety check to ensure we have a string
      if (typeof errorMessage !== 'string') {
        errorMessage = 'Failed to plan inspection. Please try again.'
      }
      
      // Ensure errorMessage is not empty
      if (!errorMessage.trim()) {
        errorMessage = 'Failed to plan inspection. Please try again.'
      }
      
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({ requesting_department: RefineryDepartment.Inspection })
    setDateRange(undefined)
    setEquipmentSearch('')
    setErrors({})
    setIsSubmitting(false)
    setIsOpen(false)
  }

  // Filter equipment based on search
  const filteredEquipment = mockEquipment.filter(eq => 
    equipmentSearch === '' || 
    eq.tag.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
    eq.description.toLowerCase().includes(equipmentSearch.toLowerCase())
  )

  if (!planningAllowed.allowed) {
    return null // Don't render if planning is not allowed
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Plan Inspection
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[90vh] max-h-[85vh] overflow-y-auto scrollbar-hide">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="p-2 rounded-lg bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            Plan New Inspection
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Plan an inspection {subEvent ? `for sub-event "${subEvent.title}"` : `for event "${parentEvent.title}"`}. Planned inspections can be started once the event is approved and in progress.
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

          {/* Event Context */}
          <Card className="border-dashed bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                🔗 Event Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {subEvent ? subEvent.title : parentEvent.title}
                </span>
                <Badge variant="secondary">
                  {subEvent ? subEvent.sub_event_number : parentEvent.event_number}
                </Badge>
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
                  <Label htmlFor="inspection_number" className="text-sm font-medium">
                    Inspection Number *
                  </Label>
                  <Input
                    id="inspection_number"
                    placeholder="Auto-generated"
                    value={formData.inspection_number || ''}
                    onChange={(e) => handleInputChange('inspection_number', e.target.value)}
                    className={cn("h-9", errors.inspection_number && "border-destructive")}
                    readOnly // Auto-generated
                  />
                  {errors.inspection_number && (
                    <p className="text-sm text-destructive">{errors.inspection_number}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Inspection Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter inspection title"
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
                  placeholder="Enter detailed description of the inspection..."
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Equipment Selection */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                🏭 Equipment Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Equipment *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search equipment by tag or description..."
                    value={equipmentSearch}
                    onChange={(e) => setEquipmentSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={formData.equipment_id?.toString() || ''} onValueChange={(value) => {
                  const equipment = mockEquipment.find(eq => eq.id.toString() === value)
                  handleInputChange('equipment_id', parseInt(value))
                  if (equipment) {
                    handleInputChange('equipment_tag', equipment.tag)
                  }
                }}>
                  <SelectTrigger className={cn("h-9", errors.equipment_id && "border-destructive")}>
                    <SelectValue placeholder="Select equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEquipment.map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{equipment.tag}</span>
                          <span className="text-xs text-muted-foreground">{equipment.description} - {equipment.unit}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.equipment_id && (
                  <p className="text-sm text-destructive">{errors.equipment_id}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Department */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                📅 Schedule & Department
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Planned Duration *</Label>
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={handleDateRangeChange}
                    placeholder="Select planned start and end dates"
                    className={cn((errors.planned_start_date || errors.planned_end_date) && "border-destructive")}
                    minDate={new Date(parentEvent.planned_start_date)}
                    maxDate={new Date(parentEvent.planned_end_date)}
                    modal={true}
                  />
                  {(errors.planned_start_date || errors.planned_end_date) && (
                    <p className="text-sm text-destructive">{errors.planned_start_date || errors.planned_end_date}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Select dates between {format(new Date(parentEvent.planned_start_date), 'MMM dd, yyyy')} and {format(new Date(parentEvent.planned_end_date), 'MMM dd, yyyy')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Requesting Department *</Label>
                  <Select value={formData.requesting_department || ''} onValueChange={(value) => handleInputChange('requesting_department', value)}>
                    <SelectTrigger className={cn("h-9", errors.requesting_department && "border-destructive")}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.requesting_department && (
                    <p className="text-sm text-destructive">{errors.requesting_department}</p>
                  )}
                </div>
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="work_order" className="text-sm font-medium">
                    Work Order
                  </Label>
                  <Input
                    id="work_order"
                    placeholder="Enter work order number"
                    value={formData.work_order || ''}
                    onChange={(e) => handleInputChange('work_order', e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permit_number" className="text-sm font-medium">
                    Permit Number
                  </Label>
                  <Input
                    id="permit_number"
                    placeholder="Enter permit number"
                    value={formData.permit_number || ''}
                    onChange={(e) => handleInputChange('permit_number', e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || createPlanInspectionMutation.isPending}
            className="min-w-[100px] gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Planning...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Plan Inspection
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DatePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'
import { 
  AlertTriangle, 
  CheckCircle2,
  Search
} from 'lucide-react'
import { canPerformInspectionAction } from '@/lib/utils/maintenance-event-state'
import { useCreatePlanInspection, useCreateUnplannedInspection } from '@/hooks/use-maintenance-events'

interface CreateUnplannedInspectionFormData {
  inspection_number: string
  title: string
  description?: string
  equipment_id: number
  equipment_tag?: string
  planned_date: string
  requesting_department: RefineryDepartment
  unplanned_reason: string
  work_order?: string
  permit_number?: string
}

interface CreateUnplannedInspectionModalProps {
  trigger?: React.ReactNode
  parentEvent: MaintenanceEvent
  subEvent?: MaintenanceSubEvent
  onInspectionCreated?: () => void
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

const unplannedReasonOptions = [
  { value: 'equipment_failure', label: 'Equipment Failure' },
  { value: 'safety_concern', label: 'Safety Concern' },
  { value: 'regulatory_requirement', label: 'Regulatory Requirement' },
  { value: 'operational_issue', label: 'Operational Issue' },
  { value: 'quality_issue', label: 'Quality Issue' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'other', label: 'Other' }
]

export function CreateUnplannedInspectionModal({ trigger, parentEvent, subEvent, onInspectionCreated }: CreateUnplannedInspectionModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<CreateUnplannedInspectionFormData>>({
    requesting_department: RefineryDepartment.Inspection
  })
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [equipmentSearch, setEquipmentSearch] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Use the correct API hook for unplanned inspections
  const createInspectionMutation = useCreateUnplannedInspection()

  // Check if unplanned inspection creation is allowed
  const unplannedAllowed = canPerformInspectionAction(parentEvent, 'create')

  // Generate unique inspection number with the new format
  const generateUniqueInspectionNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Get last 2 digits of year
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const timeStr = `${hour}${minute}`;
    return `INS-U-${dateStr}-${timeStr}`;
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

  const handleInputChange = (field: keyof CreateUnplannedInspectionFormData, value: string | number) => {
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

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      setFormData(prev => ({
        ...prev,
        planned_date: date.toISOString().split('T')[0]
      }))
      
      if (errors.planned_date) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.planned_date
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
    if (!formData.requesting_department) {
      newErrors.requesting_department = 'Requesting department is required'
    }
    if (!formData.unplanned_reason?.trim()) {
      newErrors.unplanned_reason = 'Unplanned reason is required'
    }
    if (!formData.planned_date) {
      newErrors.planned_date = 'Inspection date is required'
    }

    // Date validation - unplanned inspections should be within event timeframe
    if (formData.planned_date) {
      const inspectionDate = new Date(formData.planned_date)
      // Use actual start date if available, otherwise use planned start date
      const eventStartDate = parentEvent.actual_start_date 
        ? new Date(parentEvent.actual_start_date)
        : new Date(parentEvent.planned_start_date)
      const eventEndDate = new Date(parentEvent.planned_end_date)

      if (inspectionDate < eventStartDate) {
        const startType = parentEvent.actual_start_date ? 'actual start' : 'planned start'
        newErrors.planned_date = `Inspection cannot be scheduled before event ${startType} date`
      }
      if (inspectionDate > eventEndDate) {
        newErrors.planned_date = 'Inspection cannot be scheduled after event end date'
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
      const inspectionData: any = {
        inspection_number: formData.inspection_number!,
        title: formData.title!,
        description: formData.description,
        equipment_id: formData.equipment_id!,
        maintenance_event_id: subEvent ? undefined : parentEvent.id,
        maintenance_sub_event_id: subEvent?.id,
        actual_start_date: formData.planned_date!, // Use actual_start_date for unplanned inspections
        requesting_department: formData.requesting_department!,
        work_order: formData.work_order,
        permit_number: formData.permit_number,
        is_planned: false, // Explicitly set for unplanned inspections
        unplanned_reason: formData.unplanned_reason
      }

      // Call API to create unplanned inspection
      await createInspectionMutation.mutateAsync(inspectionData)
      
      handleClose()
      onInspectionCreated?.()
      
    } catch (error) {
      console.error('Failed to create unplanned inspection:', error)
      
      // Enhanced error handling to prevent React child errors
      let errorMessage = 'Failed to create inspection. Please try again.'
      
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
        errorMessage = 'Failed to create inspection. Please try again.'
      }
      
      // Ensure errorMessage is not empty
      if (!errorMessage.trim()) {
        errorMessage = 'Failed to create inspection. Please try again.'
      }
      
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({ requesting_department: RefineryDepartment.Inspection })
    setSelectedDate(undefined)
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

  if (!unplannedAllowed.allowed) {
    return null // Don't render if unplanned inspection creation is not allowed
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 border-orange-200 text-orange-600">
            <AlertTriangle className="h-4 w-4" />
            Add Unplanned Inspection
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[90vh] max-h-[85vh] overflow-y-auto scrollbar-hide">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="p-2 rounded-lg bg-orange-100">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            Create Unplanned Inspection
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create an unplanned inspection {subEvent ? `for sub-event "${subEvent.title}"` : `for event "${parentEvent.title}"`}. 
            Unplanned inspections are created for urgent, unexpected needs that arise during maintenance.
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
          <Card className="border-dashed bg-orange-50/30 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                ⚡ Unplanned Inspection Context
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
              <p className="text-xs text-muted-foreground">
                This inspection was not originally planned and is being added due to unforeseen circumstances.
              </p>
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
                    readOnly // Auto-generated for unplanned
                  />
                  {errors.inspection_number && (
                    <p className="text-xs text-destructive">{errors.inspection_number}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Inspection Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Emergency Pump Inspection"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={cn("h-9", errors.title && "border-destructive")}
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive">{errors.title}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of what needs to be inspected and why..."
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reason for Unplanned Inspection */}
          <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                ⚠️ Unplanned Reason *
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unplanned_reason" className="text-sm font-medium">
                  Why is this inspection unplanned? *
                </Label>
                <Select 
                  value={formData.unplanned_reason || ''} 
                  onValueChange={(value) => handleInputChange('unplanned_reason', value)}
                >
                  <SelectTrigger className={cn("h-9", errors.unplanned_reason && "border-destructive")}>
                    <SelectValue placeholder="Select reason for unplanned inspection" />
                  </SelectTrigger>
                  <SelectContent>
                    {unplannedReasonOptions.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unplanned_reason && (
                  <p className="text-xs text-destructive">{errors.unplanned_reason}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inspection Date */}
          <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                📅 Inspection Date *
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="planned_date" className="text-sm font-medium">
                  When should this inspection be performed? *
                </Label>
                <DatePicker
                  date={selectedDate}
                  onDateChange={handleDateChange}
                  placeholder="Select inspection date"
                  inModal={true}
                  fromDate={parentEvent.actual_start_date ? new Date(parentEvent.actual_start_date) : new Date(parentEvent.planned_start_date)}
                  toDate={new Date(parentEvent.planned_end_date)}
                  className={cn("w-full", errors.planned_date && "border-destructive")}
                />
                {errors.planned_date && (
                  <p className="text-xs text-destructive">{errors.planned_date}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Unplanned inspections must be scheduled {parentEvent.actual_start_date ? 'after the event actually started' : 'between the event planned dates'} ({format(parentEvent.actual_start_date ? new Date(parentEvent.actual_start_date) : new Date(parentEvent.planned_start_date), 'MMM dd, yyyy')}) and before the planned end date ({format(new Date(parentEvent.planned_end_date), 'MMM dd, yyyy')}).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Equipment Selection */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                🔧 Equipment Selection *
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

          {/* Additional Details */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                📋 Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requesting_department" className="text-sm font-medium">
                    Requesting Department *
                  </Label>
                  <Select 
                    value={formData.requesting_department || ''} 
                    onValueChange={(value) => handleInputChange('requesting_department', value as RefineryDepartment)}
                  >
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
                    <p className="text-xs text-destructive">{errors.requesting_department}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="work_order" className="text-sm font-medium">
                    Work Order
                  </Label>
                  <Input
                    id="work_order"
                    placeholder="e.g., WO-2025-001"
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
                    placeholder="e.g., PTW-2025-001"
                    value={formData.permit_number || ''}
                    onChange={(e) => handleInputChange('permit_number', e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || createInspectionMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting || createInspectionMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Create Unplanned Inspection
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
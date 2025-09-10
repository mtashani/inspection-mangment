'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { Inspection, RefineryDepartment, UpdateInspectionRequest } from '@/types/maintenance-events'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { DatePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle2,
  Edit,
  Search,
  Factory
} from 'lucide-react'
import { useUpdateInspection } from '@/hooks/use-maintenance-events'

interface EditInspectionFormData {
  inspection_number: string
  title: string
  description?: string
  equipment_id: number
  equipment_tag?: string
  planned_start_date?: string
  planned_end_date?: string
  actual_start_date?: string
  actual_end_date?: string
  requesting_department: RefineryDepartment
  work_order?: string
  permit_number?: string
  unplanned_reason?: string
}

interface EditInspectionModalProps {
  isOpen: boolean
  onClose: () => void
  inspection: Inspection
  onSuccess?: () => void
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

export function EditInspectionModal({ isOpen, onClose, inspection, onSuccess }: EditInspectionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<EditInspectionFormData>>({})
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [equipmentSearch, setEquipmentSearch] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Use the API hook
  const updateInspectionMutation = useUpdateInspection()

  // Initialize form data when inspection changes
  useEffect(() => {
    if (inspection) {
      setFormData({
        inspection_number: inspection.inspection_number,
        title: inspection.title,
        description: inspection.description || '',
        equipment_id: inspection.equipment_id,
        equipment_tag: inspection.equipment_tag || '',
        planned_start_date: inspection.planned_start_date || inspection.start_date,
        planned_end_date: inspection.planned_end_date || inspection.end_date,
        actual_start_date: inspection.actual_start_date,
        actual_end_date: inspection.actual_end_date,
        requesting_department: inspection.requesting_department,
        work_order: inspection.work_order || '',
        permit_number: inspection.permit_number || '',
        unplanned_reason: inspection.unplanned_reason || ''
      })

      // Set date range for planned inspections
      if (inspection.is_planned && (inspection.planned_start_date || inspection.start_date) && (inspection.planned_end_date || inspection.end_date)) {
        setDateRange({
          from: new Date(inspection.planned_start_date || inspection.start_date),
          to: new Date(inspection.planned_end_date || inspection.end_date!)
        })
      }

      // Set single date for unplanned inspections
      if (!inspection.is_planned && (inspection.actual_start_date || inspection.start_date)) {
        setSelectedDate(new Date(inspection.actual_start_date || inspection.start_date))
      }

      // Set equipment search to current equipment tag
      setEquipmentSearch(inspection.equipment_tag || '')
    }
  }, [inspection])

  const handleInputChange = (field: keyof EditInspectionFormData, value: string | number) => {
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

  const handleSingleDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      setFormData(prev => ({
        ...prev,
        actual_start_date: date.toISOString().split('T')[0]
      }))
      
      if (errors.actual_start_date) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.actual_start_date
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

    // Date validation for planned inspections
    if (inspection.is_planned) {
      if (!formData.planned_start_date) {
        newErrors.planned_start_date = 'Start date is required for planned inspections'
      }
      if (!formData.planned_end_date) {
        newErrors.planned_end_date = 'End date is required for planned inspections'
      }
      if (formData.planned_start_date && formData.planned_end_date && new Date(formData.planned_start_date) >= new Date(formData.planned_end_date)) {
        newErrors.planned_end_date = 'End date must be after start date'
      }
    } else {
      // For unplanned inspections, validate actual start date
      if (!formData.actual_start_date) {
        newErrors.actual_start_date = 'Start date is required'
      }
    }

    // Unplanned reason validation for unplanned inspections
    if (!inspection.is_planned && !formData.unplanned_reason?.trim()) {
      newErrors.unplanned_reason = 'Unplanned reason is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const updateData: UpdateInspectionRequest = {
        inspection_number: formData.inspection_number!,
        title: formData.title!,
        description: formData.description,
        equipment_id: formData.equipment_id!,
        planned_start_date: formData.planned_start_date,
        planned_end_date: formData.planned_end_date,
        actual_start_date: formData.actual_start_date,
        actual_end_date: formData.actual_end_date,
        requesting_department: formData.requesting_department!,
        work_order: formData.work_order,
        permit_number: formData.permit_number,
        unplanned_reason: formData.unplanned_reason
      }

      // Call API to update inspection
      await updateInspectionMutation.mutateAsync({ id: inspection.id, data: updateData })
      
      handleClose()
      onSuccess?.()
      
    } catch (error) {
      console.error('Failed to update inspection:', error)
      // Format the error message to prevent React child errors
      let errorMessage = 'Failed to update inspection. Please try again.'
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      // Ensure we don't pass objects to toast
      if (typeof errorMessage !== 'string') {
        try {
          errorMessage = JSON.stringify(errorMessage)
        } catch (stringifyError) {
          errorMessage = 'Failed to update inspection. Please try again.'
        }
      }
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({})
    setDateRange(undefined)
    setSelectedDate(undefined)
    setEquipmentSearch('')
    setErrors({})
    setIsSubmitting(false)
    onClose()
  }

  // Filter equipment based on search
  const filteredEquipment = mockEquipment.filter(eq => 
    equipmentSearch === '' || 
    eq.tag.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
    eq.description.toLowerCase().includes(equipmentSearch.toLowerCase())
  )

  if (!inspection) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vh] max-h-[85vh] overflow-y-auto scrollbar-hide">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="p-2 rounded-lg bg-primary/10">
              <Edit className="h-5 w-5 text-primary" />
            </div>
            Edit Inspection
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Update inspection details for "{inspection.title}". You can modify most fields except for the inspection type (planned/unplanned).
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

          {/* Inspection Type Context */}
          <Card className="border-dashed bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                📋 Inspection Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {inspection.inspection_number}
                </span>
                <Badge variant={inspection.is_planned ? "default" : "secondary"}>
                  {inspection.is_planned ? "Planned" : "Unplanned"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Current Status: {inspection.status}
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
                    readOnly // Make it read-only since it's a unique identifier
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

          {/* Schedule */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                📅 Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {inspection.is_planned ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Planned Duration *</Label>
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={handleDateRangeChange}
                    placeholder="Select planned start and end dates"
                    className={cn((errors.planned_start_date || errors.planned_end_date) && "border-destructive")}
                    modal={true}
                  />
                  {(errors.planned_start_date || errors.planned_end_date) && (
                    <p className="text-sm text-destructive">{errors.planned_start_date || errors.planned_end_date}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Inspection Date *</Label>
                  <DatePicker
                    date={selectedDate}
                    onDateChange={handleSingleDateChange}
                    placeholder="Select inspection date"
                    inModal={true}
                    className={cn("w-full", errors.actual_start_date && "border-destructive")}
                  />
                  {errors.actual_start_date && (
                    <p className="text-sm text-destructive">{errors.actual_start_date}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department and Additional Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                📋 Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {!inspection.is_planned && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Unplanned Reason *</Label>
                    <Select value={formData.unplanned_reason || ''} onValueChange={(value) => handleInputChange('unplanned_reason', value)}>
                      <SelectTrigger className={cn("h-9", errors.unplanned_reason && "border-destructive")}>
                        <SelectValue placeholder="Select reason" />
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
                      <p className="text-sm text-destructive">{errors.unplanned_reason}</p>
                    )}
                  </div>
                )}
              </div>

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
            disabled={isSubmitting}
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
                Update Inspection
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
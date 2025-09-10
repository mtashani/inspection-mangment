'use client'

import React, { useState, useEffect } from 'react'
import { 
  XMarkIcon,
  MagnifyingGlassIcon,
  TagIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

import {
  InspectionPlanningModalProps,
  InspectionPlanCreateRequest,
  InspectionPriority,
  RefineryDepartment
} from '@/types/enhanced-maintenance'

import { Equipment } from '@/types/equipment'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface FormData {
  equipmentTag: string
  requester: string
  priority: InspectionPriority
  description: string
  plannedStartDate: string
  plannedEndDate: string
}

interface FormErrors {
  equipmentTag?: string
  requester?: string
  priority?: string
  plannedStartDate?: string
  plannedEndDate?: string
}

const InspectionPlanningModal: React.FC<InspectionPlanningModalProps> = ({
  isOpen,
  onClose,
  eventId,
  subEventId,
  onSubmit,
  availableEquipment = [],
  availableRequesters = []
}) => {
  const [formData, setFormData] = useState<FormData>({
    equipmentTag: '',
    requester: '',
    priority: InspectionPriority.Medium,
    description: '',
    plannedStartDate: '',
    plannedEndDate: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [equipmentSearch, setEquipmentSearch] = useState('')
  const [isEquipmentOpen, setIsEquipmentOpen] = useState(false)
  const [isRequesterOpen, setIsRequesterOpen] = useState(false)
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        equipmentTag: '',
        requester: '',
        priority: InspectionPriority.Medium,
        description: '',
        plannedStartDate: '',
        plannedEndDate: ''
      })
      setErrors({})
      setEquipmentSearch('')
    }
  }, [isOpen])

  // Filter equipment based on search
  const filteredEquipment = availableEquipment.filter(equipment =>
    equipment.tag.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
    (equipment.name && equipment.name.toLowerCase().includes(equipmentSearch.toLowerCase()))
  )

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.equipmentTag.trim()) {
      newErrors.equipmentTag = 'Equipment tag is required'
    }

    if (!formData.requester.trim()) {
      newErrors.requester = 'Requester is required'
    }

    if (formData.plannedStartDate && formData.plannedEndDate) {
      const startDate = new Date(formData.plannedStartDate)
      const endDate = new Date(formData.plannedEndDate)
      
      if (endDate <= startDate) {
        newErrors.plannedEndDate = 'End date must be after start date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const requestData: InspectionPlanCreateRequest = {
        maintenanceEventId: eventId,
        maintenanceSubEventId: subEventId,
        equipmentTag: formData.equipmentTag,
        requester: formData.requester,
        priority: formData.priority,
        description: formData.description || undefined,
        plannedStartDate: formData.plannedStartDate || undefined,
        plannedEndDate: formData.plannedEndDate || undefined
      }

      await onSubmit(requestData)
      onClose()
    } catch (error) {
      console.error('Failed to create inspection plan:', error)
      // Handle error - could show toast notification
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const getPriorityColor = (priority: InspectionPriority): string => {
    switch (priority) {
      case InspectionPriority.Critical:
        return 'bg-red-100 text-red-800 border-red-200'
      case InspectionPriority.High:
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case InspectionPriority.Medium:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case InspectionPriority.Low:
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: InspectionPriority) => {
    switch (priority) {
      case InspectionPriority.Critical:
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
      case InspectionPriority.High:
        return <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
      case InspectionPriority.Medium:
        return <ClockIcon className="h-4 w-4 text-yellow-600" />
      case InspectionPriority.Low:
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Select date'
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const selectedEquipment = availableEquipment.find(eq => eq.tag === formData.equipmentTag)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TagIcon className="h-5 w-5 text-blue-600" />
            <span>Plan New Inspection</span>
          </DialogTitle>
          <DialogDescription>
            Add equipment to the inspection plan for this {subEventId ? 'sub-event' : 'event'}.
            This will create a planned inspection that can be started later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Equipment Selection */}
          <div className="space-y-2">
            <Label htmlFor="equipment" className="text-sm font-medium">
              Equipment Tag *
            </Label>
            <Popover open={isEquipmentOpen} onOpenChange={setIsEquipmentOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isEquipmentOpen}
                  className={cn(
                    "w-full justify-between",
                    !formData.equipmentTag && "text-muted-foreground",
                    errors.equipmentTag && "border-red-500"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <TagIcon className="h-4 w-4" />
                    <span className="truncate">
                      {formData.equipmentTag || "Select equipment..."}
                    </span>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search equipment..."
                    value={equipmentSearch}
                    onValueChange={setEquipmentSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No equipment found.</CommandEmpty>
                    <CommandGroup>
                      {filteredEquipment.map((equipment) => (
                        <CommandItem
                          key={equipment.id}
                          onSelect={() => {
                            handleInputChange('equipmentTag', equipment.tag)
                            setIsEquipmentOpen(false)
                          }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{equipment.tag}</span>
                            {equipment.name && (
                              <span className="text-sm text-gray-500">{equipment.name}</span>
                            )}
                            {equipment.location && (
                              <span className="text-xs text-gray-400">{equipment.location}</span>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {equipment.type}
                          </Badge>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.equipmentTag && (
              <p className="text-sm text-red-600">{errors.equipmentTag}</p>
            )}
            
            {/* Selected Equipment Info */}
            {selectedEquipment && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">{selectedEquipment.tag}</h4>
                    {selectedEquipment.name && (
                      <p className="text-sm text-blue-700">{selectedEquipment.name}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-blue-600 mt-1">
                      <span>Type: {selectedEquipment.type}</span>
                      {selectedEquipment.location && <span>Location: {selectedEquipment.location}</span>}
                    </div>
                  </div>
                  <Badge className={cn("text-xs", getPriorityColor(InspectionPriority.Medium))}>
                    {selectedEquipment.status}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Requester */}
          <div className="space-y-2">
            <Label htmlFor="requester" className="text-sm font-medium">
              Requester *
            </Label>
            {availableRequesters.length > 0 ? (
              <Popover open={isRequesterOpen} onOpenChange={setIsRequesterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isRequesterOpen}
                    className={cn(
                      "w-full justify-between",
                      !formData.requester && "text-muted-foreground",
                      errors.requester && "border-red-500"
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4" />
                      <span className="truncate">
                        {formData.requester || "Select requester..."}
                      </span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search requesters..." />
                    <CommandList>
                      <CommandEmpty>No requesters found.</CommandEmpty>
                      <CommandGroup>
                        {availableRequesters.map((requester) => (
                          <CommandItem
                            key={requester}
                            onSelect={() => {
                              handleInputChange('requester', requester)
                              setIsRequesterOpen(false)
                            }}
                          >
                            <UserIcon className="h-4 w-4 mr-2" />
                            {requester}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <Input
                id="requester"
                placeholder="Enter requester name or department"
                value={formData.requester}
                onChange={(e) => handleInputChange('requester', e.target.value)}
                className={cn(errors.requester && "border-red-500")}
              />
            )}
            {errors.requester && (
              <p className="text-sm text-red-600">{errors.requester}</p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm font-medium">
              Priority
            </Label>
            <Select
              value={formData.priority}
              onValueChange={(value: InspectionPriority) => handleInputChange('priority', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  <div className="flex items-center space-x-2">
                    {getPriorityIcon(formData.priority)}
                    <span>{formData.priority}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.values(InspectionPriority).map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    <div className="flex items-center space-x-2">
                      {getPriorityIcon(priority)}
                      <span>{priority}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Planned Start Date</Label>
              <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.plannedStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDate(formData.plannedStartDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.plannedStartDate ? new Date(formData.plannedStartDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleInputChange('plannedStartDate', date.toISOString().split('T')[0])
                      }
                      setIsStartDateOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Planned End Date</Label>
              <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.plannedEndDate && "text-muted-foreground",
                      errors.plannedEndDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDate(formData.plannedEndDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.plannedEndDate ? new Date(formData.plannedEndDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleInputChange('plannedEndDate', date.toISOString().split('T')[0])
                      }
                      setIsEndDateOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.plannedEndDate && (
                <p className="text-sm text-red-600">{errors.plannedEndDate}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Enter inspection description or special requirements..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-2">Inspection Plan Summary</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Equipment:</span>
                <span className="font-medium">{formData.equipmentTag || 'Not selected'}</span>
              </div>
              <div className="flex justify-between">
                <span>Requester:</span>
                <span className="font-medium">{formData.requester || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span>Priority:</span>
                <Badge className={cn("text-xs", getPriorityColor(formData.priority))}>
                  {formData.priority}
                </Badge>
              </div>
              {formData.plannedStartDate && (
                <div className="flex justify-between">
                  <span>Start Date:</span>
                  <span className="font-medium">{formatDate(formData.plannedStartDate)}</span>
                </div>
              )}
              {formData.plannedEndDate && (
                <div className="flex justify-between">
                  <span>End Date:</span>
                  <span className="font-medium">{formatDate(formData.plannedEndDate)}</span>
                </div>
              )}
            </div>
          </div>
        </form>

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
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.equipmentTag || !formData.requester}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Creating...' : 'Create Inspection Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InspectionPlanningModal
'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Shield, CheckCircle, AlertCircle } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

import { Inspector, SpecialtyCode, SpecialtyPermissions } from '@/types/admin'
import { updateInspectorSpecialties } from '@/lib/api/admin/inspectors'

interface SpecialtyEditorProps {
  inspector: Inspector
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface SpecialtyInfo {
  code: SpecialtyCode
  name: string
  description: string
  color: string
  icon: string
}

const specialtyInfo: SpecialtyInfo[] = [
  {
    code: 'PSV',
    name: 'Pressure Safety Valve',
    description: 'Inspection and calibration of pressure safety valves and relief systems',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '🔧'
  },
  {
    code: 'CRANE',
    name: 'Crane Inspection',
    description: 'Mechanical inspection of cranes, hoists, and lifting equipment',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🏗️'
  },
  {
    code: 'CORROSION',
    name: 'Corrosion Monitoring',
    description: 'Corrosion assessment and monitoring of metal structures and equipment',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '🔍'
  }
]

export function SpecialtyEditor({ inspector, open, onOpenChange, onSuccess }: SpecialtyEditorProps) {
  const { toast } = useToast()
  
  // Initialize specialty permissions based on inspector's current specialties
  const [specialtyPermissions, setSpecialtyPermissions] = useState<SpecialtyPermissions>(() => ({
    PSV: inspector.specialties.includes('PSV'),
    CRANE: inspector.specialties.includes('CRANE'),
    CORROSION: inspector.specialties.includes('CORROSION')
  }))

  const updateSpecialtiesMutation = useMutation({
    mutationFn: (permissions: SpecialtyPermissions) => 
      updateInspectorSpecialties(inspector.id, permissions),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Inspector specialties updated successfully',
        variant: 'default'
      })
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update specialties',
        variant: 'destructive'
      })
    }
  })

  const handleSpecialtyChange = (specialty: SpecialtyCode, checked: boolean) => {
    setSpecialtyPermissions(prev => ({
      ...prev,
      [specialty]: checked
    }))
  }

  const handleSave = () => {
    updateSpecialtiesMutation.mutate(specialtyPermissions)
  }

  const handleCancel = () => {
    // Reset to original state
    setSpecialtyPermissions({
      PSV: inspector.specialties.includes('PSV'),
      CRANE: inspector.specialties.includes('CRANE'),
      CORROSION: inspector.specialties.includes('CORROSION')
    })
    onOpenChange(false)
  }

  const hasChanges = () => {
    return (
      specialtyPermissions.PSV !== inspector.specialties.includes('PSV') ||
      specialtyPermissions.CRANE !== inspector.specialties.includes('CRANE') ||
      specialtyPermissions.CORROSION !== inspector.specialties.includes('CORROSION')
    )
  }

  const getSelectedCount = () => {
    return Object.values(specialtyPermissions).filter(Boolean).length
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Inspector Specialties
          </DialogTitle>
          <DialogDescription>
            Configure inspection specialties for <strong>{inspector.name}</strong> (ID: {inspector.employeeId})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Specialties</span>
              <Badge variant="outline">
                {inspector.specialties.length} active
              </Badge>
            </div>
            <div className="flex gap-2 flex-wrap">
              {inspector.specialties.length > 0 ? (
                inspector.specialties.map((specialty) => {
                  const info = specialtyInfo.find(s => s.code === specialty)
                  return (
                    <Badge key={specialty} className={info?.color}>
                      {info?.icon} {specialty}
                    </Badge>
                  )
                })
              ) : (
                <span className="text-sm text-gray-500">No specialties assigned</span>
              )}
            </div>
          </div>

          <Separator />

          {/* Specialty Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Available Specialties</h4>
              <Badge variant="secondary">
                {getSelectedCount()} selected
              </Badge>
            </div>

            {specialtyInfo.map((specialty) => (
              <div key={specialty.code} className="space-y-2">
                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <Checkbox
                    id={`specialty-${specialty.code}`}
                    checked={specialtyPermissions[specialty.code]}
                    onCheckedChange={(checked) => 
                      handleSpecialtyChange(specialty.code, checked as boolean)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <Label 
                      htmlFor={`specialty-${specialty.code}`}
                      className="text-sm font-medium cursor-pointer flex items-center gap-2"
                    >
                      <span className="text-lg">{specialty.icon}</span>
                      {specialty.name}
                      <Badge variant="outline" className="text-xs">
                        {specialty.code}
                      </Badge>
                    </Label>
                    <p className="text-xs text-gray-600">
                      {specialty.description}
                    </p>
                  </div>
                  {specialtyPermissions[specialty.code] && (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Warning for no specialties */}
          {getSelectedCount() === 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Inspector will have no specialties assigned. They may not be able to perform certain inspections.
              </span>
            </div>
          )}

          {/* Changes indicator */}
          {hasChanges() && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                You have unsaved changes to this inspector's specialties.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={updateSpecialtiesMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges() || updateSpecialtiesMutation.isPending}
            className="min-w-[100px]"
          >
            {updateSpecialtiesMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
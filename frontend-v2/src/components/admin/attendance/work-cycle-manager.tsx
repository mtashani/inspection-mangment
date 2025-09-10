'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Settings, 
  Calendar as CalendarIcon, 
  Clock, 
  RotateCcw, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'
import { WorkCycle, WorkCycleType, WorkCycleData, Inspector } from '@/types/admin'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface WorkCycleManagerProps {
  inspector: Inspector
  workCycle?: WorkCycle | null
  onCreateCycle: (data: WorkCycleData) => Promise<void>
  onUpdateCycle: (id: number, data: Partial<WorkCycleData>) => Promise<void>
  onResetCycle: (inspectorId: number, newStartDate: string) => Promise<void>
  onDeleteCycle: (id: number) => Promise<void>
  loading?: boolean
  className?: string
}

interface CyclePreview {
  workDays: Date[]
  restDays: Date[]
  pattern: string[]
}

const CYCLE_TYPE_CONFIG = {
  CONTINUOUS: {
    label: 'Continuous Work',
    description: 'Inspector works continuously without scheduled rest days',
    icon: Clock,
    color: 'bg-blue-500'
  },
  SHIFT_BASED: {
    label: 'Shift-Based',
    description: 'Regular work/rest cycle (e.g., 14 days work, 7 days rest)',
    icon: RotateCcw,
    color: 'bg-green-500'
  },
  CUSTOM: {
    label: 'Custom Pattern',
    description: 'Custom work pattern defined by specific days',
    icon: Settings,
    color: 'bg-purple-500'
  }
} as const

export function WorkCycleManager({
  inspector,
  workCycle,
  onCreateCycle,
  onUpdateCycle,
  onResetCycle,
  onDeleteCycle,
  loading = false,
  className
}: WorkCycleManagerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<WorkCycleData>({
    type: workCycle?.type || 'SHIFT_BASED',
    startDate: workCycle?.startDate || new Date().toISOString().split('T')[0],
    workDays: workCycle?.workDays || 14,
    restDays: workCycle?.restDays || 7,
    customPattern: workCycle?.customPattern || []
  })
  const [showCalendar, setShowCalendar] = useState(false)
  const [resetDate, setResetDate] = useState<Date>(new Date())
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Generate cycle preview
  const generatePreview = (): CyclePreview => {
    const startDate = new Date(formData.startDate)
    const preview: CyclePreview = {
      workDays: [],
      restDays: [],
      pattern: []
    }

    if (formData.type === 'CONTINUOUS') {
      // For continuous, show next 30 days as work days
      for (let i = 0; i < 30; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        preview.workDays.push(date)
        preview.pattern.push('W')
      }
    } else if (formData.type === 'SHIFT_BASED') {
      // For shift-based, alternate between work and rest periods
      const cycleLength = formData.workDays + formData.restDays
      for (let i = 0; i < 60; i++) { // Show 60 days preview
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        const dayInCycle = i % cycleLength
        
        if (dayInCycle < formData.workDays) {
          preview.workDays.push(date)
          preview.pattern.push('W')
        } else {
          preview.restDays.push(date)
          preview.pattern.push('R')
        }
      }
    } else if (formData.type === 'CUSTOM') {
      // For custom, use the defined pattern
      const pattern = formData.customPattern || []
      if (pattern.length > 0) {
        for (let i = 0; i < 60; i++) {
          const date = new Date(startDate)
          date.setDate(date.getDate() + i)
          const patternIndex = i % pattern.length
          const dayType = pattern[patternIndex]
          
          if (dayType === 'W') {
            preview.workDays.push(date)
            preview.pattern.push('W')
          } else {
            preview.restDays.push(date)
            preview.pattern.push('R')
          }
        }
      }
    }

    return preview
  }

  const handleSave = async () => {
    try {
      if (workCycle) {
        await onUpdateCycle(workCycle.id, formData)
      } else {
        await onCreateCycle(formData)
      }
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save work cycle:', error)
    }
  }

  const handleReset = async () => {
    try {
      await onResetCycle(inspector.id, resetDate.toISOString().split('T')[0])
      setShowResetConfirm(false)
    } catch (error) {
      console.error('Failed to reset work cycle:', error)
    }
  }

  const handleDelete = async () => {
    if (workCycle && confirm('Are you sure you want to delete this work cycle?')) {
      try {
        await onDeleteCycle(workCycle.id)
      } catch (error) {
        console.error('Failed to delete work cycle:', error)
      }
    }
  }

  const updateCustomPattern = (pattern: string) => {
    // Convert pattern string to array (W = Work, R = Rest)
    const patternArray = pattern.split('').filter(char => ['W', 'R'].includes(char))
    setFormData(prev => ({ ...prev, customPattern: patternArray }))
  }

  const preview = generatePreview()
  const typeConfig = CYCLE_TYPE_CONFIG[formData.type]

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <span>Work Cycle Management</span>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {workCycle && !isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={loading}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Cycle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  disabled={loading}
                >
                  Edit
                </Button>
              </>
            )}
            
            {!workCycle && !isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                disabled={loading}
              >
                Create Work Cycle
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Cycle Info */}
        {workCycle && !isEditing && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn('w-3 h-3 rounded-full', typeConfig.color)} />
              <div>
                <h3 className="font-medium">{typeConfig.label}</h3>
                <p className="text-sm text-muted-foreground">{typeConfig.description}</p>
              </div>
              <Badge variant={workCycle.isActive ? 'default' : 'secondary'}>
                {workCycle.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <p className="text-sm font-medium">
                  {new Date(workCycle.startDate).toLocaleDateString('fa-IR')}
                </p>
              </div>
              
              {workCycle.type === 'SHIFT_BASED' && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Work Days</Label>
                    <p className="text-sm font-medium">{workCycle.workDays} days</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Rest Days</Label>
                    <p className="text-sm font-medium">{workCycle.restDays} days</p>
                  </div>
                </>
              )}
              
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm font-medium">
                  {new Date(workCycle.createdAt).toLocaleDateString('fa-IR')}
                </p>
              </div>
            </div>

            {workCycle.customPattern && workCycle.customPattern.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Custom Pattern</Label>
                <div className="flex flex-wrap gap-1">
                  {workCycle.customPattern.map((day, index) => (
                    <Badge
                      key={index}
                      variant={day === 'W' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {day === 'W' ? 'Work' : 'Rest'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit/Create Form */}
        {isEditing && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cycle-type">Cycle Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: WorkCycleType) => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CYCLE_TYPE_CONFIG).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <config.icon className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{config.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {config.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? (
                        new Date(formData.startDate).toLocaleDateString('fa-IR')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={new Date(formData.startDate)}
                      onSelect={(date) => {
                        if (date) {
                          setFormData(prev => ({ 
                            ...prev, 
                            startDate: date.toISOString().split('T')[0] 
                          }))
                          setShowCalendar(false)
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {formData.type === 'SHIFT_BASED' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="work-days">Work Days</Label>
                    <Input
                      id="work-days"
                      type="number"
                      min="1"
                      max="365"
                      value={formData.workDays}
                      onChange={(e) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          workDays: parseInt(e.target.value) || 0 
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rest-days">Rest Days</Label>
                    <Input
                      id="rest-days"
                      type="number"
                      min="0"
                      max="365"
                      value={formData.restDays}
                      onChange={(e) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          restDays: parseInt(e.target.value) || 0 
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              {formData.type === 'CUSTOM' && (
                <div className="space-y-2">
                  <Label htmlFor="custom-pattern">Custom Pattern</Label>
                  <Input
                    id="custom-pattern"
                    placeholder="Enter pattern (W=Work, R=Rest, e.g., WWWWWWWRRR)"
                    value={formData.customPattern?.join('') || ''}
                    onChange={(e) => updateCustomPattern(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use W for work days and R for rest days. Pattern will repeat.
                  </p>
                </div>
              )}
            </div>

            {/* Cycle Preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <Label className="text-sm font-medium">Cycle Preview (Next 30 days)</Label>
              </div>
              
              <div className="grid grid-cols-10 gap-1 p-3 bg-muted/50 rounded-lg">
                {preview.pattern.slice(0, 30).map((day, index) => (
                  <div
                    key={index}
                    className={cn(
                      'w-6 h-6 rounded text-xs flex items-center justify-center font-medium',
                      day === 'W' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-blue-500 text-white'
                    )}
                    title={day === 'W' ? 'Work Day' : 'Rest Day'}
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span>Work Days: {preview.workDays.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span>Rest Days: {preview.restDays.length}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={loading}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {workCycle ? 'Update Cycle' : 'Create Cycle'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              {workCycle && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete Cycle
                </Button>
              )}
            </div>
          </div>
        )}

        {/* No Cycle State */}
        {!workCycle && !isEditing && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No work cycle configured for this inspector. Create a work cycle to enable 
              automatic attendance tracking and scheduling.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Reset Work Cycle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This will create a new work cycle starting from the selected date. 
                  The current cycle will be deactivated.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label>New Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {resetDate.toLocaleDateString('fa-IR')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={resetDate}
                      onSelect={(date) => date && setResetDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex items-center gap-2">
                <Button onClick={handleReset} disabled={loading}>
                  Reset Cycle
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  )
}
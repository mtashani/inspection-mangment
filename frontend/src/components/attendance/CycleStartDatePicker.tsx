'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Settings, Eye, Save, RotateCcw } from 'lucide-react'
import { Inspector } from '@/types/inspector'

export type CycleType = '14_14' | '20_8' | 'custom'

export interface CycleTemplate {
  id: string
  name: string
  cycleType: CycleType
  workDays: number
  restDays: number
  description: string
  isDefault: boolean
}

interface CycleStartDatePickerProps {
  inspector: Inspector
  currentCycle?: any
  onDateSelect: (date: Date, cycleType: CycleType) => void
  onPreview: (date: Date, cycleType: CycleType) => void
  onReset: (inspector: Inspector) => void
  templates?: CycleTemplate[]
  disabled?: boolean
}

const defaultTemplates: CycleTemplate[] = [
  {
    id: '14_14',
    name: 'Standard 14+14',
    cycleType: '14_14',
    workDays: 14,
    restDays: 14,
    description: '14 work days and 14 rest days',
    isDefault: true
  },
  {
    id: '20_8',
    name: 'Extended 20+8',
    cycleType: '20_8',
    workDays: 20,
    restDays: 8,
    description: '20 work days and 8 rest days',
    isDefault: false
  },
  {
    id: 'custom',
    name: 'Custom',
    cycleType: 'custom',
    workDays: 0,
    restDays: 0,
    description: 'Manual configuration by admin',
    isDefault: false
  }
]

export function CycleStartDatePicker({
  inspector,
  currentCycle,
  onDateSelect,
  onPreview,
  onReset,
  templates = defaultTemplates,
  disabled = false
}: CycleStartDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedCycleType, setSelectedCycleType] = useState<CycleType>('14_14')
  const [customWorkDays, setCustomWorkDays] = useState(14)
  const [customRestDays, setCustomRestDays] = useState(14)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]

  const selectedTemplate = templates.find(t => t.cycleType === selectedCycleType)

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setIsPreviewMode(false)
  }

  const handleCycleTypeChange = (cycleType: CycleType) => {
    setSelectedCycleType(cycleType)
    setIsPreviewMode(false)
    
    // Reset custom values when changing from custom
    if (cycleType !== 'custom') {
      const template = templates.find(t => t.cycleType === cycleType)
      if (template) {
        setCustomWorkDays(template.workDays)
        setCustomRestDays(template.restDays)
      }
    }
  }

  const handlePreview = () => {
    if (!selectedDate) return
    
    const date = new Date(selectedDate)
    onPreview(date, selectedCycleType)
    setIsPreviewMode(true)
  }

  const handleApply = () => {
    if (!selectedDate) return
    
    const date = new Date(selectedDate)
    onDateSelect(date, selectedCycleType)
    setIsPreviewMode(false)
  }

  const handleReset = () => {
    onReset(inspector)
    setSelectedDate('')
    setSelectedCycleType('14_14')
    setIsPreviewMode(false)
  }

  const formatJalaliDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Settings className="w-5 h-5" />
          Cycle Management - {inspector.name}
        </CardTitle>
        <div className="text-sm text-blue-600">
          Configure work schedule start date and cycle type
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Configuration */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="start-date" className="text-sm font-medium">
                Select Cycle Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={today}
                disabled={disabled}
                className="mt-1"
              />
              {selectedDate && (
                <p className="text-xs text-gray-600 mt-1">
                  📅 {formatJalaliDate(selectedDate)}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Work Cycle Type</Label>
              <Select
                value={selectedCycleType}
                onValueChange={handleCycleTypeChange}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select cycle type" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.cycleType}>
                      <div className="flex items-center gap-2">
                        <span>{template.name}</span>
                        {template.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Cycle Configuration */}
            {selectedCycleType === 'custom' && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="work-days" className="text-sm">Work Days</Label>
                  <Input
                    id="work-days"
                    type="number"
                    min="1"
                    max="30"
                    value={customWorkDays}
                    onChange={(e) => setCustomWorkDays(parseInt(e.target.value) || 0)}
                    disabled={disabled}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="rest-days" className="text-sm">Rest Days</Label>
                  <Input
                    id="rest-days"
                    type="number"
                    min="1"
                    max="30"
                    value={customRestDays}
                    onChange={(e) => setCustomRestDays(parseInt(e.target.value) || 0)}
                    disabled={disabled}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Preview & Info */}
          <div className="space-y-4">
            {/* Current Cycle Info */}
            {currentCycle && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Current Cycle</h4>
                <div className="space-y-1 text-sm text-green-700">
                  <p>📅 Start: {currentCycle.startDate}</p>
                  <p>📅 End: {currentCycle.endDate}</p>
                  <p>⚙️ Type: {currentCycle.cycleType}</p>
                </div>
              </div>
            )}

            {/* Template Info */}
            {selectedTemplate && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Template Information</h4>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>📋 {selectedTemplate.description}</p>
                  <p>💼 Work: {selectedCycleType === 'custom' ? customWorkDays : selectedTemplate.workDays} days</p>
                  <p>🏠 Rest: {selectedCycleType === 'custom' ? customRestDays : selectedTemplate.restDays} days</p>
                  <p>🔄 Total cycle: {
                    (selectedCycleType === 'custom' ? customWorkDays + customRestDays : selectedTemplate.workDays + selectedTemplate.restDays)
                  } days</p>
                </div>
              </div>
            )}

            {/* Preview Status */}
            {isPreviewMode && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Preview Mode</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Calendar is displayed with new settings. Click &quot;Apply New Cycle&quot; to confirm changes.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t">
          <Button
            onClick={handlePreview}
            variant="outline"
            disabled={!selectedDate || disabled}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview Cycle
          </Button>

          <Button
            onClick={handleApply}
            disabled={!selectedDate || disabled}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Apply New Cycle
          </Button>

          <Button
            onClick={handleReset}
            variant="destructive"
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Cycle
          </Button>

          {isPreviewMode && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Preview Mode
            </Badge>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <p className="font-medium mb-1">Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Start Date: Specifies the beginning of work cycle</li>
            <li>Preview: View the cycle before applying changes</li>
            <li>Reset: Current cycle will be deleted and restart from beginning</li>
            <li>Changes are reversible after application</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
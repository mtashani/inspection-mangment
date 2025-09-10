'use client'

import { useState, useEffect } from 'react'
import { SpecialtyCode, Inspector } from '@/types/inspector'
import { useSpecialtyExtended } from '@/contexts/specialty-context'
import { useInspectors } from '@/contexts/inspectors-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronsUpDown, Shield, Settings, FileSpreadsheet, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InspectorSelectorProps {
  specialty?: SpecialtyCode
  role?: 'operator' | 'approver' | 'analyst'
  value?: number | number[]
  onChange: (value: number | number[]) => void
  placeholder?: string
  multiple?: boolean
  className?: string
  disabled?: boolean
  showAvailableOnly?: boolean
}

const SPECIALTY_ICONS = {
  PSV: <Shield className="w-4 h-4 text-blue-600" />,
  CRANE: <Settings className="w-4 h-4 text-green-600" />,
  CORROSION: <FileSpreadsheet className="w-4 h-4 text-orange-600" />
}

export default function InspectorSelector({
  specialty,
  role,
  value,
  onChange,
  placeholder = 'Select inspector...',
  multiple = false,
  className,
  disabled = false,
  showAvailableOnly = true
}: InspectorSelectorProps) {
  const [open, setOpen] = useState(false)
  const { getAvailableInspectors } = useSpecialtyExtended()
  const { inspectors } = useInspectors()
  const [availableInspectors, setAvailableInspectors] = useState<Inspector[]>([])

  useEffect(() => {
    let filteredInspectors: Inspector[]

    if (specialty) {
      // Get inspectors with specific specialty
      filteredInspectors = getAvailableInspectors(specialty)
    } else {
      // Get all inspectors
      filteredInspectors = showAvailableOnly 
        ? inspectors.filter(i => i.active && i.can_login)
        : inspectors
    }

    // Additional filtering by role if needed
    if (role) {
      // This could be enhanced based on role-based filtering logic
      // For now, we'll use the basic filtering
    }

    setAvailableInspectors(filteredInspectors)
  }, [specialty, role, showAvailableOnly, inspectors, getAvailableInspectors])

  const selectedInspectors = multiple
    ? availableInspectors.filter(inspector => 
        Array.isArray(value) && value.includes(inspector.id)
      )
    : availableInspectors.find(inspector => inspector.id === value)

  const handleSelect = (inspectorId: number) => {
    if (multiple) {
      const currentValue = Array.isArray(value) ? value : []
      const newValue = currentValue.includes(inspectorId)
        ? currentValue.filter(id => id !== inspectorId)
        : [...currentValue, inspectorId]
      onChange(newValue)
    } else {
      onChange(inspectorId)
      setOpen(false)
    }
  }

  const isSelected = (inspectorId: number) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(inspectorId)
    }
    return value === inspectorId
  }

  const getDisplayText = () => {
    if (multiple) {
      const selected = selectedInspectors as Inspector[]
      if (selected.length === 0) return placeholder
      if (selected.length === 1) return selected[0].name
      return `${selected.length} inspectors selected`
    } else {
      const selected = selectedInspectors as Inspector | undefined
      return selected?.name || placeholder
    }
  }

  const getInspectorSpecialtyBadges = (inspector: Inspector) => {
    return inspector.specialties.map(spec => (
      <Badge key={spec} variant="secondary" className="text-xs">
        {SPECIALTY_ICONS[spec as SpecialtyCode]}
        {spec}
      </Badge>
    ))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 truncate">
            <User className="w-4 h-4 text-gray-500" />
            <span className="truncate">{getDisplayText()}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search inspector..." />
          <CommandEmpty>No inspector found.</CommandEmpty>
          <CommandGroup>
            {availableInspectors.map((inspector) => (
              <CommandItem
                key={inspector.id}
                onSelect={() => handleSelect(inspector.id)}
                className="flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-3">
                  <Check
                    className={cn(
                      "h-4 w-4",
                      isSelected(inspector.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{inspector.name}</span>
                    <span className="text-sm text-gray-500">
                      {inspector.employee_id} - {inspector.inspector_type}
                    </span>
                    {inspector.specialties.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {getInspectorSpecialtyBadges(inspector)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Badge variant={inspector.active ? "default" : "secondary"} className="text-xs">
                    {inspector.active ? 'Active' : 'Inactive'}
                  </Badge>
                  {inspector.available && (
                    <Badge variant="outline" className="text-xs mt-1">
                      Available
                    </Badge>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Specialized selectors for specific use cases
export function PSVInspectorSelector(props: Omit<InspectorSelectorProps, 'specialty'>) {
  return <InspectorSelector {...props} specialty="PSV" />
}

export function CraneInspectorSelector(props: Omit<InspectorSelectorProps, 'specialty'>) {
  return <InspectorSelector {...props} specialty="CRANE" />
}

export function CorrosionInspectorSelector(props: Omit<InspectorSelectorProps, 'specialty'>) {
  return <InspectorSelector {...props} specialty="CORROSION" />
}

// Multi-select versions
export function MultiInspectorSelector(props: Omit<InspectorSelectorProps, 'multiple'>) {
  return <InspectorSelector {...props} multiple={true} />
}

export function MultiPSVInspectorSelector(props: Omit<InspectorSelectorProps, 'specialty' | 'multiple'>) {
  return <InspectorSelector {...props} specialty="PSV" multiple={true} />
}

export function MultiCraneInspectorSelector(props: Omit<InspectorSelectorProps, 'specialty' | 'multiple'>) {
  return <InspectorSelector {...props} specialty="CRANE" multiple={true} />
}

export function MultiCorrosionInspectorSelector(props: Omit<InspectorSelectorProps, 'specialty' | 'multiple'>) {
  return <InspectorSelector {...props} specialty="CORROSION" multiple={true} />
}
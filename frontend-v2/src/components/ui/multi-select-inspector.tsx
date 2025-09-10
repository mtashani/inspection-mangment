'use client'

import { useState } from 'react'
import { Check, ChevronDown, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Inspector {
  id: number
  name: string
}

interface MultiSelectInspectorProps {
  inspectors: Inspector[]
  selectedIds: number[]
  onSelectionChange: (selectedIds: number[]) => void
  placeholder?: string
  className?: string
  inModal?: boolean
}

export function MultiSelectInspector({
  inspectors,
  selectedIds,
  onSelectionChange,
  placeholder = "Select inspectors",
  className,
  inModal = false
}: MultiSelectInspectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const selectedInspectors = inspectors.filter(inspector => 
    selectedIds.includes(inspector.id)
  )

  const filteredInspectors = inspectors.filter(inspector =>
    inspector.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleInspector = (inspectorId: number) => {
    const newSelectedIds = selectedIds.includes(inspectorId)
      ? selectedIds.filter(id => id !== inspectorId)
      : [...selectedIds, inspectorId]
    
    onSelectionChange(newSelectedIds)
  }

  const removeInspector = (inspectorId: number) => {
    onSelectionChange(selectedIds.filter(id => id !== inspectorId))
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedIds.length === 0
                ? placeholder
                : `${selectedIds.length} inspector${selectedIds.length !== 1 ? 's' : ''} selected`
              }
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[300px] p-0 pointer-events-auto"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <div className="p-3 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inspectors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            {/* Inspector List */}
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {filteredInspectors.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No inspectors found.
                </div>
              ) : (
                filteredInspectors.map((inspector) => (
                  <div
                    key={inspector.id}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-accent cursor-pointer"
                    onClick={() => toggleInspector(inspector.id)}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        selectedIds.includes(inspector.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-background"
                      )}
                    >
                      {selectedIds.includes(inspector.id) && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                    <span className="flex-1 text-sm">{inspector.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected Inspectors Badges */}
      {selectedInspectors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedInspectors.map((inspector) => (
            <Badge key={inspector.id} variant="secondary" className="gap-1">
              {inspector.name}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => removeInspector(inspector.id)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
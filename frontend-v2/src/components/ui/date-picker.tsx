'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DatePickerProps {
  className?: string
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  disableFuture?: boolean
  disablePast?: boolean
  fromDate?: Date // Minimum allowed date
  toDate?: Date   // Maximum allowed date
  inModal?: boolean // New prop to handle modal z-index
}

export function DatePicker({
  className,
  date,
  onDateChange,
  placeholder = 'Pick a date',
  disabled = false,
  disableFuture = false,
  disablePast = false,
  fromDate, // New prop
  toDate,   // New prop
  inModal = false, // New prop
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)

  React.useEffect(() => {
    setSelectedDate(date)
  }, [date])

  const handleDateChange = (newDate: Date | undefined) => {
    setSelectedDate(newDate)
    onDateChange?.(newDate)
  }

  const handleTodayClick = () => {
    const today = new Date()
    handleDateChange(today)
  }

  const handleClearClick = () => {
    handleDateChange(undefined)
  }

  const getDisabledDates = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    
    // Check custom date range restrictions first
    if (fromDate) {
      const minDate = new Date(fromDate)
      minDate.setHours(0, 0, 0, 0)
      if (date < minDate) return true
    }
    
    if (toDate) {
      const maxDate = new Date(toDate)
      maxDate.setHours(0, 0, 0, 0)
      if (date > maxDate) return true
    }
    
    // Apply general restrictions if no custom range is set
    if (!fromDate && !toDate) {
      if (disableFuture && date > today) return true
      if (disablePast && date < today) return true
    }
    
    return false
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover modal={inModal}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !selectedDate && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, 'PPP')
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 z-[9999]" 
          align="start"
          side="bottom"
          sideOffset={8}
        >
          <div className="p-3 border-b">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTodayClick}
                className="h-7 px-2 text-xs"
                disabled={disableFuture || getDisabledDates(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearClick}
                className="h-7 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateChange}
            disabled={getDisabledDates}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
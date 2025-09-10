'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DateRangePickerProps {
  className?: string
  dateRange?: DateRange
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
  disableFuture?: boolean
  disablePast?: boolean
  minDate?: Date // Minimum selectable date
  maxDate?: Date // Maximum selectable date
  modal?: boolean // Prevent premature closing in modals
}

export function DateRangePicker({
  className,
  dateRange,
  onDateRangeChange,
  placeholder = 'Pick a date range',
  disabled = false,
  disableFuture = false,
  disablePast = false,
  minDate,
  maxDate,
  modal = false,
}: DateRangePickerProps) {
  const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>(dateRange)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setSelectedRange(dateRange)
  }, [dateRange])

  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('📅 DateRangePicker - Date selection:', {
        modal,
        hasFrom: !!newRange?.from,
        hasTo: !!newRange?.to,
        willClose: !modal && newRange?.from && newRange?.to,
        newRange
      })
    }
    
    setSelectedRange(newRange)
    onDateRangeChange?.(newRange)
    
    // Auto-close only when both dates are selected AND we're not in modal mode
    // In modal mode, never auto-close to prevent interference
    // In inline mode, only close when we have a complete range (both from and to)
    // FIXED: Don't auto-close in search filters to allow better UX
    if (!modal && newRange?.from && newRange?.to) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📅 DateRangePicker - Auto-closing popover (both dates selected)')
      }
      // Add a small delay to allow user to see the selection before closing
      setTimeout(() => {
        setIsOpen(false)
      }, 150)
    }
  }

  const handleTodayClick = () => {
    const today = new Date()
    // Check if today is within allowed range
    if (getDisabledDates(today)) return
    const range = { from: today, to: today }
    handleDateRangeChange(range)
  }

  const handleThisWeekClick = () => {
    const today = new Date()
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
    const endOfWeek = new Date(today.setDate(startOfWeek.getDate() + 6))
    
    // Adjust range to fit within constraints
    let fromDate = startOfWeek
    let toDate = endOfWeek
    
    if (minDate && fromDate < minDate) fromDate = new Date(minDate)
    if (maxDate && toDate > maxDate) toDate = new Date(maxDate)
    
    // Check if the adjusted range is valid
    if (fromDate <= toDate && !getDisabledDates(fromDate) && !getDisabledDates(toDate)) {
      const range = { from: fromDate, to: toDate }
      handleDateRangeChange(range)
    }
  }

  const handleThisMonthClick = () => {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    // Adjust range to fit within constraints
    let fromDate = startOfMonth
    let toDate = endOfMonth
    
    if (minDate && fromDate < minDate) fromDate = new Date(minDate)
    if (maxDate && toDate > maxDate) toDate = new Date(maxDate)
    
    // Check if the adjusted range is valid
    if (fromDate <= toDate && !getDisabledDates(fromDate) && !getDisabledDates(toDate)) {
      const range = { from: fromDate, to: toDate }
      handleDateRangeChange(range)
    }
  }

  const handleClearClick = () => {
    handleDateRangeChange(undefined)
  }

  const getDisabledDates = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    
    // Check basic future/past constraints
    if (disableFuture && date > today) return true
    if (disablePast && date < today) return true
    
    // Check custom date range constraints
    if (minDate) {
      const minDateCopy = new Date(minDate)
      minDateCopy.setHours(0, 0, 0, 0)
      if (date < minDateCopy) return true
    }
    
    if (maxDate) {
      const maxDateCopy = new Date(maxDate)
      maxDateCopy.setHours(0, 0, 0, 0)
      if (date > maxDateCopy) return true
    }
    
    return false
  }

  const formatDateRange = () => {
    if (!selectedRange?.from) {
      return placeholder
    }

    if (selectedRange.to) {
      return `${format(selectedRange.from, 'LLL dd, y')} - ${format(selectedRange.to, 'LLL dd, y')}`
    }

    return format(selectedRange.from, 'LLL dd, y')
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen} modal={modal}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !selectedRange && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 z-[9999]" 
          align="start"
          side="bottom"
          sideOffset={8}
          forceMount
        >
          {/* Preset buttons */}
          <div className="p-3 border-b">
            <div className="flex gap-2 flex-wrap">
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
                onClick={handleThisWeekClick}
                className="h-7 px-2 text-xs"
                disabled={disableFuture}
              >
                This Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleThisMonthClick}
                className="h-7 px-2 text-xs"
                disabled={disableFuture}
              >
                This Month
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
          
          {/* Calendar */}
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={handleDateRangeChange}
            disabled={getDisabledDates}
            initialFocus
            numberOfMonths={2}
            fromDate={minDate}
            toDate={maxDate}
            // Smart month positioning based on constraints
            defaultMonth={
              disablePast ? new Date() : // When past disabled, start from current month
              disableFuture ? new Date(new Date().getFullYear(), new Date().getMonth() - 1) : // When future disabled, show previous month first
              selectedRange?.from || new Date() // Default to selected date or current
            }
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
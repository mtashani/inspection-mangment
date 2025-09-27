'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Globe, CalendarDays } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

// Persian calendar support utilities (same as single picker)
const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
]

const gregorianToPersian = (date: Date): { year: number; month: number; day: number } => {
  const greg = new Date(date)
  const year = greg.getFullYear() - 621
  const month = greg.getMonth() + 1
  const day = greg.getDate()
  return { year, month, day }
}

const formatPersianDate = (date: Date): string => {
  const persian = gregorianToPersian(date)
  return `${persian.year}/${persian.month.toString().padStart(2, '0')}/${persian.day.toString().padStart(2, '0')}`
}

interface DualCalendarDateRangePickerProps {
  className?: string
  dateRange?: DateRange
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
  disableFuture?: boolean
  disablePast?: boolean
  minDate?: Date
  maxDate?: Date
  modal?: boolean
  defaultCalendar?: 'gregorian' | 'jalali'
}

export function DualCalendarDateRangePicker({
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
  defaultCalendar = 'gregorian'
}: DualCalendarDateRangePickerProps) {
  const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>(dateRange)
  const [activeCalendar, setActiveCalendar] = React.useState(defaultCalendar)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setSelectedRange(dateRange)
  }, [dateRange])

  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    setSelectedRange(newRange)
    onDateRangeChange?.(newRange)
    
    // Auto-close when both dates are selected
    if (!modal && newRange?.from && newRange?.to) {
      setTimeout(() => {
        setIsOpen(false)
      }, 150)
    }
  }

  const handleTodayClick = () => {
    const today = new Date()
    if (!getDisabledDates(today)) {
      const range = { from: today, to: today }
      handleDateRangeChange(range)
    }
  }

  const handleThisWeekClick = () => {
    const today = new Date()
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
    const endOfWeek = new Date(today.setDate(startOfWeek.getDate() + 6))
    
    let fromDate = startOfWeek
    let toDate = endOfWeek
    
    if (minDate && fromDate < minDate) fromDate = new Date(minDate)
    if (maxDate && toDate > maxDate) toDate = new Date(maxDate)
    
    if (fromDate <= toDate && !getDisabledDates(fromDate) && !getDisabledDates(toDate)) {
      const range = { from: fromDate, to: toDate }
      handleDateRangeChange(range)
    }
  }

  const handleThisMonthClick = () => {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    let fromDate = startOfMonth
    let toDate = endOfMonth
    
    if (minDate && fromDate < minDate) fromDate = new Date(minDate)
    if (maxDate && toDate > maxDate) toDate = new Date(maxDate)
    
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
    
    if (disableFuture && date > today) return true
    if (disablePast && date < today) return true
    
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

    const formatDate = (date: Date) => {
      if (activeCalendar === 'jalali') {
        return formatPersianDate(date)
      }
      return format(date, 'MMM dd, y')
    }

    if (selectedRange.to) {
      return `${formatDate(selectedRange.from)} - ${formatDate(selectedRange.to)}`
    }

    return formatDate(selectedRange.from)
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
            <div className="flex items-center gap-2">
              <span>{formatDateRange()}</span>
              {selectedRange?.from && (
                <Badge variant="secondary" className="text-xs">
                  {activeCalendar === 'jalali' ? 'شمسی' : 'Gregorian'}
                </Badge>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 z-[9999]" 
          align="start"
          side="bottom"
          sideOffset={8}
          forceMount
        >
          <Tabs value={activeCalendar} onValueChange={(value) => setActiveCalendar(value as 'gregorian' | 'jalali')}>
            <div className="p-3 border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="gregorian" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <span className="text-xs">Gregorian</span>
                </TabsTrigger>
                <TabsTrigger value="jalali" className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  <span className="text-xs">شمسی</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="gregorian" className="m-0">
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
              
              <Calendar
                mode="range"
                selected={selectedRange}
                onSelect={handleDateRangeChange}
                disabled={getDisabledDates}
                initialFocus
                numberOfMonths={2}
                fromDate={minDate}
                toDate={maxDate}
                defaultMonth={
                  disablePast ? new Date() : 
                  disableFuture ? new Date(new Date().getFullYear(), new Date().getMonth() - 1) : 
                  selectedRange?.from || new Date()
                }
              />
            </TabsContent>

            <TabsContent value="jalali" className="m-0">
              {/* Persian preset buttons */}
              <div className="p-3 border-b">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTodayClick}
                    className="h-7 px-2 text-xs"
                    disabled={disableFuture || getDisabledDates(new Date())}
                  >
                    امروز
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleThisWeekClick}
                    className="h-7 px-2 text-xs"
                    disabled={disableFuture}
                  >
                    این هفته
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleThisMonthClick}
                    className="h-7 px-2 text-xs"
                    disabled={disableFuture}
                  >
                    این ماه
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearClick}
                    className="h-7 px-2 text-xs"
                  >
                    پاک کردن
                  </Button>
                </div>
              </div>
              
              {/* Persian Calendar Display */}
              <div className="p-4">
                {selectedRange?.from && (
                  <div className="text-center mb-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {selectedRange.to ? (
                          `${formatPersianDate(selectedRange.from)} - ${formatPersianDate(selectedRange.to)}`
                        ) : (
                          formatPersianDate(selectedRange.from)
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedRange.to ? (
                          `${format(selectedRange.from, 'MMM dd, yyyy')} - ${format(selectedRange.to, 'MMM dd, yyyy')}`
                        ) : (
                          format(selectedRange.from, 'MMM dd, yyyy')
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">
                    برای انتخاب دقیق تاریخ، از تقویم میلادی استفاده کنید
                  </div>
                  <Calendar
                    mode="range"
                    selected={selectedRange}
                    onSelect={handleDateRangeChange}
                    disabled={getDisabledDates}
                    initialFocus={false}
                    numberOfMonths={2}
                    fromDate={minDate}
                    toDate={maxDate}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Selected Range Display */}
          {selectedRange?.from && (
            <div className="p-3 border-t bg-muted/50">
              <div className="text-xs text-center space-y-1">
                <div>
                  Gregorian: {selectedRange.to ? (
                    `${format(selectedRange.from, 'MMM dd, yyyy')} - ${format(selectedRange.to, 'MMM dd, yyyy')}`
                  ) : (
                    format(selectedRange.from, 'MMM dd, yyyy')
                  )}
                </div>
                <div>
                  شمسی: {selectedRange.to ? (
                    `${formatPersianDate(selectedRange.from)} - ${formatPersianDate(selectedRange.to)}`
                  ) : (
                    formatPersianDate(selectedRange.from)
                  )}
                </div>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
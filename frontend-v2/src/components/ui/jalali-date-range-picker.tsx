'use client'

import * as React from 'react'
import { Calendar as CalendarIcon, Globe, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
import { DayPicker } from 'react-day-picker'
import { format } from 'date-fns'
import { format as formatJalali } from 'date-fns-jalali'
import type { DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import '@/styles/jalali-calendar.css'

interface JalaliDateRangePickerProps {
  className?: string
  dateRange?: DateRange
  onDateRangeChange?: (range: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
  disableFuture?: boolean
  disablePast?: boolean
  fromDate?: Date
  toDate?: Date
  inModal?: boolean
  showBothCalendars?: boolean
}

export function JalaliDateRangePicker({
  className,
  dateRange,
  onDateRangeChange,
  placeholder = 'انتخاب بازه تاریخ',
  disabled = false,
  disableFuture = false,
  disablePast = false,
  fromDate,
  toDate,
  inModal = false,
  showBothCalendars = true
}: JalaliDateRangePickerProps) {
  const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>(dateRange)
  const [activeCalendar, setActiveCalendar] = React.useState<'gregorian' | 'jalali'>('jalali')
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setSelectedRange(dateRange)
  }, [dateRange])

  const handleRangeChange = (range: DateRange | undefined) => {
    setSelectedRange(range)
    onDateRangeChange?.(range)
  }

  const handleTodayClick = () => {
    const today = new Date()
    if (!getDisabledDates(today)) {
      handleRangeChange({ from: today, to: today })
      setIsOpen(false)
    }
  }

  const handleClearClick = () => {
    handleRangeChange(undefined)
    setIsOpen(false)
  }

  const handleLastWeekClick = () => {
    const today = new Date()
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    if (!getDisabledDates(lastWeek) && !getDisabledDates(today)) {
      handleRangeChange({ from: lastWeek, to: today })
      setIsOpen(false)
    }
  }

  const handleLastMonthClick = () => {
    const today = new Date()
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
    if (!getDisabledDates(lastMonth) && !getDisabledDates(today)) {
      handleRangeChange({ from: lastMonth, to: today })
      setIsOpen(false)
    }
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

  const formatDisplayRange = (range: DateRange) => {
    if (!range?.from) return null
    
    const fromStr = activeCalendar === 'jalali' 
      ? formatJalali(range.from, 'yyyy/MM/dd')
      : format(range.from, 'MMM dd, yyyy')
    
    if (!range.to) {
      return fromStr
    }
    
    const toStr = activeCalendar === 'jalali'
      ? formatJalali(range.to, 'yyyy/MM/dd')
      : format(range.to, 'MMM dd, yyyy')
    
    return `${fromStr} - ${toStr}`
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen} modal={inModal}>
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
            {selectedRange ? (
              <div className="flex items-center gap-2">
                <span>{formatDisplayRange(selectedRange)}</span>
                <Badge variant="secondary" className="text-xs">
                  {activeCalendar === 'jalali' ? 'شمسی' : 'میلادی'}
                </Badge>
              </div>
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
          {showBothCalendars ? (
            <Tabs value={activeCalendar} onValueChange={(value) => setActiveCalendar(value as 'gregorian' | 'jalali')}>
              <div className="p-3 border-b">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="jalali" className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    <span className="text-xs">شمسی</span>
                  </TabsTrigger>
                  <TabsTrigger value="gregorian" className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    <span className="text-xs">میلادی</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {showBothCalendars && (
                <TabsContent value="gregorian" className="m-0">
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
                        onClick={handleLastWeekClick}
                        className="h-7 px-2 text-xs"
                      >
                        Last 7 days
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLastMonthClick}
                        className="h-7 px-2 text-xs"
                      >
                        Last 30 days
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
                  <div className="p-3">
                    <DayPicker
                      mode="range"
                      selected={selectedRange}
                      onSelect={handleRangeChange}
                      disabled={getDisabledDates}
                      numberOfMonths={2}
                      className="!m-0"
                    />
                  </div>
                </TabsContent>
              )}

              <TabsContent value="jalali" className="m-0">
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
                      onClick={handleLastWeekClick}
                      className="h-7 px-2 text-xs"
                    >
                      ۷ روز گذشته
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLastMonthClick}
                      className="h-7 px-2 text-xs"
                    >
                      ۳۰ روز گذشته
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
                
                <div className="p-3">
                  <DayPicker
                    mode="range"
                    selected={selectedRange}
                    onSelect={handleRangeChange}
                    disabled={getDisabledDates}
                    numberOfMonths={2}
                    dir="rtl"
                    locale={{ code: 'fa-IR' }}
                    className="!m-0 jalali-calendar"
                    classNames={{
                      months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                      month: 'space-y-4',
                      caption: 'flex justify-center pt-1 relative items-center',
                      caption_label: 'text-sm font-medium',
                      nav: 'space-x-1 flex items-center',
                      nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                      nav_button_previous: 'absolute left-1',
                      nav_button_next: 'absolute right-1',
                      table: 'w-full border-collapse space-y-1',
                      head_row: 'flex',
                      head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
                      row: 'flex w-full mt-2',
                      cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                      day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
                      day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                      day_today: 'bg-accent text-accent-foreground',
                      day_outside: 'text-muted-foreground opacity-50',
                      day_disabled: 'text-muted-foreground opacity-50',
                      day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
                      day_range_start: 'day-range-start',
                      day_range_end: 'day-range-end',
                      day_hidden: 'invisible',
                    }}
                    formatters={{
                      formatCaption: (date) => formatJalali(date, 'MMMM yyyy'),
                      formatWeekdayName: (date) => {
                        const weekdays = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']
                        return weekdays[date.getDay()]
                      },
                      formatDay: (date) => formatJalali(date, 'd')
                    }}
                  />
                </div>
              </TabsContent>

              {/* Selected Range Display */}
              {selectedRange && (
                <div className="p-3 border-t bg-muted/50">
                  <div className="text-xs text-center space-y-1">
                    <div>میلادی: {selectedRange.from && format(selectedRange.from, 'MMM dd, yyyy')} {selectedRange.to && selectedRange.to !== selectedRange.from && `- ${format(selectedRange.to, 'MMM dd, yyyy')}`}</div>
                    <div>شمسی: {selectedRange.from && formatJalali(selectedRange.from, 'dd MMMM yyyy')} {selectedRange.to && selectedRange.to !== selectedRange.from && `- ${formatJalali(selectedRange.to, 'dd MMMM yyyy')}`}</div>
                  </div>
                </div>
              )}
            </Tabs>
          ) : (
            <div>
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
                    onClick={handleLastWeekClick}
                    className="h-7 px-2 text-xs"
                  >
                    ۷ روز گذشته
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLastMonthClick}
                    className="h-7 px-2 text-xs"
                  >
                    ۳۰ روز گذشته
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
              
              <div className="p-3">
                <DayPicker
                  mode="range"
                  selected={selectedRange}
                  onSelect={handleRangeChange}
                  disabled={getDisabledDates}
                  numberOfMonths={2}
                  dir="rtl"
                  locale={{ code: 'fa-IR' }}
                  className="!m-0 jalali-calendar"
                  classNames={{
                    months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                    month: 'space-y-4',
                    caption: 'flex justify-center pt-1 relative items-center',
                    caption_label: 'text-sm font-medium',
                    nav: 'space-x-1 flex items-center',
                    nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                    nav_button_previous: 'absolute left-1',
                    nav_button_next: 'absolute right-1',
                    table: 'w-full border-collapse space-y-1',
                    head_row: 'flex',
                    head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
                    row: 'flex w-full mt-2',
                    cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                    day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
                    day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                    day_today: 'bg-accent text-accent-foreground',
                    day_outside: 'text-muted-foreground opacity-50',
                    day_disabled: 'text-muted-foreground opacity-50',
                    day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
                    day_range_start: 'day-range-start',
                    day_range_end: 'day-range-end',
                    day_hidden: 'invisible',
                  }}
                  formatters={{
                    formatCaption: (date) => formatJalali(date, 'MMMM yyyy'),
                    formatWeekdayName: (date) => {
                      const weekdays = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']
                      return weekdays[date.getDay()]
                    },
                    formatDay: (date) => formatJalali(date, 'd')
                  }}
                />
              </div>
              
              {/* Selected Range Display */}
              {selectedRange && (
                <div className="p-3 border-t bg-muted/50">
                  <div className="text-xs text-center">
                    <div>شمسی: {selectedRange.from && formatJalali(selectedRange.from, 'dd MMMM yyyy')} {selectedRange.to && selectedRange.to !== selectedRange.from && `- ${formatJalali(selectedRange.to, 'dd MMMM yyyy')}`}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default JalaliDateRangePicker
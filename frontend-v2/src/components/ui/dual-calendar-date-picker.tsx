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
import { format as formatJalali, isValid, parse } from 'date-fns-jalali'
import 'react-day-picker/style.css'
import '@/styles/jalali-calendar.css'

interface JalaliDatePickerProps {
  className?: string
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  disableFuture?: boolean
  disablePast?: boolean
  fromDate?: Date
  toDate?: Date
  inModal?: boolean
  showBothCalendars?: boolean
}

export function JalaliDatePicker({
  className,
  date,
  onDateChange,
  placeholder = 'انتخاب تاریخ',
  disabled = false,
  disableFuture = false,
  disablePast = false,
  fromDate,
  toDate,
  inModal = false,
  showBothCalendars = true
}: JalaliDatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [activeCalendar, setActiveCalendar] = React.useState<'gregorian' | 'jalali'>('jalali')
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setSelectedDate(date)
  }, [date])

  const handleDateChange = (newDate: Date | undefined) => {
    setSelectedDate(newDate)
    onDateChange?.(newDate)
  }

  const handleTodayClick = () => {
    const today = new Date()
    if (!getDisabledDates(today)) {
      handleDateChange(today)
      setIsOpen(false)
    }
  }

  const handleClearClick = () => {
    handleDateChange(undefined)
    setIsOpen(false)
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

  const formatDisplayDate = (date: Date) => {
    if (activeCalendar === 'jalali') {
      return formatJalali(date, 'yyyy/MM/dd')
    }
    return format(date, 'MMM dd, yyyy')
  }

  // Jalali calendar configuration
  const jalaliLocale = {
    localize: {
      day: (n: number) => {
        const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه']
        return days[n]
      },
      month: (n: number) => {
        const months = [
          'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
          'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ]
        return months[n]
      }
    },
    formatLong: {
      date: () => 'yyyy/MM/dd'
    }
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen} modal={inModal}>
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
              <div className="flex items-center gap-2">
                <span>{formatDisplayDate(selectedDate)}</span>
                <Badge variant="secondary" className="text-xs">
                  {activeCalendar === 'jalali' ? 'شمسی' : 'Gregorian'}
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
                <div className="p-3">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    disabled={getDisabledDates}
                    className="!m-0"
                  />
                </div>
              </TabsContent>
            )}

            <TabsContent value="jalali" className="m-0">
              <div className="p-3 border-b">
                <div className="flex gap-2">
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
                    onClick={handleClearClick}
                    className="h-7 px-2 text-xs"
                  >
                    پاک کردن
                  </Button>
                </div>
              </div>
              
              <div className="p-3">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  disabled={getDisabledDates}
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
                    cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                    day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
                    day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                    day_today: 'bg-accent text-accent-foreground',
                    day_outside: 'text-muted-foreground opacity-50',
                    day_disabled: 'text-muted-foreground opacity-50',
                    day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
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
          </Tabs>
          ) : (
            <div>
              <div className="p-3 border-b">
                <div className="flex gap-2">
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
                    onClick={handleClearClick}
                    className="h-7 px-2 text-xs"
                  >
                    پاک کردن
                  </Button>
                </div>
              </div>
              
              <div className="p-3">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  disabled={getDisabledDates}
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
                    cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                    day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
                    day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                    day_today: 'bg-accent text-accent-foreground',
                    day_outside: 'text-muted-foreground opacity-50',
                    day_disabled: 'text-muted-foreground opacity-50',
                    day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
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
            </div>
          )}

          {/* Selected Date Display */}
          {selectedDate && (
            <div className="p-3 border-t bg-muted/50">
              <div className="text-xs text-center space-y-1">
                <div>میلادی: {format(selectedDate, 'EEEE, MMMM dd, yyyy')}</div>
                <div>شمسی: {formatJalali(selectedDate, 'EEEE، dd MMMM yyyy')}</div>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
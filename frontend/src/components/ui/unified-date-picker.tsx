"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Calendar as CalendarIconLucide,
  Globe,
  Today,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Jalali calendar utilities
const jalaliMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const jalaliWeekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// Date presets
const datePresets = [
  { id: 'today', label: 'Today', value: () => new Date() },
  { id: 'yesterday', label: 'Yesterday', value: () => new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { id: 'week', label: 'Last Week', value: () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  { id: 'month', label: 'Last Month', value: () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  { id: 'quarter', label: 'Last Quarter', value: () => new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
  { id: 'year', label: 'Last Year', value: () => new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
];

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface UnifiedDatePickerProps {
  value?: Date | DateRange;
  onChange: (date: Date | DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  variant?: 'default' | 'jalali' | 'range' | 'inline' | 'time';
  className?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  showPresets?: boolean;
  showTime?: boolean;
  showWeekNumbers?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  locale?: 'en' | 'fa';
  direction?: 'ltr' | 'rtl';
  animations?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

// Jalali date conversion utilities (simplified)
const toJalali = (date: Date) => {
  // This is a simplified conversion - in production, use a proper Jalali library
  const jalaliDate = date.toLocaleDateString('fa-IR-u-ca-persian');
  return jalaliDate;
};

const fromJalali = (jalaliString: string) => {
  // This is a simplified conversion - in production, use a proper Jalali library
  try {
    return new Date(jalaliString);
  } catch {
    return new Date();
  }
};

export function UnifiedDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  variant = 'default',
  className,
  error,
  size = 'md',
  showPresets = false,
  showTime = false,
  showWeekNumbers = false,
  minDate,
  maxDate,
  disabledDates = [],
  locale = 'en',
  direction = 'ltr',
  animations = true,
  onFocus,
  onBlur
}: UnifiedDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState({ hours: 12, minutes: 0 });
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const inputRef = useRef<HTMLInputElement>(null);

  const sizes = {
    sm: 'h-8 text-sm',
    md: 'h-10',
    lg: 'h-12 text-lg'
  };

  const formatDisplayDate = (date: Date | DateRange | undefined) => {
    if (!date) return "";
    
    if (variant === 'range' && typeof date === 'object' && 'from' in date) {
      const { from, to } = date as DateRange;
      if (from && to) {
        return `${formatSingleDate(from)} - ${formatSingleDate(to)}`;
      } else if (from) {
        return `${formatSingleDate(from)} - ...`;
      }
      return "";
    }
    
    return formatSingleDate(date as Date);
  };

  const formatSingleDate = (date: Date) => {
    if (variant === 'jalali' || locale === 'fa') {
      return toJalali(date);
    }
    
    if (showTime) {
      return format(date, "PPP p");
    }
    
    return format(date, "PPP");
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    if (variant === 'range') {
      const currentRange = (value as DateRange) || { from: undefined, to: undefined };
      
      if (!currentRange.from || (currentRange.from && currentRange.to)) {
        // Start new range
        onChange({ from: selectedDate, to: undefined });
      } else {
        // Complete range
        const from = currentRange.from;
        const to = selectedDate;
        onChange({
          from: from < to ? from : to,
          to: from < to ? to : from
        });
        setIsOpen(false);
      }
    } else {
      if (showTime) {
        const dateWithTime = new Date(selectedDate);
        dateWithTime.setHours(selectedTime.hours, selectedTime.minutes);
        onChange(dateWithTime);
      } else {
        onChange(selectedDate);
      }
      
      if (variant !== 'inline') {
        setIsOpen(false);
      }
    }
  };

  const handlePresetSelect = (preset: typeof datePresets[0]) => {
    const date = preset.value();
    onChange(date);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  const handleTimeChange = (type: 'hours' | 'minutes', value: number) => {
    setSelectedTime(prev => ({ ...prev, [type]: value }));
    
    if (value && typeof value === 'object' && 'getTime' in value) {
      const dateWithTime = new Date(value as Date);
      dateWithTime.setHours(selectedTime.hours, selectedTime.minutes);
      onChange(dateWithTime);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          setIsOpen(false);
          break;
        case 'Enter':
          if (currentMonth) {
            handleDateSelect(currentMonth);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, currentMonth, handleDateSelect]);

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (disabledDates.some(disabled => 
      disabled.toDateString() === date.toDateString()
    )) return true;
    return false;
  };

  // Render inline calendar for inline variant
  if (variant === 'inline') {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="border border-[var(--color-border-primary)] rounded-lg p-4 bg-[var(--color-bg-primary)]">
          <JalaliCalendar
            value={value as Date}
            onChange={handleDateSelect}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            variant={variant}
            locale={locale}
            direction={direction}
            showWeekNumbers={showWeekNumbers}
            isDateDisabled={isDateDisabled}
            animations={animations}
          />
          
          {showTime && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border-primary)]">
              <TimeSelector
                hours={selectedTime.hours}
                minutes={selectedTime.minutes}
                onChange={handleTimeChange}
              />
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-[var(--color-error-main)]">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={inputRef}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal transition-all duration-200",
              sizes[size],
              !value && "text-[var(--color-text-secondary)]",
              error && "border-[var(--color-error-main)] focus:border-[var(--color-error-main)] focus:ring-[var(--color-error-light)]",
              !error && "border-[var(--color-border-primary)] focus:border-[var(--color-primary-600)] focus:ring-[var(--color-primary-100)]",
              direction === 'rtl' && "flex-row-reverse",
              className
            )}
            onFocus={onFocus}
            onBlur={onBlur}
          >
            <CalendarIcon className={cn(
              "h-4 w-4 shrink-0",
              direction === 'rtl' ? "ml-2" : "mr-2"
            )} />
            <span className="truncate flex-1">
              {value ? formatDisplayDate(value) : placeholder}
            </span>
            {value && !disabled && (
              <X
                className={cn(
                  "h-4 w-4 opacity-50 hover:opacity-100 transition-opacity",
                  direction === 'rtl' ? "mr-auto" : "ml-auto"
                )}
                onClick={handleClear}
              />
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className={cn(
            "w-auto p-0 shadow-lg border border-[var(--color-border-primary)]",
            animations && "animate-in fade-in-0 zoom-in-95"
          )} 
          align="start"
          side="bottom"
        >
          <div className="flex">
            {/* Presets Sidebar */}
            {showPresets && (
              <div className="border-r border-[var(--color-border-primary)] p-2 space-y-1 min-w-[120px]">
                <div className="text-xs font-medium text-[var(--color-text-secondary)] px-2 py-1">
                  Quick Select
                </div>
                {datePresets.map(preset => (
                  <Button
                    key={preset.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-8"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    <Today className="w-3 h-3 mr-2" />
                    {preset.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Main Calendar */}
            <div className="p-3">
              <JalaliCalendar
                value={value as Date | DateRange}
                onChange={handleDateSelect}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                variant={variant}
                locale={locale}
                direction={direction}
                showWeekNumbers={showWeekNumbers}
                isDateDisabled={isDateDisabled}
                animations={animations}
              />
              
              {/* Time Selector */}
              {showTime && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border-primary)]">
                  <TimeSelector
                    hours={selectedTime.hours}
                    minutes={selectedTime.minutes}
                    onChange={handleTimeChange}
                  />
                </div>
              )}
              
              {/* Footer Actions */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border-primary)]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDateSelect(new Date())}
                  className="text-xs"
                >
                  Today
                </Button>
                
                <div className="flex items-center gap-2">
                  {variant === 'range' && (
                    <Badge variant="outline" className="text-xs">
                      {value && typeof value === 'object' && 'from' in value && value.from && value.to
                        ? 'Range Selected'
                        : value && typeof value === 'object' && 'from' in value && value.from
                        ? 'Select End Date'
                        : 'Select Start Date'
                      }
                    </Badge>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {error && (
        <p className="text-sm text-[var(--color-error-main)] flex items-center gap-1 mt-1">
          <X className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// Jalali Calendar Component
interface JalaliCalendarProps {
  value: Date | DateRange | undefined;
  onChange: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  variant: string;
  locale: string;
  direction: string;
  showWeekNumbers: boolean;
  isDateDisabled: (date: Date) => boolean;
  animations: boolean;
}

function JalaliCalendar({
  value,
  onChange,
  currentMonth,
  onMonthChange,
  variant,
  locale,
  direction,
  showWeekNumbers,
  isDateDisabled,
  animations
}: JalaliCalendarProps) {
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  
  const isJalali = variant === 'jalali' || locale === 'fa';
  const months = isJalali ? jalaliMonths : [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const weekDays = isJalali ? jalaliWeekDays : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    onMonthChange(newMonth);
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setFullYear(currentMonth.getFullYear() + (direction === 'next' ? 1 : -1));
    onMonthChange(newMonth);
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Previous month's trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Next month's leading days
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  const isDateSelected = (date: Date) => {
    if (!value) return false;
    
    if (variant === 'range' && typeof value === 'object' && 'from' in value) {
      const range = value as DateRange;
      if (range.from && range.to) {
        return date >= range.from && date <= range.to;
      }
      return range.from && date.toDateString() === range.from.toDateString();
    }
    
    return value && typeof value === 'object' && 'getTime' in value && 
           date.toDateString() === (value as Date).toDateString();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (viewMode === 'months') {
    return (
      <div className="w-64">
        {/* Month/Year Header */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateYear('prev')}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setViewMode('years')}
            className="font-medium"
          >
            {currentMonth.getFullYear()}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateYear('next')}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Months Grid */}
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, index) => (
            <Button
              key={month}
              variant={currentMonth.getMonth() === index ? 'default' : 'ghost'}
              size="sm"
              className="h-10"
              onClick={() => {
                const newMonth = new Date(currentMonth);
                newMonth.setMonth(index);
                onMonthChange(newMonth);
                setViewMode('days');
              }}
            >
              {month}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (viewMode === 'years') {
    const currentYear = currentMonth.getFullYear();
    const startYear = Math.floor(currentYear / 10) * 10;
    const years = Array.from({ length: 12 }, (_, i) => startYear + i);

    return (
      <div className="w-64">
        {/* Year Range Header */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newMonth = new Date(currentMonth);
              newMonth.setFullYear(currentYear - 10);
              onMonthChange(newMonth);
            }}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="font-medium">
            {startYear} - {startYear + 11}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newMonth = new Date(currentMonth);
              newMonth.setFullYear(currentYear + 10);
              onMonthChange(newMonth);
            }}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Years Grid */}
        <div className="grid grid-cols-3 gap-2">
          {years.map((year) => (
            <Button
              key={year}
              variant={currentYear === year ? 'default' : 'ghost'}
              size="sm"
              className="h-10"
              onClick={() => {
                const newMonth = new Date(currentMonth);
                newMonth.setFullYear(year);
                onMonthChange(newMonth);
                setViewMode('months');
              }}
            >
              {year}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  const days = getDaysInMonth();

  return (
    <div className="w-64">
      {/* Month/Year Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('prev')}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            onClick={() => setViewMode('months')}
            className="font-medium text-sm"
          >
            {months[currentMonth.getMonth()]}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setViewMode('years')}
            className="font-medium text-sm"
          >
            {currentMonth.getFullYear()}
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('next')}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-xs font-medium text-[var(--color-text-secondary)]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(({ date, isCurrentMonth }, index) => {
          const selected = isDateSelected(date);
          const today = isToday(date);
          const disabled = isDateDisabled(date);
          
          return (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              disabled={disabled}
              className={cn(
                "h-8 w-8 p-0 text-sm transition-all duration-200",
                !isCurrentMonth && "text-[var(--color-text-tertiary)] opacity-50",
                selected && "bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)]",
                today && !selected && "bg-[var(--color-primary-100)] text-[var(--color-primary-700)]",
                disabled && "opacity-25 cursor-not-allowed",
                animations && "hover:scale-105"
              )}
              onClick={() => !disabled && onChange(date)}
            >
              {date.getDate()}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// Time Selector Component
interface TimeSelectorProps {
  hours: number;
  minutes: number;
  onChange: (type: 'hours' | 'minutes', value: number) => void;
}

function TimeSelector({ hours, minutes, onChange }: TimeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Clock className="w-4 h-4 text-[var(--color-text-secondary)]" />
        <span className="text-sm text-[var(--color-text-secondary)]">Time:</span>
      </div>
      
      <Select value={hours.toString()} onValueChange={(value) => onChange('hours', parseInt(value))}>
        <SelectTrigger className="w-16 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 24 }, (_, i) => (
            <SelectItem key={i} value={i.toString()}>
              {i.toString().padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <span className="text-[var(--color-text-secondary)]">:</span>
      
      <Select value={minutes.toString()} onValueChange={(value) => onChange('minutes', parseInt(value))}>
        <SelectTrigger className="w-16 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 60 }, (_, i) => (
            <SelectItem key={i} value={i.toString()}>
              {i.toString().padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  ArrowRight,
  Zap,
  History,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { format, addDays, addWeeks, addMonths, addYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { cn } from '@/lib/utils';

// Enhanced Date Range Interface
export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
  label?: string;
}

// Comprehensive Date Presets
const datePresets = [
  // Today & Yesterday
  {
    id: 'today',
    label: 'Today',
    icon: Today,
    category: 'recent',
    getValue: () => ({
      from: new Date(),
      to: new Date(),
      label: 'Today'
    })
  },
  {
    id: 'yesterday',
    label: 'Yesterday',
    icon: History,
    category: 'recent',
    getValue: () => {
      const yesterday = subDays(new Date(), 1);
      return {
        from: yesterday,
        to: yesterday,
        label: 'Yesterday'
      };
    }
  },
  
  // This Week/Month/Year
  {
    id: 'this-week',
    label: 'This Week',
    icon: CalendarIconLucide,
    category: 'current',
    getValue: () => ({
      from: startOfWeek(new Date()),
      to: endOfWeek(new Date()),
      label: 'This Week'
    })
  },
  {
    id: 'this-month',
    label: 'This Month',
    icon: CalendarIconLucide,
    category: 'current',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
      label: 'This Month'
    })
  },
  {
    id: 'this-year',
    label: 'This Year',
    icon: CalendarIconLucide,
    category: 'current',
    getValue: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
      label: 'This Year'
    })
  },
  
  // Last Week/Month/Year
  {
    id: 'last-week',
    label: 'Last Week',
    icon: RotateCcw,
    category: 'previous',
    getValue: () => {
      const lastWeek = subWeeks(new Date(), 1);
      return {
        from: startOfWeek(lastWeek),
        to: endOfWeek(lastWeek),
        label: 'Last Week'
      };
    }
  },
  {
    id: 'last-month',
    label: 'Last Month',
    icon: RotateCcw,
    category: 'previous',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
        label: 'Last Month'
      };
    }
  },
  {
    id: 'last-year',
    label: 'Last Year',
    icon: RotateCcw,
    category: 'previous',
    getValue: () => {
      const lastYear = subYears(new Date(), 1);
      return {
        from: startOfYear(lastYear),
        to: endOfYear(lastYear),
        label: 'Last Year'
      };
    }
  },
  
  // Last N Days
  {
    id: 'last-7-days',
    label: 'Last 7 Days',
    icon: TrendingUp,
    category: 'range',
    getValue: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
      label: 'Last 7 Days'
    })
  },
  {
    id: 'last-30-days',
    label: 'Last 30 Days',
    icon: TrendingUp,
    category: 'range',
    getValue: () => ({
      from: subDays(new Date(), 29),
      to: new Date(),
      label: 'Last 30 Days'
    })
  },
  {
    id: 'last-90-days',
    label: 'Last 90 Days',
    icon: TrendingUp,
    category: 'range',
    getValue: () => ({
      from: subDays(new Date(), 89),
      to: new Date(),
      label: 'Last 90 Days'
    })
  },
  {
    id: 'last-365-days',
    label: 'Last 365 Days',
    icon: TrendingUp,
    category: 'range',
    getValue: () => ({
      from: subDays(new Date(), 364),
      to: new Date(),
      label: 'Last 365 Days'
    })
  }
];

// Jalali calendar utilities
const jalaliMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const jalaliWeekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// Enhanced Date Range Picker Props
interface EnhancedDateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  variant?: 'default' | 'jalali' | 'inline';
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
  customPresets?: typeof datePresets;
  allowSingleDate?: boolean;
  maxRange?: number; // Maximum days in range
  onFocus?: () => void;
  onBlur?: () => void;
}

// Jalali date conversion utilities (simplified)
const toJalali = (date: Date) => {
  try {
    return date.toLocaleDateString('fa-IR-u-ca-persian');
  } catch {
    return date.toLocaleDateString();
  }
};

export function EnhancedDateRangePicker({
  value,
  onChange,
  placeholder = "Select date range",
  disabled = false,
  variant = 'default',
  className,
  error,
  size = 'md',
  showPresets = true,
  showTime = false,
  showWeekNumbers = false,
  minDate,
  maxDate,
  disabledDates = [],
  locale = 'en',
  direction = 'ltr',
  animations = true,
  customPresets,
  allowSingleDate = false,
  maxRange,
  onFocus,
  onBlur
}: EnhancedDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState({ 
    fromHours: 0, fromMinutes: 0,
    toHours: 23, toMinutes: 59 
  });
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const presets = customPresets || datePresets;
  const isJalali = variant === 'jalali' || locale === 'fa';

  const sizes = {
    sm: 'h-8 text-sm',
    md: 'h-10',
    lg: 'h-12 text-lg'
  };

  const formatDisplayRange = (range: DateRange | undefined) => {
    if (!range || !range.from) return "";
    
    const formatSingleDate = (date: Date) => {
      if (isJalali) {
        return toJalali(date);
      }
      return showTime ? format(date, "MMM d, yyyy HH:mm") : format(date, "MMM d, yyyy");
    };

    if (range.to && range.from.getTime() !== range.to.getTime()) {
      return `${formatSingleDate(range.from)} - ${formatSingleDate(range.to)}`;
    } else {
      return formatSingleDate(range.from);
    }
  };

  const handleDateSelect = (selectedDate: Date) => {
    if (!value || !value.from || (value.from && value.to)) {
      // Start new range
      const newRange: DateRange = {
        from: selectedDate,
        to: allowSingleDate ? selectedDate : undefined
      };
      onChange(newRange);
      setActivePreset(null);
    } else {
      // Complete range
      const from = value.from;
      const to = selectedDate;
      
      // Check max range constraint
      if (maxRange && Math.abs(to.getTime() - from.getTime()) > maxRange * 24 * 60 * 60 * 1000) {
        return; // Don't allow selection beyond max range
      }
      
      const newRange: DateRange = {
        from: from < to ? from : to,
        to: from < to ? to : from
      };
      
      if (showTime) {
        // Apply time to dates
        const fromWithTime = new Date(newRange.from!);
        const toWithTime = new Date(newRange.to!);
        
        fromWithTime.setHours(selectedTime.fromHours, selectedTime.fromMinutes);
        toWithTime.setHours(selectedTime.toHours, selectedTime.toMinutes);
        
        newRange.from = fromWithTime;
        newRange.to = toWithTime;
      }
      
      onChange(newRange);
      setIsOpen(false);
    }
  };

  const handlePresetSelect = (preset: typeof datePresets[0]) => {
    const range = preset.getValue();
    onChange(range);
    setActivePreset(preset.id);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setActivePreset(null);
  };

  const isDateInRange = (date: Date) => {
    if (!value || !value.from) return false;
    
    if (value.to) {
      return date >= value.from && date <= value.to;
    }
    
    // Show hover range
    if (hoverDate && hoverDate > value.from) {
      return date >= value.from && date <= hoverDate;
    }
    
    return date.getTime() === value.from.getTime();
  };

  const isDateRangeStart = (date: Date) => {
    return value?.from && date.getTime() === value.from.getTime();
  };

  const isDateRangeEnd = (date: Date) => {
    return value?.to && date.getTime() === value.to.getTime();
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (disabledDates.some(disabled => 
      disabled.toDateString() === date.toDateString()
    )) return true;
    
    // Check max range constraint
    if (maxRange && value?.from && !value.to) {
      const daysDiff = Math.abs(date.getTime() - value.from.getTime()) / (24 * 60 * 60 * 1000);
      if (daysDiff > maxRange) return true;
    }
    
    return false;
  };

  // Group presets by category
  const groupedPresets = presets.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, typeof presets>);

  const categoryLabels = {
    recent: 'Recent',
    current: 'Current Period',
    previous: 'Previous Period',
    range: 'Date Ranges'
  };

  // Render inline calendar for inline variant
  if (variant === 'inline') {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="border border-[var(--color-border-primary)] rounded-lg bg-[var(--color-bg-primary)]">
          <div className="flex">
            {/* Presets Sidebar */}
            {showPresets && (
              <div className="border-r border-[var(--color-border-primary)] p-4 space-y-4 min-w-[200px]">
                <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                  Quick Select
                </h3>
                
                {Object.entries(groupedPresets).map(([category, categoryPresets]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </h4>
                    <div className="space-y-1">
                      {categoryPresets.map(preset => {
                        const Icon = preset.icon;
                        return (
                          <Button
                            key={preset.id}
                            variant={activePreset === preset.id ? 'default' : 'ghost'}
                            size="sm"
                            className="w-full justify-start text-xs h-8"
                            onClick={() => handlePresetSelect(preset)}
                          >
                            <Icon className="w-3 h-3 mr-2" />
                            {preset.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Calendar */}
            <div className="p-4">
              <DualCalendar
                value={value}
                onChange={handleDateSelect}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                variant={variant}
                locale={locale}
                direction={direction}
                showWeekNumbers={showWeekNumbers}
                isDateDisabled={isDateDisabled}
                isDateInRange={isDateInRange}
                isDateRangeStart={isDateRangeStart}
                isDateRangeEnd={isDateRangeEnd}
                onHoverDate={setHoverDate}
                animations={animations}
              />
              
              {showTime && (
                <div className="mt-4 pt-4 border-t border-[var(--color-border-primary)]">
                  <TimeRangeSelector
                    fromHours={selectedTime.fromHours}
                    fromMinutes={selectedTime.fromMinutes}
                    toHours={selectedTime.toHours}
                    toMinutes={selectedTime.toMinutes}
                    onChange={(type, value) => {
                      setSelectedTime(prev => ({ ...prev, [type]: value }));
                    }}
                  />
                </div>
              )}
            </div>
          </div>
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
              {value ? formatDisplayRange(value) : placeholder}
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
              <div className="border-r border-[var(--color-border-primary)] p-3 space-y-3 min-w-[180px] max-h-[400px] overflow-y-auto">
                <div className="text-xs font-medium text-[var(--color-text-secondary)] px-1">
                  Quick Select
                </div>
                
                {Object.entries(groupedPresets).map(([category, categoryPresets]) => (
                  <div key={category} className="space-y-1">
                    <div className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide px-1">
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </div>
                    {categoryPresets.map(preset => {
                      const Icon = preset.icon;
                      return (
                        <Button
                          key={preset.id}
                          variant={activePreset === preset.id ? 'default' : 'ghost'}
                          size="sm"
                          className="w-full justify-start text-xs h-7"
                          onClick={() => handlePresetSelect(preset)}
                        >
                          <Icon className="w-3 h-3 mr-2" />
                          {preset.label}
                        </Button>
                      );
                    })}
                    {category !== 'range' && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            )}

            {/* Main Calendar */}
            <div className="p-3">
              <DualCalendar
                value={value}
                onChange={handleDateSelect}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                variant={variant}
                locale={locale}
                direction={direction}
                showWeekNumbers={showWeekNumbers}
                isDateDisabled={isDateDisabled}
                isDateInRange={isDateInRange}
                isDateRangeStart={isDateRangeStart}
                isDateRangeEnd={isDateRangeEnd}
                onHoverDate={setHoverDate}
                animations={animations}
              />
              
              {/* Time Selector */}
              {showTime && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border-primary)]">
                  <TimeRangeSelector
                    fromHours={selectedTime.fromHours}
                    fromMinutes={selectedTime.fromMinutes}
                    toHours={selectedTime.toHours}
                    toMinutes={selectedTime.toMinutes}
                    onChange={(type, value) => {
                      setSelectedTime(prev => ({ ...prev, [type]: value }));
                    }}
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
                  <Today className="w-3 h-3 mr-1" />
                  Today
                </Button>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {value && value.from && value.to
                      ? `${Math.ceil((value.to.getTime() - value.from.getTime()) / (24 * 60 * 60 * 1000)) + 1} days`
                      : value && value.from
                      ? 'Select End Date'
                      : 'Select Start Date'
                    }
                  </Badge>
                  
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
}// Dua
l Calendar Component for Range Selection
interface DualCalendarProps {
  value: DateRange | undefined;
  onChange: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  variant: string;
  locale: string;
  direction: string;
  showWeekNumbers: boolean;
  isDateDisabled: (date: Date) => boolean;
  isDateInRange: (date: Date) => boolean;
  isDateRangeStart: (date: Date) => boolean;
  isDateRangeEnd: (date: Date) => boolean;
  onHoverDate: (date: Date | null) => void;
  animations: boolean;
}

function DualCalendar({
  value,
  onChange,
  currentMonth,
  onMonthChange,
  variant,
  locale,
  direction,
  showWeekNumbers,
  isDateDisabled,
  isDateInRange,
  isDateRangeStart,
  isDateRangeEnd,
  onHoverDate,
  animations
}: DualCalendarProps) {
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

  const getDaysInMonth = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Previous month's trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, monthIndex, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Next month's leading days
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, monthIndex + 1, day);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
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

  // Show dual calendar for better range selection
  const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  const currentDays = getDaysInMonth(currentMonth);
  const nextDays = getDaysInMonth(nextMonth);

  const renderCalendar = (month: Date, days: ReturnType<typeof getDaysInMonth>, isSecondary = false) => (
    <div className="w-64">
      {/* Month/Year Header */}
      <div className="flex items-center justify-between mb-4">
        {!isSecondary && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        
        <div className="flex items-center gap-1 flex-1 justify-center">
          <Button
            variant="ghost"
            onClick={() => setViewMode('months')}
            className="font-medium text-sm"
          >
            {months[month.getMonth()]}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setViewMode('years')}
            className="font-medium text-sm"
          >
            {month.getFullYear()}
          </Button>
        </div>
        
        {isSecondary && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
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
          const inRange = isDateInRange(date);
          const rangeStart = isDateRangeStart(date);
          const rangeEnd = isDateRangeEnd(date);
          const today = isToday(date);
          const disabled = isDateDisabled(date);
          
          return (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              disabled={disabled}
              className={cn(
                "h-8 w-8 p-0 text-sm transition-all duration-200 relative",
                !isCurrentMonth && "text-[var(--color-text-tertiary)] opacity-50",
                inRange && !rangeStart && !rangeEnd && "bg-[var(--color-primary-100)] text-[var(--color-primary-700)]",
                rangeStart && "bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-l-md rounded-r-none",
                rangeEnd && "bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-r-md rounded-l-none",
                rangeStart && rangeEnd && "bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-md",
                today && !inRange && "bg-[var(--color-primary-100)] text-[var(--color-primary-700)] font-semibold",
                disabled && "opacity-25 cursor-not-allowed",
                animations && "hover:scale-105"
              )}
              onClick={() => !disabled && onChange(date)}
              onMouseEnter={() => onHoverDate(date)}
              onMouseLeave={() => onHoverDate(null)}
            >
              {date.getDate()}
            </Button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex gap-4">
      {renderCalendar(currentMonth, currentDays)}
      {renderCalendar(nextMonth, nextDays, true)}
    </div>
  );
}

// Time Range Selector Component
interface TimeRangeSelectorProps {
  fromHours: number;
  fromMinutes: number;
  toHours: number;
  toMinutes: number;
  onChange: (type: 'fromHours' | 'fromMinutes' | 'toHours' | 'toMinutes', value: number) => void;
}

function TimeRangeSelector({ fromHours, fromMinutes, toHours, toMinutes, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-[var(--color-text-secondary)]" />
        <span className="text-sm text-[var(--color-text-secondary)]">Time Range:</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* From Time */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">From</label>
          <div className="flex items-center gap-1">
            <Select value={fromHours.toString()} onValueChange={(value) => onChange('fromHours', parseInt(value))}>
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
            
            <Select value={fromMinutes.toString()} onValueChange={(value) => onChange('fromMinutes', parseInt(value))}>
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
        </div>

        {/* To Time */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">To</label>
          <div className="flex items-center gap-1">
            <Select value={toHours.toString()} onValueChange={(value) => onChange('toHours', parseInt(value))}>
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
            
            <Select value={toMinutes.toString()} onValueChange={(value) => onChange('toMinutes', parseInt(value))}>
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
        </div>
      </div>
    </div>
  );
}

// Custom Date Range Input Component
interface CustomDateRangeInputProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  locale?: 'en' | 'fa';
  onValidate?: (range: DateRange) => string | null;
}

export function CustomDateRangeInput({
  value,
  onChange,
  placeholder = "Enter custom date range",
  className,
  error,
  locale = 'en',
  onValidate
}: CustomDateRangeInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (value) {
      const formatDate = (date: Date) => {
        return locale === 'fa' ? toJalali(date) : format(date, 'yyyy-MM-dd');
      };
      
      if (value.from && value.to) {
        setInputValue(`${formatDate(value.from)} - ${formatDate(value.to)}`);
      } else if (value.from) {
        setInputValue(formatDate(value.from));
      }
    } else {
      setInputValue('');
    }
  }, [value, locale]);

  const parseInput = (input: string) => {
    try {
      const parts = input.split(' - ');
      if (parts.length === 2) {
        const from = new Date(parts[0]);
        const to = new Date(parts[1]);
        
        if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
          const range: DateRange = { from, to };
          
          // Custom validation
          if (onValidate) {
            const validationResult = onValidate(range);
            if (validationResult) {
              setValidationError(validationResult);
              return null;
            }
          }
          
          setValidationError(null);
          return range;
        }
      } else if (parts.length === 1) {
        const date = new Date(parts[0]);
        if (!isNaN(date.getTime())) {
          const range: DateRange = { from: date, to: date };
          setValidationError(null);
          return range;
        }
      }
      
      setValidationError('Invalid date format');
      return null;
    } catch {
      setValidationError('Invalid date format');
      return null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue.trim()) {
      const parsed = parseInput(newValue);
      if (parsed) {
        onChange(parsed);
      }
    } else {
      onChange(undefined);
      setValidationError(null);
    }
  };

  return (
    <div className="space-y-1">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={cn(
          (error || validationError) && "border-[var(--color-error-main)] focus:border-[var(--color-error-main)]",
          className
        )}
      />
      
      {(error || validationError) && (
        <p className="text-sm text-[var(--color-error-main)]">
          {error || validationError}
        </p>
      )}
      
      <p className="text-xs text-[var(--color-text-secondary)]">
        Format: YYYY-MM-DD or YYYY-MM-DD - YYYY-MM-DD
      </p>
    </div>
  );
}

// Export utility functions
export const dateRangeUtils = {
  formatRange: (range: DateRange, locale: 'en' | 'fa' = 'en') => {
    if (!range.from) return '';
    
    const formatDate = (date: Date) => {
      return locale === 'fa' ? toJalali(date) : format(date, 'MMM d, yyyy');
    };
    
    if (range.to && range.from.getTime() !== range.to.getTime()) {
      return `${formatDate(range.from)} - ${formatDate(range.to)}`;
    }
    
    return formatDate(range.from);
  },
  
  getDayCount: (range: DateRange) => {
    if (!range.from || !range.to) return 0;
    return Math.ceil((range.to.getTime() - range.from.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  },
  
  isValidRange: (range: DateRange, maxDays?: number) => {
    if (!range.from) return false;
    if (range.to && range.from > range.to) return false;
    if (maxDays && range.to) {
      const dayCount = dateRangeUtils.getDayCount(range);
      return dayCount <= maxDays;
    }
    return true;
  },
  
  createPreset: (id: string, label: string, getValue: () => DateRange, icon = CalendarIconLucide, category = 'custom') => ({
    id,
    label,
    icon,
    category,
    getValue
  })
};

export default EnhancedDateRangePicker;
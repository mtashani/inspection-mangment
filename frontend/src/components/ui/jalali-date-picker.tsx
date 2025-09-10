import * as React from 'react';
import jalaali from 'jalaali-js';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const jalaliMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

function getDaysInJalaliMonth(year: number, month: number) {
  // month: 1-12
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  // اسفند
  return jalaali.isLeapJalaaliYear(year) ? 30 : 29;
}

function jalaliToGregorian(jy: number, jm: number, jd: number) {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

function gregorianToJalali(date: Date) {
  const { jy, jm, jd } = jalaali.toJalaali(date);
  return { jy, jm, jd };
}

// Utility: تبدیل تاریخ جلالی به Date میلادی معتبر
export function jalaliDateToJSDate(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

export interface JalaliDatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  disabled = false,
}) => {
  // مقدار امن برای value
  const safeValue = (value instanceof Date && !isNaN(value.getTime())) ? value : new Date();
  const initial = gregorianToJalali(safeValue);
  const [jalaliYear, setJalaliYear] = React.useState<number>(initial.jy);
  const [jalaliMonth, setJalaliMonth] = React.useState<number>(initial.jm);
  const [selected, setSelected] = React.useState<Date | undefined>(safeValue);

  React.useEffect(() => {
    const safe = (value instanceof Date && !isNaN(value.getTime())) ? value : new Date();
    const newJalali = gregorianToJalali(safe);
    setJalaliYear(newJalali.jy);
    setJalaliMonth(newJalali.jm);
  }, [value]);

  const daysInMonth = getDaysInJalaliMonth(jalaliYear, jalaliMonth);

  const handleDayClick = (e: React.MouseEvent, day: number) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    
    const date = jalaliToGregorian(jalaliYear, jalaliMonth, day);
    setSelected(date);
    onChange?.(date);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    
    if (jalaliMonth === 1) {
      setJalaliYear((y: number) => y - 1);
      setJalaliMonth(12);
    } else {
      setJalaliMonth((m: number) => m - 1);
    }
  };
  
  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    
    if (jalaliMonth === 12) {
      setJalaliYear((y: number) => y + 1);
      setJalaliMonth(1);
    } else {
      setJalaliMonth((m: number) => m + 1);
    }
  };

  // نمایش تاریخ انتخاب شده به جلالی
  const selectedJalali = selected ? gregorianToJalali(selected) : null;
  const selectedLabel = selectedJalali
    ? `${selectedJalali.jy}/${selectedJalali.jm.toString().padStart(2, '0')}/${selectedJalali.jd.toString().padStart(2, '0')}`
    : placeholder;

  // روزهای هفته به فارسی
  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  // محاسبه روز هفته شروع ماه جلالی (شنبه=0)
  const firstDayOfMonthGregorian = jalaliToGregorian(jalaliYear, jalaliMonth, 1);
  
  // Fix: اصلاح محاسبه روز هفته برای روز اول ماه
  // getDay: 0=Sunday, 6=Saturday. ما می‌خواهیم شنبه=0، جمعه=6
  let weekDayOfFirst = firstDayOfMonthGregorian.getDay() - 6; // شنبه = 0
  if (weekDayOfFirst < 0) weekDayOfFirst += 7;
  
  // Debug log
  console.log(`First day of month: ${jalaliYear}/${jalaliMonth}/1 => weekday: ${weekDayOfFirst}`);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Button type="button" variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-bold text-lg">{jalaliMonths[jalaliMonth - 1]} {jalaliYear}</span>
        <Button type="button" variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((d, i) => (
          <Button
            key={i}
            variant="ghost"
            size="icon"
            className="font-bold pointer-events-none"
            disabled
            tabIndex={-1}
            aria-hidden="true"
          >
            {d}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {/* سلول‌های خالی قبل از روز ۱ */}
        {Array.from({ length: weekDayOfFirst }).map((_, i) => (
          <Button
            key={`empty-${i}`}
            variant="ghost"
            size="icon"
            className="opacity-0 pointer-events-none"
            tabIndex={-1}
            aria-hidden="true"
            disabled
          >
            {/* empty */}
          </Button>
        ))}
        {/* روزهای ماه */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const isSelected = selectedJalali &&
            selectedJalali.jy === jalaliYear &&
            selectedJalali.jm === jalaliMonth &&
            selectedJalali.jd === day;
          return (
            <Button
              key={day}
              type="button"
              variant={isSelected ? 'default' : 'ghost'}
              size="icon"
              className={isSelected ? 'bg-primary text-primary-foreground' : ''}
              onClick={(e) => handleDayClick(e, day)}
              disabled={disabled}
            >
              {day}
            </Button>
          );
        })}
      </div>
      <div className="mt-2 text-center text-sm text-gray-700">
        {selectedLabel}
      </div>
    </div>
  );
};

JalaliDatePicker.displayName = 'JalaliDatePicker'; 
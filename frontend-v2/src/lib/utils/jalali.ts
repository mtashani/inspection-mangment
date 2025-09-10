/**
 * Jalali (Persian) Calendar Utilities
 * 
 * This file contains utility functions for working with Jalali calendar dates
 * Used for converting between Gregorian and Jalali dates, formatting, etc.
 */

// @ts-expect-error: No types for jalaali-js
import jalaali from 'jalaali-js';

export interface JalaliDate {
  jy: number; // Jalali year
  jm: number; // Jalali month (1-12)
  jd: number; // Jalali day (1-31)
}

export interface JalaliDateDisplay {
  year: number;
  month: number;
  day: number;
  monthName: string;
  weekDay: string;
  formatted: string;
}

// Persian month names
export const jalaliMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// Persian weekday names
export const jalaliWeekDays = [
  'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'
];

// Short weekday names for calendar headers
export const jalaliWeekDaysShort = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'];

/**
 * Convert Gregorian date to Jalali
 */
export function gregorianToJalali(date: Date): JalaliDate {
  const { jy, jm, jd } = jalaali.toJalaali(date);
  return { jy, jm, jd };
}

/**
 * Convert Jalali date to Gregorian
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

/**
 * Get number of days in a Jalali month
 */
export function getDaysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  // اسفند: 29 or 30 days depending on leap year
  return jalaali.isLeapJalaaliYear(year) ? 30 : 29;
}

/**
 * Check if a Jalali year is leap year
 */
export function isJalaliLeapYear(year: number): boolean {
  return jalaali.isLeapJalaaliYear(year);
}

/**
 * Format Jalali date as string (YYYY/MM/DD)
 */
export function formatJalaliDate(jy: number, jm: number, jd: number): string {
  return `${jy}/${jm.toString().padStart(2, '0')}/${jd.toString().padStart(2, '0')}`;
}

/**
 * Format Jalali date with Persian month name
 */
export function formatJalaliDateLong(jy: number, jm: number, jd: number): string {
  const monthName = jalaliMonths[jm - 1];
  return `${jd} ${monthName} ${jy}`;
}

/**
 * Get current Jalali date
 */
export function getCurrentJalaliDate(): JalaliDate {
  return gregorianToJalali(new Date());
}

/**
 * Get Jalali date display information
 */
export function getJalaliDateDisplay(date: Date): JalaliDateDisplay {
  const { jy, jm, jd } = gregorianToJalali(date);
  const weekDay = jalaliWeekDays[date.getDay()];
  const monthName = jalaliMonths[jm - 1];
  const formatted = formatJalaliDate(jy, jm, jd);

  return {
    year: jy,
    month: jm,
    day: jd,
    monthName,
    weekDay,
    formatted
  };
}

/**
 * Get start and end dates of a Jalali month in Gregorian format
 */
export function getJalaliMonthRange(jalaliYear: number, jalaliMonth: number): {
  startDate: Date;
  endDate: Date;
  daysInMonth: number;
} {
  const startDate = jalaliToGregorian(jalaliYear, jalaliMonth, 1);
  const daysInMonth = getDaysInJalaliMonth(jalaliYear, jalaliMonth);
  const endDate = jalaliToGregorian(jalaliYear, jalaliMonth, daysInMonth);

  return {
    startDate,
    endDate,
    daysInMonth
  };
}

/**
 * Get all days in a Jalali month
 */
export function getJalaliMonthDays(jalaliYear: number, jalaliMonth: number): Array<{
  jalaliDay: number;
  gregorianDate: Date;
  weekDay: string;
  isToday: boolean;
}> {
  const daysInMonth = getDaysInJalaliMonth(jalaliYear, jalaliMonth);
  const today = new Date();
  const todayJalali = gregorianToJalali(today);
  
  const days = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const gregorianDate = jalaliToGregorian(jalaliYear, jalaliMonth, day);
    const weekDay = jalaliWeekDays[gregorianDate.getDay()];
    const isToday = 
      jalaliYear === todayJalali.jy &&
      jalaliMonth === todayJalali.jm &&
      day === todayJalali.jd;

    days.push({
      jalaliDay: day,
      gregorianDate,
      weekDay,
      isToday
    });
  }

  return days;
}

/**
 * Navigate to previous Jalali month
 */
export function getPreviousJalaliMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

/**
 * Navigate to next Jalali month
 */
export function getNextJalaliMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

/**
 * Parse Jalali date string (YYYY/MM/DD or YYYY-MM-DD)
 */
export function parseJalaliDate(dateString: string): JalaliDate | null {
  const parts = dateString.split(/[\/\-]/);
  if (parts.length !== 3) return null;

  const jy = parseInt(parts[0], 10);
  const jm = parseInt(parts[1], 10);
  const jd = parseInt(parts[2], 10);

  if (isNaN(jy) || isNaN(jm) || isNaN(jd)) return null;
  if (jm < 1 || jm > 12) return null;
  if (jd < 1 || jd > getDaysInJalaliMonth(jy, jm)) return null;

  return { jy, jm, jd };
}

/**
 * Convert Jalali date to API format (for backend compatibility)
 */
export function jalaliToApiFormat(jy: number, jm: number, jd: number): string {
  return `${jy}-${jm.toString().padStart(2, '0')}-${jd.toString().padStart(2, '0')}`;
}

/**
 * Get Jalali month name by number (1-12)
 */
export function getJalaliMonthName(month: number): string {
  if (month < 1 || month > 12) return '';
  return jalaliMonths[month - 1];
}

/**
 * Get Jalali weekday name by day of week (0-6, Sunday to Saturday)
 */
export function getJalaliWeekDayName(dayOfWeek: number): string {
  if (dayOfWeek < 0 || dayOfWeek > 6) return '';
  return jalaliWeekDays[dayOfWeek];
}

/**
 * Check if two Jalali dates are equal
 */
export function isJalaliDateEqual(date1: JalaliDate, date2: JalaliDate): boolean {
  return date1.jy === date2.jy && date1.jm === date2.jm && date1.jd === date2.jd;
}

/**
 * Check if Jalali date is today
 */
export function isJalaliDateToday(jy: number, jm: number, jd: number): boolean {
  const today = getCurrentJalaliDate();
  return jy === today.jy && jm === today.jm && jd === today.jd;
}
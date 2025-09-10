/**
 * Jalali Calendar Demo Component
 * This demonstrates the Jalali calendar functionality for the admin attendance overview
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import {
  getCurrentJalaliDate,
  getJalaliMonthName,
  getDaysInJalaliMonth,
  getPreviousJalaliMonth,
  getNextJalaliMonth,
  isJalaliDateToday,
  formatJalaliDate,
  formatJalaliDateLong
} from '@/lib/utils/jalali';

export function JalaliCalendarDemo() {
  const currentJalali = getCurrentJalaliDate();
  const [jalaliMonth, setJalaliMonth] = React.useState(currentJalali.jm);
  const [jalaliYear, setJalaliYear] = React.useState(currentJalali.jy);

  const handlePreviousMonth = () => {
    const { year, month } = getPreviousJalaliMonth(jalaliYear, jalaliMonth);
    setJalaliMonth(month);
    setJalaliYear(year);
  };

  const handleNextMonth = () => {
    const { year, month } = getNextJalaliMonth(jalaliYear, jalaliMonth);
    setJalaliMonth(month);
    setJalaliYear(year);
  };

  const daysInMonth = getDaysInJalaliMonth(jalaliYear, jalaliMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">تقویم جلالی</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            Demo
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="font-semibold text-base">
              {getJalaliMonthName(jalaliMonth)} {jalaliYear}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatJalaliDate(jalaliYear, jalaliMonth, 1)}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Date Display */}
        <div className="mb-4 p-3 bg-muted rounded-lg text-center">
          <div className="text-sm text-muted-foreground">امروز</div>
          <div className="font-medium">
            {formatJalaliDateLong(currentJalali.jy, currentJalali.jm, currentJalali.jd)}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const isToday = isJalaliDateToday(jalaliYear, jalaliMonth, day);
            return (
              <div
                key={day}
                className={`
                  aspect-square flex items-center justify-center text-sm rounded-md cursor-pointer transition-colors
                  hover:bg-muted
                  ${isToday ? 'bg-primary text-primary-foreground font-semibold' : ''}
                `}
              >
                {day}
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-700">
            <div className="font-medium mb-1">✅ Jalali Calendar Features:</div>
            <ul className="text-xs space-y-1">
              <li>• Persian month names (فروردین، اردیبهشت، ...)</li>
              <li>• Correct leap year calculations</li>
              <li>• Today highlighting</li>
              <li>• Month navigation</li>
              <li>• Backend API compatibility</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default JalaliCalendarDemo;
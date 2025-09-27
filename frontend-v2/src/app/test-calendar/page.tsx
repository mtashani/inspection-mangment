'use client'

import React, { useState } from 'react'
import { JalaliDatePicker } from '@/components/ui/dual-calendar-date-picker'
import { JalaliDateRangePicker } from '@/components/ui/jalali-date-range-picker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DateRange } from 'react-day-picker'

export default function CalendarTestPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>()

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Jalali Calendar Test Page</h1>
        <p className="text-muted-foreground">Testing the new Jalali calendar components</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Single Date Picker */}
        <Card>
          <CardHeader>
            <CardTitle>Single Date Picker</CardTitle>
            <CardDescription>
              Test the JalaliDatePicker component with both calendars
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <JalaliDatePicker
              date={selectedDate}
              onDateChange={setSelectedDate}
              placeholder="انتخاب تاریخ"
              showBothCalendars={true}
              disableFuture={false}
            />
            
            {selectedDate && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Selected Date:</h4>
                <div className="space-y-1 text-sm">
                  <div>میلادی: {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</div>
                  <div>ISO: {selectedDate.toISOString().split('T')[0]}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Date Range Picker */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range Picker</CardTitle>
            <CardDescription>
              Test the JalaliDateRangePicker component
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <JalaliDateRangePicker
              dateRange={selectedRange}
              onDateRangeChange={setSelectedRange}
              placeholder="انتخاب بازه تاریخ"
              showBothCalendars={true}
            />
            
            {selectedRange && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Selected Range:</h4>
                <div className="space-y-1 text-sm">
                  {selectedRange.from && (
                    <div>From: {selectedRange.from.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</div>
                  )}
                  {selectedRange.to && (
                    <div>To: {selectedRange.to.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Jalali Only Picker */}
        <Card>
          <CardHeader>
            <CardTitle>Jalali Only Picker</CardTitle>
            <CardDescription>
              Date picker with only Jalali calendar (no Gregorian tab)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <JalaliDatePicker
              placeholder="فقط تقویم شمسی"
              showBothCalendars={false}
              disableFuture={true}
            />
          </CardContent>
        </Card>

        {/* Features Test */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Tests</CardTitle>
            <CardDescription>
              Test various features like date restrictions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Badge variant="outline">Disable Future Dates</Badge>
              <JalaliDatePicker
                placeholder="آینده غیرفعال"
                disableFuture={true}
                showBothCalendars={true}
              />
            </div>
            
            <div className="space-y-2">
              <Badge variant="outline">Disable Past Dates</Badge>
              <JalaliDatePicker
                placeholder="گذشته غیرفعال"
                disablePast={true}
                showBothCalendars={true}
              />
            </div>

            <div className="space-y-2">
              <Badge variant="outline">Custom Date Range</Badge>
              <JalaliDatePicker
                placeholder="بازه محدود"
                fromDate={new Date(2024, 0, 1)} // January 1, 2024
                toDate={new Date(2024, 11, 31)} // December 31, 2024
                showBothCalendars={true}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>Jalali Calendar:</strong> Fully functional Persian calendar with proper date formatting</div>
            <div><strong>Gregorian Calendar:</strong> Standard calendar for comparison</div>
            <div><strong>RTL Support:</strong> Right-to-left layout for Persian calendar</div>
            <div><strong>Date Validation:</strong> Supports future/past date restrictions</div>
            <div><strong>Dual Format:</strong> Shows both Persian and Gregorian dates</div>
            <div><strong>Range Selection:</strong> Supports date range picking</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
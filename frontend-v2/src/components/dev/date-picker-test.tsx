'use client'

import React, { useState, useEffect } from 'react'
import { DateRange } from 'react-day-picker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Calendar, TestTube } from 'lucide-react'

export function DatePickerTest() {
  const [mounted, setMounted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [inlineRange, setInlineRange] = useState<DateRange | undefined>()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Only render on client side after hydration to prevent SSR mismatch
  if (!mounted || process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 w-96 z-50">
      <Card className="border-2 border-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            🗓️ Date Picker Test Panel
            <Badge variant="outline">Dev Only</Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Test date range picker in different contexts
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Inline Test */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-1">
              <Calendar className="h-3 w-3 text-blue-500" />
              Inline Test (Auto-close after range)
            </h4>
            <DateRangePicker
              dateRange={inlineRange}
              onDateRangeChange={setInlineRange}
              placeholder="Select dates inline"
              modal={false} // Closes when both dates selected
            />
            {inlineRange?.from && !inlineRange?.to && (
              <div className="text-xs text-blue-600">
                📅 Start date selected: {inlineRange.from.toLocaleDateString()}
                <br />💡 Click end date to complete range
              </div>
            )}
            {inlineRange?.from && inlineRange?.to && (
              <div className="text-xs text-green-600">
                ✅ Range completed: {inlineRange.from.toLocaleDateString()} - {inlineRange.to.toLocaleDateString()}
                <br />🔄 Popover auto-closed after range selection
              </div>
            )}
            <div className="text-xs text-muted-foreground border-l-2 border-yellow-400 pl-2">
              <strong>Expected behavior:</strong>
              <br />• Calendar stays open after first date
              <br />• Calendar closes after selecting end date
              <br />• This allows completing the date range
            </div>
          </div>

          {/* Modal Test */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-1">
              <TestTube className="h-3 w-3 text-purple-500" />
              Modal Test (Stays open)
            </h4>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  Test in Modal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Date Range Picker in Modal</DialogTitle>
                  <DialogDescription>
                    Testing z-index and interaction within modal context
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Date Range</label>
                    <DateRangePicker
                      dateRange={dateRange}
                      onDateRangeChange={setDateRange}
                      placeholder="Select dates in modal"
                      modal={true}
                    />
                  </div>
                  
                  {dateRange?.from && !dateRange?.to && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm font-medium text-blue-800">
                        📅 Start Date Selected
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        From: {dateRange.from.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-xs text-blue-600">
                        💡 Calendar stays open - select end date
                      </div>
                    </div>
                  )}
                  
                  {dateRange?.from && dateRange?.to && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-sm font-medium text-green-800">
                        ✅ Date Range Selected Successfully!
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        From: {dateRange.from.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-xs text-green-600">
                        To: {dateRange.to.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        🔄 Calendar remains open for further changes
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground border-l-2 border-green-400 pl-2">
                    <strong>Modal behavior:</strong>
                    <br />• Calendar stays open after first date
                    <br />• Calendar stays open after second date
                    <br />• Allows easy range modification
                    <br />• Prevents modal interference with popover
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {dateRange?.from && dateRange?.to && (
              <div className="text-xs text-green-600">
                ✅ Modal Selected: {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                <br />💡 Calendar stayed open during selection
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Status</h4>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1">
                <span>Inline Picker:</span>
                <Badge variant={inlineRange?.from && inlineRange?.to ? 'default' : 'secondary'} className="text-xs">
                  {inlineRange?.from && inlineRange?.to ? 'Working' : 'Not Selected'}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <span>Modal Picker:</span>
                <Badge variant={dateRange?.from && dateRange?.to ? 'default' : 'secondary'} className="text-xs">
                  {dateRange?.from && dateRange?.to ? 'Working' : 'Not Selected'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Clear Action */}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              setDateRange(undefined)
              setInlineRange(undefined)
            }}
            className="w-full"
          >
            Clear All Dates
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  DollarSign,
  Clock,
  Users
} from 'lucide-react'

interface PayrollEvent {
  date: string
  type: 'payroll_generation' | 'payment_due' | 'overtime_calculation' | 'bonus_payment'
  title: string
  description?: string
  amount?: number
  status: 'completed' | 'pending' | 'overdue'
}

interface PayrollCalendarProps {
  month: number
  year: number
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
}

export function PayrollCalendar({ 
  month, 
  year, 
  onMonthChange, 
  onYearChange 
}: PayrollCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Mock payroll events - in real app, this would come from API
  const payrollEvents: PayrollEvent[] = [
    {
      date: `${year}-${month.toString().padStart(2, '0')}-01`,
      type: 'payroll_generation',
      title: 'Monthly Payroll Generation',
      description: 'Generate payroll for all active inspectors',
      status: 'completed'
    },
    {
      date: `${year}-${month.toString().padStart(2, '0')}-15`,
      type: 'payment_due',
      title: 'Mid-Month Payment Due',
      description: 'Process mid-month salary payments',
      amount: 125000,
      status: 'pending'
    },
    {
      date: `${year}-${month.toString().padStart(2, '0')}-25`,
      type: 'overtime_calculation',
      title: 'Overtime Calculation',
      description: 'Calculate overtime hours and payments',
      status: 'pending'
    },
    {
      date: `${year}-${month.toString().padStart(2, '0')}-30`,
      type: 'bonus_payment',
      title: 'Monthly Bonus Payment',
      description: 'Process performance bonuses',
      amount: 15000,
      status: 'pending'
    }
  ]

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' })

  const navigateMonth = (direction: number) => {
    const newDate = new Date(year, month - 1 + direction, 1)
    onMonthChange(newDate.getMonth() + 1)
    onYearChange(newDate.getFullYear())
  }

  const getEventsForDate = (date: number): PayrollEvent[] => {
    const dateString = `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`
    return payrollEvents.filter(event => event.date === dateString)
  }

  const getEventTypeIcon = (type: PayrollEvent['type']) => {
    switch (type) {
      case 'payroll_generation':
        return <Users className="h-3 w-3" />
      case 'payment_due':
        return <DollarSign className="h-3 w-3" />
      case 'overtime_calculation':
        return <Clock className="h-3 w-3" />
      case 'bonus_payment':
        return <DollarSign className="h-3 w-3" />
      default:
        return <CalendarIcon className="h-3 w-3" />
    }
  }

  const getStatusColor = (status: PayrollEvent['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Payroll Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Select value={month.toString()} onValueChange={(value) => onMonthChange(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={year.toString()} onValueChange={(value) => onYearChange(parseInt(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => (
                      <SelectItem key={2022 + i} value={(2022 + i).toString()}>
                        {2022 + i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div key={`empty-${i}`} className="p-2 h-24" />
            ))}
            
            {/* Calendar days */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const date = i + 1
              const events = getEventsForDate(date)
              const isToday = new Date().getDate() === date && 
                            new Date().getMonth() === month - 1 && 
                            new Date().getFullYear() === year
              
              return (
                <div
                  key={date}
                  className={`p-1 h-24 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                    isToday ? 'bg-primary/10 border-primary' : ''
                  }`}
                  onClick={() => setSelectedDate(`${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`)}
                >
                  <div className="text-sm font-medium mb-1">{date}</div>
                  <div className="space-y-1">
                    {events.slice(0, 2).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className={`text-xs p-1 rounded border ${getStatusColor(event.status)}`}
                      >
                        <div className="flex items-center gap-1">
                          {getEventTypeIcon(event.type)}
                          <span className="truncate">{event.title}</span>
                        </div>
                      </div>
                    ))}
                    {events.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{events.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              Events for {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payrollEvents
                .filter(event => event.date === selectedDate)
                .map((event, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getEventTypeIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{event.title}</h4>
                        <Badge variant={event.status === 'completed' ? 'secondary' : 'outline'}>
                          {event.status}
                        </Badge>
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                      )}
                      {event.amount && (
                        <p className="text-sm font-medium">
                          Amount: {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(event.amount)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              
              {payrollEvents.filter(event => event.date === selectedDate).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No payroll events scheduled for this date
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Event Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Payroll Generation</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Payment Due</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Overtime Calculation</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Bonus Payment</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
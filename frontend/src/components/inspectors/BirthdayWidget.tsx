'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gift, Calendar } from 'lucide-react'
import { Inspector } from '@/types/inspector'

interface BirthdayWidgetProps {
  inspectors: Inspector[]
}

export function BirthdayWidget({ inspectors }: BirthdayWidgetProps) {
  // Helper function to get upcoming birthdays
  const getUpcomingBirthdays = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const nextMonth = (currentMonth + 1) % 12
    const currentYear = today.getFullYear()
    
    const upcomingBirthdays = (inspectors || [])
      .filter(inspector => inspector.date_of_birth && inspector.date_of_birth.trim() !== '')
      .map(inspector => {
        const birthDate = new Date(inspector.date_of_birth!)
        const birthMonth = birthDate.getMonth()
        const birthDay = birthDate.getDate()
        
        // Calculate this year's birthday
        let thisYearBirthday = new Date(currentYear, birthMonth, birthDay)
        
        // If birthday already passed this year, calculate next year's
        if (thisYearBirthday < today) {
          thisYearBirthday = new Date(currentYear + 1, birthMonth, birthDay)
        }
        
        // Calculate days until birthday
        const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          ...inspector,
          thisYearBirthday,
          daysUntil,
          isThisMonth: birthMonth === currentMonth,
          isNextMonth: birthMonth === nextMonth
        }
      })
      .filter(inspector => inspector.isThisMonth || inspector.isNextMonth)
      .sort((a, b) => a.daysUntil - b.daysUntil)
    
    return upcomingBirthdays
  }

  const upcomingBirthdays = getUpcomingBirthdays()

  // Convert to Jalali (simplified conversion)
  const toJalali = (date: Date) => {
    try {
      // Simple conversion - in real app use moment-jalaali
      return date.toLocaleDateString('fa-IR', {
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric'
      })
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="w-4 h-4 text-pink-600" />
          Upcoming Birthdays
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingBirthdays.length > 0 ? (
            upcomingBirthdays.slice(0, 5).map((inspector) => (
              <div 
                key={inspector.id} 
                className="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                    <Gift className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{inspector.name}</p>
                    <p className="text-xs text-gray-600">
                      {toJalali(inspector.thisYearBirthday)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge 
                    variant={inspector.daysUntil <= 7 ? "default" : "secondary"} 
                    className={`text-xs ${
                      inspector.daysUntil <= 7 
                        ? 'bg-pink-500 text-white' 
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {inspector.daysUntil === 0 ? 'Today! 🎉' : 
                     inspector.daysUntil === 1 ? 'Tomorrow' : 
                     `${inspector.daysUntil} days`}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No upcoming birthdays</p>
              <p className="text-gray-400 text-xs mt-1">
                Birthdays will appear here when they&apos;re within the next month
              </p>
            </div>
          )}
        </div>
        
        {upcomingBirthdays.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Gift className="w-3 h-3" />
                {upcomingBirthdays.length} upcoming
              </span>
              <span>
                Next 60 days
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
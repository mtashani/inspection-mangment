'use client'

import React from 'react'
import { CreateEventModal } from '@/components/maintenance-events/create-event-modal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, Info } from 'lucide-react'

export default function CreateEventTestPage() {
  const [eventCreatedCount, setEventCreatedCount] = React.useState(0)

  const handleEventCreated = () => {
    setEventCreatedCount(prev => prev + 1)
    console.log('Event created successfully!')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Event Modal Test</h1>
          <p className="text-muted-foreground">
            Test the updated create event modal with all fixes applied
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Events Created: {eventCreatedCount}
        </Badge>
      </div>

      {/* Test Results Card */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Issues Fixed
          </CardTitle>
          <CardDescription className="text-green-700">
            All reported issues have been resolved
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span><strong>Issue 1:</strong> Removed duplicate close button from modal header</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span><strong>Issue 2:</strong> Added missing event_category field to match event model</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span><strong>Issue 3:</strong> Fixed event number validation regex to be more flexible</span>
          </div>
        </CardContent>
      </Card>

      {/* Test Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Test Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">1. Single Close Button Test</h4>
            <p className="text-sm text-muted-foreground">
              Open the modal and verify there&apos;s only one close method (the default X button in the top-right corner)
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">2. Event Category Field Test</h4>
            <p className="text-sm text-muted-foreground">
              Verify the form now includes an &quot;Event Category&quot; field with Simple/Complex options
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">3. Event Number Validation Test</h4>
            <p className="text-sm text-muted-foreground">
              Try these formats and verify they&apos;re all accepted:
            </p>
            <ul className="list-disc list-inside text-xs text-muted-foreground ml-4 space-y-1">
              <li><code>MAINT-2025-001</code> (original format)</li>
              <li><code>ME-2025-1</code> (shorter format)</li>
              <li><code>REPAIR-2025-123456</code> (longer sequence)</li>
              <li><code>M1-2025-1</code> (with numbers in prefix)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Test Modal Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Default Trigger</CardTitle>
            <CardDescription>Test with the default "New Event" button</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateEventModal onEventCreated={handleEventCreated} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custom Trigger</CardTitle>
            <CardDescription>Test with a custom trigger button</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateEventModal 
              trigger={
                <Button variant="outline" className="w-full">
                  🔧 Create Maintenance Event
                </Button>
              }
              onEventCreated={handleEventCreated} 
            />
          </CardContent>
        </Card>
      </div>

      {/* Event Model Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Event Model Compliance
          </CardTitle>
          <CardDescription>
            The form now matches the MaintenanceEvent model structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Required Fields:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>✅ event_number</li>
                <li>✅ title</li>
                <li>✅ event_type</li>
                <li>✅ event_category (newly added)</li>
                <li>✅ planned_start_date</li>
                <li>✅ planned_end_date</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Optional Fields:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>✅ description</li>
                <li>✅ created_by</li>
                <li>✅ notes</li>
                <li>✅ requesting_department</li>
                <li>✅ priority (custom field)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
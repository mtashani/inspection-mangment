'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateEventModal } from '@/components/maintenance-events/create-event-modal'
import { Calendar, Settings2, Wrench } from 'lucide-react'

export default function CreateEventDemoPage() {
  const handleEventCreated = () => {
    console.log('Event created successfully!')
    // In a real app, you might refresh the events list or show a success toast
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create Event Modal Demo</h1>
        <p className="text-muted-foreground">
          Demonstration of the beautiful maintenance event creation modal with shadcn/ui components and date range picker
        </p>
      </div>

      {/* Demo Card */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Demo</CardTitle>
          <CardDescription>
            Click the button below to test the create event modal functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateEventModal onEventCreated={handleEventCreated} />
        </CardContent>
      </Card>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Key Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✅</Badge>
              <span className="text-sm">Enhanced date range picker with presets</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✅</Badge>
              <span className="text-sm">Real-time form validation</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✅</Badge>
              <span className="text-sm">Multiple event types with emojis</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✅</Badge>
              <span className="text-sm">Priority levels with visual indicators</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✅</Badge>
              <span className="text-sm">Department selection</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✅</Badge>
              <span className="text-sm">Live preview of event details</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✅</Badge>
              <span className="text-sm">85vh height with proper scrolling</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✅</Badge>
              <span className="text-sm">Compact form fields (space-y-4)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-green-500" />
              Technical Implementation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">React</Badge>
              <span className="text-sm">TypeScript with proper type safety</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">shadcn/ui</Badge>
              <span className="text-sm">Modern component library</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Tailwind</Badge>
              <span className="text-sm">Utility-first CSS framework</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Lucide</Badge>
              <span className="text-sm">Beautiful SVG icons</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">react-day-picker</Badge>
              <span className="text-sm">Advanced date range selection</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">date-fns</Badge>
              <span className="text-sm">Modern date utility library</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Types Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Available Event Types</CardTitle>
          <CardDescription>
            The modal supports various maintenance event types with visual indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-2 border rounded-lg">
              <span className="text-lg">🔧</span>
              <div>
                <p className="text-sm font-medium">Routine Maintenance</p>
                <p className="text-xs text-muted-foreground">Regular scheduled maintenance</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 border rounded-lg">
              <span className="text-lg">⚙️</span>
              <div>
                <p className="text-sm font-medium">Major Overhaul</p>
                <p className="text-xs text-muted-foreground">Complete equipment overhaul</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 border rounded-lg">
              <span className="text-lg">🚨</span>
              <div>
                <p className="text-sm font-medium">Emergency Repair</p>
                <p className="text-xs text-muted-foreground">Urgent repair required</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 border rounded-lg">
              <span className="text-lg">✅</span>
              <div>
                <p className="text-sm font-medium">Preventive Maintenance</p>
                <p className="text-xs text-muted-foreground">Prevent future issues</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 border rounded-lg">
              <span className="text-lg">🔨</span>
              <div>
                <p className="text-sm font-medium">Corrective Maintenance</p>
                <p className="text-xs text-muted-foreground">Fix existing problems</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 border rounded-lg">
              <span className="text-lg">🎯</span>
              <div>
                <p className="text-sm font-medium">Custom Event</p>
                <p className="text-xs text-muted-foreground">Custom maintenance task</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-purple-500" />
            Usage Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">1. Import the Component</h4>
            <div className="p-3 bg-muted rounded-md text-xs font-mono">
              {`import { CreateEventModal } from '@/components/maintenance-events/create-event-modal'`}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">2. Use in Your Component</h4>
            <div className="p-3 bg-muted rounded-md text-xs font-mono">
              {`<CreateEventModal onEventCreated={() => console.log('Event created!')} />`}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">3. Handle Event Creation</h4>
            <div className="p-3 bg-muted rounded-md text-xs font-mono">
              {`const handleEventCreated = () => {\n  // Refresh events list or show success message\n  refreshEvents()\n}`}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
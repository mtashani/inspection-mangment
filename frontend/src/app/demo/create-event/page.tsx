"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CreateEventModal, { CreateMaintenanceEventRequest } from '@/components/maintenance/create-event-modal';
import { Wrench, Plus, Calendar, Settings2 } from 'lucide-react';
import { RefineryDepartment } from '@/types/enhanced-maintenance';

export default function CreateEventDemoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<CreateMaintenanceEventRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCreateEvent = async (eventData: CreateMaintenanceEventRequest) => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setEvents(prev => [...prev, { ...eventData, id: Date.now().toString() } as any]);
    setLoading(false);
    
    console.log('New event created:', eventData);
  };

  const availableRequesters = [
    'Operations Team Alpha',
    'Maintenance Team Beta', 
    'Engineering Team Gamma',
    'Safety Team Delta'
  ];

  const availableDepartments = Object.values(RefineryDepartment);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="h-8 w-8 text-primary" />
            Create Event Modal Demo
          </h1>
          <p className="text-muted-foreground mt-2">
            Demonstration of the beautiful maintenance event creation modal with shadcn/ui components
          </p>
        </div>
        
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="gap-2"
          size="lg"
        >
          <Plus className="h-4 w-4" />
          Create New Event
        </Button>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Date Range Picker</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Enhanced date range picker from shadcn/ui with presets and validation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">Form Validation</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time form validation with error messages and success states
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibent">Event Types</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Multiple maintenance event types with visual indicators and priorities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
              <h3 className="font-semibold">Beautiful Design</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Modern, responsive design with smooth animations and accessibility
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Created Events */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Created Events ({events.length})</CardTitle>
            <CardDescription>
              Events created through the modal demonstration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {events.map((event, index) => (
              <div 
                key={index}
                className="p-4 border border-border rounded-lg bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <Badge variant="outline">#{event.eventNumber}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Type: {event.eventType}</span>
                      <span>Category: {event.eventCategory}</span>
                      {event.priority && <span>Priority: {event.priority}</span>}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      📅 {new Date(event.plannedStartDate).toLocaleDateString()} - {new Date(event.plannedEndDate).toLocaleDateString()}
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    )}
                  </div>
                  
                  <Badge 
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    Created
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Feature Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Modal Features</CardTitle>
            <CardDescription>Key features of the create event modal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Enhanced date range picker with presets</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Real-time form validation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Multiple event types with visual indicators</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Category selection (Simple/Complex)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Priority levels with color coding</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Department selection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Live preview of event details</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Responsive design for mobile and desktop</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Instructions</CardTitle>
            <CardDescription>How to integrate the modal in your application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">1. Import the component</h4>
              <div className="p-3 bg-muted rounded-md text-xs font-mono">
                {`import CreateEventModal from '@/components/maintenance/create-event-modal';`}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">2. Add state management</h4>
              <div className="p-3 bg-muted rounded-md text-xs font-mono">
                {`const [isModalOpen, setIsModalOpen] = useState(false);`}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">3. Handle form submission</h4>
              <div className="p-3 bg-muted rounded-md text-xs font-mono">
                {`const handleSubmit = async (data) => {\n  // Your API call here\n  await createEvent(data);\n};`}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateEvent}
        availableRequesters={availableRequesters}
        availableDepartments={availableDepartments}
        loading={loading}
      />
    </div>
  );
}
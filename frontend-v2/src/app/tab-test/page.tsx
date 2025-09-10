'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MaintenanceEvent, MaintenanceSubEvent, MaintenanceEventStatus, MaintenanceEventType } from '@/types/maintenance-events'
import { ModernTabNavigation } from '@/components/maintenance-events/modern-tab-navigation'
import { EventTabs } from '@/components/maintenance-events/event-tabs'

// Mock data for testing
const mockEvent: MaintenanceEvent = {
  id: 1,
  event_number: 'ME-2024-001',
  title: 'Test Event - New Shadcn/UI Tabs',
  description: 'Testing the new shadcn/ui tab design with animations and curved edges',
  event_type: MaintenanceEventType.Overhaul,
  status: MaintenanceEventStatus.InProgress,
  planned_start_date: '2024-01-15',
  planned_end_date: '2024-02-15',
  actual_start_date: '2024-01-16',
  created_by: 'test.user',
  approved_by: 'admin.user',
  approval_date: '2024-01-10',
  sub_events_count: 3,
  inspections_count: 12,
  direct_inspections_count: 3,
  created_at: '2024-01-01T08:00:00Z',
  updated_at: '2024-01-16T14:30:00Z',
}

const mockSubEvents: MaintenanceSubEvent[] = [
  {
    id: 1,
    parent_event_id: 1,
    sub_event_number: 'SE-001',
    title: 'Mechanical Systems',
    description: 'Mechanical maintenance',
    status: MaintenanceEventStatus.InProgress,
    planned_start_date: '2024-01-15',
    planned_end_date: '2024-01-25',
    actual_start_date: '2024-01-16',
    completion_percentage: 65,
    inspections_count: 4,
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-01-20T14:30:00Z',
  },
  {
    id: 2,
    parent_event_id: 1,
    sub_event_number: 'SE-002',
    title: 'Electrical Systems',
    description: 'Electrical maintenance',
    status: MaintenanceEventStatus.Planned,
    planned_start_date: '2024-01-26',
    planned_end_date: '2024-02-05',
    completion_percentage: 0,
    inspections_count: 3,
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-01-01T08:00:00Z',
  },
  {
    id: 3,
    parent_event_id: 1,
    sub_event_number: 'SE-003',
    title: 'Safety Systems',
    description: 'Safety inspection',
    status: MaintenanceEventStatus.Completed,
    planned_start_date: '2024-02-06',
    planned_end_date: '2024-02-15',
    completion_percentage: 100,
    inspections_count: 2,
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-01-01T08:00:00Z',
  },
]

export default function TabTestPage() {
  const [activeTab, setActiveTab] = useState('direct-inspections')
  const [search, setSearch] = useState('')
  const [inspectionStatus, setInspectionStatus] = useState<string | undefined>(undefined)
  const [equipmentTag, setEquipmentTag] = useState<string | undefined>(undefined)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">New Shadcn/UI Tabs Test</h1>
          <p className="text-muted-foreground">
            Testing the updated tab design with proper shadcn/ui components, animations, and curved outside edges.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Active Tab:</strong> {activeTab}
              </div>
              <div>
                <strong>Search:</strong> &quot;{search}&quot;
              </div>
              <div>
                <strong>Status Filter:</strong> {inspectionStatus || 'All'}
              </div>
              <div>
                <strong>Equipment Filter:</strong> {equipmentTag || 'All'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Standalone ModernTabNavigation */}
        <Card>
          <CardHeader>
            <CardTitle>1. Standalone Tab Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <ModernTabNavigation
              event={mockEvent}
              subEvents={mockSubEvents}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              maxVisibleTabs={3}
            />
          </CardContent>
        </Card>

        {/* Test Full EventTabs Integration */}
        <Card>
          <CardHeader>
            <CardTitle>2. Full EventTabs with Content Integration</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <EventTabs
              event={mockEvent}
              subEvents={mockSubEvents}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              search={search}
              onSearchChange={setSearch}
              inspectionStatus={inspectionStatus}
              onInspectionStatusChange={setInspectionStatus}
              equipmentTag={equipmentTag}
              onEquipmentTagChange={setEquipmentTag}
              onResetFilters={() => {
                setSearch('')
                setInspectionStatus(undefined)
                setEquipmentTag(undefined)
              }}
            />
          </CardContent>
        </Card>

        {/* Design Features */}
        <Card>
          <CardHeader>
            <CardTitle>3. Design Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <h4 className="font-semibold">✅ Final Optimizations:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>✅ Removed colored status dots for cleaner design</li>
                <li>✅ Tabs now fill available space (no dropdown needed)</li>
                <li>✅ Proper shadcn/ui components with minimal styling</li>
                <li>✅ Fast performance with React.memo optimization</li>
                <li>✅ Subtle animations (duration-200, scale-[1.02])</li>
                <li>✅ Curved outside edges for seamless integration</li>
                <li>✅ Left/right scroll arrows only</li>
                <li>✅ No shadows, no blinking, clean minimal design</li>
                <li>✅ Full-width tabs with centered content</li>
                <li>✅ Responsive and smooth tab switching</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
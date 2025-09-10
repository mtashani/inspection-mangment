'use client'

import React, { useState } from 'react'
import { MaintenanceEvent, MaintenanceSubEvent, MaintenanceEventStatus, OverhaulSubType } from '@/types/maintenance-events'
import { ModernTabNavigation } from './modern-tab-navigation'
import { EventTabs } from './event-tabs'

/**
 * Test component to verify tab design and data filtering
 * This component helps debug the issues:
 * 1. Tab design should look like the rounded, card-like style from the image
 * 2. Data should change when switching between tabs
 */

// Mock data for testing
const mockEvent: MaintenanceEvent = {
  id: 1,
  event_number: 'ME-2024-001',
  title: 'Test Event - Tab Design & Data Filtering',
  description: 'Testing the new tab design and data filtering functionality',
  event_type: 'Overhaul',
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
    sub_type: OverhaulSubType.Mechanical,
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
    sub_type: OverhaulSubType.Electrical,
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
    sub_type: OverhaulSubType.Safety,
    status: MaintenanceEventStatus.Planned,
    planned_start_date: '2024-02-06',
    planned_end_date: '2024-02-15',
    completion_percentage: 0,
    inspections_count: 2,
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-01-01T08:00:00Z',
  },
]

export function TabDebugTest() {
  const [activeTab, setActiveTab] = useState('direct-inspections')
  const [search, setSearch] = useState('')
  const [inspectionStatus, setInspectionStatus] = useState<string | undefined>(undefined)
  const [equipmentTag, setEquipmentTag] = useState<string | undefined>(undefined)

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Tab Design & Data Filtering Test</h1>
        <p className="text-muted-foreground">
          Testing the new rounded tab design and debugging data filtering between tabs.
        </p>
        <div className="text-sm bg-muted p-3 rounded-lg">
          <strong>Current Tab:</strong> {activeTab} | 
          <strong> Search:</strong> &quot;{search}&quot; | 
          <strong> Status:</strong> {inspectionStatus || 'All'} | 
          <strong> Equipment:</strong> {equipmentTag || 'All'}
        </div>
      </div>

      {/* Test the standalone ModernTabNavigation component */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">1. Modern Tab Navigation (Standalone)</h2>
        <div className="border rounded-lg p-4">
          <ModernTabNavigation
            event={mockEvent}
            subEvents={mockSubEvents}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            maxVisibleTabs={3}
          />
        </div>
      </div>

      {/* Test the full EventTabs component with data integration */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">2. Full Event Tabs with Data Integration</h2>
        <div className="border rounded-lg p-4">
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
        </div>
      </div>

      {/* Debug information */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">3. Debug Information</h2>
        <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
          <div><strong>Active Tab ID:</strong> {activeTab}</div>
          <div><strong>Current Sub-Event ID:</strong> {
            activeTab.startsWith('sub-event-') ? 
            activeTab.replace('sub-event-', '') : 
            'N/A (Direct Inspections)'
          }</div>
          <div><strong>Expected Behavior:</strong></div>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Tabs should have rounded, card-like design with shadow effects</li>
            <li>Active tab should have a subtle glow and scale effect</li>
            <li>Console should show debugging logs when switching tabs</li>
            <li>Data should change/reload when switching between tabs</li>
            <li>Each tab should fetch inspections for its specific subEventId</li>
          </ul>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">4. Testing Instructions</h2>
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg text-sm space-y-2">
          <div><strong>To test the fixes:</strong></div>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Open browser console to see debugging logs</li>
            <li>Click between different tabs (Direct Inspections, Mechanical Systems, etc.)</li>
            <li>Verify the tab design matches the rounded style from the image</li>
            <li>Check console logs to see if data is changing between tabs</li>
            <li>Try different search terms and filters to test data filtering</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default TabDebugTest
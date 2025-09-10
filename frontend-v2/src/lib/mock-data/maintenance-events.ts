/**
 * Mock data for Maintenance Events system testing
 */

import {
  MaintenanceEvent,
  MaintenanceSubEvent,
  Inspection,
  DailyReport,
  Equipment,
  EventsSummary,
  MaintenanceEventType,
  MaintenanceEventStatus,
  InspectionStatus,
  RefineryDepartment,
  OverhaulSubType,
} from '@/types/maintenance-events'

// Mock Equipment data
export const mockEquipment: Equipment[] = [
  {
    id: 1,
    tag: 'P-101',
    description: 'Main Feed Pump',
    location: 'Unit 100',
    manufacturer: 'Flowserve',
    model: 'API 610',
    serial_number: 'FS-2023-001',
    installation_date: '2020-01-15',
    status: 'Active',
  },
  {
    id: 2,
    tag: 'V-201',
    description: 'Pressure Vessel',
    location: 'Unit 200',
    manufacturer: 'Pressure Systems',
    model: 'PSV-500',
    serial_number: 'PS-2023-002',
    installation_date: '2019-06-20',
    status: 'Active',
  },
  {
    id: 3,
    tag: 'HX-301',
    description: 'Heat Exchanger',
    location: 'Unit 300',
    manufacturer: 'Alfa Laval',
    model: 'AlfaRex',
    serial_number: 'AL-2023-003',
    installation_date: '2021-03-10',
    status: 'Active',
  },
]

// Mock Maintenance Events
export const mockMaintenanceEvents: MaintenanceEvent[] = [
  {
    id: 1,
    event_number: 'ME-2024-001',
    title: 'Annual Overhaul - Unit 100',
    description: 'Comprehensive overhaul of Unit 100 including all major equipment',
    event_type: MaintenanceEventType.Overhaul,
    status: MaintenanceEventStatus.InProgress,
    planned_start_date: '2024-01-15',
    planned_end_date: '2024-02-15',
    actual_start_date: '2024-01-16',
    created_by: 'John Smith',
    approved_by: 'Jane Doe',
    approval_date: '2024-01-10',
    notes: 'Critical overhaul for production optimization',
    sub_events_count: 3,
    inspections_count: 12,
    direct_inspections_count: 5,
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-01-16T10:30:00Z',
  },
  {
    id: 2,
    event_number: 'ME-2024-002',
    title: 'Quarterly Inspection - Unit 200',
    description: 'Routine quarterly inspection of pressure vessels and safety systems',
    event_type: MaintenanceEventType.Inspection,
    status: MaintenanceEventStatus.Planned,
    planned_start_date: '2024-02-01',
    planned_end_date: '2024-02-05',
    created_by: 'Mike Johnson',
    notes: 'Focus on pressure safety valves',
    sub_events_count: 0,
    inspections_count: 8,
    direct_inspections_count: 8,
    created_at: '2024-01-20T09:00:00Z',
    updated_at: '2024-01-20T09:00:00Z',
  },
  {
    id: 3,
    event_number: 'ME-2024-003',
    title: 'Emergency Repair - Heat Exchanger',
    description: 'Emergency repair of leaking heat exchanger HX-301',
    event_type: MaintenanceEventType.Emergency,
    status: MaintenanceEventStatus.Completed,
    planned_start_date: '2024-01-05',
    planned_end_date: '2024-01-07',
    actual_start_date: '2024-01-05',
    actual_end_date: '2024-01-06',
    created_by: 'Sarah Wilson',
    approved_by: 'John Smith',
    approval_date: '2024-01-05',
    notes: 'Urgent repair completed ahead of schedule',
    sub_events_count: 2,
    inspections_count: 4,
    direct_inspections_count: 2,
    created_at: '2024-01-05T06:00:00Z',
    updated_at: '2024-01-06T18:00:00Z',
  },
]

// Mock Maintenance Sub Events
export const mockMaintenanceSubEvents: MaintenanceSubEvent[] = [
  {
    id: 1,
    parent_event_id: 1,
    sub_event_number: 'SE-2024-001-01',
    title: 'Mechanical Systems Overhaul',
    description: 'Overhaul of all mechanical systems including pumps and compressors',
    sub_type: OverhaulSubType.Mechanical,
    status: MaintenanceEventStatus.InProgress,
    planned_start_date: '2024-01-15',
    planned_end_date: '2024-01-25',
    actual_start_date: '2024-01-16',
    completion_percentage: 65,
    notes: 'Pump P-101 requires additional attention',
    inspections_count: 4,
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-01-20T14:30:00Z',
  },
  {
    id: 2,
    parent_event_id: 1,
    sub_event_number: 'SE-2024-001-02',
    title: 'Electrical Systems Overhaul',
    description: 'Electrical systems maintenance and upgrades',
    sub_type: OverhaulSubType.Electrical,
    status: MaintenanceEventStatus.Planned,
    planned_start_date: '2024-01-26',
    planned_end_date: '2024-02-05',
    completion_percentage: 0,
    notes: 'Waiting for mechanical completion',
    inspections_count: 3,
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-01-01T08:00:00Z',
  },
  {
    id: 3,
    parent_event_id: 1,
    sub_event_number: 'SE-2024-001-03',
    title: 'Instrumentation Calibration',
    description: 'Calibration and testing of all instrumentation',
    sub_type: OverhaulSubType.Instrumentation,
    status: MaintenanceEventStatus.Planned,
    planned_start_date: '2024-02-06',
    planned_end_date: '2024-02-15',
    completion_percentage: 0,
    notes: 'Final phase of overhaul',
    inspections_count: 5,
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-01-01T08:00:00Z',
  },
  {
    id: 4,
    parent_event_id: 3,
    sub_event_number: 'SE-2024-003-01',
    title: 'Heat Exchanger Tube Replacement',
    description: 'Replace damaged tubes in heat exchanger',
    sub_type: OverhaulSubType.Mechanical,
    status: MaintenanceEventStatus.Completed,
    planned_start_date: '2024-01-05',
    planned_end_date: '2024-01-06',
    actual_start_date: '2024-01-05',
    actual_end_date: '2024-01-06',
    completion_percentage: 100,
    notes: 'Successfully completed',
    inspections_count: 2,
    created_at: '2024-01-05T06:00:00Z',
    updated_at: '2024-01-06T16:00:00Z',
  },
]

// Mock Inspections
export const mockInspections: Inspection[] = [
  {
    id: 1,
    inspection_number: 'INS-2024-001',
    title: 'Pump P-101 Mechanical Inspection',
    description: 'Detailed mechanical inspection of main feed pump',
    start_date: '2024-01-16',
    end_date: '2024-01-18',
    status: InspectionStatus.InProgress,
    equipment_id: 1,
    equipment_tag: 'P-101',
    equipment_description: 'Main Feed Pump',
    requesting_department: RefineryDepartment.Maintenance,
    work_order: 'WO-2024-001',
    permit_number: 'PTW-2024-001',
    daily_reports_count: 2,
    maintenance_event_id: 1,
    maintenance_sub_event_id: 1,
    is_planned: true,
    planned_date: '2024-01-16',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-17T16:30:00Z',
  },
  {
    id: 2,
    inspection_number: 'INS-2024-002',
    title: 'Pressure Vessel V-201 Inspection',
    description: 'Annual pressure vessel inspection and testing',
    start_date: '2024-02-01',
    status: InspectionStatus.InProgress,
    equipment_id: 2,
    equipment_tag: 'V-201',
    equipment_description: 'Pressure Vessel',
    requesting_department: RefineryDepartment.Safety,
    work_order: 'WO-2024-002',
    permit_number: 'PTW-2024-002',
    daily_reports_count: 1,
    maintenance_event_id: 2,
    is_planned: true,
    planned_date: '2024-02-01',
    created_at: '2024-01-20T09:00:00Z',
    updated_at: '2024-02-01T10:00:00Z',
  },
  {
    id: 3,
    inspection_number: 'INS-2024-003',
    title: 'Heat Exchanger HX-301 Emergency Inspection',
    description: 'Emergency inspection following leak detection',
    start_date: '2024-01-05',
    end_date: '2024-01-05',
    status: InspectionStatus.Completed,
    equipment_id: 3,
    equipment_tag: 'HX-301',
    equipment_description: 'Heat Exchanger',
    requesting_department: RefineryDepartment.Operations,
    final_report: 'Tube leak confirmed, replacement required',
    work_order: 'WO-2024-003',
    permit_number: 'PTW-2024-003',
    daily_reports_count: 1,
    maintenance_event_id: 3,
    maintenance_sub_event_id: 4,
    is_planned: false,
    created_at: '2024-01-05T06:00:00Z',
    updated_at: '2024-01-05T18:00:00Z',
  },
  {
    id: 4,
    inspection_number: 'INS-2024-004',
    title: 'Electrical Panel Inspection',
    description: 'Electrical safety inspection of main control panel',
    start_date: '2024-01-26',
    status: InspectionStatus.InProgress,
    equipment_id: 1,
    equipment_tag: 'EP-101',
    equipment_description: 'Main Electrical Panel',
    requesting_department: RefineryDepartment.Engineering,
    work_order: 'WO-2024-004',
    daily_reports_count: 0,
    maintenance_event_id: 1,
    maintenance_sub_event_id: 2,
    is_planned: true,
    planned_date: '2024-01-26',
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-01-26T09:00:00Z',
  },
]

// Mock Daily Reports
export const mockDailyReports: DailyReport[] = [
  {
    id: 1,
    inspection_id: 1,
    report_date: '2024-01-16',
    description: 'Initial inspection of pump P-101 mechanical components',
    inspector_ids: [1, 2],
    inspector_names: 'John Smith, Mike Johnson',
    findings: 'Bearing wear detected on drive end. Vibration levels elevated.',
    recommendations: 'Replace bearings and perform alignment check.',
    weather_conditions: 'Clear, 22°C',
    safety_notes: 'All safety protocols followed. No incidents.',
    attachments: ['photo_bearing_wear.jpg', 'vibration_analysis.pdf'],
    created_at: '2024-01-16T18:00:00Z',
    updated_at: '2024-01-16T18:00:00Z',
  },
  {
    id: 2,
    inspection_id: 1,
    report_date: '2024-01-17',
    description: 'Continued inspection and bearing replacement preparation',
    inspector_ids: [1, 3],
    inspector_names: 'John Smith, Sarah Wilson',
    findings: 'Bearing replacement parts received. Pump ready for disassembly.',
    recommendations: 'Proceed with bearing replacement tomorrow.',
    weather_conditions: 'Partly cloudy, 20°C',
    safety_notes: 'Lockout/tagout procedures verified.',
    attachments: ['parts_received.jpg'],
    created_at: '2024-01-17T17:30:00Z',
    updated_at: '2024-01-17T17:30:00Z',
  },
  {
    id: 3,
    inspection_id: 2,
    report_date: '2024-02-01',
    description: 'Pressure vessel V-201 visual inspection commenced',
    inspector_ids: [2],
    inspector_names: 'Mike Johnson',
    findings: 'External visual inspection completed. No obvious defects found.',
    recommendations: 'Proceed with internal inspection after depressurization.',
    weather_conditions: 'Overcast, 18°C',
    safety_notes: 'Confined space entry procedures reviewed.',
    created_at: '2024-02-01T16:00:00Z',
    updated_at: '2024-02-01T16:00:00Z',
  },
  {
    id: 4,
    inspection_id: 3,
    report_date: '2024-01-05',
    description: 'Emergency inspection of heat exchanger HX-301 leak',
    inspector_ids: [1, 2, 3],
    inspector_names: 'John Smith, Mike Johnson, Sarah Wilson',
    findings: 'Tube leak confirmed at tube sheet junction. Significant corrosion detected.',
    recommendations: 'Immediate shutdown required. Tube replacement necessary.',
    weather_conditions: 'Clear, 25°C',
    safety_notes: 'Emergency response procedures activated. Area isolated.',
    attachments: ['leak_location.jpg', 'corrosion_analysis.pdf'],
    created_at: '2024-01-05T14:00:00Z',
    updated_at: '2024-01-05T14:00:00Z',
  },
]

// Mock Events Summary
export const mockEventsSummary: EventsSummary = {
  totalEvents: 15,
  activeEvents: 8,
  completedEvents: 5,
  overdueEvents: 2,
  totalInspections: 45,
  activeInspections: 18,
  plannedInspections: 35,
  unplannedInspections: 10,
  completedInspections: 22,
  totalReports: 120,
  reportsThisMonth: 28,
}

// Helper functions for filtering mock data
export const filterMaintenanceEvents = (filters: {
  search?: string
  status?: MaintenanceEventStatus
  eventType?: MaintenanceEventType
}) => {
  let filtered = [...mockMaintenanceEvents]

  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(
      event =>
        event.title.toLowerCase().includes(searchLower) ||
        event.event_number.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower)
    )
  }

  if (filters.status) {
    filtered = filtered.filter(event => event.status === filters.status)
  }

  if (filters.eventType) {
    filtered = filtered.filter(event => event.event_type === filters.eventType)
  }

  return filtered
}

export const filterInspections = (filters: {
  eventId?: string
  subEventId?: number
  search?: string
  status?: InspectionStatus
}) => {
  let filtered = [...mockInspections]

  if (filters.eventId) {
    filtered = filtered.filter(
      inspection => inspection.maintenance_event_id === parseInt(filters.eventId!)
    )
  }

  if (filters.subEventId) {
    filtered = filtered.filter(
      inspection => inspection.maintenance_sub_event_id === filters.subEventId
    )
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(
      inspection =>
        inspection.title.toLowerCase().includes(searchLower) ||
        inspection.inspection_number.toLowerCase().includes(searchLower) ||
        inspection.equipment_tag?.toLowerCase().includes(searchLower)
    )
  }

  if (filters.status) {
    filtered = filtered.filter(inspection => inspection.status === filters.status)
  }

  return filtered
}

export const filterDailyReports = (filters: {
  inspectionId?: number
  search?: string
}) => {
  let filtered = [...mockDailyReports]

  if (filters.inspectionId) {
    filtered = filtered.filter(report => report.inspection_id === filters.inspectionId)
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(
      report =>
        report.description.toLowerCase().includes(searchLower) ||
        report.findings?.toLowerCase().includes(searchLower) ||
        report.inspector_names?.toLowerCase().includes(searchLower)
    )
  }

  return filtered
}
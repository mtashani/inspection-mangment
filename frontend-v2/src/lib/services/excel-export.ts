import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { EventsSummary, MaintenanceEvent, MaintenanceSubEvent, Inspection, DailyReport } from '@/types/maintenance-events'

interface ExportData {
  summary?: EventsSummary
  events?: MaintenanceEvent[]
  subEvents?: MaintenanceSubEvent[]
  inspections?: Inspection[]
  reports?: DailyReport[]
}

export class ExcelExportService {
  /**
   * Export maintenance events data to Excel format
   */
  static async exportMaintenanceData(data: ExportData): Promise<void> {
    const workbook = XLSX.utils.book_new()
    
    // Sheet 1: Summary
    if (data.summary) {
      const summarySheet = this.createSummarySheet(data.summary)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
    }
    
    // Sheet 2: Events Details
    if (data.events && data.events.length > 0) {
      const eventsSheet = this.createEventsSheet(data.events)
      XLSX.utils.book_append_sheet(workbook, eventsSheet, 'Events')
    }
    
    // Sheet 3: Sub Events
    if (data.subEvents && data.subEvents.length > 0) {
      const subEventsSheet = this.createSubEventsSheet(data.subEvents)
      XLSX.utils.book_append_sheet(workbook, subEventsSheet, 'Sub Events')
    }
    
    // Sheet 4: Inspections
    if (data.inspections && data.inspections.length > 0) {
      const inspectionsSheet = this.createInspectionsSheet(data.inspections)
      XLSX.utils.book_append_sheet(workbook, inspectionsSheet, 'Inspections')
    }
    
    // Sheet 5: Reports
    if (data.reports && data.reports.length > 0) {
      const reportsSheet = this.createReportsSheet(data.reports)
      XLSX.utils.book_append_sheet(workbook, reportsSheet, 'Reports')
    }
    
    // Generate filename with current date
    const filename = `Maintenance_Events_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    
    // Write and download file
    XLSX.writeFile(workbook, filename)
  }
  
  /**
   * Create summary statistics sheet
   */
  private static createSummarySheet(summary: EventsSummary): XLSX.WorkSheet {
    const data = [
      ['📊 Maintenance Events Summary', '', ''],
      ['Generated on:', format(new Date(), 'yyyy-MM-dd HH:mm:ss'), ''],
      ['', '', ''],
      ['Metric', 'Count', 'Percentage'],
      ['Total Events', summary.totalEvents, '100%'],
      ['Active Events', summary.activeEvents, summary.totalEvents > 0 ? `${((summary.activeEvents / summary.totalEvents) * 100).toFixed(1)}%` : '0%'],
      ['Completed Events', summary.completedEvents, summary.totalEvents > 0 ? `${((summary.completedEvents / summary.totalEvents) * 100).toFixed(1)}%` : '0%'],
      ['', '', ''],
      ['Total Inspections', summary.totalInspections, '100%'],
      ['Active Inspections', summary.activeInspections, summary.totalInspections > 0 ? `${((summary.activeInspections / summary.totalInspections) * 100).toFixed(1)}%` : '0%'],
      ['Completed Inspections', summary.completedInspections, summary.totalInspections > 0 ? `${((summary.completedInspections / summary.totalInspections) * 100).toFixed(1)}%` : '0%'],
      ['Planned Inspections', summary.plannedInspections, summary.totalInspections > 0 ? `${((summary.plannedInspections / summary.totalInspections) * 100).toFixed(1)}%` : '0%'],
      ['Unplanned Inspections', summary.unplannedInspections, summary.totalInspections > 0 ? `${((summary.unplannedInspections / summary.totalInspections) * 100).toFixed(1)}%` : '0%'],
      ['Pending Inspections', (summary.totalInspections - summary.completedInspections - summary.activeInspections), ''],
      ['', '', ''],
      ['Total Reports', summary.totalReports, '-'],
      ['Reports This Month', summary.reportsThisMonth, '-'],
    ]
    
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 25 }, // Metric column
      { width: 15 }, // Count column  
      { width: 15 }  // Percentage column
    ]
    
    return worksheet
  }
  
  /**
   * Create events details sheet
   */
  private static createEventsSheet(events: MaintenanceEvent[]): XLSX.WorkSheet {
    const headers = [
      'Event Number',
      'Title', 
      'Type',
      'Status',
      'Category',
      'Start Date',
      'End Date',
      'Department',
      'Created By',
      'Created At',
      'Description'
    ]
    
    const data = [
      headers,
      ...events.map(event => [
        event.event_number || '',
        event.title || '',
        event.event_type || '',
        event.status || '',
        event.event_category || '',
        event.planned_start_date || '',
        event.planned_end_date || '',
        event.requesting_department || '',
        event.created_by || '',
        event.created_at ? format(new Date(event.created_at), 'yyyy-MM-dd HH:mm') : '',
        event.description || ''
      ])
    ]
    
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 18 }, // Event Number
      { width: 25 }, // Title
      { width: 12 }, // Type
      { width: 12 }, // Status
      { width: 12 }, // Category
      { width: 12 }, // Start Date
      { width: 12 }, // End Date
      { width: 15 }, // Department
      { width: 15 }, // Created By
      { width: 18 }, // Created At
      { width: 30 }  // Description
    ]
    
    return worksheet
  }
  
  /**
   * Create sub events sheet
   */
  private static createSubEventsSheet(subEvents: MaintenanceSubEvent[]): XLSX.WorkSheet {
    const headers = [
      'Sub Event ID',
      'Parent Event ID',
      'Title',
      'Description',
      'Status',
      'Start Date',
      'End Date',
      'Actual Start',
      'Actual End',
      'Assigned To',
      'Priority',
      'Progress (%)',
      'Notes',
      'Created At'
    ]
    
    const data = [
      headers,
      ...subEvents.map(subEvent => [
        subEvent.id?.toString() || '',
        subEvent.parent_event_id?.toString() || '',
        subEvent.title || '',
        subEvent.description || '',
        subEvent.status || '',
        subEvent.planned_start_date || '',
        subEvent.planned_end_date || '',
        subEvent.actual_start_date || '',
        subEvent.actual_end_date || '',
        subEvent.assigned_to || '',
        subEvent.priority || '',
        subEvent.progress_percentage?.toString() || '0',
        subEvent.notes || '',
        subEvent.created_at ? format(new Date(subEvent.created_at), 'yyyy-MM-dd HH:mm') : ''
      ])
    ]
    
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 12 }, // Sub Event ID
      { width: 15 }, // Parent Event ID
      { width: 25 }, // Title
      { width: 30 }, // Description
      { width: 12 }, // Status
      { width: 12 }, // Start Date
      { width: 12 }, // End Date
      { width: 12 }, // Actual Start
      { width: 12 }, // Actual End
      { width: 15 }, // Assigned To
      { width: 10 }, // Priority
      { width: 12 }, // Progress
      { width: 25 }, // Notes
      { width: 18 }  // Created At
    ]
    
    return worksheet
  }
  
  /**
   * Create inspections sheet
   */
  private static createInspectionsSheet(inspections: Inspection[]): XLSX.WorkSheet {
    const headers = [
      'Inspection ID',
      'Title',
      'Equipment Tag', 
      'Status',
      'Type',
      'Is Planned',
      'Inspector',
      'Start Date',
      'End Date',
      'Actual Start',
      'Actual End',
      'Event Number',
      'Work Order',
      'Department'
    ]
    
    const data = [
      headers,
      ...inspections.map(inspection => [
        inspection.id?.toString() || '',
        inspection.title || '',
        inspection.equipment_tag || '',
        inspection.status || '',
        inspection.inspection_type || '',
        inspection.is_planned ? 'Planned' : 'Unplanned',
        inspection.inspector_name || '',
        inspection.start_date || '',
        inspection.end_date || '',
        inspection.actual_start_date || '',
        inspection.actual_end_date || '',
        inspection.event_number || '',
        inspection.work_order || '',
        inspection.requesting_department || ''
      ])
    ]
    
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 12 }, // ID
      { width: 25 }, // Title
      { width: 15 }, // Equipment Tag
      { width: 12 }, // Status
      { width: 12 }, // Type
      { width: 12 }, // Is Planned
      { width: 15 }, // Inspector
      { width: 12 }, // Start Date
      { width: 12 }, // End Date
      { width: 12 }, // Actual Start
      { width: 12 }, // Actual End
      { width: 18 }, // Event Number
      { width: 15 }, // Work Order
      { width: 15 }  // Department
    ]
    
    return worksheet
  }
  
  /**
   * Create reports sheet
   */
  private static createReportsSheet(reports: DailyReport[]): XLSX.WorkSheet {
    const headers = [
      'Report Date',
      'Inspection ID',
      'Equipment Tag',
      'Inspector Names',
      'Description',
      'Findings',
      'Recommendations',
      'Weather Conditions',
      'Safety Notes',
      'Location'
    ]
    
    const data = [
      headers,
      ...reports.map(report => [
        report.report_date || '',
        report.inspection_id?.toString() || '',
        report.equipment_tag || '',
        report.inspector_names || '',
        report.description || '',
        report.findings || '',
        report.recommendations || '',
        report.weather_conditions || '',
        report.safety_notes || '',
        report.location || ''
      ])
    ]
    
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    
    // Set column widths  
    worksheet['!cols'] = [
      { width: 12 }, // Report Date
      { width: 12 }, // Inspection ID
      { width: 15 }, // Equipment Tag
      { width: 20 }, // Inspector Names
      { width: 30 }, // Description
      { width: 30 }, // Findings
      { width: 30 }, // Recommendations
      { width: 15 }, // Weather
      { width: 25 }, // Safety Notes
      { width: 15 }  // Location
    ]
    
    return worksheet
  }
}
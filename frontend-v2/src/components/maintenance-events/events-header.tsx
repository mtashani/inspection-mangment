'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { CreateEventModal } from './create-event-modal'
import { useMaintenanceEvents, useEventsSummary, useInspections, useDailyReports } from '@/hooks/use-maintenance-events'
import { maintenanceEventsApi } from '@/lib/api/maintenance-events'
import { ExcelExportService } from '@/lib/services/excel-export'
import { toast } from 'sonner'

export function EventsHeader() {
  const [isExporting, setIsExporting] = useState(false)
  
  // Get data for export
  const { data: events } = useMaintenanceEvents()
  const { data: summary } = useEventsSummary()
  
  // Fetch all inspections and daily reports for export (no filters to get all data)
  const { data: allInspections } = useInspections() // Empty filters will now fetch all
  const { data: allReports } = useDailyReports() // Empty filters will fetch all
  
  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Fetch all sub-events for all events using the proper API
      const subEventsPromises = events?.map(async (event) => {
        try {
          // Use the API service to get sub-events for each event
          const subEvents = await maintenanceEventsApi.getMaintenanceSubEvents(event.id.toString())
          return subEvents || []
        } catch (error) {
          console.warn(`Failed to fetch sub-events for event ${event.id}:`, error)
          return []
        }
      }) || []
      
      const allSubEventsArrays = await Promise.all(subEventsPromises)
      const allSubEvents = allSubEventsArrays.flat()
      
      console.log('📊 Export data summary:', {
        eventsCount: events?.length || 0,
        subEventsCount: allSubEvents.length,
        inspectionsCount: allInspections?.length || 0,
        reportsCount: allReports?.length || 0
      })
      
      await ExcelExportService.exportMaintenanceData({
        summary,
        events: events || [],
        subEvents: allSubEvents,
        inspections: allInspections || [],
        reports: allReports || []
      })
      
      toast.success('📊 Excel file exported successfully!')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Maintenance Events
        </h1>
        <p className="text-muted-foreground">
          Manage maintenance events, inspections, and daily reports
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="gap-2"
        >
          <Download className={`h-4 w-4 ${isExporting ? 'animate-bounce' : ''}`} />
          {isExporting ? 'Exporting...' : 'Export to Excel'}
        </Button>
        
        <CreateEventModal />
      </div>
    </div>
  )
}
// Daily Reports Page - Redirects to Maintenance Events
// The daily reports functionality has been integrated into the maintenance events workflow

import { redirect } from 'next/navigation'
import { Metadata } from 'next'

// Page metadata for SEO
export const metadata: Metadata = {
  title: 'Daily Reports | Inspection Management System',
  description: 'View and manage daily inspection reports, maintenance events, and equipment status',
  keywords: ['daily reports', 'inspections', 'maintenance', 'equipment', 'reports'],
}

/**
 * Daily Reports Page Component
 * 
 * This page now redirects to the Maintenance Events page where daily reports
 * are managed within the context of maintenance events and inspections.
 * 
 * Workflow:
 * 1. Maintenance Events (list view)
 * 2. Event Details (with sub-events as tabs)
 * 3. Inspections (within each tab)
 * 4. Daily Reports (collapsible under each inspection)
 */
export default function DailyReportsPage() {
  // Redirect to the maintenance events page
  redirect('/maintenance-events')
}

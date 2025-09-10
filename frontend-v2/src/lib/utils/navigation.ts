// Navigation utilities and breadcrumb helpers

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

// Common breadcrumb patterns
export const navigationPaths = {
  dashboard: { label: 'Inspection Management', href: '/dashboard' },
  maintenanceEvents: { label: 'Maintenance Events', href: '/maintenance-events' },
  dailyReports: { label: 'Daily Reports', href: '/daily-reports' },
  inspections: { label: 'Inspections', href: '/inspections' },
  equipment: { label: 'Equipment', href: '/equipment' },
  reports: { label: 'Reports', href: '/reports' },
} as const

// Breadcrumb builders
export function buildMaintenanceEventsBreadcrumbs(eventId?: string, eventTitle?: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    navigationPaths.dashboard,
    navigationPaths.maintenanceEvents,
  ]

  if (eventId && eventTitle) {
    breadcrumbs.push({
      label: eventTitle,
      href: `/maintenance-events/${eventId}`,
      current: true
    })
  } else if (eventId) {
    breadcrumbs.push({
      label: `Event #${eventId}`,
      href: `/maintenance-events/${eventId}`,
      current: true
    })
  } else {
    breadcrumbs[breadcrumbs.length - 1].current = true
  }

  return breadcrumbs
}

export function buildDailyReportsBreadcrumbs(
  reportId?: string, 
  action?: 'view' | 'edit' | 'create' | 'dashboard'
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    navigationPaths.dashboard,
    navigationPaths.dailyReports,
  ]

  if (action === 'dashboard') {
    breadcrumbs.push({
      label: 'Dashboard',
      current: true
    })
  } else if (action === 'create') {
    breadcrumbs.push({
      label: 'Create Report',
      current: true
    })
  } else if (reportId) {
    breadcrumbs.push({
      label: `Report #${reportId}`,
      href: `/daily-reports/${reportId}`,
      current: action !== 'edit'
    })
    
    if (action === 'edit') {
      breadcrumbs.push({
        label: 'Edit',
        current: true
      })
    }
  } else {
    breadcrumbs[breadcrumbs.length - 1].current = true
  }

  return breadcrumbs
}

export function buildInspectionsBreadcrumbs(inspectionId?: string, inspectionTitle?: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    navigationPaths.dashboard,
    navigationPaths.inspections,
  ]

  if (inspectionId && inspectionTitle) {
    breadcrumbs.push({
      label: inspectionTitle,
      href: `/inspections/${inspectionId}`,
      current: true
    })
  } else if (inspectionId) {
    breadcrumbs.push({
      label: `Inspection #${inspectionId}`,
      href: `/inspections/${inspectionId}`,
      current: true
    })
  } else {
    breadcrumbs[breadcrumbs.length - 1].current = true
  }

  return breadcrumbs
}

// Active navigation detection
export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard'
  }
  
  return pathname.startsWith(href)
}

// Navigation menu items with active state
export function getNavigationItems(currentPath: string) {
  return [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: 'BarChart3',
      isActive: currentPath === '/dashboard',
    },
    {
      title: 'Maintenance Events',
      url: '/maintenance-events',
      icon: 'Wrench',
      isActive: isActiveRoute(currentPath, '/maintenance-events'),
    },
    {
      title: 'Daily Reports',
      url: '#',
      icon: 'FileText',
      isActive: isActiveRoute(currentPath, '/daily-reports'),
      items: [
        {
          title: 'Dashboard',
          url: '/daily-reports/dashboard',
          isActive: currentPath === '/daily-reports/dashboard',
        },
        {
          title: 'All Reports',
          url: '/daily-reports',
          isActive: currentPath === '/daily-reports' && !currentPath.includes('/dashboard'),
        },
        {
          title: 'Create Report',
          url: '/daily-reports/create',
          isActive: currentPath === '/daily-reports/create',
        },
      ],
    },
    {
      title: 'Inspections',
      url: '#',
      icon: 'Shield',
      isActive: isActiveRoute(currentPath, '/inspections'),
      items: [
        {
          title: 'All Inspections',
          url: '/inspections',
          isActive: currentPath === '/inspections',
        },
        {
          title: 'New Inspection',
          url: '/inspections/new',
          isActive: currentPath === '/inspections/new',
        },
        {
          title: 'Pending Reviews',
          url: '/inspections/pending',
          isActive: currentPath === '/inspections/pending',
        },
      ],
    },
  ]
}

// URL parameter helpers
export function getEventIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/maintenance-events\/([^\/]+)/)
  return match ? match[1] : null
}

export function getReportIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/daily-reports\/([^\/]+)/)
  return match ? match[1] : null
}

export function getInspectionIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/inspections\/([^\/]+)/)
  return match ? match[1] : null
}
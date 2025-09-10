import {
  Shield,
  FileText,
  Users,
  BarChart3,
  Wrench,
  UserCog,
  Upload,
  Database,
  LayoutDashboard,
  Ship
} from "lucide-react"

// Using Ship icon instead of Crane as Crane is not available in lucide-react

import { SpecialtyCode } from "@/types/inspector"

export interface NavigationItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  specialty?: SpecialtyCode
  adminOnly?: boolean
  children?: NavigationItem[]
}

export interface NavigationGroup {
  id: string
  label?: string
  items: NavigationItem[]
}

export const navigationGroups: NavigationGroup[] = [
  {
    id: 'main',
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        label: "Equipment",
        href: "/equipment",
        icon: Database,
      },
      {
        label: "Daily Reports",
        href: "/daily-reports",
        icon: FileText,
        children: [
          {
            label: "Standard Reports",
            href: "/daily-reports",
            icon: FileText,
          },
          {
            label: "Enhanced Reports",
            href: "/daily-reports/enhanced",
            icon: FileText,
          }
        ]
      },
      {
        label: "PSV",
        href: "/psv",
        icon: Shield,
        children: [
          {
            label: "Calibration",
            href: "/psv/calibration",
            icon: Wrench,
            specialty: "PSV"
          },
          {
            label: "Analytics",
            href: "/psv/analytics",
            icon: BarChart3,
            specialty: "PSV"
          }
        ]
      },
      {
        label: "Crane",
        href: "/cranes",
        icon: Ship,
      },
      {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
      },
      {
        label: "Admin Panel",
        href: "/admin",
        icon: UserCog,
        adminOnly: true,
        children: [
          {
            label: "Inspectors",
            href: "/admin/inspectors",
            icon: Users,
            adminOnly: true
          },
          {
            label: "Templates",
            href: "/admin/templates",
            icon: FileText,
            adminOnly: true
          },
          {
            label: "Bulk Operations",
            href: "/admin/bulk-operations",
            icon: Upload,
            adminOnly: true
          }
        ]
      }
    ]
  }
]

// Flattened navigation items for backward compatibility
export const navigationItems = navigationGroups.flatMap(group => 
  group.items.flatMap(item => 
    [item, ...(item.children || [])]
  )
);
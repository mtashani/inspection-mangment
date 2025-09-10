import {
  Home,
  Shield,
  Settings,
  FileText,
  Users,
  BarChart3,
  Search,
  Wrench,
  Zap,
  UserCog,
  Plus,
  Upload,
  Database
} from "lucide-react"

import { SpecialtyCode } from "@/types/inspector"

interface NavigationItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  specialty?: SpecialtyCode
  adminOnly?: boolean
}

export const navigationItems: NavigationItem[] = [
  {
    label: "Login",
    href: "/login",
    icon: UserCog,
  },
  {
    label: "Dashboard",
    href: "/",
    icon: Home,
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
  },
  {
    label: "Inspections",
    href: "/inspections",
    icon: Search,
  },
  {
    label: "PSV Management",
    href: "/psv",
    icon: Shield,
    specialty: "PSV"
  },
  {
    label: "PSV Calibration",
    href: "/psv/calibration",
    icon: Wrench,
    specialty: "PSV"
  },
  {
    label: "PSV Analytics",
    href: "/psv/analytics",
    icon: BarChart3,
    specialty: "PSV"
  },
  {
    label: "Crane Inspection",
    href: "/crane/inspection",
    icon: Settings,
    specialty: "CRANE"
  },
  {
    label: "Crane List",
    href: "/cranes",
    icon: Settings,
    specialty: "CRANE"
  },
  {
    label: "Corrosion Analysis",
    href: "/corrosion/analysis",
    icon: Zap,
    specialty: "CORROSION"
  },
  {
    label: "Corrosion Coupons",
    href: "/corrosion/coupons",
    icon: FileText,
    specialty: "CORROSION"
  },
  {
    label: "Admin Panel",
    href: "/admin",
    icon: UserCog,
    adminOnly: true
  },
  {
    label: "Inspector Management",
    href: "/admin/inspectors",
    icon: Users,
    adminOnly: true
  },
  {
    label: "Create Inspector",
    href: "/admin/inspectors/new",
    icon: Plus,
    adminOnly: true
  },
  {
    label: "Bulk Operations",
    href: "/admin/bulk-operations",
    icon: Upload,
    adminOnly: true
  },
]
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  Database,
  LineChart,
  Droplet,
  LifeBuoy
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: typeof LayoutDashboard
  children?: Omit<NavItem, "children">[]
}

export const navigationConfig: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Daily Reports",
    href: "/daily-reports",
    icon: ClipboardList,
    children: [
      {
        title: "View Reports",
        href: "/daily-reports",
        icon: ClipboardList,
      },
      {
        title: "New Report",
        href: "/daily-reports/new",
        icon: ClipboardList,
      },
    ],
  },
  {
    title: "PSV",
    href: "/psv",
    icon: Settings,
    children: [
      {
        title: "PSV List",
        href: "/psv",
        icon: Database,
      },
      {
        title: "PSV Analytics",
        href: "/psv-analytics",
        icon: LineChart,
      },
    ],
  },
  {
    title: "Corrosion",
    href: "/corrosion",
    icon: Droplet,
    children: [
      {
        title: "Dashboard",
        href: "/corrosion",
        icon: LayoutDashboard,
      },
      {
        title: "Coupons",
        href: "/corrosion/coupons",
        icon: Database,
      },
      {
        title: "Analysis",
        href: "/corrosion/analysis",
        icon: LineChart,
      },
    ],
  },
  {
    title: "Equipment",
    href: "/equipment",
    icon: Database,
  },
  {
    title: "Cranes",
    href: "/cranes/dashboard",
    icon: LifeBuoy,
    children: [
      {
        title: "Dashboard",
        href: "/cranes/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Crane List",
        href: "/cranes",
        icon: Database,
      },
      {
        title: "Add New Crane",
        href: "/cranes/new",
        icon: Settings,
      },
    ],
  },
]
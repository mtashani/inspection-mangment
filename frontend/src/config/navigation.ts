import { 
  LayoutDashboard, 
  ClipboardList, 
  Settings, 
  Database,
  LineChart
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
    title: "Equipment",
    href: "/equipment",
    icon: Database,
  },
]
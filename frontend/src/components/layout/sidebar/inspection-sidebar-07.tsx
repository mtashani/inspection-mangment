"use client"

import * as React from "react"
import {
  Home,
  Users,
  FileText,
  Calendar,
  Wrench,
  Shield,
  Bell,
  ChevronRight,
  User,
  LogOut,
  Settings,
  ClipboardList,
  AlertTriangle,
  Cog,
  TrendingUp,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,

  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { NavigationHeader } from "../navigation-header"

// Inspection Management System Navigation Data
interface SubItem {
  title: string
  url: string
  description: string
  badge?: string
}

interface NavItem {
  title: string
  url: string
  icon: unknown
  isActive?: boolean
  badge?: string
  items?: SubItem[]
}

const inspectionData = {
  user: {
    name: "Inspector Admin",
    email: "admin@inspection.com",
    avatar: "/avatars/inspector.jpg",
    role: "System Administrator"
  },
  company: {
    name: "Inspection Management",
    logo: ClipboardList,
    version: "v2.0",
    environment: "Production"
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
      badge: "3",
      items: [
        {
          title: "Overview",
          url: "/dashboard",
          description: "System overview and key metrics"
        },
        {
          title: "Analytics",
          url: "/dashboard/analytics",
          description: "Performance analytics and trends"
        },
        {
          title: "Reports",
          url: "/dashboard/reports",
          description: "Generated reports and summaries"
        },
      ],
    },
    {
      title: "Inspections",
      url: "/inspections",
      icon: FileText,
      badge: "12",
      items: [
        {
          title: "All Inspections",
          url: "/inspections",
          description: "View all inspection records"
        },
        {
          title: "Pending",
          url: "/inspections/pending",
          description: "Inspections awaiting completion",
          badge: "5"
        },
        {
          title: "Completed",
          url: "/inspections/completed",
          description: "Completed inspection records"
        },
        {
          title: "Templates",
          url: "/inspections/templates",
          description: "Inspection templates and forms"
        },
        {
          title: "Professional Reports",
          url: "/inspections/professional-reports",
          description: "Advanced reporting system"
        },
      ],
    },
    {
      title: "Equipment",
      url: "/equipment",
      icon: Wrench,
      items: [
        {
          title: "All Equipment",
          url: "/equipment",
          description: "Equipment inventory and status"
        },
        {
          title: "PSV Calibration",
          url: "/equipment/psv",
          description: "Pressure Safety Valve tracking"
        },
        {
          title: "Corrosion Monitoring",
          url: "/equipment/corrosion",
          description: "Corrosion analysis and tracking"
        },
        {
          title: "Crane Management",
          url: "/equipment/crane",
          description: "Crane inspection and maintenance"
        },
        {
          title: "Maintenance",
          url: "/equipment/maintenance",
          description: "Maintenance scheduling and history"
        },
      ],
    },
    {
      title: "Risk Assessment",
      url: "/rbi",
      icon: AlertTriangle,
      items: [
        {
          title: "RBI Calculator",
          url: "/rbi/calculator",
          description: "Risk-based inspection calculations"
        },
        {
          title: "Risk Matrix",
          url: "/rbi/matrix",
          description: "Risk assessment matrix"
        },
        {
          title: "Inspection Intervals",
          url: "/rbi/intervals",
          description: "Calculated inspection intervals"
        },
      ],
    },
    {
      title: "Personnel",
      url: "/admin/inspectors",
      icon: Users,
      items: [
        {
          title: "All Inspectors",
          url: "/admin/inspectors",
          description: "Inspector management"
        },
        {
          title: "Attendance",
          url: "/admin/inspectors/attendance",
          description: "Attendance tracking"
        },
        {
          title: "Performance",
          url: "/admin/inspectors/performance",
          description: "Performance metrics"
        },
        {
          title: "Training",
          url: "/admin/inspectors/training",
          description: "Training records and certifications"
        },
      ],
    },
  ],
  quickAccess: [
    {
      name: "Safety Protocols",
      url: "/safety",
      icon: Shield,
      color: "success",
      description: "Safety guidelines and protocols"
    },
    {
      name: "Daily Reports",
      url: "/daily-reports",
      icon: Calendar,
      color: "info",
      description: "Daily inspection reports"
    },
    {
      name: "Analytics",
      url: "/analytics",
      icon: TrendingUp,
      color: "warning",
      description: "Performance analytics"
    },
    {
      name: "System Settings",
      url: "/settings",
      icon: Cog,
      color: "secondary",
      description: "System configuration"
    },
  ],
}

interface InspectionSidebar07Props extends React.ComponentProps<typeof SidebarProvider> {
  children?: React.ReactNode
}

export function InspectionSidebar07({ children, ...props }: InspectionSidebar07Props) {
  const router = useRouter()
  const { inspector, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <SidebarProvider {...props}>
      <Sidebar variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <inspectionData.company.logo className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {inspectionData.company.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {inspectionData.company.version} • {inspectionData.company.environment}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        
        <SidebarContent>
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-[var(--color-base-content)]/70 font-medium">
              Main Navigation
            </SidebarGroupLabel>
            <SidebarMenu>
              {inspectionData.navMain.map((item) => (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className="hover:bg-[var(--color-base-200)] text-[var(--color-base-content)] data-[active=true]:bg-[var(--color-primary)] data-[active=true]:text-[var(--color-primary-content)] rounded-[var(--radius-field)]"
                      >
                        {item.icon && <item.icon className="size-4" />}
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className="ml-auto mr-2 bg-[var(--color-info)] text-[var(--color-info-content)] text-xs px-1.5 py-0.5 rounded-[var(--radius-selector)]"
                          >
                            {item.badge}
                          </Badge>
                        )}
                        <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className="hover:bg-[var(--color-base-200)] text-[var(--color-base-content)]/80 rounded-[var(--radius-field)]"
                            >
                              <a href={subItem.url} className="flex items-center justify-between">
                                <span className="text-sm">{subItem.title}</span>
                                {subItem.badge && (
                                  <Badge 
                                    variant="outline" 
                                    className="ml-2 bg-[var(--color-warning)] text-[var(--color-warning-content)] text-xs px-1.5 py-0.5 rounded-[var(--radius-selector)]"
                                  >
                                    {subItem.badge}
                                  </Badge>
                                )}
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          
          {/* Quick Access */}
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="text-[var(--color-base-content)]/70 font-medium">
              Quick Access
            </SidebarGroupLabel>
            <SidebarMenu>
              {inspectionData.quickAccess.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    className="hover:bg-[var(--color-base-200)] text-[var(--color-base-content)] rounded-[var(--radius-field)]"
                  >
                    <a href={item.url} className="flex items-center">
                      <div className={`p-1.5 rounded-[var(--radius-selector)] mr-3 bg-[var(--color-${item.color})] text-[var(--color-${item.color}-content)]`}>
                        <item.icon className="size-3" />
                      </div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter className="border-t border-[var(--border)]">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-[var(--color-base-200)] data-[state=open]:text-[var(--color-base-content)] rounded-[var(--radius-field)]"
                  >
                    <Avatar className="h-8 w-8 rounded-[var(--radius-selector)]">
                      <AvatarImage
                        src={inspector?.profile_image_url || undefined}
                        alt={inspector?.name || 'User'}
                      />
                      <AvatarFallback className="rounded-[var(--radius-selector)] bg-[var(--color-primary)] text-[var(--color-primary-content)]">
                        {inspector?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold text-[var(--color-base-content)]">
                        {inspector?.name || 'User'}
                      </span>
                      <span className="truncate text-xs text-[var(--color-base-content)]/70">
                        {inspector?.inspector_type || 'Inspector'}
                      </span>
                    </div>
                    <ChevronRight className="ml-auto size-4 text-[var(--color-base-content)]/50" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-[var(--radius-selector)]">
                        <AvatarImage
                          src={inspector?.profile_image_url || undefined}
                          alt={inspector?.name || 'User'}
                        />
                        <AvatarFallback className="rounded-[var(--radius-selector)] bg-[var(--color-primary)] text-[var(--color-primary-content)]">
                          {inspector?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold text-[var(--color-base-content)]">
                          {inspector?.name || 'User'}
                        </span>
                        <span className="truncate text-xs text-[var(--color-base-content)]/70">
                          {inspector?.email || 'user@example.com'}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">
                      <User className="mr-2 size-4" />
                      Profile
                      <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">
                      <Settings className="mr-2 size-4" />
                      Settings
                      <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">
                      <Bell className="mr-2 size-4" />
                      Notifications
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                  >
                    <LogOut className="mr-2 size-4" />
                    Sign Out
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      
      {children && (
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-[var(--border)] bg-[var(--color-base-100)]">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1 text-[var(--color-base-content)]" />
              <Separator orientation="vertical" className="mr-2 h-4 bg-[var(--color-base-300)]" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink 
                      href="/dashboard"
                      className="text-[var(--color-base-content)]/70 hover:text-[var(--color-base-content)]"
                    >
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block text-[var(--color-base-content)]/50" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-[var(--color-base-content)]">
                      Overview
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            
            {/* Navigation Header with user controls */}
            <div className="px-4">
              <NavigationHeader />
            </div>
          </header>
          {children}
        </SidebarInset>
      )}
    </SidebarProvider>
  )
}
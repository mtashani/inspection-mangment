"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { navigationConfig } from "@/config/navigation"
import { useSidebar } from "@/contexts/sidebar-context"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const { isExpanded, toggleSidebar } = useSidebar()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r bg-background transition-all duration-300",
        isExpanded ? "w-60" : "w-16"
      )}
    >
      <div className="flex h-14 items-center border-b px-3">
        {isExpanded && (
          <span className="text-lg font-semibold">Inspection System</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6",
            !isExpanded && "mr-auto",
            isExpanded && "mr-auto"
          )}
          onClick={toggleSidebar}
        >
          {isExpanded ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 py-2">
        <nav className="grid gap-1 px-2">
          {navigationConfig.map((item) => {
            const isActive = pathname === item.href || 
              (item.children?.some(child => pathname === child.href) ?? false)

            return (
              <div key={item.href}>
                {isExpanded ? (
                  <Button
                    asChild
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      item.children && "mb-1"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="ml-2 h-4 w-4" />
                      {item.title}
                    </Link>
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        asChild
                        variant={isActive ? "secondary" : "ghost"}
                        size="icon"
                        className="w-full"
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                )}

                {isExpanded && item.children && (
                  <div className="mr-4 grid gap-1">
                    {item.children.map((child) => (
                      <Button
                        key={child.href}
                        asChild
                        variant={pathname === child.href ? "secondary" : "ghost"}
                        className="w-full justify-start"
                      >
                        <Link href={child.href}>
                          <child.icon className="ml-2 h-4 w-4" />
                          {child.title}
                        </Link>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </ScrollArea>
    </aside>
  )
}
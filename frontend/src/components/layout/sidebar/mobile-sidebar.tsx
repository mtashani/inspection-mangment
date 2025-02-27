"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Sidebar } from "./sidebar"
import { useSidebar } from "@/contexts/sidebar-context"

export function MobileSidebar() {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar()

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="ml-2 md:hidden"
        onClick={toggleMobileSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Sheet open={isMobileOpen} onOpenChange={toggleMobileSidebar}>
        <SheetContent side="left" className="w-[80%] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <Sidebar />
        </SheetContent>
      </Sheet>
    </>
  )
}
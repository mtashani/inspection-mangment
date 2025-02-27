"use client"

import { createContext, useContext, useEffect, useState } from "react"

type SidebarContextType = {
  isExpanded: boolean
  toggleSidebar: () => void
  isMobileOpen: boolean
  toggleMobileSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    // Load saved preference from localStorage
    const savedExpanded = localStorage.getItem("sidebarExpanded")
    if (savedExpanded) {
      setIsExpanded(JSON.parse(savedExpanded))
    }
  }, [])

  const toggleSidebar = () => {
    const newValue = !isExpanded
    setIsExpanded(newValue)
    localStorage.setItem("sidebarExpanded", JSON.stringify(newValue))
  }

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        toggleSidebar,
        isMobileOpen,
        toggleMobileSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
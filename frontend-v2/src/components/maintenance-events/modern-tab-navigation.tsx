'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MaintenanceEvent, MaintenanceSubEvent, MaintenanceEventStatus } from '@/types/maintenance-events'
import { cn } from '@/lib/utils'

interface ModernTabNavigationProps {
  event: MaintenanceEvent
  subEvents?: MaintenanceSubEvent[]
  activeTab: string
  onTabChange: (tabId: string) => void
  maxVisibleTabs?: number
}

interface TabItem {
  id: string
  label: string
  count?: number
  status?: MaintenanceEventStatus
  completionPercentage?: number
}

export function ModernTabNavigation({
  event,
  subEvents,
  activeTab,
  onTabChange,
  maxVisibleTabs = 4
}: ModernTabNavigationProps) {
  const [startIndex, setStartIndex] = useState(0)

  // Build the tabs array
  const tabs: TabItem[] = [
    // Direct inspections tab comes first
    {
      id: 'direct-inspections',
      label: 'Direct Inspections',
      count: event.direct_inspections_count || 0
    },
    ...(subEvents || []).map(subEvent => ({
      id: `sub-event-${subEvent.id}`,
      label: subEvent.title,
      count: subEvent.inspections_count || 0,
      status: subEvent.status,
      completionPercentage: subEvent.completion_percentage
    }))
  ]

  const visibleTabs = tabs.slice(startIndex, startIndex + maxVisibleTabs)
  const canScrollLeft = startIndex > 0
  const canScrollRight = startIndex + maxVisibleTabs < tabs.length

  const handleScrollLeft = () => {
    setStartIndex(Math.max(0, startIndex - 1))
  }

  const handleScrollRight = () => {
    setStartIndex(Math.min(tabs.length - maxVisibleTabs, startIndex + 1))
  }

  const TabTriggerWithExtras = React.memo(({ tab, isActive }: { tab: TabItem; isActive: boolean }) => (
    <TabsTrigger
      value={tab.id}
      className={cn(
        'relative flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium w-full',
        'border border-b-0 rounded-t-lg transition-all duration-200',
        'hover:scale-[1.02]',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'data-[state=active]:bg-background data-[state=active]:text-foreground',
        'data-[state=active]:border-border',
        'data-[state=inactive]:bg-muted/50 data-[state=inactive]:text-muted-foreground',
        'data-[state=inactive]:border-muted-foreground/20',
        // Curved outside edges for seamless integration
        isActive && "before:absolute before:-left-2 before:bottom-0 before:w-2 before:h-2",
        isActive && "before:bg-transparent before:border-b before:border-r before:border-border",
        isActive && "before:rounded-br-lg",
        isActive && "after:absolute after:-right-2 after:bottom-0 after:w-2 after:h-2",
        isActive && "after:bg-transparent after:border-b after:border-l after:border-border",
        isActive && "after:rounded-bl-lg"
      )}
    >
      <span className="truncate">{tab.label}</span>
      
      {tab.count !== undefined && tab.count > 0 && (
        <Badge 
          variant={isActive ? 'default' : 'secondary'} 
          className={cn(
            'text-xs transition-colors duration-200',
            isActive && 'bg-primary/10 text-primary border-primary/20'
          )}
        >
          {tab.count}
        </Badge>
      )}
      
      {tab.completionPercentage !== undefined && tab.completionPercentage > 0 && (
        <div className={cn(
          "text-xs transition-colors duration-200",
          isActive ? "text-primary font-medium" : "text-muted-foreground"
        )}>
          {tab.completionPercentage}%
        </div>
      )}
    </TabsTrigger>
  ))
  
  TabTriggerWithExtras.displayName = 'TabTriggerWithExtras'

  return (
    <div className="w-full bg-background">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <div className="flex items-center gap-2">
          {/* Left scroll button */}
          {canScrollLeft && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleScrollLeft}
              className="flex-shrink-0 h-8 w-8 p-0 transition-colors duration-200 hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          
          {/* Visible tabs container - fill available space */}
          <div className="flex-1 overflow-hidden">
            <TabsList className="h-auto bg-transparent p-0 border-b-0 relative w-full justify-start">
              <div className="flex w-full">
                {visibleTabs.map(tab => (
                  <div key={tab.id} className="flex-1">
                    <TabTriggerWithExtras 
                      tab={tab} 
                      isActive={activeTab === tab.id} 
                    />
                  </div>
                ))}
              </div>
            </TabsList>
          </div>
          
          {/* Right scroll button */}
          {canScrollRight && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleScrollRight}
              className="flex-shrink-0 h-8 w-8 p-0 transition-colors duration-200 hover:bg-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Tabs>
    </div>
  )
}
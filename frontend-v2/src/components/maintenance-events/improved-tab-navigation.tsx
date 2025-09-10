'use client'

import { useMemo, useState } from 'react'
import { MaintenanceEvent, MaintenanceSubEvent, TabItem } from '@/types/maintenance-events'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TabCountBadge } from '@/components/ui/count-badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Layers, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImprovedTabNavigationProps {
  event: MaintenanceEvent
  subEvents?: MaintenanceSubEvent[]
  activeTab: string
  onTabChange: (tab: string) => void
  maxVisibleTabs?: number // Maximum tabs to show before using dropdown
}

export function ImprovedTabNavigation({
  event,
  subEvents,
  activeTab,
  onTabChange,
  maxVisibleTabs = 4
}: ImprovedTabNavigationProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  
  const tabs = useMemo(() => {
    const tabList: TabItem[] = []
    
    // Direct inspections tab (always present)
    tabList.push({
      id: 'direct-inspections',
      label: 'Direct Inspections',
      badge: event.direct_inspections_count || 0,
      icon: ClipboardList
    })
    
    // Sub-event tabs
    if (subEvents?.length) {
      subEvents.forEach(subEvent => {
        tabList.push({
          id: `sub-event-${subEvent.id}`,
          label: subEvent.title,
          badge: subEvent.inspections_count || 0,
          subEvent: subEvent,
          icon: Layers
        })
      })
    }
    
    return tabList
  }, [event, subEvents])

  // Determine which tabs to show directly and which to put in dropdown
  const shouldUseDropdown = tabs.length > maxVisibleTabs
  const visibleTabs = shouldUseDropdown ? tabs.slice(0, maxVisibleTabs - 1) : tabs
  const dropdownTabs = shouldUseDropdown ? tabs.slice(maxVisibleTabs - 1) : []
  
  // Find current active tab info
  const activeTabInfo = tabs.find(tab => tab.id === activeTab)
  const isActiveTabInDropdown = shouldUseDropdown && dropdownTabs.some(tab => tab.id === activeTab)

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId)
    setDropdownOpen(false)
  }

  const getTabStatus = (subEvent?: MaintenanceSubEvent) => {
    if (!subEvent) return null
    
    const statusColors = {
      'Planned': 'bg-blue-100 text-blue-800',
      'InProgress': 'bg-yellow-100 text-yellow-800', 
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Postponed': 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge 
        variant="outline" 
        className={cn("text-xs ml-2", statusColors[subEvent.status] || statusColors['Planned'])}
      >
        {subEvent.status}
      </Badge>
    )
  }

  const renderTabTrigger = (tab: TabItem, isInDropdown = false) => {
    const Icon = tab.icon || ClipboardList
    
    if (isInDropdown) {
      return (
        <DropdownMenuItem
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={cn(
            "flex items-center justify-between w-full cursor-pointer",
            activeTab === tab.id && "bg-accent"
          )}
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="truncate max-w-[200px]">{tab.label}</span>
            {tab.subEvent && getTabStatus(tab.subEvent)}
          </div>
          <TabCountBadge count={tab.badge || 0} />
        </DropdownMenuItem>
      )
    }

    return (
      <TabsTrigger 
        key={tab.id} 
        value={tab.id} 
        className="relative gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 py-2"
      >
        <Icon className="h-4 w-4" />
        <span className="truncate max-w-[120px] sm:max-w-none">{tab.label}</span>
        {tab.subEvent && getTabStatus(tab.subEvent)}
        <TabCountBadge count={tab.badge || 0} />
      </TabsTrigger>
    )
  }

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1">
        <div className="flex items-center gap-2 w-full">
          {/* Main tabs list */}
          <TabsList className={cn(
            "flex overflow-x-auto",
            shouldUseDropdown ? "flex-1" : "w-full"
          )}>
            {visibleTabs.map(tab => renderTabTrigger(tab))}
          </TabsList>

          {/* Dropdown for additional tabs */}
          {shouldUseDropdown && (
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={cn(
                    "flex items-center gap-2 border-2 transition-colors",
                    isActiveTabInDropdown && "border-primary bg-accent"
                  )}
                >
                  {isActiveTabInDropdown && activeTabInfo ? (
                    <>
                      <span className="truncate max-w-[100px]">{activeTabInfo.label}</span>
                      <TabCountBadge count={activeTabInfo.badge || 0} />
                    </>
                  ) : (
                    <>
                      <span>More</span>
                      <Badge variant="secondary" className="text-xs">
                        {dropdownTabs.length}
                      </Badge>
                    </>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                  Sub-Events
                </div>
                <DropdownMenuSeparator />
                {dropdownTabs.map(tab => renderTabTrigger(tab, true))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </Tabs>

      {/* Tab summary info */}
      {tabs.length > 1 && (
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ClipboardList className="h-3 w-3" />
            Total Inspections: {tabs.reduce((sum, tab) => sum + (tab.badge || 0), 0)}
          </span>
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            Sub-Events: {(subEvents?.length || 0)}
          </span>
          {subEvents && subEvents.length > 0 && (
            <span className="flex items-center gap-1">
              <span>Completed: {subEvents.filter(se => se.status === 'Completed').length}/{subEvents.length}</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
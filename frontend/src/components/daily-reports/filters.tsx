"use client"

import { FC } from "react"
import { DateRange } from "react-day-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, addDays, subYears, addYears } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CalendarIcon, X, Clock, CheckCircle2, Check, RefreshCcw } from "lucide-react"
import { useState, useEffect } from "react"
import { Combobox } from "@/components/ui/combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getEquipmentTags } from "@/api/equipment"
import { useInspectors } from "@/contexts/inspectors-context"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"

interface FiltersProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
  selectedInspector: string
  onInspectorChange: (inspector: string) => void
}

export const Filters: FC<FiltersProps> = ({
  dateRange,
  onDateRangeChange,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedInspector,
  onInspectorChange,
}) => {
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  const [equipmentTags, setEquipmentTags] = useState<string[]>([])
  const { inspectors } = useInspectors()

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await getEquipmentTags()
        setEquipmentTags(["_all", ...tags])
      } catch (error) {
        console.error('Failed to load equipment tags:', error)
      }
    }
    loadTags()
  }, [])

  const getEquipmentLabel = (value: string) => {
    if (value === "_all") return "All Equipment"
    return value
  }

  const getInspectorLabel = (value: string) => {
    if (value === "all") return "All Inspectors"
    const inspector = inspectors.find(i => i.id.toString() === value)
    return inspector ? inspector.name : value
  }

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (range?.to) {
      onDateRangeChange({
        from: range.from,
        to: addDays(range.to, 1)
      })
    } else {
      onDateRangeChange(range)
    }
  }

  const inspectorOptions = [
    "all",
    ...inspectors.map(inspector => inspector.id.toString())
  ]

  const hasActiveFilters = dateRange || searchQuery !== "_all" || selectedStatus !== "all" || selectedInspector !== "all"

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Equipment Tag Search */}
          <div className="w-full">
            <label className="text-sm font-medium mb-1.5 block">Equipment Tag</label>
            <Combobox
              value={searchQuery}
              onValueChange={onSearchChange}
              options={equipmentTags}
              placeholder="Search equipment..."
              searchPlaceholder="Type to search equipment..."
              className="h-10"
              getOptionLabel={getEquipmentLabel}
            />
          </div>

          {/* Date Range Picker */}
          <div className="w-full">
            <label className="text-sm font-medium mb-1.5 block">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-10 text-left font-normal justify-between",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL d, yyyy")} -{" "}
                          {format(addDays(dateRange.to, -1), "LLL d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL d, yyyy")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </span>
                  {dateRange && (
                    <X
                      className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDateRangeSelect(undefined)
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex items-center justify-between p-3 border-b">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCalendarMonth(subYears(calendarMonth, 1))}
                  >
                    Previous Year
                  </Button>
                  <div className="font-semibold">
                    {format(calendarMonth, "yyyy")}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCalendarMonth(addYears(calendarMonth, 1))}
                  >
                    Next Year
                  </Button>
                </div>
                <div className="p-3 bg-primary/5">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={calendarMonth}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    selected={dateRange}
                    onSelect={handleDateRangeSelect}
                    numberOfMonths={2}
                    className="flex"
                    fromYear={2020}
                    toYear={2030}
                    disabled={(date) => {
                      const today = new Date()
                      return date > today
                    }}
                    classNames={{
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_range_middle: "bg-primary/20 text-foreground",
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Status Filter */}
          <div className="w-full">
            <label className="text-sm font-medium mb-1.5 block">Status</label>
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger className="w-full h-10">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {selectedStatus === "all" && "All Statuses"}
                    {selectedStatus === "IN_PROGRESS" && (
                      <>
                        <Clock className="h-4 w-4" />
                        <span>In Progress</span>
                      </>
                    )}
                    {selectedStatus === "COMPLETED" && (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Completed</span>
                      </>
                    )}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    {selectedStatus === "all" && <Check className="h-4 w-4" />}
                    <span>All Statuses</span>
                  </div>
                </SelectItem>
                <SelectItem value="IN_PROGRESS">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>In Progress</span>
                  </div>
                </SelectItem>
                <SelectItem value="COMPLETED">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Completed</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inspector Filter */}
          <div className="w-full">
            <label className="text-sm font-medium mb-1.5 block">Inspector</label>
            <Combobox
              value={selectedInspector}
              onValueChange={onInspectorChange}
              options={inspectorOptions}
              placeholder="Select inspector..."
              className="h-10"
              getOptionLabel={getInspectorLabel}
            />
          </div>
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 mt-[26px] bg-background hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    handleDateRangeSelect(undefined)
                    onSearchChange("_all")
                    onStatusChange("all")
                    onInspectorChange("all")
                  }}
                  aria-label="Reset all filters"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset all filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}
"use client"

import { DateRange } from "react-day-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { Combobox } from "@/components/ui/combobox"
import { getEquipmentTags } from "@/api/equipment"
import { useInspectors } from "@/contexts/inspectors-context"
import { inspectionStatuses } from "./types"

export interface FiltersProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
  selectedInspector: string
  onInspectorChange: (inspector: string) => void
}

export function Filters({
  dateRange,
  onDateRangeChange,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedInspector,
  onInspectorChange,
}: FiltersProps) {
  const [equipmentTags, setEquipmentTags] = useState<string[]>([])
  const [isLoadingTags, setIsLoadingTags] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState<Date>(dateRange?.from || new Date())
  const { inspectors } = useInspectors()

  const loadTags = useCallback(async (search?: string) => {
    try {
      setIsLoadingTags(true)
      const tags = await getEquipmentTags(search)
      setEquipmentTags(tags)
    } catch (error) {
      console.error('Failed to load equipment tags:', error)
    } finally {
      setIsLoadingTags(false)
    }
  }, [])

  useEffect(() => {
    loadTags()
  }, [loadTags])

  const inspectorOptions = [
    "all",
    ...inspectors.map(inspector => inspector.id.toString())
  ]

  const getInspectorLabel = (value: string) => {
    if (value === "all") return "All Inspectors"
    const inspector = inspectors.find(i => i.id.toString() === value)
    return inspector ? inspector.name : value
  }

  const statusOptions = ["all", "IN_PROGRESS", "COMPLETED"]

  const getStatusLabel = (value: string) => {
    const status = inspectionStatuses.find(s => s.value === value)
    return status?.label || value
  }

  const handlePreviousYear = () => {
    const newDate = new Date(calendarMonth)
    newDate.setFullYear(newDate.getFullYear() - 1)
    setCalendarMonth(newDate)
  }

  const handleNextYear = () => {
    const newDate = new Date(calendarMonth)
    newDate.setFullYear(newDate.getFullYear() + 1)
    setCalendarMonth(newDate)
  }

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1.5 block">Equipment Tag</label>
            <Combobox
              value={searchQuery}
              onValueChange={(value) => {
                onSearchChange(value)
                if (!value) {
                  loadTags()
                }
              }}
              options={equipmentTags}
              placeholder="Search equipment..."
              searchPlaceholder="Type to search equipment..."
              isLoading={isLoadingTags}
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium mb-1.5 block">Status</label>
            <Combobox
              value={selectedStatus}
              onValueChange={onStatusChange}
              options={statusOptions}
              getOptionLabel={getStatusLabel}
              placeholder="Select status"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1.5 block">Inspector</label>
            <Combobox
              value={selectedInspector}
              onValueChange={onInspectorChange}
              options={inspectorOptions}
              getOptionLabel={getInspectorLabel}
              placeholder="Select inspector"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1.5 block">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM d, y")} -{" "}
                        {format(dateRange.to, "MMM d, y")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM d, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex items-center justify-between p-2 border-b">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePreviousYear}
                    className="h-7 w-7"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <ChevronLeft className="h-4 w-4 -ml-2" />
                  </Button>
                  <div className="text-sm font-medium">
                    {format(calendarMonth, "yyyy")}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextYear}
                    className="h-7 w-7"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4 -ml-2" />
                  </Button>
                </div>
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={calendarMonth}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  selected={dateRange}
                  onSelect={onDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              onSearchChange("")
              onStatusChange("all")
              onInspectorChange("all")
              onDateRangeChange(undefined)
              setCalendarMonth(new Date())
            }}
            size="sm"
            className="h-10"
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
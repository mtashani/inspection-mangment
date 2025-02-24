"use client"

import { Table } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options"
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter"
import { DateRangePicker } from "@/components/data-table/data-table-date-range-picker"
import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  dateRange?: DateRange
  onDateRangeChange?: (date: DateRange | undefined) => void
  filterColumn?: string
  statusOptions?: {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
  priorityOptions?: {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
}

export function DataTableToolbar<TData>({
  table,
  dateRange,
  onDateRangeChange,
  filterColumn = "tag",
  statusOptions,
  priorityOptions,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || dateRange !== undefined

  return (
    <div className="border-b">
      <div className="flex items-center p-4">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder={`Search ${filterColumn}...`}
            value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(filterColumn)?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[200px]"
          />
          {statusOptions && table.getColumn("status") && (
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={statusOptions}
            />
          )}
          {priorityOptions && table.getColumn("priority") && (
            <DataTableFacetedFilter
              column={table.getColumn("priority")}
              title="Priority"
              options={priorityOptions}
            />
          )}
          <Separator orientation="vertical" className="h-8" />
          {onDateRangeChange && (
            <DateRangePicker
              date={dateRange}
              onChange={onDateRangeChange}
            />
          )}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => {
                table.resetColumnFilters()
                if (onDateRangeChange) {
                  onDateRangeChange(undefined)
                }
              }}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
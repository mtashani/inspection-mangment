"use client";

import { Table } from "@tanstack/react-table";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { DateRange } from "react-day-picker";
import { DateRangeFilter, DateField } from "./date-range-filter";
import { isWithinInterval, parseISO } from "date-fns";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

interface PSVData {
  lastCalibrationDate?: string;
  nextCalibrationDate?: string;
  tag?: string;
  type?: string;
  testMedium?: string;
}

export function DataTableToolbar<TData extends PSVData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const psvTypes = [
    { label: "Open Bonnet", value: "OPEN_BONNET" },
    { label: "Pilot", value: "PILOT" },
    { label: "Other", value: "OTHER" },
  ];

  const testMediums = [
    { label: "Air", value: "AIR" },
    { label: "Water", value: "WATER" },
    { label: "Nitrogen", value: "NITROGEN" },
    { label: "Steam", value: "STEAM" },
  ];

  const handleDateRangeChange = (range: DateRange | undefined, field: DateField) => {
    if (!range?.from) {
      table.getColumn(field)?.setFilterValue(undefined);
      return;
    }

    const from = range.from;
    const to = range.to;

    table.getColumn(field)?.setFilterValue((row: PSVData) => {
      const dateStr = row[field];
      if (!dateStr) return false;
      
      try {
        const date = parseISO(dateStr);
        if (!to) {
          return date >= from;
        }
        return isWithinInterval(date, { start: from, end: to });
      } catch {
        return false;
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Filter PSV tags..."
            value={(table.getColumn("tag")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("tag")?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
          {table.getColumn("type") && (
            <DataTableFacetedFilter
              column={table.getColumn("type")}
              title="Type"
              options={psvTypes}
            />
          )}
          {table.getColumn("testMedium") && (
            <DataTableFacetedFilter
              column={table.getColumn("testMedium")}
              title="Test Medium"
              options={testMediums}
            />
          )}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <DataTableViewOptions table={table} />
      </div>

      <div className="flex justify-start">
        <DateRangeFilter
          onDateRangeChange={(range) => {
            const currentFilters = table.getState().columnFilters;
            const dateFilter = currentFilters.find(
              f => f.id === "lastCalibrationDate" || f.id === "nextCalibrationDate"
            );
            
            const field = (dateFilter?.id as DateField) || "lastCalibrationDate";
            handleDateRangeChange(range, field);
          }}
          onDateFieldChange={(field) => {
            const otherField = field === "lastCalibrationDate" 
              ? "nextCalibrationDate" 
              : "lastCalibrationDate";
            
            // Clear previous date field filter
            table.getColumn(otherField)?.setFilterValue(undefined);
            
            // Check for existing filter
            const existingFilter = table.getState().columnFilters.find(
              f => f.id === otherField
            );
            
            // Transfer date range if it exists
            if (existingFilter?.value && typeof existingFilter.value === 'function') {
              const filterFn = existingFilter.value;
              table.getColumn(field)?.setFilterValue(filterFn);
            }
          }}
        />
      </div>
    </div>
  );
}
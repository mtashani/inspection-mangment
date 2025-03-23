"use client";

import { useState, useEffect, useRef } from "react";
import { Table } from "@tanstack/react-table";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { DateRange } from "react-day-picker";
import { DateRangeFilter, DateField } from "./date-range-filter";
import { isWithinInterval, parseISO } from "date-fns";
import { fetchPSVTypes, fetchPSVUnits, fetchPSVTrains } from "@/api/psv";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  resetFilters?: () => void;  // Add optional callback for reset
}

interface PSVData {
  last_calibration_date?: string;
  expire_date?: string;
  tag_number?: string;
  type?: string;
  unit?: string;
  train?: string;
  // Fields for date filters
  lastCalibrationDate?: string;
  nextCalibrationDate?: string;
}

// Set up a static options cache to prevent redundant API calls
const optionsCache = {
  types: null as { label: string, value: string, key: string }[] | null,
  units: null as { label: string, value: string, key: string }[] | null,
  trains: null as { label: string, value: string, key: string }[] | null,
  lastFetchTime: 0
};

// Default options to use as fallbacks
const defaultTypes = [
  { label: "open bonnet", value: "OPEN_BONNET", key: "type-default-1" },
  { label: "pilot", value: "PILOT", key: "type-default-2" },
  { label: "other", value: "OTHER", key: "type-default-3" }
];

const defaultUnits = [
  { label: "Unit 100", value: "Unit 100", key: "unit-default-1" },
  { label: "Unit 200", value: "Unit 200", key: "unit-default-2" },
  { label: "Unit 300", value: "Unit 300", key: "unit-default-3" }
];

const defaultTrains = [
  { label: "Train A", value: "Train A", key: "train-default-1" },
  { label: "Train B", value: "Train B", key: "train-default-2" },
  { label: "Train C", value: "Train C", key: "train-default-3" }
];

// Cache expiration in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

export function DataTableToolbar<TData extends PSVData>({
  table,
  resetFilters
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  
  const [psvTypes, setPsvTypes] = useState<{ label: string, value: string, key: string }[]>(
    optionsCache.types || defaultTypes
  );
  
  const [psvUnits, setPsvUnits] = useState<{ label: string, value: string, key: string }[]>(
    optionsCache.units || defaultUnits
  );
  
  const [psvTrains, setPsvTrains] = useState<{ label: string, value: string, key: string }[]>(
    optionsCache.trains || defaultTrains
  );

  // Use a ref to track if options have already been loaded
  const optionsLoadedRef = useRef(false);

  // Input change debouncing
  const inputTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to handle filter reset
  const handleResetFilters = () => {
    // Reset tanstack table filters
    table.resetColumnFilters();
    
    // Also call the parent component's reset function if provided
    if (resetFilters) {
      resetFilters();
    }
    
    console.log("All filters have been reset");
  };

  useEffect(() => {
    // Skip loading if options were already loaded recently
    const now = Date.now();
    
    // Check if we already loaded options in this component instance
    if (optionsLoadedRef.current) {
      return;
    }
    
    // Check if we already have valid cached options
    if (
      optionsCache.types && 
      optionsCache.units && 
      optionsCache.trains && 
      now - optionsCache.lastFetchTime < CACHE_EXPIRATION
    ) {
      console.log("Using cached filter options");
      setPsvTypes(optionsCache.types);
      setPsvUnits(optionsCache.units);
      setPsvTrains(optionsCache.trains);
      optionsLoadedRef.current = true;
      return;
    }

    async function loadFilterOptions() {
      console.log("Loading filter options from API...");
      
      try {
        // Load all filter options in parallel
        const [typesData, unitsData, trainsData] = await Promise.all([
          fetchPSVTypes(),
          fetchPSVUnits(),
          fetchPSVTrains()
        ]);
        
        // Process type options
        if (typesData && typesData.length > 0) {
          const formattedTypes = typesData.map((type, index) => ({
            label: type.replace(/_/g, " ").toLowerCase(),
            value: type,
            key: `type-${index}-${type}`
          }));
          
          setPsvTypes(formattedTypes);
          optionsCache.types = formattedTypes;
        }
        
        // Process unit options
        if (unitsData && unitsData.length > 0) {
          const formattedUnits = unitsData.map((unit, index) => ({
            label: unit,
            value: unit,
            key: `unit-${index}-${unit}`
          }));
          
          setPsvUnits(formattedUnits);
          optionsCache.units = formattedUnits;
        }
        
        // Process train options
        if (trainsData && trainsData.length > 0) {
          const formattedTrains = trainsData.map((train, index) => ({
            label: train,
            value: train,
            key: `train-${index}-${train}`
          }));
          
          setPsvTrains(formattedTrains);
          optionsCache.trains = formattedTrains;
        }
        
        // Update cache timestamp
        optionsCache.lastFetchTime = Date.now();
        optionsLoadedRef.current = true;
        
        console.log("Filter options loaded successfully");
      } catch (error) {
        console.error("Failed to load filter options:", error);
        
        // Use defaults if API calls fail
        setPsvTypes(defaultTypes);
        setPsvUnits(defaultUnits);
        setPsvTrains(defaultTrains);
        
        // Update cache with defaults
        optionsCache.types = defaultTypes;
        optionsCache.units = defaultUnits;
        optionsCache.trains = defaultTrains;
        optionsCache.lastFetchTime = Date.now();
        optionsLoadedRef.current = true;
      }
    }
    
    loadFilterOptions();
  }, []);

  const handleInputChange = (value: string) => {
    // Clear any existing timeout
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
    }
    
    // Set a new timeout for debounced search
    inputTimeoutRef.current = setTimeout(() => {
      console.log(`Search filter changed to: "${value}"`);
      table.getColumn("tag_number")?.setFilterValue(value);
    }, 300);
  };

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
      }
    };
  }, []);

  // Debug logging active filters
  const columnFilters = table.getState().columnFilters;
  useEffect(() => {
    console.log("Toolbar - Current column filters:", columnFilters);
  }, [columnFilters]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2 flex-wrap gap-2">
          <Input
            placeholder="Filter PSV tags..."
            defaultValue={(table.getColumn("tag_number")?.getFilterValue() as string) ?? ""}
            onChange={(event) => handleInputChange(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
          
          {/* Type Filter */}
          {table.getColumn("type") && (
            <DataTableFacetedFilter
              column={table.getColumn("type")}
              title="Type"
              options={psvTypes}
            />
          )}
          
          {/* Unit Filter */}
          {table.getColumn("unit") && (
            <DataTableFacetedFilter
              column={table.getColumn("unit")}
              title="Unit"
              options={psvUnits}
            />
          )}
          
          {/* Train Filter */}
          {table.getColumn("train") && (
            <DataTableFacetedFilter
              column={table.getColumn("train")}
              title="Train"
              options={psvTrains}
            />
          )}
          
          {/* Reset button - ensure it calls our enhanced reset handler */}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={handleResetFilters}
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
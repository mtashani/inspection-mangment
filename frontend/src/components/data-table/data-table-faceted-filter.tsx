"use client"

import * as React from "react"
import { PlusCircleIcon } from "lucide-react"
import { Column } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options: {
    label: string
    value: string
    key?: string // Add optional key property
    icon?: React.ComponentType<{ className?: string }>
  }[]
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  // Get the current filter value from the column
  const filterValue = column?.getFilterValue();
  
  // Initialize selected values from column filter value
  const [selectedValues, setSelectedValues] = React.useState<string[]>(
    Array.isArray(filterValue) ? filterValue : []
  );

  // Update our state whenever the column filter value changes
  React.useEffect(() => {
    if (column) {
      const currentFilterValue = column.getFilterValue();
      
      // If filter is reset/cleared, update the local state to empty array
      if (currentFilterValue === undefined) {
        console.log(`${title} filter reset detected, clearing selected values`);
        setSelectedValues([]);
      } 
      // If we have a valid array filter value, update local state
      else if (Array.isArray(currentFilterValue)) {
        console.log(`${title} filter changed to:`, currentFilterValue);
        setSelectedValues(currentFilterValue);
      }
    }
  }, [column?.getFilterValue(), title, column]);

  // Debug logging
  React.useEffect(() => {
    console.log(`${title} selectedValues:`, selectedValues);
  }, [selectedValues, title]);

  // Handler for checkbox changes
  const handleCheckboxChange = (checked: boolean, value: string) => {
    let newValues: string[];
    
    if (checked) {
      newValues = [...selectedValues, value];
    } else {
      newValues = selectedValues.filter((v) => v !== value);
    }
    
    console.log(`${title} filter changed:`, { checked, value, newValues });
    
    setSelectedValues(newValues);
    
    if (column) {
      // Set filter directly with array value - this ensures React updates properly
      column.setFilterValue(newValues.length ? newValues : undefined);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`h-8 border-dashed ${selectedValues.length > 0 ? "border-primary/70 bg-primary/10" : ""}`}
        >
          <PlusCircleIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.length > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.length} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.includes(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.key || `filter-${option.value}`}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-4" align="start">
        <div className="space-y-4">
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <div key={option.key || `option-${option.value}`} className="flex items-center space-x-2">
                <Checkbox
                  id={`checkbox-${option.key || option.value}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange(!!checked, option.value)
                  }
                />
                <div className="flex items-center space-x-2">
                  {option.icon && (
                    <option.icon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <label
                    htmlFor={`checkbox-${option.key || option.value}`}
                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 whitespace-nowrap cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              </div>
            )
          })}
          {selectedValues.length > 0 && (
            <>
              <Separator className="my-2" />
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  // Clear local state
                  setSelectedValues([]);
                  
                  // Clear column filter
                  if (column) {
                    column.setFilterValue(undefined);
                  }
                  
                  console.log(`${title} filter cleared locally`);
                }}
              >
                Clear filters
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
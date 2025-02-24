"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DateField = "lastCalibrationDate" | "nextCalibrationDate";

interface DateRangeFilterProps {
  onDateRangeChange: (range: DateRange | undefined) => void;
  onDateFieldChange: (field: DateField) => void;
}

export function DateRangeFilter({
  onDateRangeChange,
  onDateFieldChange,
}: DateRangeFilterProps) {
  const [date, setDate] = React.useState<DateRange | undefined>();
  const [field, setField] = React.useState<DateField>("lastCalibrationDate");

  return (
    <div className="flex items-center gap-2">
      <Select
        value={field}
        onValueChange={(value: DateField) => {
          setField(value);
          onDateFieldChange(value);
        }}
      >
        <SelectTrigger className="w-[180px] h-8">
          <SelectValue placeholder="Select date field" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="lastCalibrationDate">Last Calibration</SelectItem>
          <SelectItem value="nextCalibrationDate">Next Calibration</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[240px] h-8 justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(range) => {
              setDate(range);
              onDateRangeChange(range);
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {date && (
        <Button
          variant="ghost"
          className="h-8 px-2 lg:px-3"
          onClick={() => {
            setDate(undefined);
            onDateRangeChange(undefined);
          }}
        >
          Reset
        </Button>
      )}
    </div>
  );
}
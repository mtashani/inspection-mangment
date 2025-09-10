"use client";

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SimpleJalaliDatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

export function SimpleJalaliDatePicker({
  value = "",
  onChange,
  placeholder = "Select date",
  className = ""
}: SimpleJalaliDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Simple date conversion helpers (you can enhance these)
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fa-IR'); // Persian locale
    } catch {
      return dateStr;
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault(); // Prevent form submission
    const newDate = e.target.value;
    onChange(newDate);
    // Don't close the popover immediately to prevent accidental form submission
    setTimeout(() => setIsOpen(false), 100);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button" // Explicitly set type to button to prevent form submission
          variant="outline"
          className={`w-full justify-start text-left font-normal ${className}`}
          onClick={(e) => {
            e.preventDefault(); // Prevent form submission
            setIsOpen(!isOpen);
          }}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {value ? formatDisplayDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Date:</label>
          <Input
            type="date"
            value={value}
            onChange={handleDateChange}
            className="w-full"
            // Prevent form submission on Enter key
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          />
          <div className="flex justify-between mt-2">
            <p className="text-xs text-gray-500">
              Using Gregorian calendar for now
            </p>
            <Button 
              type="button"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(false);
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
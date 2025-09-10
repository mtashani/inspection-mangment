import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { InspectorFormData, workScheduleTypes } from "@/types/inspector-form";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import jalaali from 'jalaali-js';

interface WorkCycleTabProps {
  formData: InspectorFormData;
  errors: Record<string, string>;
  handleInputChange: (
    field: keyof InspectorFormData,
    value: string | number | boolean
  ) => void;
  onPrevious: () => void;
  onNext: () => Promise<void>;
}

export function WorkCycleTab({
  formData,
  errors,
  handleInputChange,
  onPrevious,
  onNext,
}: WorkCycleTabProps) {
  return (
    <Card className="rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#E5E7EB]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#111827]">
          <Calendar className="w-5 h-5 text-[#1E3A8A]" />
          Work Cycle Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="cycle_type"
              className="text-sm font-medium text-[#111827]"
            >
              Work Schedule Type
            </Label>
            <Select
              value={formData.cycle_type}
              onValueChange={(value) => handleInputChange("cycle_type", value)}
            >
              <SelectTrigger className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]">
                <SelectValue placeholder="Select work schedule type" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-[#E5E7EB]">
                {workScheduleTypes.map((type) => (
                  <SelectItem
                    key={type.value}
                    value={type.value}
                    className="rounded-md"
                  >
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="jalali_start_date"
              className="text-sm font-medium text-[#111827]"
            >
              Cycle Start Date
            </Label>
            <div className={`border rounded-lg p-2 ${errors.jalali_start_date ? "border-[#EF4444]" : "border-[#E5E7EB]"}`}>
              <JalaliDatePicker
                value={formData.jalali_start_date ? new Date(formData.jalali_start_date) : undefined}
                onChange={(date) => {
                  try {
                    // Convert the Date to a string format for the form
                    const jalaliDate = date.toISOString().split("T")[0];
                    handleInputChange("jalali_start_date", jalaliDate);
                  } catch (error) {
                    console.error("Error converting date:", error);
                  }
                }}
                placeholder="انتخاب تاریخ شروع"
              />
            </div>
            {errors.jalali_start_date && (
              <p className="text-sm text-[#EF4444] mt-1">
                {errors.jalali_start_date}
              </p>
            )}
            <p className="text-xs text-[#6B7280] mt-1">
              تاریخ شروع چرخه کاری (تقویم جلالی)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 rounded-lg border border-[#F3F4F6] hover:border-[#E5E7EB] transition-all duration-150">
          <Checkbox
            id="attendance_tracking_enabled"
            checked={formData.attendance_tracking_enabled === true}
            onCheckedChange={(checked) => {
              console.log("Attendance tracking checkbox changed:", checked);
              // Force boolean value
              const boolValue = Boolean(checked);
              console.log("Setting attendance_tracking_enabled to:", boolValue, "Type:", typeof boolValue);
              handleInputChange(
                "attendance_tracking_enabled",
                boolValue
              );
            }}
            className="rounded-md border-[#E5E7EB] data-[state=checked]:bg-[#1E3A8A] data-[state=checked]:border-[#1E3A8A]"
          />
          <label
            htmlFor="attendance_tracking_enabled"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-[#111827]"
            onClick={() => {
              // Toggle checkbox when clicking on label
              const newValue = !formData.attendance_tracking_enabled;
              console.log("Label clicked, toggling to:", newValue, "Type:", typeof newValue);
              handleInputChange("attendance_tracking_enabled", Boolean(newValue));
            }}
          >
            Enable attendance tracking
          </label>
        </div>

        <div className="flex justify-between mt-6">
          <Button
            type="button"
            onClick={onPrevious}
            variant="outline"
            className="border-[#E5E7EB] text-[#6B7280]"
          >
            Previous: Specialties
          </Button>
          <Button
            type="button"
            onClick={onNext}
            className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white"
          >
            Next: Payroll Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

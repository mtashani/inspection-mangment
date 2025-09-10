import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";
import { InspectorFormData } from '@/types/inspector-form';

interface PayrollTabProps {
  formData: InspectorFormData;
  errors: Record<string, string>;
  handleInputChange: (field: keyof InspectorFormData, value: string | number | boolean) => void;
  onPrevious: () => void;
  onNext: () => Promise<void>;
}

export function PayrollTab({ 
  formData, 
  errors, 
  handleInputChange,
  onPrevious,
  onNext 
}: PayrollTabProps) {
  return (
    <Card className="rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#E5E7EB]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#111827]">
          <DollarSign className="w-5 h-5 text-[#1E3A8A]" />
          Payroll Settings (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="bg-blue-50 p-4 rounded-md mb-4">
          <p className="text-sm text-blue-700">
            All fields in this section are optional and can be configured later.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="base_hourly_rate" className="text-sm font-medium text-[#111827]">Base Hourly Rate</Label>
            <Input
              id="base_hourly_rate"
              type="number"
              step="0.01"
              min="0"
              value={formData.base_hourly_rate || ''}
              onChange={(e) => handleInputChange("base_hourly_rate", parseFloat(e.target.value) || 0)}
              placeholder="Enter base hourly rate"
              className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="overtime_multiplier" className="text-sm font-medium text-[#111827]">Overtime Multiplier</Label>
            <Input
              id="overtime_multiplier"
              type="number"
              step="0.1"
              min="1"
              value={formData.overtime_multiplier || 1.5}
              onChange={(e) => handleInputChange("overtime_multiplier", parseFloat(e.target.value) || 1.5)}
              placeholder="Enter overtime multiplier"
              className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="night_shift_multiplier" className="text-sm font-medium text-[#111827]">Night Shift Multiplier</Label>
            <Input
              id="night_shift_multiplier"
              type="number"
              step="0.1"
              min="1"
              value={formData.night_shift_multiplier || 2.0}
              onChange={(e) => handleInputChange("night_shift_multiplier", parseFloat(e.target.value) || 2.0)}
              placeholder="Enter night shift multiplier"
              className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="on_call_multiplier" className="text-sm font-medium text-[#111827]">On-Call Multiplier</Label>
            <Input
              id="on_call_multiplier"
              type="number"
              step="0.1"
              min="1"
              value={formData.on_call_multiplier || 1.25}
              onChange={(e) => handleInputChange("on_call_multiplier", parseFloat(e.target.value) || 1.25)}
              placeholder="Enter on-call multiplier"
              className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
            />
          </div>
        </div>
        
        <div className="pt-4 border-t border-[#F3F4F6]">
          <h4 className="text-sm font-medium text-[#111827] mb-4">Additional Allowances</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="housing_allowance" className="text-sm font-medium text-[#111827]">Housing Allowance</Label>
              <Input
                id="housing_allowance"
                type="number"
                step="0.01"
                min="0"
                value={formData.housing_allowance || 0}
                onChange={(e) => handleInputChange("housing_allowance", parseFloat(e.target.value) || 0)}
                placeholder="Enter housing allowance"
                className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transportation_allowance" className="text-sm font-medium text-[#111827]">Transportation Allowance</Label>
              <Input
                id="transportation_allowance"
                type="number"
                step="0.01"
                min="0"
                value={formData.transportation_allowance || 0}
                onChange={(e) => handleInputChange("transportation_allowance", parseFloat(e.target.value) || 0)}
                placeholder="Enter transportation allowance"
                className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meal_allowance" className="text-sm font-medium text-[#111827]">Meal Allowance</Label>
              <Input
                id="meal_allowance"
                type="number"
                step="0.01"
                min="0"
                value={formData.meal_allowance || 0}
                onChange={(e) => handleInputChange("meal_allowance", parseFloat(e.target.value) || 0)}
                placeholder="Enter meal allowance"
                className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          <Button 
            type="button" 
            onClick={onPrevious}
            variant="outline"
            className="border-[#E5E7EB] text-[#6B7280]"
          >
            Previous: Work Cycle
          </Button>
          <Button 
            type="button" 
            onClick={onNext}
            className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white"
          >
            Next: Access Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
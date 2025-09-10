import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield } from "lucide-react";
import { InspectorFormData, specialtyOptions } from '@/types/inspector-form';
import { SpecialtyCode } from '@/types/inspector';

interface SpecialtiesTabProps {
  formData: InspectorFormData;
  errors: Record<string, string>;
  handleInputChange: (field: keyof InspectorFormData, value: string | number | boolean) => void;
  onPrevious: () => void;
  onNext: () => Promise<void>;
}

export function SpecialtiesTab({ 
  formData, 
  errors, 
  handleInputChange,
  onPrevious,
  onNext 
}: SpecialtiesTabProps) {
  const handleSpecialtyChange = (specialty: SpecialtyCode, checked: boolean) => {
    const newSpecialties = checked
      ? [...formData.specialties, specialty]
      : formData.specialties.filter((s) => s !== specialty);
    
    handleInputChange("specialties", newSpecialties as unknown);
  };

  return (
    <Card className="rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#E5E7EB]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#111827]">
          <Shield className="w-5 h-5 text-[#1E3A8A]" />
          Specialties & Access Permissions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <p className="text-sm text-blue-700">
            Select the specialties and access permissions for this inspector. These determine which modules and features they can access.
          </p>
        </div>

        <div className="space-y-3">
          {specialtyOptions.map((specialty) => (
            <div
              key={specialty.code}
              className="flex items-center space-x-3 p-4 rounded-lg border border-[#F3F4F6] hover:border-[#E5E7EB] hover:bg-[#F9FAFB] transition-all duration-150"
            >
              <Checkbox
                id={specialty.code}
                checked={formData.specialties.includes(specialty.code)}
                onCheckedChange={(checked) =>
                  handleSpecialtyChange(specialty.code, checked as boolean)
                }
                className="rounded-md border-[#E5E7EB] data-[state=checked]:bg-[#1E3A8A] data-[state=checked]:border-[#1E3A8A]"
              />
              <div className="flex-1">
                <label
                  htmlFor={specialty.code}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-[#111827]"
                >
                  {specialty.label}
                </label>
                <p className="text-xs text-[#6B7280] mt-1">
                  {specialty.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {formData.specialties.length === 0 && (
          <div className="text-center py-6 text-[#6B7280] border-2 border-dashed border-[#E5E7EB] rounded-lg">
            <Shield className="w-8 h-8 mx-auto mb-2 text-[#9CA3AF]" />
            <p className="text-sm">No specialties selected</p>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Select at least one specialty to grant access permissions
            </p>
          </div>
        )}
        
        <div className="flex justify-between mt-6">
          <Button 
            type="button" 
            onClick={onPrevious}
            variant="outline"
            className="border-[#E5E7EB] text-[#6B7280]"
          >
            Previous: Professional Info
          </Button>
          <Button 
            type="button" 
            onClick={onNext}
            className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white"
          >
            Next: Work Cycle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
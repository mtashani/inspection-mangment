import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InspectorFormData, inspectorTypes } from '@/types/inspector-form';

interface ProfessionalInfoTabProps {
  formData: InspectorFormData;
  errors: Record<string, string>;
  handleInputChange: (field: keyof InspectorFormData, value: string | number | boolean) => void;
  onPrevious: () => void;
  onNext: () => Promise<void>;
}

export function ProfessionalInfoTab({ 
  formData, 
  errors, 
  handleInputChange, 
  onPrevious,
  onNext 
}: ProfessionalInfoTabProps) {
  return (
    <Card className="rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#E5E7EB]">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-[#111827]">
          Professional Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="inspector_type"
              className="text-sm font-medium text-[#111827]"
            >
              Inspector Type *
            </Label>
            <Select
              value={formData.inspector_type}
              onValueChange={(value) =>
                handleInputChange("inspector_type", value)
              }
            >
              <SelectTrigger
                className={`rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A] ${
                  errors.inspector_type
                    ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]"
                    : ""
                }`}
              >
                <SelectValue placeholder="Select inspector type" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-[#E5E7EB]">
                {inspectorTypes.map((type) => (
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
            {errors.inspector_type && (
              <p className="text-sm text-[#EF4444] mt-1">
                {errors.inspector_type}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="years_experience"
              className="text-sm font-medium text-[#111827]"
            >
              Years of Experience *
            </Label>
            <Input
              id="years_experience"
              type="number"
              min="0"
              value={formData.years_experience}
              onChange={(e) =>
                handleInputChange(
                  "years_experience",
                  parseInt(e.target.value) || 0
                )
              }
              placeholder="Enter years of experience"
              className={`rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A] ${
                errors.years_experience
                  ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]"
                  : ""
              }`}
            />
            {errors.years_experience && (
              <p className="text-sm text-[#EF4444] mt-1">
                {errors.years_experience}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="date_of_birth"
              className="text-sm font-medium text-[#111827]"
            >
              Date of Birth
            </Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) =>
                handleInputChange("date_of_birth", e.target.value)
              }
              className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="birth_place"
              className="text-sm font-medium text-[#111827]"
            >
              Birth Place
            </Label>
            <Input
              id="birth_place"
              value={formData.birth_place || ''}
              onChange={(e) =>
                handleInputChange("birth_place", e.target.value)
              }
              placeholder="Enter birth place"
              className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
            />
          </div>
        </div>

        {/* Educational Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#111827] border-b border-[#E5E7EB] pb-2">
            Educational Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="education_degree"
                className="text-sm font-medium text-[#111827]"
              >
                Education Degree
              </Label>
              <Input
                id="education_degree"
                value={formData.education_degree || ''}
                onChange={(e) =>
                  handleInputChange("education_degree", e.target.value)
                }
                placeholder="e.g., Bachelor's, Master's, PhD"
                className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="education_field"
                className="text-sm font-medium text-[#111827]"
              >
                Field of Study
              </Label>
              <Input
                id="education_field"
                value={formData.education_field || ''}
                onChange={(e) =>
                  handleInputChange("education_field", e.target.value)
                }
                placeholder="e.g., Mechanical Engineering"
                className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="education_institute"
                className="text-sm font-medium text-[#111827]"
              >
                Educational Institute
              </Label>
              <Input
                id="education_institute"
                value={formData.education_institute || ''}
                onChange={(e) =>
                  handleInputChange("education_institute", e.target.value)
                }
                placeholder="e.g., University of Tehran"
                className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="graduation_year"
                className="text-sm font-medium text-[#111827]"
              >
                Graduation Year
              </Label>
              <Input
                id="graduation_year"
                type="number"
                min="1950"
                max={new Date().getFullYear()}
                value={formData.graduation_year || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange("graduation_year", value ? parseInt(value) : undefined);
                }}
                placeholder="e.g., 2020"
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
            Previous: Basic Info
          </Button>
          <Button 
            type="button" 
            onClick={onNext}
            className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white"
          >
            Next: Specialties
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
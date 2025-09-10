import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Camera, Upload, Trash2 } from "lucide-react";
import { InspectorFormData } from '@/types/inspector-form';

interface BasicInfoTabProps {
  formData: InspectorFormData;
  errors: Record<string, string>;
  handleInputChange: (field: keyof InspectorFormData, value: string | number | boolean) => void;
  handleProfileImageChange: (file: File | null) => void;
  onNext: () => Promise<void>;
  loading?: boolean;
}

export function BasicInfoTab({ formData, errors, handleInputChange, handleProfileImageChange, onNext, loading = false }: BasicInfoTabProps) {
  return (
    <Card className="rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#E5E7EB]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#111827]">
          <UserPlus className="w-5 h-5 text-[#1E3A8A]" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="first_name"
              className="text-sm font-medium text-[#111827]"
            >
              First Name *
            </Label>
            <Input
              id="first_name"
              value={formData.first_name || ''}
              onChange={(e) => handleInputChange("first_name", e.target.value)}
              placeholder="Enter first name"
              className={`rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A] ${
                errors.first_name
                  ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]"
                  : ""
              }`}
            />
            {errors.first_name && (
              <p className="text-sm text-[#EF4444] mt-1">{errors.first_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="last_name"
              className="text-sm font-medium text-[#111827]"
            >
              Last Name *
            </Label>
            <Input
              id="last_name"
              value={formData.last_name || ''}
              onChange={(e) => handleInputChange("last_name", e.target.value)}
              placeholder="Enter last name"
              className={`rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A] ${
                errors.last_name
                  ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]"
                  : ""
              }`}
            />
            {errors.last_name && (
              <p className="text-sm text-[#EF4444] mt-1">{errors.last_name}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="employee_id"
              className="text-sm font-medium text-[#111827]"
            >
              Employee ID *
            </Label>
            <Input
              id="employee_id"
              value={formData.employee_id}
              onChange={(e) =>
                handleInputChange("employee_id", e.target.value)
              }
              placeholder="Enter employee ID"
              className={`rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A] ${
                errors.employee_id
                  ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]"
                  : ""
              }`}
            />
            {errors.employee_id && (
              <p className="text-sm text-[#EF4444] mt-1">
                {errors.employee_id}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="national_id"
              className="text-sm font-medium text-[#111827]"
            >
              National ID *
            </Label>
            <Input
              id="national_id"
              value={formData.national_id || ''}
              onChange={(e) =>
                handleInputChange("national_id", e.target.value)
              }
              placeholder="Enter national ID (10 digits)"
              maxLength={10}
              className={`rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A] ${
                errors.national_id
                  ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]"
                  : ""
              }`}
            />
            {errors.national_id && (
              <p className="text-sm text-[#EF4444] mt-1">
                {errors.national_id}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-sm font-medium text-[#111827]"
          >
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="Enter email address"
            className={`rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A] ${
              errors.email
                ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]"
                : ""
            }`}
          />
          {errors.email && (
            <p className="text-sm text-[#EF4444] mt-1">{errors.email}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="phone"
              className="text-sm font-medium text-[#111827]"
            >
              Phone
            </Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Enter phone number"
              className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="department"
              className="text-sm font-medium text-[#111827]"
            >
              Department
            </Label>
            <Input
              id="department"
              value={formData.department || ''}
              onChange={(e) =>
                handleInputChange("department", e.target.value)
              }
              placeholder="Enter department"
              className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
            />
          </div>
        </div>

        {/* Profile Image Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#111827]">
            Profile Image
          </Label>
          <div className="flex items-center gap-4">
            {formData.profile_image ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center overflow-hidden">
                  <Image
                    src={URL.createObjectURL(formData.profile_image)}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                    width={64}
                    height={64}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#111827]">
                    {formData.profile_image.name}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {(formData.profile_image.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleProfileImageChange(null)}
                  className="text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEF2F2]"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4 w-full">
                <div className="w-16 h-16 rounded-full bg-[#F3F4F6] border-2 border-dashed border-[#E5E7EB] flex items-center justify-center">
                  <Camera className="w-6 h-6 text-[#9CA3AF]" />
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="profile_image"
                    accept="image/*"
                    onChange={(e) =>
                      handleProfileImageChange(
                        e.target.files?.[0] || null
                      )
                    }
                    className="hidden"
                  />
                  <Label
                    htmlFor="profile_image"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] bg-white hover:bg-[#F9FAFB] transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Choose Image
                  </Label>
                  <p className="text-xs text-[#6B7280] mt-1">
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <Button 
            type="button" 
            onClick={onNext}
            disabled={loading}
            className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Validating...
              </>
            ) : (
              "Next: Professional Info"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Save } from "lucide-react";
import { InspectorFormData } from '@/types/inspector-form';

interface AccessTabProps {
  formData: InspectorFormData;
  errors: Record<string, string>;
  handleInputChange: (field: keyof InspectorFormData, value: string | number | boolean) => void;
  onPrevious: () => void;
  loading: boolean;
}

export function AccessTab({ 
  formData, 
  errors, 
  handleInputChange,
  onPrevious,
  loading
}: AccessTabProps) {
  return (
    <Card className="rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#E5E7EB]">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-[#111827]">Authentication Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center space-x-3 p-3 rounded-lg border border-[#F3F4F6] hover:border-[#E5E7EB] transition-all duration-150">
          <Checkbox
            id="can_login"
            checked={formData.can_login}
            onCheckedChange={(checked) => handleInputChange("can_login", checked as boolean)}
            className="rounded-md border-[#E5E7EB] data-[state=checked]:bg-[#1E3A8A] data-[state=checked]:border-[#1E3A8A]"
          />
          <label
            htmlFor="can_login"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-[#111827]"
          >
            Allow login access
          </label>
        </div>

        {formData.can_login && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#F3F4F6]">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-[#111827]">Username *</Label>
              <Input
                id="username"
                value={formData.username || ''}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="Enter username"
                className={`rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A] ${
                  errors.username
                    ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]"
                    : ""
                }`}
              />
              {errors.username && <p className="text-sm text-[#EF4444] mt-1">{errors.username}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#111827]">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password || ''}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Enter password"
                className={`rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A] ${
                  errors.password
                    ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]"
                    : ""
                }`}
              />
              {errors.password && <p className="text-sm text-[#EF4444] mt-1">{errors.password}</p>}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3 p-3 rounded-lg border border-[#F3F4F6] hover:border-[#E5E7EB] transition-all duration-150">
          <Checkbox
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => handleInputChange("active", checked as boolean)}
            className="rounded-md border-[#E5E7EB] data-[state=checked]:bg-[#1E3A8A] data-[state=checked]:border-[#1E3A8A]"
          />
          <label
            htmlFor="active"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-[#111827]"
          >
            Active inspector
          </label>
        </div>
        
        <div className="flex justify-between mt-6">
          <Button 
            type="button" 
            onClick={onPrevious}
            variant="outline"
            className="border-[#E5E7EB] text-[#6B7280]"
          >
            Previous: Payroll Settings
          </Button>
          <Button 
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white font-medium transition-all duration-150 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? "Creating..." : "Create Inspector"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
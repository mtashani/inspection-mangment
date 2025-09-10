import React from 'react';
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
import { Trash2, Upload, FileText } from "lucide-react";
import { CertificationData, certificationTypes, certificationLevels } from '@/types/inspector-form';

interface CertificationFormProps {
  certifications: CertificationData[];
  addCertification: () => void;
  removeCertification: (index: number) => void;
  updateCertification: (index: number, field: keyof CertificationData, value: string) => void;
  handleCertificateFileChange: (index: number, file: File | null) => void;
}

export function CertificationForm({
  certifications,
  addCertification,
  removeCertification,
  updateCertification,
  handleCertificateFileChange
}: CertificationFormProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#111827]">Certifications</h3>
        <Button
          type="button"
          onClick={addCertification}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 rounded-lg border-[#E5E7EB] text-[#1E3A8A] hover:bg-[#F0F9FF]"
        >
          <span className="w-4 h-4">+</span>
          Add Certification
        </Button>
      </div>

      {certifications.length === 0 ? (
        <div className="text-center py-8 text-[#6B7280] border-2 border-dashed border-[#E5E7EB] rounded-lg">
          <FileText className="w-12 h-12 mx-auto mb-4 text-[#9CA3AF]" />
          <p className="text-sm">No certifications added yet</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Click "Add Certification" to add inspector certifications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {certifications.map((cert, index) => (
            <div key={index} className="p-4 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-[#111827]">Certification {index + 1}</h4>
                <Button
                  type="button"
                  onClick={() => removeCertification(index)}
                  variant="ghost"
                  size="sm"
                  className="text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEF2F2]"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#111827]">Certification Type</Label>
                  <Select
                    value={cert.certification_type}
                    onValueChange={(value) => updateCertification(index, 'certification_type', value)}
                  >
                    <SelectTrigger className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]">
                      <SelectValue placeholder="Select certification type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-[#E5E7EB]">
                      {certificationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="rounded-md">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#111827]">Certification Number</Label>
                  <Input
                    value={cert.certification_number}
                    onChange={(e) => updateCertification(index, 'certification_number', e.target.value)}
                    placeholder="Enter certificate number"
                    className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#111827]">Level</Label>
                  <Select
                    value={cert.level}
                    onValueChange={(value) => updateCertification(index, 'level', value)}
                  >
                    <SelectTrigger className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-[#E5E7EB]">
                      {certificationLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value} className="rounded-md">
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#111827]">Issue Date</Label>
                  <Input
                    type="date"
                    value={cert.issue_date}
                    onChange={(e) => updateCertification(index, 'issue_date', e.target.value)}
                    className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#111827]">Expiry Date</Label>
                  <Input
                    type="date"
                    value={cert.expiry_date}
                    onChange={(e) => updateCertification(index, 'expiry_date', e.target.value)}
                    className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#111827]">Issuing Authority</Label>
                  <Input
                    value={cert.issuing_authority}
                    onChange={(e) => updateCertification(index, 'issuing_authority', e.target.value)}
                    placeholder="Enter issuing authority"
                    className="rounded-lg border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              {/* Certificate File Upload */}
              <div className="mt-4 space-y-2">
                <Label className="text-sm font-medium text-[#111827]">Certificate Document</Label>
                {cert.certificate_file ? (
                  <div className="flex items-center gap-3 p-3 bg-[#F0F9FF] border border-[#E0F2FE] rounded-lg">
                    <FileText className="w-5 h-5 text-[#1E3A8A]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#111827]">{cert.certificate_file.name}</p>
                      <p className="text-xs text-[#6B7280]">{(cert.certificate_file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCertificateFileChange(index, null)}
                      className="text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEF2F2]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-4 text-center hover:border-[#1E3A8A] transition-colors">
                    <input
                      type="file"
                      id={`cert-file-${index}`}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleCertificateFileChange(index, e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <Label
                      htmlFor={`cert-file-${index}`}
                      className="cursor-pointer inline-flex flex-col items-center gap-2"
                    >
                      <Upload className="w-8 h-8 text-[#9CA3AF]" />
                      <span className="text-sm font-medium text-[#374151]">Upload Certificate</span>
                      <span className="text-xs text-[#6B7280]">PDF, JPG, PNG. Max 10MB.</span>
                    </Label>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
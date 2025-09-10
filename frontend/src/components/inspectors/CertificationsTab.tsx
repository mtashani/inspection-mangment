import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { InspectorFormData } from "@/types/inspector-form";
import { InspectorCertification, CertificationLevel } from "@/types/inspector";
import { FileUpload } from "@/components/ui/file-upload";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { PlusCircle, X, Edit2 } from "lucide-react";
import { CertificationData } from "@/types/inspector-form";

interface CertificationsTabProps {
  formData: InspectorFormData;
  handleInputChange: (field: keyof InspectorFormData, value: string | number | boolean | CertificationData[]) => void;
  onPrevious: () => void;
  onNext: () => void;
}

interface CertificationFormState {
  certification_type: InspectorCertification;
  certification_number: string;
  level: CertificationLevel;
  issue_date: Date | null;
  expiry_date: Date | null;
  issuing_authority: string;
  document_file?: File;
  document_path?: string;
}

const initialCertificationForm: CertificationFormState = {
  certification_type: InspectorCertification.API,
  certification_number: "",
  level: CertificationLevel.Level1,
  issue_date: null,
  expiry_date: null,
  issuing_authority: "",
};

export function CertificationsTab({
  formData,
  handleInputChange,
  onPrevious,
  onNext,
}: CertificationsTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [certificationForm, setCertificationForm] = useState<CertificationFormState>(initialCertificationForm);

  const handleAddCertification = () => {
    const newCertification = prepareCertificationForSubmission(certificationForm);
    const newCertifications = [
      ...(formData.certifications || []),
      newCertification,
    ];
    handleInputChange("certifications", newCertifications);
    setCertificationForm(initialCertificationForm);
    setIsAdding(false);
  };

  const handleEditCertification = (index: number) => {
    const certification = formData.certifications?.[index];
    if (certification) {
      setCertificationForm({
        ...certification,
        certification_type: certification.certification_type as InspectorCertification,
        level: certification.level as CertificationLevel,
        issue_date: certification.issue_date ? new Date(certification.issue_date) : null,
        expiry_date: certification.expiry_date ? new Date(certification.expiry_date) : null,
      });
      setEditingIndex(index);
    }
  };

  const handleUpdateCertification = () => {
    if (editingIndex !== null && formData.certifications) {
      const updatedCertification = prepareCertificationForSubmission(certificationForm);
      const updatedCertifications = [...formData.certifications];
      updatedCertifications[editingIndex] = updatedCertification;
      handleInputChange("certifications", updatedCertifications);
      setCertificationForm(initialCertificationForm);
      setEditingIndex(null);
    }
  };

  const handleDeleteCertification = (index: number) => {
    const updatedCertifications = formData.certifications?.filter((_, i) => i !== index);
    handleInputChange("certifications", updatedCertifications || []);
  };

  const handleCertificationFormChange = (
    field: keyof CertificationFormState,
    value: string | Date | File | null
  ) => {
    setCertificationForm(prev => ({ ...prev, [field]: value }));
  };

  const formatDateForDisplay = (date: Date | null): string => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  };

  const prepareCertificationForSubmission = (cert: CertificationFormState): CertificationData => {
    return {
      ...cert,
      issue_date: cert.issue_date ? formatDateForDisplay(cert.issue_date) : "",
      expiry_date: cert.expiry_date ? formatDateForDisplay(cert.expiry_date) : "",
    };
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#E5E7EB]">
        <CardContent className="space-y-4 pt-6">
          <h3 className="text-lg font-semibold text-[#111827] mb-4">Certifications</h3>
        
        {/* Certifications List */}
        <div className="space-y-4 mb-6">
          {formData.certifications?.map((cert, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <p className="font-medium text-gray-900">{cert.certification_type}</p>
                  <p className="text-sm text-gray-600">No. {cert.certification_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Level: {cert.level}</p>
                  <p className="text-sm text-gray-600">By: {cert.issuing_authority}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Issued: {cert.issue_date ? format(new Date(cert.issue_date), "PPP") : "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Expires: {cert.expiry_date ? format(new Date(cert.expiry_date), "PPP") : "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditCertification(index)}
                  className="hover:bg-gray-100"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCertification(index)}
                  className="hover:bg-red-100 text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Certification Form */}
        {(isAdding || editingIndex !== null) && (
          <div className="border-t pt-4 mt-4">
            <h4 className="text-md font-medium mb-4">
              {editingIndex !== null ? "Edit Certification" : "Add New Certification"}
            </h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="certification_type">Certification Type</Label>
                  <Select
                    value={certificationForm.certification_type}
                    onValueChange={(value: string) =>
                      handleCertificationFormChange("certification_type", value as InspectorCertification)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select certification type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Object.values(InspectorCertification).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="certification_number">Certificate Number</Label>
                  <Input
                    id="certification_number"
                    placeholder="Enter certificate number"
                    value={certificationForm.certification_number}
                    onChange={(e) =>
                      handleCertificationFormChange("certification_number", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="level">Certification Level</Label>
                  <Select
                    value={certificationForm.level}
                    onValueChange={(value: string) =>
                      handleCertificationFormChange("level", value as CertificationLevel)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select certification level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Object.values(CertificationLevel).map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !certificationForm.issue_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {certificationForm.issue_date ? (
                          format(certificationForm.issue_date, "PPP")
                        ) : (
                          <span>Select issue date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={certificationForm.issue_date || undefined}
                        onSelect={(date) =>
                          handleCertificationFormChange("issue_date", date || null)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !certificationForm.expiry_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {certificationForm.expiry_date ? (
                          format(certificationForm.expiry_date, "PPP")
                        ) : (
                          <span>Select expiry date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={certificationForm.expiry_date || undefined}
                        onSelect={(date) =>
                          handleCertificationFormChange("expiry_date", date || null)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="issuing_authority">Issuing Authority</Label>
                  <Input
                    id="issuing_authority"
                    placeholder="Enter issuing authority"
                    value={certificationForm.issuing_authority}
                    onChange={(e) =>
                      handleCertificationFormChange("issuing_authority", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="col-span-2">
                <Label>Certificate Document</Label>
                <FileUpload
                  accept="image/*,application/pdf"
                  onFileSelect={(files: File[]) => {
                    if (files.length > 0) {
                      handleCertificationFormChange("document_file", files[0]);
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCertificationForm(initialCertificationForm);
                  setIsAdding(false);
                  setEditingIndex(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={
                  editingIndex !== null
                    ? handleUpdateCertification
                    : handleAddCertification
                }
              >
                {editingIndex !== null ? "Save Changes" : "Add Certification"}
              </Button>
            </div>
          </div>
        )}

        {!isAdding && editingIndex === null && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="w-full"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add New Certification
          </Button>
        )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Card className="rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#E5E7EB]">
        <CardContent className="pt-6">
          <div className="flex justify-between">
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
              Next: Specialties
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

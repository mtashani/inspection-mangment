"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { createInspector, getAuthHeaders, uploadInspectorProfileImage } from "@/api/inspectors";

import { checkEmployeeIdExists, checkUsernameExists } from "@/api/validation";
import { toast } from "sonner";

// Import tab components
import { BasicInfoTab } from "@/components/inspectors/BasicInfoTab";
import { ProfessionalInfoTab } from "@/components/inspectors/ProfessionalInfoTab";
import { CertificationsTab } from "@/components/inspectors/CertificationsTab";
import { WorkCycleTab } from "@/components/inspectors/WorkCycleTab";
import { PayrollTab } from "@/components/inspectors/PayrollTab";
import { AccessTab } from "@/components/inspectors/AccessTab";
import { SpecialtiesTab } from "@/components/inspectors/SpecialtiesTab";

// Import types and constants
import { InspectorFormData, initialFormData } from "@/types/inspector-form";
import { SpecialtyCode } from "@/types/inspector";
import jalaali from 'jalaali-js';

interface CreateInspectorData {
  first_name: string;
  last_name: string;
  employee_id: string;
  national_id: string;
  email: string;
  phone?: string;
  department?: string;
  inspector_type: string;
  years_experience: number;
  date_of_birth?: string;
  birth_place?: string;
  education_degree?: string;
  education_field?: string;
  education_institute?: string;
  graduation_year?: number;
  username?: string;
  password?: string;
  can_login: boolean;
  active: boolean;
  specialties: SpecialtyCode[];
  attendance_tracking_enabled: boolean;
  base_hourly_rate?: number;
  overtime_multiplier?: number;
  night_shift_multiplier?: number;
  on_call_multiplier?: number;
}

const steps = [
  { id: "basic", title: "Basic Info", description: "Personal information" },
  { id: "professional", title: "Professional", description: "Work details" },
  { id: "certifications", title: "Certifications", description: "Certificates and qualifications" },
  {
    id: "specialties",
    title: "Specialties",
    description: "Access permissions",
  },
  { id: "work-cycle", title: "Work Cycle", description: "Schedule settings" },
  { id: "payroll", title: "Payroll", description: "Compensation details" },
  { id: "access", title: "Access", description: "Login credentials" },
];

// Helper function to convert Jalali date string to Gregorian date string
const convertJalaliToGregorian = (jalaliDateStr: string): string => {
  try {
    if (!jalaliDateStr) return '';
    
    // Parse the date string (assuming format: YYYY-MM-DD)
    const [jy, jm, jd] = jalaliDateStr.split('-').map(Number);
    
    // Convert to Gregorian
    const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
    
    // Format as YYYY-MM-DD
    const gregorianDate = `${gy}-${gm.toString().padStart(2, '0')}-${gd.toString().padStart(2, '0')}`;
    
    console.log(`Jalali ${jalaliDateStr} converted to Gregorian ${gregorianDate}`);
    
    return gregorianDate;
  } catch (error) {
    console.error('Error converting Jalali to Gregorian:', error);
    return jalaliDateStr; // Return original if conversion fails
  }
};

export default function CreateInspectorPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<InspectorFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [validating, setValidating] = useState(false);

  const handleInputChange = (
    field: keyof InspectorFormData,
    value: string | number | boolean | unknown
  ) => {
    console.log(`Form field changed: ${field} = ${value}`);
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleProfileImageChange = (file: File | null) => {
    setFormData((prev) => ({
      ...prev,
      profile_image: file || undefined,
    }));
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};
    const step = steps[currentStep];

    switch (step.id) {
      case "basic":
        if (!formData.first_name?.trim()) newErrors.first_name = "First name is required";
        if (!formData.last_name?.trim()) newErrors.last_name = "Last name is required";
        if (!formData.employee_id.trim())
          newErrors.employee_id = "Employee ID is required";
        if (!formData.national_id?.trim())
          newErrors.national_id = "National ID is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
          newErrors.email = "Please enter a valid email address";
        }

        // Check if employee ID already exists (only if no other errors)
        if (
          formData.employee_id.trim() &&
          Object.keys(newErrors).length === 0
        ) {
          try {
            const employeeIdExists = await checkEmployeeIdExists(
              formData.employee_id.trim()
            );
            if (employeeIdExists) {
              newErrors.employee_id = "This Employee ID is already in use";
            }
          } catch (error) {
            // If validation API fails, we'll catch it during submission
            console.warn("Could not validate Employee ID uniqueness:", error);
          }
        }
        break;

      case "professional":
        if (!formData.inspector_type)
          newErrors.inspector_type = "Inspector type is required";
        if (formData.years_experience < 0)
          newErrors.years_experience = "Experience must be 0 or greater";
        break;

      case "work-cycle":
        if (formData.cycle_type && !formData.jalali_start_date) {
          newErrors.jalali_start_date =
            "Start date is required when selecting a work cycle type";
        }
        break;

      case "access":
        if (formData.can_login && !formData.username.trim()) {
          newErrors.username = "Username is required for login access";
        }
        if (formData.can_login && !formData.password.trim()) {
          newErrors.password = "Password is required for login access";
        }

        // Check if username already exists (only if no other errors)
        if (
          formData.can_login &&
          formData.username.trim() &&
          Object.keys(newErrors).length === 0
        ) {
          try {
            const usernameExists = await checkUsernameExists(
              formData.username.trim()
            );
            if (usernameExists) {
              newErrors.username = "This username is already taken";
            }
          } catch (error) {
            // If validation API fails, we'll catch it during submission
            console.warn("Could not validate username uniqueness:", error);
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    setValidating(true);
    try {
      const isValid = await validateCurrentStep();
      if (isValid) {
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      } else {
        toast.error("Please fix the errors before continuing");
      }
    } finally {
      setValidating(false);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission

    const isValid = await validateCurrentStep();
    if (!isValid) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    setLoading(true);
    try {
      const createData: CreateInspectorData = {
        first_name: formData.first_name?.trim() || '',
        last_name: formData.last_name?.trim() || '',
        employee_id: formData.employee_id.trim(),
        national_id: formData.national_id?.trim() || '',
        email: formData.email.trim(),
        inspector_type: formData.inspector_type,
        years_experience: formData.years_experience,
        can_login: formData.can_login,
        active: formData.active,
        specialties: formData.specialties,
        attendance_tracking_enabled: Boolean(formData.attendance_tracking_enabled),
        ...(formData.phone?.trim() && { phone: formData.phone.trim() }),
        ...(formData.department?.trim() && {
          department: formData.department.trim(),
        }),
        ...(formData.date_of_birth && {
          date_of_birth: formData.date_of_birth,
        }),
        ...(formData.birth_place?.trim() && {
          birth_place: formData.birth_place.trim(),
        }),
        ...(formData.education_degree?.trim() && {
          education_degree: formData.education_degree.trim(),
        }),
        ...(formData.education_field?.trim() && {
          education_field: formData.education_field.trim(),
        }),
        ...(formData.education_institute?.trim() && {
          education_institute: formData.education_institute.trim(),
        }),
        ...(formData.graduation_year && {
          graduation_year: formData.graduation_year,
        }),
        ...(formData.can_login &&
          formData.username?.trim() && { username: formData.username.trim() }),
        ...(formData.can_login &&
          formData.password?.trim() && { password: formData.password.trim() }),
        ...(formData.base_hourly_rate !== undefined && {
          base_hourly_rate: formData.base_hourly_rate,
        }),
        ...(formData.overtime_multiplier !== undefined && {
          overtime_multiplier: formData.overtime_multiplier,
        }),
        ...(formData.night_shift_multiplier !== undefined && {
          night_shift_multiplier: formData.night_shift_multiplier,
        }),
        ...(formData.on_call_multiplier !== undefined && {
          on_call_multiplier: formData.on_call_multiplier,
        }),
      };

      console.log("=== FORM DATA DEBUG ===");
      console.log("Full form data:", formData);
      console.log(
        "Attendance tracking enabled:",
        formData.attendance_tracking_enabled,
        "Type:",
        typeof formData.attendance_tracking_enabled
      );
      console.log("Jalali start date:", formData.jalali_start_date);
      console.log("Cycle type:", formData.cycle_type);
      console.log("=== CREATE DATA DEBUG ===");
      console.log("Data being sent to API:", createData);
      console.log(
        "Attendance tracking in createData:",
        createData.attendance_tracking_enabled,
        "Type:",
        typeof createData.attendance_tracking_enabled
      );
      console.log(
        "API URL:",
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/inspectors/`
      );

      // Create the inspector
      const inspector = await createInspector(createData);
      console.log("Inspector created successfully:", inspector);

      // Upload profile image if provided
      if (formData.profile_image) {
        try {
          console.log("Uploading profile image...");
          await uploadInspectorProfileImage(inspector.id, formData.profile_image);
          console.log("Profile image uploaded successfully");
        } catch (imageError) {
          console.error("Error uploading profile image:", imageError);
          toast.error("Inspector created but failed to upload profile image");
        }
      }

      // If work cycle data is provided, create a work cycle for the inspector
      if (formData.cycle_type && formData.jalali_start_date) {
        try {
          console.log(
            "Creating work cycle with jalali date:",
            formData.jalali_start_date
          );
          
          const workCycleUrl = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/work-cycles/?inspector_id=${inspector.id}`;
          
          // Convert Jalali date to Gregorian for start_date
          const gregorianStartDate = convertJalaliToGregorian(formData.jalali_start_date);
          
          const workCycleData = {
            start_date: gregorianStartDate, // Gregorian date for API
            cycle_type: formData.cycle_type,
            jalali_start_date: formData.jalali_start_date, // Keep original Jalali date
          };
          
          console.log("Work cycle API URL:", workCycleUrl);
          console.log("Work cycle data:", workCycleData);
          
          const response = await fetch(workCycleUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(), // Add auth headers
            },
            body: JSON.stringify(workCycleData),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
          }
          
          const workCycleResult = await response.json();
          console.log("Work cycle created successfully:", workCycleResult);
        } catch (cycleError) {
          console.error("Error creating work cycle:", cycleError);
          toast.error("Inspector created but failed to set work cycle");
        }
      }

      toast.success("Inspector created successfully!");
      router.push("/admin/inspectors");
    } catch (error) {
      console.error("Error creating inspector:", error);

      // Handle specific error messages
      let errorMessage = "Failed to create inspector";
      if (error instanceof Error) {
        if (
          error.message.includes(
            "UNIQUE constraint failed: inspectors.employee_id"
          )
        ) {
          errorMessage =
            "Employee ID already exists. Please use a different Employee ID.";
          setErrors({ employee_id: "This Employee ID is already in use" });
          setCurrentStep(0); // Go back to basic info step
        } else if (
          error.message.includes(
            "UNIQUE constraint failed: inspectors.national_id"
          )
        ) {
          errorMessage =
            "National ID already exists. Please use a different National ID.";
          setErrors({ national_id: "This National ID is already in use" });
          setCurrentStep(0); // Go back to basic info step
        } else if (
          error.message.includes(
            "UNIQUE constraint failed: inspectors.username"
          )
        ) {
          errorMessage =
            "Username already exists. Please use a different username.";
          setErrors({ username: "This username is already in use" });
          setCurrentStep(6); // Go back to access step (updated index)
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/inspectors");
  };

  const renderCurrentStep = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case "basic":
        return (
          <BasicInfoTab
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            handleProfileImageChange={handleProfileImageChange}
            onNext={handleNext}
            loading={validating}
          />
        );
      case "professional":
        return (
          <ProfessionalInfoTab
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        );
      case "certifications":
        return (
          <CertificationsTab
            formData={formData}
            handleInputChange={handleInputChange}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        );
      case "specialties":
        return (
          <SpecialtiesTab
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        );
      case "work-cycle":
        return (
          <WorkCycleTab
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        );
      case "payroll":
        return (
          <PayrollTab
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        );
      case "access":
        return (
          <AccessTab
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            onPrevious={handlePrevious}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Inspectors
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111827] font-inter">
            Create New Inspector
          </h1>
          <p className="text-[#6B7280] mt-2 text-base">
            Add a new inspector to the system
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                      index < currentStep
                        ? "bg-[#10B981] text-white"
                        : index === currentStep
                        ? "bg-[#1E3A8A] text-white"
                        : "bg-[#F3F4F6] text-[#9CA3AF]"
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p
                      className={`text-sm font-medium ${
                        index <= currentStep
                          ? "text-[#111827]"
                          : "text-[#9CA3AF]"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-[#6B7280] mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 transition-all duration-200 ${
                      index < currentStep ? "bg-[#10B981]" : "bg-[#E5E7EB]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Debug Panel - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <p>
            <strong>Name:</strong> {formData.first_name} {formData.last_name}
          </p>
          <p>
            <strong>Employee ID:</strong> {formData.employee_id}
          </p>
          <p>
            <strong>National ID:</strong> {formData.national_id}
          </p>
          <p>
            <strong>Attendance Tracking:</strong>{" "}
            {formData.attendance_tracking_enabled ? "✅ Enabled" : "❌ Disabled"}
          </p>
          <p>
            <strong>Jalali Start Date:</strong>{" "}
            {formData.jalali_start_date || "Not set"}
          </p>
          <p>
            <strong>Cycle Type:</strong> {formData.cycle_type || "Not set"}
          </p>
          <p>
            <strong>Current Step:</strong> {steps[currentStep].title}
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium">
              Form Data JSON
            </summary>
            <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto max-h-32">
              {JSON.stringify(
                {
                  first_name: formData.first_name,
                  last_name: formData.last_name,
                  employee_id: formData.employee_id,
                  national_id: formData.national_id,
                  attendance_tracking_enabled: formData.attendance_tracking_enabled,
                  cycle_type: formData.cycle_type,
                  jalali_start_date: formData.jalali_start_date,
                },
                null,
                2
              )}
            </pre>
          </details>
        </div>
      )}

      {/* Form Content */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e);
        }}
        className="space-y-6"
      >
        {renderCurrentStep()}
      </form>
    </div>
  );
}

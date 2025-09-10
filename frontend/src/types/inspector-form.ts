import { SpecialtyCode } from './inspector';

export interface CertificationData {
  certification_type: string;
  certification_number: string;
  level: string;
  issue_date: string;
  expiry_date: string;
  issuing_authority: string;
  certificate_file?: File;
}

export interface DocumentData {
  document_type: string;
  file?: File;
  description: string;
  filename: string;
}

export interface InspectorFormData {
  first_name: string;
  last_name: string;
  employee_id: string;
  national_id: string;
  email: string;
  phone: string;
  department: string;
  inspector_type: string;
  years_experience: number;
  date_of_birth: string;
  birth_place?: string;
  education_degree?: string;
  education_field?: string;
  education_institute?: string;
  graduation_year?: number;
  profile_image?: File;
  username: string;
  password: string;
  can_login: boolean;
  active: boolean;
  specialties: SpecialtyCode[];
  certifications: CertificationData[];
  documents: DocumentData[];

  // Work cycle fields
  cycle_type: string;
  jalali_start_date: string;
  attendance_tracking_enabled: boolean;

  // Payroll fields (optional)
  base_hourly_rate?: number;
  overtime_multiplier?: number;
  night_shift_multiplier?: number;
  on_call_multiplier?: number;
  housing_allowance?: number;
  transportation_allowance?: number;
  meal_allowance?: number;
}

export const initialFormData: InspectorFormData = {
  first_name: "",
  last_name: "",
  employee_id: "",
  national_id: "",
  email: "",
  phone: "",
  department: "",
  inspector_type: "",
  years_experience: 0,
  date_of_birth: "",
  birth_place: "",
  education_degree: "",
  education_field: "",
  education_institute: "",
  graduation_year: undefined,
  profile_image: undefined,
  username: "",
  password: "",
  can_login: false,
  active: true,
  specialties: [],
  certifications: [],
  documents: [],

  // Work cycle fields
  cycle_type: "",
  jalali_start_date: "",
  attendance_tracking_enabled: false,

  // Payroll fields
  base_hourly_rate: undefined,
  overtime_multiplier: 1.5,
  night_shift_multiplier: 2.0,
  on_call_multiplier: 1.25,
  housing_allowance: 0,
  transportation_allowance: 0,
  meal_allowance: 0,
};

// Constants
export const inspectorTypes = [
  { value: "mechanical", label: "Mechanical Inspector" },
  { value: "corrosion", label: "Corrosion Inspector" },
  { value: "ndt", label: "NDT Inspector" },
  { value: "electrical", label: "Electrical Inspector" },
  { value: "instrumentation", label: "Instrumentation Inspector" },
  { value: "civil", label: "Civil Inspector" },
  { value: "general", label: "General Inspector" },
  { value: "psv_operator", label: "PSV Operator" },
  { value: "lifting_equipment_operator", label: "Lifting Equipment Operator" },
];

export const specialtyOptions = [
  {
    code: "PSV" as SpecialtyCode,
    label: "PSV Access",
    description: "Calibration + Excel",
  },
  {
    code: "CRANE" as SpecialtyCode,
    label: "Crane Access",
    description: "Inspection + Excel",
  },
  {
    code: "CORROSION" as SpecialtyCode,
    label: "Corrosion Access",
    description: "Analysis + Excel",
  },
];

export const certificationTypes = [
  { value: "API510", label: "API510 - Pressure Vessel Inspector" },
  { value: "API570", label: "API570 - Piping Inspector" },
  { value: "API653", label: "API653 - Above Ground Storage Tank Inspector" },
  { value: "API580", label: "API580 - Risk-Based Inspection" },
  { value: "API571", label: "API571 - Corrosion and Materials" },
  { value: "CSWIP", label: "CSWIP - Welding Inspector" },
  { value: "NACE", label: "NACE - Corrosion Engineer" },
  { value: "ASNT", label: "ASNT - Non-Destructive Testing" },
  { value: "IWI", label: "IWI - International Welding Inspector" },
  { value: "LEEA", label: "LEEA - Lifting Equipment Engineer" },
  { value: "OTHER", label: "Other Certification" },
];

export const certificationLevels = [
  { value: "level_1", label: "Level 1" },
  { value: "level_2", label: "Level 2" },
  { value: "level_3", label: "Level 3" },
  { value: "senior", label: "Senior" },
  { value: "expert", label: "Expert" },
];

export const documentTypes = [
  { value: "certificate", label: "Certificate" },
  { value: "id_card", label: "ID Card" },
  { value: "qualification", label: "Qualification Document" },
  { value: "training_record", label: "Training Record" },
  { value: "other", label: "Other Document" },
];

export const workScheduleTypes = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "fourteen_fourteen", label: "14-14 Cycle" },
  { value: "seven_seven", label: "7-7 Cycle" },
  { value: "office", label: "Office Hours" },
  { value: "guest", label: "Guest" },
];
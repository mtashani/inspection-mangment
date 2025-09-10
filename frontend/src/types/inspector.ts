/**
 * Inspector Types - Updated for Specialty System
 */

export enum InspectorType {
  General = "General",
  Specialist = "Specialist",
  Lead = "Lead"
}

export enum InspectorCertification {
  API = "API",
  ASNT = "ASNT",
  AWS = "AWS",
  NACE = "NACE",
  Other = "Other"
}

export enum CertificationLevel {
  Level1 = "Level 1",
  Level2 = "Level 2",
  Level3 = "Level 3"
}

export type SpecialtyCode = 'PSV' | 'CRANE' | 'CORROSION'

export interface SpecialtyMap {
  PSV: boolean
  CRANE: boolean
  CORROSION: boolean
}

export interface SpecialtyInfo {
  code: SpecialtyCode
  title: string
  description: string
}

export interface Role {
  id: number
  name: string
  description?: string
}

export interface Inspector {
  id: number
  name: string
  employee_id: string
  email: string
  inspector_type: string
  specialties: SpecialtyCode[]
  permissions: string[]
  roles: Role[]
  can_login: boolean
  active: boolean
  available: boolean
  profile_image_url: string | null
  phone?: string
  department?: string
  years_experience: number
  date_of_birth?: string
  username?: string
  created_at: string
  updated_at: string
  attendance_tracking_enabled?: boolean
}

export interface CreateInspectorData {
  name: string
  employee_id: string
  email: string
  inspector_type: string
  phone?: string
  department?: string
  years_experience: number
  date_of_birth?: string
  username?: string
  password?: string
  can_login: boolean
  active: boolean
  available: boolean
  specialties?: SpecialtyCode[]
}

export interface UpdateSpecialtiesData {
  PSV: boolean
  CRANE: boolean
  CORROSION: boolean
}

// API Response Types
export interface SpecialtyApiResponse {
  PSV: boolean
  CRANE: boolean
  CORROSION: boolean
}

export interface SpecialtyCodeResponse {
  code: SpecialtyCode
  title: string
  description: string
}

// Context Types
export interface InspectorsContextType {
  inspectors: Inspector[]
  loading: boolean
  error: string | null
  getInspectorName: (id: string | number) => string
  getInspectorsBySpecialty: (specialty: SpecialtyCode) => Inspector[]
  refreshInspectors: () => Promise<void>
}

export interface SpecialtyContextType {
  specialties: SpecialtyMap
  loading: boolean
  error: string | null
  inspectorsBySpecialty: {
    PSV: Inspector[]
    CRANE: Inspector[]
    CORROSION: Inspector[]
  }
  updateInspectorSpecialties: (inspectorId: number, specialties: SpecialtyMap) => Promise<void>
  refreshInspectorsBySpecialty: () => Promise<void>
  getAvailableInspectors: (specialty: SpecialtyCode) => Inspector[]
}

// Form Types
export interface InspectorSelectorProps {
  specialty?: SpecialtyCode
  role?: 'operator' | 'approver' | 'analyst'
  value?: number | number[]
  onChange: (value: number | number[]) => void
  placeholder?: string
  multiple?: boolean
  className?: string
  disabled?: boolean
}

export interface PermissionGuardProps {
  children: React.ReactNode
  requiredPermission?: string
  requiredSpecialty?: SpecialtyCode
  requiredRole?: string
  fallback?: React.ReactNode
}

// Constants
export const SPECIALTY_CODES: Record<SpecialtyCode, SpecialtyInfo> = {
  PSV: {
    code: 'PSV',
    title: 'دسترسی PSV',
    description: 'شامل کالیبراسیون و Excel PSV'
  },
  CRANE: {
    code: 'CRANE',
    title: 'دسترسی جرثقیل',
    description: 'شامل بازرسی و Excel جرثقیل'
  },
  CORROSION: {
    code: 'CORROSION',
    title: 'دسترسی خوردگی',
    description: 'شامل تحلیل و Excel خوردگی'
  }
}

export const SPECIALTY_COLORS: Record<SpecialtyCode, string> = {
  PSV: 'bg-blue-100 text-blue-800',
  CRANE: 'bg-green-100 text-green-800',
  CORROSION: 'bg-orange-100 text-orange-800'
}
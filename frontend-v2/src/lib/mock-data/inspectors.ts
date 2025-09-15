// Inspector types and specialty codes removed - no longer used
import { Inspector, AdminPaginatedResponse } from '@/types/admin'

export const mockInspectors: Inspector[] = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Smith',
    employeeId: 'EMP001',
    nationalId: '1234567890',
    email: 'john.smith@company.com',
    phone: '+98-912-345-6789',
    department: 'Engineering',
    dateOfBirth: '1985-03-15',
    birthPlace: 'Tehran',
    maritalStatus: 'MARRIED',
    // inspectorType and specialties removed - no longer used
    // Education
    educationDegree: 'Bachelor of Science',
    educationField: 'Mechanical Engineering',
    educationInstitute: 'Tehran University',
    graduationYear: 2007,
    // Experience
    yearsExperience: 15,
    previousCompanies: ['Oil Company A', 'Inspection Corp B'],
    // Status
    active: true,
    username: 'john.smith',
    canLogin: true,
    attendanceTrackingEnabled: true,
    // Payroll
    baseHourlyRate: 45.00,
    overtimeMultiplier: 1.5,
    nightShiftMultiplier: 1.3,
    onCallMultiplier: 2.0,
    // Other
    profileImageUrl: '/images/avatars/john-smith.jpg',
    notes: 'Senior inspector with extensive PSV experience',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
    lastLoginAt: '2024-01-20T09:30:00Z'
  },
  {
    id: 2,
    firstName: 'Sarah',
    lastName: 'Johnson',
    employeeId: 'EMP002',
    nationalId: '2345678901',
    email: 'sarah.johnson@company.com',
    phone: '+98-913-456-7890',
    department: 'Quality Control',
    dateOfBirth: '1990-07-22',
    birthPlace: 'Isfahan',
    maritalStatus: 'SINGLE',
    // inspectorType and specialties removed - no longer used
    // Education
    educationDegree: 'Master of Science',
    educationField: 'Materials Engineering',
    educationInstitute: 'Sharif University',
    graduationYear: 2015,
    // Experience
    yearsExperience: 8,
    previousCompanies: ['Materials Lab Inc'],
    // Status
    active: true,
    username: 'sarah.johnson',
    canLogin: true,
    attendanceTrackingEnabled: true,
    // Payroll
    baseHourlyRate: 42.00,
    overtimeMultiplier: 1.5,
    nightShiftMultiplier: 1.3,
    onCallMultiplier: 2.0,
    // Other
    notes: 'Corrosion specialist with advanced degree',
    createdAt: '2024-01-16T08:00:00Z',
    updatedAt: '2024-01-16T08:00:00Z',
    lastLoginAt: '2024-01-19T14:15:00Z'
  },
  {
    id: 3,
    firstName: 'Mike',
    lastName: 'Wilson',
    employeeId: 'EMP003',
    nationalId: '3456789012',
    email: 'mike.wilson@contractor.com',
    phone: '+98-914-567-8901',
    department: 'External Services',
    dateOfBirth: '1982-11-08',
    birthPlace: 'Shiraz',
    maritalStatus: 'MARRIED',
    // inspectorType and specialties removed - no longer used
    // Education
    educationDegree: 'Bachelor of Engineering',
    educationField: 'Chemical Engineering',
    educationInstitute: 'Amirkabir University',
    graduationYear: 2005,
    // Experience
    yearsExperience: 18,
    previousCompanies: ['Contractor Solutions', 'Industrial Services Ltd'],
    // Status
    active: true,
    username: 'mike.wilson',
    canLogin: false,
    attendanceTrackingEnabled: false,
    // Payroll
    baseHourlyRate: 50.00,
    overtimeMultiplier: 1.5,
    nightShiftMultiplier: 1.3,
    onCallMultiplier: 2.0,
    // Other
    notes: 'Experienced contractor with dual specialties',
    createdAt: '2024-01-17T08:00:00Z',
    updatedAt: '2024-01-17T08:00:00Z'
  },
  {
    id: 4,
    firstName: 'Lisa',
    lastName: 'Chen',
    employeeId: 'EMP004',
    nationalId: '4567890123',
    email: 'lisa.chen@company.com',
    phone: '+98-915-678-9012',
    department: 'Operations',
    dateOfBirth: '1988-05-12',
    birthPlace: 'Mashhad',
    maritalStatus: 'DIVORCED',
    // inspectorType and specialties removed - no longer used
    // Education
    educationDegree: 'Bachelor of Science',
    educationField: 'Civil Engineering',
    educationInstitute: 'Ferdowsi University',
    graduationYear: 2010,
    // Experience
    yearsExperience: 12,
    previousCompanies: ['Construction Corp', 'Heavy Machinery Inc'],
    // Status
    active: false,
    username: 'lisa.chen',
    canLogin: false,
    attendanceTrackingEnabled: true,
    // Payroll
    baseHourlyRate: 40.00,
    overtimeMultiplier: 1.5,
    nightShiftMultiplier: 1.3,
    onCallMultiplier: 2.0,
    // Other
    notes: 'Crane specialist currently on leave',
    createdAt: '2024-01-18T08:00:00Z',
    updatedAt: '2024-01-18T08:00:00Z',
    lastLoginAt: '2024-01-18T16:45:00Z'
  },
  {
    id: 5,
    firstName: 'David',
    lastName: 'Brown',
    employeeId: 'EMP005',
    nationalId: '5678901234',
    email: 'david.brown@company.com',
    phone: '+98-916-789-0123',
    department: 'Senior Operations',
    dateOfBirth: '1975-09-30',
    birthPlace: 'Tabriz',
    maritalStatus: 'MARRIED',
    // inspectorType and specialties removed - no longer used
    // Education
    educationDegree: 'Master of Engineering',
    educationField: 'Petroleum Engineering',
    educationInstitute: 'University of Tehran',
    graduationYear: 1998,
    // Experience
    yearsExperience: 25,
    previousCompanies: ['National Oil Company', 'Petrochemical Industries'],
    // Status
    active: true,
    username: 'david.brown',
    canLogin: true,
    attendanceTrackingEnabled: true,
    // Payroll
    baseHourlyRate: 55.00,
    overtimeMultiplier: 1.5,
    nightShiftMultiplier: 1.3,
    onCallMultiplier: 2.0,
    // Other
    profileImageUrl: '/images/avatars/david-brown.jpg',
    notes: 'Senior inspector with all specialties and team lead experience',
    createdAt: '2024-01-19T08:00:00Z',
    updatedAt: '2024-01-19T08:00:00Z',
    lastLoginAt: '2024-01-21T07:20:00Z'
  }
]

export function getMockInspectorsPaginated(
  page: number = 1,
  limit: number = 20
): AdminPaginatedResponse<Inspector> {
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedData = mockInspectors.slice(startIndex, endIndex)
  
  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: mockInspectors.length,
      totalPages: Math.ceil(mockInspectors.length / limit)
    },
    success: true,
    message: 'Inspectors retrieved successfully'
  }
}

export function getMockInspectorById(id: number): Inspector | undefined {
  return mockInspectors.find(inspector => inspector.id === id)
}

export function searchMockInspectors(query: string): Inspector[] {
  const lowercaseQuery = query.toLowerCase()
  return mockInspectors.filter(inspector =>
    `${inspector.firstName} ${inspector.lastName}`.toLowerCase().includes(lowercaseQuery) ||
    inspector.employeeId.toLowerCase().includes(lowercaseQuery) ||
    inspector.email.toLowerCase().includes(lowercaseQuery) ||
    inspector.nationalId.includes(query)
  )
}
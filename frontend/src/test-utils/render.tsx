import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'

// Mock providers for testing
const MockProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: MockProviders, ...options })

// Mock data generators
export const mockEquipment = {
  id: 'eq-001',
  name: 'Test Equipment',
  type: 'Pressure Vessel',
  status: 'operational' as const,
  location: 'Unit 1',
  riskLevel: 'medium' as const,
  lastInspection: '2024-01-15',
  nextMaintenance: '2024-03-15',
}

export const mockInspection = {
  id: 'insp-001',
  title: 'Test Inspection',
  equipmentId: 'eq-001',
  equipmentName: 'Test Equipment',
  type: 'routine' as const,
  status: 'pending' as const,
  priority: 'medium' as const,
  assignedTo: 'John Doe',
  dueDate: '2024-02-15',
  location: 'Unit 1',
  progress: 0,
}

export const mockMaintenanceEvent = {
  id: 'maint-001',
  title: 'Test Maintenance',
  equipmentId: 'eq-001',
  equipmentName: 'Test Equipment',
  type: 'preventive' as const,
  status: 'scheduled' as const,
  priority: 'medium' as const,
  scheduledDate: '2024-02-20',
  estimatedCost: 1500,
  assignedTeam: 'Team Alpha',
  location: 'Unit 1',
  progress: 0,
  description: 'Test maintenance event',
}

export const mockReport = {
  id: 'rpt-001',
  title: 'Test Report',
  type: 'inspection' as const,
  status: 'approved' as const,
  priority: 'medium' as const,
  createdBy: 'John Doe',
  createdDate: '2024-02-10',
  lastModified: '2024-02-12',
  location: 'Unit 1',
  fileSize: '2.4 MB',
  format: 'pdf' as const,
}

export const mockUser = {
  id: 'user-001',
  name: 'John Doe',
  email: 'john.doe@company.com',
  role: 'inspector' as const,
  avatar: '/avatars/john.jpg',
}

export const mockRBIData = {
  equipmentId: 'eq-001',
  equipmentName: 'Test Equipment',
  equipmentType: 'Pressure Vessel',
  location: 'Unit 1',
  probabilityOfFailure: 0.15,
  consequenceOfFailure: 0.75,
  riskScore: 0.1125,
  riskLevel: 'medium' as const,
  lastCalculation: '2024-02-01',
  nextInspectionDue: '2024-08-01',
  inspectionInterval: 180,
  confidenceLevel: 85,
  dataQuality: 'good' as const,
}

export const mockAlert = {
  id: 'alert-001',
  title: 'Test Alert',
  message: 'This is a test alert message',
  type: 'safety' as const,
  severity: 'warning' as const,
  status: 'active' as const,
  source: 'Test System',
  location: 'Unit 1',
  createdDate: '2024-02-10T14:30:00Z',
  isRead: false,
  requiresAction: true,
}

// Mock API responses
export const mockApiResponse = <T>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

export const mockApiError = (message = 'API Error', delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay)
  })
}

// Mock fetch responses
export const mockFetchResponse = <T>(data: T, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response)
}

// Mock event handlers
export const mockHandlers = {
  onClick: vi.fn(),
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  onClose: vi.fn(),
  onSave: vi.fn(),
  onDelete: vi.fn(),
  onEdit: vi.fn(),
  onRefresh: vi.fn(),
}

// Helper to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper to create mock props
export const createMockProps = <T extends Record<string, any>>(overrides: Partial<T> = {}): T => {
  const defaultProps = {
    ...mockHandlers,
    className: 'test-class',
    isLoading: false,
    error: null,
    ...overrides,
  }
  return defaultProps as T
}

// Re-export everything from testing library
export * from '@testing-library/react'
export { customRender as render }
export { vi } from 'vitest'
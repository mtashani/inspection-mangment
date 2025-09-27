/**
 * Admin Role Management API Client
 */

import { adminApiRequest } from './base'

// Types for role management
export interface Role {
  id: number
  name: string
  description?: string
  display_label: string
  created_at: string
  updated_at: string
  inspector_count?: number
  permission_count?: number
  permissions?: string[]
}

export interface InspectorRoleAssignment {
  role_ids: number[]
}

export interface InspectorRolesResponse {
  inspector_id: number
  inspector_name: string
  roles: Role[]
}

export interface RoleListResponse {
  roles: Role[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface SuccessResponse {
  success: boolean
  message: string
}

/**
 * Get all available roles
 */
export async function getAllRoles(
  page = 1,
  pageSize = 100,
  search?: string
): Promise<RoleListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
    ...(search && { search })
  })
  
  return adminApiRequest<RoleListResponse>(`/admin/roles?${params}`)
}

/**
 * Get roles assigned to an inspector
 */
export async function getInspectorRoles(inspectorId: number): Promise<InspectorRolesResponse> {
  return adminApiRequest<InspectorRolesResponse>(`/admin/inspectors/${inspectorId}/roles`)
}

/**
 * Assign roles to an inspector (replaces all existing roles)
 */
export async function assignRolesToInspector(
  inspectorId: number,
  roleIds: number[]
): Promise<SuccessResponse> {
  const data: InspectorRoleAssignment = { role_ids: roleIds }
  return adminApiRequest<SuccessResponse>(`/admin/inspectors/${inspectorId}/roles`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

/**
 * Add a single role to an inspector
 */
export async function addRoleToInspector(
  inspectorId: number,
  roleId: number
): Promise<SuccessResponse> {
  return adminApiRequest<SuccessResponse>(`/admin/inspectors/${inspectorId}/roles/${roleId}`, {
    method: 'POST'
  })
}

/**
 * Remove a single role from an inspector
 */
export async function removeRoleFromInspector(
  inspectorId: number,
  roleId: number
): Promise<SuccessResponse> {
  return adminApiRequest<SuccessResponse>(`/admin/inspectors/${inspectorId}/roles/${roleId}`, {
    method: 'DELETE'
  })
}

/**
 * Get available roles for an inspector (roles not yet assigned)
 */
export async function getAvailableRolesForInspector(inspectorId: number): Promise<{
  inspector_id: number
  inspector_name: string
  available_roles: Role[]
  total_available: number
  total_assigned: number
}> {
  return adminApiRequest(`/admin/inspectors/${inspectorId}/available-roles`)
}

/**
 * Get effective permissions for an inspector
 */
export async function getInspectorEffectivePermissions(inspectorId: number): Promise<{
  inspector_id: number
  inspector_name: string
  total_permissions: number
  permissions_by_resource: Record<string, Array<{
    id: number
    name: string
    action: string
    display_label: string
    resource_action: string
  }>>
  all_permissions: Array<{
    id: number
    name: string
    resource: string
    action: string
    display_label: string
    resource_action: string
  }>
}> {
  return adminApiRequest(`/admin/inspectors/${inspectorId}/effective-permissions`)
}
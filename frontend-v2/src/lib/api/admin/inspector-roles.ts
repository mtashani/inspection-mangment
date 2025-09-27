/**
 * Inspector Role Management API Functions
 */

import { adminApiGet, adminApiPost, adminApiPut, adminApiDelete } from './base'

export interface Role {
  id: number
  name: string
  display_label: string
  description?: string
  created_at: string
  updated_at: string
}

export interface InspectorRoles {
  inspector_id: number
  inspector_name: string
  roles: Role[]
}

export interface AvailableRolesResponse {
  inspector_id: number
  inspector_name: string
  available_roles: Role[]
  total_available: number
  total_assigned: number
}

export interface SuccessResponse {
  success: boolean
  message: string
}

/**
 * Get all roles assigned to an inspector
 */
export async function getInspectorRoles(inspectorId: number): Promise<InspectorRoles> {
  const response = await adminApiGet<InspectorRoles>(`/admin/inspectors/${inspectorId}/roles`)
  return response
}

/**
 * Assign roles to an inspector (replaces existing roles)
 */
export async function assignRolesToInspector(inspectorId: number, roleIds: number[]): Promise<SuccessResponse> {
  const response = await adminApiPut<SuccessResponse>(
    `/admin/inspectors/${inspectorId}/roles`,
    { role_ids: roleIds }
  )
  return response
}

/**
 * Add a single role to an inspector
 */
export async function addRoleToInspector(inspectorId: number, roleId: number): Promise<SuccessResponse> {
  const response = await adminApiPost<SuccessResponse>(
    `/admin/inspectors/${inspectorId}/roles/${roleId}`,
    {}
  )
  return response
}

/**
 * Remove a role from an inspector
 */
export async function removeRoleFromInspector(inspectorId: number, roleId: number): Promise<SuccessResponse> {
  const response = await adminApiDelete<SuccessResponse>(
    `/admin/inspectors/${inspectorId}/roles/${roleId}`
  )
  return response
}

/**
 * Get available roles for an inspector (roles not yet assigned)
 */
export async function getAvailableRoles(inspectorId: number): Promise<AvailableRolesResponse> {
  const response = await adminApiGet<AvailableRolesResponse>(
    `/admin/inspectors/${inspectorId}/available-roles`
  )
  return response
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
  const response = await adminApiGet(`/admin/inspectors/${inspectorId}/effective-permissions`)
  return response
}

/**
 * Bulk assign roles to multiple inspectors
 */
export async function bulkAssignRoles(inspectorIds: number[], roleIds: number[]): Promise<SuccessResponse> {
  const response = await adminApiPost<SuccessResponse>(
    '/admin/inspectors/bulk-assign-roles',
    {
      inspector_ids: inspectorIds,
      role_ids: roleIds
    }
  )
  return response
}
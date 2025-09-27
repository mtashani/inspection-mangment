/**
 * RBAC Analytics API Functions
 */

import { adminApiGet } from './base'

export interface RBACAnalyticsOverview {
  permissionUsage: {
    percentage: number
    active: number
    total: number
    unused: number
  }
  roleDistribution: {
    total: number
    active: number
    system: number
    technical: number
  }
  securityScore: {
    score: number
    grade: string
    compliance: number
    status: string
  }
  optimization: {
    opportunities: number
    status: string
  }
}

export interface PermissionUsageItem {
  permission: string
  userCount: number
  usagePercentage: number
}

export interface PermissionUsageAnalysis {
  permissionUsage: PermissionUsageItem[]
  totalInspectors: number
}

export interface RoleEfficiencyItem {
  roleName: string
  displayLabel: string
  status: string
  message: string
  statusColor: string
  permissionCount: number
  inspectorCount: number
}

export interface RoleEfficiencyAnalysis {
  roleEfficiency: RoleEfficiencyItem[]
}

export interface RBACRecommendation {
  type: 'success' | 'warning' | 'info' | 'error'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'info'
  action: string
}

export interface RBACRecommendations {
  recommendations: RBACRecommendation[]
}

/**
 * Get RBAC analytics overview
 */
export async function getRBACAnalyticsOverview(): Promise<RBACAnalyticsOverview> {
  const response = await adminApiGet<RBACAnalyticsOverview>('/admin/rbac/analytics/overview')
  return response
}

/**
 * Get permission usage analysis
 */
export async function getPermissionUsageAnalysis(): Promise<PermissionUsageAnalysis> {
  const response = await adminApiGet<PermissionUsageAnalysis>('/admin/rbac/analytics/permission-usage')
  return response
}

/**
 * Get role efficiency analysis
 */
export async function getRoleEfficiencyAnalysis(): Promise<RoleEfficiencyAnalysis> {
  const response = await adminApiGet<RoleEfficiencyAnalysis>('/admin/rbac/analytics/role-efficiency')
  return response
}

/**
 * Get RBAC recommendations
 */
export async function getRBACRecommendations(): Promise<RBACRecommendations> {
  const response = await adminApiGet<RBACRecommendations>('/admin/rbac/analytics/recommendations')
  return response
}
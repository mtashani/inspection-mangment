import { useState, useEffect } from 'react'
import { 
  getRBACAnalyticsOverview, 
  getPermissionUsageAnalysis, 
  getRoleEfficiencyAnalysis, 
  getRBACRecommendations,
  RBACAnalyticsOverview,
  PermissionUsageAnalysis,
  RoleEfficiencyAnalysis,
  RBACRecommendations
} from '@/lib/api/admin/rbac-analytics'

interface UseRBACAnalyticsReturn {
  overview: RBACAnalyticsOverview | null
  permissionUsage: PermissionUsageAnalysis | null
  roleEfficiency: RoleEfficiencyAnalysis | null
  recommendations: RBACRecommendations | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useRBACAnalytics(): UseRBACAnalyticsReturn {
  const [overview, setOverview] = useState<RBACAnalyticsOverview | null>(null)
  const [permissionUsage, setPermissionUsage] = useState<PermissionUsageAnalysis | null>(null)
  const [roleEfficiency, setRoleEfficiency] = useState<RoleEfficiencyAnalysis | null>(null)
  const [recommendations, setRecommendations] = useState<RBACRecommendations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [overviewData, permissionData, roleData, recommendationData] = await Promise.all([
        getRBACAnalyticsOverview(),
        getPermissionUsageAnalysis(),
        getRoleEfficiencyAnalysis(),
        getRBACRecommendations()
      ])

      setOverview(overviewData)
      setPermissionUsage(permissionData)
      setRoleEfficiency(roleData)
      setRecommendations(recommendationData)
    } catch (err) {
      console.error('Error fetching RBAC analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch RBAC analytics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    overview,
    permissionUsage,
    roleEfficiency,
    recommendations,
    isLoading,
    error,
    refetch: fetchData
  }
}
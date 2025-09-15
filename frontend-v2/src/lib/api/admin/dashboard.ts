/**
 * Admin Dashboard API Functions (Updated for Inspector-Centric)
 */

import { AdminDashboardStats, AdminAnalytics, AdminApiResponse } from '@/types/admin'
import { adminApiGet, adminApiGetAuthenticated } from './base'

/**
 * Get admin dashboard statistics (using new admin domain)
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    // Get the main dashboard stats from admin API
    const backendResponse = await adminApiGetAuthenticated<any>('/admin/dashboard')
    
    // Get recent activities to populate recent activity data
    let recentActivities
    try {
      const activitiesResponse = await adminApiGetAuthenticated<any>('/admin/dashboard/recent-activities?limit=30')
      recentActivities = activitiesResponse.activities || []
    } catch (error) {
      console.warn('Failed to fetch recent activities:', error)
      recentActivities = []
    }
    
    // Calculate recent activity metrics from the activities data
    const now = new Date()
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const recentActivityCounts = {
      newInspectors: 0, // Would need inspector creation data
      completedInspections: recentActivities.filter((activity: any) => 
        activity.type === 'inspection' && 
        activity.status === 'COMPLETED' &&
        new Date(activity.timestamp) > lastMonth
      ).length,
      pendingReports: recentActivities.filter((activity: any) => 
        activity.type === 'report' && 
        activity.status === 'PENDING'
      ).length
    }
    
    // Transform backend response to match frontend interface
    const transformedStats: AdminDashboardStats = {
      totalInspectors: backendResponse.total_inspectors || 0,
      activeInspectors: backendResponse.active_inspectors || 0,
      specialtyCounts: {
        // For now, use simplified calculation - can be improved with actual backend data
        psv: Math.floor((backendResponse.active_inspectors || 0) * 0.4), // ~40% PSV
        crane: Math.floor((backendResponse.active_inspectors || 0) * 0.35), // ~35% Crane  
        corrosion: Math.floor((backendResponse.active_inspectors || 0) * 0.25), // ~25% Corrosion
      },
      upcomingBirthdays: 0, // TODO: Get from backend when available
      attendanceOverview: {
        presentToday: backendResponse.present_today || 0,
        totalScheduled: backendResponse.attendance_enabled_inspectors || backendResponse.active_inspectors || 0,
        attendanceRate: backendResponse.attendance_rate_today || 0
      },
      recentActivity: recentActivityCounts
    }
    
    return transformedStats
  } catch (error) {
    console.error('Failed to fetch admin dashboard stats:', error)
    // Return empty stats as fallback
    return {
      totalInspectors: 0,
      activeInspectors: 0,
      specialtyCounts: { psv: 0, crane: 0, corrosion: 0 },
      upcomingBirthdays: 0,
      attendanceOverview: { presentToday: 0, totalScheduled: 0, attendanceRate: 0 },
      recentActivity: { newInspectors: 0, completedInspections: 0, pendingReports: 0 }
    }
  }
}

/**
 * Get today's attendance summary (using new admin domain)
 */
export async function getTodayAttendance(): Promise<any> {
  const response = await adminApiGetAuthenticated<any>('/admin/dashboard/today-attendance')
  return response
}

/**
 * Get monthly attendance overview (using new admin domain)
 */
export async function getMonthlyOverview(
  jalaliYear: number,
  jalaliMonth: number
): Promise<any> {
  const response = await adminApiGetAuthenticated<any>(
    `/admin/dashboard/monthly-overview?jalali_year=${jalaliYear}&jalali_month=${jalaliMonth}`
  )
  return response
}

/**
 * Get recent activities (using new admin domain)
 */
export async function getRecentActivities(limit: number = 10): Promise<any> {
  const response = await adminApiGetAuthenticated<any>(
    `/admin/dashboard/recent-activities?limit=${limit}`
  )
  return response
}

/**
 * Get quick stats for widgets (using new admin domain)
 */
export async function getQuickStats(): Promise<any> {
  const response = await adminApiGetAuthenticated<any>('/admin/dashboard/quick-stats')
  return response
}

/**
 * Get department summary (using new admin domain)
 */
export async function getDepartmentSummary(): Promise<any> {
  const response = await adminApiGetAuthenticated<any>('/admin/dashboard/department-summary')
  return response
}

/**
 * Get inspector current status (using new admin domain)
 */
export async function getInspectorStatus(inspectorId: number): Promise<any> {
  const response = await adminApiGetAuthenticated<any>(`/admin/dashboard/inspector-status/${inspectorId}`)
  return response
}

/**
 * Check admin system health (using new admin domain)
 */
export async function getSystemHealth(): Promise<any> {
  const response = await adminApiGetAuthenticated<any>('/admin/system-health')
  return response
}
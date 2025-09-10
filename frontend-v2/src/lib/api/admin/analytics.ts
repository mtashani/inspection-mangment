/**
 * Admin Analytics API Functions (Inspector-Centric)
 */

import { adminApiGet } from './base'

/**
 * Get inspector attendance overview analytics (Inspector-Centric)
 */
export async function getAttendanceOverview(
  timeframe: string = 'current_month'
): Promise<any> {
  const response = await adminApiGet<any>(
    `/inspectors/attendance/analytics/overview?timeframe=${timeframe}`
  )
  return response
}

/**
 * Get inspector attendance trends (Inspector-Centric)
 */
export async function getAttendanceTrends(
  jalaliYear: number,
  jalaliMonth: number
): Promise<any> {
  const response = await adminApiGet<any>(
    `/inspectors/attendance/analytics/trends?jalali_year=${jalaliYear}&jalali_month=${jalaliMonth}`
  )
  return response
}

/**
 * Get inspector performance metrics (Inspector-Centric)
 */
export async function getPerformanceMetrics(
  inspectorIds?: number[],
  timeframe: string = 'current_month'
): Promise<any> {
  const queryParams = new URLSearchParams()
  queryParams.append('timeframe', timeframe)
  
  if (inspectorIds && inspectorIds.length > 0) {
    inspectorIds.forEach(id => queryParams.append('inspector_ids', id.toString()))
  }
  
  const response = await adminApiGet<any>(
    `/inspectors/attendance/analytics/performance?${queryParams.toString()}`
  )
  return response
}

/**
 * Get automated insights for inspector attendance (Inspector-Centric)
 */
export async function getAutomatedInsights(
  timeframe: string = 'current_month'
): Promise<any> {
  const response = await adminApiGet<any>(
    `/inspectors/attendance/analytics/insights?timeframe=${timeframe}`
  )
  return response
}

/**
 * Compare inspector attendance periods (Inspector-Centric)
 */
export async function comparePeriods(
  jalaliYear1: number,
  jalaliMonth1: number,
  jalaliYear2: number,
  jalaliMonth2: number
): Promise<any> {
  const response = await adminApiGet<any>(
    `/inspectors/attendance/analytics/comparison?jalali_year_1=${jalaliYear1}&jalali_month_1=${jalaliMonth1}&jalali_year_2=${jalaliYear2}&jalali_month_2=${jalaliMonth2}`
  )
  return response
}

/**
 * Get chart data for inspector attendance analytics (Inspector-Centric)
 */
export async function getChartData(
  chartType: string = 'weekly_trends',
  timeframe: string = 'current_month'
): Promise<any> {
  const response = await adminApiGet<any>(
    `/inspectors/attendance/analytics/charts?chart_type=${chartType}&timeframe=${timeframe}`
  )
  return response
}

/**
 * Get key performance indicators for inspector attendance (Inspector-Centric)
 */
export async function getKPIs(
  timeframe: string = 'current_month'
): Promise<any> {
  const response = await adminApiGet<any>(
    `/inspectors/attendance/analytics/kpis?timeframe=${timeframe}`
  )
  return response
}
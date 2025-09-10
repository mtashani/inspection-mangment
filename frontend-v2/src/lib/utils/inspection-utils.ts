/**
 * Utility functions for inspection management
 */

import { Inspection } from '@/types/maintenance-events';

/**
 * Determine if an inspection is planned or unplanned
 * Logic: 
 * 1. Use is_planned field from backend if available
 * 2. If inspection has maintenance_event_id or maintenance_sub_event_id, it's planned
 * 3. If no event association, it's unplanned
 */
export function determineInspectionType(inspection: Inspection): {
  isPlanned: boolean;
  reason: string;
} {
  // If backend provides is_planned field, use it (this is the most reliable)
  if (inspection.is_planned !== undefined) {
    return {
      isPlanned: inspection.is_planned,
      reason: inspection.is_planned 
        ? (inspection.maintenance_event_id ? 'Pre-planned in maintenance event' : 'Pre-planned inspection')
        : (inspection.unplanned_reason || 'Added during operations')
    };
  }

  // Fallback logic based on available data
  const hasEventAssociation = inspection.maintenance_event_id || inspection.maintenance_sub_event_id;
  
  if (hasEventAssociation) {
    return {
      isPlanned: true,
      reason: inspection.maintenance_sub_event_id 
        ? 'Part of maintenance sub-event' 
        : 'Part of maintenance event'
    };
  }

  // If no event association, consider it unplanned
  return {
    isPlanned: false,
    reason: 'Independent inspection - not part of scheduled maintenance'
  };
}

/**
 * Get inspection type badge properties
 */
export function getInspectionTypeBadge(inspection: Inspection) {
  const { isPlanned } = determineInspectionType(inspection);
  
  return {
    variant: isPlanned ? 'default' : 'secondary',
    className: isPlanned 
      ? 'bg-blue-100 text-blue-800 border-blue-200' 
      : 'bg-orange-100 text-orange-800 border-orange-200',
    icon: isPlanned ? '📋' : '⚡',
    label: isPlanned ? 'Planned' : 'Unplanned',
    fullLabel: isPlanned ? '📋 Planned' : '⚡ Unplanned'
  };
}

/**
 * Calculate inspection statistics for planned vs unplanned
 */
export function calculateInspectionStats(inspections: Inspection[]) {
  const stats = {
    total: inspections.length,
    planned: 0,
    unplanned: 0,
    completed: 0,
    inProgress: 0,
    plannedCompleted: 0,
    unplannedCompleted: 0
  };

  inspections.forEach(inspection => {
    const { isPlanned } = determineInspectionType(inspection);
    
    if (isPlanned) {
      stats.planned++;
      if (inspection.status === 'Completed') {
        stats.plannedCompleted++;
      }
    } else {
      stats.unplanned++;
      if (inspection.status === 'Completed') {
        stats.unplannedCompleted++;
      }
    }

    if (inspection.status === 'Completed') {
      stats.completed++;
    } else if (inspection.status === 'InProgress') {
      stats.inProgress++;
    }
  });

  return stats;
}

/**
 * Get completion percentage for planned inspections
 */
export function getPlannedCompletionRate(inspections: Inspection[]): number {
  const stats = calculateInspectionStats(inspections);
  
  if (stats.planned === 0) return 0;
  
  return Math.round((stats.plannedCompleted / stats.planned) * 100);
}

/**
 * Filter inspections by type
 */
export function filterInspectionsByType(
  inspections: Inspection[], 
  type: 'planned' | 'unplanned' | 'all' = 'all'
): Inspection[] {
  if (type === 'all') return inspections;
  
  return inspections.filter(inspection => {
    const { isPlanned } = determineInspectionType(inspection);
    return type === 'planned' ? isPlanned : !isPlanned;
  });
}
'use client';

import { useMemo } from 'react';
import { PSV } from '@/components/psv/types';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Risk level definitions
const RISK_LEVELS = {
  HIGH: { label: 'High Risk', color: 'bg-red-500', textColor: 'text-red-500' },
  MEDIUM: { label: 'Medium Risk', color: 'bg-amber-500', textColor: 'text-amber-500' },
  LOW: { label: 'Low Risk', color: 'bg-green-500', textColor: 'text-green-500' },
  MINIMAL: { label: 'Minimal Risk', color: 'bg-blue-500', textColor: 'text-blue-500' }
};

// Type for risk distribution data
type RiskDistribution = {
  [key: string]: {
    count: number;
    percentage: number;
    psvs: PSV[];
  };
};

interface RiskDistributionChartProps {
  psvs: PSV[];
  className?: string;
}

export function RiskDistributionChart({ psvs, className }: RiskDistributionChartProps) {
  // Calculate risk distribution from PSVs
  const riskDistribution = useMemo<RiskDistribution>(() => {
    if (!psvs || psvs.length === 0) {
      return {
        HIGH: { count: 0, percentage: 0, psvs: [] },
        MEDIUM: { count: 0, percentage: 0, psvs: [] },
        LOW: { count: 0, percentage: 0, psvs: [] },
        MINIMAL: { count: 0, percentage: 0, psvs: [] }
      };
    }
    
    const distribution: RiskDistribution = {
      HIGH: { count: 0, percentage: 0, psvs: [] },
      MEDIUM: { count: 0, percentage: 0, psvs: [] },
      LOW: { count: 0, percentage: 0, psvs: [] },
      MINIMAL: { count: 0, percentage: 0, psvs: [] }
    };
    
    // Simple algorithm to determine risk level - In real implementation, this would use actual risk data
    psvs.forEach(psv => {
      let riskLevel = 'MEDIUM';
      
      // Check for high risk indicators
      if (!psv.last_calibration_date || isHighRiskService(psv.service)) {
        riskLevel = 'HIGH';
      } 
      // Check for low risk indicators
      else if (isRecentlyCalibrated(psv.last_calibration_date) && isLowRiskService(psv.service)) {
        riskLevel = 'LOW';
      }
      // Check for minimal risk indicators
      else if (isVeryRecentlyCalibrated(psv.last_calibration_date) && isLowRiskService(psv.service)) {
        riskLevel = 'MINIMAL';
      }
      
      // Add PSV to appropriate risk level
      distribution[riskLevel].count++;
      distribution[riskLevel].psvs.push(psv);
    });
    
    // Calculate percentages
    const total = psvs.length;
    Object.keys(distribution).forEach(key => {
      distribution[key].percentage = (distribution[key].count / total) * 100;
    });
    
    return distribution;
  }, [psvs]);
  
  // Helper functions for risk determination
  function isHighRiskService(service?: string): boolean {
    if (!service) return false;
    const serviceLower = service.toLowerCase();
    return serviceLower.includes('gas') || 
           serviceLower.includes('high pressure') || 
           serviceLower.includes('toxic') ||
           serviceLower.includes('flammable');
  }
  
  function isLowRiskService(service?: string): boolean {
    if (!service) return false;
    const serviceLower = service.toLowerCase();
    return serviceLower.includes('water') || 
           serviceLower.includes('low pressure') || 
           serviceLower.includes('utility');
  }
  
  function isRecentlyCalibrated(date?: string): boolean {
    if (!date) return false;
    const lastCal = new Date(date);
    const now = new Date();
    // Calculate months between dates
    const monthsDiff = (now.getFullYear() - lastCal.getFullYear()) * 12 + 
                      (now.getMonth() - lastCal.getMonth());
    return monthsDiff < 24; // Less than 2 years
  }
  
  function isVeryRecentlyCalibrated(date?: string): boolean {
    if (!date) return false;
    const lastCal = new Date(date);
    const now = new Date();
    // Calculate months between dates
    const monthsDiff = (now.getFullYear() - lastCal.getFullYear()) * 12 + 
                      (now.getMonth() - lastCal.getMonth());
    return monthsDiff < 12; // Less than 1 year
  }

  return (
    <div className={cn("", className)}>
      <h3 className="text-lg font-semibold mb-4">Risk Level Distribution</h3>
      
      {/* Horizontal bar chart */}
      <div className="space-y-4">
        {Object.entries(RISK_LEVELS).map(([key, { label, color, textColor }]) => {
          const data = riskDistribution[key];
          const percentage = data?.percentage || 0;
          
          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className={cn("font-medium", textColor)}>{label}</span>
                <span className="text-gray-500">{data?.count || 0} PSVs ({Math.round(percentage)}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className={cn("h-2.5 rounded-full", color)} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary statistics */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <Card className="p-3">
          <div className="text-sm text-gray-500">Total PSVs</div>
          <div className="text-xl font-semibold mt-1">{psvs.length}</div>
        </Card>
        
        <Card className="p-3">
          <div className="text-sm text-gray-500">High Risk PSVs</div>
          <div className={cn("text-xl font-semibold mt-1", RISK_LEVELS.HIGH.textColor)}>
            {riskDistribution.HIGH.count} 
            <span className="text-sm text-gray-400 ml-1">
              ({Math.round(riskDistribution.HIGH.percentage)}%)
            </span>
          </div>
        </Card>
      </div>
      
      {/* Tips based on risk distribution */}
      {riskDistribution.HIGH.count > 0 && (
        <div className="mt-6 p-3 bg-red-50 border border-red-100 rounded-md">
          <h4 className="text-sm font-medium text-red-800">Risk Mitigation Recommendations</h4>
          <ul className="mt-2 text-xs text-red-700 list-disc list-inside space-y-1">
            <li>Schedule calibration for {riskDistribution.HIGH.count} high-risk PSVs</li>
            <li>Review service conditions for PSVs in high-risk category</li>
            <li>Consider implementing more frequent inspection intervals</li>
          </ul>
        </div>
      )}
    </div>
  );
}
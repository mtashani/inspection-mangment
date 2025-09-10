'use client';

import { useState, useEffect, useMemo } from 'react';
import { PSV, Calibration } from '@/components/psv/types';
import { fetchCalibrations } from '@/api/psv';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, subMonths, isAfter, isBefore, parseISO } from 'date-fns';

interface CalibrationData {
  date: Date;
  count: number;
  items: Calibration[];
}

interface CalibrationTimelineProps {
  psvs: PSV[];
  className?: string;
  months?: number; // Number of months to show in the timeline
}

export function CalibrationTimeline({ psvs, className, months = 12 }: CalibrationTimelineProps) {
  const [calibrations, setCalibrations] = useState<Calibration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch calibration data for all PSVs
  useEffect(() => {
    async function loadCalibrations() {
      if (!psvs || psvs.length === 0) {
        setCalibrations([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Fetch calibrations for up to 10 PSVs to avoid too many API calls
        // In a real implementation, this would be done with a single API call
        const limitedPsvs = psvs.slice(0, 10);
        const calibrationPromises = limitedPsvs.map(psv => 
          fetchCalibrations(psv.tag_number).catch(() => [])
        );
        
        const calibrationResults = await Promise.all(calibrationPromises);
        const allCalibrations = calibrationResults.flat();
        
        setCalibrations(allCalibrations);
      } catch (err) {
        console.error('Error loading calibration data:', err);
        setError('Failed to load calibration data');
      } finally {
        setLoading(false);
      }
    }
    
    loadCalibrations();
  }, [psvs]);

  // Process calibration data into timeline format
  const timelineData = useMemo(() => {
    if (calibrations.length === 0) {
      return [];
    }
    
    // Define date range (now to X months ago)
    const now = new Date();
    const startDate = subMonths(now, months);
    
    // Filter calibrations within the time range
    const filteredCalibrations = calibrations.filter(cal => {
      const calDate = parseISO(cal.calibration_date);
      return isAfter(calDate, startDate) && isBefore(calDate, now);
    });
    
    // Group calibrations by month
    const monthlyData: { [key: string]: CalibrationData } = {};
    
    // Initialize all months in the range
    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(now, i);
      const monthKey = format(monthDate, 'yyyy-MM');
      monthlyData[monthKey] = {
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        count: 0,
        items: []
      };
    }
    
    // Add calibrations to their respective months
    filteredCalibrations.forEach(cal => {
      const calDate = parseISO(cal.calibration_date);
      const monthKey = format(calDate, 'yyyy-MM');
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].count++;
        monthlyData[monthKey].items.push(cal);
      }
    });
    
    // Convert to array and sort by date
    return Object.values(monthlyData).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [calibrations, months]);

  // Find max count for scaling bars
  const maxCount = useMemo(() => {
    if (timelineData.length === 0) return 0;
    return Math.max(...timelineData.map(item => item.count));
  }, [timelineData]);
  
  if (loading) {
    return (
      <Card className={cn("p-4", className)}>
        <h3 className="text-lg font-semibold mb-4">Calibration Timeline</h3>
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={cn("p-4", className)}>
        <h3 className="text-lg font-semibold mb-4">Calibration Timeline</h3>
        <div className="flex justify-center items-center h-48 text-red-500">
          <p>{error}</p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className={cn("", className)}>
      <h3 className="text-lg font-semibold mb-4">Calibration Timeline</h3>
      
      {timelineData.length === 0 ? (
        <div className="flex justify-center items-center h-48 text-gray-400">
          <p>No calibration data available</p>
        </div>
      ) : (
        <div className="h-64 overflow-hidden">
          <div className="flex justify-between items-end h-52 space-x-1">
            {timelineData.map((data, index) => (
              <div 
                key={index} 
                className="flex-1 flex flex-col items-center group"
              >
                {/* Bar */}
                <div className="w-full flex justify-center mb-2">
                  <div 
                    className="w-5/6 bg-blue-500 hover:bg-blue-600 rounded-t transition-all duration-200"
                    style={{ 
                      height: `${maxCount > 0 ? (data.count / maxCount) * 100 : 0}%`,
                      minHeight: data.count > 0 ? '4px' : '0'
                    }}
                  ></div>
                </div>
                
                {/* Count */}
                <div className="text-xs font-medium">
                  {data.count}
                </div>
                
                {/* Month label */}
                <div className="text-xs text-gray-500">
                  {format(data.date, 'MMM')}
                </div>
                
                {/* Tooltip with details - only show on hover */}
                <div className="hidden group-hover:block absolute bottom-full mb-2 bg-white shadow-lg rounded p-2 text-xs z-10">
                  <p className="font-medium">{format(data.date, 'MMMM yyyy')}</p>
                  <p>{data.count} calibrations</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* X-axis line */}
          <div className="h-px bg-gray-200 w-full mt-2"></div>
        </div>
      )}
      
      {/* Summary statistics */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-sm text-gray-500">Last Month</div>
          <div className="text-lg font-medium">
            {timelineData[timelineData.length - 1]?.count || 0}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-lg font-medium">
            {timelineData.reduce((sum, item) => sum + item.count, 0)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-gray-500">Monthly Avg</div>
          <div className="text-lg font-medium">
            {timelineData.length > 0
              ? Math.round(timelineData.reduce((sum, item) => sum + item.count, 0) / timelineData.length * 10) / 10
              : 0}
          </div>
        </div>
      </div>
    </div>
  );
}
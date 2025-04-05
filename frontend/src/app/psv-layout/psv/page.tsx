'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { CircleDashed, AlertTriangle, AlertCircle, Clock, Ban } from "lucide-react";
import { PSVDataTable } from "@/components/psv/psv-data-table";
import { fetchPSVs } from "@/api/psv";
import { PSV, PSVSummary } from "@/components/psv/types";
import { cn } from "@/lib/utils";
import { ColumnFiltersState } from '@tanstack/react-table';

// Define filter type to avoid 'any'
interface PSVFilters {
  unit?: string[];
  type?: string[];
  train?: string[];
  tag_number?: string;
}

// Cache for API data to prevent repetitive calls
const dataCache = {
  psvs: null as PSV[] | null,
  filters: null as PSVFilters | null,
  timestamp: 0,
  expiryTime: 60000 // 1 minute cache
};

interface SummaryCardProps {
  title: string;
  main: number;
  spare: number;
  className?: string;
  textColorClass?: string;
  bgGradient?: string;
  icon: React.ComponentType<{ className?: string }>;
}

function SummaryCard({
  title,
  main,
  spare,
  className = "",
  textColorClass = "",
  bgGradient = "",
  icon: Icon
}: SummaryCardProps) {
  const total = main + spare;
  
  return (
    <Card className={cn(
      "backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300",
      "hover:-translate-y-1 relative overflow-hidden",
      bgGradient
    )}>
      {/* Background Gradient */}
      <div className="absolute inset-0 opacity-[0.08] mix-blend-multiply dark:mix-blend-soft-light">
        <div className={cn(
          "absolute inset-0 transform",
          "bg-gradient-to-br from-transparent via-black/5 to-black/10"
        )} />
      </div>

      {/* Content */}
      <div className="relative p-5 space-y-4">
        <div className="flex items-center space-x-4">
          <div className={cn(
            "p-3 rounded-xl shadow-lg",
            className
          )}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            {title}
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <p className={cn("text-3xl font-bold tracking-tight", textColorClass)}>
              {total}
            </p>
            <p className="text-xs font-medium text-muted-foreground/60">
              Total PSVs
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/50">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                Main
              </p>
              <p className={cn("text-sm font-semibold", textColorClass)}>
                {main}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                Spare
              </p>
              <p className={cn("text-sm font-semibold", textColorClass)}>
                {spare}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function PSVPage() {
  // Application state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [psvs, setPSVs] = useState<PSV[]>([]);
  
  // Direct filter state - we'll manage this explicitly for clarity
  const [filters, setFilters] = useState<PSVFilters>({});
  
  const [summary, setSummary] = useState<PSVSummary>({
    total: { main: 0, spare: 0 },
    underCalibration: { main: 0, spare: 0 },
    outOfCalibration: { main: 0, spare: 0 },
    dueNextMonth: { main: 0, spare: 0 },
    neverCalibrated: { main: 0, spare: 0 },
    rbiLevel: {
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0
    }
  });

  // Handle filters change from data table - with proper memo
  const handleFiltersChange = useCallback((tableFilters: ColumnFiltersState) => {
    // Extract filter values
    const newFilters: PSVFilters = {};
    
    // Debug all available filters
    console.log("PSV Page - All column filters:", JSON.stringify(tableFilters));
    
    tableFilters.forEach(filter => {
      const { id, value } = filter;
      console.log(`PSV Page - Processing filter: ${id} = ${JSON.stringify(value)}`);
      
      if (id === 'tag_number' && typeof value === 'string') {
        newFilters.tag_number = value;
      } 
      else if (id === 'unit' && Array.isArray(value)) {
        newFilters.unit = value;
        console.log(`PSV Page - Set unit filter:`, value);
      }
      else if (id === 'type' && Array.isArray(value)) {
        newFilters.type = value;
        console.log(`PSV Page - Set type filter:`, value);
      }
      else if (id === 'train' && Array.isArray(value)) {
        newFilters.train = value;
        console.log(`PSV Page - Set train filter:`, value);
      }
    });
    
    // Special case: if tableFilters is empty, reset all our filters
    if (tableFilters.length === 0) {
      setFilters({});
      return;
    }
    
    // Only update if filters have actually changed
    if (JSON.stringify(filters) !== JSON.stringify(newFilters)) {
      console.log("PSV Page - Setting new API filters:", newFilters);
      setFilters(newFilters);
    }
  }, [filters]);

  // Check if filters have changed significantly to warrant a new API call
  function filtersAreEqual(filtersA: PSVFilters | null, filtersB: PSVFilters | null): boolean {
    if (!filtersA || !filtersB) return false;
    
    const keysA = Object.keys(filtersA);
    const keysB = Object.keys(filtersB);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      const valA = filtersA[key as keyof PSVFilters];
      const valB = filtersB[key as keyof PSVFilters];
      
      if (Array.isArray(valA) && Array.isArray(valB)) {
        if (valA.length !== valB.length) return false;
        if (!valA.every((item, i) => item === valB[i])) return false;
      } else if (valA !== valB) {
        return false;
      }
    }
    
    return true;
  }

  // Load data when filters change - with cache awareness
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Check if we can use cached data
        const currentTime = Date.now();
        const cacheValid = 
          dataCache.psvs && 
          dataCache.timestamp > (currentTime - dataCache.expiryTime) && 
          filtersAreEqual(filters, dataCache.filters);
        
        // Clear cache if filters are empty (reset case)
        if (Object.keys(filters).length === 0) {
          dataCache.psvs = null;
          dataCache.filters = null;
          console.log("PSV Page - Filters reset, clearing cache");
        }
        
        if (cacheValid && dataCache.psvs) {
          console.log("Using cached PSV data");
          setPSVs(dataCache.psvs);
        } else {
          console.log("Fetching fresh PSV data with filters:", JSON.stringify(filters));
          const psvData = await fetchPSVs(filters);
          console.log(`Received ${psvData?.length || 0} PSVs from API`);
          setPSVs(psvData || []);
          
          // Update cache
          dataCache.psvs = psvData;
          dataCache.filters = {...filters};
          dataCache.timestamp = currentTime;
        }
      } catch (err) {
        console.error("Error loading PSV data:", err);
        setError(err instanceof Error ? err.message : 'Failed to load PSV data');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [filters]); // Remove psvs from dependency array to avoid circular updates

  // Separate useEffect for calculating summary data based on psvs
  useEffect(() => {
    if (psvs && psvs.length > 0) {
      const mainPSVs = psvs.filter(p => p.status === "Main");
      const sparePSVs = psvs.filter(p => p.status === "Spare");
      const currentDate = new Date();

      const calculatedSummary = {
        total: {
          main: mainPSVs.length,
          spare: sparePSVs.length
        },
        underCalibration: {
          main: 0,
          spare: 0
        },
        outOfCalibration: {
          main: mainPSVs.filter(p => p.expire_date && new Date(p.expire_date) < currentDate).length,
          spare: sparePSVs.filter(p => p.expire_date && new Date(p.expire_date) < currentDate).length
        },
        dueNextMonth: {
          main: mainPSVs.filter(p => {
            if (!p.expire_date) return false;
            const expireDate = new Date(p.expire_date);
            const oneMonthFromNow = new Date(currentDate);
            oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
            return expireDate <= oneMonthFromNow && expireDate >= currentDate;
          }).length,
          spare: sparePSVs.filter(p => {
            if (!p.expire_date) return false;
            const expireDate = new Date(p.expire_date);
            const oneMonthFromNow = new Date(currentDate);
            oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
            return expireDate <= oneMonthFromNow && expireDate >= currentDate;
          }).length
        },
        neverCalibrated: {
          main: mainPSVs.filter(p => !p.last_calibration_date).length,
          spare: sparePSVs.filter(p => !p.last_calibration_date).length
        },
        rbiLevel: {
          level1: 0,
          level2: 0,
          level3: 0,
          level4: 0
        }
      };

      setSummary(calculatedSummary);
    }
  }, [psvs]); // Only recalculate summary when psvs changes

  // Only show loading spinner on initial load, not during filter changes
  if (loading && psvs.length === 0) {
    return (
      <div className="container mx-auto py-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-center">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <SummaryCard
          title="Total PSVs"
          main={summary.total.main}
          spare={summary.total.spare}
          className="bg-primary"
          bgGradient="bg-gradient-to-br from-primary/2 via-primary/5 to-primary/10"
          textColorClass="text-primary dark:text-primary"
          icon={CircleDashed}
        />

        <SummaryCard
          title="Under Calibration"
          main={summary.underCalibration.main}
          spare={summary.underCalibration.spare}
          className="bg-blue-500"
          bgGradient="bg-gradient-to-br from-blue-500/2 via-blue-500/5 to-blue-500/10"
          textColorClass="text-blue-500 dark:text-blue-400"
          icon={AlertCircle}
        />

        <SummaryCard
          title="Out of Calibration"
          main={summary.outOfCalibration.main}
          spare={summary.outOfCalibration.spare}
          className="bg-red-500"
          bgGradient="bg-gradient-to-br from-red-500/2 via-red-500/5 to-red-500/10"
          textColorClass="text-red-500 dark:text-red-400"
          icon={AlertTriangle}
        />

        <SummaryCard
          title="Due Next Month"
          main={summary.dueNextMonth.main}
          spare={summary.dueNextMonth.spare}
          className="bg-yellow-500"
          bgGradient="bg-gradient-to-br from-yellow-500/2 via-yellow-500/5 to-yellow-500/10"
          textColorClass="text-yellow-500 dark:text-yellow-400"
          icon={Clock}
        />

        <SummaryCard
          title="Never Calibrated"
          main={summary.neverCalibrated.main}
          spare={summary.neverCalibrated.spare}
          className="bg-red-900"
          bgGradient="bg-gradient-to-br from-red-900/2 via-red-900/5 to-red-900/10"
          textColorClass="text-red-900 dark:text-red-700"
          icon={Ban}
        />
      </div>

      {/* Debug section to show active filters */}
      {Object.keys(filters).length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
          <h3 className="font-medium mb-2">Active Filters:</h3>
          <pre className="whitespace-pre-wrap overflow-auto max-h-24">
            {JSON.stringify(filters, null, 2)}
          </pre>
        </div>
      )}

      {/* Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">PSV List</h2>
            <p className="text-sm text-muted-foreground">
              A comprehensive list of all pressure safety valves
            </p>
          </div>
        </div>

        <Card className="p-0 overflow-hidden border-t border-border/50">
          <PSVDataTable 
            data={psvs} 
            onFiltersChange={handleFiltersChange} 
          />
        </Card>
      </div>
    </div>
  );
}
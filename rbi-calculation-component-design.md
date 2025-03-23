# RBI Calculation Component Design

## Overview

This document outlines the design for adding an RBI Calculation component to the PSV detail page. The component will display RBI calculation results including the months remaining until the next calibration.

## Component Structure

### RBI Calculation Component

```tsx
// frontend/src/components/psv/rbi-calculation.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { calculateRBI, getActiveRBIConfiguration } from "@/api/rbi";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, AlertCircle, Clock } from "lucide-react";
import { differenceInMonths, differenceInDays } from "date-fns";

interface RBICalculationProps {
  tagNumber: string;
}

export function RBICalculation({ tagNumber }: RBICalculationProps) {
  const [activeConfig, setActiveConfig] = useState<any>(null);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [monthsRemaining, setMonthsRemaining] = useState<number | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  // Load active RBI configuration
  useEffect(() => {
    async function loadActiveConfig() {
      try {
        setIsLoading(true);
        const config = await getActiveRBIConfiguration();
        setActiveConfig(config);
      } catch (err) {
        console.error("Error loading active RBI config:", err);
        setError("Failed to load active RBI configuration");
      } finally {
        setIsLoading(false);
      }
    }

    loadActiveConfig();
  }, []);

  // Calculate RBI with active config
  const handleCalculate = async () => {
    if (!activeConfig) return;
    
    try {
      setIsCalculating(true);
      setError(null);
      const result = await calculateRBI(tagNumber, activeConfig.level);
      setCalculationResult(result);
      
      // Calculate months remaining
      if (result.next_calibration_date) {
        const nextDate = new Date(result.next_calibration_date);
        const today = new Date();
        
        // Calculate months and remaining days
        const months = differenceInMonths(nextDate, today);
        const totalDays = differenceInDays(nextDate, today);
        const remainingDays = totalDays - (months * 30); // Approximate
        
        setMonthsRemaining(months);
        setDaysRemaining(remainingDays);
      }
    } catch (err) {
      console.error("Error calculating RBI:", err);
      setError("Error calculating RBI");
    } finally {
      setIsCalculating(false);
    }
  };

  // Style risk categories
  const getRiskCategoryStyle = (category?: string) => {
    if (!category) return "bg-gray-100 text-gray-800";
    
    switch(category.toLowerCase()) {
      case 'high':
        return "bg-red-100 text-red-800";
      case 'medium':
        return "bg-yellow-100 text-yellow-800";
      case 'low':
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Style remaining months
  const getRemainingMonthsStyle = (months: number | null) => {
    if (months === null || months === undefined) return "";
    
    if (months < 0) {
      return "text-red-600 font-bold"; // Negative - calibration overdue
    } else if (months < 3) {
      return "text-orange-600 font-bold"; // Less than 3 months
    } else if (months < 6) {
      return "text-yellow-600 font-bold"; // Less than 6 months
    } else {
      return "text-green-600 font-bold"; // More than 6 months
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>RBI Calculation</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info size={18} />
          RBI Calculation
        </CardTitle>
        <CardDescription>
          {activeConfig ? (
            `Active configuration: Level ${activeConfig.level} - ${activeConfig.name}`
          ) : (
            "No active RBI configuration found"
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {activeConfig && (
          <div className="flex justify-end">
            <Button 
              onClick={handleCalculate} 
              disabled={isCalculating}
            >
              {isCalculating ? 'Calculating...' : 'Calculate RBI'}
            </Button>
          </div>
        )}

        {calculationResult && (
          <div className="border rounded-md p-4 bg-slate-50">
            <h3 className="text-lg font-medium mb-4">RBI Calculation Results:</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Recommended Interval:</h4>
                <div className="text-xl font-bold">{calculationResult.recommended_interval} months</div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Next Calibration Date:</h4>
                <div className="text-xl font-bold">{new Date(calculationResult.next_calibration_date).toLocaleDateString()}</div>
              </div>
              
              {/* Add months remaining section */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Clock size={16} />
                  Time Remaining Until Next Calibration:
                </h4>
                <div className={`text-xl ${getRemainingMonthsStyle(monthsRemaining)}`}>
                  {monthsRemaining !== null ? (
                    monthsRemaining < 0 ? (
                      <span>{Math.abs(monthsRemaining)} months overdue</span>
                    ) : (
                      <span>
                        {monthsRemaining} month{monthsRemaining !== 1 ? 's' : ''} and {daysRemaining && daysRemaining > 0 ? daysRemaining : 0} day{daysRemaining !== 1 ? 's' : ''}
                      </span>
                    )
                  ) : (
                    "Not calculated"
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Risk Score:</h4>
                <div className="text-xl font-bold">{calculationResult.risk_score.toFixed(2)}</div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Risk Category:</h4>
                <div className={`text-xl font-bold px-3 py-1 rounded inline-block ${getRiskCategoryStyle(calculationResult.risk_category)}`}>
                  {calculationResult.risk_category}
                </div>
              </div>
            </div>
            
            {calculationResult.details && Object.keys(calculationResult.details).length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-2">Calculation Details:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  {Object.entries(calculationResult.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-medium">{typeof value === 'number' ? (value as number).toFixed(2) : value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!activeConfig && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded p-3">
            Please activate an RBI configuration in the PSV settings.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### API Functions

To support the RBI calculation component, add these functions to your API file:

```typescript
// frontend/src/api/rbi.ts

// Get active RBI configuration
export async function getActiveRBIConfiguration() {
  const response = await fetch(`${API_URL}/api/psv/rbi/config/active`);
  if (!response.ok) {
    throw new Error("Failed to fetch active RBI configuration");
  }
  const configs = await response.json();
  
  // If an array of configs is returned, find the first active one
  if (Array.isArray(configs)) {
    const activeConfig = configs.find(config => config.active);
    if (activeConfig) {
      return activeConfig;
    }
    throw new Error("No active RBI configuration found");
  }
  
  // If a single config is returned directly
  return configs;
}

// Calculate RBI for a PSV with specified level
export async function calculateRBI(tagNumber: string, level: number) {
  const encodedTag = encodeURIComponent(tagNumber);
  const response = await fetch(`${API_URL}/api/psv/rbi/${encodedTag}/calculate?level=${level}`, {
    method: "POST",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to calculate RBI for level ${level}`);
  }

  return response.json();
}
```

### Adding to PSV Detail Page

To add the RBI Calculation component to the PSV detail page:

```tsx
// frontend/src/app/psv-layout/psv/[tag]/page.tsx

// Add import
import { RBICalculation } from "@/components/psv/rbi-calculation";

// In the render section of your component
return (
  <div className="space-y-6">
    {/* Other existing components */}
    <PSVDetails psv={psvData} />
    <CalibrationHistory tagNumber={params.tag} />
    
    {/* Add RBI Calculation component */}
    <RBICalculation tagNumber={params.tag} />
  </div>
);
```

## Required NPM Package

For date calculations, ensure you have `date-fns` installed:

```bash
npm install date-fns
```

## Interfaces

Add these interfaces to your types file:

```typescript
// frontend/src/components/psv/types.ts

export interface RBICalculationResult {
  tag_number: string;
  recommended_interval: number;
  risk_score: number;
  next_calibration_date: string;
  risk_category: string;
  details?: Record<string, number>;
}

export interface RBIConfiguration {
  id: number;
  level: number;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  settings: {
    fixed_interval?: number;
    pop_test_thresholds?: {
      min: number;
      max: number;
    };
    leak_test_thresholds?: {
      min: number;
      max: number;
    };
    parameter_weights?: Record<string, number>;
    risk_matrix?: Record<string, number[]>;
    service_risk_categories?: Record<string, number>;
  };
}
```

## Visual Features

The component includes these visual features:

1. **Card Layout**: Clean card layout with header and content sections
2. **Loading State**: Skeleton loader while data is loading
3. **Error Handling**: Red alert box for error messages
4. **Color-coded Risk Categories**:
   - High: Red background
   - Medium: Yellow background
   - Low: Green background
5. **Color-coded Remaining Time**:
   - Overdue: Red text
   - < 3 months: Orange text
   - < 6 months: Yellow text
   - > 6 months: Green text
6. **Responsive Layout**: Grid layout for different screen sizes
7. **Calculation Details**: Optional expanded view of calculation details
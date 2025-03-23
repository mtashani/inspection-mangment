'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { calculateRBI, getActiveRBIConfiguration } from "@/api/rbi";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, AlertCircle, Clock } from "lucide-react";
import { differenceInMonths, differenceInDays } from "date-fns";
import { RBIConfiguration, RBICalculationResult } from "@/components/psv/types";

interface RBICalculationProps {
  tagNumber: string;
}

export function RBICalculation({ tagNumber }: RBICalculationProps) {
  const [activeConfig, setActiveConfig] = useState<RBIConfiguration | null>(null);
  const [calculationResult, setCalculationResult] = useState<RBICalculationResult | null>(null);
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
        setError(null);
        const config = await getActiveRBIConfiguration();
        setActiveConfig(config);
        
        if (!config) {
          setError("No active RBI configuration is available. Please configure one in the PSV Settings.");
        }
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
      if (result?.next_calibration_date) {
        try {
          const nextDate = new Date(result.next_calibration_date);
          const today = new Date();
          
          if (!isNaN(nextDate.getTime())) {
            // Calculate months and remaining days
            const months = differenceInMonths(nextDate, today);
            const totalDays = differenceInDays(nextDate, today);
            const remainingDays = totalDays - (months * 30); // Approximate
            
            setMonthsRemaining(months);
            setDaysRemaining(remainingDays);
          } else {
            console.error("Invalid date format:", result.next_calibration_date);
            setMonthsRemaining(null);
            setDaysRemaining(null);
          }
        } catch (err) {
          console.error("Error calculating date difference:", err);
          setMonthsRemaining(null);
          setDaysRemaining(null);
        }
      } else {
        setMonthsRemaining(null);
        setDaysRemaining(null);
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">RBI Calculation Results:</h3>
              <div className="text-xs bg-blue-50 border border-blue-200 text-blue-600 px-2 py-1 rounded">
                Development Preview
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Recommended Interval:</h4>
                <div className="text-xl font-bold">
                  {calculationResult.recommended_interval != null
                    ? `${calculationResult.recommended_interval} months`
                    : "N/A"}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Next Calibration Date:</h4>
                <div className="text-xl font-bold">
                  {calculationResult.next_calibration_date
                    ? new Date(calculationResult.next_calibration_date).toLocaleDateString()
                    : "N/A"}
                </div>
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
                        {monthsRemaining} month{monthsRemaining !== 1 ? 's' : ''} and {daysRemaining !== null && daysRemaining > 0 ? daysRemaining : 0} day{(daysRemaining === null || daysRemaining === 1) ? '' : 's'}
                      </span>
                    )
                  ) : (
                    "Not calculated"
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Risk Score:</h4>
                <div className="text-xl font-bold">{calculationResult.risk_score?.toFixed(2) || "N/A"}</div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Risk Category:</h4>
                <div className={`text-xl font-bold px-3 py-1 rounded inline-block ${getRiskCategoryStyle(calculationResult.risk_category)}`}>
                  {calculationResult.risk_category || "Unknown"}
                </div>
              </div>
            </div>
            
            {calculationResult.details && typeof calculationResult.details === 'object' && Object.keys(calculationResult.details).length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-2">Calculation Details:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  {Object.entries(calculationResult.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-medium">
                        {value !== null && value !== undefined
                          ? typeof value === 'number'
                            ? Number(value).toFixed(2)
                            : String(value)
                          : "N/A"}
                      </span>
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
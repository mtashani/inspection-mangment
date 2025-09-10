"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DollarSign, Calculator, FileText, TrendingUp } from "lucide-react";

interface InspectorPayrollPageProps {
  params: {
    id: string;
  };
}

export default function InspectorPayrollPage({ params }: InspectorPayrollPageProps) {
  const [payrollData, setPayrollData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    // This will call the new inspector-centric payroll API
    // /api/v1/inspectors/payroll/{inspector_id}
    const fetchPayrollData = async () => {
      try {
        const response = await fetch(`/api/v1/inspectors/payroll/${params.id}?jalali_year=${selectedYear}&jalali_month=${selectedMonth}`);
        const data = await response.json();
        setPayrollData(data);
      } catch (error) {
        console.error("Failed to fetch payroll data:", error);
      }
    };

    fetchPayrollData();
  }, [params.id, selectedMonth, selectedYear]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inspector Payroll</h1>
          <p className="text-muted-foreground">
            Payroll management for Inspector #{params.id}
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Payroll
          </Button>
        </div>
      </div>

      {/* Payroll Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <DollarSign className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="details">
            <FileText className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="history">
            <TrendingUp className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="items">
            <Calculator className="h-4 w-4 mr-2" />
            Items
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Gross Salary
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$4,250</div>
                <p className="text-xs text-muted-foreground">
                  Base + overtime
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Overtime Pay
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$325</div>
                <p className="text-xs text-muted-foreground">
                  12.5 hours overtime
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Deductions
                </CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$580</div>
                <p className="text-xs text-muted-foreground">
                  Tax + insurance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Net Pay
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$3,995</div>
                <p className="text-xs text-muted-foreground">
                  Final amount
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payroll Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Payroll Summary</CardTitle>
              <CardDescription>
                Breakdown of payroll components for the selected month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-muted-foreground">
                Payroll summary data from /inspectors/payroll API
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Details</CardTitle>
              <CardDescription>
                Detailed breakdown of payroll calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-muted-foreground">
                Detailed payroll calculations will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll History</CardTitle>
              <CardDescription>
                Historical payroll records for this inspector
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-muted-foreground">
                Payroll history from /inspectors/payroll/{params.id} API
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Items</CardTitle>
              <CardDescription>
                Individual payroll items and adjustments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-muted-foreground">
                Payroll items management interface
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
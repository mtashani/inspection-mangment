'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CircleDashed, AlertTriangle, AlertCircle, Clock, Ban } from "lucide-react";
import { PSVDataTable } from "@/components/psv/psv-data-table";
// TODO: Re-implement using backend summary endpoint when available
import { fetchPSVs } from "@/api/psv";
import { PSV, PSVSummary } from "@/components/psv/types";
import { cn } from "@/lib/utils";

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
  const [showColorCoding, setShowColorCoding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [psvs, setPSVs] = useState<PSV[]>([]);
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

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const psvData = await fetchPSVs();
        setPSVs(psvData);
        
        // Calculate summary from PSV data
        const mainPSVs = psvData.filter(p => p.status === "Main");
        const sparePSVs = psvData.filter(p => p.status === "Spare");
        const now = new Date();

        const calculatedSummary = {
          total: {
            main: mainPSVs.length,
            spare: sparePSVs.length
          },
          underCalibration: {
            main: 0, // TODO: Implement when backend provides this info
            spare: 0
          },
          outOfCalibration: {
            main: mainPSVs.filter(p => new Date(p.expire_date) < now).length,
            spare: sparePSVs.filter(p => new Date(p.expire_date) < now).length
          },
          dueNextMonth: {
            main: mainPSVs.filter(p => {
              const expireDate = new Date(p.expire_date);
              const oneMonthFromNow = new Date(now);
              oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
              return expireDate <= oneMonthFromNow && expireDate > now;
            }).length,
            spare: sparePSVs.filter(p => {
              const expireDate = new Date(p.expire_date);
              const oneMonthFromNow = new Date(now);
              oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
              return expireDate <= oneMonthFromNow && expireDate > now;
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PSV data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
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
    <div className="container mx-auto py-10">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">PSV Management</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage pressure safety valve calibrations
          </p>
        </div>

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

        {/* Table Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">PSV List</h2>
              <p className="text-sm text-muted-foreground">
                A comprehensive list of all pressure safety valves
              </p>
            </div>
            <Button 
              variant={showColorCoding ? "default" : "outline"}
              onClick={() => setShowColorCoding(!showColorCoding)}
              size="sm"
            >
              {showColorCoding ? "Hide Color Coding" : "Show Color Coding"}
            </Button>
          </div>

          <Card className="p-0 overflow-hidden border-t border-border/50">
            <PSVDataTable data={psvs} showColorCoding={showColorCoding} />
          </Card>
        </div>
      </div>
    </div>
  );
}
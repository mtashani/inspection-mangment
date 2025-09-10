"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, Calendar, Settings, Play } from "lucide-react";

interface InspectorWorkCyclePageProps {
  params: {
    id: string;
  };
}

export default function InspectorWorkCyclePage({ params }: InspectorWorkCyclePageProps) {
  const [workCycles, setWorkCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);

  useEffect(() => {
    // This will call the new inspector-centric work cycle API
    // /api/v1/inspectors/work-cycles/{inspector_id}
    const fetchWorkCycles = async () => {
      try {
        const response = await fetch(`/api/v1/inspectors/work-cycles/${params.id}`);
        const data = await response.json();
        setWorkCycles(data);
      } catch (error) {
        console.error("Failed to fetch work cycles:", error);
      }
    };

    fetchWorkCycles();
  }, [params.id]);

  const handleGenerateAttendance = async (cycleId: number) => {
    try {
      const response = await fetch(`/api/v1/inspectors/work-cycles/${cycleId}/generate-attendance?jalali_year=1403&jalali_month=7`, {
        method: "POST",
      });
      const result = await response.json();
      console.log("Generated attendance:", result);
    } catch (error) {
      console.error("Failed to generate attendance:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Cycle Management</h1>
          <p className="text-muted-foreground">
            Manage work cycles for Inspector #{params.id}
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Create Cycle
          </Button>
        </div>
      </div>

      {/* Work Cycle Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <RotateCcw className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="current">
            <Calendar className="h-4 w-4 mr-2" />
            Current Cycle
          </TabsTrigger>
          <TabsTrigger value="history">
            <Calendar className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="generate">
            <Play className="h-4 w-4 mr-2" />
            Generate
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Cycles
                </CardTitle>
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">
                  Currently running
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Cycle Length
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">14</div>
                <p className="text-xs text-muted-foreground">
                  Days average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Working Days
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">10</div>
                <p className="text-xs text-muted-foreground">
                  Per cycle
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Rest Days
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">
                  Per cycle
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Work Cycles List */}
          <Card>
            <CardHeader>
              <CardTitle>Work Cycles Overview</CardTitle>
              <CardDescription>
                All work cycles for this inspector
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-muted-foreground">
                Work cycles data from /inspectors/work-cycles API
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Current Cycle Tab */}
        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Work Cycle</CardTitle>
              <CardDescription>
                Details of the currently active work cycle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-muted-foreground">
                Current work cycle details will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Work Cycle History</CardTitle>
              <CardDescription>
                Historical work cycles for this inspector
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-muted-foreground">
                Work cycle history from /inspectors/work-cycles/{params.id} API
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Attendance</CardTitle>
              <CardDescription>
                Generate attendance records from work cycles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Select Work Cycle</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose work cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cycle1">Cycle 1 (2-week rotation)</SelectItem>
                      <SelectItem value="cycle2">Cycle 2 (3-week rotation)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Target Month</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1403-07">Mehr 1403</SelectItem>
                      <SelectItem value="1403-08">Aban 1403</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button className="w-full" onClick={() => handleGenerateAttendance(1)}>
                <Play className="h-4 w-4 mr-2" />
                Generate Attendance Records
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
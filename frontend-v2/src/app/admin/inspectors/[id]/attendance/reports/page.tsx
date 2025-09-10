"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, Calendar, Filter, Settings } from "lucide-react";

interface InspectorAttendanceReportsPageProps {
  params: {
    id: string;
  };
}

export default function InspectorAttendanceReportsPage({ params }: InspectorAttendanceReportsPageProps) {
  const [reportType, setReportType] = useState("summary");
  const [exportFormat, setExportFormat] = useState("excel");
  const [availableReports, setAvailableReports] = useState([]);

  useEffect(() => {
    // This will call the new inspector-centric reports API
    // /api/v1/inspectors/attendance/reports
    const fetchAvailableReports = async () => {
      try {
        const response = await fetch(`/api/v1/inspectors/attendance/reports`);
        const data = await response.json();
        setAvailableReports(data);
      } catch (error) {
        console.error("Failed to fetch available reports:", error);
      }
    };

    fetchAvailableReports();
  }, [params.id]);

  const handleGenerateReport = async () => {
    try {
      // Call the new inspector-centric report generation API
      const response = await fetch(`/api/v1/inspectors/attendance/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inspector_id: params.id,
          report_type: reportType,
          include_details: true,
        }),
      });
      
      const reportData = await response.json();
      console.log("Generated report:", reportData);
    } catch (error) {
      console.error("Failed to generate report:", error);
    }
  };

  const handleExportReport = async () => {
    try {
      // Call the new inspector-centric export API
      const response = await fetch(`/api/v1/inspectors/attendance/reports/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: exportFormat,
          filters: {
            inspector_id: params.id,
            report_type: reportType,
          },
        }),
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `inspector_${params.id}_attendance_report.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export report:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Reports</h1>
          <p className="text-muted-foreground">
            Generate and export attendance reports for Inspector #{params.id}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">
            <FileText className="h-4 w-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Calendar className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Filter className="h-4 w-4 mr-2" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="history">
            <Download className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Report Configuration</CardTitle>
                <CardDescription>
                  Configure your attendance report parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Attendance Summary</SelectItem>
                      <SelectItem value="detailed">Detailed Records</SelectItem>
                      <SelectItem value="analytics">Analytics Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="exportFormat">Export Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                      <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                      <SelectItem value="json">JSON (.json)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input type="date" id="startDate" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input type="date" id="endDate" />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleGenerateReport} className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button onClick={handleExportReport} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Report Preview</CardTitle>
                <CardDescription>
                  Preview of the generated report
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  Report preview will appear here after generation
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>
                Pre-configured report templates for common use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Monthly Summary</CardTitle>
                    <CardDescription>
                      Summary of inspector attendance for a specific month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" size="sm">
                      Use Template
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Detailed Records</CardTitle>
                    <CardDescription>
                      Day-by-day attendance records with full details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" size="sm">
                      Use Template
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Performance Analysis</CardTitle>
                    <CardDescription>
                      Comprehensive performance and analytics report
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" size="sm">
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Tab */}
        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>
                Manage recurring attendance reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-muted-foreground">
                Scheduled reports data from /inspectors/attendance/reports/scheduled
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>
                Previously generated reports for this inspector
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-muted-foreground">
                Report history will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
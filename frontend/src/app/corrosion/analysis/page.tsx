'use client';

import { useState, useEffect } from "react";
import { fetchAnalysisReports } from "@/api/corrosion-analysis";
import { CorrosionAnalysisReport } from "@/components/corrosion/types";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AnalysisListPage() {
  const [analyses, setAnalyses] = useState<CorrosionAnalysisReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  useEffect(() => {
    async function loadAnalyses() {
      try {
        setLoading(true);
        const data = await fetchAnalysisReports();
        setAnalyses(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load analysis reports:", err);
        setError("Failed to load analysis reports. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    loadAnalyses();
  }, []);

  // Filter analyses based on severity and search term
  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSeverity = severityFilter === "all" || 
      analysis.calculated_severity.toString() === severityFilter;
    const matchesSearch = 
      searchTerm === "" || 
      analysis.coupon_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (analysis.coupon?.material_type || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSeverity && matchesSearch;
  });

  // Function to get severity badge style
  const getSeverityBadge = (severity: number) => {
    switch (severity) {
      case 1:
        return <Badge variant="outline" className="bg-green-100 text-green-800">Level 1</Badge>;
      case 2:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Level 2</Badge>;
      case 3:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Level 3</Badge>;
      case 4:
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">Level 4</Badge>;
      case 5:
        return <Badge variant="outline" className="bg-red-100 text-red-800">Level 5</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Corrosion Analysis Reports</h1>
        <Button asChild>
          <Link href="/corrosion/analysis/new">
            <Plus className="mr-2 h-4 w-4" />
            New Analysis
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filter Reports</CardTitle>
          <CardDescription>Filter by severity or search for specific analyses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/3">
              <label className="text-sm font-medium mb-1 block">Severity Level</label>
              <Select 
                value={severityFilter}
                onValueChange={setSeverityFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="1">Level 1 (Minimal)</SelectItem>
                  <SelectItem value="2">Level 2 (Low)</SelectItem>
                  <SelectItem value="3">Level 3 (Moderate)</SelectItem>
                  <SelectItem value="4">Level 4 (High)</SelectItem>
                  <SelectItem value="5">Level 5 (Severe)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-2/3">
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by coupon ID or material..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading analysis reports...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Analysis Date</TableHead>
                    <TableHead>Coupon ID</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Corrosion Rate</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnalyses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No analysis reports found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAnalyses.map((analysis) => (
                      <TableRow key={analysis.report_id}>
                        <TableCell>
                          {new Date(analysis.analysis_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{analysis.coupon_id}</TableCell>
                        <TableCell>{analysis.coupon?.material_type || "N/A"}</TableCell>
                        <TableCell>{analysis.corrosion_rate.toFixed(4)} mm/year</TableCell>
                        <TableCell>{analysis.corrosion_type}</TableCell>
                        <TableCell>{getSeverityBadge(analysis.calculated_severity)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/corrosion/analysis/${analysis.report_id}`}>
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
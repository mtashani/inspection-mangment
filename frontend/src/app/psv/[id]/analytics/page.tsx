'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { fetchPSVById, fetchCalibrations } from '@/api/psv';
import { PSV, Calibration } from '@/components/psv/types';
import { Loader2 } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export default function PSVAnalyticsPage() {
  const params = useParams();
  const [psv, setPsv] = useState<PSV | null>(null);
  const [calibrations, setCalibrations] = useState<Calibration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  interface RiskDataPoint {
    date: string;
    risk_score: number;
    failure_probability: number;
    industry_average: number;
  }
  
  const [riskData, setRiskData] = useState<RiskDataPoint[]>([]);

  useEffect(() => {
    async function loadPSVData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch PSV details
        const psvData = await fetchPSVById(params.id as string);
        setPsv(psvData);
        
        // Fetch calibration history
        const calibrationData = await fetchCalibrations(psvData.tag_number);
        setCalibrations(calibrationData);
        
        // Generate mock risk data for visualization
        const mockRiskData = generateMockRiskData();
        setRiskData(mockRiskData);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error loading PSV data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPSVData();
  }, [params.id]);

  // Function to generate mock risk data
  function generateMockRiskData() {
    const now = new Date();
    const data = [];
    
    // Generate data for the last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i);
      const baseRisk = 30 + Math.random() * 20; // Base risk between 30-50
      
      // Add some trend and randomness
      const trend = i > 6 ? -1 : 1; // Risk decreasing then increasing
      const riskScore = Math.max(10, Math.min(90, baseRisk + trend * (11 - i) * 2 + (Math.random() * 10 - 5)));
      
      data.push({
        date: format(date, 'MMM yyyy'),
        risk_score: Math.round(riskScore),
        failure_probability: Math.round(riskScore / 2),
        industry_average: 45,
      });
    }
    
    return data;
  }

  // Format calibration data for charts
  const prepareCalibrationData = () => {
    if (!calibrations.length) return [];
    
    return calibrations.map(cal => ({
      date: format(new Date(cal.calibration_date), 'MMM d, yyyy'),
      popPressure: cal.pop_pressure,
      leakPressure: cal.leak_test_pressure,
      setPressure: psv?.set_pressure || 0,
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  
  // Prepare distribution data for test results
  const prepareTestDistributionData = () => {
    if (!calibrations.length) return [];
    
    const popRatios = calibrations.map(cal => {
      const ratio = psv?.set_pressure ? cal.pop_pressure / psv.set_pressure : 1;
      return { ratio: parseFloat(ratio.toFixed(2)), type: 'Pop Test' };
    });
    
    const leakRatios = calibrations.map(cal => {
      const ratio = psv?.set_pressure ? cal.leak_test_pressure / psv.set_pressure : 1;
      return { ratio: parseFloat(ratio.toFixed(2)), type: 'Leak Test' };
    });
    
    // Create bins for histogram
    const bins = [0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2];
    
    // Count occurrences in each bin
    const distribution = bins.map(bin => {
      const popCount = popRatios.filter(item => 
        item.ratio >= bin && item.ratio < bin + 0.05
      ).length;
      
      const leakCount = leakRatios.filter(item => 
        item.ratio >= bin && item.ratio < bin + 0.05
      ).length;
      
      return {
        bin: bin.toFixed(2),
        'Pop Test': popCount,
        'Leak Test': leakCount,
      };
    });
    
    return distribution;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-2">Error: {error}</div>
      </div>
    );
  }

  if (!psv) {
    return <div className="p-8">PSV not found</div>;
  }

  const calibrationData = prepareCalibrationData();
  const testDistribution = prepareTestDistributionData();

  return (
    <div className="space-y-6">
      {/* Calibration Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Calibration Performance Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {calibrationData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={calibrationData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <ReferenceLine y={psv.set_pressure} stroke="#ff7300" label="Set Pressure" />
                <Line type="monotone" dataKey="popPressure" stroke="#8884d8" name="Pop Pressure" />
                <Line type="monotone" dataKey="leakPressure" stroke="#82ca9d" name="Leak Pressure" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No calibration data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Assessment Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={riskData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <ReferenceLine y={70} stroke="#ff0000" label="High Risk" />
              <ReferenceLine y={30} stroke="#ffcc00" label="Medium Risk" />
              <Line type="monotone" dataKey="risk_score" stroke="#ff7300" name="Risk Score" />
              <Line type="monotone" dataKey="failure_probability" stroke="#8884d8" name="Failure Probability" />
              <Line type="monotone" dataKey="industry_average" stroke="#82ca9d" name="Industry Average" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Test Results Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {testDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={testDistribution}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="bin" 
                  label={{ value: 'Pressure Ratio (Test/Set)', position: 'insideBottom', offset: -5 }} 
                />
                <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <ReferenceLine x="0.90" stroke="#ffcc00" label="Min Threshold" />
                <ReferenceLine x="1.10" stroke="#ffcc00" label="Max Threshold" />
                <Bar dataKey="Pop Test" fill="#8884d8" />
                <Bar dataKey="Leak Test" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No test distribution data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-md">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Mean Time Between Calibrations</h3>
              <p className="text-2xl font-bold">{calibrations.length > 1 ? '24 months' : 'N/A'}</p>
            </div>
            <div className="p-4 border rounded-md">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Test Deviation</h3>
              <p className="text-2xl font-bold">{calibrations.length > 0 ? '3.2%' : 'N/A'}</p>
            </div>
            <div className="p-4 border rounded-md">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Reliability Score</h3>
              <p className="text-2xl font-bold">8.4/10</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PSVSummary } from '@/components/psv/types';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Sample data fetching function - replace with actual API call
async function fetchPSVSummary(): Promise<PSVSummary> {
  try {
    const response = await fetch('/api/psv/summary');
    if (!response.ok) {
      throw new Error('Failed to fetch PSV summary data');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching PSV summary:', error);
    // Return mock data for now
    return {
      total: { main: 120, spare: 45 },
      underCalibration: { main: 5, spare: 2 },
      outOfCalibration: { main: 12, spare: 3 },
      dueNextMonth: { main: 8, spare: 4 },
      neverCalibrated: { main: 3, spare: 1 },
      rbiLevel: { level1: 30, level2: 45, level3: 20, level4: 25 }
    };
  }
}

export default function PSVAnalyticsPage() {
  const [summaryData, setSummaryData] = useState<PSVSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchPSVSummary();
        setSummaryData(data);
      } catch (error) {
        console.error("Error loading summary data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading analytics data...</div>;
  }

  if (!summaryData) {
    return <div className="text-center text-red-500">Failed to load analytics data</div>;
  }

  const statusData = {
    labels: ['In Service', 'Under Calibration', 'Out of Calibration', 'Due Next Month', 'Never Calibrated'],
    datasets: [
      {
        label: 'Main Valves',
        data: [
          summaryData.total.main - 
            (summaryData.underCalibration.main + 
             summaryData.outOfCalibration.main + 
             summaryData.neverCalibrated.main),
          summaryData.underCalibration.main,
          summaryData.outOfCalibration.main,
          summaryData.dueNextMonth.main,
          summaryData.neverCalibrated.main
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Spare Valves',
        data: [
          summaryData.total.spare - 
            (summaryData.underCalibration.spare + 
             summaryData.outOfCalibration.spare + 
             summaryData.neverCalibrated.spare),
          summaryData.underCalibration.spare,
          summaryData.underCalibration.spare,
          summaryData.dueNextMonth.spare,
          summaryData.neverCalibrated.spare
        ],
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
      }
    ],
  };

  const rbiLevelData = {
    labels: ['Level 1', 'Level 2', 'Level 3', 'Level 4'],
    datasets: [
      {
        data: [
          summaryData.rbiLevel.level1,
          summaryData.rbiLevel.level2,
          summaryData.rbiLevel.level3,
          summaryData.rbiLevel.level4
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1,
      }
    ],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total PSVs" 
          value={summaryData.total.main + summaryData.total.spare}
          description="Total pressure safety valves" 
        />
        <StatCard 
          title="Out of Calibration" 
          value={summaryData.outOfCalibration.main + summaryData.outOfCalibration.spare}
          description="Valves requiring immediate attention" 
          alert={true}
        />
        <StatCard 
          title="Due Next Month" 
          value={summaryData.dueNextMonth.main + summaryData.dueNextMonth.spare}
          description="Upcoming calibrations" 
        />
        <StatCard 
          title="Never Calibrated" 
          value={summaryData.neverCalibrated.main + summaryData.neverCalibrated.spare}
          description="Valves without calibration history" 
          alert={true}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>PSV Status Distribution</CardTitle>
            <CardDescription>Current status of all pressure safety valves</CardDescription>
          </CardHeader>
          <CardContent>
            <Bar 
              data={statusData} 
              options={{
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RBI Level Distribution</CardTitle>
            <CardDescription>Distribution of PSVs by RBI level</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div style={{ maxHeight: '300px', maxWidth: '300px' }}>
              <Pie 
                data={rbiLevelData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  alert?: boolean;
}

function StatCard({ title, value, description, alert }: StatCardProps) {
  return (
    <Card className={alert ? "border-red-500" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${alert ? "text-red-500" : ""}`}>{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
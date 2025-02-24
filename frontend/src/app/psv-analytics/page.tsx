'use client';

import { Card } from "@/components/ui/card";
import { mockAnalytics } from "@/components/psv/mock-data";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line 
} from 'recharts';

export default function PSVAnalyticsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">PSV Analytics</h2>
          <p className="text-muted-foreground">
            Monthly calibration statistics and tracking
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Bar Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Calibration Status</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mockAnalytics}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-sm" />
                <YAxis className="text-sm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                <Bar 
                  dataKey="totalDue" 
                  name="Total Due" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="calibrated" 
                  name="Calibrated" 
                  fill="hsl(var(--success))" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="remaining" 
                  name="Remaining" 
                  fill="hsl(var(--warning))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Line Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Calibration Trends</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={mockAnalytics}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-sm" />
                <YAxis className="text-sm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="neverCalibrated" 
                  name="Never Calibrated"
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="calibrated" 
                  name="Calibrated"
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-muted">
                  <div className="text-2xl font-bold">
                    {mockAnalytics.reduce((sum, curr) => sum + curr.totalDue, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total PSVs</div>
                </Card>
                <Card className="p-4 bg-muted">
                  <div className="text-2xl font-bold text-destructive">
                    {mockAnalytics[0].neverCalibrated}
                  </div>
                  <div className="text-sm text-muted-foreground">Never Calibrated</div>
                </Card>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-primary mr-2"></span>
                  Most calibrations scheduled for {mockAnalytics[0].month}
                </li>
                <li className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-success mr-2"></span>
                  Highest completion rate in {
                    mockAnalytics.reduce((prev, curr) => 
                      (curr.calibrated / curr.totalDue > prev.calibrated / prev.totalDue) ? curr : prev
                    ).month
                  }
                </li>
                <li className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-destructive mr-2"></span>
                  {mockAnalytics.reduce((sum, curr) => sum + curr.neverCalibrated, 0)} PSVs need immediate attention
                </li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Priority Actions</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-destructive mr-2"></span>
                    Focus on reducing never calibrated PSVs
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-warning mr-2"></span>
                    Plan resources for peak months
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-success mr-2"></span>
                    Monitor completion rates closely
                  </li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Long-term Strategy</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Implement preventive maintenance schedule</li>
                  <li>• Regular staff training and certification</li>
                  <li>• Optimize resource allocation</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
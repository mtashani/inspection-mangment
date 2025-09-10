import React from 'react'
import type { Meta, StoryObj } from '@storybook/react';
import { 
  AccessibilitySettings,
  QuickAccessibilityToggle 
} from '../components/ui/accessibility-preferences';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { useState } from 'react';

const meta: Meta = {
  title: 'Style Guide/Complete Examples',
  parameters: {
    docs: {
      description: {
        component: 'Complete examples showcasing the full component library in realistic scenarios.',
      },
    },
  },
};

export default meta;

// Dashboard Example
export const DashboardExample: StoryObj = {
  render: () => {
    return (
      <div className="min-h-screen bg-[var(--background)] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">
                Inspection Dashboard
              </h1>
              <p className="text-[var(--muted-foreground)] mt-1">
                Monitor and manage your inspection activities
              </p>
            </div>
            <QuickAccessibilityToggle />
          </div>

          {/* Dashboard Cards using shadcn components */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Inspections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">1,234</div>
                <p className="text-sm text-muted-foreground mt-1">
                  +6.7% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Pending Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-500">56</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Completed Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">23</div>
                <p className="text-sm text-muted-foreground mt-1">
                  On schedule
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">PSV-001 Calibration</p>
                  <p className="text-sm text-muted-foreground">Pressure Safety Valve</p>
                </div>
                <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs">
                  Completed
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">PSV-002 Inspection</p>
                  <p className="text-sm text-muted-foreground">Pressure Safety Valve</p>
                </div>
                <span className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs">
                  In Progress
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">PSV-003 Maintenance</p>
                  <p className="text-sm text-muted-foreground">Pressure Safety Valve</p>
                </div>
                <span className="px-2 py-1 bg-gray-500 text-white rounded-full text-xs">
                  Scheduled
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'fullscreen',
  },
};

// Form Example
export const FormExample: StoryObj = {
  render: () => {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            New Inspection Report
          </h1>
          <p className="text-muted-foreground mt-1">
            Create a new inspection report with our step-by-step wizard
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Equipment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="equipment-id">Equipment ID *</Label>
                <Input
                  id="equipment-id"
                  placeholder="Enter equipment ID"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="equipment-type">Equipment Type *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="psv">Pressure Safety Valve</SelectItem>
                    <SelectItem value="tank">Storage Tank</SelectItem>
                    <SelectItem value="pipe">Pipeline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter equipment description"
                  rows={4}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline">
                Cancel
              </Button>
              <Button>
                Save Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  },
  parameters: {
    layout: 'fullscreen',
  },
};

// Data Table Example
export const DataTableExample: StoryObj = {
  render: () => {
    const sampleData = [
      { id: 1, equipment: 'PSV-001', type: 'Pressure Safety Valve', status: 'Active', inspector: 'John Doe' },
      { id: 2, equipment: 'PSV-002', type: 'Storage Tank', status: 'Maintenance', inspector: 'Jane Smith' },
      { id: 3, equipment: 'PSV-003', type: 'Pipeline', status: 'Inactive', inspector: 'Mike Johnson' },
      { id: 4, equipment: 'PSV-004', type: 'Pressure Safety Valve', status: 'Active', inspector: 'Sarah Wilson' },
      { id: 5, equipment: 'PSV-005', type: 'Storage Tank', status: 'Active', inspector: 'John Doe' }
    ];

    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Equipment Management
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Manage and monitor all equipment inspections
          </p>
        </div>

        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">Equipment ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">Inspector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {sampleData.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--muted)]/50">
                  <td className="px-4 py-3 text-sm text-[var(--card-foreground)]">{item.equipment}</td>
                  <td className="px-4 py-3 text-sm text-[var(--card-foreground)]">{item.type}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'Active' ? 'bg-[var(--success)] text-[var(--success-foreground)]' :
                      item.status === 'Maintenance' ? 'bg-[var(--warning)] text-[var(--warning-foreground)]' :
                      'bg-[var(--error)] text-[var(--error-foreground)]'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--card-foreground)]">{item.inspector}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'fullscreen',
  },
};

// Loading States Example
export const LoadingStatesExample: StoryObj = {
  render: () => {
    return (
      <div className="p-6 space-y-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Loading States
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Various loading states and progress indicators
          </p>
        </div>

        {/* Progress Indicators */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Progress Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground)]">Processing...</span>
                  <span className="text-[var(--muted-foreground)]">25%</span>
                </div>
                <div className="w-full bg-[var(--muted)] rounded-full h-2">
                  <div className="bg-[var(--primary)] h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground)]">Uploading...</span>
                  <span className="text-[var(--muted-foreground)]">50%</span>
                </div>
                <div className="w-full bg-[var(--muted)] rounded-full h-2">
                  <div className="bg-[var(--success)] h-2 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground)]">Complete!</span>
                  <span className="text-[var(--muted-foreground)]">100%</span>
                </div>
                <div className="w-full bg-[var(--muted)] rounded-full h-2">
                  <div className="bg-[var(--success)] h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading States */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Loading States</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)] text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
              <p className="text-sm text-[var(--muted-foreground)]">Loading data...</p>
            </div>
            
            <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)] text-center">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-[var(--muted)] rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-[var(--muted)] rounded w-1/2 mx-auto"></div>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mt-4">Processing...</p>
            </div>
            
            <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)] text-center">
              <div className="flex justify-center items-center space-x-1">
                <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mt-4">Saving...</p>
            </div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'fullscreen',
  },
};

// Accessibility Example
export const AccessibilityExample: StoryObj = {
  render: () => (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Accessibility Settings
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Customize the interface to meet your accessibility needs
        </p>
      </div>

      <AccessibilitySettings showAdvanced />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
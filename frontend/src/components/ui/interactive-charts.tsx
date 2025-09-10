"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Download,
  Maximize2,
  Filter,
  RefreshCw,
  Calendar,
  ZoomIn,
  ZoomOut,
  Move
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Chart data types
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
  metadata?: any;
}

export interface ChartSeries {
  id: string;
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area';
  visible?: boolean;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'combo';
  theme: 'light' | 'dark';
  responsive: boolean;
  interactive: boolean;
  animations: boolean;
  showGrid: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  showZoom: boolean;
  exportable: boolean;
  height?: number;
  colors?: string[];
}

// Chart component props
interface InteractiveChartProps {
  data: ChartSeries[];
  config?: Partial<ChartConfig>;
  title?: string;
  description?: string;
  className?: string;
  onDataPointClick?: (point: ChartDataPoint, series: ChartSeries) => void;
  onExport?: (format: 'png' | 'svg' | 'pdf' | 'csv') => void;
  loading?: boolean;
  error?: string;
}

// Default chart configuration
const defaultConfig: ChartConfig = {
  type: 'line',
  theme: 'light',
  responsive: true,
  interactive: true,
  animations: true,
  showGrid: true,
  showLegend: true,
  showTooltip: true,
  showZoom: false,
  exportable: true,
  height: 300
};

// Chart color palettes based on theme
const chartColors = {
  light: {
    blue: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
    green: ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'],
    purple: ['#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff'],
    orange: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'],
    red: ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'],
    teal: ['#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1'],
    indigo: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff']
  },
  dark: {
    blue: ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'],
    green: ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534'],
    purple: ['#c084fc', '#a855f7', '#9333ea', '#7c3aed', '#6b21a8'],
    orange: ['#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412'],
    red: ['#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
    teal: ['#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59'],
    indigo: ['#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3']
  }
};

// Main Interactive Chart Component
export function InteractiveChart({
  data,
  config: userConfig = {},
  title,
  description,
  className,
  onDataPointClick,
  onExport,
  loading = false,
  error
}: InteractiveChartProps) {
  const config = { ...defaultConfig, ...userConfig };
  const [selectedSeries, setSelectedSeries] = useState<string[]>(data.map(s => s.id));
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ point: ChartDataPoint; series: ChartSeries } | null>(null);

  // Get theme colors
  const getColors = () => {
    const colorScheme = config.colors || chartColors[config.theme].blue;
    return colorScheme;
  };

  // Toggle series visibility
  const toggleSeries = (seriesId: string) => {
    setSelectedSeries(prev => 
      prev.includes(seriesId) 
        ? prev.filter(id => id !== seriesId)
        : [...prev, seriesId]
    );
  };

  // Export chart
  const handleExport = (format: 'png' | 'svg' | 'pdf' | 'csv') => {
    onExport?.(format);
  };

  // Render chart based on type
  const renderChart = () => {
    const visibleData = data.filter(series => selectedSeries.includes(series.id));
    
    switch (config.type) {
      case 'line':
        return <LineChartRenderer data={visibleData} config={config} onPointClick={onDataPointClick} />;
      case 'bar':
        return <BarChartRenderer data={visibleData} config={config} onPointClick={onDataPointClick} />;
      case 'pie':
        return <PieChartRenderer data={visibleData} config={config} onPointClick={onDataPointClick} />;
      case 'area':
        return <AreaChartRenderer data={visibleData} config={config} onPointClick={onDataPointClick} />;
      default:
        return <LineChartRenderer data={visibleData} config={config} onPointClick={onDataPointClick} />;
    }
  };

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[var(--color-bg-secondary)] rounded animate-pulse" />
                <div className="w-32 h-5 bg-[var(--color-bg-secondary)] rounded animate-pulse" />
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-64 bg-[var(--color-bg-secondary)] rounded animate-pulse" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-16 h-4 bg-[var(--color-bg-secondary)] rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-[var(--color-error-main)] mb-2">
              <BarChart3 className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-[var(--color-error-main)] font-medium">Chart Error</p>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[var(--color-primary-600)]" />
              {title || 'Chart'}
            </CardTitle>
            {description && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">{description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Chart Type Selector */}
            <Select value={config.type} onValueChange={(value) => console.log('Change type:', value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="pie">Pie</SelectItem>
                <SelectItem value="area">Area</SelectItem>
              </SelectContent>
            </Select>

            {/* Zoom Controls */}
            {config.showZoom && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 3))}
                  disabled={zoomLevel >= 3}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Export Menu */}
            {config.exportable && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('png')}>
                    Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('svg')}>
                    Export as SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    Export Data (CSV)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Chart Container */}
          <div
            ref={chartRef}
            className="relative overflow-hidden rounded-lg border border-[var(--color-border-primary)]"
            style={{ height: config.height }}
          >
            {renderChart()}
          </div>

          {/* Legend */}
          {config.showLegend && (
            <div className="flex flex-wrap gap-2">
              {data.map((series, index) => {
                const colors = getColors();
                const color = series.color || colors[index % colors.length];
                const isVisible = selectedSeries.includes(series.id);
                
                return (
                  <Button
                    key={series.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex items-center gap-2 h-8 px-2",
                      !isVisible && "opacity-50"
                    )}
                    onClick={() => toggleSeries(series.id)}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs">{series.name}</span>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Line Chart Renderer
function LineChartRenderer({ 
  data, 
  config, 
  onPointClick 
}: { 
  data: ChartSeries[]; 
  config: ChartConfig; 
  onPointClick?: (point: ChartDataPoint, series: ChartSeries) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  // Calculate chart dimensions
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const width = 800 - margin.left - margin.right;
  const height = (config.height || 300) - margin.top - margin.bottom;

  // Get all data points for scaling
  const allPoints = data.flatMap(series => series.data);
  const xValues = allPoints.map(p => typeof p.x === 'string' ? p.x : String(p.x));
  const yValues = allPoints.map(p => p.y);

  const xScale = (value: string | number, index: number) => (index / (xValues.length - 1)) * width;
  const yScale = (value: number) => height - ((value - Math.min(...yValues)) / (Math.max(...yValues) - Math.min(...yValues))) * height;

  const colors = chartColors[config.theme].blue;

  return (
    <div className="w-full h-full relative">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`}
        className="overflow-visible"
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Grid */}
          {config.showGrid && (
            <g className="grid">
              {/* Horizontal grid lines */}
              {Array.from({ length: 5 }).map((_, i) => (
                <line
                  key={`h-${i}`}
                  x1={0}
                  y1={(height / 4) * i}
                  x2={width}
                  y2={(height / 4) * i}
                  stroke="var(--color-border-primary)"
                  strokeWidth={0.5}
                  opacity={0.5}
                />
              ))}
              {/* Vertical grid lines */}
              {Array.from({ length: 6 }).map((_, i) => (
                <line
                  key={`v-${i}`}
                  x1={(width / 5) * i}
                  y1={0}
                  x2={(width / 5) * i}
                  y2={height}
                  stroke="var(--color-border-primary)"
                  strokeWidth={0.5}
                  opacity={0.5}
                />
              ))}
            </g>
          )}

          {/* Data Lines */}
          {data.map((series, seriesIndex) => {
            const color = series.color || colors[seriesIndex % colors.length];
            
            // Create path
            const pathData = series.data.map((point, index) => {
              const x = xScale(point.x, index);
              const y = yScale(point.y);
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ');

            return (
              <g key={series.id}>
                {/* Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  className={cn(
                    "transition-all duration-300",
                    config.animations && "animate-in slide-in-from-left-5"
                  )}
                />

                {/* Data Points */}
                {series.data.map((point, index) => (
                  <circle
                    key={index}
                    cx={xScale(point.x, index)}
                    cy={yScale(point.y)}
                    r={4}
                    fill={color}
                    className={cn(
                      "cursor-pointer transition-all duration-200",
                      config.interactive && "hover:r-6"
                    )}
                    onClick={() => onPointClick?.(point, series)}
                    onMouseEnter={(e) => {
                      if (config.showTooltip) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          x: rect.left,
                          y: rect.top,
                          content: `${series.name}: ${point.y}`
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </g>
            );
          })}

          {/* Axes */}
          <g className="axes">
            {/* X Axis */}
            <line
              x1={0}
              y1={height}
              x2={width}
              y2={height}
              stroke="var(--color-text-secondary)"
              strokeWidth={1}
            />
            
            {/* Y Axis */}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={height}
              stroke="var(--color-text-secondary)"
              strokeWidth={1}
            />

            {/* X Axis Labels */}
            {xValues.map((value, index) => (
              <text
                key={index}
                x={xScale(value, index)}
                y={height + 20}
                textAnchor="middle"
                className="text-xs fill-[var(--color-text-secondary)]"
              >
                {value}
              </text>
            ))}

            {/* Y Axis Labels */}
            {Array.from({ length: 5 }).map((_, i) => {
              const value = Math.min(...yValues) + ((Math.max(...yValues) - Math.min(...yValues)) / 4) * i;
              return (
                <text
                  key={i}
                  x={-10}
                  y={(height / 4) * (4 - i) + 5}
                  textAnchor="end"
                  className="text-xs fill-[var(--color-text-secondary)]"
                >
                  {Math.round(value)}
                </text>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-10 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg px-2 py-1 text-xs shadow-lg pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 30
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}

// Bar Chart Renderer (simplified)
function BarChartRenderer({ 
  data, 
  config, 
  onPointClick 
}: { 
  data: ChartSeries[]; 
  config: ChartConfig; 
  onPointClick?: (point: ChartDataPoint, series: ChartSeries) => void;
}) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-secondary)] rounded">
      <div className="text-center">
        <BarChart3 className="w-12 h-12 text-[var(--color-primary-600)] mx-auto mb-2" />
        <p className="text-[var(--color-text-secondary)]">Bar Chart Renderer</p>
        <p className="text-xs text-[var(--color-text-tertiary)]">{data.length} series</p>
      </div>
    </div>
  );
}

// Pie Chart Renderer (simplified)
function PieChartRenderer({ 
  data, 
  config, 
  onPointClick 
}: { 
  data: ChartSeries[]; 
  config: ChartConfig; 
  onPointClick?: (point: ChartDataPoint, series: ChartSeries) => void;
}) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-secondary)] rounded">
      <div className="text-center">
        <PieChart className="w-12 h-12 text-[var(--color-primary-600)] mx-auto mb-2" />
        <p className="text-[var(--color-text-secondary)]">Pie Chart Renderer</p>
        <p className="text-xs text-[var(--color-text-tertiary)]">{data.length} series</p>
      </div>
    </div>
  );
}

// Area Chart Renderer (simplified)
function AreaChartRenderer({ 
  data, 
  config, 
  onPointClick 
}: { 
  data: ChartSeries[]; 
  config: ChartConfig; 
  onPointClick?: (point: ChartDataPoint, series: ChartSeries) => void;
}) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-secondary)] rounded">
      <div className="text-center">
        <TrendingUp className="w-12 h-12 text-[var(--color-primary-600)] mx-auto mb-2" />
        <p className="text-[var(--color-text-secondary)]">Area Chart Renderer</p>
        <p className="text-xs text-[var(--color-text-tertiary)]">{data.length} series</p>
      </div>
    </div>
  );
}

// Chart utilities and helpers
export const chartUtils = {
  generateSampleData: (type: 'line' | 'bar' | 'pie', points: number = 10): ChartSeries[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return [
      {
        id: 'series1',
        name: 'Inspections',
        data: Array.from({ length: points }, (_, i) => ({
          x: months[i % 12],
          y: Math.floor(Math.random() * 100) + 20,
          label: `${months[i % 12]} Data`
        }))
      },
      {
        id: 'series2',
        name: 'Completed',
        data: Array.from({ length: points }, (_, i) => ({
          x: months[i % 12],
          y: Math.floor(Math.random() * 80) + 10,
          label: `${months[i % 12]} Completed`
        }))
      }
    ];
  },

  exportChart: (element: HTMLElement, format: 'png' | 'svg' | 'pdf') => {
    // This would implement actual export functionality
    console.log(`Exporting chart as ${format}`);
  },

  getThemeColors: (theme: 'light' | 'dark', scheme: keyof typeof chartColors.light) => {
    return chartColors[theme][scheme];
  }
};
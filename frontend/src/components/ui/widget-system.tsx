"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { 
  LucideIcon, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity, 
  Users, 
  Calendar, 
  Clock,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  MoreVertical,
  Settings,
  RefreshCw,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

// Base Widget Types
export interface BaseWidget {
  id: string;
  title: string;
  description?: string;
  type: WidgetType;
  size: WidgetSize;
  refreshInterval?: number;
  lastUpdated?: Date;
  loading?: boolean;
  error?: string;
  customizable?: boolean;
  removable?: boolean;
}

export type WidgetType = 'metric' | 'list' | 'chart' | 'custom';
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';

// Metric Widget Types
export interface MetricWidget extends BaseWidget {
  type: 'metric';
  data: {
    value: string | number;
    previousValue?: string | number;
    unit?: string;
    trend?: {
      value: number;
      direction: 'up' | 'down' | 'neutral';
      label?: string;
      isPositive?: boolean;
    };
    target?: {
      value: number;
      label: string;
    };
    status?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    icon?: LucideIcon;
    color?: string;
  };
}

// List Widget Types
export interface ListWidget extends BaseWidget {
  type: 'list';
  data: {
    items: ListItem[];
    showSearch?: boolean;
    showFilter?: boolean;
    showSort?: boolean;
    maxItems?: number;
    emptyMessage?: string;
  };
}

export interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  value?: string | number;
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  icon?: LucideIcon;
  metadata?: string;
  onClick?: () => void;
}

// Chart Widget Types (placeholder for future implementation)
export interface ChartWidget extends BaseWidget {
  type: 'chart';
  data: {
    chartType: 'line' | 'bar' | 'pie' | 'area';
    data: any[];
    config?: any;
  };
}

// Custom Widget Types
export interface CustomWidget extends BaseWidget {
  type: 'custom';
  component: React.ComponentType<any>;
  props?: any;
}

export type Widget = MetricWidget | ListWidget | ChartWidget | CustomWidget;

// Widget Size Configurations
const widgetSizeClasses = {
  sm: 'col-span-1 row-span-1',
  md: 'col-span-2 row-span-1', 
  lg: 'col-span-2 row-span-2',
  xl: 'col-span-3 row-span-2'
};

// Base Widget Component
interface BaseWidgetProps {
  widget: Widget;
  onUpdate?: (id: string, updates: Partial<Widget>) => void;
  onRemove?: (id: string) => void;
  onRefresh?: (id: string) => void;
  editable?: boolean;
}

function BaseWidgetComponent({ 
  widget, 
  onUpdate, 
  onRemove, 
  onRefresh, 
  editable = false 
}: BaseWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRefresh = () => {
    onRefresh?.(widget.id);
  };

  const handleRemove = () => {
    onRemove?.(widget.id);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'text-[var(--color-success-main)] bg-[var(--color-success-light)]';
      case 'warning': return 'text-[var(--color-warning-main)] bg-[var(--color-warning-light)]';
      case 'error': return 'text-[var(--color-error-main)] bg-[var(--color-error-light)]';
      case 'info': return 'text-[var(--color-info-main)] bg-[var(--color-info-light)]';
      default: return 'text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)]';
    }
  };

  return (
    <Card className={cn(
      "relative transition-all duration-200 ease-in-out",
      "border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]",
      "hover:shadow-[var(--shadow-card-hover)]",
      widgetSizeClasses[widget.size],
      widget.loading && "animate-pulse opacity-70"
    )}>
      {/* Widget Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {widget.title}
            </CardTitle>
            {widget.description && (
              <p className="text-xs text-[var(--color-text-secondary)] truncate mt-1">
                {widget.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Loading Indicator */}
            {widget.loading && (
              <RefreshCw className="w-4 h-4 text-[var(--color-primary-600)] animate-spin" />
            )}

            {/* Error Indicator */}
            {widget.error && (
              <Badge variant="destructive" className="text-xs px-1 py-0">
                Error
              </Badge>
            )}

            {/* Last Updated */}
            {widget.lastUpdated && !widget.loading && (
              <span className="text-xs text-[var(--color-text-secondary)]">
                {widget.lastUpdated.toLocaleTimeString()}
              </span>
            )}

            {/* Widget Actions */}
            {editable && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleRefresh}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </DropdownMenuItem>
                  {widget.customizable && (
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Customize
                    </DropdownMenuItem>
                  )}
                  {widget.removable !== false && (
                    <DropdownMenuItem 
                      onClick={handleRemove}
                      className="text-[var(--color-error-main)]"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Widget Content */}
      <CardContent className="pt-0">
        {widget.error ? (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 text-[var(--color-error-main)] mx-auto mb-2" />
            <p className="text-sm text-[var(--color-error-main)]">{widget.error}</p>
          </div>
        ) : widget.loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-[var(--color-bg-secondary)] rounded animate-pulse" />
            <div className="h-4 bg-[var(--color-bg-secondary)] rounded animate-pulse w-3/4" />
            <div className="h-4 bg-[var(--color-bg-secondary)] rounded animate-pulse w-1/2" />
          </div>
        ) : (
          <WidgetRenderer widget={widget} />
        )}
      </CardContent>
    </Card>
  );
}

// Widget Renderer
function WidgetRenderer({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case 'metric':
      return <MetricWidgetRenderer widget={widget} />;
    case 'list':
      return <ListWidgetRenderer widget={widget} />;
    case 'chart':
      return <ChartWidgetRenderer widget={widget} />;
    case 'custom':
      return <CustomWidgetRenderer widget={widget} />;
    default:
      return <div>Unknown widget type</div>;
  }
}

// Metric Widget Renderer
function MetricWidgetRenderer({ widget }: { widget: MetricWidget }) {
  const { data } = widget;
  const Icon = data.icon;

  const getTrendIcon = () => {
    if (!data.trend) return null;
    
    switch (data.trend.direction) {
      case 'up':
        return data.trend.isPositive !== false ? 
          <TrendingUp className="w-4 h-4 text-[var(--color-success-main)]" /> :
          <ArrowUpRight className="w-4 h-4 text-[var(--color-error-main)]" />;
      case 'down':
        return data.trend.isPositive !== false ?
          <TrendingDown className="w-4 h-4 text-[var(--color-error-main)]" /> :
          <ArrowDownRight className="w-4 h-4 text-[var(--color-success-main)]" />;
      default:
        return <Minus className="w-4 h-4 text-[var(--color-text-secondary)]" />;
    }
  };

  const getTrendColor = () => {
    if (!data.trend) return '';
    
    if (data.trend.direction === 'neutral') return 'text-[var(--color-text-secondary)]';
    
    const isPositive = data.trend.isPositive !== false;
    return data.trend.direction === 'up' 
      ? (isPositive ? 'text-[var(--color-success-main)]' : 'text-[var(--color-error-main)]')
      : (isPositive ? 'text-[var(--color-error-main)]' : 'text-[var(--color-success-main)]');
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-[var(--color-success-main)]" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-[var(--color-warning-main)]" />;
      case 'error': return <XCircle className="w-5 h-5 text-[var(--color-error-main)]" />;
      case 'info': return <Info className="w-5 h-5 text-[var(--color-info-main)]" />;
      default: return Icon ? <Icon className="w-5 h-5 text-[var(--color-text-secondary)]" /> : null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Metric */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">
              {data.value}
              {data.unit && (
                <span className="text-sm font-normal text-[var(--color-text-secondary)] ml-1">
                  {data.unit}
                </span>
              )}
            </div>
          </div>
          
          {data.previousValue && (
            <div className="text-xs text-[var(--color-text-tertiary)]">
              Previous: {data.previousValue}{data.unit}
            </div>
          )}
        </div>

        {/* Trend Indicator */}
        {data.trend && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            "bg-[var(--color-bg-secondary)]",
            getTrendColor()
          )}>
            {getTrendIcon()}
            <span>
              {data.trend.direction !== 'neutral' && (data.trend.value > 0 ? '+' : '')}
              {data.trend.value}%
            </span>
            {data.trend.label && (
              <span className="text-[var(--color-text-tertiary)] ml-1">
                {data.trend.label}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Target Progress */}
      {data.target && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--color-text-secondary)]">Target: {data.target.label}</span>
            <span className="text-[var(--color-text-secondary)]">{data.target.value}{data.unit}</span>
          </div>
          <div className="w-full bg-[var(--color-bg-secondary)] rounded-full h-2">
            <div 
              className="bg-[var(--color-primary-600)] h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(100, (Number(data.value) / data.target.value) * 100)}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// List Widget Renderer
function ListWidgetRenderer({ widget }: { widget: ListWidget }) {
  const { data } = widget;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'value' | 'status'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter and sort items
  const processedItems = useMemo(() => {
    let filtered = data.items;

    // Search filter
    if (searchTerm && data.showSearch) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all' && data.showFilter) {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    // Sort
    if (data.showSort) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortBy];
        let bValue: any = b[sortBy];

        if (sortBy === 'value') {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        } else {
          aValue = String(aValue || '').toLowerCase();
          bValue = String(bValue || '').toLowerCase();
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    // Limit items
    if (data.maxItems) {
      filtered = filtered.slice(0, data.maxItems);
    }

    return filtered;
  }, [data.items, searchTerm, sortBy, sortOrder, filterStatus, data.showSearch, data.showFilter, data.showSort, data.maxItems]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'text-[var(--color-success-main)] bg-[var(--color-success-light)]';
      case 'warning': return 'text-[var(--color-warning-main)] bg-[var(--color-warning-light)]';
      case 'error': return 'text-[var(--color-error-main)] bg-[var(--color-error-light)]';
      case 'info': return 'text-[var(--color-info-main)] bg-[var(--color-info-light)]';
      default: return 'text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)]';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-3 h-3" />;
      case 'warning': return <AlertCircle className="w-3 h-3" />;
      case 'error': return <XCircle className="w-3 h-3" />;
      case 'info': return <Info className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Controls */}
      {(data.showSearch || data.showFilter || data.showSort) && (
        <div className="flex flex-wrap gap-2 pb-2 border-b border-[var(--color-border-primary)]">
          {/* Search */}
          {data.showSearch && (
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-[var(--color-text-secondary)]" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-7 text-xs"
              />
            </div>
          )}

          {/* Filter */}
          {data.showFilter && (
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-20 h-7 text-xs">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Sort */}
          {data.showSort && (
            <div className="flex gap-1">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-16 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="value">Value</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? 
                  <SortAsc className="w-3 h-3" /> : 
                  <SortDesc className="w-3 h-3" />
                }
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Items List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {processedItems.length > 0 ? (
          processedItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg",
                  "border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]/50",
                  "hover:bg-[var(--color-bg-secondary)] transition-colors duration-150",
                  item.onClick && "cursor-pointer"
                )}
                onClick={item.onClick}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {Icon && <Icon className="w-4 h-4 text-[var(--color-text-secondary)] flex-shrink-0" />}
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {item.title}
                      </p>
                      {item.status && (
                        <div className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs",
                          getStatusColor(item.status)
                        )}>
                          {getStatusIcon(item.status)}
                          <span className="capitalize">{item.status}</span>
                        </div>
                      )}
                    </div>
                    
                    {item.subtitle && (
                      <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                    
                    {item.metadata && (
                      <p className="text-xs text-[var(--color-text-tertiary)] truncate mt-0.5">
                        {item.metadata}
                      </p>
                    )}
                  </div>
                </div>

                {item.value && (
                  <div className="text-sm font-medium text-[var(--color-text-primary)] flex-shrink-0 ml-2">
                    {item.value}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-[var(--color-text-secondary)]">
            <p className="text-sm">
              {data.emptyMessage || 'No items to display'}
            </p>
          </div>
        )}
      </div>

      {/* Show more indicator */}
      {data.maxItems && data.items.length > data.maxItems && (
        <div className="text-center pt-2 border-t border-[var(--color-border-primary)]">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Showing {Math.min(data.maxItems, processedItems.length)} of {data.items.length} items
          </p>
        </div>
      )}
    </div>
  );
}

// Chart Widget Renderer (Placeholder)
function ChartWidgetRenderer({ widget }: { widget: ChartWidget }) {
  const { data } = widget;
  
  return (
    <div className="h-32 bg-[var(--color-bg-secondary)] rounded-lg flex items-center justify-center">
      <div className="text-center">
        <BarChart3 className="w-8 h-8 text-[var(--color-text-secondary)] mx-auto mb-2" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          {data.chartType.charAt(0).toUpperCase() + data.chartType.slice(1)} Chart
        </p>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
          Chart implementation coming soon
        </p>
      </div>
    </div>
  );
}

// Custom Widget Renderer
function CustomWidgetRenderer({ widget }: { widget: CustomWidget }) {
  const Component = widget.component;
  return <Component {...widget.props} />;
}

// Widget Creation Interface
interface WidgetCreatorProps {
  onCreateWidget: (widget: Partial<Widget>) => void;
  availableTypes?: Array<{
    type: WidgetType;
    label: string;
    icon: LucideIcon;
    description: string;
  }>;
}

export function WidgetCreator({ onCreateWidget, availableTypes }: WidgetCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<WidgetType>('metric');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState<WidgetSize>('md');

  const defaultTypes = [
    {
      type: 'metric' as WidgetType,
      label: 'Metric Widget',
      icon: Activity,
      description: 'Display key metrics with trends and targets'
    },
    {
      type: 'list' as WidgetType,
      label: 'List Widget',
      icon: Users,
      description: 'Show filterable and sortable lists of items'
    },
    {
      type: 'chart' as WidgetType,
      label: 'Chart Widget',
      icon: BarChart3,
      description: 'Visualize data with interactive charts'
    }
  ];

  const types = availableTypes || defaultTypes;

  const handleCreate = () => {
    if (!title.trim()) return;

    const baseWidget: Partial<Widget> = {
      id: `widget-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      type: selectedType,
      size,
      customizable: true,
      removable: true,
      lastUpdated: new Date()
    };

    // Add type-specific default data
    switch (selectedType) {
      case 'metric':
        (baseWidget as Partial<MetricWidget>).data = {
          value: 0,
          status: 'neutral'
        };
        break;
      case 'list':
        (baseWidget as Partial<ListWidget>).data = {
          items: [],
          showSearch: true,
          showFilter: true,
          showSort: true,
          maxItems: 10,
          emptyMessage: 'No items to display'
        };
        break;
      case 'chart':
        (baseWidget as Partial<ChartWidget>).data = {
          chartType: 'line',
          data: []
        };
        break;
    }

    onCreateWidget(baseWidget);
    
    // Reset form
    setTitle('');
    setDescription('');
    setSelectedType('metric');
    setSize('md');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Widget
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Widget</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Widget Type Selection */}
          <div className="space-y-2">
            <Label>Widget Type</Label>
            <div className="grid grid-cols-1 gap-2">
              {types.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.type}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all duration-150",
                      selectedType === type.type
                        ? "border-[var(--color-primary-600)] bg-[var(--color-primary-50)]"
                        : "border-[var(--color-border-primary)] hover:border-[var(--color-primary-300)]"
                    )}
                    onClick={() => setSelectedType(type.type)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-[var(--color-primary-600)] flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-[var(--color-text-primary)]">
                          {type.label}
                        </h4>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Widget Details */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter widget title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter widget description"
              />
            </div>

            <div>
              <Label htmlFor="size">Size</Label>
              <Select value={size} onValueChange={(value: WidgetSize) => setSize(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small (1x1)</SelectItem>
                  <SelectItem value="md">Medium (2x1)</SelectItem>
                  <SelectItem value="lg">Large (2x2)</SelectItem>
                  <SelectItem value="xl">Extra Large (3x2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!title.trim()}>
              Create Widget
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Widget System Container
interface WidgetSystemProps {
  widgets: Widget[];
  onWidgetsChange: (widgets: Widget[]) => void;
  editable?: boolean;
  className?: string;
  columns?: number;
  gap?: number;
}

export function WidgetSystem({
  widgets,
  onWidgetsChange,
  editable = false,
  className,
  columns = 4,
  gap = 4
}: WidgetSystemProps) {
  const handleWidgetUpdate = (id: string, updates: Partial<Widget>) => {
    const updatedWidgets = widgets.map(widget =>
      widget.id === id ? { ...widget, ...updates } : widget
    );
    onWidgetsChange(updatedWidgets);
  };

  const handleWidgetRemove = (id: string) => {
    const updatedWidgets = widgets.filter(widget => widget.id !== id);
    onWidgetsChange(updatedWidgets);
  };

  const handleWidgetRefresh = (id: string) => {
    handleWidgetUpdate(id, { 
      loading: true, 
      error: undefined,
      lastUpdated: new Date() 
    });
    
    // Simulate refresh
    setTimeout(() => {
      handleWidgetUpdate(id, { 
        loading: false, 
        lastUpdated: new Date() 
      });
    }, 1000);
  };

  const handleCreateWidget = (widget: Partial<Widget>) => {
    const newWidget = {
      ...widget,
      id: widget.id || `widget-${Date.now()}`,
      lastUpdated: new Date()
    } as Widget;
    
    onWidgetsChange([...widgets, newWidget]);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controls */}
      {editable && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Dashboard Widgets
          </h2>
          <WidgetCreator onCreateWidget={handleCreateWidget} />
        </div>
      )}

      {/* Widgets Grid */}
      <div 
        className={cn(
          "grid auto-rows-fr",
          `grid-cols-${columns}`,
          `gap-${gap}`
        )}
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap * 0.25}rem`
        }}
      >
        {widgets.map((widget) => (
          <BaseWidgetComponent
            key={widget.id}
            widget={widget}
            onUpdate={handleWidgetUpdate}
            onRemove={handleWidgetRemove}
            onRefresh={handleWidgetRefresh}
            editable={editable}
          />
        ))}
      </div>

      {/* Empty State */}
      {widgets.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-[var(--color-border-primary)] rounded-lg">
          <Activity className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
            No widgets added yet
          </h3>
          <p className="text-[var(--color-text-secondary)] mb-4">
            Create your first widget to get started
          </p>
          {editable && (
            <WidgetCreator onCreateWidget={handleCreateWidget} />
          )}
        </div>
      )}
    </div>
  );
}

// Pre-built Widget Templates
export const widgetTemplates = {
  totalInspections: (): MetricWidget => ({
    id: 'total-inspections',
    title: 'Total Inspections',
    description: 'Total number of inspections this month',
    type: 'metric',
    size: 'sm',
    data: {
      value: 1234,
      previousValue: 1156,
      unit: '',
      trend: {
        value: 6.7,
        direction: 'up',
        isPositive: true,
        label: 'vs last month'
      },
      status: 'success',
      icon: Activity
    },
    customizable: true,
    removable: true,
    lastUpdated: new Date()
  }),

  pendingInspections: (): MetricWidget => ({
    id: 'pending-inspections',
    title: 'Pending Inspections',
    description: 'Inspections awaiting review',
    type: 'metric',
    size: 'sm',
    data: {
      value: 56,
      unit: '',
      status: 'warning',
      icon: Clock,
      target: {
        value: 30,
        label: 'Target'
      }
    },
    customizable: true,
    removable: true,
    lastUpdated: new Date()
  }),

  recentInspections: (): ListWidget => ({
    id: 'recent-inspections',
    title: 'Recent Inspections',
    description: 'Latest inspection activities',
    type: 'list',
    size: 'md',
    data: {
      items: [
        {
          id: '1',
          title: 'PSV-001 Calibration',
          subtitle: 'Pressure Safety Valve',
          value: 'Completed',
          status: 'success',
          icon: CheckCircle,
          metadata: '2 hours ago'
        },
        {
          id: '2',
          title: 'PSV-002 Inspection',
          subtitle: 'Pressure Safety Valve',
          value: 'In Progress',
          status: 'info',
          icon: Clock,
          metadata: '4 hours ago'
        },
        {
          id: '3',
          title: 'PSV-003 Maintenance',
          subtitle: 'Pressure Safety Valve',
          value: 'Scheduled',
          status: 'neutral',
          icon: Calendar,
          metadata: 'Tomorrow'
        }
      ],
      showSearch: true,
      showFilter: true,
      showSort: true,
      maxItems: 5,
      emptyMessage: 'No recent inspections'
    },
    customizable: true,
    removable: true,
    lastUpdated: new Date()
  })
};

export default WidgetSystem;
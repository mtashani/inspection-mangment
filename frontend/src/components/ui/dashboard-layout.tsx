"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Grid3X3, 
  LayoutGrid, 
  Maximize2, 
  Minimize2, 
  Move, 
  Settings, 
  Plus,
  X,
  GripVertical,
  MoreVertical,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Widget size definitions
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface WidgetDimensions {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

// Widget configuration
export interface DashboardWidget {
  id: string;
  title: string;
  description?: string;
  type: string;
  size: WidgetSize;
  position: { x: number; y: number };
  dimensions?: WidgetDimensions;
  data?: any;
  config?: any;
  refreshInterval?: number;
  lastUpdated?: Date;
  loading?: boolean;
  error?: string;
  actions?: WidgetAction[];
  customizable?: boolean;
  removable?: boolean;
  resizable?: boolean;
  movable?: boolean;
}

export interface WidgetAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: (widget: DashboardWidget) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
}

// Dashboard layout types
export type DashboardLayoutType = 'grid' | 'masonry' | 'flex' | 'custom';

export interface DashboardLayoutConfig {
  type: DashboardLayoutType;
  columns: number;
  gap: number;
  responsive: boolean;
  autoHeight: boolean;
  allowReorder: boolean;
  allowResize: boolean;
  showGrid: boolean;
}

// Widget size mappings
const widgetSizes: Record<WidgetSize, WidgetDimensions> = {
  sm: { width: 1, height: 1 },
  md: { width: 2, height: 1 },
  lg: { width: 2, height: 2 },
  xl: { width: 3, height: 2 },
  full: { width: 4, height: 2 }
};

// Dashboard Layout Component
interface DashboardLayoutProps {
  widgets: DashboardWidget[];
  onWidgetsChange: (widgets: DashboardWidget[]) => void;
  config?: Partial<DashboardLayoutConfig>;
  className?: string;
  editable?: boolean;
  onWidgetAdd?: (type: string) => void;
  onWidgetRemove?: (widgetId: string) => void;
  onWidgetUpdate?: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  availableWidgets?: Array<{ type: string; label: string; icon?: LucideIcon }>;
}

export function DashboardLayout({
  widgets,
  onWidgetsChange,
  config: userConfig = {},
  className,
  editable = false,
  onWidgetAdd,
  onWidgetRemove,
  onWidgetUpdate,
  availableWidgets = []
}: DashboardLayoutProps) {
  const defaultConfig: DashboardLayoutConfig = {
    type: 'grid',
    columns: 4,
    gap: 16,
    responsive: true,
    autoHeight: true,
    allowReorder: true,
    allowResize: true,
    showGrid: false,
    ...userConfig
  };

  const [config, setConfig] = useState(defaultConfig);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<{ x: number; y: number } | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Grid calculations
  const gridSize = {
    width: `${100 / config.columns}%`,
    gap: `${config.gap}px`
  };

  // Handle widget drag start
  const handleDragStart = (widgetId: string, e: React.DragEvent) => {
    if (!config.allowReorder || !editable) return;
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedWidget) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.floor((e.clientX - rect.left) / (rect.width / config.columns));
    const y = Math.floor((e.clientY - rect.top) / 100); // Approximate row height

    setDragOverPosition({ x: Math.max(0, Math.min(x, config.columns - 1)), y: Math.max(0, y) });
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedWidget || !dragOverPosition) return;

    const updatedWidgets = widgets.map(widget =>
      widget.id === draggedWidget
        ? { ...widget, position: dragOverPosition }
        : widget
    );

    onWidgetsChange(updatedWidgets);
    setDraggedWidget(null);
    setDragOverPosition(null);
  };

  // Handle widget resize
  const handleWidgetResize = (widgetId: string, newSize: WidgetSize) => {
    if (!config.allowResize || !editable) return;

    const updatedWidgets = widgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, size: newSize, dimensions: widgetSizes[newSize] }
        : widget
    );

    onWidgetsChange(updatedWidgets);
  };

  // Handle widget action
  const handleWidgetAction = (widget: DashboardWidget, actionId: string) => {
    const action = widget.actions?.find(a => a.id === actionId);
    if (action) {
      action.onClick(widget);
    }
  };

  // Refresh widget
  const refreshWidget = (widgetId: string) => {
    onWidgetUpdate?.(widgetId, { 
      loading: true, 
      lastUpdated: new Date() 
    });
    
    // Simulate refresh
    setTimeout(() => {
      onWidgetUpdate?.(widgetId, { 
        loading: false, 
        lastUpdated: new Date() 
      });
    }, 1000);
  };

  // Get widget grid style
  const getWidgetStyle = (widget: DashboardWidget): React.CSSProperties => {
    const dimensions = widget.dimensions || widgetSizes[widget.size];
    
    switch (config.type) {
      case 'grid':
        return {
          gridColumn: `span ${dimensions.width}`,
          gridRow: `span ${dimensions.height}`,
          minHeight: dimensions.minHeight || 'auto'
        };
      case 'flex':
        return {
          flex: `${dimensions.width} 1 ${dimensions.minWidth || 200}px`,
          minHeight: dimensions.minHeight || 200
        };
      default:
        return {};
    }
  };

  // Render widget
  const renderWidget = (widget: DashboardWidget) => {
    const isDragging = draggedWidget === widget.id;
    
    return (
      <Card
        key={widget.id}
        className={cn(
          "relative transition-all duration-200 ease-in-out",
          "border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]",
          "hover:shadow-[var(--shadow-card-hover)]",
          isDragging && "opacity-50 scale-95",
          editable && config.allowReorder && "cursor-move",
          widget.loading && "animate-pulse"
        )}
        style={getWidgetStyle(widget)}
        draggable={editable && config.allowReorder && widget.movable !== false}
        onDragStart={(e) => handleDragStart(widget.id, e)}
      >
        {/* Widget Header */}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {editable && config.allowReorder && widget.movable !== false && (
                <GripVertical className="w-4 h-4 text-[var(--color-text-secondary)] cursor-move flex-shrink-0" />
              )}
              
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
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Widget Status */}
              {widget.loading && (
                <RefreshCw className="w-4 h-4 text-[var(--color-primary-600)] animate-spin" />
              )}
              
              {widget.error && (
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  Error
                </Badge>
              )}

              {widget.lastUpdated && !widget.loading && (
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {widget.lastUpdated.toLocaleTimeString()}
                </span>
              )}

              {/* Widget Actions */}
              {(editable || widget.actions?.length) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Refresh */}
                    <DropdownMenuItem onClick={() => refreshWidget(widget.id)}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </DropdownMenuItem>

                    {/* Resize Options */}
                    {editable && config.allowResize && widget.resizable !== false && (
                      <>
                        <DropdownMenuItem onClick={() => handleWidgetResize(widget.id, 'sm')}>
                          <Grid3X3 className="w-4 h-4 mr-2" />
                          Small
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleWidgetResize(widget.id, 'md')}>
                          <LayoutGrid className="w-4 h-4 mr-2" />
                          Medium
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleWidgetResize(widget.id, 'lg')}>
                          <Maximize2 className="w-4 h-4 mr-2" />
                          Large
                        </DropdownMenuItem>
                      </>
                    )}

                    {/* Custom Actions */}
                    {widget.actions?.map(action => {
                      const Icon = action.icon;
                      return (
                        <DropdownMenuItem
                          key={action.id}
                          onClick={() => handleWidgetAction(widget, action.id)}
                        >
                          {Icon && <Icon className="w-4 h-4 mr-2" />}
                          {action.label}
                        </DropdownMenuItem>
                      );
                    })}

                    {/* Remove */}
                    {editable && widget.removable !== false && (
                      <DropdownMenuItem
                        onClick={() => onWidgetRemove?.(widget.id)}
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
            <div className="text-center py-4 text-[var(--color-error-main)]">
              <p className="text-sm">{widget.error}</p>
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
  };

  // Container style based on layout type
  const getContainerStyle = (): React.CSSProperties => {
    switch (config.type) {
      case 'grid':
        return {
          display: 'grid',
          gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
          gap: config.gap,
          gridAutoRows: 'minmax(200px, auto)'
        };
      case 'flex':
        return {
          display: 'flex',
          flexWrap: 'wrap',
          gap: config.gap
        };
      case 'masonry':
        return {
          columnCount: config.columns,
          columnGap: config.gap,
          columnFill: 'balance'
        };
      default:
        return {};
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Dashboard Controls */}
      {editable && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCustomizing(!isCustomizing)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Customize
            </Button>

            {availableWidgets.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Widget
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {availableWidgets.map(widget => {
                    const Icon = widget.icon;
                    return (
                      <DropdownMenuItem
                        key={widget.type}
                        onClick={() => onWidgetAdd?.(widget.type)}
                      >
                        {Icon && <Icon className="w-4 h-4 mr-2" />}
                        {widget.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Layout Controls */}
          {isCustomizing && (
            <div className="flex items-center gap-2">
              <Button
                variant={config.type === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConfig(prev => ({ ...prev, type: 'grid' }))}
              >
                Grid
              </Button>
              <Button
                variant={config.type === 'flex' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConfig(prev => ({ ...prev, type: 'flex' }))}
              >
                Flex
              </Button>
              <Button
                variant={config.type === 'masonry' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConfig(prev => ({ ...prev, type: 'masonry' }))}
              >
                Masonry
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dashboard Grid */}
      <div
        ref={containerRef}
        className={cn(
          "relative",
          config.showGrid && "bg-grid-pattern",
          draggedWidget && "bg-[var(--color-bg-secondary)]/50"
        )}
        style={getContainerStyle()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {widgets.map(renderWidget)}

        {/* Drop Indicator */}
        {dragOverPosition && draggedWidget && (
          <div
            className="absolute border-2 border-dashed border-[var(--color-primary-600)] bg-[var(--color-primary-100)]/20 rounded-lg pointer-events-none"
            style={{
              left: `${(dragOverPosition.x / config.columns) * 100}%`,
              top: `${dragOverPosition.y * 200}px`,
              width: `${100 / config.columns}%`,
              height: '200px'
            }}
          />
        )}
      </div>

      {/* Empty State */}
      {widgets.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-[var(--color-border-primary)] rounded-lg">
          <LayoutGrid className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
            No widgets added yet
          </h3>
          <p className="text-[var(--color-text-secondary)] mb-4">
            Add widgets to customize your dashboard
          </p>
          {editable && availableWidgets.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your First Widget
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {availableWidgets.map(widget => {
                  const Icon = widget.icon;
                  return (
                    <DropdownMenuItem
                      key={widget.type}
                      onClick={() => onWidgetAdd?.(widget.type)}
                    >
                      {Icon && <Icon className="w-4 h-4 mr-2" />}
                      {widget.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  );
}

// Widget Renderer Component
interface WidgetRendererProps {
  widget: DashboardWidget;
}

function WidgetRenderer({ widget }: WidgetRendererProps) {
  // This would be replaced with actual widget implementations
  switch (widget.type) {
    case 'metric':
      return (
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--color-primary-600)]">
            {widget.data?.value || '0'}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">
            {widget.data?.label || 'Metric'}
          </div>
        </div>
      );
    
    case 'chart':
      return (
        <div className="h-32 bg-[var(--color-bg-secondary)] rounded flex items-center justify-center">
          <span className="text-[var(--color-text-secondary)]">Chart Widget</span>
        </div>
      );
    
    case 'list':
      return (
        <div className="space-y-2">
          {(widget.data?.items || []).slice(0, 5).map((item: any, index: number) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-[var(--color-text-primary)]">{item.name}</span>
              <span className="text-[var(--color-text-secondary)]">{item.value}</span>
            </div>
          ))}
        </div>
      );
    
    default:
      return (
        <div className="text-center py-4 text-[var(--color-text-secondary)]">
          <p>Widget type: {widget.type}</p>
        </div>
      );
  }
}

// Dashboard presets
export const dashboardPresets = {
  analytics: [
    {
      id: 'total-inspections',
      title: 'Total Inspections',
      type: 'metric',
      size: 'sm' as WidgetSize,
      position: { x: 0, y: 0 },
      data: { value: '1,234', label: 'This Month' }
    },
    {
      id: 'pending-inspections',
      title: 'Pending Inspections',
      type: 'metric',
      size: 'sm' as WidgetSize,
      position: { x: 1, y: 0 },
      data: { value: '56', label: 'Awaiting Review' }
    },
    {
      id: 'inspection-chart',
      title: 'Inspection Trends',
      type: 'chart',
      size: 'lg' as WidgetSize,
      position: { x: 2, y: 0 }
    },
    {
      id: 'recent-inspections',
      title: 'Recent Inspections',
      type: 'list',
      size: 'md' as WidgetSize,
      position: { x: 0, y: 1 },
      data: {
        items: [
          { name: 'PSV-001', value: 'Completed' },
          { name: 'PSV-002', value: 'In Progress' },
          { name: 'PSV-003', value: 'Scheduled' }
        ]
      }
    }
  ]
};
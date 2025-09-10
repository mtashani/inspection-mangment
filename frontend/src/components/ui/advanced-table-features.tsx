"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  X, 
  Calendar,
  Search,
  SlidersHorizontal,
  ChevronDown,
  GripVertical,
  Eye,
  EyeOff,
  ArrowUpDown,
  Check,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ColumnDef } from './enhanced-data-table';

// Advanced filter types
export type FilterType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'range';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface AdvancedFilter {
  id: string;
  column: string;
  type: FilterType;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'between' | 'in' | 'notIn';
  value: any;
  options?: FilterOption[];
  label?: string;
}

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  onClick: (selectedRows: any[]) => void;
  disabled?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

// Column resizing hook
export function useColumnResizing<T>(initialColumns: ColumnDef<T>[]) {
  const [columns, setColumns] = useState(initialColumns);
  const [resizing, setResizing] = useState<{ columnId: string; startX: number; startWidth: number } | null>(null);

  const handleMouseDown = (columnId: string, e: React.MouseEvent) => {
    const column = columns.find(col => col.id === columnId);
    if (!column) return;

    const startX = e.clientX;
    const startWidth = typeof column.width === 'number' ? column.width : 150;

    setResizing({ columnId, startX, startWidth });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizing) return;

    const deltaX = e.clientX - resizing.startX;
    const newWidth = Math.max(50, resizing.startWidth + deltaX);

    setColumns(prev => prev.map(col => 
      col.id === resizing.columnId 
        ? { ...col, width: newWidth }
        : col
    ));
  };

  const handleMouseUp = () => {
    setResizing(null);
  };

  useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing]);

  return { columns, setColumns, handleMouseDown, resizing: !!resizing };
}

// Column reordering hook
export function useColumnReordering<T>(initialColumns: ColumnDef<T>[]) {
  const [columns, setColumns] = useState(initialColumns);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  const handleDragStart = (columnId: string) => {
    setDraggedColumn(columnId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumnId: string) => {
    if (!draggedColumn || draggedColumn === targetColumnId) return;

    setColumns(prev => {
      const draggedIndex = prev.findIndex(col => col.id === draggedColumn);
      const targetIndex = prev.findIndex(col => col.id === targetColumnId);
      
      const newColumns = [...prev];
      const [draggedCol] = newColumns.splice(draggedIndex, 1);
      newColumns.splice(targetIndex, 0, draggedCol);
      
      return newColumns;
    });

    setDraggedColumn(null);
  };

  return { columns, setColumns, handleDragStart, handleDragOver, handleDrop, draggedColumn };
}

// Advanced filtering component
interface AdvancedFilteringProps {
  columns: ColumnDef<any>[];
  filters: AdvancedFilter[];
  onFiltersChange: (filters: AdvancedFilter[]) => void;
  data: any[];
}

export function AdvancedFiltering({ columns, filters, onFiltersChange, data }: AdvancedFilteringProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newFilter, setNewFilter] = useState<Partial<AdvancedFilter>>({});

  const filterableColumns = columns.filter(col => col.filterable !== false);

  const addFilter = () => {
    if (!newFilter.column || !newFilter.type || !newFilter.operator) return;

    const filter: AdvancedFilter = {
      id: Date.now().toString(),
      column: newFilter.column,
      type: newFilter.type,
      operator: newFilter.operator,
      value: newFilter.value || '',
      label: columns.find(col => col.id === newFilter.column)?.header
    };

    onFiltersChange([...filters, filter]);
    setNewFilter({});
  };

  const removeFilter = (filterId: string) => {
    onFiltersChange(filters.filter(f => f.id !== filterId));
  };

  const updateFilter = (filterId: string, updates: Partial<AdvancedFilter>) => {
    onFiltersChange(filters.map(f => f.id === filterId ? { ...f, ...updates } : f));
  };

  const getUniqueValues = (columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column?.accessorKey) return [];

    const values = data.map(row => row[column.accessorKey!]).filter(Boolean);
    const uniqueValues = Array.from(new Set(values));
    
    return uniqueValues.map(value => ({
      value: String(value),
      label: String(value),
      count: values.filter(v => v === value).length
    }));
  };

  const renderFilterValue = (filter: AdvancedFilter) => {
    switch (filter.type) {
      case 'select':
        const options = getUniqueValues(filter.column);
        return (
          <Select
            value={filter.value}
            onValueChange={(value) => updateFilter(filter.id, { value })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <Select
            value={filter.value}
            onValueChange={(value) => updateFilter(filter.id, { value })}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={filter.value}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            className="w-24"
            placeholder="Value"
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={filter.value}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            className="w-32"
          />
        );

      default:
        return (
          <Input
            value={filter.value}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            className="w-32"
            placeholder="Value"
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {/* Active Filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map(filter => (
            <Badge
              key={filter.id}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              <span className="text-xs">
                {filter.label}: {filter.operator} {String(filter.value)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => removeFilter(filter.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Filter Builder */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Add Filter
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-4" align="start">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Column</Label>
                <Select
                  value={newFilter.column}
                  onValueChange={(value) => setNewFilter(prev => ({ ...prev, column: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterableColumns.map(column => (
                      <SelectItem key={column.id} value={column.id}>
                        {column.header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={newFilter.type}
                  onValueChange={(value) => setNewFilter(prev => ({ ...prev, type: value as FilterType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Operator</Label>
                <Select
                  value={newFilter.operator}
                  onValueChange={(value) => setNewFilter(prev => ({ ...prev, operator: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="startsWith">Starts with</SelectItem>
                    <SelectItem value="endsWith">Ends with</SelectItem>
                    <SelectItem value="gt">Greater than</SelectItem>
                    <SelectItem value="lt">Less than</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Value</Label>
                <Input
                  value={newFilter.value || ''}
                  onChange={(e) => setNewFilter(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Enter value"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={addFilter}>
                Add Filter
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Bulk actions component
interface BulkActionsProps {
  selectedCount: number;
  actions: BulkAction[];
  selectedRows: any[];
  onClearSelection: () => void;
}

export function BulkActions({ selectedCount, actions, selectedRows, onClearSelection }: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-[var(--color-primary-50)] border border-[var(--color-primary-200)] rounded-lg">
      <div className="flex items-center gap-2 flex-1">
        <Checkbox checked={true} />
        <span className="text-sm font-medium text-[var(--color-primary-700)]">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={() => action.onClick(selectedRows)}
              disabled={action.disabled}
              className="flex items-center gap-1"
            >
              {Icon && <Icon className="w-4 h-4" />}
              {action.label}
            </Button>
          );
        })}

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-[var(--color-text-secondary)]"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

// Column management component
interface ColumnManagementProps<T> {
  columns: ColumnDef<T>[];
  onColumnsChange: (columns: ColumnDef<T>[]) => void;
  onResetColumns: () => void;
}

export function ColumnManagement<T>({ columns, onColumnsChange, onResetColumns }: ColumnManagementProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleColumnVisibility = (columnId: string) => {
    onColumnsChange(columns.map(col => 
      col.id === columnId ? { ...col, hidden: !col.hidden } : col
    ));
  };

  const moveColumn = (columnId: string, direction: 'up' | 'down') => {
    const currentIndex = columns.findIndex(col => col.id === columnId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= columns.length) return;

    const newColumns = [...columns];
    [newColumns[currentIndex], newColumns[newIndex]] = [newColumns[newIndex], newColumns[currentIndex]];
    onColumnsChange(newColumns);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Manage Columns</h4>
            <Button variant="ghost" size="sm" onClick={onResetColumns}>
              Reset
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {columns.map((column, index) => (
              <div
                key={column.id}
                className="flex items-center gap-2 p-2 rounded border border-[var(--color-border-primary)]"
              >
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => moveColumn(column.id, 'up')}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => moveColumn(column.id, 'down')}
                    disabled={index === columns.length - 1}
                  >
                    ↓
                  </Button>
                </div>

                <GripVertical className="w-4 h-4 text-[var(--color-text-secondary)] cursor-move" />

                <Checkbox
                  checked={!column.hidden}
                  onCheckedChange={() => toggleColumnVisibility(column.id)}
                />

                <span className="flex-1 text-sm">{column.header}</span>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleColumnVisibility(column.id)}
                >
                  {column.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Virtual scrolling hook for large datasets
export function useVirtualScrolling<T>(
  data: T[],
  containerHeight: number,
  itemHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    data.length - 1
  );

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(data.length - 1, visibleEnd + overscan);

  const visibleItems = data.slice(startIndex, endIndex + 1);
  const totalHeight = data.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    setScrollTop
  };
}
"use client";

import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter, 
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  EyeOff,
  Settings,
  Download,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { 
  AdvancedFiltering, 
  BulkActions, 
  ColumnManagement,
  useColumnResizing,
  useColumnReordering,
  useVirtualScrolling,
  AdvancedFilter,
  BulkAction
} from './advanced-table-features';

// Column definition interface
export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
  hidden?: boolean;
  meta?: {
    headerClassName?: string;
    cellClassName?: string;
  };
}

// Table density options
type TableDensity = 'compact' | 'comfortable' | 'spacious';

// Sorting state
interface SortingState {
  column: string;
  direction: 'asc' | 'desc';
}

// Filtering state
interface FilterState {
  global: string;
  columns: Record<string, string>;
}

// Selection state
interface SelectionState {
  selectedRows: Set<string>;
  selectAll: boolean;
}

// Table configuration
interface TableConfig {
  density: TableDensity;
  striped: boolean;
  bordered: boolean;
  hover: boolean;
  stickyHeader: boolean;
  showSearch: boolean;
  showColumnToggle: boolean;
  showDensityToggle: boolean;
  selectable: boolean;
  pagination: boolean;
  pageSize: number;
  resizable: boolean;
  reorderable: boolean;
  virtualScrolling: boolean;
  advancedFiltering: boolean;
  bulkActions: boolean;
}

interface EnhancedDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  config?: Partial<TableConfig>;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T, index: number) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  getRowId?: (row: T) => string;
  rowClassName?: (row: T, index: number) => string;
  bulkActions?: BulkAction[];
  advancedFilters?: AdvancedFilter[];
  onAdvancedFiltersChange?: (filters: AdvancedFilter[]) => void;
  containerHeight?: number;
}

export function EnhancedDataTable<T>({
  data,
  columns: initialColumns,
  config: userConfig = {},
  loading = false,
  error,
  emptyMessage = "No data available",
  className,
  onRowClick,
  onSelectionChange,
  getRowId = (_, index) => index.toString(),
  rowClassName,
  bulkActions = [],
  advancedFilters = [],
  onAdvancedFiltersChange,
  containerHeight = 400
}: EnhancedDataTableProps<T>) {
  // Default configuration
  const config: TableConfig = {
    density: 'comfortable',
    striped: false,
    bordered: true,
    hover: true,
    stickyHeader: false,
    showSearch: true,
    showColumnToggle: true,
    showDensityToggle: true,
    selectable: false,
    pagination: true,
    pageSize: 10,
    resizable: true,
    reorderable: true,
    virtualScrolling: false,
    advancedFiltering: true,
    bulkActions: true,
    ...userConfig
  };

  // State management
  const [sorting, setSorting] = useState<SortingState | null>(null);
  const [filtering, setFiltering] = useState<FilterState>({ global: '', columns: {} });
  const [selection, setSelection] = useState<SelectionState>({ selectedRows: new Set(), selectAll: false });
  const [currentPage, setCurrentPage] = useState(1);
  const [tableConfig, setTableConfig] = useState(config);
  const [filters, setFilters] = useState<AdvancedFilter[]>(advancedFilters);

  // Advanced features hooks
  const { columns, setColumns, handleMouseDown, resizing } = useColumnResizing(initialColumns);
  const { 
    columns: reorderableColumns, 
    setColumns: setReorderableColumns,
    handleDragStart, 
    handleDragOver, 
    handleDrop, 
    draggedColumn 
  } = useColumnReordering(columns);

  // Use reorderable columns if reordering is enabled
  const finalColumns = config.reorderable ? reorderableColumns : columns;

  // Density styles
  const densityStyles = {
    compact: {
      cell: 'px-2 py-1 text-sm',
      header: 'px-2 py-2 text-sm'
    },
    comfortable: {
      cell: 'px-4 py-3',
      header: 'px-4 py-3'
    },
    spacious: {
      cell: 'px-6 py-4 text-base',
      header: 'px-6 py-4 text-base'
    }
  };

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Global search
    if (filtering.global) {
      const searchTerm = filtering.global.toLowerCase();
      filtered = filtered.filter(row => {
        return finalColumns.some(column => {
          if (column.accessorKey) {
            const value = row[column.accessorKey];
            return String(value).toLowerCase().includes(searchTerm);
          }
          return false;
        });
      });
    }

    // Column-specific filters
    Object.entries(filtering.columns).forEach(([columnId, filterValue]) => {
      if (filterValue) {
        const column = finalColumns.find(col => col.id === columnId);
        if (column?.accessorKey) {
          filtered = filtered.filter(row => {
            const value = row[column.accessorKey!];
            return String(value).toLowerCase().includes(filterValue.toLowerCase());
          });
        }
      }
    });

    // Advanced filters
    filters.forEach(filter => {
      const column = finalColumns.find(col => col.id === filter.column);
      if (column?.accessorKey && filter.value) {
        filtered = filtered.filter(row => {
          const value = row[column.accessorKey!];
          const filterValue = filter.value;

          switch (filter.operator) {
            case 'equals':
              return String(value) === String(filterValue);
            case 'contains':
              return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
            case 'startsWith':
              return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
            case 'endsWith':
              return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
            case 'gt':
              return Number(value) > Number(filterValue);
            case 'lt':
              return Number(value) < Number(filterValue);
            case 'gte':
              return Number(value) >= Number(filterValue);
            case 'lte':
              return Number(value) <= Number(filterValue);
            default:
              return true;
          }
        });
      }
    });

    return filtered;
  }, [data, filtering, finalColumns, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sorting) return filteredData;

    const column = finalColumns.find(col => col.id === sorting.column);
    if (!column?.accessorKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[column.accessorKey!];
      const bValue = b[column.accessorKey!];

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sorting.direction === 'desc' ? -comparison : comparison;
    });
  }, [filteredData, sorting, finalColumns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!tableConfig.pagination) return sortedData;

    const startIndex = (currentPage - 1) * tableConfig.pageSize;
    const endIndex = startIndex + tableConfig.pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, tableConfig.pagination, tableConfig.pageSize]);

  // Handle sorting
  const handleSort = (columnId: string) => {
    const column = finalColumns.find(col => col.id === columnId);
    if (!column?.sortable) return;

    setSorting(prev => {
      if (prev?.column === columnId) {
        if (prev.direction === 'asc') {
          return { column: columnId, direction: 'desc' };
        } else {
          return null; // Remove sorting
        }
      }
      return { column: columnId, direction: 'asc' };
    });
  };

  // Handle selection
  const handleRowSelection = (rowId: string, checked: boolean) => {
    setSelection(prev => {
      const newSelectedRows = new Set(prev.selectedRows);
      if (checked) {
        newSelectedRows.add(rowId);
      } else {
        newSelectedRows.delete(rowId);
      }

      const selectAll = newSelectedRows.size === paginatedData.length;
      
      // Notify parent component
      const selectedData = data.filter(row => newSelectedRows.has(getRowId(row)));
      onSelectionChange?.(selectedData);

      return { selectedRows: newSelectedRows, selectAll };
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelection(prev => {
      const newSelectedRows = checked 
        ? new Set(paginatedData.map(row => getRowId(row)))
        : new Set<string>();

      // Notify parent component
      const selectedData = checked ? [...paginatedData] : [];
      onSelectionChange?.(selectedData);

      return { selectedRows: newSelectedRows, selectAll: checked };
    });
  };

  // Handle column visibility
  const toggleColumnVisibility = (columnId: string) => {
    const updateColumns = (prev: ColumnDef<T>[]) => prev.map(col => 
      col.id === columnId ? { ...col, hidden: !col.hidden } : col
    );
    
    setColumns(updateColumns);
    if (config.reorderable) {
      setReorderableColumns(updateColumns);
    }
  };

  // Handle filters change
  const handleFiltersChange = (newFilters: AdvancedFilter[]) => {
    setFilters(newFilters);
    onAdvancedFiltersChange?.(newFilters);
  };

  // Get selected rows data
  const selectedRowsData = data.filter(row => selection.selectedRows.has(getRowId(row)));

  // Clear selection
  const clearSelection = () => {
    setSelection({ selectedRows: new Set(), selectAll: false });
    onSelectionChange?.([]);
  };

  // Visible columns
  const visibleColumns = finalColumns.filter(col => !col.hidden);

  // Render table header
  const renderHeader = () => (
    <TableHeader className={tableConfig.stickyHeader ? 'sticky top-0 z-10 bg-[var(--color-bg-primary)]' : ''}>
      <TableRow className="border-b border-[var(--color-border-primary)]">
        {tableConfig.selectable && (
          <TableHead className={cn(densityStyles[tableConfig.density].header, "w-12")}>
            <Checkbox
              checked={selection.selectAll}
              onCheckedChange={handleSelectAll}
              aria-label="Select all rows"
            />
          </TableHead>
        )}
        
        {visibleColumns.map((column) => (
          <TableHead
            key={column.id}
            className={cn(
              densityStyles[tableConfig.density].header,
              column.align === 'center' && 'text-center',
              column.align === 'right' && 'text-right',
              column.sortable && 'cursor-pointer hover:bg-[var(--color-bg-secondary)]',
              column.meta?.headerClassName,
              'relative group'
            )}
            style={{
              width: column.width,
              minWidth: column.minWidth,
              maxWidth: column.maxWidth
            }}
            onClick={() => column.sortable && handleSort(column.id)}
            draggable={config.reorderable}
            onDragStart={() => config.reorderable && handleDragStart(column.id)}
            onDragOver={handleDragOver}
            onDrop={() => config.reorderable && handleDrop(column.id)}
          >
            <div className="flex items-center gap-2">
              {config.reorderable && (
                <GripVertical className="w-4 h-4 text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 cursor-move" />
              )}
              
              <span className="font-medium text-[var(--color-text-primary)]">
                {column.header}
              </span>
              
              {column.sortable && (
                <div className="flex flex-col">
                  {sorting?.column === column.id ? (
                    sorting.direction === 'asc' ? (
                      <ChevronUp className="w-4 h-4 text-[var(--color-primary-600)]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[var(--color-primary-600)]" />
                    )
                  ) : (
                    <ArrowUpDown className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  )}
                </div>
              )}
            </div>

            {/* Column Resizer */}
            {config.resizable && (
              <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--color-primary-600)] opacity-0 hover:opacity-100"
                onMouseDown={(e) => handleMouseDown(column.id, e)}
              />
            )}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );

  // Render table body
  const renderBody = () => {
    if (loading) {
      return (
        <TableBody>
          {Array.from({ length: tableConfig.pageSize }).map((_, index) => (
            <TableRow key={index} className="animate-pulse">
              {tableConfig.selectable && (
                <TableCell className={densityStyles[tableConfig.density].cell}>
                  <div className="w-4 h-4 bg-[var(--color-bg-secondary)] rounded" />
                </TableCell>
              )}
              {visibleColumns.map((column) => (
                <TableCell key={column.id} className={densityStyles[tableConfig.density].cell}>
                  <div className="h-4 bg-[var(--color-bg-secondary)] rounded w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      );
    }

    if (error) {
      return (
        <TableBody>
          <TableRow>
            <TableCell 
              colSpan={visibleColumns.length + (tableConfig.selectable ? 1 : 0)}
              className="text-center py-8 text-[var(--color-error-main)]"
            >
              {error}
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    if (paginatedData.length === 0) {
      return (
        <TableBody>
          <TableRow>
            <TableCell 
              colSpan={visibleColumns.length + (tableConfig.selectable ? 1 : 0)}
              className="text-center py-8 text-[var(--color-text-secondary)]"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    return (
      <TableBody>
        {paginatedData.map((row, index) => {
          const rowId = getRowId(row);
          const isSelected = selection.selectedRows.has(rowId);
          
          return (
            <TableRow
              key={rowId}
              className={cn(
                "border-b border-[var(--color-border-primary)] transition-colors",
                tableConfig.hover && "hover:bg-[var(--color-bg-secondary)]",
                tableConfig.striped && index % 2 === 1 && "bg-[var(--color-bg-secondary)]/50",
                isSelected && "bg-[var(--color-primary-50)] border-[var(--color-primary-200)]",
                onRowClick && "cursor-pointer",
                rowClassName?.(row, index)
              )}
              onClick={() => onRowClick?.(row, index)}
            >
              {tableConfig.selectable && (
                <TableCell className={densityStyles[tableConfig.density].cell}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleRowSelection(rowId, checked as boolean)}
                    aria-label={`Select row ${index + 1}`}
                  />
                </TableCell>
              )}
              
              {visibleColumns.map((column) => (
                <TableCell
                  key={column.id}
                  className={cn(
                    densityStyles[tableConfig.density].cell,
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.meta?.cellClassName
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth
                  }}
                >
                  {column.cell 
                    ? column.cell(row)
                    : column.accessorKey 
                      ? String(row[column.accessorKey])
                      : null
                  }
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    );
  };

  // Calculate pagination info
  const totalPages = Math.ceil(sortedData.length / tableConfig.pageSize);
  const startIndex = (currentPage - 1) * tableConfig.pageSize + 1;
  const endIndex = Math.min(currentPage * tableConfig.pageSize, sortedData.length);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Bulk Actions */}
      {tableConfig.bulkActions && tableConfig.selectable && (
        <BulkActions
          selectedCount={selection.selectedRows.size}
          actions={bulkActions}
          selectedRows={selectedRowsData}
          onClearSelection={clearSelection}
        />
      )}

      {/* Advanced Filtering */}
      {tableConfig.advancedFiltering && (
        <AdvancedFiltering
          columns={finalColumns}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          data={data}
        />
      )}

      {/* Table Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Search */}
        {tableConfig.showSearch && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
            <Input
              placeholder="Search..."
              value={filtering.global}
              onChange={(e) => setFiltering(prev => ({ ...prev, global: e.target.value }))}
              className="pl-10"
            />
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Column Toggle */}
          {tableConfig.showColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {finalColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={!column.hidden}
                    onCheckedChange={() => toggleColumnVisibility(column.id)}
                  >
                    {column.header}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Density Toggle */}
          {tableConfig.showDensityToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Density
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTableConfig(prev => ({ ...prev, density: 'compact' }))}>
                  Compact
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTableConfig(prev => ({ ...prev, density: 'comfortable' }))}>
                  Comfortable
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTableConfig(prev => ({ ...prev, density: 'spacious' }))}>
                  Spacious
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={cn(
        "rounded-lg border border-[var(--color-border-primary)] overflow-hidden",
        tableConfig.bordered && "border-2"
      )}>
        <div className="overflow-x-auto">
          <Table>
            {renderHeader()}
            {renderBody()}
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {tableConfig.pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-[var(--color-text-secondary)]">
            Showing {startIndex} to {endIndex} of {sortedData.length} results
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
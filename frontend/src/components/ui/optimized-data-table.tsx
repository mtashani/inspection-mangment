"use client";

import React, { 
  memo, 
  useMemo, 
  useCallback, 
  useState, 
  useEffect, 
  useRef,
  forwardRef
} from 'react';
import { FixedSizeList as List, VariableSizeList } from 'react-window';
import { FixedSizeGrid as Grid } from 'react-window';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter,
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw
} from 'lucide-react';

// Types for optimized data table
export interface OptimizedColumn<T = any> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => any;
  cell?: (props: { row: T; value: any; index: number }) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sticky?: 'left' | 'right';
  hidden?: boolean;
  meta?: {
    headerClassName?: string;
    cellClassName?: string;
  };
}

export interface OptimizedTableProps<T = any> {
  data: T[];
  columns: OptimizedColumn<T>[];
  // Virtualization options
  enableVirtualization?: boolean;
  rowHeight?: number | ((index: number) => number);
  overscan?: number;
  // Performance options
  enableMemoization?: boolean;
  enableLazyLoading?: boolean;
  pageSize?: number;
  // Server-side options
  serverSide?: boolean;
  totalRows?: number;
  onFetchData?: (params: {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
    search?: string;
  }) => Promise<{ data: T[]; totalRows: number }>;
  // UI options
  loading?: boolean;
  className?: string;
  onRowClick?: (row: T, index: number) => void;
  onRowSelect?: (selectedRows: T[]) => void;
  selectable?: boolean;
  // Caching options
  enableCaching?: boolean;
  cacheKey?: string;
}

// Cache for table data
const tableCache = new Map<string, {
  data: any;
  timestamp: number;
  ttl: number;
}>();

// Cache utilities
const cacheUtils = {
  set: (key: string, data: any, ttl = 5 * 60 * 1000) => { // 5 minutes default
    tableCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  },
  
  get: (key: string) => {
    const cached = tableCache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      tableCache.delete(key);
      return null;
    }
    
    return cached.data;
  },
  
  clear: (key?: string) => {
    if (key) {
      tableCache.delete(key);
    } else {
      tableCache.clear();
    }
  }
};

// Memoized table row component
interface TableRowProps<T> {
  row: T;
  columns: OptimizedColumn<T>[];
  index: number;
  style?: React.CSSProperties;
  onRowClick?: (row: T, index: number) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

const MemoizedTableRow = memo(<T,>({
  row,
  columns,
  index,
  style,
  onRowClick,
  selectable,
  selected,
  onSelect
}: TableRowProps<T>) => {
  const handleRowClick = useCallback(() => {
    onRowClick?.(row, index);
  }, [row, index, onRowClick]);

  const handleSelect = useCallback((checked: boolean) => {
    onSelect?.(checked);
  }, [onSelect]);

  return (
    <div
      style={style}
      className={cn(
        "flex items-center border-b border-[var(--color-border-primary)]",
        "hover:bg-[var(--color-bg-secondary)] transition-colors",
        onRowClick && "cursor-pointer",
        selected && "bg-[var(--color-primary-50)]"
      )}
      onClick={handleRowClick}
    >
      {selectable && (
        <div className="flex items-center justify-center w-12 px-2">
          <Checkbox
            checked={selected}
            onCheckedChange={handleSelect}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      {columns.filter(col => !col.hidden).map((column) => {
        const value = column.accessorFn 
          ? column.accessorFn(row)
          : column.accessorKey 
            ? (row as any)[column.accessorKey]
            : null;

        return (
          <div
            key={column.id}
            className={cn(
              "flex items-center px-4 py-2 text-sm",
              column.meta?.cellClassName
            )}
            style={{ 
              width: column.width || 'auto',
              minWidth: column.minWidth || 100,
              maxWidth: column.maxWidth || 'none'
            }}
          >
            {column.cell ? column.cell({ row, value, index }) : String(value || '')}
          </div>
        );
      })}
    </div>
  );
}) as <T>(props: TableRowProps<T>) => JSX.Element;

MemoizedTableRow.displayName = 'MemoizedTableRow';

// Virtualized table row component for react-window
const VirtualizedRow = memo(({ index, style, data }: {
  index: number;
  style: React.CSSProperties;
  data: {
    rows: any[];
    columns: OptimizedColumn[];
    onRowClick?: (row: any, index: number) => void;
    selectable?: boolean;
    selectedRows?: Set<number>;
    onRowSelect?: (index: number, selected: boolean) => void;
  };
}) => {
  const { rows, columns, onRowClick, selectable, selectedRows, onRowSelect } = data;
  const row = rows[index];
  const selected = selectedRows?.has(index) || false;

  const handleSelect = useCallback((checked: boolean) => {
    onRowSelect?.(index, checked);
  }, [index, onRowSelect]);

  return (
    <MemoizedTableRow
      row={row}
      columns={columns}
      index={index}
      style={style}
      onRowClick={onRowClick}
      selectable={selectable}
      selected={selected}
      onSelect={handleSelect}
    />
  );
});

VirtualizedRow.displayName = 'VirtualizedRow';

// Main optimized data table component
export function OptimizedDataTable<T = any>({
  data,
  columns,
  enableVirtualization = true,
  rowHeight = 48,
  overscan = 5,
  enableMemoization = true,
  enableLazyLoading = false,
  pageSize = 50,
  serverSide = false,
  totalRows,
  onFetchData,
  loading = false,
  className,
  onRowClick,
  onRowSelect,
  selectable = false,
  enableCaching = true,
  cacheKey
}: OptimizedTableProps<T>) {
  // State management
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map(col => col.id))
  );

  // Refs
  const listRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoized processed data
  const processedData = useMemo(() => {
    if (serverSide) return data;

    let result = [...data];

    // Apply search
    if (searchTerm) {
      result = result.filter(row => {
        return columns.some(column => {
          const value = column.accessorFn 
            ? column.accessorFn(row)
            : column.accessorKey 
              ? (row as any)[column.accessorKey]
              : null;
          
          return String(value || '').toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }

    // Apply filters
    Object.entries(filters).forEach(([columnId, filterValue]) => {
      if (filterValue) {
        const column = columns.find(col => col.id === columnId);
        if (column) {
          result = result.filter(row => {
            const value = column.accessorFn 
              ? column.accessorFn(row)
              : column.accessorKey 
                ? (row as any)[column.accessorKey]
                : null;
            
            return String(value || '').toLowerCase().includes(String(filterValue).toLowerCase());
          });
        }
      }
    });

    // Apply sorting
    if (sortBy) {
      const column = columns.find(col => col.id === sortBy);
      if (column) {
        result.sort((a, b) => {
          const aValue = column.accessorFn 
            ? column.accessorFn(a)
            : column.accessorKey 
              ? (a as any)[column.accessorKey]
              : null;
          
          const bValue = column.accessorFn 
            ? column.accessorFn(b)
            : column.accessorKey 
              ? (b as any)[column.accessorKey]
              : null;

          if (aValue === bValue) return 0;
          
          const comparison = aValue > bValue ? 1 : -1;
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [data, searchTerm, filters, sortBy, sortOrder, columns, serverSide]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (serverSide || !enableLazyLoading) return processedData;
    
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return processedData.slice(start, end);
  }, [processedData, currentPage, pageSize, serverSide, enableLazyLoading]);

  // Visible columns
  const visibleColumnsArray = useMemo(() => {
    return columns.filter(col => visibleColumns.has(col.id));
  }, [columns, visibleColumns]);

  // Server-side data fetching
  useEffect(() => {
    if (serverSide && onFetchData) {
      const fetchData = async () => {
        const cacheKeyWithParams = cacheKey 
          ? `${cacheKey}-${currentPage}-${pageSize}-${sortBy}-${sortOrder}-${JSON.stringify(filters)}-${searchTerm}`
          : null;

        // Check cache first
        if (enableCaching && cacheKeyWithParams) {
          const cached = cacheUtils.get(cacheKeyWithParams);
          if (cached) {
            return;
          }
        }

        try {
          const result = await onFetchData({
            page: currentPage,
            pageSize,
            sortBy,
            sortOrder,
            filters,
            search: searchTerm
          });

          // Cache the result
          if (enableCaching && cacheKeyWithParams) {
            cacheUtils.set(cacheKeyWithParams, result);
          }
        } catch (error) {
          console.error('Failed to fetch table data:', error);
        }
      };

      fetchData();
    }
  }, [currentPage, pageSize, sortBy, sortOrder, filters, searchTerm, serverSide, onFetchData, enableCaching, cacheKey]);

  // Handlers
  const handleSort = useCallback((columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column?.sortable) return;

    if (sortBy === columnId) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnId);
      setSortOrder('asc');
    }
  }, [sortBy, sortOrder, columns]);

  const handleFilter = useCallback((columnId: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [columnId]: value
    }));
    setCurrentPage(0); // Reset to first page
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(0); // Reset to first page
  }, []);

  const handleRowSelect = useCallback((index: number, selected: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(Array.from({ length: paginatedData.length }, (_, i) => i)));
    } else {
      setSelectedRows(new Set());
    }
  }, [paginatedData.length]);

  // Update parent with selected rows
  useEffect(() => {
    if (onRowSelect) {
      const selectedRowsData = Array.from(selectedRows).map(index => paginatedData[index]);
      onRowSelect(selectedRowsData);
    }
  }, [selectedRows, paginatedData, onRowSelect]);

  const totalRowCount = serverSide ? (totalRows || 0) : processedData.length;
  const totalPages = Math.ceil(totalRowCount / pageSize);

  return (
    <Card className={cn("w-full", className)}>
      {/* Table Header with Controls */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">
            Data Table
            {loading && <Loader2 className="w-4 h-4 animate-spin ml-2 inline" />}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 w-64"
              />
            </div>

            {/* Column Visibility */}
            <Select>
              <SelectTrigger className="w-32">
                <Eye className="w-4 h-4 mr-2" />
                Columns
              </SelectTrigger>
              <SelectContent>
                {columns.map(column => (
                  <div key={column.id} className="flex items-center space-x-2 px-2 py-1">
                    <Checkbox
                      checked={visibleColumns.has(column.id)}
                      onCheckedChange={(checked) => {
                        setVisibleColumns(prev => {
                          const newSet = new Set(prev);
                          if (checked) {
                            newSet.add(column.id);
                          } else {
                            newSet.delete(column.id);
                          }
                          return newSet;
                        });
                      }}
                    />
                    <span className="text-sm">{column.header}</span>
                  </div>
                ))}
              </SelectContent>
            </Select>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (enableCaching && cacheKey) {
                  cacheUtils.clear(cacheKey);
                }
                // Trigger refresh
                setCurrentPage(0);
              }}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {visibleColumnsArray
            .filter(col => col.filterable)
            .map(column => (
              <div key={column.id} className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {column.header}:
                </span>
                <Input
                  placeholder={`Filter ${column.header}`}
                  value={filters[column.id] || ''}
                  onChange={(e) => handleFilter(column.id, e.target.value)}
                  className="w-32"
                />
              </div>
            ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Table Header */}
        <div className="flex items-center border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
          {selectable && (
            <div className="flex items-center justify-center w-12 px-2">
              <Checkbox
                checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </div>
          )}
          
          {visibleColumnsArray.map((column) => (
            <div
              key={column.id}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium text-[var(--color-text-primary)]",
                column.sortable && "cursor-pointer hover:bg-[var(--color-bg-tertiary)]",
                column.meta?.headerClassName
              )}
              style={{ 
                width: column.width || 'auto',
                minWidth: column.minWidth || 100,
                maxWidth: column.maxWidth || 'none'
              }}
              onClick={() => column.sortable && handleSort(column.id)}
            >
              <span>{column.header}</span>
              {column.sortable && (
                <div className="ml-2">
                  {sortBy === column.id ? (
                    sortOrder === 'asc' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )
                  ) : (
                    <ArrowUpDown className="w-4 h-4 opacity-50" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Table Body */}
        <div ref={containerRef} className="relative">
          {enableVirtualization && paginatedData.length > 100 ? (
            // Virtualized rendering for large datasets
            <List
              ref={listRef}
              height={Math.min(600, paginatedData.length * (typeof rowHeight === 'number' ? rowHeight : 48))}
              itemCount={paginatedData.length}
              itemSize={typeof rowHeight === 'number' ? rowHeight : 48}
              overscanCount={overscan}
              itemData={{
                rows: paginatedData,
                columns: visibleColumnsArray,
                onRowClick,
                selectable,
                selectedRows,
                onRowSelect: handleRowSelect
              }}
            >
              {VirtualizedRow}
            </List>
          ) : (
            // Regular rendering for smaller datasets
            <div className="max-h-96 overflow-y-auto">
              {paginatedData.map((row, index) => (
                <MemoizedTableRow
                  key={index}
                  row={row}
                  columns={visibleColumnsArray}
                  index={index}
                  onRowClick={onRowClick}
                  selectable={selectable}
                  selected={selectedRows.has(index)}
                  onSelect={(selected) => handleRowSelect(index, selected)}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {paginatedData.length === 0 && !loading && (
            <div className="text-center py-12 text-[var(--color-text-secondary)]">
              <p>No data available</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="absolute inset-0 bg-[var(--color-bg-primary)]/80 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary-600)]" />
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border-primary)]">
            <div className="text-sm text-[var(--color-text-secondary)]">
              Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalRowCount)} of {totalRowCount} results
              {selectedRows.size > 0 && (
                <span className="ml-2">
                  ({selectedRows.size} selected)
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0 || loading}
              >
                Previous
              </Button>
              
              <span className="text-sm">
                Page {currentPage + 1} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1 || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default OptimizedDataTable;
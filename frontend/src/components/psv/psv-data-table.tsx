'use client';

import { useState, useEffect, useMemo, useRef } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { PSV } from "./types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const columns: ColumnDef<PSV>[] = [
  // Default visible columns in specified order
  {
    accessorKey: "tag_number",
    header: "PSV Tag",
    cell: ({ row }) => (
      <div className="max-w-[200px]">
        <Link 
          href={`/psv/${row.getValue("tag_number")}`} 
          className="hover:underline whitespace-nowrap overflow-hidden text-ellipsis block"
          title={row.getValue("tag_number")}
        >
          {row.getValue("tag_number")}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "unique_no",
    header: "Unique No",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant: BadgeVariant = status === "Main" ? "default" : "secondary";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "unit",
    header: "Unit",
    filterFn: (row, id, filterValue) => {
      // Special handling for array filter values (OR condition)
      const value = row.getValue(id) as string;
      if (!value) return false;
      
      // If we have an array of filter values, check if the row value is in that array
      if (Array.isArray(filterValue)) {
        return filterValue.includes(value);
      }
      
      // Default behavior
      return value === filterValue;
    }
  },
  {
    accessorKey: "train",
    header: "Train",
    filterFn: (row, id, filterValue) => {
      // Special handling for array filter values (OR condition)
      const value = row.getValue(id) as string;
      if (!value) return false;
      
      // If we have an array of filter values, check if the row value is in that array
      if (Array.isArray(filterValue)) {
        return filterValue.includes(value);
      }
      
      // Default behavior
      return value === filterValue;
    }
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return type ? type.replace("_", " ").toLowerCase() : '';
    },
    filterFn: (row, id, filterValue) => {
      // Special handling for array filter values (OR condition)
      const value = row.getValue(id) as string;
      if (!value) return false;
      
      // If we have an array of filter values, check if the row value is in that array
      if (Array.isArray(filterValue)) {
        return filterValue.includes(value);
      }
      
      // Default behavior
      return value === filterValue;
    }
  },
  {
    accessorKey: "last_calibration_date",
    header: "Last Calibration",
    cell: ({ row }) => {
      const date = row.getValue("last_calibration_date");
      if (!date) return "Never";
      return new Date(date as string).toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
  },
  {
    accessorKey: "expire_date",
    header: "Next Due",
    cell: ({ row }) => {
      const date = row.getValue("expire_date");
      if (!date) return "N/A";
      const parsedDate = new Date(date as string);
      const today = new Date();
      const daysUntilDue = Math.ceil((parsedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      
      let className = "bg-yellow-50/30 px-2 py-1 rounded-md"; // Light yellow for normal
      
      if (daysUntilDue < 0) {
        className = "bg-red-50 text-red-800 px-2 py-1 rounded-md"; // Red for expired
      } else if (daysUntilDue < 30) {
        className = "bg-yellow-50 text-yellow-800 px-2 py-1 rounded-md"; // Yellow for due soon
      }
      return (
        <span className={className}>
          {parsedDate.toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      );
    },
  },

  // Optional columns (hidden by default)
  {
    accessorKey: "service",
    header: "Service",
  },
  {
    accessorKey: "set_pressure",
    header: "Set Pressure",
    cell: ({ row }) => `${row.getValue("set_pressure")} Barg`,
  },
  {
    accessorKey: "manufacturer",
    header: "Manufacturer",
  },
  {
    accessorKey: "serial_no",
    header: "Serial No",
  },
  {
    accessorKey: "cdtp",
    header: "CDTP",
    cell: ({ row }) => `${row.getValue("cdtp")} Barg`,
  },
  {
    accessorKey: "back_pressure",
    header: "Back Pressure",
    cell: ({ row }) => `${row.getValue("back_pressure")} Barg`,
  },
  {
    accessorKey: "nps",
    header: "NPS",
  },
  {
    accessorKey: "p_and_id",
    header: "P&ID",
  },
  {
    accessorKey: "line_number",
    header: "Line Number",
  },
  {
    accessorKey: "inlet_size",
    header: "Inlet Size",
  },
  {
    accessorKey: "outlet_size",
    header: "Outlet Size",
  }
];

interface PSVDataTableProps {
  data: PSV[];
  onFiltersChange?: (filters: ColumnFiltersState) => void;
}

export function PSVDataTable({ data, onFiltersChange }: PSVDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  // Track the latest filter value for debugging
  const prevFiltersRef = useRef<string>("");
  
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Show only the requested columns by default
    tag_number: true,
    unique_no: true,
    status: true,
    unit: true,
    train: true,
    type: true,
    last_calibration_date: true,
    expire_date: true,
    // Hide other columns by default
    service: false,
    set_pressure: false,
    manufacturer: false,
    serial_no: false,
    cdtp: false,
    back_pressure: false,
    nps: false,
    p_and_id: false,
    line_number: false,
    inlet_size: false,
    outlet_size: false,
  });

  // Use debounce to prevent excessive updates
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create stable columns
  const stableColumns = useMemo(() => columns, []);
  
  // Function to handle filter reset from the toolbar
  const handleResetFilters = () => {
    // Reset our own component state
    setColumnFilters([]);
    
    // Also notify parent component
    if (onFiltersChange) {
      onFiltersChange([]);
    }
    
    console.log("PSV Data Table - All filters reset");
  };
  
  // Notify parent about filter changes (with debounce)
  useEffect(() => {
    if (!onFiltersChange) return;
    
    // Convert filters to string for comparison
    const currentFiltersString = JSON.stringify(columnFilters);
    
    // Only update if the filter value has actually changed
    if (prevFiltersRef.current !== currentFiltersString) {
      console.log('PSV Data Table - Column filters changed:', columnFilters);
      prevFiltersRef.current = currentFiltersString;
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set a new timeout
      timeoutRef.current = setTimeout(() => {
        onFiltersChange(columnFilters);
      }, 300);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [columnFilters, onFiltersChange]);

  const table = useReactTable({
    data,
    columns: stableColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar 
        table={table} 
        resetFilters={handleResetFilters}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No PSVs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}

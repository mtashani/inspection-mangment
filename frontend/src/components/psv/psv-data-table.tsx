'use client';

import { useState } from "react";
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
  },
  {
    accessorKey: "train",
    header: "Train",
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
      
      let variant: BadgeVariant = "default";
      if (daysUntilDue < 0) variant = "destructive";
      else if (daysUntilDue < 30) variant = "secondary";

      return (
        <Badge variant={variant}>
          {parsedDate.toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </Badge>
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
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return type.replace("_", " ").toLowerCase();
    },
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
  showColorCoding?: boolean;
}

export function PSVDataTable({ data, showColorCoding = true }: PSVDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Show only the requested columns by default
    tag_number: true,
    unique_no: true,
    status: true,
    unit: true,
    train: true,
    last_calibration_date: true,
    expire_date: true,
    // Hide other columns by default
    service: false,
    set_pressure: false,
    type: false,
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

  const table = useReactTable({
    data,
    columns,
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

  const getRowClassName = (row: PSV) => {
    if (!showColorCoding) return "";
    
    const today = new Date();
    const expireDate = new Date(row.expire_date);
    const daysUntilDue = Math.ceil((expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      return "bg-red-50 hover:bg-red-100";
    } else if (daysUntilDue < 30) {
      return "bg-yellow-50 hover:bg-yellow-100";
    }
    return "";
  };

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} />
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
                  className={getRowClassName(row.original)}
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

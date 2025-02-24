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
import { getCalibrationStatus, getStatusColor } from "./mock-data";
import Link from "next/link";

// Define columns for the PSV table
const columns: ColumnDef<PSV>[] = [
  {
    accessorKey: "tag",
    header: "PSV Tag",
    cell: ({ row }) => {
      return (
        <Link href={`/psv/${row.original.id}`} className="hover:underline">
          {row.getValue("tag")}
        </Link>
      );
    },
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "unit",
    header: "Unit",
  },
  {
    accessorKey: "lastCalibrationDate",
    header: "Last Calibration",
    cell: ({ row }) => {
      const date = row.getValue("lastCalibrationDate");
      if (!date) return "Never";
      const parsedDate = new Date(date as string);
      return parsedDate.toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
  },
  {
    accessorKey: "nextCalibrationDate",
    header: "Next Calibration",
    cell: ({ row }) => {
      const date = row.getValue("nextCalibrationDate");
      if (!date) return "N/A";
      const parsedDate = new Date(date as string);
      return parsedDate.toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
  },
  {
    accessorKey: "calibrationCount",
    header: "Calibration Count",
  },
  {
    accessorKey: "popPressure",
    header: "Pop Pressure",
    cell: ({ row }) => `${row.getValue("popPressure")} bar`,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return type.replace("_", " ").toLowerCase();
    },
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "testMedium",
    header: "Test Medium",
    cell: ({ row }) => {
      const medium = row.getValue("testMedium") as string;
      return medium.toLowerCase();
    },
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "maxLeakage",
    header: "Max Leakage",
    cell: ({ row }) => `${row.getValue("maxLeakage")} ml/min`,
  },
];

interface PSVDataTableProps {
  data: PSV[];
  showColorCoding: boolean;
}

export function PSVDataTable({ data, showColorCoding }: PSVDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
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
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    showColorCoding
                      ? getStatusColor(getCalibrationStatus(row.original))
                      : undefined
                  }
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
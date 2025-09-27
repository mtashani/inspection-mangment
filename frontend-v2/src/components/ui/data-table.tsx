'use client'

import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Column<T = any> {
  id?: string
  accessorKey?: string
  header: string
  cell?: ({ row }: { row: { getValue: (key: string) => any; original: T } }) => React.ReactNode
}

interface DataTableProps<T = any> {
  columns: Column<T>[]
  data: T[]
  className?: string
  loading?: boolean
  searchable?: boolean
}

export function DataTable<T = any>({ columns, data, className, loading = false }: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={className}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={column.accessorKey || column.id || index}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, index) => (
              <TableRow key={`loading-${index}`}>
                {columns.map((column, colIndex) => (
                  <TableCell key={`loading-${index}-${column.accessorKey || column.id || colIndex}`}>
                    <div className="h-4 bg-muted animate-pulse rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }
  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={column.accessorKey || column.id || index}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length ? (
            data.map((row, index) => {
              // Try to use 'id' field if available, otherwise fall back to index
              const rowKey = (row as any)?.id ?? index
              return (
                <TableRow key={rowKey}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={`${rowKey}-${column.accessorKey || column.id || colIndex}`}>
                      {column.cell ? (
                        column.cell({
                          row: {
                            getValue: (key: string) => row[key as keyof T],
                            original: row,
                          },
                        })
                      ) : (
                        String(row[(column.accessorKey || column.id) as keyof T] || '')
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
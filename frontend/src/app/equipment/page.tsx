'use client'

import { FC, useState } from 'react'
import { ColumnDef } from "@tanstack/react-table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, CircleDashed, AlertCircle } from "lucide-react"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"

interface Equipment {
  id: string
  tag: string
  location: string
  type: string
  riskLevel: 'High' | 'Medium' | 'Low'
  lastInspection: string | null
  nextInspection: string | null
  priority: 'High' | 'Medium' | 'Low'
  status: 'Done' | 'In Progress' | 'Not Started'
}

const priorities = [
  {
    label: "High",
    value: "High",
    icon: AlertCircle,
  },
  {
    label: "Medium",
    value: "Medium",
    icon: AlertCircle,
  },
  {
    label: "Low",
    value: "Low",
    icon: AlertCircle,
  },
]

const statuses = [
  {
    label: "Done",
    value: "Done",
    icon: CheckCircle,
  },
  {
    label: "In Progress",
    value: "In Progress",
    icon: CircleDashed,
  },
  {
    label: "Not Started",
    value: "Not Started",
    icon: CircleDashed,
  },
]

const EquipmentPage: FC = () => {
  // Define the date range state with an explicit type
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: undefined
  })

  // Mock data - will be replaced with API calls
  const equipments: Equipment[] = [
    {
      id: "1",
      tag: "TK-101",
      location: "Unit-3",
      type: "Tank",
      riskLevel: "High",
      lastInspection: null,
      nextInspection: "2024-03-01",
      priority: "High",
      status: "Not Started"
    },
    {
      id: "2", 
      tag: "PP-102",
      location: "Unit-12",
      type: "Pump",
      riskLevel: "Low",
      lastInspection: "2023-12-01",
      nextInspection: "2024-12-01",
      priority: "Medium",
      status: "In Progress"
    }
  ]

  const columns: ColumnDef<Equipment>[] = [
    {
      accessorKey: "tag",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tag" />
      ),
    },
    {
      accessorKey: "location",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Location" />
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = statuses.find(
          (status) => status.value === row.getValue("status")
        )

        if (!status) {
          return null
        }

        return (
          <div className="flex items-center">
            {status.icon && (
              <status.icon className={cn(
                "mr-2 h-4 w-4",
                status.value === "Done" && "text-green-500",
                status.value === "In Progress" && "text-blue-500",
                status.value === "Not Started" && "text-gray-500"
              )} />
            )}
            <span>{status.label}</span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Priority" />
      ),
      cell: ({ row }) => {
        const priority = priorities.find(
          (priority) => priority.value === row.getValue("priority")
        )

        if (!priority) {
          return null
        }

        return (
          <div className="flex items-center">
            {priority.icon && (
              <priority.icon className={cn(
                "mr-2 h-4 w-4",
                priority.value === "High" && "text-red-500",
                priority.value === "Medium" && "text-yellow-500",
                priority.value === "Low" && "text-green-500"
              )} />
            )}
            <span>{priority.label}</span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "lastInspection",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Inspection" />
      ),
      cell: ({ row }) => row.getValue("lastInspection") || "Not inspected"
    },
    {
      accessorKey: "nextInspection",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Next Inspection" />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = `/equipment/${row.original.id}`}
          >
            View Details
          </Button>
          <Button variant="outline" size="sm">Inspect</Button>
        </div>
      )
    }
  ]

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Equipment Management</h1>
      
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={equipments}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            filterColumn="tag"
            statusOptions={statuses}
            priorityOptions={priorities}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default EquipmentPage
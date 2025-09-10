'use client'

import { useState, useMemo } from 'react'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Equipment, EquipmentStatus, RiskLevel } from '@/types/equipment'

export interface EnhancedEquipmentTableProps {
  equipment: Equipment[]
  isLoading?: boolean
  onViewEquipment: (equipmentId: string) => void
  onEditEquipment: (equipmentId: string) => void
  onExportData: (format: 'csv' | 'excel' | 'pdf') => void
  className?: string
}

type SortField = 'tagNumber' | 'name' | 'status' | 'riskLevel' | 'lastInspection' | 'nextInspection'
type SortDirection = 'asc' | 'desc'

export function EnhancedEquipmentTable({
  equipment,
  isLoading = false,
  onViewEquipment,
  onEditEquipment,
  onExportData,
  className
}: EnhancedEquipmentTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('tagNumber')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all')
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [visibleColumns, setVisibleColumns] = useState({
    tagNumber: true,
    name: true,
    type: true,
    status: true,
    riskLevel: true,
    location: true,
    lastInspection: true,
    nextInspection: true,
    actions: true
  })

  // Filter and sort equipment
  const filteredAndSortedEquipment = useMemo(() => {
    let filtered = equipment

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(eq =>
        eq.tagNumber.toLowerCase().includes(query) ||
        eq.name.toLowerCase().includes(query) ||
        eq.type.toLowerCase().includes(query) ||
        eq.location.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(eq => eq.status === statusFilter)
    }

    // Apply risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(eq => eq.riskLevel === riskFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Handle date fields
      if (sortField === 'lastInspection' || sortField === 'nextInspection') {
        aValue = aValue ? new Date(aValue).getTime() : 0
        bValue = bValue ? new Date(bValue).getTime() : 0
      }

      // Handle string fields
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [equipment, searchQuery, statusFilter, riskFilter, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedEquipment.length / pageSize)
  const paginatedEquipment = filteredAndSortedEquipment.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Get status color and icon
  const getStatusDisplay = (status: EquipmentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircleIcon className="h-3 w-3" />
        }
      case 'INACTIVE':
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <XCircleIcon className="h-3 w-3" />
        }
      case 'MAINTENANCE':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: <ClockIcon className="h-3 w-3" />
        }
      case 'OUT_OF_SERVICE':
        return {
          color: 'bg-red-100 text-red-800',
          icon: <XCircleIcon className="h-3 w-3" />
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <InformationCircleIcon className="h-3 w-3" />
        }
    }
  }

  // Get risk level color and icon
  const getRiskDisplay = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case 'LOW':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircleIcon className="h-3 w-3" />
        }
      case 'MEDIUM':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: <ExclamationTriangleIcon className="h-3 w-3" />
        }
      case 'HIGH':
        return {
          color: 'bg-red-100 text-red-800',
          icon: <ExclamationTriangleIcon className="h-3 w-3" />
        }
      case 'CRITICAL':
        return {
          color: 'bg-red-200 text-red-900',
          icon: <ExclamationTriangleIcon className="h-3 w-3" />
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <InformationCircleIcon className="h-3 w-3" />
        }
    }
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Check if inspection is overdue
  const isInspectionOverdue = (nextInspectionDate?: string) => {
    if (!nextInspectionDate) return false
    return new Date(nextInspectionDate) < new Date()
  }

  // Render sort header
  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUpIcon className="h-3 w-3" /> : 
            <ChevronDownIcon className="h-3 w-3" />
        )}
      </div>
    </Button>
  )

  if (isLoading) {
    return <EquipmentTableSkeleton />
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Equipment Management</CardTitle>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onExportData('csv')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExportData('excel')}>
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExportData('pdf')}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search equipment..."
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
            </SelectContent>
          </Select>

          {/* Risk Filter */}
          <Select value={riskFilter} onValueChange={(value) => setRiskFilter(value as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FunnelIcon className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(visibleColumns).map(([key, visible]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={visible}
                  onCheckedChange={(checked) =>
                    setVisibleColumns(prev => ({ ...prev, [key]: checked }))
                  }
                >
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {/* Results Summary */}
        <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
          <span>
            Showing {paginatedEquipment.length} of {filteredAndSortedEquipment.length} equipment
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
          <div className="flex items-center space-x-2">
            <span>Show</span>
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(Number(value))
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>per page</span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.tagNumber && (
                  <TableHead>
                    <SortHeader field="tagNumber">Tag Number</SortHeader>
                  </TableHead>
                )}
                {visibleColumns.name && (
                  <TableHead>
                    <SortHeader field="name">Name</SortHeader>
                  </TableHead>
                )}
                {visibleColumns.type && (
                  <TableHead>Type</TableHead>
                )}
                {visibleColumns.status && (
                  <TableHead>
                    <SortHeader field="status">Status</SortHeader>
                  </TableHead>
                )}
                {visibleColumns.riskLevel && (
                  <TableHead>
                    <SortHeader field="riskLevel">Risk Level</SortHeader>
                  </TableHead>
                )}
                {visibleColumns.location && (
                  <TableHead>Location</TableHead>
                )}
                {visibleColumns.lastInspection && (
                  <TableHead>
                    <SortHeader field="lastInspection">Last Inspection</SortHeader>
                  </TableHead>
                )}
                {visibleColumns.nextInspection && (
                  <TableHead>
                    <SortHeader field="nextInspection">Next Inspection</SortHeader>
                  </TableHead>
                )}
                {visibleColumns.actions && (
                  <TableHead>Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEquipment.length > 0 ? (
                paginatedEquipment.map((eq) => {
                  const statusDisplay = getStatusDisplay(eq.status)
                  const riskDisplay = getRiskDisplay(eq.riskLevel)
                  const isOverdue = isInspectionOverdue(eq.nextInspectionDate)

                  return (
                    <TableRow key={eq.id} className="hover:bg-muted/50">
                      {visibleColumns.tagNumber && (
                        <TableCell className="font-medium">
                          {eq.tagNumber}
                        </TableCell>
                      )}
                      {visibleColumns.name && (
                        <TableCell>
                          <div>
                            <div className="font-medium">{eq.name}</div>
                            {eq.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {eq.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.type && (
                        <TableCell>
                          <Badge variant="outline">{eq.type}</Badge>
                        </TableCell>
                      )}
                      {visibleColumns.status && (
                        <TableCell>
                          <Badge className={cn('text-xs', statusDisplay.color)}>
                            <div className="flex items-center space-x-1">
                              {statusDisplay.icon}
                              <span>{eq.status.replace('_', ' ')}</span>
                            </div>
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.riskLevel && (
                        <TableCell>
                          <Badge className={cn('text-xs', riskDisplay.color)}>
                            <div className="flex items-center space-x-1">
                              {riskDisplay.icon}
                              <span>{eq.riskLevel}</span>
                            </div>
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.location && (
                        <TableCell>{eq.location}</TableCell>
                      )}
                      {visibleColumns.lastInspection && (
                        <TableCell>{formatDate(eq.lastInspectionDate)}</TableCell>
                      )}
                      {visibleColumns.nextInspection && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{formatDate(eq.nextInspectionDate)}</span>
                            {isOverdue && (
                              <Badge variant="destructive" className="text-xs">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewEquipment(eq.id)}
                              className="h-8 w-8 p-0"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditEquipment(eq.id)}
                              className="h-8 w-8 p-0"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={Object.values(visibleColumns).filter(Boolean).length}
                    className="text-center py-8"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <InformationCircleIcon className="h-8 w-8 text-muted-foreground" />
                      <div className="text-muted-foreground">
                        {searchQuery || statusFilter !== 'all' || riskFilter !== 'all'
                          ? 'No equipment found matching your filters'
                          : 'No equipment available'
                        }
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
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
      </CardContent>
    </Card>
  )
}

// Loading Skeleton Component
function EquipmentTableSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="rounded-md border">
            <div className="p-4 space-y-3">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export type { EnhancedEquipmentTableProps }
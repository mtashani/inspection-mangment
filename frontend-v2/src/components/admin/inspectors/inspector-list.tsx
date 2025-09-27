'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, MoreHorizontal, Edit, Trash2, Users, Eye, Shield, Clock, Settings, FileText, Award } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

import { Inspector, InspectorFilters, AdminPaginatedResponse } from '@/types/admin'
import { getInspectors } from '@/lib/api/admin/inspectors'
import { InspectorFiltersComponent } from './inspector-filters'
import { BulkOperations } from './bulk-operations'
import { useDebounce } from '@/hooks/use-debounce'
import { Checkbox } from '@radix-ui/react-checkbox'
import { CreateInspectorModal } from './create-inspector-modal'
import { EditInspectorModal } from './edit-inspector-modal'

interface InspectorListProps {
  onEdit?: (inspector: Inspector) => void
  onDelete?: (inspector: Inspector) => void
}

export function InspectorList({ onEdit, onDelete }: InspectorListProps) {
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<InspectorFilters>({})
  const [selectedInspectors, setSelectedInspectors] = useState<Inspector[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingInspector, setEditingInspector] = useState<Inspector | null>(null)

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Combine search term with filters
  const queryFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearchTerm || undefined
  }), [filters, debouncedSearchTerm])

  const {
    data: inspectorsResponse,
    isLoading,
    error,
    refetch
  } = useQuery<AdminPaginatedResponse<Inspector>>({
    queryKey: ['inspectors', page, queryFilters],
    queryFn: () => getInspectors(page, 20, queryFilters),
    placeholderData: (previousData) => previousData
  })

  const handleSpecialtyUpdate = () => {
    refetch()
    toast({
      title: 'Success',
      description: 'Inspector information updated successfully'
    })
  }

  const handleSelectInspector = (inspector: Inspector, checked: boolean) => {
    if (checked) {
      setSelectedInspectors(prev => [...prev, inspector])
    } else {
      setSelectedInspectors(prev => prev.filter(i => i.id !== inspector.id))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked && inspectorsResponse?.data) {
      setSelectedInspectors(inspectorsResponse.data)
    } else {
      setSelectedInspectors([])
    }
  }

  const handleBulkOperationComplete = () => {
    setSelectedInspectors([])
    refetch()
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading inspectors: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Inspector Management
            </CardTitle>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Inspector
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <InspectorFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Bulk Operations */}
          <div className="flex items-center justify-between mb-4">
            <BulkOperations
              selectedInspectors={selectedInspectors}
              onSelectionChange={setSelectedInspectors}
              onOperationComplete={handleBulkOperationComplete}
            />
          </div>

          {/* Inspector Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedInspectors.length === inspectorsResponse?.data?.length && inspectorsResponse?.data?.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : !inspectorsResponse?.data || inspectorsResponse.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No inspectors found. {searchTerm || Object.keys(filters).length > 0 ? 'Try adjusting your search or filters.' : 'Create your first inspector to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  inspectorsResponse.data.map((inspector: Inspector) => (
                    <TableRow key={inspector.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedInspectors.some(i => i.id === inspector.id)}
                          onCheckedChange={(checked) => handleSelectInspector(inspector, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium">{inspector.name}</div>
                            <div className="text-sm text-gray-500">{inspector.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {inspector.employeeId}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{inspector.yearsExperience}</span> years
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={inspector.active ? 'default' : 'secondary'}
                          className={inspector.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        >
                          {inspector.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={inspector.canLogin ? 'default' : 'secondary'}
                          className={inspector.canLogin ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}
                        >
                          {inspector.canLogin ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {inspector.lastLoginAt
                            ? new Date(inspector.lastLoginAt).toLocaleDateString()
                            : 'Never'
                          }
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/inspectors/${inspector.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingInspector(inspector)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Inspector
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/inspectors/${inspector.id}?tab=roles`}>
                                <Shield className="mr-2 h-4 w-4" />
                                Manage Roles
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/inspectors/${inspector.id}/work-cycle`}>
                                <Clock className="mr-2 h-4 w-4" />
                                Work Cycles
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/inspectors/${inspector.id}/documents`}>
                                <FileText className="mr-2 h-4 w-4" />
                                Manage Documents
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/inspectors/${inspector.id}/certificates`}>
                                <Award className="mr-2 h-4 w-4" />
                                Manage Certificates
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onDelete?.(inspector)
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Inspector
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {inspectorsResponse && inspectorsResponse.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, inspectorsResponse.pagination.total)} of {inspectorsResponse.pagination.total} inspectors
                {selectedInspectors.length > 0 && (
                  <span className="ml-2">• {selectedInspectors.length} selected</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    setPage(page - 1)
                  }}
                  disabled={page === 1}
                  type="button"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    setPage(page + 1)
                  }}
                  disabled={page >= inspectorsResponse.pagination.totalPages}
                  type="button"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Inspector Modal */}
      <CreateInspectorModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => {
          refetch()
          toast({
            title: 'Success',
            description: 'Inspector created successfully'
          })
        }}
      />

      {/* Edit Inspector Modal */}
      <EditInspectorModal
        inspector={editingInspector || undefined}
        open={!!editingInspector}
        onOpenChange={(open) => !open && setEditingInspector(null)}
        onSuccess={() => {
          refetch()
          setEditingInspector(null)
          toast({
            title: 'Success',
            description: 'Inspector updated successfully'
          })
        }}
      />
    </div>
  )
}
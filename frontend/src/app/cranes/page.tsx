'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crane, fetchCranes, updateCraneStatus } from '@/api/cranes';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { ROUTES } from '@/config/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontalIcon } from 'lucide-react';

export default function CranesPage() {
  const router = useRouter();
  const [cranes, setCranes] = useState<Crane[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [craneTypeFilter, setCraneTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadCranes();
  }, []);

  const loadCranes = async () => {
    try {
      setLoading(true);
      const data = await fetchCranes();
      setCranes(data);
      setError(null);
    } catch (err) {
      console.error('Error loading cranes:', err);
      setError('Failed to load crane data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (craneId: number, newStatus: 'Active' | 'UnderMaintenance' | 'Decommissioned') => {
    try {
      await updateCraneStatus(craneId, newStatus);
      // Update the local state to reflect the change
      setCranes(cranes.map(crane => 
        crane.id === craneId ? { ...crane, status: newStatus } : crane
      ));
    } catch (err) {
      console.error('Error updating crane status:', err);
      setError('Failed to update crane status. Please try again later.');
    }
  };

  // Filter cranes based on selected filters
  const filteredCranes = cranes.filter(crane => {
    const matchesCraneType = craneTypeFilter === 'all' || crane.crane_type === craneTypeFilter;
    const matchesStatus = statusFilter === 'all' || crane.status === statusFilter;
    return matchesCraneType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="secondary">Active</Badge>;
      case 'UnderMaintenance':
        return <Badge variant="outline">Under Maintenance</Badge>;
      case 'Decommissioned':
        return <Badge variant="destructive">Decommissioned</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const isInspectionOverdue = (nextInspectionDate: string | null) => {
    if (!nextInspectionDate) return false;
    return new Date(nextInspectionDate) < new Date();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Crane Management</h1>
          <p className="text-muted-foreground">View and manage all cranes</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={ROUTES.CRANES.DASHBOARD}>Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href={ROUTES.CRANES.NEW}>Add New Crane</Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="w-60">
            <Select
              value={craneTypeFilter}
              onValueChange={setCraneTypeFilter}
            >
              <SelectTrigger id="crane-type">
                <SelectValue placeholder="Filter by crane type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Overhead">Overhead</SelectItem>
                <SelectItem value="Mobile">Mobile</SelectItem>
                <SelectItem value="Gantry">Gantry</SelectItem>
                <SelectItem value="Jib">Jib</SelectItem>
                <SelectItem value="Bridge">Bridge</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-60">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="UnderMaintenance">Under Maintenance</SelectItem>
                <SelectItem value="Decommissioned">Decommissioned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Inspection</TableHead>
                <TableHead>Next Inspection</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">Loading...</TableCell>
                </TableRow>
              ) : filteredCranes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">No cranes found</TableCell>
                </TableRow>
              ) : (
                filteredCranes.map((crane) => (
                  <TableRow key={crane.id}>
                    <TableCell className="font-medium">
                      <Link 
                        href={ROUTES.CRANES.DETAIL(crane.id)} 
                        className="text-blue-600 hover:underline"
                      >
                        {crane.tag_number}
                      </Link>
                    </TableCell>
                    <TableCell>{crane.crane_type}</TableCell>
                    <TableCell>{crane.location}</TableCell>
                    <TableCell>
                      {crane.current_allowed_capacity} / {crane.nominal_capacity} ton
                      {crane.current_allowed_capacity < crane.nominal_capacity && (
                        <Badge variant="outline" className="ml-2">Reduced</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(crane.status)}</TableCell>
                    <TableCell>
                      {crane.last_inspection_date 
                        ? new Date(crane.last_inspection_date).toLocaleDateString()
                        : 'Not inspected'}
                    </TableCell>
                    <TableCell>
                      {crane.next_inspection_date ? (
                        <>
                          {new Date(crane.next_inspection_date).toLocaleDateString()}
                          {isInspectionOverdue(crane.next_inspection_date) && (
                            <Badge variant="destructive" className="ml-2">Overdue</Badge>
                          )}
                        </>
                      ) : (
                        'Not scheduled'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontalIcon className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(ROUTES.CRANES.DETAIL(crane.id))}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/crane-inspections/new?craneId=${crane.id}`)}>
                            New Inspection
                          </DropdownMenuItem>
                          {crane.status !== 'Active' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(crane.id, 'Active')}>
                              Mark as Active
                            </DropdownMenuItem>
                          )}
                          {crane.status !== 'UnderMaintenance' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(crane.id, 'UnderMaintenance')}>
                              Mark as Under Maintenance
                            </DropdownMenuItem>
                          )}
                          {crane.status !== 'Decommissioned' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(crane.id, 'Decommissioned')}>
                              Mark as Decommissioned
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
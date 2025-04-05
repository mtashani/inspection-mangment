'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Crane, CraneInspection, fetchCrane, fetchCraneInspections, updateCraneStatus } from '@/api/cranes';
import { ROUTES } from '@/config/constants';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import Image from 'next/image';

export default function CraneDetailsPage() {
  const params = useParams();
  const craneId = Number(params.id);

  const [crane, setCrane] = useState<Crane | null>(null);
  const [inspections, setInspections] = useState<CraneInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  useEffect(() => {
    const loadCraneData = async () => {
      if (isNaN(craneId)) {
        setError('Invalid crane ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [craneData, inspectionsData] = await Promise.all([
          fetchCrane(craneId),
          fetchCraneInspections(craneId)
        ]);
        
        setCrane(craneData);
        setInspections(inspectionsData);
        setError(null);
      } catch (err) {
        console.error('Error loading crane data:', err);
        setError('Failed to load crane details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadCraneData();
  }, [craneId]);

  const handleStatusChange = async (newStatus: 'Active' | 'UnderMaintenance' | 'Decommissioned') => {
    if (!crane) return;
    
    try {
      setStatusUpdateLoading(true);
      const updatedCrane = await updateCraneStatus(craneId, newStatus);
      setCrane(updatedCrane);
    } catch (err) {
      console.error('Error updating crane status:', err);
      setError('Failed to update crane status. Please try again later.');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const isInspectionOverdue = (nextInspectionDate: string | null) => {
    if (!nextInspectionDate) return false;
    return new Date(nextInspectionDate) < new Date();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="text-muted-foreground">Loading crane details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="mt-6">
          <Button asChild>
            <Link href={ROUTES.CRANES.LIST}>Back to Cranes</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!crane) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Crane not found</AlertDescription>
        </Alert>

        <div className="mt-6">
          <Button asChild>
            <Link href={ROUTES.CRANES.LIST}>Back to Cranes</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{crane.tag_number}</h1>
            {getStatusBadge(crane.status)}
          </div>
          <p className="text-muted-foreground">{crane.crane_type} Crane - {crane.location}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={ROUTES.CRANES.LIST}>Back to Cranes</Link>
          </Button>
          <Button asChild>
            <Link href={`/crane-inspections/new?craneId=${craneId}`}>
              New Inspection
            </Link>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Crane Details</TabsTrigger>
          <TabsTrigger value="inspections">Inspection History</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Crane Information</CardTitle>
              <CardDescription>Details and specifications of the crane</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">General Information</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between border-b py-1">
                      <span className="text-muted-foreground">Tag Number</span>
                      <span className="font-medium">{crane.tag_number}</span>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium">{crane.crane_type}</span>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <span className="text-muted-foreground">Status</span>
                      <span>{getStatusBadge(crane.status)}</span>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{crane.location}</span>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <span className="text-muted-foreground">Risk Level</span>
                      <span className="font-medium">{crane.risk_level}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Installation Date</span>
                      <span className="font-medium">{formatDate(crane.installation_date)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium">Specifications</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between border-b py-1">
                      <span className="text-muted-foreground">Manufacturer</span>
                      <span className="font-medium">{crane.manufacturer}</span>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <span className="text-muted-foreground">Model</span>
                      <span className="font-medium">{crane.model}</span>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <span className="text-muted-foreground">Serial Number</span>
                      <span className="font-medium">{crane.serial_number}</span>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <span className="text-muted-foreground">Nominal Capacity</span>
                      <span className="font-medium">{crane.nominal_capacity} tons</span>
                    </div>
                    <div className="flex justify-between border-b py-1 items-center">
                      <span className="text-muted-foreground">Current Allowed Capacity</span>
                      <span className="font-medium flex items-center">
                        {crane.current_allowed_capacity} tons
                        {crane.current_allowed_capacity < crane.nominal_capacity && (
                          <Badge variant="outline" className="ml-2">Reduced</Badge>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span className="font-medium">{formatDate(crane.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Inspection Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between border-b py-1">
                    <span className="text-muted-foreground">Last Inspection</span>
                    <span className="font-medium">
                      {crane.last_inspection_date
                        ? formatDate(crane.last_inspection_date)
                        : 'Not yet inspected'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b py-1 items-center">
                    <span className="text-muted-foreground">Next Inspection</span>
                    <span className="font-medium flex items-center">
                      {crane.next_inspection_date ? (
                        <>
                          {formatDate(crane.next_inspection_date)}
                          {isInspectionOverdue(crane.next_inspection_date) && (
                            <Badge variant="destructive" className="ml-2">Overdue</Badge>
                          )}
                        </>
                      ) : (
                        'Not scheduled'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="flex flex-col w-full gap-4">
                <h3 className="font-medium">Status Management</h3>
                <div className="flex flex-wrap gap-2">
                  {crane.status !== 'Active' && (
                    <Button 
                      variant="secondary" 
                      onClick={() => handleStatusChange('Active')}
                      disabled={statusUpdateLoading}
                    >
                      Mark as Active
                    </Button>
                  )}
                  
                  {crane.status !== 'UnderMaintenance' && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleStatusChange('UnderMaintenance')}
                      disabled={statusUpdateLoading}
                    >
                      Mark as Under Maintenance
                    </Button>
                  )}
                  
                  {crane.status !== 'Decommissioned' && (
                    <Button 
                      variant="destructive" 
                      onClick={() => handleStatusChange('Decommissioned')}
                      disabled={statusUpdateLoading}
                    >
                      Mark as Decommissioned
                    </Button>
                  )}
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="inspections" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Inspection History</CardTitle>
                <CardDescription>Past inspections and their findings</CardDescription>
              </div>
              <Button asChild>
                <Link href={`/crane-inspections/new?craneId=${craneId}`}>
                  Add Inspection
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {inspections.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  No inspections recorded yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Inspector</TableHead>
                      <TableHead>Allowed Capacity</TableHead>
                      <TableHead>Next Due</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspections.map((inspection) => (
                      <TableRow key={inspection.id}>
                        <TableCell>
                          {formatDate(inspection.inspection_date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            inspection.status === 'PASS' ? 'secondary' : 
                            inspection.status === 'FAIL' ? 'destructive' : 
                            'outline'
                          }>
                            {inspection.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {inspection.performed_by}
                        </TableCell>
                        <TableCell>
                          {inspection.allowed_capacity} tons
                          {inspection.allowed_capacity < crane.nominal_capacity && (
                            <Badge variant="outline" className="ml-2">Reduced</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(inspection.next_inspection_date)}
                          {isInspectionOverdue(inspection.next_inspection_date) && (
                            <Badge variant="destructive" className="ml-2">Overdue</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {inspection.certificate_image_path && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedCertificate(inspection.certificate_image_path)}
                              >
                                View Certificate
                              </Button>
                            )}
                            {inspection.report_file_path && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={inspection.report_file_path} target="_blank">
                                  Report
                                </Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          {/* Inspection details dialog */}
          <Dialog open={!!selectedCertificate} onOpenChange={(open) => !open && setSelectedCertificate(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Inspection Certificate</DialogTitle>
              </DialogHeader>
              {selectedCertificate && (
                <div className="relative h-[60vh] w-full">
                  <Image
                    src={selectedCertificate}
                    alt="Inspection Certificate"
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedCertificate(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Certificates</CardTitle>
              <CardDescription>Certificates from all inspections</CardDescription>
            </CardHeader>
            <CardContent>
              {inspections.filter(i => i.certificate_image_path).length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  No certificates available
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inspections
                    .filter(i => i.certificate_image_path)
                    .map((inspection) => (
                      <div 
                        key={inspection.id} 
                        className="border rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => setSelectedCertificate(inspection.certificate_image_path)}
                      >
                        <div className="relative h-40 w-full bg-muted">
                          {inspection.certificate_image_path && (
                            <Image
                              src={inspection.certificate_image_path}
                              alt={`Certificate from ${formatDate(inspection.inspection_date)}`}
                              layout="fill"
                              objectFit="cover"
                            />
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium">Inspection on {formatDate(inspection.inspection_date)}</h4>
                          <p className="text-sm text-muted-foreground">
                            By {inspection.performed_by}
                          </p>
                          <div className="mt-2">
                            <Badge variant={
                              inspection.status === 'PASS' ? 'secondary' : 
                              inspection.status === 'FAIL' ? 'destructive' : 
                              'outline'
                            }>
                              {inspection.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
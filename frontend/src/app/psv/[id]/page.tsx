'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { PSVCalibrationDialog } from "@/components/psv/psv-calibration-dialog";
import { CalibrationCertificate } from "@/components/psv/calibration-certificate";
import { format } from "date-fns";
import { Loader2, Printer } from "lucide-react";
import { fetchPSVById, fetchCalibrations } from '@/api/psv';
import { PSV, Calibration, CalibrationStatus } from '@/components/psv/types';

export default function PSVDetailsPage() {
  const params = useParams();
  const [psv, setPsv] = useState<PSV | null>(null);
  const [calibrations, setCalibrations] = useState<Calibration[]>([]);
  const [loading, setLoading] = useState(true);
  const [calibrationsLoading, setCalibrationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calibrationsError, setCalibrationsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCalibrations() {
      if (!psv) return;
      try {
        setCalibrationsLoading(true);
        setCalibrationsError(null);
        const data = await fetchCalibrations(psv.tag_number);
        setCalibrations(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load calibration history';
        console.error('Error loading calibrations:', err);
        setCalibrationsError(errorMessage);
      } finally {
        setCalibrationsLoading(false);
      }
    }

    if (psv) {
      loadCalibrations();
    }
  }, [psv]);

  useEffect(() => {
    async function loadPSV() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPSVById(params.id as string);
        setPsv(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PSV');
        console.error('Error loading PSV:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPSV();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-2">Error: {error}</div>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!psv) {
    return <div className="p-8">PSV not found</div>;
  }

  const getCalibrationStatus = (psv: PSV): CalibrationStatus => {
    if (!psv.last_calibration_date) return "NEVER_CALIBRATED";
    const now = new Date();
    const expireDate = new Date(psv.expire_date);
    const monthUntilExpire = (expireDate.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000);
    
    if (expireDate < now) return "OVERDUE";
    if (monthUntilExpire <= 1) return "DUE_SOON";
    return "COMPLIANT";
  };

  const status = getCalibrationStatus(psv);
  const statusColor = {
    OVERDUE: "text-red-500",
    DUE_SOON: "text-yellow-500",
    COMPLIANT: "text-green-500",
    NEVER_CALIBRATED: "text-red-500"
  }[status];

  return (
    <div className="container mx-auto py-6">
      {/* PSV Details */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Basic Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Tag Number:</span>
                <span className="ml-2">{psv.tag_number}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Unique No:</span>
                <span className="ml-2">{psv.unique_no}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Unit/Train:</span>
                <span className="ml-2">{psv.unit} / {psv.train}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Technical Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Set Pressure:</span>
                <span className="ml-2">{psv.set_pressure} barg</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="ml-2">{psv.type}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Service:</span>
                <span className="ml-2">{psv.service}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Calibration Status</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className={`ml-2 ${statusColor}`}>{status}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Last Calibration:</span>
                <span className="ml-2">
                  {psv.last_calibration_date
                    ? format(new Date(psv.last_calibration_date), 'PPP')
                    : 'Never'}
                </span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Next Due:</span>
                <span className="ml-2">
                  {psv.expire_date
                    ? format(new Date(psv.expire_date), 'PPP')
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Details Card */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Size Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">NPS:</span>
                <span className="ml-2">{psv.nps}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Inlet:</span>
                <span className="ml-2">{psv.inlet_size} / {psv.inlet_rating}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Outlet:</span>
                <span className="ml-2">{psv.outlet_size} / {psv.outlet_rating}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Pressure Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Back Pressure:</span>
                <span className="ml-2">{psv.back_pressure} barg</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">CDTP:</span>
                <span className="ml-2">{psv.cdtp} barg</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Documentation</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">P&ID:</span>
                <span className="ml-2">{psv.p_and_id}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Line Number:</span>
                <span className="ml-2">{psv.line_number}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Data Sheet:</span>
                <span className="ml-2">{psv.data_sheet_no}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Manufacturer Info */}
      <Card className="p-6 mb-6">
        <div className="space-y-2">
          <h3 className="font-semibold">Manufacturing Information</h3>
          <div>
            <span className="text-sm text-muted-foreground">Manufacturer:</span>
            <span className="ml-2">{psv.manufacturer}</span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Serial Number:</span>
            <span className="ml-2">{psv.serial_no}</span>
          </div>
        </div>
      </Card>

      {/* TODO: Add Calibration History section once the API is ready */}
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Calibration History</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add New Calibration</Button>
          </DialogTrigger>
          <DialogContent>
            <PSVCalibrationDialog 
              psv={psv}
              onCalibrationComplete={() => window.location.reload()}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Work Order</TableHead>
              <TableHead>Maintenance</TableHead>
              <TableHead>Test Medium</TableHead>
              <TableHead>Pre-Pop Test</TableHead>
              <TableHead>Post-Pop Test</TableHead>
              <TableHead>Pre-Leak Test</TableHead>
              <TableHead>Post-Leak Test</TableHead>
              <TableHead>Inspector</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calibrationsLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading calibration history...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : calibrationsError ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <div className="text-center">
                    <div className="text-red-500 mb-2">{calibrationsError}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (psv) {
                          setCalibrationsLoading(true);
                          setCalibrationsError(null);
                          fetchCalibrations(psv.tag_number)
                            .then(setCalibrations)
                            .catch(err => setCalibrationsError(err.message))
                            .finally(() => setCalibrationsLoading(false));
                        }
                      }}
                    >
                      Retry Loading
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : calibrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  No calibration history available
                </TableCell>
              </TableRow>
            ) : (
              calibrations.map((cal) => (
                <TableRow key={cal.id}>
                  <TableCell>
                    {format(new Date(cal.calibration_date), 'PPP')}
                  </TableCell>
                  <TableCell>{cal.work_no}</TableCell>
                  <TableCell>{cal.work_maintenance}</TableCell>
                  <TableCell>{cal.test_medium}</TableCell>
                  <TableCell>{cal.pre_repair_pop_test?.toFixed(2) || '-'}</TableCell>
                  <TableCell>{cal.post_repair_pop_test.toFixed(2)}</TableCell>
                  <TableCell>{cal.pre_repair_leak_test?.toFixed(2) || '-'}</TableCell>
                  <TableCell>{cal.post_repair_leak_test.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Inspector: {cal.inspector}</div>
                      <div>Operator: {cal.test_operator}</div>
                      <div>Approver: {cal.approved_by}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Print Certificate"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <CalibrationCertificate psv={psv} calibration={cal} />
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
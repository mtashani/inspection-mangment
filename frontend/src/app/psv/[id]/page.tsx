'use client';

import { useParams } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockPSVs, mockCalibrations, getCalibrationStatus } from "@/components/psv/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { PSVCalibrationDialog } from "@/components/psv/psv-calibration-dialog";
import { CalibrationCertificate } from "@/components/psv/calibration-certificate";
import { format } from "date-fns";
import { Printer } from "lucide-react";

export default function PSVDetailsPage() {
  const params = useParams();
  const psv = mockPSVs.find(p => p.id === params.id);
  const calibrations = mockCalibrations.filter(c => c.psvId === params.id);

  if (!psv) {
    return <div className="p-8">PSV not found</div>;
  }

  const status = getCalibrationStatus(psv);

  return (
    <div className="container mx-auto py-6">
      {/* PSV Details */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Basic Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Tag:</span>
                <span className="ml-2">{psv.tag}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Location:</span>
                <span className="ml-2">{psv.location}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Unit:</span>
                <span className="ml-2">{psv.unit}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Technical Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Pop Pressure:</span>
                <span className="ml-2">{psv.popPressure} bar</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="ml-2">{psv.type}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Max Leakage:</span>
                <span className="ml-2">{psv.maxLeakage} ml/min</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Calibration Status</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="ml-2">{status}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Last Calibration:</span>
                <span className="ml-2">
                  {psv.lastCalibrationDate
                    ? format(new Date(psv.lastCalibrationDate), 'PPP')
                    : 'Never'}
                </span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Next Due:</span>
                <span className="ml-2">
                  {psv.nextCalibrationDate
                    ? format(new Date(psv.nextCalibrationDate), 'PPP')
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Calibration History */}
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Calibration History</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add New Calibration</Button>
          </DialogTrigger>
          <DialogContent>
            <PSVCalibrationDialog psv={psv} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Work Performed</TableHead>
              <TableHead>Test Medium</TableHead>
              <TableHead>Work Order</TableHead>
              <TableHead>Initial Pop (bar)</TableHead>
              <TableHead>Final Pop (bar)</TableHead>
              <TableHead>Initial Leakage</TableHead>
              <TableHead>Final Leakage</TableHead>
              <TableHead>Personnel</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calibrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  No calibration history available
                </TableCell>
              </TableRow>
            ) : (
              calibrations.map((cal) => (
                <TableRow key={cal.id}>
                  <TableCell>
                    {format(new Date(cal.calibrationDate), 'PP')}
                  </TableCell>
                  <TableCell>{cal.workPerformed.join(', ')}</TableCell>
                  <TableCell>{cal.testMedium}</TableCell>
                  <TableCell>{cal.workOrderNumber}</TableCell>
                  <TableCell>{cal.initialPopPressure}</TableCell>
                  <TableCell>{cal.finalPopPressure}</TableCell>
                  <TableCell>{cal.initialLeakage} ml/min</TableCell>
                  <TableCell>{cal.finalLeakage} ml/min</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Inspector: {cal.inspector}</div>
                      <div>Operator: {cal.operator}</div>
                      <div>Approver: {cal.approver}</div>
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
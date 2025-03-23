'use client';

import { useState, useEffect } from 'react';
import { fetchCalibrations } from '@/api/psv';
import { Calibration } from '@/components/psv/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, AlertTriangle } from 'lucide-react';

interface CalibrationHistoryProps {
  tagNumber: string;
}

export function CalibrationHistory({ tagNumber }: CalibrationHistoryProps) {
  const [calibrations, setCalibrations] = useState<Calibration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCalibrations() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCalibrations(tagNumber);
        setCalibrations(data);
      } catch (err) {
        console.error('Error loading calibrations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load calibration history');
      } finally {
        setLoading(false);
      }
    }

    loadCalibrations();
  }, [tagNumber]);

  if (loading) {
    return <div className="py-8 flex justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  if (error) {
    return <div className="py-8 flex justify-center">
      <div className="text-red-500 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <p>{error}</p>
      </div>
    </div>;
  }

  if (calibrations.length === 0) {
    return <div className="py-8 text-center text-gray-500">
      No calibration history available for this PSV.
    </div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Calibration History</h2>
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Pop Pressure</TableHead>
              <TableHead>Leak Test</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calibrations.map((calibration) => (
              <TableRow key={calibration.id}>
                <TableCell>
                  {new Date(calibration.calibration_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    calibration.result === 'Pass' ? 'bg-green-100 text-green-800' : 
                    calibration.result === 'Fail' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {calibration.result}
                  </span>
                </TableCell>
                <TableCell>
                  {calibration.pop_pressure} Barg
                </TableCell>
                <TableCell>
                  {calibration.leak_test_pressure} Barg
                </TableCell>
                <TableCell>
                  {calibration.technician || 'N/A'}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">View report</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
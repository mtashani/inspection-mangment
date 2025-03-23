'use client';

import { PSV } from "@/components/psv/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PSVInfoCardProps {
  psv: PSV;
}

export function PSVInfoCard({ psv }: PSVInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>PSV Information</span>
          <Badge variant={psv.status === 'Main' ? "default" : "secondary"}>
            {psv.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Tag Number</h3>
            <p className="text-base font-medium">{psv.tag_number}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Unique No</h3>
            <p className="text-base font-medium">{psv.unique_no}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Set Pressure</h3>
            <p className="text-base font-medium">{psv.set_pressure} Barg</p>
          </div>
          {psv.unit && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Unit</h3>
              <p className="text-base font-medium">{psv.unit}</p>
            </div>
          )}
          {psv.train && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Train</h3>
              <p className="text-base font-medium">{psv.train}</p>
            </div>
          )}
          {psv.type && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Type</h3>
              <p className="text-base font-medium">{psv.type.replace('_', ' ').toLowerCase()}</p>
            </div>
          )}
          {psv.manufacturer && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Manufacturer</h3>
              <p className="text-base font-medium">{psv.manufacturer}</p>
            </div>
          )}
          {psv.serial_no && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Serial No</h3>
              <p className="text-base font-medium">{psv.serial_no}</p>
            </div>
          )}
          {psv.service && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Service</h3>
              <p className="text-base font-medium">{psv.service}</p>
            </div>
          )}
          {psv.last_calibration_date && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Calibration</h3>
              <p className="text-base font-medium">
                {new Date(psv.last_calibration_date).toLocaleDateString()}
              </p>
            </div>
          )}
          {psv.expire_date && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Next Due</h3>
              <p className="text-base font-medium">
                {new Date(psv.expire_date).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
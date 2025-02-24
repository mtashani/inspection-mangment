'use client';

import { useState } from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PSV, TestMedium } from './types';

interface PSVCalibrationDialogProps {
  psv: PSV;
}

export function PSVCalibrationDialog({ psv }: PSVCalibrationDialogProps) {
  const [workPerformed, setWorkPerformed] = useState({
    cleaning: false,
    calibration: false,
    repair: false,
  });

  const [formData, setFormData] = useState({
    testMedium: psv.testMedium,
    workOrderNumber: '',
    inspector: '',
    operator: '',
    approver: '',
    initialPopPressure: '',
    finalPopPressure: '',
    initialLeakage: '',
    finalLeakage: '',
    workshopEntryPressure: '',
    workshopExitPressure: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the data to an API
    console.log({
      ...formData,
      workPerformed: Object.entries(workPerformed)
        .filter(([, value]) => value)
        .map(([key]) => key.toUpperCase()),
    });
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Add New Calibration Record - {psv.tag}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Work Performed */}
        <div>
          <Label>Work Performed</Label>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cleaning"
                checked={workPerformed.cleaning}
                onCheckedChange={(checked) =>
                  setWorkPerformed((prev) => ({ ...prev, cleaning: checked as boolean }))
                }
              />
              <Label htmlFor="cleaning">Cleaning</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="calibration"
                checked={workPerformed.calibration}
                onCheckedChange={(checked) =>
                  setWorkPerformed((prev) => ({ ...prev, calibration: checked as boolean }))
                }
              />
              <Label htmlFor="calibration">Calibration</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="repair"
                checked={workPerformed.repair}
                onCheckedChange={(checked) =>
                  setWorkPerformed((prev) => ({ ...prev, repair: checked as boolean }))
                }
              />
              <Label htmlFor="repair">Repair</Label>
            </div>
          </div>
        </div>

        {/* Test Medium */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Test Medium</Label>
            <Select
              value={formData.testMedium}
              onValueChange={(value: TestMedium) =>
                setFormData((prev) => ({ ...prev, testMedium: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AIR">Air</SelectItem>
                <SelectItem value="WATER">Water</SelectItem>
                <SelectItem value="NITROGEN">Nitrogen</SelectItem>
                <SelectItem value="STEAM">Steam</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Work Order Number</Label>
            <Input
              value={formData.workOrderNumber}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, workOrderNumber: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Personnel */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Inspector</Label>
            <Input
              value={formData.inspector}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, inspector: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Operator</Label>
            <Input
              value={formData.operator}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, operator: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Approver</Label>
            <Input
              value={formData.approver}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, approver: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Pressure Readings */}
        <div>
          <Label className="block mb-2">Pressure Readings (bar)</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Initial Pop Pressure</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.initialPopPressure}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, initialPopPressure: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Final Pop Pressure</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.finalPopPressure}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, finalPopPressure: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        {/* Leakage Readings */}
        <div>
          <Label className="block mb-2">Leakage Readings (ml/min)</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Initial Leakage</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.initialLeakage}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, initialLeakage: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Final Leakage</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.finalLeakage}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, finalLeakage: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        {/* Workshop Readings */}
        <div>
          <Label className="block mb-2">Workshop Readings (bar)</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Entry Pressure</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.workshopEntryPressure}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, workshopEntryPressure: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Exit Pressure</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.workshopExitPressure}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, workshopExitPressure: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit">Save Calibration</Button>
        </div>
      </form>
    </DialogContent>
  );
}
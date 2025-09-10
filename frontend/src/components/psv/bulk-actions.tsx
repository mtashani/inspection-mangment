'use client';

import { useState } from 'react';
import { PSV } from '@/components/psv/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, CheckSquare, FileDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface BulkActionsProps {
  selectedPSVs: PSV[];
  onClearSelection: () => void;
  onUpdatePSVs?: (updatedPSVs: PSV[]) => Promise<void>;
  className?: string;
}

type BulkAction = 'update' | 'export' | 'schedule' | 'rbi';

export function BulkActions({
  selectedPSVs,
  onClearSelection,
  onUpdatePSVs,
  className
}: BulkActionsProps) {
  const [selectedAction, setSelectedAction] = useState<BulkAction>('update');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [updateField, setUpdateField] = useState<string>('');
  const [updateValue, setUpdateValue] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('xlsx');
  const [updateSuccess, setUpdateSuccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleActionChange = (value: string) => {
    setSelectedAction(value as BulkAction);
    setUpdateSuccess(null);
    setErrorMessage('');
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setUpdateField('');
    setUpdateValue('');
    setScheduleDate(undefined);
    setUpdateSuccess(null);
    setErrorMessage('');
  };

  const executeAction = async () => {
    if (selectedPSVs.length === 0) {
      setErrorMessage('No PSVs selected');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      switch (selectedAction) {
        case 'update':
          await handleBulkUpdate();
          break;
        case 'export':
          handleBulkExport();
          break;
        case 'schedule':
          await handleBulkSchedule();
          break;
        case 'rbi':
          await handleBulkRBI();
          break;
      }
    } catch (error) {
      console.error('Error during bulk operation:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setUpdateSuccess(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle bulk update of PSVs
  const handleBulkUpdate = async () => {
    if (!updateField || updateValue === undefined) {
      setErrorMessage('Please select a field and provide a value');
      return;
    }

    if (!onUpdatePSVs) {
      setErrorMessage('Update functionality not provided');
      return;
    }

    // Create updated PSVs with new field value
    const updatedPSVs = selectedPSVs.map(psv => ({
      ...psv,
      [updateField]: updateValue
    }));

    // Call the update function provided by parent
    await onUpdatePSVs(updatedPSVs);
    setUpdateSuccess(true);
  };

  // Handle bulk export of PSVs
  const handleBulkExport = () => {
    // Prepare data for export
    const data = selectedPSVs.map(psv => {
      // Pick the main fields for export
      return {
        'Tag Number': psv.tag_number,
        'Status': psv.status,
        'Unit': psv.unit || '',
        'Train': psv.train || '',
        'Service': psv.service || '',
        'Type': psv.type_no || '',
        'Set Pressure': psv.set_pressure || '',
        'Manufacturer': psv.manufacturer || '',
        'Last Calibration': psv.last_calibration_date ? 
          format(new Date(psv.last_calibration_date), 'yyyy-MM-dd') : 'Never',
        'Next Calibration': psv.expire_date ? 
          format(new Date(psv.expire_date), 'yyyy-MM-dd') : 'Not scheduled'
      };
    });

    if (exportFormat === 'xlsx') {
      // Export as Excel
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "PSVs");
      
      // Generate file and trigger download
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(dataBlob, `PSVs-Export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } else {
      // Export as CSV
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(csvBlob, `PSVs-Export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    }
    
    setUpdateSuccess(true);
  };

  // Handle bulk scheduling of calibrations
  const handleBulkSchedule = async () => {
    if (!scheduleDate) {
      setErrorMessage('Please select a calibration date');
      return;
    }

    if (!onUpdatePSVs) {
      setErrorMessage('Update functionality not provided');
      return;
    }

    // Create updated PSVs with new calibration date
    const updatedPSVs = selectedPSVs.map(psv => ({
      ...psv,
      last_calibration_date: format(new Date(), 'yyyy-MM-dd'),
      expire_date: format(scheduleDate, 'yyyy-MM-dd')
    }));

    // Call the update function provided by parent
    await onUpdatePSVs(updatedPSVs);
    setUpdateSuccess(true);
  };

  // Handle bulk RBI calculation
  const handleBulkRBI = async () => {
    // This would typically call an API endpoint to perform RBI calculations
    // For demonstration, we'll just simulate success after a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUpdateSuccess(true);
  };

  return (
    <div className={cn("", className)}>
      <div className="flex items-center gap-2 mb-2">
        <CheckSquare className="h-4 w-4 text-primary" />
        <span className="font-medium">{selectedPSVs.length} PSVs selected</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="default" 
              size="sm"
              disabled={selectedPSVs.length === 0}
              onClick={() => {
                setUpdateSuccess(null);
                setErrorMessage('');
              }}
            >
              Bulk Actions
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Bulk Actions for {selectedPSVs.length} PSVs</DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-5">
              {/* Action selection */}
              <div className="space-y-3">
                <Label className="text-base">Select Action</Label>
                <RadioGroup 
                  defaultValue="update" 
                  value={selectedAction} 
                  onValueChange={handleActionChange}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="update" id="action-update" />
                    <Label htmlFor="action-update">Update Field Values</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="export" id="action-export" />
                    <Label htmlFor="action-export">Export PSVs</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="schedule" id="action-schedule" />
                    <Label htmlFor="action-schedule">Schedule Calibration</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rbi" id="action-rbi" />
                    <Label htmlFor="action-rbi">Calculate RBI</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Action specific options */}
              <div className="pt-3">
                {selectedAction === 'update' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="update-field">Field to Update</Label>
                      <Select 
                        value={updateField} 
                        onValueChange={setUpdateField}
                      >
                        <SelectTrigger id="update-field">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="unit">Unit</SelectItem>
                          <SelectItem value="train">Train</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="manufacturer">Manufacturer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="update-value">New Value</Label>
                      <Input 
                        id="update-value"
                        value={updateValue}
                        onChange={(e) => setUpdateValue(e.target.value)}
                        placeholder="Enter new value"
                      />
                    </div>
                  </div>
                )}
                
                {selectedAction === 'export' && (
                  <div className="space-y-3">
                    <Label>Export Format</Label>
                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="format-xlsx" 
                          checked={exportFormat === 'xlsx'}
                          onCheckedChange={() => setExportFormat('xlsx')}
                        />
                        <Label htmlFor="format-xlsx">Excel (.xlsx)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="format-csv" 
                          checked={exportFormat === 'csv'}
                          onCheckedChange={() => setExportFormat('csv')}
                        />
                        <Label htmlFor="format-csv">CSV</Label>
                      </div>
                    </div>
                    
                    <div className="pt-2 text-sm text-gray-500">
                      <p>Export will include main PSV details and calibration info</p>
                    </div>
                  </div>
                )}
                
                {selectedAction === 'schedule' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Select Next Calibration Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !scheduleDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduleDate ? format(scheduleDate, "PPP") : "Select a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={scheduleDate}
                            onSelect={setScheduleDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="pt-2 text-sm text-gray-500">
                      <p>This will update all selected PSVs with today as the last calibration date and the selected date as next calibration date.</p>
                    </div>
                  </div>
                )}
                
                {selectedAction === 'rbi' && (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-500">
                      <p>This will calculate RBI for all selected PSVs using the current RBI configuration.</p>
                      <p className="mt-2">The operation may take some time depending on the number of PSVs.</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Status messages */}
              {updateSuccess === true && (
                <div className="bg-green-50 border border-green-100 text-green-600 rounded-md p-2 text-sm">
                  Operation completed successfully!
                </div>
              )}
              
              {updateSuccess === false && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-md p-2 text-sm">
                  <div className="font-medium">Operation failed</div>
                  {errorMessage && <div className="mt-1">{errorMessage}</div>}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={handleDialogClose}
                disabled={isProcessing}
              >
                Close
              </Button>
              <Button 
                onClick={executeAction}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Execute'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => onClearSelection()}
        >
          Clear Selection
        </Button>
        
        <Button
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
          onClick={() => {
            setSelectedAction('export');
            setExportFormat('xlsx');
            setIsDialogOpen(true);
          }}
          disabled={selectedPSVs.length === 0}
        >
          <FileDown className="h-4 w-4" />
          <span>Export Selected</span>
        </Button>
      </div>
    </div>
  );
}
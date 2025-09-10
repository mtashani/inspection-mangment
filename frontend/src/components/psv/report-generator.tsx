'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PSV } from '@/components/psv/types';
import { FileDown, FileText, FileSpreadsheet, Settings, Printer } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { cn } from '@/lib/utils';

interface ReportGeneratorProps {
  psvs: PSV[];
  className?: string;
}

type ReportFormat = 'pdf' | 'csv' | 'xlsx' | 'html';
type ReportTemplate = 'summary' | 'detailed' | 'calibration' | 'custom';

interface FieldOption {
  id: string;
  label: string;
  group?: string;
  selected: boolean;
}

export function ReportGenerator({ psvs, className }: ReportGeneratorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('pdf');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate>('summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Field selection for custom report
  const [fieldOptions, setFieldOptions] = useState<FieldOption[]>([
    // General information
    { id: 'tag_number', label: 'Tag Number', group: 'General', selected: true },
    { id: 'status', label: 'Status', group: 'General', selected: true },
    { id: 'unit', label: 'Unit', group: 'General', selected: true },
    { id: 'train', label: 'Train', group: 'General', selected: true },
    { id: 'service', label: 'Service', group: 'General', selected: true },
    { id: 'manufacturer', label: 'Manufacturer', group: 'General', selected: true },
    { id: 'type_no', label: 'Type', group: 'General', selected: false },
    
    // Technical details
    { id: 'set_pressure', label: 'Set Pressure', group: 'Technical', selected: true },
    { id: 'orifice_size', label: 'Orifice Size', group: 'Technical', selected: false },
    { id: 'inlet_size', label: 'Inlet Size', group: 'Technical', selected: false },
    { id: 'outlet_size', label: 'Outlet Size', group: 'Technical', selected: false },
    { id: 'back_pressure', label: 'Back Pressure', group: 'Technical', selected: false },
    
    // Calibration info
    { id: 'last_calibration_date', label: 'Last Calibration Date', group: 'Calibration', selected: true },
    { id: 'expire_date', label: 'Next Calibration Date', group: 'Calibration', selected: true },
    { id: 'frequency', label: 'Calibration Interval', group: 'Calibration', selected: false },
  ]);
  
  // Group fields by their group
  const fieldGroups = fieldOptions.reduce<Record<string, FieldOption[]>>((groups, field) => {
    const group = field.group || 'Other';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(field);
    return groups;
  }, {});
  
  // Reset state
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setErrorMessage(null);
  };
  
  // Toggle field selection
  const toggleField = (fieldId: string) => {
    setFieldOptions(
      fieldOptions.map(field => 
        field.id === fieldId 
          ? { ...field, selected: !field.selected } 
          : field
      )
    );
  };
  
  // Select all fields in a group
  const selectAllInGroup = (group: string) => {
    setFieldOptions(
      fieldOptions.map(field => 
        field.group === group 
          ? { ...field, selected: true } 
          : field
      )
    );
  };
  
  // Deselect all fields in a group
  const deselectAllInGroup = (group: string) => {
    setFieldOptions(
      fieldOptions.map(field => 
        field.group === group 
          ? { ...field, selected: false } 
          : field
      )
    );
  };
  
  // Handle report generation
  const handleGenerateReport = async () => {
    if (psvs.length === 0) {
      setErrorMessage('No PSV data available for report generation.');
      return;
    }
    
    setIsGenerating(true);
    setErrorMessage(null);
    
    try {
      switch (selectedFormat) {
        case 'pdf':
          await generatePDFReport();
          break;
        case 'csv':
          generateCSVReport();
          break;
        case 'xlsx':
          generateExcelReport();
          break;
        case 'html':
          generateHTMLReport();
          break;
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error generating report:', error);
      setErrorMessage('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Generate PDF report
  const generatePDFReport = async () => {
    // In a real implementation, this would use a PDF generation library
    // For now we'll simulate a PDF download with a placeholder
    
    // Simulate PDF generation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a placeholder blob for download
    const blob = new Blob(['PDF Report Placeholder'], { type: 'application/pdf' });
    saveAs(blob, `PSV-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };
  
  // Generate CSV report
  const generateCSVReport = () => {
    // Prepare data based on selected fields or template
    const reportData = prepareReportData();
    
    // Convert to CSV
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    // Create and download CSV file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `PSV-Report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };
  
  // Generate Excel report
  const generateExcelReport = () => {
    // Prepare data based on selected fields or template
    const reportData = prepareReportData();
    
    // Convert to Excel
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PSVs");
    
    // Add a summary sheet if template is summary
    if (selectedTemplate === 'summary') {
      const summaryData = prepareSummaryData();
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    }
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `PSV-Report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };
  
  // Generate HTML report
  const generateHTMLReport = () => {
    // Prepare data based on selected fields or template
    const reportData = prepareReportData();
    
    // Create HTML table
    let html = `
      <html>
        <head>
          <title>PSV Report - ${format(new Date(), 'yyyy-MM-dd')}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 2rem; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .report-header { margin-bottom: 1rem; }
            .report-title { font-size: 1.5rem; font-weight: bold; }
            .report-date { color: #666; }
          </style>
        </head>
        <body>
          <div class="report-header">
            <div class="report-title">PSV Report</div>
            <div class="report-date">Generated on ${format(new Date(), 'yyyy-MM-dd HH:mm')}</div>
            <div>Total PSVs: ${psvs.length}</div>
          </div>
          <table>
            <thead>
              <tr>
    `;
    
    // Get headers from first object
    if (reportData.length > 0) {
      const headers = Object.keys(reportData[0]);
      headers.forEach(header => {
        html += `<th>${header}</th>`;
      });
      
      html += `
              </tr>
            </thead>
            <tbody>
      `;
      
      // Add row data
      reportData.forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
          html += `<td>${row[header] || ''}</td>`;
        });
        html += '</tr>';
      });
    }
    
    html += `
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    // Create and download HTML file
    const blob = new Blob([html], { type: 'text/html' });
    saveAs(blob, `PSV-Report-${format(new Date(), 'yyyy-MM-dd')}.html`);
  };
  
  // Prepare report data based on template and selected fields
  const prepareReportData = () => {
    if (selectedTemplate === 'custom') {
      // For custom template, use only selected fields
      const selectedFieldIds = fieldOptions.filter(f => f.selected).map(f => f.id);
      
      return psvs.map(psv => {
        const reportRow: Record<string, string | number | boolean | undefined> = {};
        selectedFieldIds.forEach(fieldId => {
          const field = fieldOptions.find(f => f.id === fieldId);
          if (field) {
            let value = psv[fieldId as keyof PSV];
            
            // Format dates
            if (fieldId === 'last_calibration_date' || fieldId === 'expire_date') {
              value = value ? format(new Date(value as string), 'yyyy-MM-dd') : 'N/A';
}
            // Convert boolean values to strings
            else if (typeof value === 'boolean') {
              value = value ? 'Yes' : 'No';
            }
            
            reportRow[field.label] = value;
          }
        });
        return reportRow;
      });
    } else if (selectedTemplate === 'summary') {
      // Summary template with key fields
      return psvs.map(psv => ({
        'Tag Number': psv.tag_number,
        'Status': psv.status,
        'Unit': psv.unit || '',
        'Service': psv.service || '',
        'Last Calibration': psv.last_calibration_date ? format(new Date(psv.last_calibration_date), 'yyyy-MM-dd') : 'Never',
        'Next Calibration': psv.expire_date ? format(new Date(psv.expire_date), 'yyyy-MM-dd') : 'Not scheduled'
      }));
    } else if (selectedTemplate === 'calibration') {
      // Calibration-focused template
      return psvs.map(psv => ({
        'Tag Number': psv.tag_number,
        'Status': psv.status,
        'Service': psv.service || '',
        'Set Pressure': psv.set_pressure || '',
        'Last Calibration': psv.last_calibration_date ? format(new Date(psv.last_calibration_date), 'yyyy-MM-dd') : 'Never',
        'Next Calibration': psv.expire_date ? format(new Date(psv.expire_date), 'yyyy-MM-dd') : 'Not scheduled',
        'Interval (Months)': psv.frequency || '',
        'Days Remaining': psv.expire_date ? 
          Math.ceil((new Date(psv.expire_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
          'N/A'
      }));
    } else {
      // Detailed template
      return psvs.map(psv => ({
        'Tag Number': psv.tag_number,
        'Status': psv.status,
        'Unit': psv.unit || '',
        'Train': psv.train || '',
        'Service': psv.service || '',
        'Type': psv.type_no || '',
        'Manufacturer': psv.manufacturer || '',
        'Set Pressure': psv.set_pressure || '',
        'Orifice Size': psv.orifice_size || '',
        'Inlet Size': psv.inlet_size || '',
        'Outlet Size': psv.outlet_size || '',
        'Back Pressure': psv.back_pressure || '',
        'Last Calibration': psv.last_calibration_date ? format(new Date(psv.last_calibration_date), 'yyyy-MM-dd') : 'Never',
        'Next Calibration': psv.expire_date ? format(new Date(psv.expire_date), 'yyyy-MM-dd') : 'Not scheduled'
      }));
    }
  };
  
  // Create summary data for second sheet in Excel
  const prepareSummaryData = () => {
    // Count PSVs by status
    const statusCounts: Record<string, number> = {};
    psvs.forEach(psv => {
      const status = psv.status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    // Count PSVs by calibration status
    const now = new Date();
    let overdueCount = 0;
    let dueIn30DaysCount = 0;
    let dueIn90DaysCount = 0;
    
    psvs.forEach(psv => {
      if (psv.expire_date) {
        const expireDate = new Date(psv.expire_date);
        const daysUntilExpire = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpire < 0) {
          overdueCount++;
        } else if (daysUntilExpire <= 30) {
          dueIn30DaysCount++;
        } else if (daysUntilExpire <= 90) {
          dueIn90DaysCount++;
        }
      }
    });
    
    // Return summary data
    return [
      { 'Summary Type': 'Total PSVs', 'Count': psvs.length },
      { 'Summary Type': 'Main PSVs', 'Count': statusCounts['Main'] || 0 },
      { 'Summary Type': 'Spare PSVs', 'Count': statusCounts['Spare'] || 0 },
      { 'Summary Type': 'Overdue for Calibration', 'Count': overdueCount },
      { 'Summary Type': 'Due in next 30 days', 'Count': dueIn30DaysCount },
      { 'Summary Type': 'Due in next 90 days', 'Count': dueIn90DaysCount },
    ];
  };
  
  // Get format icon
  const getFormatIcon = (format: ReportFormat) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'csv':
      case 'xlsx':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'html':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileDown className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn("", className)}>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            disabled={psvs.length === 0}
          >
            <FileDown className="h-4 w-4" />
            <span>Generate Report</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="md:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate PSV Report</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Tabs defaultValue="format" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="format">Format</TabsTrigger>
                <TabsTrigger value="template">Template</TabsTrigger>
                <TabsTrigger value="fields" disabled={selectedTemplate !== 'custom'}>
                  Fields
                </TabsTrigger>
              </TabsList>
              
              {/* Format selection */}
              <TabsContent value="format" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {(['pdf', 'xlsx', 'csv', 'html'] as ReportFormat[]).map(format => (
                    <Card 
                      key={format}
                      className={cn(
                        "flex items-start space-x-3 p-4 cursor-pointer transition-all",
                        selectedFormat === format ? "border-primary bg-primary/5" : ""
                      )}
                      onClick={() => setSelectedFormat(format)}
                    >
                      <div className={cn(
                        "p-2 rounded-md", 
                        selectedFormat === format ? "bg-primary/10" : "bg-gray-100"
                      )}>
                        {getFormatIcon(format)}
                      </div>
                      <div>
                        <h3 className="font-medium">{format.toUpperCase()}</h3>
                        <p className="text-xs text-gray-500">
                          {format === 'pdf' && "Printable document format"}
                          {format === 'xlsx' && "Excel spreadsheet"}
                          {format === 'csv' && "Comma separated values"}
                          {format === 'html' && "Web page format"}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              {/* Template selection */}
              <TabsContent value="template" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'summary', title: 'Summary Report', desc: 'Basic PSV information and calibration status' },
                    { id: 'detailed', title: 'Detailed Report', desc: 'Complete technical data for each PSV' },
                    { id: 'calibration', title: 'Calibration Schedule', desc: 'Upcoming calibration dates and intervals' },
                    { id: 'custom', title: 'Custom Report', desc: 'Select specific fields to include' }
                  ].map(template => (
                    <Card 
                      key={template.id}
                      className={cn(
                        "flex items-start space-x-3 p-4 cursor-pointer transition-all",
                        selectedTemplate === template.id ? "border-primary bg-primary/5" : ""
                      )}
                      onClick={() => setSelectedTemplate(template.id as ReportTemplate)}
                    >
                      <div className={cn(
                        "p-2 rounded-md", 
                        selectedTemplate === template.id ? "bg-primary/10" : "bg-gray-100"
                      )}>
                        {template.id === 'custom' ? (
                          <Settings className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{template.title}</h3>
                        <p className="text-xs text-gray-500">{template.desc}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              {/* Field selection for custom report */}
              <TabsContent value="fields" className="space-y-4">
                <p className="text-sm text-gray-500">
                  Select the fields to include in your custom report.
                </p>
                
                <div className="space-y-6">
                  {Object.entries(fieldGroups).map(([group, fields]) => (
                    <div key={group} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-sm">{group}</h3>
                        <div className="flex space-x-2 text-xs">
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => selectAllInGroup(group)}
                          >
                            Select All
                          </Button>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => deselectAllInGroup(group)}
                          >
                            Deselect All
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {fields.map(field => (
                          <div key={field.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`field-${field.id}`} 
                              checked={field.selected}
                              onCheckedChange={() => toggleField(field.id)}
                            />
                            <Label htmlFor={`field-${field.id}`}>{field.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Preview or summary */}
            <div className="mt-6 p-3 bg-gray-50 rounded-md">
              <div className="text-sm">
                <p className="font-medium">Report Summary</p>
                <p className="text-xs text-gray-500 mt-1">
                  {`Generating a ${selectedTemplate} report for ${psvs.length} PSVs in ${selectedFormat.toUpperCase()} format.`}
                </p>
                
                {selectedTemplate === 'custom' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {`Selected ${fieldOptions.filter(f => f.selected).length} fields out of ${fieldOptions.length} available.`}
                  </p>
                )}
              </div>
            </div>
            
            {/* Error message */}
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-md">
                {errorMessage}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose} disabled={isGenerating}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateReport}
              disabled={isGenerating || psvs.length === 0 || (selectedTemplate === 'custom' && fieldOptions.filter(f => f.selected).length === 0)}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  {getFormatIcon(selectedFormat)}
                  <span>Generate Report</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => {
            setSelectedFormat('pdf');
            setSelectedTemplate('summary');
            setIsDialogOpen(true);
          }}
          disabled={psvs.length === 0}
        >
          <FileText className="h-4 w-4" />
          <span>PDF Report</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => {
            setSelectedFormat('xlsx');
            setSelectedTemplate('detailed');
            setIsDialogOpen(true);
          }}
          disabled={psvs.length === 0}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Excel Report</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => {
            window.print();
          }}
          disabled={psvs.length === 0}
        >
          <Printer className="h-4 w-4" />
          <span>Print</span>
        </Button>
      </div>
    </div>
  );
}
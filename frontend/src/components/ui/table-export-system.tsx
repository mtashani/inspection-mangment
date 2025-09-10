"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/loading-progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileImage,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Filter,
  Columns,
  Eye,
  X
} from 'lucide-react';

// Export format types
export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json' | 'xml';

// Export configuration interface
export interface ExportConfig {
  format: ExportFormat;
  filename: string;
  includeHeaders: boolean;
  selectedColumns: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  filters?: Record<string, any>;
  customTemplate?: string;
  pageSize?: 'A4' | 'A3' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  includeMetadata: boolean;
  compression?: boolean;
}

// Column definition for export
export interface ExportColumn {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency';
  width?: number;
  format?: (value: any) => string;
  required?: boolean;
  description?: string;
}

// Export template
export interface ExportTemplate {
  id: string;
  name: string;
  description?: string;
  config: Partial<ExportConfig>;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Export progress status
export interface ExportProgress {
  status: 'idle' | 'preparing' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  downloadUrl?: string;
  error?: string;
}

// Format configurations
const formatConfigs = {
  csv: {
    icon: FileText,
    label: 'CSV',
    description: 'Comma-separated values file',
    mimeType: 'text/csv',
    extension: '.csv',
    supportsMultipleSheets: false,
    supportsFormatting: false,
    maxRows: 1000000
  },
  excel: {
    icon: FileSpreadsheet,
    label: 'Excel',
    description: 'Microsoft Excel spreadsheet',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
    supportsMultipleSheets: true,
    supportsFormatting: true,
    maxRows: 1048576
  },
  pdf: {
    icon: FileImage,
    label: 'PDF',
    description: 'Portable Document Format',
    mimeType: 'application/pdf',
    extension: '.pdf',
    supportsMultipleSheets: false,
    supportsFormatting: true,
    maxRows: 10000
  },
  json: {
    icon: FileText,
    label: 'JSON',
    description: 'JavaScript Object Notation',
    mimeType: 'application/json',
    extension: '.json',
    supportsMultipleSheets: false,
    supportsFormatting: false,
    maxRows: 100000
  },
  xml: {
    icon: FileText,
    label: 'XML',
    description: 'Extensible Markup Language',
    mimeType: 'application/xml',
    extension: '.xml',
    supportsMultipleSheets: false,
    supportsFormatting: false,
    maxRows: 100000
  }
};

// Export Options Dialog Component
interface ExportOptionsDialogProps {
  data: any[];
  columns: ExportColumn[];
  onExport: (config: ExportConfig) => Promise<void>;
  templates?: ExportTemplate[];
  onSaveTemplate?: (template: Omit<ExportTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  className?: string;
  trigger?: React.ReactNode;
}

export function ExportOptionsDialog({
  data,
  columns,
  onExport,
  templates = [],
  onSaveTemplate,
  className,
  trigger
}: ExportOptionsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ExportConfig>({
    format: 'csv',
    filename: `export_${new Date().toISOString().split('T')[0]}`,
    includeHeaders: true,
    selectedColumns: columns.map(col => col.id),
    includeMetadata: false,
    pageSize: 'A4',
    orientation: 'portrait'
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const formatConfig = formatConfigs[config.format];
  const estimatedRows = data.length;
  const canExport = estimatedRows <= formatConfig.maxRows;

  const handleFormatChange = (format: ExportFormat) => {
    setConfig(prev => ({
      ...prev,
      format,
      filename: prev.filename.replace(/\.[^/.]+$/, formatConfigs[format].extension)
    }));
  };

  const handleColumnToggle = (columnId: string, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      selectedColumns: checked 
        ? [...prev.selectedColumns, columnId]
        : prev.selectedColumns.filter(id => id !== columnId)
    }));
  };

  const handleSelectAllColumns = (checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      selectedColumns: checked ? columns.map(col => col.id) : []
    }));
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setConfig(prev => ({ ...prev, ...template.config }));
      setSelectedTemplate(templateId);
    }
  };

  const handleSaveTemplate = () => {
    if (onSaveTemplate && templateName.trim()) {
      onSaveTemplate({
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        config,
        isDefault: false
      });
      setShowTemplateForm(false);
      setTemplateName('');
      setTemplateDescription('');
    }
  };

  const handleExport = async () => {
    try {
      await onExport(config);
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const requiredColumns = columns.filter(col => col.required);
  const hasRequiredColumns = requiredColumns.every(col => config.selectedColumns.includes(col.id));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Templates Section */}
          {templates.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Export Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          {template.description && (
                            <div className="text-xs text-[var(--color-text-secondary)]">
                              {template.description}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateForm(!showTemplateForm)}
                  className="w-full"
                >
                  Save Current Settings as Template
                </Button>
                
                {showTemplateForm && (
                  <div className="space-y-3 p-3 border rounded-lg bg-[var(--color-bg-secondary)]">
                    <div>
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Enter template name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-description">Description (Optional)</Label>
                      <Textarea
                        id="template-description"
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        placeholder="Enter template description"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveTemplate} disabled={!templateName.trim()}>
                        Save Template
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowTemplateForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Format Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Export Format
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(formatConfigs).map(([format, config]) => {
                    const Icon = config.icon;
                    const isSelected = format === config.format;
                    
                    return (
                      <div
                        key={format}
                        className={cn(
                          "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                          isSelected 
                            ? "border-[var(--color-primary-600)] bg-[var(--color-primary-50)]" 
                            : "border-[var(--color-border-primary)] hover:border-[var(--color-primary-300)]"
                        )}
                        onClick={() => handleFormatChange(format as ExportFormat)}
                      >
                        <Icon className="w-5 h-5 text-[var(--color-primary-600)]" />
                        <div className="flex-1">
                          <div className="font-medium">{config.label}</div>
                          <div className="text-xs text-[var(--color-text-secondary)]">
                            {config.description}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-[var(--color-primary-600)]" />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Format-specific options */}
                {config.format === 'pdf' && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Page Size</Label>
                        <Select 
                          value={config.pageSize} 
                          onValueChange={(value: any) => setConfig(prev => ({ ...prev, pageSize: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A4">A4</SelectItem>
                            <SelectItem value="A3">A3</SelectItem>
                            <SelectItem value="Letter">Letter</SelectItem>
                            <SelectItem value="Legal">Legal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Orientation</Label>
                        <Select 
                          value={config.orientation} 
                          onValueChange={(value: any) => setConfig(prev => ({ ...prev, orientation: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="portrait">Portrait</SelectItem>
                            <SelectItem value="landscape">Landscape</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  File Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="filename">Filename</Label>
                  <Input
                    id="filename"
                    value={config.filename}
                    onChange={(e) => setConfig(prev => ({ ...prev, filename: e.target.value }))}
                    placeholder="Enter filename"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={config.includeHeaders}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, includeHeaders: !!checked }))
                      }
                    />
                    <Label className="text-sm">Include column headers</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={config.includeMetadata}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, includeMetadata: !!checked }))
                      }
                    />
                    <Label className="text-sm">Include metadata (export date, filters, etc.)</Label>
                  </div>
                  
                  {formatConfig.extension === '.xlsx' && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={config.compression}
                        onCheckedChange={(checked) => 
                          setConfig(prev => ({ ...prev, compression: !!checked }))
                        }
                      />
                      <Label className="text-sm">Enable compression</Label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Column Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Columns className="w-4 h-4" />
                Column Selection
                <Badge variant="outline" className="ml-auto">
                  {config.selectedColumns.length} of {columns.length} selected
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={config.selectedColumns.length === columns.length}
                    onCheckedChange={handleSelectAllColumns}
                  />
                  <Label className="text-sm font-medium">Select All Columns</Label>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfig(prev => ({ 
                    ...prev, 
                    selectedColumns: requiredColumns.map(col => col.id) 
                  }))}
                >
                  Required Only
                </Button>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                {columns.map(column => (
                  <div
                    key={column.id}
                    className={cn(
                      "flex items-center space-x-2 p-2 rounded border",
                      column.required && "bg-[var(--color-warning-light)] border-[var(--color-warning-main)]"
                    )}
                  >
                    <Checkbox
                      checked={config.selectedColumns.includes(column.id)}
                      onCheckedChange={(checked) => handleColumnToggle(column.id, !!checked)}
                      disabled={column.required}
                    />
                    <div className="flex-1 min-w-0">
                      <Label className="text-sm font-medium truncate block">
                        {column.label}
                        {column.required && <span className="text-[var(--color-error-main)] ml-1">*</span>}
                      </Label>
                      {column.description && (
                        <p className="text-xs text-[var(--color-text-secondary)] truncate">
                          {column.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Export Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-[var(--color-text-secondary)]">Format</div>
                  <div className="font-medium">{formatConfig.label}</div>
                </div>
                <div>
                  <div className="text-[var(--color-text-secondary)]">Rows</div>
                  <div className="font-medium">{estimatedRows.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[var(--color-text-secondary)]">Columns</div>
                  <div className="font-medium">{config.selectedColumns.length}</div>
                </div>
                <div>
                  <div className="text-[var(--color-text-secondary)]">File Size</div>
                  <div className="font-medium">~{Math.round(estimatedRows * config.selectedColumns.length * 0.01)}KB</div>
                </div>
              </div>
              
              {!canExport && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-[var(--color-error-light)] border border-[var(--color-error-main)] rounded-lg">
                  <AlertCircle className="w-4 h-4 text-[var(--color-error-main)]" />
                  <span className="text-sm text-[var(--color-error-main)]">
                    Too many rows for {formatConfig.label} format. Maximum: {formatConfig.maxRows.toLocaleString()}
                  </span>
                </div>
              )}
              
              {!hasRequiredColumns && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-[var(--color-warning-light)] border border-[var(--color-warning-main)] rounded-lg">
                  <AlertCircle className="w-4 h-4 text-[var(--color-warning-main)]" />
                  <span className="text-sm text-[var(--color-warning-main)]">
                    Some required columns are not selected
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={!canExport || !hasRequiredColumns || config.selectedColumns.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export {formatConfig.label}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}// Ex
port Progress Component
interface ExportProgressProps {
  progress: ExportProgress;
  onCancel?: () => void;
  onDownload?: (url: string) => void;
  onClose?: () => void;
}

export function ExportProgressDialog({ 
  progress, 
  onCancel, 
  onDownload, 
  onClose 
}: ExportProgressProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleDownload = () => {
    if (progress.downloadUrl) {
      onDownload?.(progress.downloadUrl);
    }
  };

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'preparing':
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary-600)]" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-[var(--color-success-main)]" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-[var(--color-error-main)]" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'processing':
        return 'primary';
      default:
        return 'primary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Export Progress
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              {progress.message}
            </p>
            
            {progress.status !== 'idle' && progress.status !== 'error' && (
              <Progress 
                value={progress.progress} 
                color={getStatusColor() as any}
                showValue
                animated
                className="w-full"
              />
            )}
          </div>
          
          {progress.error && (
            <div className="p-3 bg-[var(--color-error-light)] border border-[var(--color-error-main)] rounded-lg">
              <p className="text-sm text-[var(--color-error-main)]">
                {progress.error}
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-end gap-2">
            {progress.status === 'processing' && onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            
            {progress.status === 'completed' && progress.downloadUrl && (
              <Button onClick={handleDownload} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            )}
            
            {(progress.status === 'completed' || progress.status === 'error') && (
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export History Component
interface ExportHistoryItem {
  id: string;
  filename: string;
  format: ExportFormat;
  status: 'completed' | 'failed' | 'expired';
  createdAt: Date;
  downloadUrl?: string;
  fileSize?: number;
  rowCount: number;
  columnCount: number;
  expiresAt?: Date;
}

interface ExportHistoryProps {
  history: ExportHistoryItem[];
  onDownload: (item: ExportHistoryItem) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export function ExportHistory({ 
  history, 
  onDownload, 
  onDelete, 
  className 
}: ExportHistoryProps) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getStatusBadge = (status: ExportHistoryItem['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-[var(--color-success-light)] text-[var(--color-success-main)]">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
    }
  };

  const isExpired = (item: ExportHistoryItem) => {
    return item.expiresAt && new Date() > item.expiresAt;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Export History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-text-secondary)]">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No export history available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(item => {
              const formatConfig = formatConfigs[item.format];
              const Icon = formatConfig.icon;
              const expired = isExpired(item);
              
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  <Icon className="w-5 h-5 text-[var(--color-primary-600)]" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{item.filename}</h4>
                      {getStatusBadge(item.status)}
                    </div>
                    
                    <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
                      <div>
                        {item.rowCount.toLocaleString()} rows, {item.columnCount} columns
                        {item.fileSize && ` • ${formatFileSize(item.fileSize)}`}
                      </div>
                      <div>
                        Created: {item.createdAt.toLocaleDateString()} {item.createdAt.toLocaleTimeString()}
                      </div>
                      {item.expiresAt && (
                        <div className={expired ? 'text-[var(--color-error-main)]' : ''}>
                          Expires: {item.expiresAt.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {item.status === 'completed' && !expired && item.downloadUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownload(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(item.id)}
                      className="h-8 w-8 p-0 text-[var(--color-error-main)] hover:text-[var(--color-error-main)] hover:bg-[var(--color-error-light)]"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export Service Hook
interface UseExportServiceOptions {
  onProgress?: (progress: ExportProgress) => void;
  onComplete?: (downloadUrl: string) => void;
  onError?: (error: string) => void;
}

export function useExportService(options: UseExportServiceOptions = {}) {
  const [progress, setProgress] = useState<ExportProgress>({
    status: 'idle',
    progress: 0,
    message: ''
  });

  const exportData = useCallback(async (
    data: any[],
    columns: ExportColumn[],
    config: ExportConfig
  ) => {
    try {
      setProgress({
        status: 'preparing',
        progress: 0,
        message: 'Preparing export...'
      });
      options.onProgress?.({
        status: 'preparing',
        progress: 0,
        message: 'Preparing export...'
      });

      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProgress({
        status: 'processing',
        progress: 25,
        message: 'Processing data...'
      });
      options.onProgress?.({
        status: 'processing',
        progress: 25,
        message: 'Processing data...'
      });

      // Filter data based on selected columns
      const selectedColumns = columns.filter(col => config.selectedColumns.includes(col.id));
      const processedData = data.map(row => {
        const filteredRow: any = {};
        selectedColumns.forEach(col => {
          filteredRow[col.id] = col.format ? col.format(row[col.id]) : row[col.id];
        });
        return filteredRow;
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      setProgress({
        status: 'processing',
        progress: 75,
        message: 'Generating file...'
      });
      options.onProgress?.({
        status: 'processing',
        progress: 75,
        message: 'Generating file...'
      });

      // Generate file based on format
      let fileContent: string | Blob;
      let mimeType: string;

      switch (config.format) {
        case 'csv':
          fileContent = generateCSV(processedData, selectedColumns, config);
          mimeType = 'text/csv';
          break;
        case 'json':
          fileContent = generateJSON(processedData, config);
          mimeType = 'application/json';
          break;
        case 'xml':
          fileContent = generateXML(processedData, selectedColumns, config);
          mimeType = 'application/xml';
          break;
        case 'excel':
          fileContent = await generateExcel(processedData, selectedColumns, config);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'pdf':
          fileContent = await generatePDF(processedData, selectedColumns, config);
          mimeType = 'application/pdf';
          break;
        default:
          throw new Error(`Unsupported format: ${config.format}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Create download URL
      const blob = typeof fileContent === 'string' 
        ? new Blob([fileContent], { type: mimeType })
        : fileContent;
      
      const downloadUrl = URL.createObjectURL(blob);

      setProgress({
        status: 'completed',
        progress: 100,
        message: 'Export completed successfully!',
        downloadUrl
      });

      options.onProgress?.({
        status: 'completed',
        progress: 100,
        message: 'Export completed successfully!',
        downloadUrl
      });

      options.onComplete?.(downloadUrl);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      
      setProgress({
        status: 'error',
        progress: 0,
        message: 'Export failed',
        error: errorMessage
      });

      options.onProgress?.({
        status: 'error',
        progress: 0,
        message: 'Export failed',
        error: errorMessage
      });

      options.onError?.(errorMessage);
    }
  }, [options]);

  const cancelExport = useCallback(() => {
    setProgress({
      status: 'idle',
      progress: 0,
      message: ''
    });
  }, []);

  return {
    progress,
    exportData,
    cancelExport
  };
}

// File Generation Functions
function generateCSV(data: any[], columns: ExportColumn[], config: ExportConfig): string {
  const lines: string[] = [];
  
  // Add metadata if requested
  if (config.includeMetadata) {
    lines.push(`# Export Date: ${new Date().toISOString()}`);
    lines.push(`# Format: CSV`);
    lines.push(`# Rows: ${data.length}`);
    lines.push(`# Columns: ${columns.length}`);
    lines.push('');
  }
  
  // Add headers
  if (config.includeHeaders) {
    lines.push(columns.map(col => `"${col.label}"`).join(','));
  }
  
  // Add data rows
  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col.id];
      if (value === null || value === undefined) return '""';
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    lines.push(values.join(','));
  });
  
  return lines.join('\n');
}

function generateJSON(data: any[], config: ExportConfig): string {
  const output: any = {
    data
  };
  
  if (config.includeMetadata) {
    output.metadata = {
      exportDate: new Date().toISOString(),
      format: 'JSON',
      rowCount: data.length,
      columnCount: Object.keys(data[0] || {}).length
    };
  }
  
  return JSON.stringify(output, null, 2);
}

function generateXML(data: any[], columns: ExportColumn[], config: ExportConfig): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<export>\n';
  
  if (config.includeMetadata) {
    xml += '  <metadata>\n';
    xml += `    <exportDate>${new Date().toISOString()}</exportDate>\n`;
    xml += '    <format>XML</format>\n';
    xml += `    <rowCount>${data.length}</rowCount>\n`;
    xml += `    <columnCount>${columns.length}</columnCount>\n`;
    xml += '  </metadata>\n';
  }
  
  xml += '  <data>\n';
  data.forEach(row => {
    xml += '    <row>\n';
    columns.forEach(col => {
      const value = row[col.id];
      xml += `      <${col.id}>${escapeXml(String(value || ''))}</${col.id}>\n`;
    });
    xml += '    </row>\n';
  });
  xml += '  </data>\n';
  xml += '</export>';
  
  return xml;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Placeholder functions for Excel and PDF generation
// In a real implementation, you would use libraries like:
// - xlsx or exceljs for Excel generation
// - jsPDF or puppeteer for PDF generation

async function generateExcel(data: any[], columns: ExportColumn[], config: ExportConfig): Promise<Blob> {
  // This is a placeholder - implement with xlsx or exceljs
  const csvContent = generateCSV(data, columns, config);
  return new Blob([csvContent], { type: 'text/csv' });
}

async function generatePDF(data: any[], columns: ExportColumn[], config: ExportConfig): Promise<Blob> {
  // This is a placeholder - implement with jsPDF or similar
  const csvContent = generateCSV(data, columns, config);
  return new Blob([csvContent], { type: 'text/plain' });
}

// Quick Export Button Component
interface QuickExportButtonProps {
  data: any[];
  columns: ExportColumn[];
  format: ExportFormat;
  filename?: string;
  className?: string;
  children?: React.ReactNode;
}

export function QuickExportButton({
  data,
  columns,
  format,
  filename,
  className,
  children
}: QuickExportButtonProps) {
  const { progress, exportData } = useExportService({
    onComplete: (downloadUrl) => {
      // Auto-download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || `export_${Date.now()}${formatConfigs[format].extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    }
  });

  const handleExport = () => {
    const config: ExportConfig = {
      format,
      filename: filename || `export_${Date.now()}`,
      includeHeaders: true,
      selectedColumns: columns.map(col => col.id),
      includeMetadata: false
    };
    
    exportData(data, columns, config);
  };

  const formatConfig = formatConfigs[format];
  const Icon = formatConfig.icon;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={progress.status === 'processing'}
        className={cn("flex items-center gap-2", className)}
      >
        {progress.status === 'processing' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
        {children || `Export ${formatConfig.label}`}
      </Button>
      
      {progress.status !== 'idle' && (
        <ExportProgressDialog progress={progress} />
      )}
    </>
  );
}

export default {
  ExportOptionsDialog,
  ExportProgressDialog,
  ExportHistory,
  QuickExportButton,
  useExportService,
  formatConfigs
};
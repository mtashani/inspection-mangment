'use client';

// Create Daily Report Modal Component
// Modal for creating new daily reports with form validation

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';

// Helper function for safe date formatting
function safeFormatDate(
  dateString: string | Date | undefined,
  formatStr: string = 'MMM dd, yyyy'
): string {
  if (!dateString) return 'N/A';

  try {
    const date =
      typeof dateString === 'string'
        ? parseISO(dateString)
        : new Date(dateString);
    if (!isValid(date)) return 'Invalid Date';
    return format(date, formatStr);
  } catch (error) {
    console.warn('Date formatting error:', error, 'for date:', dateString);
    return 'Invalid Date';
  }
}

import {
  CreateDailyReportRequest,
  CreateReportModalProps,
  DailyReportFormData,
} from '@/types/daily-reports';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useInspectorNames } from '@/hooks/use-daily-reports';

// Form validation schema
const createReportSchema = z.object({
  reportDate: z.string().min(1, 'Report date is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  inspectorIds: z
    .array(z.number())
    .min(1, 'At least one inspector must be selected'),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  weatherConditions: z.string().optional(),
  safetyNotes: z.string().optional(),
});

type CreateReportFormData = z.infer<typeof createReportSchema>;

/**
 * Create Daily Report Modal Component
 *
 * Provides a form interface for creating new daily reports with:
 * - Date selection
 * - Inspector selection (multi-select)
 * - Description and findings
 * - Weather conditions and safety notes
 * - Form validation with Zod
 */
export function CreateReportModal({
  isOpen,
  onClose,
  inspectionId,
  onSubmit,
}: CreateReportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInspectors, setSelectedInspectors] = useState<
    Array<{ id: number; name: string }>
  >([]);

  // Fetch available inspectors
  const { data: inspectorNames = [] } = useInspectorNames();

  // Form setup
  const form = useForm<CreateReportFormData>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      reportDate: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      inspectorIds: [],
      findings: '',
      recommendations: '',
      weatherConditions: '',
      safetyNotes: '',
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        reportDate: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        inspectorIds: [],
        findings: '',
        recommendations: '',
        weatherConditions: '',
        safetyNotes: '',
      });
      setSelectedInspectors([]);
    }
  }, [isOpen, form]);

  // Handle form submission
  const handleSubmit = async (data: CreateReportFormData) => {
    setIsSubmitting(true);

    try {
      const reportData: CreateDailyReportRequest = {
        inspectionId,
        reportDate: data.reportDate,
        description: data.description,
        inspectorIds: data.inspectorIds,
        findings: data.findings || undefined,
        recommendations: data.recommendations || undefined,
        weatherConditions: data.weatherConditions || undefined,
        safetyNotes: data.safetyNotes || undefined,
      };

      await onSubmit?.(reportData);
      onClose();
    } catch (error) {
      console.error('Failed to create report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle inspector selection
  const handleInspectorAdd = (inspectorName: string) => {
    // Generate a mock ID for the inspector (in real app, this would come from API)
    const inspectorId = inspectorNames.indexOf(inspectorName) + 1;

    if (!selectedInspectors.find(i => i.name === inspectorName)) {
      const newInspectors = [
        ...selectedInspectors,
        { id: inspectorId, name: inspectorName },
      ];
      setSelectedInspectors(newInspectors);
      form.setValue(
        'inspectorIds',
        newInspectors.map(i => i.id)
      );
    }
  };

  const handleInspectorRemove = (inspectorName: string) => {
    const newInspectors = selectedInspectors.filter(
      i => i.name !== inspectorName
    );
    setSelectedInspectors(newInspectors);
    form.setValue(
      'inspectorIds',
      newInspectors.map(i => i.id)
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Daily Report</DialogTitle>
          <DialogDescription>
            Add a new daily report for inspection ID: {inspectionId}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Basic Information */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-medium text-sm">Basic Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Report Date */}
                  <FormField
                    control={form.control}
                    name="reportDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Report Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  safeFormatDate(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                field.value ? new Date(field.value) : undefined
                              }
                              onSelect={date =>
                                field.onChange(
                                  date ? format(date, 'yyyy-MM-dd') : ''
                                )
                              }
                              disabled={date =>
                                date > new Date() ||
                                date < new Date('1900-01-01')
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Weather Conditions */}
                  <FormField
                    control={form.control}
                    name="weatherConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weather Conditions</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select weather conditions" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="clear">Clear</SelectItem>
                            <SelectItem value="cloudy">Cloudy</SelectItem>
                            <SelectItem value="rainy">Rainy</SelectItem>
                            <SelectItem value="windy">Windy</SelectItem>
                            <SelectItem value="hot">Hot</SelectItem>
                            <SelectItem value="cold">Cold</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Inspector Selection */}
                <div className="space-y-3">
                  <FormLabel>Inspectors</FormLabel>

                  {/* Selected Inspectors */}
                  {selectedInspectors.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedInspectors.map(inspector => (
                        <Badge
                          key={inspector.name}
                          variant="secondary"
                          className="flex items-center space-x-1"
                        >
                          <span>{inspector.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleInspectorRemove(inspector.name)
                            }
                            className="h-4 w-4 p-0 hover:bg-transparent"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Inspector Selection */}
                  <Select onValueChange={handleInspectorAdd}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add inspector" />
                    </SelectTrigger>
                    <SelectContent>
                      {inspectorNames
                        .filter(
                          name => !selectedInspectors.find(i => i.name === name)
                        )
                        .map(name => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {form.formState.errors.inspectorIds && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.inspectorIds.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Report Content */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-medium text-sm">Report Content</h3>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the work performed, observations, and activities..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a detailed description of the inspection
                        activities and observations.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Findings */}
                <FormField
                  control={form.control}
                  name="findings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Findings</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Document any findings, issues, or anomalies discovered..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Record any significant findings or issues identified
                        during the inspection.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Recommendations */}
                <FormField
                  control={form.control}
                  name="recommendations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recommendations</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide recommendations for follow-up actions..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Suggest any recommended actions or follow-up activities.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Safety Notes */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-medium text-sm">
                  Safety & Additional Notes
                </h3>

                <FormField
                  control={form.control}
                  name="safetyNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Safety Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Document any safety observations, incidents, or precautions..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Record any safety-related observations or incidents.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Create Report</span>
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

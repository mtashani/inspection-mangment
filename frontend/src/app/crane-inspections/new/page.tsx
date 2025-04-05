'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Crane, fetchCrane, createCraneInspection } from '@/api/cranes';
import { ROUTES } from '@/config/constants';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

// Form validation schema
const inspectionFormSchema = z.object({
  crane_id: z.coerce.number().int().positive('Please select a crane'),
  inspection_date: z.string().min(1, 'Inspection date is required'),
  performed_by: z.string().min(1, 'Inspector name is required'),
  status: z.string().min(1, 'Inspection status is required'),
  findings: z.string().min(1, 'Findings are required'),
  recommendations: z.string().min(1, 'Recommendations are required'),
  allowed_capacity: z.coerce.number().min(0, 'Allowed capacity must be non-negative'),
  certificate_image: z.any().optional(),
  report_file: z.any().optional(),
});

type FormValues = z.infer<typeof inspectionFormSchema>;

export default function NewInspectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const craneId = searchParams.get('craneId');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [crane, setCrane] = useState<Crane | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues: {
      crane_id: craneId ? parseInt(craneId) : 0,
      inspection_date: format(new Date(), 'yyyy-MM-dd'),
      performed_by: '',
      status: 'PASS',
      findings: '',
      recommendations: '',
      allowed_capacity: 0,
    },
  });

  // Load crane details if craneId is provided
  useEffect(() => {
    const loadCraneDetails = async () => {
      if (!craneId) return;
      
      try {
        setIsLoading(true);
        const craneData = await fetchCrane(parseInt(craneId));
        setCrane(craneData);
        form.setValue('allowed_capacity', craneData.nominal_capacity);
      } catch (err) {
        console.error('Error loading crane details:', err);
        setError('Failed to load crane details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCraneDetails();
  }, [craneId, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add all form fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        // Skip file fields - we'll handle them separately
        if (key !== 'certificate_image' && key !== 'report_file') {
          formData.append(key, String(value));
        }
      });

      // Add files if present
      const certificateFile = form.getValues('certificate_image');
      if (certificateFile && certificateFile[0]) {
        formData.append('certificate_image', certificateFile[0]);
      }

      const reportFile = form.getValues('report_file');
      if (reportFile && reportFile[0]) {
        formData.append('report_file', reportFile[0]);
      }

      await createCraneInspection(formData);
      
      // Navigate back to crane details page
      if (craneId) {
        router.push(ROUTES.CRANES.DETAIL(craneId));
      } else {
        router.push(ROUTES.CRANES.LIST);
      }
    } catch (err) {
      console.error('Error creating inspection:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create inspection record. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">New Crane Inspection</h1>
          <p className="text-muted-foreground">
            {crane ? `Record an inspection for ${crane.tag_number}` : 'Record an inspection for a crane'}
          </p>
        </div>
        <div>
          <Button variant="outline" asChild>
            <Link href={craneId ? ROUTES.CRANES.DETAIL(craneId) : ROUTES.CRANES.LIST}>
              Cancel
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

      <Card>
        <CardHeader>
          <CardTitle>Inspection Details</CardTitle>
          <CardDescription>Record the results of a crane inspection</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center">Loading crane details...</div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {!craneId && (
                  <FormField
                    control={form.control}
                    name="crane_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Crane ID</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="inspection_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inspection Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="performed_by"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Performed By</FormLabel>
                        <FormControl>
                          <Input placeholder="Inspector's name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PASS">Pass</SelectItem>
                            <SelectItem value="FAIL">Fail</SelectItem>
                            <SelectItem value="CONDITIONAL">Conditional Pass</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowed_capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allowed Capacity (tons)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              // Optional: Add logic to warn if value exceeds nominal capacity
                            }}
                          />
                        </FormControl>
                        {crane && field.value > crane.nominal_capacity && (
                          <p className="text-sm text-yellow-600">
                            Warning: This exceeds the nominal capacity of {crane.nominal_capacity} tons
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="findings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Findings</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe inspection findings"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recommendations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recommendations</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide recommendations based on findings"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certificate_image"
                  render={({ field: { onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Certificate Image</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => onChange(e.target.files)}
                          {...fieldProps}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="report_file"
                  render={({ field: { onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Report File (PDF)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => onChange(e.target.files)}
                          {...fieldProps}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <CardFooter className="px-0 pb-0">
                  <div className="flex justify-end gap-2 w-full">
                    <Button variant="outline" type="button" asChild>
                      <Link href={craneId ? ROUTES.CRANES.DETAIL(craneId) : ROUTES.CRANES.LIST}>
                        Cancel
                      </Link>
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Inspection'}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
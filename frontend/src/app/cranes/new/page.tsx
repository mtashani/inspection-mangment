'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { createCrane } from '@/api/cranes';
import { ROUTES } from '@/config/constants';
import Link from 'next/link';

// Form validation schema
const craneFormSchema = z.object({
  tag_number: z.string().min(1, 'Tag number is required'),
  crane_type: z.enum(['Overhead', 'Mobile', 'Gantry', 'Jib', 'Bridge']),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  model: z.string().min(1, 'Model is required'),
  serial_number: z.string().min(1, 'Serial number is required'),
  location: z.string().min(1, 'Location is required'),
  installation_date: z.string().min(1, 'Installation date is required'),
  nominal_capacity: z.coerce.number().positive('Capacity must be positive'),
  current_allowed_capacity: z.coerce.number().positive('Allowed capacity must be positive'),
  risk_level: z.string().min(1, 'Risk level is required'),
});

type FormValues = z.infer<typeof craneFormSchema>;

export default function NewCranePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(craneFormSchema),
    defaultValues: {
      tag_number: '',
      crane_type: 'Overhead',
      manufacturer: '',
      model: '',
      serial_number: '',
      location: '',
      installation_date: new Date().toISOString().split('T')[0],
      nominal_capacity: 0,
      current_allowed_capacity: 0,
      risk_level: 'medium',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Make sure allowed capacity doesn't exceed nominal capacity
      if (data.current_allowed_capacity > data.nominal_capacity) {
        data.current_allowed_capacity = data.nominal_capacity;
      }
      
      await createCrane({
        ...data,
        status: 'Active',
        last_inspection_date: null,
        next_inspection_date: null
      });
      
      // Navigate back to crane list on successful creation
      router.push(ROUTES.CRANES.LIST);
    } catch (err) {
      console.error('Error creating crane:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create crane. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Add New Crane</h1>
          <p className="text-muted-foreground">Enter the details of a new crane</p>
        </div>
        <div>
          <Button variant="outline" asChild>
            <Link href={ROUTES.CRANES.LIST}>Cancel</Link>
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
          <CardTitle>Crane Information</CardTitle>
          <CardDescription>Enter all required details for the new crane</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="tag_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tag Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CRANE-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="crane_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crane Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select crane type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Overhead">Overhead</SelectItem>
                          <SelectItem value="Mobile">Mobile</SelectItem>
                          <SelectItem value="Gantry">Gantry</SelectItem>
                          <SelectItem value="Jib">Jib</SelectItem>
                          <SelectItem value="Bridge">Bridge</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Konecranes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CXT500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serial_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., SN12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Building A - North Wing" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="installation_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Installation Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nominal_capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nominal Capacity (tons)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="current_allowed_capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Allowed Capacity (tons)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="risk_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select risk level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <CardFooter className="px-0 pb-0">
                <div className="flex justify-end gap-2 w-full">
                  <Button variant="outline" type="button" asChild>
                    <Link href={ROUTES.CRANES.LIST}>Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Crane'}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
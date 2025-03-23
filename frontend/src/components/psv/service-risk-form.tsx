'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ServiceRiskCategory } from "./types";

const serviceRiskSchema = z.object({
  service_type: z.string().min(1, "Service type is required"),
  cof_score: z.number().int().min(1).max(5),
  description: z.string().optional(),
  notes: z.string().optional()
});

export type ServiceRiskInputData = z.infer<typeof serviceRiskSchema>;

// Create a type alias for input data (without id, created_at, updated_at fields)
export type ServiceRiskFormData = Omit<ServiceRiskCategory, 'id' | 'created_at' | 'updated_at'>;

interface ServiceRiskFormProps {
  initialData?: ServiceRiskCategory;
  onSubmit: (data: ServiceRiskFormData) => void;
}

export function ServiceRiskForm({ initialData, onSubmit }: ServiceRiskFormProps) {
  const form = useForm<ServiceRiskFormData>({
    resolver: zodResolver(serviceRiskSchema),
    defaultValues: initialData || {
      service_type: "",
      cof_score: 3,
      description: "",
      notes: ""
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="service_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Flammable Gas" {...field} />
                </FormControl>
                <FormDescription>
                  The type of service or fluid in the PSV
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cof_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CoF Score (1-5)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    placeholder="1-5"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Consequence of Failure score per API 581
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of this service type"
                  className="h-20"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes or considerations"
                  className="h-20"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Save Service Risk Category
        </Button>
      </form>
    </Form>
  );
}
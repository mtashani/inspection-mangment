'use client';

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, PlusCircledIcon, MinusCircledIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RBILevel } from "./types";
// Form schema for calibration - with proper fields for editing
const calibrationFormSchema = z.object({
  // Basic fields
  calibration_date: z.date(),
  work_no: z.string().min(1, "Work number is required"),
  work_maintenance: z.object({
    adjust: z.boolean().default(false),
    cleaning: z.boolean().default(false),
    lapping: z.boolean().default(false),
  }),
  test_medium: z.enum(["Nitrogen", "Air", "Steam", "Water"] as const),
  // Test results - always required
  post_repair_pop_test: z.number().min(0, "Value must be positive"),
  post_repair_leak_test: z.number().min(0, "Value must be positive"),
  
  
  // Level 2+ fields - conditionally required
  pre_repair_pop_test: z.number().optional(),
  pre_repair_leak_test: z.number().optional(),
  
  // Personnel
  inspector: z.string().min(1, "Inspector is required"),
  test_operator: z.string().min(1, "Test operator is required"),
  approved_by: z.string().min(1, "Approver is required"),
  
  // Optional fields
  body_condition: z.string().optional(),
  spring_condition: z.string().optional(),
  seat_tightness: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomCalibrationFormData = z.infer<typeof calibrationFormSchema>;

interface CustomCalibrationFormProps {
  onSubmit: (data: CustomCalibrationFormData) => void;
  defaultValues?: Partial<CustomCalibrationFormData>;
  rbiLevel: RBILevel;
}

export function CustomCalibrationForm({
  onSubmit,
  defaultValues,
  rbiLevel,
}: CustomCalibrationFormProps) {
  const [showNotes, setShowNotes] = useState(!!defaultValues?.notes);

  const form = useForm<CustomCalibrationFormData>({
    resolver: zodResolver(calibrationFormSchema),
    defaultValues: {
      calibration_date: new Date(),
      work_maintenance: {
        adjust: false,
        cleaning: false,
        lapping: false,
      },
      ...defaultValues,
    },
  });

  const handleWorkMaintenanceChange = (checked: boolean, value: string) => {
    const currentValues = form.getValues().work_maintenance;
    form.setValue('work_maintenance', {
      ...currentValues,
      [value.toLowerCase()]: checked,
    }, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    
    form.trigger('work_maintenance');
  };

  // Use the same form data type but add a custom submission handler with logging
  const handleFormSubmit = (data: CustomCalibrationFormData) => {
    console.log("Form submitted with data:", data);
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form
        id="calibration-form"
        onSubmit={(e) => {
          console.log("Form submit event triggered");
          form.handleSubmit(handleFormSubmit)(e);
        }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Force Date and Work Number to be side-by-side regardless of screen size */}
            <div className="flex flex-row gap-4 w-full">
              <FormField
                control={form.control}
                name="calibration_date"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal min-w-[220px] w-full",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
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
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="work_no"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Work Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter work order number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <FormLabel>Work Type</FormLabel>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="adjust"
                      checked={form.watch('work_maintenance.adjust')}
                      onCheckedChange={(checked) => 
                        handleWorkMaintenanceChange(checked as boolean, 'adjust')
                      }
                    />
                    <Label htmlFor="adjust">Adjust</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cleaning"
                      checked={form.watch('work_maintenance.cleaning')}
                      onCheckedChange={(checked) => 
                        handleWorkMaintenanceChange(checked as boolean, 'cleaning')
                      }
                    />
                    <Label htmlFor="cleaning">Cleaning</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lapping"
                      checked={form.watch('work_maintenance.lapping')}
                      onCheckedChange={(checked) => 
                        handleWorkMaintenanceChange(checked as boolean, 'lapping')
                      }
                    />
                    <Label htmlFor="lapping">Lapping</Label>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="test_medium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Medium</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select medium" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["Nitrogen", "Air", "Steam", "Water"].map((medium) => (
                          <SelectItem key={medium} value={medium}>
                            {medium}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rbiLevel >= 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pre_repair_pop_test"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Pop Test</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter initial pop value"
                          value={field.value === null ? '' : field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pre_repair_leak_test"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Leak Test (bubbles/min)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter leak rate"
                          value={field.value === null ? '' : field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="post_repair_pop_test"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Final Pop Test</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter final pop value"
                        value={field.value === null ? '' : field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="post_repair_leak_test"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Final Leak Test (bubbles/min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter leak rate"
                        value={field.value === null ? '' : field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Removed redundant Pop Pressure and Leak Test Pressure fields */}
          </CardContent>
        </Card>

        {/* Condition assessment card only shown for RBI level 3 and above */}
        {rbiLevel >= 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Condition Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="body_condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Condition</FormLabel>
                      <FormControl>
                        <Input placeholder="Body condition details" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="spring_condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spring Condition</FormLabel>
                      <FormControl>
                        <Input placeholder="Spring condition details" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="seat_tightness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seat Tightness</FormLabel>
                      <FormControl>
                        <Input placeholder="Seat tightness details" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="inspector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspector</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter inspector name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="test_operator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operator</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter operator name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="approved_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approved By</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter approver name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex items-center text-sm"
                onClick={() => setShowNotes(!showNotes)}
              >
                {showNotes ? (
                  <MinusCircledIcon className="mr-1 h-4 w-4" />
                ) : (
                  <PlusCircledIcon className="mr-1 h-4 w-4" />
                )}
                {showNotes ? "Hide Notes" : "Add Notes"}
              </Button>

              {showNotes && (
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormControl>
                        <Textarea
                          placeholder="Enter general condition notes"
                          className="h-20"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
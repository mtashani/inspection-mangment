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

// Form schema for calibration - with all required fields
const calibrationFormSchema = z.object({
  // Basic fields
  calibration_date: z.date(),
  work_no: z.string().min(1, "Work number is required"),
  work_maintenance: z.object({
    adjust: z.boolean().default(false),
    cleaning: z.boolean().default(false),
    lapping: z.boolean().default(false),
  }),
  change_parts: z.string().optional(),
  test_medium: z.enum(["Nitrogen", "Air", "Steam", "Water"] as const),
  
  // Test results - always required
  post_repair_pop_test: z.number().min(0, "Value must be positive"),
  post_repair_leak_test: z.number().min(0, "Value must be positive"),
  
  // Level 2+ fields - conditionally required
  pre_repair_pop_test: z.number().optional(),
  pre_repair_leak_test: z.number().optional(),
  
  // Level 3+ condition assessment fields
  body_condition_score: z.number().min(1).max(5).optional(),
  body_condition_notes: z.string().optional(),
  internal_parts_score: z.number().min(1).max(5).optional(),
  internal_parts_notes: z.string().optional(),
  seat_plug_condition_score: z.number().min(1).max(5).optional(),
  seat_plug_notes: z.string().optional(),
  
  // Personnel
  inspector: z.string().min(1, "Inspector is required"),
  test_operator: z.string().min(1, "Test operator is required"),
  approved_by: z.string().min(1, "Approver is required"),
  
  // Optional fields
  general_condition: z.string().optional(),
});

type CalibrationFormData = z.infer<typeof calibrationFormSchema>;

interface PSVCalibrationFormCompactProps {
  onSubmit: (data: CalibrationFormData) => void;
  defaultValues?: Partial<CalibrationFormData>;
  rbiLevel: RBILevel;
}

export function PSVCalibrationFormCompact({
  onSubmit,
  defaultValues,
  rbiLevel,
}: PSVCalibrationFormCompactProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [showChangeParts, setShowChangeParts] = useState(false);

  const form = useForm<CalibrationFormData>({
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

  const renderScoreSelect = (
    field: keyof CalibrationFormData,
    label: string
  ) => (
    <FormField
      control={form.control}
      name={field}
      render={({ field: inputField }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            onValueChange={(value) => inputField.onChange(parseInt(value))}
            value={inputField.value?.toString()}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select score" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((score) => (
                <SelectItem key={score} value={score.toString()}>
                  {score}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );

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
    
    // Force UI update
    form.trigger('work_maintenance');
  };

  // Define a proper type for the submission data
  type ApiSubmissionData = {
    calibration_date: Date;
    work_no: string;
    work_maintenance: "Adjust" | "Cleaning" | "Lapping";
    test_medium: "Nitrogen" | "Air" | "Steam" | "Water";
    inspector: string;
    test_operator: string;
    approved_by: string;
    post_repair_pop_test: number;
    post_repair_leak_test: number;
    pre_repair_pop_test?: number;
    pre_repair_leak_test?: number;
    body_condition_score?: number;
    body_condition_notes?: string;
    internal_parts_score?: number;
    internal_parts_notes?: string;
    seat_plug_condition_score?: number;
    seat_plug_notes?: string;
    general_condition?: string;
    change_parts?: string;
  };

  // Use the same form data type but add a custom submission handler
  const handleFormSubmit = (data: CalibrationFormData) => {
    // Extract work type selections
    const workTypes = [];
    if (data.work_maintenance.adjust) workTypes.push("Adjust");
    if (data.work_maintenance.cleaning) workTypes.push("Cleaning");
    if (data.work_maintenance.lapping) workTypes.push("Lapping");

    const maintenanceType = workTypes.length > 0 ? workTypes[0] : "Adjust";
    
    // Create a copy of data with the string-based work_maintenance
    const submissionData: ApiSubmissionData = {
      ...data,
      work_maintenance: maintenanceType as "Adjust" | "Cleaning" | "Lapping",
    };

    // Make the submission
    onSubmit(submissionData as unknown as CalibrationFormData);
  };

  return (
    <Form {...form}>
      <form id="calibration-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="calibration_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
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
                  <FormItem>
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

            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex items-center text-sm"
                onClick={() => setShowChangeParts(!showChangeParts)}
              >
                {showChangeParts ? (
                  <MinusCircledIcon className="mr-1 h-4 w-4" />
                ) : (
                  <PlusCircledIcon className="mr-1 h-4 w-4" />
                )}
                {showChangeParts ? "Hide Changed Parts" : "Add Changed Parts"}
              </Button>

              {showChangeParts && (
                <FormField
                  control={form.control}
                  name="change_parts"
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormControl>
                        <Input placeholder="List of changed parts" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
                      <FormLabel>Initial Pop Test (barg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter pressure"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                      <FormLabel>Initial Leak Test (barg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter pressure"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                    <FormLabel>Final Pop Test (barg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter pressure"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                    <FormLabel>Final Leak Test (barg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter pressure"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {(rbiLevel >= 3) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Condition Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderScoreSelect(
                  "body_condition_score",
                  "Body Condition Score",
                )}
                <FormField
                  control={form.control}
                  name="body_condition_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Condition Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderScoreSelect(
                  "internal_parts_score",
                  "Internal Parts Score",
                )}
                <FormField
                  control={form.control}
                  name="internal_parts_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Parts Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderScoreSelect(
                  "seat_plug_condition_score",
                  "Seat/Plug Condition Score",
                )}
                <FormField
                  control={form.control}
                  name="seat_plug_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seat/Plug Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter notes" {...field} />
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
                  name="general_condition"
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormControl>
                        <Textarea
                          placeholder="Enter general condition notes"
                          className="h-20"
                          {...field}
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
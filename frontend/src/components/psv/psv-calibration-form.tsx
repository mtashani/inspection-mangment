'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
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
import { RBILevel } from "./types";

// Form schema for calibration
const calibrationFormSchema = z.object({
  // Common fields for all RBI levels
  calibration_date: z.date(),
  work_maintenance: z.enum(["Adjust", "Cleaning", "Lapping"] as const),
  change_parts: z.string().optional(),
  test_medium: z.enum(["Nitrogen", "Air", "Steam", "Water"] as const),
  inspector: z.string().min(1, "Inspector is required"),
  test_operator: z.string().min(1, "Test operator is required"),
  general_condition: z.string().optional(),
  approved_by: z.string().min(1, "Approver is required"),
  work_no: z.string().min(1, "Work number is required"),

  // Level 2+ RBI fields
  pre_repair_pop_test: z.number().optional(),
  pre_repair_leak_test: z.number().optional(),
  post_repair_pop_test: z.number(),
  post_repair_leak_test: z.number(),

  // Level 3 Assessment Fields (1-5 scale)
  body_condition_score: z.number().min(1).max(5).optional(),
  body_condition_notes: z.string().optional(),
  internal_parts_score: z.number().min(1).max(5).optional(),
  internal_parts_notes: z.string().optional(),
  seat_plug_condition_score: z.number().min(1).max(5).optional(),
  seat_plug_notes: z.string().optional(),
});

type CalibrationFormData = z.infer<typeof calibrationFormSchema>;
type CalibrationFormField = keyof CalibrationFormData;

interface PSVCalibrationFormProps {
  rbiLevel: RBILevel;
  onSubmit: (data: CalibrationFormData) => void;
  defaultValues?: Partial<CalibrationFormData>;
}

export function PSVCalibrationForm({
  rbiLevel,
  onSubmit,
  defaultValues,
}: PSVCalibrationFormProps) {
  const form = useForm<CalibrationFormData>({
    resolver: zodResolver(calibrationFormSchema),
    defaultValues: {
      calibration_date: new Date(),
      ...defaultValues,
    },
  });

  const renderScoreSelect = (
    field: CalibrationFormField,
    label: string,
    description?: string
  ) => (
    <FormField
      control={form.control}
      name={field}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            onValueChange={(value) => field.onChange(parseInt(value))}
            defaultValue={field.value?.toString()}
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
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Common Fields */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="calibration_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Calibration Date</FormLabel>
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
            name="work_maintenance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Maintenance</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select work type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {["Adjust", "Cleaning", "Lapping"].map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
                      <SelectValue placeholder="Select test medium" />
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

          <FormField
            control={form.control}
            name="change_parts"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Changed Parts</FormLabel>
                <FormControl>
                  <Input placeholder="List of changed parts" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Level 2+ Fields */}
        {rbiLevel >= 2 && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="pre_repair_pop_test"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pre-repair Pop Test</FormLabel>
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
              name="pre_repair_leak_test"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pre-repair Leak Test</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter leakage rate"
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
              name="post_repair_pop_test"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Post-repair Pop Test</FormLabel>
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
                  <FormLabel>Post-repair Leak Test</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter leakage rate"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Level 3 Fields */}
        {rbiLevel >= 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {renderScoreSelect(
                "body_condition_score",
                "Body Condition",
                "Rate the condition of the PSV body (1-5)"
              )}
              <FormField
                control={form.control}
                name="body_condition_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body Condition Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter condition notes"
                        className="h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {renderScoreSelect(
                "internal_parts_score",
                "Internal Parts",
                "Rate the condition of internal parts (1-5)"
              )}
              <FormField
                control={form.control}
                name="internal_parts_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Parts Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter condition notes"
                        className="h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {renderScoreSelect(
                "seat_plug_condition_score",
                "Seat/Plug Condition",
                "Rate the condition of seat and plug (1-5)"
              )}
              <FormField
                control={form.control}
                name="seat_plug_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seat/Plug Condition Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter condition notes"
                        className="h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Inspector Information */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="inspector"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inspector</FormLabel>
                <FormControl>
                  <Input placeholder="Inspector name" {...field} />
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
                <FormLabel>Test Operator</FormLabel>
                <FormControl>
                  <Input placeholder="Operator name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="approved_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Approved By</FormLabel>
                <FormControl>
                  <Input placeholder="Approver name" {...field} />
                </FormControl>
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
                  <Input placeholder="Work order number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="general_condition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>General Condition</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter general condition notes"
                  className="h-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Submit Calibration
        </Button>
      </form>
    </Form>
  );
}
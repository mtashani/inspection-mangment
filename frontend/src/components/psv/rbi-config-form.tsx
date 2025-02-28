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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RBIConfiguration, RBILevel } from "./types";
import { JSX } from "react";
import { Checkbox } from "@/components/ui/checkbox";

// Define the Zod schema with proper RBI level validation
const rbiConfigSchema = z.object({
  level: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4)
  ]) as z.ZodType<RBILevel>,
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  active: z.boolean(),
  settings: z.object({
    fixed_interval: z.number().optional(), // For Level 1
    pop_test_thresholds: z.object({
      min: z.number(),
      max: z.number(),
    }).optional(),
    leak_test_thresholds: z.object({
      min: z.number(),
      max: z.number(),
    }).optional(),
    parameter_weights: z.record(z.string(), z.number()).optional(),
    risk_matrix: z.record(z.string(), z.array(z.number())).optional(),
    service_risk_categories: z.record(z.string(), z.number()).optional(),
  }),
});

type RBIConfigFormData = z.infer<typeof rbiConfigSchema>;

interface RBIConfigFormProps {
  initialData?: RBIConfiguration;
  onSubmit: (data: RBIConfigFormData) => void;
}

export function RBIConfigForm({ initialData, onSubmit }: RBIConfigFormProps): JSX.Element {
  const form = useForm<RBIConfigFormData>({
    resolver: zodResolver(rbiConfigSchema),
    defaultValues: initialData || {
      level: 1,
      name: "",
      active: true,
      settings: {
        fixed_interval: 36, // Default 3 years
        pop_test_thresholds: {
          min: -5,
          max: 5,
        },
        leak_test_thresholds: {
          min: -10,
          max: 10,
        },
      },
    },
  });

  const rbiLevel = form.watch("level");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RBI Level</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const level = parseInt(value) as RBILevel;
                    if (level >= 1 && level <= 4) {
                      field.onChange(level);
                    }
                  }}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select RBI level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[1, 2, 3, 4].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        Level {level}
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Configuration Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter configuration name" {...field} />
                </FormControl>
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
                  placeholder="Enter configuration description"
                  className="h-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Level 1 Settings */}
        {rbiLevel === 1 && (
          <FormField
            control={form.control}
            name="settings.fixed_interval"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fixed Interval (months)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter interval in months"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  The fixed calibration interval for Level 1 PSVs
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Level 2+ Settings */}
        {rbiLevel >= 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Pop Test Thresholds</h3>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="settings.pop_test_thresholds.min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Min threshold"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="settings.pop_test_thresholds.max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Max threshold"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Leak Test Thresholds</h3>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="settings.leak_test_thresholds.min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Min threshold"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="settings.leak_test_thresholds.max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Max threshold"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Parameter Weights */}
            <div>
              <h3 className="text-lg font-medium mb-2">Parameter Weights</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="settings.parameter_weights.pop_test"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pop Test Weight</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter weight (0-1)"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="settings.parameter_weights.leak_test"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leak Test Weight</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter weight (0-1)"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* Level 3 Additional Settings */}
        {rbiLevel >= 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Condition Assessment Weights</h3>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="settings.parameter_weights.body_condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body Condition Weight</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter weight (0-1)"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="settings.parameter_weights.internal_parts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Parts Weight</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter weight (0-1)"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="settings.parameter_weights.seat_plug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seat/Plug Weight</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter weight (0-1)"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Level 4 Additional Settings */}
        {rbiLevel === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Service Risk Categories (API 581)</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="settings.service_risk_categories.flammable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flammable Fluids (CoF Score)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        placeholder="Enter score (1-5)"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="settings.service_risk_categories.toxic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Toxic Fluids (CoF Score)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        placeholder="Enter score (1-5)"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Active configuration status"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Active Configuration</FormLabel>
                <FormDescription>
                  Only one configuration per RBI level can be active at a time
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Save Configuration
        </Button>
      </form>
    </Form>
  );
}
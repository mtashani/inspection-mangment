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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RBIConfiguration, RBILevel } from "./types";
import { useState, useEffect } from "react";
import { RBIPreviewPanel } from "./rbi-preview-panel";
import { Eye, Save } from "lucide-react";

// Schema for the RBI Configuration form
const rbiConfigSchema = z.object({
  level: z.number().min(1).max(4),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  active: z.boolean(),
  settings: z.object({
    fixed_interval: z.number().optional(),
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

// Partial type that removes fields we don't need the user to input
export type RBIConfigInputData = Omit<RBIConfiguration, 'id' | 'created_at' | 'updated_at'>;

interface RBIConfigFormProps {
  initialData?: RBIConfiguration;
  onSubmit: (data: RBIConfigInputData) => void;
}

export function RBIConfigForm({ initialData, onSubmit }: RBIConfigFormProps) {
  const [activeTab, setActiveTab] = useState<string>("general");
  const [formKey, setFormKey] = useState<number>(0); // Add a key to force re-render
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<RBIConfigInputData | null>(null);

  // Default form values
  const defaultValues = {
    level: 1,
    name: "",
    description: "",
    active: true,
    settings: {
      fixed_interval: 60,
      pop_test_thresholds: {
        min: 0.9,
        max: 1.1,
      },
      leak_test_thresholds: {
        min: 0.9,
        max: 1.1,
      },
      parameter_weights: {},
      risk_matrix: {},
      service_risk_categories: {},
    },
  };

  const form = useForm<RBIConfigFormData>({
    resolver: zodResolver(rbiConfigSchema),
    defaultValues: initialData || defaultValues,
  });

  // Reset form when initialData changes
  useEffect(() => {
    console.log("RBI form initialData changed:", initialData);
    if (initialData) {
      // Reset form with new values
      form.reset(initialData);
    } else {
      // Reset to default values
      form.reset(defaultValues);
    }
    // Increment key to force re-render
    setFormKey(prev => prev + 1);
  }, [initialData, form]);

  // Handle preview request
  const handlePreview = () => {
    const values = form.getValues();
    // Cast level to RBILevel to satisfy TypeScript
    const formattedData = {
      ...values,
      level: values.level as RBILevel,
    };
    
    setPreviewData(formattedData);
    setShowPreview(true);
  };

  // Handle dismissing the preview
  const handleDismissPreview = () => {
    setShowPreview(false);
  };

  // Handle form submission
  const handleSubmit = form.handleSubmit((data) => {
    // Cast level to RBILevel to satisfy TypeScript
    const formattedData = {
      ...data,
      level: data.level as RBILevel,
    };
    onSubmit(formattedData);
  });

  return (
    <Form {...form} key={formKey}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {showPreview && previewData ? (
          <RBIPreviewPanel 
            configData={previewData}
            onDismiss={handleDismissPreview}
          />
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="general">General</TabsTrigger>
                {/* Only show Test Thresholds tab for level 2 and above */}
                {form.watch("level") >= 2 && (
                  <TabsTrigger value="thresholds">Test Thresholds</TabsTrigger>
                )}
                {form.watch("level") >= 3 && (
                  <TabsTrigger value="weights">Parameter Weights</TabsTrigger>
                )}
                {form.watch("level") === 4 && (
                  <TabsTrigger value="risk">Risk Matrix</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RBI Level (1-4)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={4}
                            placeholder="1-4"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          RBI level determines the complexity of the algorithm
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <div>
                            <FormLabel>Active</FormLabel>
                            <FormDescription>
                              Enable this configuration for use
                            </FormDescription>
                            <p className="text-xs text-amber-600 mt-1">
                              Note: Only one RBI level configuration can be active at a time.
                              Activating this will deactivate all others.
                            </p>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Configuration name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description of this configuration"
                          className="h-20"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* For Level 1, show info message about database frequencies */}
                {form.watch("level") === 1 && (
                  <div className="rounded-md bg-blue-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm text-blue-700">
                          For Level 1, calibration frequencies are based on database values rather than fixed intervals.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Only show fixed interval for Levels > 1 */}
                {form.watch("level") > 1 && (
                  <FormField
                    control={form.control}
                    name="settings.fixed_interval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fixed Interval (months)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="60"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Default calibration interval in months
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              {/* Only show Test Thresholds tab content for level 2 and above */}
              {form.watch("level") >= 2 && (
                <TabsContent value="thresholds" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Pop Test Thresholds</h3>
                      <FormField
                        control={form.control}
                        name="settings.pop_test_thresholds.min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum (as % of set pressure)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.9"
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
                        name="settings.pop_test_thresholds.max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum (as % of set pressure)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="1.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Leak Test Thresholds</h3>
                      <FormField
                        control={form.control}
                        name="settings.leak_test_thresholds.min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum (as % of set pressure)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.9"
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
                        name="settings.leak_test_thresholds.max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum (as % of set pressure)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="1.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
              )}

              {form.watch("level") >= 3 && (
                <TabsContent value="weights" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormItem>
                      <FormLabel>Body Condition Weight</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="1.0"
                          value={form.watch("settings.parameter_weights.body") || 1.0}
                          onChange={(e) => {
                            const weights = form.getValues("settings.parameter_weights") || {};
                            form.setValue("settings.parameter_weights", {
                              ...weights,
                              body: parseFloat(e.target.value)
                            });
                          }}
                        />
                      </FormControl>
                    </FormItem>

                    <FormItem>
                      <FormLabel>Internal Parts Weight</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="1.0"
                          value={form.watch("settings.parameter_weights.internal") || 1.0}
                          onChange={(e) => {
                            const weights = form.getValues("settings.parameter_weights") || {};
                            form.setValue("settings.parameter_weights", {
                              ...weights,
                              internal: parseFloat(e.target.value)
                            });
                          }}
                        />
                      </FormControl>
                    </FormItem>

                    <FormItem>
                      <FormLabel>Seat/Plug Weight</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="1.0"
                          value={form.watch("settings.parameter_weights.seat") || 1.0}
                          onChange={(e) => {
                            const weights = form.getValues("settings.parameter_weights") || {};
                            form.setValue("settings.parameter_weights", {
                              ...weights,
                              seat: parseFloat(e.target.value)
                            });
                          }}
                        />
                      </FormControl>
                    </FormItem>

                    <FormItem>
                      <FormLabel>Pop Test Weight</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="1.0"
                          value={form.watch("settings.parameter_weights.pop_test") || 1.0}
                          onChange={(e) => {
                            const weights = form.getValues("settings.parameter_weights") || {};
                            form.setValue("settings.parameter_weights", {
                              ...weights,
                              pop_test: parseFloat(e.target.value)
                            });
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                </TabsContent>
              )}

              {form.watch("level") === 4 && (
                <TabsContent value="risk" className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Risk matrix configuration for the RBI algorithm. 
                    This determines how consequence of failure and probability of failure 
                    scores are combined to produce a risk category.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-md font-medium mb-2">Risk Category (months)</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <FormItem>
                          <FormLabel>High Risk</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="12"
                              value={form.watch("settings.risk_matrix.high")?.[0] || 12}
                              onChange={(e) => {
                                const matrix = form.getValues("settings.risk_matrix") || {};
                                form.setValue("settings.risk_matrix", {
                                  ...matrix,
                                  high: [parseInt(e.target.value)]
                                });
                              }}
                            />
                          </FormControl>
                        </FormItem>
                        
                        <FormItem>
                          <FormLabel>Medium Risk</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="36"
                              value={form.watch("settings.risk_matrix.medium")?.[0] || 36}
                              onChange={(e) => {
                                const matrix = form.getValues("settings.risk_matrix") || {};
                                form.setValue("settings.risk_matrix", {
                                  ...matrix,
                                  medium: [parseInt(e.target.value)]
                                });
                              }}
                            />
                          </FormControl>
                        </FormItem>
                        
                        <FormItem>
                          <FormLabel>Low Risk</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="60"
                              value={form.watch("settings.risk_matrix.low")?.[0] || 60}
                              onChange={(e) => {
                                const matrix = form.getValues("settings.risk_matrix") || {};
                                form.setValue("settings.risk_matrix", {
                                  ...matrix,
                                  low: [parseInt(e.target.value)]
                                });
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          {!showPreview ? (
            <>
              <Button 
                type="button" 
                onClick={handlePreview} 
                className="flex items-center gap-2"
                variant="outline"
              >
                <Eye size={16} />
                Preview Changes
              </Button>
              <Button 
                type="submit" 
                className="flex items-center gap-2"
              >
                <Save size={16} />
                Save Configuration
              </Button>
            </>
          ) : (
            <Button 
              type="button" 
              onClick={handleDismissPreview}
              variant="outline"
            >
              Back to Form
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
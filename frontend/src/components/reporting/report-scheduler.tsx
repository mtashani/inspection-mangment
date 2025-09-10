"use client";

import { useState, useEffect } from "react";
import {
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ScheduleConfig {
  name: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timezone: string;
  recipients: {
    emails: string[];
    roles: string[];
  };
  format: "pdf" | "excel" | "csv" | "json";
  filters: Record<string, any>;
}

export interface ReportSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  template: any;
  onSchedule: (schedule: ScheduleConfig) => void;
}

export function ReportScheduler({
  isOpen,
  onClose,
  template,
  onSchedule,
}: ReportSchedulerProps) {
  const [formData, setFormData] = useState<ScheduleConfig>({
    name: "",
    description: "",
    frequency: "daily",
    time: "09:00",
    timezone: "UTC",
    recipients: {
      emails: [],
      roles: [],
    },
    format: "pdf",
    filters: {},
  });

  // Update form data when template changes
  useEffect(() => {
    if (template) {
      setFormData((prev) => ({
        ...prev,
        name: `${template.name} - Scheduled`,
        description: `Scheduled version of ${template.name}`,
      }));
    }
  }, [template]);

  const handleSave = () => {
    onSchedule(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Report</DialogTitle>
          <DialogDescription>
            Configure automatic generation for {template?.name || "this report"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="recipients">Recipients</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Schedule Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter schedule name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Output Format</Label>
                <Select
                  value={formData.format}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter schedule description"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, frequency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, time: e.target.value }))
                  }
                />
              </div>
            </div>

            {formData.frequency === "weekly" && (
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <Select
                  value={String(formData.dayOfWeek || 1)}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      dayOfWeek: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                    <SelectItem value="0">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.frequency === "monthly" && (
              <div className="space-y-2">
                <Label htmlFor="dayOfMonth">Day of Month</Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dayOfMonth || 1}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dayOfMonth: parseInt(e.target.value),
                    }))
                  }
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="recipients" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emails">Email Recipients</Label>
              <Textarea
                id="emails"
                value={formData.recipients.emails.join("\n")}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    recipients: {
                      ...prev.recipients,
                      emails: e.target.value
                        .split("\n")
                        .filter((email) => email.trim()),
                    },
                  }))
                }
                placeholder="Enter email addresses (one per line)"
                rows={4}
              />
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <EnvelopeIcon className="h-4 w-4" />
                <span>
                  {formData.recipients.emails.length} email recipient(s)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roles">Role Recipients</Label>
              <Input
                id="roles"
                value={formData.recipients.roles.join(", ")}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    recipients: {
                      ...prev.recipients,
                      roles: e.target.value
                        .split(",")
                        .map((role) => role.trim())
                        .filter(Boolean),
                    },
                  }))
                }
                placeholder="Enter roles (comma separated)"
              />
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <UserGroupIcon className="h-4 w-4" />
                <span>
                  {formData.recipients.roles.length} role recipient(s)
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              <p>
                Configure filters to customize report content based on the
                template parameters.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select
                  value={formData.filters.dateRange || "last_week"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      filters: { ...prev.filters, dateRange: value },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="last_week">Last Week</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="last_quarter">Last Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {template?.parameters?.map((param: unknown) => (
                <div key={param.id} className="space-y-2">
                  <Label>{param.label}</Label>
                  {param.type === "select" && (
                    <Select
                      value={formData.filters[param.name] || param.defaultValue}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          filters: { ...prev.filters, [param.name]: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${param.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {param.options?.map((option: string) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {param.type === "text" && (
                    <Input
                      value={
                        formData.filters[param.name] || param.defaultValue || ""
                      }
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          filters: {
                            ...prev.filters,
                            [param.name]: e.target.value,
                          },
                        }))
                      }
                      placeholder={param.label}
                    />
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <CalendarDaysIcon className="h-4 w-4 mr-2" />
            Schedule Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { ScheduleConfig, ReportSchedulerProps };

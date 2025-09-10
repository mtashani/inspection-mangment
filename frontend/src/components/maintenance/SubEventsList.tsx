"use client";

import React, { useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import {
  MaintenanceSubEvent,
  MaintenanceEventStatus,
  MaintenanceEventStatusEnum,
} from "@/types/maintenance";
import {
  InspectionPlan,
  EnhancedInspection,
  InspectionStatus,
} from "@/types/enhanced-maintenance";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import InspectionsList from "./InspectionsList";
import EventStatusIndicator from "./EventStatusIndicator";

interface SubEventsListProps {
  subEvents: MaintenanceSubEvent[];
  plannedInspections: InspectionPlan[];
  activeInspections: EnhancedInspection[];
  completedInspections: EnhancedInspection[];
  onInspectionCreate?: (subEventId: string) => void;
  onInspectionUpdate?: (
    inspectionId: string,
    data: Partial<EnhancedInspection>
  ) => void;
  showActions?: boolean;
}

interface SubEventCardProps {
  subEvent: MaintenanceSubEvent;
  plannedInspections: InspectionPlan[];
  activeInspections: EnhancedInspection[];
  completedInspections: EnhancedInspection[];
  onInspectionCreate?: (subEventId: string) => void;
  onInspectionUpdate?: (inspectionId: string, data: unknown) => void;
  showActions?: boolean;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

const SubEventCard: React.FC<SubEventCardProps> = ({
  subEvent,
  plannedInspections,
  activeInspections,
  completedInspections,
  onInspectionCreate,
  onInspectionUpdate,
  showActions = true,
  expanded = false,
  onToggleExpanded,
}) => {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateDaysRemaining = (): { days: number; isOverdue: boolean } => {
    const now = new Date();
    const endDate = new Date(subEvent.actualEndDate || subEvent.plannedEndDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      days: Math.abs(diffDays),
      isOverdue:
        diffDays < 0 &&
        subEvent.status !== MaintenanceEventStatusEnum.COMPLETED,
    };
  };

  const getSubEventInspections = () => {
    const planned = plannedInspections.filter(
      (p) => p.maintenanceSubEventId === subEvent.id
    );
    const active = activeInspections.filter(
      (i) => i.inspectionPlan?.maintenanceSubEventId === subEvent.id
    );
    const completed = completedInspections.filter(
      (i) => i.inspectionPlan?.maintenanceSubEventId === subEvent.id
    );

    return { planned, active, completed };
  };

  const { days, isOverdue } = calculateDaysRemaining();
  const { planned, active, completed } = getSubEventInspections();
  const totalInspections = planned.length + active.length + completed.length;

  const getSubTypeColor = (subType?: string): string => {
    switch (subType) {
      case "PREPARATION":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "DISASSEMBLY":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "INSPECTION":
        return "bg-green-100 text-green-800 border-green-200";
      case "REPAIR":
        return "bg-red-100 text-red-800 border-red-200";
      case "REASSEMBLY":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "TESTING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card
      className={cn(
        "mb-3 ml-4 border-l-4",
        isOverdue ? "border-l-red-500 bg-red-50" : "border-l-blue-500",
        expanded ? "ring-1 ring-blue-200" : ""
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="p-1 h-6 w-6"
            >
              {expanded ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronRightIcon className="h-3 w-3" />
              )}
            </Button>

            <div className="flex items-center space-x-2">
              <h4 className="text-base font-medium text-gray-900">
                {subEvent.subEventNumber}
              </h4>
              {subEvent.subType && (
                <Badge
                  className={cn("text-xs", getSubTypeColor(subEvent.subType))}
                >
                  {subEvent.subType}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <EventStatusIndicator
              status={subEvent.status}
              completionPercentage={subEvent.completionPercentage}
              size="sm"
            />

            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                {days}d overdue
              </Badge>
            )}
          </div>
        </div>

        <div className="ml-9">
          <h5 className="text-sm font-medium text-gray-800 mb-1">
            {subEvent.title}
          </h5>

          {subEvent.description && (
            <p className="text-xs text-gray-600 mb-2">{subEvent.description}</p>
          )}

          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-3 w-3" />
              <span>
                {formatDate(subEvent.plannedStartDate)} -{" "}
                {formatDate(subEvent.plannedEndDate)}
              </span>
            </div>

            {totalInspections > 0 && (
              <div className="flex items-center space-x-1">
                <CheckCircleIcon className="h-3 w-3" />
                <span>{totalInspections} inspections</span>
              </div>
            )}
          </div>

          {/* Progress Bar for In Progress Sub-Events */}
          {subEvent.status === MaintenanceEventStatusEnum.IN_PROGRESS && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">
                  Progress
                </span>
                <span className="text-xs text-gray-500">
                  {subEvent.completionPercentage}%
                </span>
              </div>
              <Progress value={subEvent.completionPercentage} className="h-1" />
            </div>
          )}

          {/* Quick Inspection Stats */}
          {totalInspections > 0 && (
            <div className="mt-2 flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-xs">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">{planned.length} planned</span>
              </div>
              <div className="flex items-center space-x-1 text-xs">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">{active.length} active</span>
              </div>
              <div className="flex items-center space-x-1 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">
                  {completed.length} completed
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="mt-2 flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onInspectionCreate?.(subEvent.id)}
                className="text-xs h-7"
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                Add Inspection
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      {expanded && totalInspections > 0 && (
        <CardContent className="pt-0 ml-9">
          <Separator className="mb-3" />
          <InspectionsList
            plannedInspections={planned}
            activeInspections={active}
            completedInspections={completed}
            onInspectionCreate={() => onInspectionCreate?.(subEvent.id)}
            onInspectionUpdate={onInspectionUpdate}
            showActions={showActions}
            compact={true}
          />
        </CardContent>
      )}
    </Card>
  );
};

const SubEventsList: React.FC<SubEventsListProps> = ({
  subEvents,
  plannedInspections,
  activeInspections,
  completedInspections,
  onInspectionCreate,
  onInspectionUpdate,
  showActions = true,
}) => {
  const [expandedSubEvents, setExpandedSubEvents] = useState<Set<string>>(
    new Set()
  );

  const toggleSubEventExpanded = (subEventId: string) => {
    const newExpanded = new Set(expandedSubEvents);
    if (newExpanded.has(subEventId)) {
      newExpanded.delete(subEventId);
    } else {
      newExpanded.add(subEventId);
    }
    setExpandedSubEvents(newExpanded);
  };

  if (subEvents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">
          No sub-events defined for this maintenance event.
        </p>
        {showActions && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => onInspectionCreate?.("")}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Direct Inspection
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900">Sub-Events</h3>
        <Badge variant="outline" className="text-xs">
          {subEvents.length} sub-events
        </Badge>
      </div>

      {subEvents.map((subEvent) => (
        <SubEventCard
          key={subEvent.id}
          subEvent={subEvent}
          plannedInspections={plannedInspections}
          activeInspections={activeInspections}
          completedInspections={completedInspections}
          onInspectionCreate={onInspectionCreate}
          onInspectionUpdate={onInspectionUpdate}
          showActions={showActions}
          expanded={expandedSubEvents.has(subEvent.id)}
          onToggleExpanded={() => toggleSubEventExpanded(subEvent.id)}
        />
      ))}
    </div>
  );
};

export default SubEventsList;

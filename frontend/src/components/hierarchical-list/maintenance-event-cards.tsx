"use client";

import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ChartBarIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MaintenanceEvent,
  MaintenanceSubEvent,
  MaintenanceEventStatus,
  MaintenanceEventType,
} from "@/types/maintenance";

export interface MaintenanceEventCardProps {
  maintenanceEvent: MaintenanceEvent;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onCreateSubEvent: (eventId: string) => void;
  onViewSubEvent: (subEventId: string) => void;
  onEditSubEvent: (subEventId: string) => void;
  onStartEvent: (eventId: string) => void;
  onPauseEvent: (eventId: string) => void;
  onCompleteEvent: (eventId: string) => void;
  onViewProgress: (eventId: string) => void;
  className?: string;
}

export function MaintenanceEventCard({
  maintenanceEvent,
  isExpanded,
  onToggleExpanded,
  onCreateSubEvent,
  onViewSubEvent,
  onEditSubEvent,
  onStartEvent,
  onPauseEvent,
  onCompleteEvent,
  onViewProgress,
  className,
}: MaintenanceEventCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Calculate completion percentage
  const completionPercentage =
    maintenanceEvent.subEvents.length > 0
      ? Math.round(
          (maintenanceEvent.subEvents.filter(
            (subEvent) => subEvent.status === "COMPLETED"
          ).length /
            maintenanceEvent.subEvents.length) *
            100
        )
      : maintenanceEvent.completionPercentage || 0;

  // Get status color
  const getStatusColor = (status: MaintenanceEventStatus) => {
    switch (status) {
      case "PLANNED":
        return "bg-gray-100 text-gray-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "POSTPONED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get priority color
  const getPriorityColor = (eventType: MaintenanceEventType) => {
    switch (eventType) {
      case "CORRECTIVE":
        return "bg-red-100 text-red-800";
      case "PREVENTIVE":
        return "bg-blue-100 text-blue-800";
      case "OVERHAUL":
        return "bg-purple-100 text-purple-800";
      case "REPAIR":
        return "bg-orange-100 text-orange-800";
      case "INSPECTION":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status icon
  const getStatusIcon = (status: MaintenanceEventStatus) => {
    switch (status) {
      case "PLANNED":
        return <ClockIcon className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <PlayIcon className="h-4 w-4" />;
      case "COMPLETED":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "CANCELLED":
        return <StopIcon className="h-4 w-4" />;
      case "POSTPONED":
        return <PauseIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Check if event is overdue
  const isOverdue = () => {
    if (
      maintenanceEvent.status === "COMPLETED" ||
      maintenanceEvent.status === "CANCELLED"
    ) {
      return false;
    }
    const now = new Date();
    const plannedEnd = new Date(maintenanceEvent.plannedEndDate);
    return now > plannedEnd;
  };

  // Handle action clicks
  const handleStartEvent = async () => {
    setIsLoading(true);
    try {
      await onStartEvent(maintenanceEvent.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseEvent = async () => {
    setIsLoading(true);
    try {
      await onPauseEvent(maintenanceEvent.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteEvent = async () => {
    setIsLoading(true);
    try {
      await onCompleteEvent(maintenanceEvent.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn("transition-all duration-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </Button>
            <WrenchScrewdriverIcon className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-medium truncate">
                {maintenanceEvent.title}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {maintenanceEvent.eventNumber}
                </Badge>
                <Badge
                  className={cn(
                    "text-xs",
                    getPriorityColor(maintenanceEvent.eventType)
                  )}
                >
                  {maintenanceEvent.eventType}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              className={cn("text-xs", getStatusColor(maintenanceEvent.status))}
            >
              <div className="flex items-center space-x-1">
                {getStatusIcon(maintenanceEvent.status)}
                <span>{maintenanceEvent.status.replace("_", " ")}</span>
              </div>
            </Badge>
            {isOverdue() && (
              <Badge variant="destructive" className="text-xs">
                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {maintenanceEvent.status === "PLANNED" && (
                  <DropdownMenuItem
                    onClick={handleStartEvent}
                    disabled={isLoading}
                  >
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Start Event
                  </DropdownMenuItem>
                )}
                {maintenanceEvent.status === "IN_PROGRESS" && (
                  <>
                    <DropdownMenuItem
                      onClick={handlePauseEvent}
                      disabled={isLoading}
                    >
                      <PauseIcon className="h-4 w-4 mr-2" />
                      Pause Event
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleCompleteEvent}
                      disabled={isLoading}
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Complete Event
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onViewProgress(maintenanceEvent.id)}
                >
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  View Progress
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onCreateSubEvent(maintenanceEvent.id)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Sub-Event
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Event Details */}
        <div className="space-y-3">
          {/* Description */}
          {maintenanceEvent.description && (
            <p className="text-sm text-muted-foreground">
              {maintenanceEvent.description}
            </p>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {/* Date Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-muted-foreground">Planned Start</div>
                <div className="font-medium">
                  {formatDate(maintenanceEvent.plannedStartDate)}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-muted-foreground">Planned End</div>
                <div className="font-medium">
                  {formatDate(maintenanceEvent.plannedEndDate)}
                </div>
              </div>
            </div>
          </div>

          {/* Actual Dates if available */}
          {(maintenanceEvent.actualStartDate ||
            maintenanceEvent.actualEndDate) && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {maintenanceEvent.actualStartDate && (
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-muted-foreground">Actual Start</div>
                    <div className="font-medium">
                      {formatDate(maintenanceEvent.actualStartDate)}
                    </div>
                  </div>
                </div>
              )}
              {maintenanceEvent.actualEndDate && (
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-muted-foreground">Actual End</div>
                    <div className="font-medium">
                      {formatDate(maintenanceEvent.actualEndDate)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-events Summary */}
          {maintenanceEvent.subEvents.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sub-events</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {
                    maintenanceEvent.subEvents.filter(
                      (sub) => sub.status === "COMPLETED"
                    ).length
                  }{" "}
                  / {maintenanceEvent.subEvents.length}
                </span>
                <span className="text-muted-foreground">completed</span>
              </div>
            </div>
          )}

          {/* Created By */}
          {maintenanceEvent.createdBy && (
            <div className="flex items-center space-x-2 text-sm">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created by</span>
              <span className="font-medium">{maintenanceEvent.createdBy}</span>
            </div>
          )}
        </div>

        {/* Sub-events List */}
        {isExpanded && maintenanceEvent.subEvents.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Sub-events
              </h4>
              <div className="space-y-2">
                {maintenanceEvent.subEvents.map((subEvent) => (
                  <MaintenanceSubEventCard
                    key={subEvent.id}
                    subEvent={subEvent}
                    onView={() => onViewSubEvent(subEvent.id)}
                    onEdit={() => onEditSubEvent(subEvent.id)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Add Sub-event Button */}
        {isExpanded && (
          <>
            <Separator className="my-4" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCreateSubEvent(maintenanceEvent.id)}
              className="w-full"
              disabled={isLoading}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Sub-event
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Sub-event Card Component
interface MaintenanceSubEventCardProps {
  subEvent: MaintenanceSubEvent;
  onView: () => void;
  onEdit: () => void;
}

function MaintenanceSubEventCard({
  subEvent,
  onView,
  onEdit,
}: MaintenanceSubEventCardProps) {
  // Get status color
  const getStatusColor = (status: MaintenanceEventStatus) => {
    switch (status) {
      case "PLANNED":
        return "bg-gray-100 text-gray-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "POSTPONED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status icon
  const getStatusIcon = (status: MaintenanceEventStatus) => {
    switch (status) {
      case "PLANNED":
        return <ClockIcon className="h-3 w-3" />;
      case "IN_PROGRESS":
        return <PlayIcon className="h-3 w-3" />;
      case "COMPLETED":
        return <CheckCircleIcon className="h-3 w-3" />;
      case "CANCELLED":
        return <StopIcon className="h-3 w-3" />;
      case "POSTPONED":
        return <PauseIcon className="h-3 w-3" />;
      default:
        return <ClockIcon className="h-3 w-3" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <Badge className={cn("text-xs", getStatusColor(subEvent.status))}>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(subEvent.status)}
                  <span>{subEvent.status.replace("_", " ")}</span>
                </div>
              </Badge>
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-medium truncate">{subEvent.title}</h5>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                <span>{subEvent.subEventNumber}</span>
                <span>
                  {formatDate(subEvent.plannedStartDate)} -{" "}
                  {formatDate(subEvent.plannedEndDate)}
                </span>
                {subEvent.completionPercentage > 0 && (
                  <span>{subEvent.completionPercentage}% complete</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onView}
              className="h-7 w-7 p-0"
            >
              <EyeIcon className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-7 w-7 p-0"
            >
              <PencilIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {subEvent.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {subEvent.description}
          </p>
        )}
        {subEvent.completionPercentage > 0 && (
          <div className="mt-2">
            <Progress value={subEvent.completionPercentage} className="h-1" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

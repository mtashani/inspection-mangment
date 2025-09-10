'use client'

import React, { useState } from 'react'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  PlayIcon, 
  PauseIcon,
  XCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/solid'

import { MaintenanceEventStatus, MaintenanceEventStatusEnum } from '@/types/maintenance'
import { EventStatusIndicatorProps } from '@/types/enhanced-maintenance'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const EventStatusIndicator: React.FC<EventStatusIndicatorProps> = ({
  status,
  completionPercentage = 0,
  canChangeStatus = false,
  onStatusChange,
  size = 'md'
}) => {
  const [isChanging, setIsChanging] = useState(false)

  const getStatusConfig = (status: MaintenanceEventStatus) => {
    switch (status) {
      case MaintenanceEventStatusEnum.PLANNED:
        return {
          label: 'Planning Phase',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: ClockIcon,
          iconColor: 'text-blue-600'
        }
      case MaintenanceEventStatusEnum.IN_PROGRESS:
        return {
          label: 'In Progress',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: PlayIcon,
          iconColor: 'text-yellow-600'
        }
      case MaintenanceEventStatusEnum.COMPLETED:
        return {
          label: 'Completed',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircleIcon,
          iconColor: 'text-green-600'
        }
      case MaintenanceEventStatusEnum.CANCELLED:
        return {
          label: 'Cancelled',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircleIcon,
          iconColor: 'text-red-600'
        }
      case MaintenanceEventStatusEnum.POSTPONED:
        return {
          label: 'Postponed',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: PauseIcon,
          iconColor: 'text-gray-600'
        }
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: ClockIcon,
          iconColor: 'text-gray-600'
        }
    }
  }

  const getAvailableTransitions = (currentStatus: MaintenanceEventStatus): MaintenanceEventStatus[] => {
    switch (currentStatus) {
      case MaintenanceEventStatusEnum.PLANNED:
        return [MaintenanceEventStatusEnum.IN_PROGRESS, MaintenanceEventStatusEnum.POSTPONED, MaintenanceEventStatusEnum.CANCELLED]
      case MaintenanceEventStatusEnum.IN_PROGRESS:
        return [MaintenanceEventStatusEnum.COMPLETED, MaintenanceEventStatusEnum.POSTPONED, MaintenanceEventStatusEnum.CANCELLED]
      case MaintenanceEventStatusEnum.POSTPONED:
        return [MaintenanceEventStatusEnum.PLANNED, MaintenanceEventStatusEnum.IN_PROGRESS, MaintenanceEventStatusEnum.CANCELLED]
      case MaintenanceEventStatusEnum.COMPLETED:
        return [] // Completed events cannot be changed
      case MaintenanceEventStatusEnum.CANCELLED:
        return [MaintenanceEventStatusEnum.PLANNED] // Can only reactivate cancelled events
      default:
        return []
    }
  }

  const handleStatusChange = async (newStatus: MaintenanceEventStatus) => {
    if (!onStatusChange) return

    setIsChanging(true)
    try {
      await onStatusChange(newStatus)
    } catch (error) {
      console.error('Failed to change status:', error)
    } finally {
      setIsChanging(false)
    }
  }

  const config = getStatusConfig(status)
  const IconComponent = config.icon
  const availableTransitions = getAvailableTransitions(status)

  const sizeClasses = {
    sm: {
      badge: 'text-xs px-2 py-1',
      icon: 'h-3 w-3',
      progress: 'h-1'
    },
    md: {
      badge: 'text-sm px-3 py-1',
      icon: 'h-4 w-4',
      progress: 'h-2'
    },
    lg: {
      badge: 'text-base px-4 py-2',
      icon: 'h-5 w-5',
      progress: 'h-3'
    }
  }

  const classes = sizeClasses[size]

  if (!canChangeStatus || availableTransitions.length === 0) {
    return (
      <div className="flex flex-col items-end space-y-1">
        <Badge className={cn(classes.badge, config.color, "border")}>
          <IconComponent className={cn(classes.icon, config.iconColor, "mr-1")} />
          {config.label}
        </Badge>
        
        {status === MaintenanceEventStatusEnum.IN_PROGRESS && completionPercentage > 0 && (
          <div className="flex items-center space-x-2 min-w-[100px]">
            <Progress 
              value={completionPercentage} 
              className={cn(classes.progress, "flex-1")} 
            />
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {completionPercentage}%
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end space-y-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isChanging}
            className={cn(
              "border-2 transition-colors",
              config.color.replace('bg-', 'hover:bg-').replace('text-', 'hover:text-'),
              isChanging && "opacity-50 cursor-not-allowed"
            )}
          >
            <IconComponent className={cn(classes.icon, config.iconColor, "mr-1")} />
            {config.label}
            <ChevronDownIcon className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-48">
          {availableTransitions.map((newStatus) => {
            const newConfig = getStatusConfig(newStatus)
            const NewIconComponent = newConfig.icon
            
            return (
              <DropdownMenuItem
                key={newStatus}
                onClick={() => handleStatusChange(newStatus)}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <NewIconComponent className={cn("h-4 w-4", newConfig.iconColor)} />
                <span>Change to {newConfig.label}</span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {status === MaintenanceEventStatusEnum.IN_PROGRESS && completionPercentage > 0 && (
        <div className="flex items-center space-x-2 min-w-[100px]">
          <Progress 
            value={completionPercentage} 
            className={cn(classes.progress, "flex-1")} 
          />
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {completionPercentage}%
          </span>
        </div>
      )}
    </div>
  )
}

export default EventStatusIndicator

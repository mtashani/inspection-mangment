'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Base interfaces for hierarchical items
export interface BaseHierarchicalItem {
  id: string
  type: string
  title: string
  status: string
  canEdit: boolean
  canDelete: boolean
  children?: BaseHierarchicalItem[]
}

export interface HierarchicalListProps<T extends BaseHierarchicalItem> {
  items: T[]
  expandedItems: Set<string>
  selectedItems: Set<string>
  onToggleExpand: (itemId: string) => void
  onToggleSelect: (itemId: string) => void
  onItemAction: (action: string, item: T) => void
  renderItem: (item: T, options: {
    isExpanded: boolean
    isSelected: boolean
    hasChildren: boolean
    level: number
    onToggleExpand: () => void
    onToggleSelect: () => void
    onAction: (action: string) => void
  }) => React.ReactNode
  isLoading?: boolean
  emptyMessage?: string
  className?: string
  maxDepth?: number
  enableKeyboardNavigation?: boolean
  enableMultiSelect?: boolean
  showLoadingSkeletons?: boolean
  skeletonCount?: number
}

export interface HierarchicalItemRenderOptions {
  isExpanded: boolean
  isSelected: boolean
  hasChildren: boolean
  level: number
  onToggleExpand: () => void
  onToggleSelect: () => void
  onAction: (action: string) => void
}

// Base hierarchical list component
export function BaseHierarchicalList<T extends BaseHierarchicalItem>({
  items,
  expandedItems,
  selectedItems,
  onToggleExpand,
  onToggleSelect,
  onItemAction,
  renderItem,
  isLoading = false,
  emptyMessage = 'No items found',
  className,
  maxDepth = 5,
  enableKeyboardNavigation = true,
  enableMultiSelect = true,
  showLoadingSkeletons = true,
  skeletonCount = 5
}: HierarchicalListProps<T>) {
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null)

  // Memoized flat list for keyboard navigation
  const flatItemsList = useMemo(() => {
    const flattenItems = (items: T[], level = 0): Array<{ item: T; level: number }> => {
      const result: Array<{ item: T; level: number }> = []
      
      items.forEach(item => {
        result.push({ item, level })
        
        if (item.children && expandedItems.has(item.id) && level < maxDepth) {
          result.push(...flattenItems(item.children as T[], level + 1))
        }
      })
      
      return result
    }
    
    return flattenItems(items)
  }, [items, expandedItems, maxDepth])

  // Keyboard navigation handlers
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!enableKeyboardNavigation || flatItemsList.length === 0) return

    const currentIndex = focusedItemId 
      ? flatItemsList.findIndex(({ item }) => item.id === focusedItemId)
      : -1

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        const nextIndex = Math.min(currentIndex + 1, flatItemsList.length - 1)
        setFocusedItemId(flatItemsList[nextIndex]?.item.id || null)
        break

      case 'ArrowUp':
        event.preventDefault()
        const prevIndex = Math.max(currentIndex - 1, 0)
        setFocusedItemId(flatItemsList[prevIndex]?.item.id || null)
        break

      case 'ArrowRight':
        if (focusedItemId) {
          const focusedItem = flatItemsList.find(({ item }) => item.id === focusedItemId)?.item
          if (focusedItem?.children && focusedItem.children.length > 0) {
            if (!expandedItems.has(focusedItemId)) {
              event.preventDefault()
              onToggleExpand(focusedItemId)
            }
          }
        }
        break

      case 'ArrowLeft':
        if (focusedItemId && expandedItems.has(focusedItemId)) {
          event.preventDefault()
          onToggleExpand(focusedItemId)
        }
        break

      case 'Enter':
      case ' ':
        if (focusedItemId) {
          event.preventDefault()
          if (enableMultiSelect) {
            onToggleSelect(focusedItemId)
          }
        }
        break

      case 'Escape':
        event.preventDefault()
        setFocusedItemId(null)
        break
    }
  }, [
    enableKeyboardNavigation,
    flatItemsList,
    focusedItemId,
    expandedItems,
    onToggleExpand,
    onToggleSelect,
    enableMultiSelect
  ])

  // Render individual item with children
  const renderHierarchicalItem = useCallback((
    item: T,
    level: number = 0
  ): React.ReactNode => {
    const isExpanded = expandedItems.has(item.id)
    const isSelected = selectedItems.has(item.id)
    const isFocused = focusedItemId === item.id
    const hasChildren = item.children && item.children.length > 0
    const canExpand = hasChildren && level < maxDepth

    const handleToggleExpand = () => {
      if (canExpand) {
        onToggleExpand(item.id)
      }
    }

    const handleToggleSelect = () => {
      if (enableMultiSelect) {
        onToggleSelect(item.id)
      }
    }

    const handleAction = (action: string) => {
      onItemAction(action, item)
    }

    const handleItemClick = () => {
      setFocusedItemId(item.id)
    }

    return (
      <div key={item.id} className=\"hierarchical-item-container\">
        {/* Main item */}
        <div
          className={cn(
            \"hierarchical-item\",
            \"transition-colors duration-200\",
            isFocused && \"ring-2 ring-primary ring-offset-2\",
            isSelected && \"bg-primary/5 border-primary/20\",
            level > 0 && \"ml-6\"
          )}
          style={{ paddingLeft: `${level * 1.5}rem` }}
          onClick={handleItemClick}
          tabIndex={enableKeyboardNavigation ? 0 : -1}
          role=\"treeitem\"
          aria-expanded={canExpand ? isExpanded : undefined}
          aria-selected={enableMultiSelect ? isSelected : undefined}
          aria-level={level + 1}
        >
          {renderItem(item, {
            isExpanded,
            isSelected,
            hasChildren: canExpand,
            level,
            onToggleExpand: handleToggleExpand,
            onToggleSelect: handleToggleSelect,
            onAction: handleAction
          })}
        </div>

        {/* Children */}
        {canExpand && isExpanded && item.children && (
          <div 
            className=\"hierarchical-children\"
            role=\"group\"
            aria-label={`${item.title} children`}
          >
            {item.children.map(child => 
              renderHierarchicalItem(child as T, level + 1)
            )}
          </div>
        )}
      </div>
    )
  }, [
    expandedItems,
    selectedItems,
    focusedItemId,
    maxDepth,
    onToggleExpand,
    onToggleSelect,
    onItemAction,
    enableMultiSelect,
    renderItem
  ])

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className=\"space-y-2\">
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <Card key={index} className=\"p-4\">
          <div className=\"flex items-center space-x-3\">
            <Skeleton className=\"h-4 w-4\" />
            <Skeleton className=\"h-4 w-24\" />
            <Skeleton className=\"h-4 w-16\" />
            <div className=\"flex-1\" />
            <Skeleton className=\"h-8 w-16\" />
            <Skeleton className=\"h-8 w-16\" />
          </div>
        </Card>
      ))}
    </div>
  )

  // Empty state component
  const EmptyState = () => (
    <Card className=\"p-8 text-center\">
      <CardContent>
        <div className=\"text-muted-foreground\">
          <div className=\"text-lg font-medium mb-2\">No Items Found</div>
          <p className=\"text-sm\">{emptyMessage}</p>
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading && showLoadingSkeletons) {
    return (
      <div className={cn(\"hierarchical-list-container\", className)}>
        <LoadingSkeleton />
      </div>
    )
  }

  if (!isLoading && items.length === 0) {
    return (
      <div className={cn(\"hierarchical-list-container\", className)}>
        <EmptyState />
      </div>
    )
  }

  return (
    <div
      className={cn(\"hierarchical-list-container\", className)}
      onKeyDown={handleKeyDown}
      role=\"tree\"
      aria-label=\"Hierarchical list\"
      tabIndex={enableKeyboardNavigation ? 0 : -1}
    >
      <div className=\"hierarchical-list space-y-2\">
        {items.map(item => renderHierarchicalItem(item, 0))}
      </div>
    </div>
  )
}

// Expand/Collapse button component
export interface ExpandButtonProps {
  isExpanded: boolean
  hasChildren: boolean
  onToggle: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ExpandButton({
  isExpanded,
  hasChildren,
  onToggle,
  disabled = false,
  size = 'md',
  className
}: ExpandButtonProps) {
  if (!hasChildren) {
    return <div className={cn(\"w-4 h-4\", size === 'sm' && \"w-3 h-3\", size === 'lg' && \"w-5 h-5\")} />
  }

  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'

  return (
    <Button
      variant=\"ghost\"
      size=\"sm\"
      className={cn(
        \"p-0 h-auto hover:bg-transparent\",
        disabled && \"opacity-50 cursor-not-allowed\",
        className
      )}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) {
          onToggle()
        }
      }}
      disabled={disabled}
      aria-label={isExpanded ? 'Collapse' : 'Expand'}
    >
      {isExpanded ? (
        <ChevronDownIcon className={cn(iconSize, \"text-muted-foreground\")} />
      ) : (
        <ChevronRightIcon className={cn(iconSize, \"text-muted-foreground\")} />
      )}
    </Button>
  )
}

// Selection checkbox component
export interface SelectionCheckboxProps {
  isSelected: boolean
  onToggle: () => void
  disabled?: boolean
  indeterminate?: boolean
  className?: string
}

export function SelectionCheckbox({
  isSelected,
  onToggle,
  disabled = false,
  indeterminate = false,
  className
}: SelectionCheckboxProps) {
  return (
    <input
      type=\"checkbox\"
      checked={isSelected}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate
      }}
      onChange={(e) => {
        e.stopPropagation()
        if (!disabled) {
          onToggle()
        }
      }}
      disabled={disabled}
      className={cn(
        \"h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary\",
        disabled && \"opacity-50 cursor-not-allowed\",
        className
      )}
      aria-label={isSelected ? 'Deselect item' : 'Select item'}
    />
  )
}

// Status badge component
export interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StatusBadge({
  status,
  variant = 'default',
  size = 'md',
  className
}: StatusBadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {status}
    </span>
  )
}

// Action buttons component
export interface ActionButtonsProps {
  actions: Array<{
    key: string
    label: string
    icon?: React.ComponentType<{ className?: string }>
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
    disabled?: boolean
    hidden?: boolean
  }>
  onAction: (actionKey: string) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ActionButtons({
  actions,
  onAction,
  size = 'sm',
  className
}: ActionButtonsProps) {
  const visibleActions = actions.filter(action => !action.hidden)

  if (visibleActions.length === 0) {
    return null
  }

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {visibleActions.map(action => {
        const Icon = action.icon

        return (
          <Button
            key={action.key}
            variant={action.variant || 'outline'}
            size={size}
            disabled={action.disabled}
            onClick={(e) => {
              e.stopPropagation()
              onAction(action.key)
            }}
            className=\"h-8\"
          >
            {Icon && <Icon className=\"h-4 w-4 mr-1\" />}
            {action.label}
          </Button>
        )
      })}
    </div>
  )
}

// Progress indicator component
export interface ProgressIndicatorProps {
  percentage: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
  className?: string
}

export function ProgressIndicator({
  percentage,
  showLabel = true,
  size = 'md',
  variant = 'default',
  className
}: ProgressIndicatorProps) {
  const clampedPercentage = Math.max(0, Math.min(100, percentage))
  
  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  }

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className={cn('flex-1 bg-gray-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn('h-full transition-all duration-300', variantClasses[variant])}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      {showLabel && (
        <span className=\"text-sm text-muted-foreground font-medium min-w-[3rem] text-right\">
          {Math.round(clampedPercentage)}%
        </span>
      )}
    </div>
  )
}

// Export all components and types
export type {
  BaseHierarchicalItem,
  HierarchicalListProps,
  HierarchicalItemRenderOptions
}
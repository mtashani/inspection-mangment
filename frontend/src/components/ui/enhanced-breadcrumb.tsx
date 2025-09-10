"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home, MoreHorizontal, ArrowRight, Slash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// Breadcrumb item interface
export interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  icon?: LucideIcon;
  current?: boolean;
  disabled?: boolean;
}

// Separator variants
type SeparatorVariant = 'chevron' | 'slash' | 'arrow';

interface EnhancedBreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: SeparatorVariant;
  showHome?: boolean;
  maxItems?: number;
  collapsible?: boolean;
  className?: string;
  itemClassName?: string;
  separatorClassName?: string;
  homeHref?: string;
  onItemClick?: (item: BreadcrumbItem) => void;
  responsive?: boolean;
}

export function EnhancedBreadcrumb({
  items,
  separator = 'chevron',
  showHome = true,
  maxItems = 5,
  collapsible = true,
  className,
  itemClassName,
  separatorClassName,
  homeHref = '/',
  onItemClick,
  responsive = true
}: EnhancedBreadcrumbProps) {
  // Add home item if requested
  const allItems = showHome 
    ? [
        {
          id: 'home',
          label: 'Home',
          href: homeHref,
          icon: Home
        },
        ...items
      ]
    : items;

  // Handle item truncation
  const shouldTruncate = collapsible && allItems.length > maxItems;
  const displayItems = shouldTruncate 
    ? [
        allItems[0], // First item (usually home)
        ...allItems.slice(-maxItems + 2) // Last few items
      ]
    : allItems;

  const hiddenItems = shouldTruncate 
    ? allItems.slice(1, allItems.length - maxItems + 2)
    : [];

  // Separator component
  const SeparatorIcon = () => {
    const iconProps = {
      className: cn("w-4 h-4 text-[var(--color-text-tertiary)]", separatorClassName)
    };

    switch (separator) {
      case 'slash':
        return <Slash {...iconProps} />;
      case 'arrow':
        return <ArrowRight {...iconProps} />;
      case 'chevron':
      default:
        return <ChevronRight {...iconProps} />;
    }
  };

  // Handle item click
  const handleItemClick = (item: BreadcrumbItem, e: React.MouseEvent) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    onItemClick?.(item);
  };

  // Render breadcrumb item
  const renderItem = (item: BreadcrumbItem, index: number, isLast: boolean) => {
    const Icon = item.icon;
    const isCurrent = item.current || isLast;
    
    const itemContent = (
      <span className={cn(
        "flex items-center gap-1.5 transition-colors duration-200",
        isCurrent 
          ? "text-[var(--color-text-primary)] font-medium" 
          : "text-[var(--color-text-secondary)] hover:text-[var(--color-primary-600)]",
        item.disabled && "opacity-50 cursor-not-allowed",
        itemClassName
      )}>
        {Icon && <Icon className="w-4 h-4" />}
        <span className={cn(
          "truncate",
          responsive && "max-w-[120px] sm:max-w-[200px]"
        )}>
          {item.label}
        </span>
      </span>
    );

    if (item.href && !item.disabled && !isCurrent) {
      return (
        <Link
          key={item.id}
          href={item.href}
          onClick={(e) => handleItemClick(item, e)}
          className="hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] focus:ring-offset-2 rounded-sm"
        >
          {itemContent}
        </Link>
      );
    }

    return (
      <span key={item.id} className={isCurrent ? "cursor-default" : "cursor-pointer"}>
        {itemContent}
      </span>
    );
  };

  // Render collapsed items dropdown
  const renderCollapsedItems = () => {
    if (hiddenItems.length === 0) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 hover:bg-[var(--color-bg-secondary)] focus:ring-2 focus:ring-[var(--color-primary-600)]"
          >
            <MoreHorizontal className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px]">
          {hiddenItems.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem
                key={item.id}
                disabled={item.disabled}
                className="flex items-center gap-2"
                onClick={() => {
                  if (item.href && !item.disabled) {
                    window.location.href = item.href;
                  }
                  onItemClick?.(item);
                }}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span className="truncate">{item.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (allItems.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center space-x-1 text-sm",
        responsive && "overflow-hidden",
        className
      )}
    >
      <ol className="flex items-center space-x-1">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const showSeparator = !isLast || (shouldTruncate && index === 0);

          return (
            <li key={item.id} className="flex items-center space-x-1">
              {renderItem(item, index, isLast)}
              
              {showSeparator && (
                <>
                  <SeparatorIcon />
                  {shouldTruncate && index === 0 && (
                    <>
                      {renderCollapsedItems()}
                      <SeparatorIcon />
                    </>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Hook for managing breadcrumb state
export function useBreadcrumb() {
  const [items, setItems] = React.useState<BreadcrumbItem[]>([]);

  const addItem = (item: BreadcrumbItem) => {
    setItems(prev => [...prev, item]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<BreadcrumbItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const setCurrentItem = (id: string) => {
    setItems(prev => prev.map(item => ({
      ...item,
      current: item.id === id
    })));
  };

  const reset = () => {
    setItems([]);
  };

  const replaceItems = (newItems: BreadcrumbItem[]) => {
    setItems(newItems);
  };

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    setCurrentItem,
    reset,
    replaceItems
  };
}

// Auto breadcrumb generator based on pathname
export function useAutoBreadcrumb(pathname: string, customLabels?: Record<string, string>) {
  const { items, replaceItems } = useBreadcrumb();

  React.useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbItems: BreadcrumbItem[] = segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      const label = customLabels?.[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      return {
        id: segment,
        label: label.replace(/-/g, ' '),
        href,
        current: index === segments.length - 1
      };
    });

    replaceItems(breadcrumbItems);
  }, [pathname, customLabels, replaceItems]);

  return { items };
}

// Breadcrumb variants for different use cases
export function SimpleBreadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <EnhancedBreadcrumb
      items={items}
      separator="chevron"
      showHome={false}
      collapsible={false}
      className={className}
    />
  );
}

export function CompactBreadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <EnhancedBreadcrumb
      items={items}
      separator="slash"
      showHome={true}
      maxItems={3}
      collapsible={true}
      responsive={true}
      className={cn("text-xs", className)}
    />
  );
}

export function DetailedBreadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <EnhancedBreadcrumb
      items={items}
      separator="arrow"
      showHome={true}
      maxItems={6}
      collapsible={true}
      responsive={true}
      className={cn("text-sm py-2 px-4 bg-[var(--color-bg-secondary)] rounded-lg", className)}
    />
  );
}
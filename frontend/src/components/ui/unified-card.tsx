"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon, MoreHorizontal, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Base Card Component
interface UnifiedCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated' | 'interactive' | 'flat';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  loading?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  borderColor?: string;
}

export function UnifiedCard({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className, 
  onClick,
  hover = false,
  loading = false,
  header,
  footer,
  noPadding = false,
  borderColor
}: UnifiedCardProps) {
  const variants = {
    default: 'border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-sm',
    outlined: 'border-2 border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-none',
    elevated: 'border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-lg',
    interactive: 'border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5',
    flat: 'bg-[var(--color-bg-secondary)] border-none shadow-none'
  };

  const sizes = {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const borderStyle = borderColor ? { borderColor } : {};

  return (
    <Card 
      className={cn(
        variants[variant],
        hover && 'hover:shadow-md transition-all duration-200 hover:-translate-y-0.5',
        loading && 'opacity-70 pointer-events-none',
        className
      )}
      onClick={onClick}
      style={borderStyle}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      {header && (
        <div className="px-4 py-3 border-b border-[var(--color-border-primary)]">
          {header}
        </div>
      )}
      
      <div className={noPadding ? '' : sizes[size]}>
        {children}
      </div>
      
      {footer && (
        <div className="px-4 py-3 border-t border-[var(--color-border-primary)]">
          {footer}
        </div>
      )}
    </Card>
  );
}

// Status Card Component
interface StatusCardProps {
  title: string;
  value: string | number;
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
  icon?: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
  loading?: boolean;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusCard({ 
  title, 
  value, 
  status = 'neutral', 
  icon: Icon, 
  description, 
  trend,
  className,
  onClick,
  loading = false,
  footer,
  size = 'md'
}: StatusCardProps) {
  const statusColors = {
    success: 'text-[var(--color-success-main)] bg-[var(--color-success-light)] border-[var(--color-success-main)]',
    warning: 'text-[var(--color-warning-main)] bg-[var(--color-warning-light)] border-[var(--color-warning-main)]',
    error: 'text-[var(--color-error-main)] bg-[var(--color-error-light)] border-[var(--color-error-main)]',
    info: 'text-[var(--color-info-main)] bg-[var(--color-info-light)] border-[var(--color-info-main)]',
    primary: 'text-[var(--color-primary-700)] bg-[var(--color-primary-50)] border-[var(--color-primary-200)]',
    neutral: 'text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)]'
  };

  const sizes = {
    sm: { title: 'text-xs', value: 'text-xl', description: 'text-xs' },
    md: { title: 'text-sm', value: 'text-2xl', description: 'text-xs' },
    lg: { title: 'text-base', value: 'text-3xl', description: 'text-sm' }
  };

  const cardFooter = footer ? (
    <div className="pt-3 mt-3 border-t border-[var(--color-border-primary)] opacity-80">
      {footer}
    </div>
  ) : null;

  return (
    <UnifiedCard 
      variant="outlined" 
      className={cn(statusColors[status], className)}
      onClick={onClick}
      hover={!!onClick}
      loading={loading}
      footer={cardFooter}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {Icon && <Icon className={cn("flex-shrink-0", sizes[size].title === 'text-xs' ? "w-3.5 h-3.5" : "w-4 h-4")} />}
            <p className={cn("font-medium opacity-80", sizes[size].title)}>{title}</p>
          </div>
          <p className={cn("font-bold", sizes[size].value)}>{value}</p>
          {description && (
            <p className={cn("opacity-70", sizes[size].description)}>{description}</p>
          )}
        </div>
        {trend && (
          <div className={cn(
            "font-medium px-2 py-1 rounded-full",
            sizes[size].description,
            trend.isPositive 
              ? "text-[var(--color-success-main)] bg-[var(--color-success-light)]" 
              : "text-[var(--color-error-main)] bg-[var(--color-error-light)]"
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
    </UnifiedCard>
  );
}

// List Card Component
interface ListCardProps {
  title: string;
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    status?: string;
    statusVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
    metadata?: string;
  }>;
  actions?: Array<{
    label: string;
    onClick: (id: string) => void;
  }>;
  onItemClick?: (id: string) => void;
  className?: string;
}

export function ListCard({ title, items, actions, onItemClick, className }: ListCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border bg-background/50",
              onItemClick && "cursor-pointer hover:bg-accent/50 transition-colors"
            )}
            onClick={() => onItemClick?.(item.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium truncate">{item.title}</p>
                {item.status && (
                  <Badge variant={item.statusVariant || 'default'} className="text-xs">
                    {item.status}
                  </Badge>
                )}
              </div>
              {item.subtitle && (
                <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
              )}
              {item.metadata && (
                <p className="text-xs text-muted-foreground mt-1">{item.metadata}</p>
              )}
            </div>
            
            {actions && actions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(item.id);
                      }}
                    >
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No items to display</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Info Card Component
interface InfoCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  variant?: 'info' | 'success' | 'warning' | 'error' | 'primary' | 'neutral';
  children?: React.ReactNode;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  actions?: React.ReactNode;
}

export function InfoCard({ 
  title, 
  description, 
  icon: Icon, 
  variant = 'info', 
  children, 
  className,
  dismissible = false,
  onDismiss,
  actions
}: InfoCardProps) {
  const variants = {
    info: 'border-[var(--color-info-light)] bg-[var(--color-info-light)] text-[var(--color-info-dark)]',
    success: 'border-[var(--color-success-light)] bg-[var(--color-success-light)] text-[var(--color-success-dark)]',
    warning: 'border-[var(--color-warning-light)] bg-[var(--color-warning-light)] text-[var(--color-warning-dark)]',
    error: 'border-[var(--color-error-light)] bg-[var(--color-error-light)] text-[var(--color-error-dark)]',
    primary: 'border-[var(--color-primary-100)] bg-[var(--color-primary-50)] text-[var(--color-primary-800)]',
    neutral: 'border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]'
  };

  return (
    <div className={cn("rounded-lg border p-4", variants[variant], className)}>
      <div className="flex items-start gap-3">
        {Icon && <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium">{title}</h4>
            {dismissible && onDismiss && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 rounded-full opacity-70 hover:opacity-100"
                onClick={onDismiss}
              >
                <span className="sr-only">Dismiss</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            )}
          </div>
          {description && (
            <p className="text-sm opacity-90">{description}</p>
          )}
          {children}
          
          {actions && (
            <div className="flex items-center gap-2 pt-2 mt-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
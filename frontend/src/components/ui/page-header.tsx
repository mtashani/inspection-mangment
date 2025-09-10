"use client";

import React from 'react';
import { EnhancedBreadcrumb, BreadcrumbItem } from './enhanced-breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface PageAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: PageAction[];
  badges?: Array<{
    id: string;
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  }>;
  className?: string;
  showBreadcrumbs?: boolean;
  size?: 'sm' | 'md' | 'lg';
  sticky?: boolean;
  background?: 'default' | 'transparent' | 'blur';
}

export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  actions = [],
  badges = [],
  className,
  showBreadcrumbs = true,
  size = 'md',
  sticky = false,
  background = 'default'
}: PageHeaderProps) {
  const sizes = {
    sm: {
      title: 'text-xl font-semibold',
      description: 'text-sm',
      padding: 'py-3',
      gap: 'space-y-2'
    },
    md: {
      title: 'text-2xl font-semibold',
      description: 'text-base',
      padding: 'py-4',
      gap: 'space-y-3'
    },
    lg: {
      title: 'text-3xl font-bold',
      description: 'text-lg',
      padding: 'py-6',
      gap: 'space-y-4'
    }
  };

  const backgrounds = {
    default: 'bg-[var(--color-bg-primary)] border-b border-[var(--color-border-primary)]',
    transparent: 'bg-transparent',
    blur: 'bg-[var(--color-bg-primary)]/80 backdrop-blur-sm border-b border-[var(--color-border-primary)]'
  };

  // Separate primary and secondary actions
  const primaryActions = actions.filter((_, index) => index < 2);
  const secondaryActions = actions.filter((_, index) => index >= 2);

  return (
    <header
      className={cn(
        "w-full",
        backgrounds[background],
        sticky && "sticky top-0 z-40",
        sizes[size].padding,
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className={cn("flex flex-col", sizes[size].gap)}>
          {/* Breadcrumbs */}
          {showBreadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center">
              <EnhancedBreadcrumb
                items={breadcrumbs}
                separator="chevron"
                showHome={true}
                maxItems={4}
                collapsible={true}
                responsive={true}
              />
            </div>
          )}

          {/* Title and Actions Row */}
          <div className="flex items-start justify-between gap-4">
            {/* Title Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className={cn(
                  "text-[var(--color-text-primary)] truncate",
                  sizes[size].title
                )}>
                  {title}
                </h1>
                
                {/* Badges */}
                {badges.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {badges.map((badge) => (
                      <Badge
                        key={badge.id}
                        variant={badge.variant || 'default'}
                        className="text-xs"
                      >
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              {description && (
                <p className={cn(
                  "text-[var(--color-text-secondary)] mt-1",
                  sizes[size].description
                )}>
                  {description}
                </p>
              )}
            </div>

            {/* Actions Section */}
            {actions.length > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Primary Actions */}
                {primaryActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant={action.variant || 'default'}
                      onClick={action.onClick}
                      disabled={action.disabled || action.loading}
                      className="flex items-center gap-2"
                    >
                      {action.loading ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        Icon && <Icon className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">{action.label}</span>
                    </Button>
                  );
                })}

                {/* Secondary Actions Dropdown */}
                {secondaryActions.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[160px]">
                      {secondaryActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <DropdownMenuItem
                            key={action.id}
                            onClick={action.onClick}
                            disabled={action.disabled || action.loading}
                            className="flex items-center gap-2"
                          >
                            {action.loading ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              Icon && <Icon className="w-4 h-4" />
                            )}
                            {action.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// Specialized page header variants
export function DashboardHeader({ title, description, actions, className }: {
  title: string;
  description?: string;
  actions?: PageAction[];
  className?: string;
}) {
  return (
    <PageHeader
      title={title}
      description={description}
      actions={actions}
      showBreadcrumbs={false}
      size="lg"
      background="transparent"
      className={className}
    />
  );
}

export function FormHeader({ title, description, breadcrumbs, actions, className }: {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: PageAction[];
  className?: string;
}) {
  return (
    <PageHeader
      title={title}
      description={description}
      breadcrumbs={breadcrumbs}
      actions={actions}
      showBreadcrumbs={true}
      size="md"
      sticky={true}
      background="blur"
      className={className}
    />
  );
}

export function ListHeader({ title, description, breadcrumbs, actions, badges, className }: {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: PageAction[];
  badges?: Array<{
    id: string;
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  }>;
  className?: string;
}) {
  return (
    <PageHeader
      title={title}
      description={description}
      breadcrumbs={breadcrumbs}
      actions={actions}
      badges={badges}
      showBreadcrumbs={true}
      size="md"
      background="default"
      className={className}
    />
  );
}
'use client';

import React, { useState } from 'react';
import { UnifiedCard } from './unified-card';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { LucideIcon, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  chart?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  detailsUrl?: string;
  collapsible?: boolean;
  loading?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
}

export function MetricCard({
  title,
  value,
  previousValue,
  icon: Icon,
  trend,
  chart,
  footer,
  className,
  onClick,
  detailsUrl,
  collapsible = false,
  loading = false,
  variant = 'default'
}: MetricCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const variantStyles = {
    default: '',
    primary: 'border-[var(--color-primary-200)] bg-[var(--color-primary-50)]',
    success: 'border-[var(--color-success-light)] bg-[var(--color-success-light)]',
    warning: 'border-[var(--color-warning-light)] bg-[var(--color-warning-light)]',
    error: 'border-[var(--color-error-light)] bg-[var(--color-error-light)]',
    info: 'border-[var(--color-info-light)] bg-[var(--color-info-light)]'
  };

  const trendColor = trend?.isPositive
    ? 'text-[var(--color-success-main)]'
    : 'text-[var(--color-error-main)]';

  const trendBg = trend?.isPositive
    ? 'bg-[var(--color-success-light)]'
    : 'bg-[var(--color-error-light)]';

  return (
    <UnifiedCard
      variant="default"
      className={cn(variantStyles[variant], className)}
      onClick={onClick}
      hover={!!onClick}
      loading={loading}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-[var(--color-text-secondary)]" />}
            <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {detailsUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-full"
                asChild
                onClick={handleDetailsClick}
              >
                <a href={detailsUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">View details</span>
                </a>
              </Button>
            )}
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-full"
                onClick={handleToggleExpand}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {expanded ? 'Collapse' : 'Expand'}
                </span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            {previousValue && (
              <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                Previous: {previousValue}
              </div>
            )}
          </div>
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                trendBg
              )}
            >
              {trend.isPositive ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              <span className={trendColor}>
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
              {trend.label && (
                <span className="text-[var(--color-text-tertiary)] ml-1">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>

        {(expanded || !collapsible) && chart && (
          <div className="pt-2 mt-2 border-t border-[var(--color-border-primary)]">
            {chart}
          </div>
        )}

        {(expanded || !collapsible) && footer && (
          <div className="pt-2 mt-2 border-t border-[var(--color-border-primary)] text-sm text-[var(--color-text-secondary)]">
            {footer}
          </div>
        )}
      </div>
    </UnifiedCard>
  );
}
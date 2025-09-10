'use client';

import React from 'react';
import { UnifiedCard } from './unified-card';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBackground?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  iconColor,
  iconBackground,
  action,
  className,
  variant = 'default',
  size = 'md',
  disabled = false
}: FeatureCardProps) {
  const handleClick = () => {
    if (disabled || !action?.onClick) return;
    action.onClick();
  };

  const iconStyles = {
    color: iconColor || 'var(--color-primary-600)',
    backgroundColor: iconBackground || 'var(--color-primary-100)'
  };

  const sizes = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6'
  };

  return (
    <UnifiedCard
      variant={variant}
      className={cn(
        'transition-all duration-200',
        disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md',
        className
      )}
      onClick={action?.onClick && !disabled ? handleClick : undefined}
      noPadding
    >
      <div className={sizes[size]}>
        {Icon && (
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: iconStyles.backgroundColor }}
          >
            <Icon 
              className="w-5 h-5" 
              style={{ color: iconStyles.color }}
            />
          </div>
        )}
        
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-[var(--color-text-secondary)] text-sm mb-4">{description}</p>
        
        {action && (
          action.href ? (
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 h-auto hover:bg-transparent hover:underline"
              asChild
              disabled={disabled}
            >
              <a href={action.href} className="flex items-center gap-1">
                {action.label}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </a>
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 h-auto hover:bg-transparent hover:underline"
              onClick={action.onClick}
              disabled={disabled}
            >
              <span className="flex items-center gap-1">
                {action.label}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </Button>
          )
        )}
      </div>
    </UnifiedCard>
  );
}
'use client';

import React from 'react';
import { UnifiedCard } from './unified-card';
import { Button } from './button';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { MoreHorizontal, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface ProfileCardProps {
  name: string;
  role?: string;
  avatar?: string;
  badges?: Array<{
    label: string;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  }>;
  metadata?: Array<{
    label: string;
    value: string;
  }>;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  className?: string;
  onClick?: () => void;
}

export function ProfileCard({
  name,
  role,
  avatar,
  badges,
  metadata,
  actions,
  className,
  onClick
}: ProfileCardProps) {
  return (
    <UnifiedCard
      variant="default"
      className={cn('', className)}
      onClick={onClick}
      hover={!!onClick}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
              <User className="w-6 h-6 text-[var(--color-primary-600)]" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold truncate">{name}</h3>
              {role && (
                <p className="text-sm text-[var(--color-text-secondary)]">{role}</p>
              )}
            </div>

            {/* Actions dropdown */}
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
                        action.onClick();
                      }}
                    >
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Badges */}
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {badges.map((badge, index) => (
                <Badge key={index} variant={badge.variant || 'default'}>
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}

          {/* Metadata */}
          {metadata && metadata.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-sm">
              {metadata.map((item, index) => (
                <div key={index} className="flex flex-col">
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    {item.label}
                  </span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </UnifiedCard>
  );
}
"use client"

import { FC } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SummaryCardProps {
  title: string
  count: number
  subCount?: { label: string; value: number }
  className?: string
  textColorClass?: string
  bgGradient?: string
  icon: React.ComponentType<{ className?: string }>
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'error'
}

export const SummaryCard: FC<SummaryCardProps> = ({ 
  title, 
  count,
  subCount,
  className = "", 
  textColorClass = "",
  bgGradient = "",
  icon: Icon,
  variant = 'primary'
}) => {
  // Get theme-aware colors based on variant
  const getVariantColors = (variant: string) => {
    switch (variant) {
      case 'success':
        return {
          iconBg: 'bg-[var(--color-success)]',
          textColor: 'text-[var(--color-success)]',
          gradient: 'bg-gradient-to-br from-[var(--color-success)]/5 via-[var(--color-success)]/10 to-[var(--color-success)]/15'
        }
      case 'warning':
        return {
          iconBg: 'bg-[var(--color-warning)]',
          textColor: 'text-[var(--color-warning)]',
          gradient: 'bg-gradient-to-br from-[var(--color-warning)]/5 via-[var(--color-warning)]/10 to-[var(--color-warning)]/15'
        }
      case 'info':
        return {
          iconBg: 'bg-[var(--color-info)]',
          textColor: 'text-[var(--color-info)]',
          gradient: 'bg-gradient-to-br from-[var(--color-info)]/5 via-[var(--color-info)]/10 to-[var(--color-info)]/15'
        }
      case 'error':
        return {
          iconBg: 'bg-[var(--color-error)]',
          textColor: 'text-[var(--color-error)]',
          gradient: 'bg-gradient-to-br from-[var(--color-error)]/5 via-[var(--color-error)]/10 to-[var(--color-error)]/15'
        }
      default: // primary
        return {
          iconBg: 'bg-[var(--color-primary)]',
          textColor: 'text-[var(--color-primary)]',
          gradient: 'bg-gradient-to-br from-[var(--color-primary)]/5 via-[var(--color-primary)]/10 to-[var(--color-primary)]/15'
        }
    }
  }

  const colors = getVariantColors(variant)
  const finalTextColor = textColorClass || colors.textColor
  const finalGradient = bgGradient || colors.gradient

  return (
    <Card 
      variant="elevated"
      className={cn(
        "backdrop-blur-sm shadow-[var(--depth)] hover:shadow-[calc(var(--depth)*2)] transition-all duration-300",
        "hover:-translate-y-1 relative overflow-hidden",
        finalGradient,
        className
      )}
    >
      {/* Enhanced background overlay */}
      <div className="absolute inset-0 opacity-[0.08] mix-blend-multiply">
        <div className="absolute inset-0 transform bg-gradient-to-br from-transparent via-[var(--color-base-content)]/5 to-[var(--color-base-content)]/10" />
      </div>

      <CardContent className="relative p-5 space-y-4">
        <div className="flex items-center space-x-4">
          <div className={cn(
            "p-3 rounded-[var(--radius-selector)] shadow-[var(--depth)]",
            className || colors.iconBg
          )}>
            <Icon className="w-5 h-5 text-[var(--color-primary-content)]" />
          </div>
          <h3 className="text-sm font-medium text-[var(--color-base-content)]/70">
            {title}
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <p className={cn("text-3xl font-bold tracking-tight", finalTextColor)}>
              {count}
            </p>
            {subCount && (
              <p className="text-xs font-medium text-[var(--color-base-content)]/50">
                {subCount.label}: {subCount.value}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
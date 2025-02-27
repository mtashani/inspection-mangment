"use client"

import { FC } from 'react'
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SummaryCardProps {
  title: string
  count: number
  subCount?: { label: string; value: number }
  className?: string
  textColorClass?: string
  bgGradient?: string
  icon: React.ComponentType<{ className?: string }>
}

export const SummaryCard: FC<SummaryCardProps> = ({ 
  title, 
  count,
  subCount,
  className = "", 
  textColorClass = "",
  bgGradient = "",
  icon: Icon
}) => {
  return (
    <Card className={cn(
      "backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300",
      "hover:-translate-y-1 relative overflow-hidden",
      bgGradient
    )}>
      <div className="absolute inset-0 opacity-[0.08] mix-blend-multiply dark:mix-blend-soft-light">
        <div className={cn(
          "absolute inset-0 transform",
          "bg-gradient-to-br from-transparent via-black/5 to-black/10"
        )} />
      </div>

      <div className="relative p-5 space-y-4">
        <div className="flex items-center space-x-4">
          <div className={cn(
            "p-3 rounded-xl shadow-lg",
            className
          )}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            {title}
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <p className={cn("text-3xl font-bold tracking-tight", textColorClass)}>
              {count}
            </p>
            {subCount && (
              <p className="text-xs font-medium text-muted-foreground/60">
                {subCount.label}: {subCount.value}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
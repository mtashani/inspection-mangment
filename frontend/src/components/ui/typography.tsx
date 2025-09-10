/**
 * Typography Components
 * Consistent text styling using CSS variables
 */

import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface TypographyProps {
  children: ReactNode
  className?: string
}

export function Title({ children, className }: TypographyProps) {
  return (
    <h1 className={cn(
      "text-[var(--font-size-lg)] font-[var(--font-weight-heading)] text-[var(--foreground)]",
      className
    )}>
      {children}
    </h1>
  )
}

export function Heading({ children, className }: TypographyProps) {
  return (
    <h2 className={cn(
      "text-[var(--font-size-lg)] font-[var(--font-weight-heading)] text-[var(--foreground)]",
      className
    )}>
      {children}
    </h2>
  )
}

export function Body({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      "text-[var(--font-size-base)] font-[var(--font-weight-body)] text-[var(--foreground)]",
      className
    )}>
      {children}
    </p>
  )
}

export function Small({ children, className }: TypographyProps) {
  return (
    <span className={cn(
      "text-[var(--font-size-sm)] font-[var(--font-weight-body)] text-[var(--muted-foreground)]",
      className
    )}>
      {children}
    </span>
  )
}
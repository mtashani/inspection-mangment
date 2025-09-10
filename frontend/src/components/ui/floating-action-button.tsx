import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const fabVariants = cva(
  "fixed inline-flex items-center justify-center rounded-full shadow-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:shadow-xl active:scale-95 z-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)]",
        secondary: "bg-[var(--color-success-main)] text-white hover:bg-[var(--color-success-dark)]",
        outline: "bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]",
      },
      size: {
        default: "h-14 w-14",
        sm: "h-12 w-12",
        lg: "h-16 w-16",
      },
      position: {
        "bottom-right": "bottom-6 right-6",
        "bottom-left": "bottom-6 left-6",
        "top-right": "top-6 right-6",
        "top-left": "top-6 left-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      position: "bottom-right",
    },
  }
)

export interface FloatingActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof fabVariants> {
  tooltip?: string
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ className, variant, size, position, tooltip, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(fabVariants({ variant, size, position, className }))}
        title={tooltip}
        {...props}
      >
        {children}
      </button>
    )
  }
)
FloatingActionButton.displayName = "FloatingActionButton"

export { FloatingActionButton, fabVariants }
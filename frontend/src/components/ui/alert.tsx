import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Enhanced Alert Variants with Theme Variables
 * Uses DaisyUI-style CSS variables and component-specific tokens
 */
const alertVariants = cva(
  [
    // Base styles using theme variables
    "relative w-full border transition-colors duration-200",
    "flex items-start gap-3",
    // Use theme-specific radius for alerts (--radius-box)
    "rounded-[var(--radius-box)]"
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-[var(--color-base-200)] text-[var(--color-base-content)]",
          "border-[var(--color-base-300)]"
        ],
        success: [
          "bg-[var(--color-success)]/10 text-[var(--color-success-content)]",
          "border-[var(--color-success)]/20",
          "[&>svg]:text-[var(--color-success)]"
        ],
        warning: [
          "bg-[var(--color-warning)]/10 text-[var(--color-warning-content)]",
          "border-[var(--color-warning)]/20",
          "[&>svg]:text-[var(--color-warning)]"
        ],
        error: [
          "bg-[var(--color-error)]/10 text-[var(--color-error-content)]",
          "border-[var(--color-error)]/20",
          "[&>svg]:text-[var(--color-error)]"
        ],
        info: [
          "bg-[var(--color-info)]/10 text-[var(--color-info-content)]",
          "border-[var(--color-info)]/20",
          "[&>svg]:text-[var(--color-info)]"
        ]
      },
      size: {
        sm: "p-3 text-sm",
        default: "p-4",
        lg: "p-6 text-lg"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

/**
 * Enhanced Alert Props Interfaces
 */
export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /**
   * Icon to display in the alert
   */
  icon?: React.ReactNode
  
  /**
   * Whether the alert is dismissible
   */
  dismissible?: boolean
  
  /**
   * Callback when alert is dismissed
   */
  onDismiss?: () => void
}

export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * Enhanced Alert Root Component
 */
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ 
    className,
    variant,
    size,
    icon,
    dismissible = false,
    onDismiss,
    children,
    ...props 
  }, ref) => {
    const handleDismiss = () => {
      onDismiss?.()
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant, size }), className)}
        {...props}
      >
        {icon && (
          <div className="shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {children}
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              "shrink-0 ml-2 p-1 transition-colors",
              "hover:bg-[var(--color-base-content)]/10",
              "rounded-[calc(var(--radius-box)*0.5)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Alert.displayName = "Alert"

/**
 * Enhanced Alert Title Component
 */
const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn(
        "mb-1 font-medium leading-none tracking-tight",
        "text-[var(--color-base-content)]",
        className
      )}
      {...props}
    />
  )
)
AlertTitle.displayName = "AlertTitle"

/**
 * Enhanced Alert Description Component
 */
const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "text-sm opacity-90",
        "text-[var(--color-base-content)]",
        className
      )}
      {...props}
    />
  )
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }

// Default icons for different alert variants
export const AlertIcons = {
  success: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}
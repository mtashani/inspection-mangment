import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Enhanced Badge Variants with Theme Variables
 * Uses DaisyUI-style CSS variables and component-specific tokens
 */
const badgeVariants = cva(
  [
    // Base styles using theme variables
    "inline-flex items-center font-medium transition-colors duration-200",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    // Use theme-specific radius for badges (--radius-selector)
    "rounded-[var(--radius-selector)]"
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-[var(--color-primary)] text-[var(--color-primary-content)]",
          "hover:bg-[var(--color-primary)]/80"
        ],
        secondary: [
          "bg-[var(--color-secondary)] text-[var(--color-secondary-content)]",
          "hover:bg-[var(--color-secondary)]/80"
        ],
        accent: [
          "bg-[var(--color-accent)] text-[var(--color-accent-content)]",
          "hover:bg-[var(--color-accent)]/80"
        ],
        neutral: [
          "bg-[var(--color-neutral)] text-[var(--color-neutral-content)]",
          "hover:bg-[var(--color-neutral)]/80"
        ],
        success: [
          "bg-[var(--color-success)] text-[var(--color-success-content)]",
          "hover:bg-[var(--color-success)]/80"
        ],
        warning: [
          "bg-[var(--color-warning)] text-[var(--color-warning-content)]",
          "hover:bg-[var(--color-warning)]/80"
        ],
        error: [
          "bg-[var(--color-error)] text-[var(--color-error-content)]",
          "hover:bg-[var(--color-error)]/80"
        ],
        info: [
          "bg-[var(--color-info)] text-[var(--color-info-content)]",
          "hover:bg-[var(--color-info)]/80"
        ],
        outline: [
          "bg-transparent text-[var(--color-base-content)]",
          "border border-[var(--color-base-300)]",
          "hover:bg-[var(--color-base-200)]"
        ],
        ghost: [
          "bg-[var(--color-base-200)] text-[var(--color-base-content)]",
          "hover:bg-[var(--color-base-300)]"
        ]
      },
      size: {
        sm: [
          "h-[calc(var(--size-selector)*0.8)] px-2 text-xs",
          "rounded-[calc(var(--radius-selector)*0.8)]"
        ],
        default: [
          "h-[var(--size-selector)] px-2.5 text-sm"
        ],
        lg: [
          "h-[calc(var(--size-selector)*1.2)] px-3",
          "rounded-[calc(var(--radius-selector)*1.1)]"
        ]
      },
      dot: {
        true: [
          "w-[calc(var(--size-selector)*0.6)] h-[calc(var(--size-selector)*0.6)]",
          "p-0 rounded-full"
        ],
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      dot: false
    }
  }
)

/**
 * Enhanced Badge Props Interface
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Icon to display in the badge
   */
  icon?: React.ReactNode
  
  /**
   * Whether the badge is removable (shows close button)
   */
  removable?: boolean
  
  /**
   * Callback when badge is removed
   */
  onRemove?: () => void
}

/**
 * Enhanced Badge Component with Theme Variables
 * 
 * Uses DaisyUI-style CSS variables for comprehensive theming
 * and supports icons, removal, and dot indicators
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    className,
    variant,
    size,
    dot,
    icon,
    removable = false,
    onRemove,
    children,
    ...props 
  }, ref) => {
    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation()
      onRemove?.()
    }

    // For dot badges, don't show children or icons
    if (dot) {
      return (
        <span
          ref={ref}
          className={cn(badgeVariants({ variant, size, dot }), className)}
          aria-label={typeof children === 'string' ? children : 'Status indicator'}
          {...props}
        />
      )
    }

    // Icon wrapper with theme-aware sizing
    const IconWrapper = ({ children: iconChild }: { children: React.ReactNode }) => {
      const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'
      return (
        <span className={cn("shrink-0 flex items-center justify-center", iconSize)}>
          {iconChild}
        </span>
      )
    }

    // Remove button with theme-aware styling
    const RemoveButton = () => {
      const buttonSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-4.5 h-4.5' : 'w-4 h-4'
      return (
        <button
          type="button"
          onClick={handleRemove}
          className={cn(
            "shrink-0 ml-1 p-0.5 transition-colors",
            "hover:bg-[var(--color-base-content)]/20",
            "rounded-[calc(var(--radius-selector)*0.5)]",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            buttonSize
          )}
          aria-label="Remove badge"
        >
          <X className="w-full h-full" />
        </button>
      )
    }

    // Calculate spacing between elements
    const spacing = size === 'sm' ? 'gap-1' : size === 'lg' ? 'gap-2' : 'gap-1.5'

    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, dot }), spacing, className)}
        {...props}
      >
        {icon && <IconWrapper>{icon}</IconWrapper>}
        {children}
        {removable && <RemoveButton />}
      </span>
    )
  }
)

Badge.displayName = "Badge"

export { badgeVariants }
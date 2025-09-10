import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

// Create loading variants using class-variance-authority
const loadingVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        spinner: "animate-spin",
        pulse: "animate-pulse",
        bounce: "animate-bounce"
      },
      size: {
        sm: "w-4 h-4",
        md: "w-6 h-6", 
        lg: "w-8 h-8",
        xl: "w-12 h-12"
      },
      color: {
        primary: "text-[var(--color-primary)]",
        muted: "text-muted-foreground",
        current: "text-current"
      }
    },
    defaultVariants: {
      variant: "spinner",
      size: "md",
      color: "primary"
    }
  }
)

// Enhanced loading props interface
export interface LoadingProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  /**
   * Loading text to display
   */
  text?: string
  
  /**
   * Whether to show loading text
   */
  showText?: boolean
}

// Enhanced Loading with custom logic
export const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ 
    variant,
    size,
    color,
    text = 'Loading...',
    showText = false,
    className,
    ...props 
  }, ref) => {
    const SpinnerIcon = () => (
      <svg
        className="animate-spin"
        fill="none"
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    )

    const PulseIcon = () => (
      <div className="w-full h-full bg-current rounded-full animate-pulse opacity-60" />
    )

    const BounceIcon = () => (
      <div className="w-full h-full bg-current rounded-full animate-bounce" />
    )

    const renderIcon = () => {
      switch (variant) {
        case 'spinner':
          return <SpinnerIcon />
        case 'pulse':
          return <PulseIcon />
        case 'bounce':
          return <BounceIcon />
        default:
          return <SpinnerIcon />
      }
    }

    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-center gap-2", className)}
        role="status"
        aria-label={text}
        {...props}
      >
        <div className={loadingVariants({ variant, size, color })}>
          {renderIcon()}
        </div>
        {showText && (
          <span className="text-sm text-muted-foreground">
            {text}
          </span>
        )}
      </div>
    )
  }
)

Loading.displayName = "Loading"

// Loading overlay component
export interface LoadingOverlayProps extends LoadingProps {
  /**
   * Whether the overlay is visible
   */
  visible?: boolean
  
  /**
   * Background opacity (0-100)
   */
  backgroundOpacity?: number
}

export const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ 
    visible = true,
    backgroundOpacity = 50,
    className,
    ...props 
  }, ref) => {
    if (!visible) return null

    return (
      <div
        ref={ref}
        className={cn("fixed inset-0 z-50 flex items-center justify-center", className)}
        style={{
          backgroundColor: `rgba(0, 0, 0, ${backgroundOpacity / 100})`
        }}
      >
        <Loading showText {...props} />
      </div>
    )
  }
)

LoadingOverlay.displayName = "LoadingOverlay"

export { loadingVariants }
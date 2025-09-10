import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Enhanced Skeleton Variants with Theme Variables
 * Uses DaisyUI-style CSS variables for comprehensive theming
 */
const skeletonVariants = cva(
  "animate-pulse",
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-base-300)]',
        shimmer: 'bg-gradient-to-r from-[var(--color-base-300)] via-[var(--color-base-200)] to-[var(--color-base-300)] bg-[length:200%_100%] animate-[shimmer_2s_infinite]',
        wave: 'bg-[var(--color-base-300)] animate-[wave_1.5s_ease-in-out_infinite]'
      },
      shape: {
        rectangle: 'rounded-[var(--radius-field)]',
        circle: 'rounded-full',
        text: 'rounded-sm h-4',
        avatar: 'rounded-full aspect-square'
      },
      size: {
        sm: 'h-4',
        md: 'h-6',
        lg: 'h-8',
        xl: 'h-12'
      }
    },
    defaultVariants: {
      variant: 'default',
      shape: 'rectangle',
      size: 'md'
    }
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /**
   * Skeleton animation variant
   */
  variant?: 'default' | 'shimmer' | 'wave'
  
  /**
   * Skeleton shape
   */
  shape?: 'rectangle' | 'circle' | 'text' | 'avatar'
  
  /**
   * Skeleton size (for height)
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  
  /**
   * Custom width
   */
  width?: string | number
  
  /**
   * Custom height
   */
  height?: string | number
  
  /**
   * Number of lines for text skeleton
   */
  lines?: number
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ 
    className,
    variant,
    shape,
    size,
    width,
    height,
    lines = 1,
    style,
    ...props 
  }, ref) => {
    // For text skeletons with multiple lines
    if (shape === 'text' && lines > 1) {
      return (
        <div
          ref={ref}
          className={cn("space-y-2", className)}
          {...props}
        >
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(skeletonVariants({ variant, shape, size }))}
              style={{
                width: index === lines - 1 ? '75%' : '100%',
                ...style
              }}
            />
          ))}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, shape, size, className }))}
        style={{
          width,
          height,
          ...style
        }}
        {...props}
      />
    )
  }
)

Skeleton.displayName = "Skeleton"

// Predefined skeleton components for common use cases
export const SkeletonText = React.forwardRef<HTMLDivElement, Omit<SkeletonProps, 'shape'>>(
  (props, ref) => (
    <Skeleton ref={ref} shape="text" {...props} />
  )
)
SkeletonText.displayName = "SkeletonText"

export const SkeletonAvatar = React.forwardRef<HTMLDivElement, Omit<SkeletonProps, 'shape'>>(
  ({ size = 'lg', ...props }, ref) => (
    <Skeleton 
      ref={ref} 
      shape="avatar" 
      size={size}
      width={size === 'sm' ? '32px' : size === 'md' ? '40px' : size === 'lg' ? '48px' : '64px'}
      {...props} 
    />
  )
)
SkeletonAvatar.displayName = "SkeletonAvatar"

export const SkeletonButton = React.forwardRef<HTMLDivElement, Omit<SkeletonProps, 'shape'>>(
  ({ size = 'md', ...props }, ref) => (
    <Skeleton 
      ref={ref} 
      shape="rectangle" 
      size={size}
      width={size === 'sm' ? '80px' : size === 'md' ? '100px' : '120px'}
      {...props} 
    />
  )
)
SkeletonButton.displayName = "SkeletonButton"

// Skeleton card component for complex layouts
export interface SkeletonCardProps extends LayoutComponentProps {
  /**
   * Whether to show avatar
   */
  avatar?: boolean
  
  /**
   * Number of text lines
   */
  lines?: number
  
  /**
   * Whether to show action buttons
   */
  actions?: boolean
}

export const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ 
    avatar = false,
    lines = 3,
    actions = false,
    className,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={`border border-[var(--border)] space-y-4 ${className || ''}`}
        style={{
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-2xl)'
        }}
        {...props}
      >
        {avatar && (
          <div className="flex items-center space-x-3">
            <SkeletonAvatar size="md" />
            <div className="space-y-2 flex-1">
              <SkeletonText width="40%" />
              <SkeletonText width="60%" size="sm" />
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <SkeletonText lines={lines} />
        </div>
        
        {actions && (
          <div className="flex space-x-2 pt-2">
            <SkeletonButton size="sm" />
            <SkeletonButton size="sm" />
          </div>
        )}
      </div>
    )
  }
)
SkeletonCard.displayName = "SkeletonCard"

export { Skeleton, skeletonVariants }
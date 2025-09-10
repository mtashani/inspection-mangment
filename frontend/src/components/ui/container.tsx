import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Enhanced Container Variants with Theme Variables
 * Uses DaisyUI-style CSS variables for comprehensive theming
 */
const containerVariants = cva(
  "w-full",
  {
    variants: {
      size: {
        sm: 'max-w-screen-sm',
        md: 'max-w-screen-md', 
        lg: 'max-w-screen-lg',
        xl: 'max-w-screen-xl',
        '2xl': 'max-w-screen-2xl',
        full: 'max-w-full'
      },
      padding: {
        none: 'px-0',
        sm: 'px-4',
        md: 'px-6',
        lg: 'px-8'
      },
      center: {
        true: 'mx-auto',
        false: ''
      }
    },
    defaultVariants: {
      size: 'xl',
      padding: 'md',
      center: true
    }
  }
)

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  /**
   * Maximum width of the container
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  
  /**
   * Horizontal padding
   */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  
  /**
   * Whether to center the container
   */
  center?: boolean
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, center, ...props }, ref) => {
    return (
      <div
        className={cn(containerVariants({ size, padding, center, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

Container.displayName = "Container"

export { Container, containerVariants }
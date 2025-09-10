import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Enhanced Stack Variants with Theme Variables
 * Uses DaisyUI-style CSS variables for comprehensive theming
 */
const stackVariants = cva(
  "flex",
  {
    variants: {
      direction: {
        row: 'flex-row',
        column: 'flex-col',
        'row-reverse': 'flex-row-reverse',
        'column-reverse': 'flex-col-reverse'
      },
      gap: {
        none: 'gap-0',
        xs: 'gap-1',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8'
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
        baseline: 'items-baseline'
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around',
        evenly: 'justify-evenly'
      },
      wrap: {
        true: 'flex-wrap',
        false: 'flex-nowrap'
      }
    },
    defaultVariants: {
      direction: 'column',
      gap: 'md',
      align: 'stretch',
      justify: 'start',
      wrap: false
    }
  }
)

export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {
  /**
   * Flex direction
   */
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  
  /**
   * Gap between items
   */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  
  /**
   * Align items
   */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  
  /**
   * Justify content
   */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  
  /**
   * Whether items should wrap
   */
  wrap?: boolean
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, direction, gap, align, justify, wrap, ...props }, ref) => {
    return (
      <div
        className={cn(stackVariants({ direction, gap, align, justify, wrap, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

Stack.displayName = "Stack"

// Horizontal Stack (HStack) - convenience component
export const HStack = React.forwardRef<HTMLDivElement, Omit<StackProps, 'direction'>>(
  ({ className, ...props }, ref) => (
    <Stack ref={ref} direction="row" className={className} {...props} />
  )
)

HStack.displayName = "HStack"

// Vertical Stack (VStack) - convenience component  
export const VStack = React.forwardRef<HTMLDivElement, Omit<StackProps, 'direction'>>(
  ({ className, ...props }, ref) => (
    <Stack ref={ref} direction="column" className={className} {...props} />
  )
)

VStack.displayName = "VStack"

export { Stack, stackVariants }
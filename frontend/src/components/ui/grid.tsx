import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

// Create grid variants using class-variance-authority
const gridVariants = cva(
  "grid",
  {
    variants: {
      cols: {
        1: "grid-cols-1",
        2: "grid-cols-2", 
        3: "grid-cols-3",
        4: "grid-cols-4",
        5: "grid-cols-5",
        6: "grid-cols-6",
        12: "grid-cols-12"
      },
      gap: {
        none: "gap-0",
        sm: "gap-2",
        md: "gap-4",
        lg: "gap-6",
        xl: "gap-8"
      },
      responsive: {
        true: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        false: ""
      }
    },
    defaultVariants: {
      cols: 3,
      gap: "md",
      responsive: false
    }
  }
)

// Enhanced grid props interface
export interface GridProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {
}

// Enhanced Grid with custom logic
export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ 
    cols,
    gap,
    responsive,
    className,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gridVariants({ 
          cols: responsive ? undefined : cols, 
          gap, 
          responsive 
        }), className)}
        {...props}
      />
    )
  }
)

Grid.displayName = "Grid"

// Grid Item component
export interface GridItemProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridItemVariants> {
  /**
   * Column span
   */
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  
  /**
   * Column start position
   */
  start?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  
  /**
   * Column end position
   */
  end?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13
}

const gridItemVariants = cva(
  "",
  {
    variants: {
      span: {
        1: "col-span-1",
        2: "col-span-2",
        3: "col-span-3", 
        4: "col-span-4",
        5: "col-span-5",
        6: "col-span-6",
        12: "col-span-12"
      },
      start: {
        1: "col-start-1",
        2: "col-start-2",
        3: "col-start-3",
        4: "col-start-4",
        5: "col-start-5",
        6: "col-start-6",
        7: "col-start-7",
        8: "col-start-8",
        9: "col-start-9",
        10: "col-start-10",
        11: "col-start-11",
        12: "col-start-12"
      },
      end: {
        1: "col-end-1",
        2: "col-end-2",
        3: "col-end-3",
        4: "col-end-4",
        5: "col-end-5",
        6: "col-end-6",
        7: "col-end-7",
        8: "col-end-8",
        9: "col-end-9",
        10: "col-end-10",
        11: "col-end-11",
        12: "col-end-12",
        13: "col-end-13"
      }
    }
  }
)

export const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ 
    span,
    start,
    end,
    className,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gridItemVariants({ span, start, end }), className)}
        {...props}
      />
    )
  }
)

GridItem.displayName = "GridItem"

export { gridVariants, gridItemVariants }
'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const toggleButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] focus-visible:ring-[var(--color-primary-500)] data-[state=on]:bg-[var(--color-primary-800)] data-[state=on]:text-white",
        secondary: "bg-[var(--color-neutral-200)] text-[var(--color-neutral-800)] hover:bg-[var(--color-neutral-300)] focus-visible:ring-[var(--color-neutral-400)] dark:bg-[var(--color-neutral-800)] dark:text-[var(--color-neutral-200)] dark:hover:bg-[var(--color-neutral-700)] data-[state=on]:bg-[var(--color-neutral-300)] dark:data-[state=on]:bg-[var(--color-neutral-700)]",
        outline: "border border-[var(--color-border-primary)] bg-transparent hover:bg-[var(--color-neutral-100)] focus-visible:ring-[var(--color-neutral-300)] dark:hover:bg-[var(--color-neutral-800)] data-[state=on]:bg-[var(--color-neutral-100)] data-[state=on]:text-[var(--color-primary-700)] dark:data-[state=on]:bg-[var(--color-neutral-800)] dark:data-[state=on]:text-[var(--color-primary-400)]",
        ghost: "bg-transparent hover:bg-[var(--color-neutral-100)] focus-visible:ring-[var(--color-neutral-300)] dark:hover:bg-[var(--color-neutral-800)] data-[state=on]:bg-[var(--color-neutral-100)] data-[state=on]:text-[var(--color-primary-700)] dark:data-[state=on]:bg-[var(--color-neutral-800)] dark:data-[state=on]:text-[var(--color-primary-400)]",
        success: "bg-[var(--color-success-main)] text-white hover:bg-[var(--color-success-dark)] focus-visible:ring-[var(--color-success-main)] data-[state=on]:bg-[var(--color-success-dark)] data-[state=on]:text-white",
        warning: "bg-[var(--color-warning-main)] text-white hover:bg-[var(--color-warning-dark)] focus-visible:ring-[var(--color-warning-main)] data-[state=on]:bg-[var(--color-warning-dark)] data-[state=on]:text-white",
        error: "bg-[var(--color-error-main)] text-white hover:bg-[var(--color-error-dark)] focus-visible:ring-[var(--color-error-main)] data-[state=on]:bg-[var(--color-error-dark)] data-[state=on]:text-white",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 py-2",
        lg: "h-10 px-6 py-2",
        xl: "h-12 px-8 py-2.5 text-base",
        icon: "h-9 w-9 p-0",
      },
      rounded: {
        default: "rounded-md",
        full: "rounded-full",
        lg: "rounded-lg",
        xl: "rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      rounded: "default",
    },
  }
);

export interface ToggleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof toggleButtonVariants> {
  pressed?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const ToggleButton = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(
  ({ className, variant, size, rounded, pressed, loading, leftIcon, rightIcon, children, ...props }, ref) => {
    return (
      <button
        className={cn(toggleButtonVariants({ variant, size, rounded, className }))}
        ref={ref}
        data-state={pressed ? "on" : "off"}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

ToggleButton.displayName = "ToggleButton";

export { ToggleButton, toggleButtonVariants };
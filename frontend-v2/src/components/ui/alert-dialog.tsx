"use client"

import * as React from "react"
import { createContext, useContext, useState } from "react"
import { cn } from "@/lib/utils"

// Define our own simple button component to avoid dependencies
function SimpleButton({
  children,
  className,
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "destructive";
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium";
  const variantStyles = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  };
  
  return (
    <button
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

// Create a context for the alert dialog
type AlertDialogContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(undefined);

export function AlertDialog({ 
  children, 
  open, 
  onOpenChange 
}: { 
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use either controlled or uncontrolled state
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };
  
  return (
    <AlertDialogContext.Provider value={{ open: isOpen, setOpen: setIsOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

// Internal hook to use the alert dialog context
function useAlertDialog() {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error("AlertDialog components must be used within an AlertDialog");
  }
  return context;
}

export function AlertDialogTrigger({
  children,
  asChild,
  ...props
}: {
  children: React.ReactNode;
  asChild?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useAlertDialog();
  
  // If asChild is true, clone the child element and add the onClick handler
  if (asChild && React.isValidElement(children)) {
    // Type the element properly to access its props
    const childElement = children as React.ReactElement<{
      onClick?: (e: React.MouseEvent) => void;
      [key: string]: unknown;
    }>;
    
    // Create new props object
    const childProps = {
      ...childElement.props,
      onClick: (e: React.MouseEvent) => {
        // Call the original onClick if it exists
        if (childElement.props.onClick) {
          childElement.props.onClick(e);
        }
        setOpen(true);
      }
    };
    
    return React.cloneElement(childElement, childProps);
  }
  
  return (
    <SimpleButton type="button" {...props} onClick={() => setOpen(true)}>
      {children}
    </SimpleButton>
  );
}

export function AlertDialogContent({ 
  children,
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useAlertDialog();
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div 
        className={cn(
          "bg-background p-6 rounded-md shadow-lg w-full max-w-md mx-auto",
          className
        )}
        {...props}
      >
        {children}
      </div>
      {/* Close on backdrop click */}
      <div 
        className="fixed inset-0 z-[-1]" 
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
    </div>
  );
}

export function AlertDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-4 text-center sm:text-left", className)}
      {...props}
    />
  );
}

export function AlertDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
    />
  );
}

export function AlertDialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function AlertDialogAction({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <SimpleButton
      className={cn(className)}
      {...props}
    />
  );
}

export function AlertDialogCancel({
  className,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useAlertDialog();
  
  return (
    <SimpleButton
      variant="outline"
      className={cn("mt-2 sm:mt-0", className)}
      onClick={(e) => {
        setOpen(false);
        onClick?.(e);
      }}
      {...props}
    />
  );
}

// Export for backward compatibility
export const AlertDialogPortal = React.Fragment;
export const AlertDialogOverlay = React.Fragment;
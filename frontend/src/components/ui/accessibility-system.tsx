"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// ARIA Live Region Context
interface AriaLiveContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announceStatus: (message: string) => void;
  announceError: (message: string) => void;
}

const AriaLiveContext = createContext<AriaLiveContextType | null>(null);

// ARIA Live Region Provider
interface AriaLiveProviderProps {
  children: React.ReactNode;
}

export function AriaLiveProvider({ children }: AriaLiveProviderProps) {
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const targetRef = priority === 'assertive' ? assertiveRef : politeRef;
    if (targetRef.current) {
      // Clear and then set the message to ensure it's announced
      targetRef.current.textContent = '';
      setTimeout(() => {
        if (targetRef.current) {
          targetRef.current.textContent = message;
        }
      }, 100);
    }
  };

  const announceStatus = (message: string) => {
    announce(`Status: ${message}`, 'polite');
  };

  const announceError = (message: string) => {
    announce(`Error: ${message}`, 'assertive');
  };

  return (
    <AriaLiveContext.Provider value={{ announce, announceStatus, announceError }}>
      {children}
      {/* ARIA Live Regions */}
      <div
        ref={politeRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <div
        ref={assertiveRef}
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </AriaLiveContext.Provider>
  );
}

// Hook to use ARIA Live announcements
export function useAriaLive() {
  const context = useContext(AriaLiveContext);
  if (!context) {
    throw new Error('useAriaLive must be used within AriaLiveProvider');
  }
  return context;
}

// Screen Reader Only Text Component
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export function ScreenReaderOnly({ 
  children, 
  as: Component = 'span', 
  className 
}: ScreenReaderOnlyProps) {
  return (
    <Component className={cn("sr-only", className)}>
      {children}
    </Component>
  );
}

// Skip Link Component
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4",
        "bg-[var(--color-primary-600)] text-white px-4 py-2 rounded-md",
        "font-medium text-sm z-50 transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-300)]",
        className
      )}
    >
      {children}
    </a>
  );
}

// Landmark Navigation Component
interface LandmarkNavProps {
  landmarks: Array<{
    id: string;
    label: string;
    href: string;
  }>;
  className?: string;
}

export function LandmarkNav({ landmarks, className }: LandmarkNavProps) {
  return (
    <nav
      aria-label="Page landmarks"
      className={cn(
        "sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-4 focus-within:left-4",
        "bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg p-4 z-50",
        "shadow-lg min-w-[200px]",
        className
      )}
    >
      <h2 className="text-sm font-medium mb-2 text-[var(--color-text-primary)]">
        Skip to:
      </h2>
      <ul className="space-y-1">
        {landmarks.map(landmark => (
          <li key={landmark.id}>
            <a
              href={landmark.href}
              className="block px-2 py-1 text-sm text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded transition-colors"
            >
              {landmark.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Accessible Heading Component with proper hierarchy
interface AccessibleHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  id?: string;
  tabIndex?: number;
}

export function AccessibleHeading({ 
  level, 
  children, 
  className, 
  id,
  tabIndex 
}: AccessibleHeadingProps) {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  
  const defaultStyles = {
    1: "text-3xl font-bold",
    2: "text-2xl font-semibold", 
    3: "text-xl font-semibold",
    4: "text-lg font-medium",
    5: "text-base font-medium",
    6: "text-sm font-medium"
  };

  return (
    <Component
      id={id}
      tabIndex={tabIndex}
      className={cn(
        defaultStyles[level],
        "text-[var(--color-text-primary)] scroll-mt-4",
        className
      )}
    >
      {children}
    </Component>
  );
}

// Accessible Button with proper ARIA attributes
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  ariaPressed?: boolean;
}

export function AccessibleButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Loading...',
  children,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaControls,
  ariaPressed,
  disabled,
  className,
  ...props
}: AccessibleButtonProps) {
  const variants = {
    primary: 'bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] focus:ring-[var(--color-primary-300)]',
    secondary: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] focus:ring-[var(--color-primary-300)]',
    ghost: 'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] focus:ring-[var(--color-primary-300)]',
    destructive: 'bg-[var(--color-error-main)] text-white hover:bg-[var(--color-error-dark)] focus:ring-[var(--color-error-light)]'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-pressed={ariaPressed}
      aria-busy={loading}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium",
        "transition-all duration-200 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
          <ScreenReaderOnly>{loadingText}</ScreenReaderOnly>
          <span aria-hidden="true">{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Accessible Form Field with proper labeling and error handling
interface AccessibleFormFieldProps {
  id: string;
  label: string;
  children: React.ReactNode;
  error?: string;
  description?: string;
  required?: boolean;
  className?: string;
}

export function AccessibleFormField({
  id,
  label,
  children,
  error,
  description,
  required = false,
  className
}: AccessibleFormFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const descriptionId = description ? `${id}-description` : undefined;
  const ariaDescribedBy = [errorId, descriptionId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[var(--color-text-primary)]"
      >
        {label}
        {required && (
          <span className="text-[var(--color-error-main)] ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {React.cloneElement(children as React.ReactElement, {
        id,
        'aria-describedby': ariaDescribedBy,
        'aria-invalid': !!error,
        'aria-required': required
      })}
      
      {description && (
        <p id={descriptionId} className="text-sm text-[var(--color-text-secondary)]">
          {description}
        </p>
      )}
      
      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-sm text-[var(--color-error-main)] flex items-center gap-1"
        >
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}

// Accessible Table with proper headers and navigation
interface AccessibleTableProps {
  caption: string;
  headers: Array<{
    id: string;
    label: string;
    sortable?: boolean;
    sortDirection?: 'asc' | 'desc' | 'none';
  }>;
  data: Array<Record<string, any>>;
  onSort?: (headerId: string) => void;
  className?: string;
}

export function AccessibleTable({
  caption,
  headers,
  data,
  onSort,
  className
}: AccessibleTableProps) {
  const { announce } = useAriaLive();

  const handleSort = (headerId: string) => {
    const header = headers.find(h => h.id === headerId);
    if (header?.sortable && onSort) {
      onSort(headerId);
      const direction = header.sortDirection === 'asc' ? 'ascending' : 
                      header.sortDirection === 'desc' ? 'descending' : 'none';
      announce(`Table sorted by ${header.label}, ${direction}`);
    }
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table
        role="table"
        className="w-full border-collapse border border-[var(--color-border-primary)]"
      >
        <caption className="sr-only">
          {caption}
        </caption>
        
        <thead>
          <tr role="row">
            {headers.map(header => (
              <th
                key={header.id}
                role="columnheader"
                scope="col"
                aria-sort={header.sortDirection || 'none'}
                className={cn(
                  "px-4 py-3 text-left text-sm font-medium text-[var(--color-text-primary)]",
                  "bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-primary)]",
                  header.sortable && "cursor-pointer hover:bg-[var(--color-bg-tertiary)]"
                )}
                onClick={header.sortable ? () => handleSort(header.id) : undefined}
                onKeyDown={header.sortable ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSort(header.id);
                  }
                } : undefined}
                tabIndex={header.sortable ? 0 : undefined}
              >
                <div className="flex items-center gap-2">
                  {header.label}
                  {header.sortable && (
                    <span aria-hidden="true" className="text-xs">
                      {header.sortDirection === 'asc' ? '↑' : 
                       header.sortDirection === 'desc' ? '↓' : '↕'}
                    </span>
                  )}
                </div>
                {header.sortable && (
                  <ScreenReaderOnly>
                    , sortable column, currently {header.sortDirection || 'unsorted'}
                  </ScreenReaderOnly>
                )}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              role="row"
              className="hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              {headers.map(header => (
                <td
                  key={header.id}
                  role="gridcell"
                  className="px-4 py-3 text-sm text-[var(--color-text-primary)] border-b border-[var(--color-border-primary)]"
                >
                  {row[header.id]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {data.length === 0 && (
        <div
          role="status"
          aria-live="polite"
          className="text-center py-8 text-[var(--color-text-secondary)]"
        >
          No data available
        </div>
      )}
    </div>
  );
}

// Accessible Modal with focus management
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  closeOnEscape = true,
  closeOnOverlayClick = true
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore focus to previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
      
      // Restore body scroll
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }

      // Trap focus within modal
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          "relative bg-[var(--color-bg-primary)] rounded-lg shadow-xl",
          "border border-[var(--color-border-primary)] max-w-md w-full mx-4",
          "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]",
          className
        )}
      >
        <div className="p-6">
          <h2 id="modal-title" className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            {title}
          </h2>
          
          {description && (
            <p id="modal-description" className="text-sm text-[var(--color-text-secondary)] mb-4">
              {description}
            </p>
          )}
          
          {children}
        </div>
      </div>
    </div>
  );
}

// Accessible Progress Indicator
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label: string;
  showValue?: boolean;
  className?: string;
}

export function AccessibleProgress({
  value,
  max = 100,
  label,
  showValue = true,
  className
}: AccessibleProgressProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
        {showValue && (
          <span className="text-sm text-[var(--color-text-secondary)]">
            {percentage}%
          </span>
        )}
      </div>
      
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${percentage}% complete`}
        className="w-full bg-[var(--color-bg-secondary)] rounded-full h-2 overflow-hidden"
      >
        <div
          className="h-full bg-[var(--color-primary-600)] transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <ScreenReaderOnly>
        {label}: {percentage}% complete
      </ScreenReaderOnly>
    </div>
  );
}

// Accessible Status Component
interface AccessibleStatusProps {
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  live?: boolean;
  className?: string;
}

export function AccessibleStatus({
  status,
  message,
  live = false,
  className
}: AccessibleStatusProps) {
  const statusConfig = {
    success: { icon: '✓', color: 'text-[var(--color-success-main)]', bg: 'bg-[var(--color-success-light)]' },
    warning: { icon: '⚠', color: 'text-[var(--color-warning-main)]', bg: 'bg-[var(--color-warning-light)]' },
    error: { icon: '✕', color: 'text-[var(--color-error-main)]', bg: 'bg-[var(--color-error-light)]' },
    info: { icon: 'ℹ', color: 'text-[var(--color-info-main)]', bg: 'bg-[var(--color-info-light)]' }
  };

  const config = statusConfig[status];

  return (
    <div
      role={status === 'error' ? 'alert' : 'status'}
      aria-live={live ? (status === 'error' ? 'assertive' : 'polite') : 'off'}
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg border",
        config.bg,
        config.color,
        className
      )}
    >
      <span aria-hidden="true" className="font-bold">
        {config.icon}
      </span>
      <span className="text-sm font-medium">
        {message}
      </span>
      <ScreenReaderOnly>
        {status}: {message}
      </ScreenReaderOnly>
    </div>
  );
}

export default {
  AriaLiveProvider,
  useAriaLive,
  ScreenReaderOnly,
  SkipLink,
  LandmarkNav,
  AccessibleHeading,
  AccessibleButton,
  AccessibleFormField,
  AccessibleTable,
  AccessibleModal,
  AccessibleProgress,
  AccessibleStatus
};
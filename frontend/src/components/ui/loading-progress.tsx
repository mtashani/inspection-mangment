"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  Zap,
  Activity,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// Skeleton Loading Components
interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rectangular' | 'text';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({ 
  className, 
  variant = 'default',
  width,
  height,
  animation = 'pulse'
}: SkeletonProps) {
  const variants = {
    default: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    text: 'rounded-sm h-4'
  };

  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };

  const style = {
    width: width || (variant === 'circular' ? height : undefined),
    height: height || (variant === 'text' ? '1rem' : undefined)
  };

  return (
    <div
      className={cn(
        "bg-[var(--color-bg-secondary)]",
        variants[variant],
        animations[animation],
        className
      )}
      style={style}
    />
  );
}

// Skeleton Presets for Different Content Types
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={cn("p-4", className)}>
      <CardContent className="space-y-3 p-0">
        <div className="flex items-center space-x-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
        <Skeleton variant="rectangular" height={120} />
        <div className="space-y-2">
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className }: { 
  rows?: number; 
  columns?: number; 
  className?: string; 
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Table Header */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" height={20} />
        ))}
      </div>
      
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" height={16} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="50%" />
          </div>
          <Skeleton variant="rectangular" width={60} height={24} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <Skeleton variant="text" width="30%" height={24} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
      <div className="relative h-64 bg-[var(--color-bg-secondary)] rounded-lg p-4">
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton 
              key={i} 
              variant="rectangular" 
              width={24} 
              height={Math.random() * 150 + 50}
              animation="wave"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Progress Indicators
interface ProgressProps {
  value: number;
  max?: number;
  variant?: 'linear' | 'circular' | 'step';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  showValue?: boolean;
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
}

export function Progress({ 
  value, 
  max = 100, 
  variant = 'linear',
  size = 'md',
  color = 'primary',
  showValue = false,
  showLabel = false,
  label,
  className,
  animated = true
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const colors = {
    primary: 'bg-[var(--color-primary-600)]',
    success: 'bg-[var(--color-success-main)]',
    warning: 'bg-[var(--color-warning-main)]',
    error: 'bg-[var(--color-error-main)]',
    info: 'bg-[var(--color-info-main)]'
  };

  const sizes = {
    sm: { height: 'h-1', text: 'text-xs' },
    md: { height: 'h-2', text: 'text-sm' },
    lg: { height: 'h-3', text: 'text-base' }
  };

  if (variant === 'circular') {
    const circleSize = size === 'sm' ? 40 : size === 'md' ? 60 : 80;
    const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 5;
    const radius = (circleSize - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className={cn("relative inline-flex items-center justify-center", className)}>
        <svg
          width={circleSize}
          height={circleSize}
          className="transform -rotate-90"
        >
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            stroke="var(--color-bg-secondary)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              colors[color],
              animated && "transition-all duration-500 ease-in-out"
            )}
            style={{ color: `var(--color-${color === 'primary' ? 'primary-600' : color + '-main'})` }}
          />
        </svg>
        {showValue && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center font-medium",
            sizes[size].text
          )}>
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    );
  }

  if (variant === 'step') {
    const steps = Array.from({ length: max }, (_, i) => i + 1);
    
    return (
      <div className={cn("space-y-2", className)}>
        {showLabel && label && (
          <div className="flex justify-between items-center">
            <span className={cn("font-medium", sizes[size].text)}>{label}</span>
            {showValue && (
              <span className={cn("text-[var(--color-text-secondary)]", sizes[size].text)}>
                {value} / {max}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1">
          {steps.map((step) => (
            <div
              key={step}
              className={cn(
                "flex-1 rounded-full transition-all duration-300",
                sizes[size].height,
                step <= value ? colors[color] : "bg-[var(--color-bg-secondary)]"
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {(showLabel && label) || showValue ? (
        <div className="flex justify-between items-center">
          {showLabel && label && (
            <span className={cn("font-medium", sizes[size].text)}>{label}</span>
          )}
          {showValue && (
            <span className={cn("text-[var(--color-text-secondary)]", sizes[size].text)}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      ) : null}
      
      <div className={cn(
        "w-full bg-[var(--color-bg-secondary)] rounded-full overflow-hidden",
        sizes[size].height
      )}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-in-out",
            colors[color],
            animated && "animate-pulse"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Loading Overlays
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  variant?: 'spinner' | 'dots' | 'bars' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
  blur?: boolean;
}

export function LoadingOverlay({
  isLoading,
  children,
  variant = 'spinner',
  size = 'md',
  message,
  className,
  blur = true
}: LoadingOverlayProps) {
  const sizes = {
    sm: { spinner: 'w-4 h-4', text: 'text-sm' },
    md: { spinner: 'w-6 h-6', text: 'text-base' },
    lg: { spinner: 'w-8 h-8', text: 'text-lg' }
  };

  const LoadingIcon = () => {
    switch (variant) {
      case 'spinner':
        return <Loader2 className={cn("animate-spin", sizes[size].spinner)} />;
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-current animate-bounce",
                  size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );
      case 'bars':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "bg-current animate-pulse",
                  size === 'sm' ? 'w-1 h-4' : size === 'md' ? 'w-1.5 h-6' : 'w-2 h-8'
                )}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        );
      case 'pulse':
        return <Activity className={cn("animate-pulse", sizes[size].spinner)} />;
      default:
        return <Loader2 className={cn("animate-spin", sizes[size].spinner)} />;
    }
  };

  return (
    <div className={cn("relative", className)}>
      {children}
      
      {isLoading && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          "bg-[var(--color-bg-primary)]/80 backdrop-blur-sm z-50",
          blur && "backdrop-blur-sm"
        )}>
          <div className="flex flex-col items-center space-y-3">
            <div className="text-[var(--color-primary-600)]">
              <LoadingIcon />
            </div>
            {message && (
              <p className={cn(
                "text-[var(--color-text-secondary)] font-medium",
                sizes[size].text
              )}>
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Loading States for Different Components
interface LoadingStateProps {
  type: 'button' | 'card' | 'page' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export function LoadingState({ type, size = 'md', message, className }: LoadingStateProps) {
  const sizes = {
    sm: { spinner: 'w-4 h-4', text: 'text-sm', padding: 'p-2' },
    md: { spinner: 'w-6 h-6', text: 'text-base', padding: 'p-4' },
    lg: { spinner: 'w-8 h-8', text: 'text-lg', padding: 'p-6' }
  };

  switch (type) {
    case 'button':
      return (
        <div className={cn("flex items-center justify-center gap-2", className)}>
          <Loader2 className={cn("animate-spin", sizes[size].spinner)} />
          {message && <span className={sizes[size].text}>{message}</span>}
        </div>
      );

    case 'card':
      return (
        <Card className={cn("", className)}>
          <CardContent className={cn("flex flex-col items-center justify-center text-center", sizes[size].padding)}>
            <Loader2 className={cn("animate-spin text-[var(--color-primary-600)] mb-3", sizes[size].spinner)} />
            {message && (
              <p className={cn("text-[var(--color-text-secondary)]", sizes[size].text)}>
                {message}
              </p>
            )}
          </CardContent>
        </Card>
      );

    case 'page':
      return (
        <div className={cn(
          "flex flex-col items-center justify-center min-h-[400px] text-center",
          className
        )}>
          <Loader2 className={cn("animate-spin text-[var(--color-primary-600)] mb-4", sizes[size].spinner)} />
          {message && (
            <p className={cn("text-[var(--color-text-secondary)]", sizes[size].text)}>
              {message}
            </p>
          )}
        </div>
      );

    case 'inline':
    default:
      return (
        <div className={cn("flex items-center gap-2", className)}>
          <Loader2 className={cn("animate-spin text-[var(--color-primary-600)]", sizes[size].spinner)} />
          {message && (
            <span className={cn("text-[var(--color-text-secondary)]", sizes[size].text)}>
              {message}
            </span>
          )}
        </div>
      );
  }
}

// Loading State Management Hook
interface LoadingStateManager {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  progress: number;
  message: string;
}

export function useLoadingState(initialState?: Partial<LoadingStateManager>) {
  const [state, setState] = useState<LoadingStateManager>({
    isLoading: false,
    error: null,
    success: false,
    progress: 0,
    message: '',
    ...initialState
  });

  const setLoading = (loading: boolean, message?: string) => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
      error: null,
      success: false,
      message: message || ''
    }));
  };

  const setError = (error: string) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error,
      success: false
    }));
  };

  const setSuccess = (message?: string) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: null,
      success: true,
      message: message || 'Success!'
    }));
  };

  const setProgress = (progress: number, message?: string) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(Math.max(progress, 0), 100),
      message: message || prev.message
    }));
  };

  const reset = () => {
    setState({
      isLoading: false,
      error: null,
      success: false,
      progress: 0,
      message: ''
    });
  };

  return {
    ...state,
    setLoading,
    setError,
    setSuccess,
    setProgress,
    reset
  };
}

// Enhanced Loading Button
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

export function LoadingButton({
  loading = false,
  loadingText,
  variant = 'default',
  size = 'default',
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || loading}
      className={cn(loading && "cursor-not-allowed", className)}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText || 'Loading...'}
        </div>
      ) : (
        children
      )}
    </Button>
  );
}

// Progress Steps Component
interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'current' | 'completed' | 'error';
}

interface ProgressStepsProps {
  steps: ProgressStep[];
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  className?: string;
}

export function ProgressSteps({
  steps,
  orientation = 'horizontal',
  size = 'md',
  showDescription = true,
  className
}: ProgressStepsProps) {
  const sizes = {
    sm: { circle: 'w-6 h-6', text: 'text-sm', line: 'h-0.5' },
    md: { circle: 'w-8 h-8', text: 'text-base', line: 'h-1' },
    lg: { circle: 'w-10 h-10', text: 'text-lg', line: 'h-1.5' }
  };

  const getStepIcon = (step: ProgressStep, index: number) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-full h-full text-[var(--color-success-main)]" />;
      case 'error':
        return <XCircle className="w-full h-full text-[var(--color-error-main)]" />;
      case 'current':
        return (
          <div className="w-full h-full rounded-full bg-[var(--color-primary-600)] flex items-center justify-center text-white font-medium text-sm">
            {index + 1}
          </div>
        );
      default:
        return (
          <div className="w-full h-full rounded-full border-2 border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] flex items-center justify-center text-[var(--color-text-secondary)] font-medium text-sm">
            {index + 1}
          </div>
        );
    }
  };

  const getStepColor = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-[var(--color-success-main)]';
      case 'error':
        return 'text-[var(--color-error-main)]';
      case 'current':
        return 'text-[var(--color-primary-600)]';
      default:
        return 'text-[var(--color-text-secondary)]';
    }
  };

  if (orientation === 'vertical') {
    return (
      <div className={cn("space-y-4", className)}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-3">
            <div className={cn("flex-shrink-0", sizes[size].circle)}>
              {getStepIcon(step, index)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-medium",
                sizes[size].text,
                getStepColor(step.status)
              )}>
                {step.title}
              </h3>
              {showDescription && step.description && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {step.description}
                </p>
              )}
            </div>
            
            {index < steps.length - 1 && (
              <div className={cn(
                "w-px bg-[var(--color-border-primary)] ml-4 mt-2",
                "h-8"
              )} />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center text-center">
            <div className={cn("flex-shrink-0 mb-2", sizes[size].circle)}>
              {getStepIcon(step, index)}
            </div>
            
            <div className="space-y-1">
              <h3 className={cn(
                "font-medium",
                sizes[size].text,
                getStepColor(step.status)
              )}>
                {step.title}
              </h3>
              {showDescription && step.description && (
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {step.description}
                </p>
              )}
            </div>
          </div>
          
          {index < steps.length - 1 && (
            <div className={cn(
              "flex-1 mx-4 bg-[var(--color-border-primary)]",
              sizes[size].line,
              step.status === 'completed' && "bg-[var(--color-success-main)]"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonChart,
  Progress,
  LoadingOverlay,
  LoadingState,
  LoadingButton,
  ProgressSteps,
  useLoadingState
};
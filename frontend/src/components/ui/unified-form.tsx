"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnifiedDatePicker } from './unified-date-picker';
import { cn } from '@/lib/utils';
import { LucideIcon, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { designSystem } from '@/config/design-system';

// Form Container Component
interface FormContainerProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  variant?: 'default' | 'outlined' | 'elevated';
  size?: 'sm' | 'md' | 'lg';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function FormContainer({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  className,
  actions,
  loading = false,
  variant = 'default',
  size = 'md',
  collapsible = false,
  defaultCollapsed = false
}: FormContainerProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed && collapsible);
  
  const toggleCollapse = () => {
    if (collapsible) {
      setCollapsed(!collapsed);
    }
  };
  
  const variants = {
    default: '',
    outlined: 'border-2 shadow-none',
    elevated: 'shadow-lg'
  };
  
  const sizes = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6'
  };
  
  return (
    <Card className={cn("w-full", variants[variant], className)}>
      <CardHeader 
        className={cn(
          "pb-4", 
          collapsible && "cursor-pointer hover:bg-accent/10"
        )}
        onClick={collapsible ? toggleCollapse : undefined}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            {Icon && <Icon className="w-5 h-5 text-[var(--color-primary-600)]" />}
            {title}
          </CardTitle>
          
          {collapsible && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => {
              e.stopPropagation();
              toggleCollapse();
            }}>
              {collapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up">
                  <path d="m18 15-6-6-6 6"/>
                </svg>
              )}
            </Button>
          )}
        </div>
        
        {description && (
          <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
        )}
        
        {actions && !collapsed && (
          <div className="flex items-center gap-2 mt-2">
            {actions}
          </div>
        )}
      </CardHeader>
      
      {!collapsed && (
        <CardContent className={cn("space-y-6 relative", sizes[size])}>
          {loading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-b-lg z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-600)]"></div>
            </div>
          )}
          {children}
        </CardContent>
      )}
    </Card>
  );
}

// Enhanced Form Field Component with validation states
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  warning?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'comfortable' | 'spacious';
  validationState?: 'default' | 'error' | 'success' | 'warning';
}

export function FormField({ 
  label, 
  required, 
  error, 
  success,
  warning,
  description, 
  children, 
  className,
  variant = 'default',
  validationState = 'default'
}: FormFieldProps) {
  const variants = {
    default: 'space-y-2',
    compact: 'space-y-1',
    comfortable: 'space-y-2',
    spacious: 'space-y-3'
  };

  const getValidationIcon = () => {
    switch (validationState) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-[var(--color-error-main)]" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[var(--color-success-main)]" />;
      case 'warning':
        return <Info className="w-4 h-4 text-[var(--color-warning-main)]" />;
      default:
        return null;
    }
  };

  const getValidationMessage = () => {
    if (error) return { message: error, type: 'error' };
    if (success) return { message: success, type: 'success' };
    if (warning) return { message: warning, type: 'warning' };
    return null;
  };

  const validationMessage = getValidationMessage();

  return (
    <div className={cn(variants[variant], className)}>
      <Label className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2">
        {label}
        {required && <span className="text-[var(--color-error-main)] ml-1">*</span>}
        {getValidationIcon()}
      </Label>
      {children}
      {description && (
        <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
          <Info className="w-3 h-3" />
          {description}
        </p>
      )}
      {validationMessage && (
        <p className={cn(
          "text-sm flex items-center gap-1",
          validationMessage.type === 'error' && "text-[var(--color-error-main)]",
          validationMessage.type === 'success' && "text-[var(--color-success-main)]",
          validationMessage.type === 'warning' && "text-[var(--color-warning-main)]"
        )}>
          {getValidationIcon()}
          {validationMessage.message}
        </p>
      )}
    </div>
  );
}

// Form Grid Component
interface FormGridProps {
  columns?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

export function FormGrid({ columns = 2, children, className }: FormGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={cn("grid gap-6", gridCols[columns], className)}>
      {children}
    </div>
  );
}

// Enhanced Unified Input Components with real-time validation
interface UnifiedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  warning?: string;
  description?: string;
  variant?: 'default' | 'compact' | 'comfortable' | 'spacious';
  size?: 'sm' | 'md' | 'lg';
  validationState?: 'default' | 'error' | 'success' | 'warning';
  loading?: boolean;
  onValidate?: (value: string) => Promise<{ isValid: boolean; message?: string; type?: 'error' | 'success' | 'warning' }>;
}

export function UnifiedInput({ 
  label, 
  required, 
  error, 
  success,
  warning,
  description, 
  className,
  variant = 'default',
  size = 'md',
  validationState = 'default',
  loading = false,
  onValidate,
  onChange,
  ...props 
}: UnifiedInputProps) {
  const [isValidating, setIsValidating] = React.useState(false);
  const [validationResult, setValidationResult] = React.useState<{ message?: string; type?: 'error' | 'success' | 'warning' } | null>(null);

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-3',
    lg: 'h-12 px-4 text-lg'
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    
    if (onValidate && e.target.value) {
      setIsValidating(true);
      try {
        const result = await onValidate(e.target.value);
        setValidationResult(result);
      } catch (err) {
        setValidationResult({ message: 'Validation failed', type: 'error' });
      } finally {
        setIsValidating(false);
      }
    } else {
      setValidationResult(null);
    }
  };

  const currentValidationState = error ? 'error' : success ? 'success' : warning ? 'warning' : validationResult?.type || validationState;
  const currentError = error || (validationResult?.type === 'error' ? validationResult.message : undefined);
  const currentSuccess = success || (validationResult?.type === 'success' ? validationResult.message : undefined);
  const currentWarning = warning || (validationResult?.type === 'warning' ? validationResult.message : undefined);

  return (
    <FormField 
      label={label} 
      required={required} 
      error={currentError}
      success={currentSuccess}
      warning={currentWarning}
      description={description}
      variant={variant}
      validationState={currentValidationState}
    >
      <div className="relative">
        <Input
          className={cn(
            sizes[size],
            "transition-all duration-200 ease-in-out",
            currentError && "border-[var(--color-error-main)] focus:border-[var(--color-error-main)] focus:ring-[var(--color-error-light)]",
            currentSuccess && "border-[var(--color-success-main)] focus:border-[var(--color-success-main)] focus:ring-[var(--color-success-light)]",
            currentWarning && "border-[var(--color-warning-main)] focus:border-[var(--color-warning-main)] focus:ring-[var(--color-warning-light)]",
            !currentError && !currentSuccess && !currentWarning && "border-[var(--color-border-primary)] focus:border-[var(--color-primary-600)] focus:ring-[var(--color-primary-100)]",
            className
          )}
          onChange={handleChange}
          {...props}
        />
        {(loading || isValidating) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary-600)]" />
          </div>
        )}
      </div>
    </FormField>
  );
}

interface UnifiedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  warning?: string;
  description?: string;
  variant?: 'default' | 'compact' | 'comfortable' | 'spacious';
  size?: 'sm' | 'md' | 'lg';
  validationState?: 'default' | 'error' | 'success' | 'warning';
  showCharCount?: boolean;
  maxLength?: number;
}

export function UnifiedTextarea({ 
  label, 
  required, 
  error, 
  success,
  warning,
  description, 
  className,
  variant = 'default',
  size = 'md',
  validationState = 'default',
  showCharCount = false,
  maxLength,
  value,
  onChange,
  ...props 
}: UnifiedTextareaProps) {
  const [charCount, setCharCount] = React.useState(0);

  const sizes = {
    sm: 'min-h-[80px] px-3 py-2 text-sm',
    md: 'min-h-[100px] px-3 py-2',
    lg: 'min-h-[120px] px-4 py-3 text-lg'
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
    onChange?.(e);
  };

  React.useEffect(() => {
    if (typeof value === 'string') {
      setCharCount(value.length);
    }
  }, [value]);

  const currentValidationState = error ? 'error' : success ? 'success' : warning ? 'warning' : validationState;

  return (
    <FormField 
      label={label} 
      required={required} 
      error={error}
      success={success}
      warning={warning}
      description={description}
      variant={variant}
      validationState={currentValidationState}
    >
      <div className="relative">
        <Textarea
          className={cn(
            sizes[size],
            "transition-all duration-200 ease-in-out resize-none",
            error && "border-[var(--color-error-main)] focus:border-[var(--color-error-main)] focus:ring-[var(--color-error-light)]",
            success && "border-[var(--color-success-main)] focus:border-[var(--color-success-main)] focus:ring-[var(--color-success-light)]",
            warning && "border-[var(--color-warning-main)] focus:border-[var(--color-warning-main)] focus:ring-[var(--color-warning-light)]",
            !error && !success && !warning && "border-[var(--color-border-primary)] focus:border-[var(--color-primary-600)] focus:ring-[var(--color-primary-100)]",
            className
          )}
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          {...props}
        />
        {showCharCount && (
          <div className="absolute bottom-2 right-2 text-xs text-[var(--color-text-secondary)]">
            {charCount}{maxLength && `/${maxLength}`}
          </div>
        )}
      </div>
    </FormField>
  );
}

interface UnifiedSelectProps {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  warning?: string;
  description?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean; icon?: LucideIcon }[];
  className?: string;
  variant?: 'default' | 'compact' | 'comfortable' | 'spacious';
  size?: 'sm' | 'md' | 'lg';
  validationState?: 'default' | 'error' | 'success' | 'warning';
  searchable?: boolean;
  loading?: boolean;
}

export function UnifiedSelect({ 
  label, 
  required, 
  error, 
  success,
  warning,
  description, 
  placeholder = "Select an option",
  value,
  onValueChange,
  options,
  className,
  variant = 'default',
  size = 'md',
  validationState = 'default',
  searchable = false,
  loading = false
}: UnifiedSelectProps) {
  const sizes = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12'
  };

  const currentValidationState = error ? 'error' : success ? 'success' : warning ? 'warning' : validationState;

  return (
    <FormField 
      label={label} 
      required={required} 
      error={error}
      success={success}
      warning={warning}
      description={description}
      variant={variant}
      validationState={currentValidationState}
    >
      <Select value={value} onValueChange={onValueChange} disabled={loading}>
        <SelectTrigger className={cn(
          sizes[size],
          "transition-all duration-200 ease-in-out",
          error && "border-[var(--color-error-main)] focus:border-[var(--color-error-main)] focus:ring-[var(--color-error-light)]",
          success && "border-[var(--color-success-main)] focus:border-[var(--color-success-main)] focus:ring-[var(--color-success-light)]",
          warning && "border-[var(--color-warning-main)] focus:border-[var(--color-warning-main)] focus:ring-[var(--color-warning-light)]",
          !error && !success && !warning && "border-[var(--color-border-primary)] focus:border-[var(--color-primary-600)] focus:ring-[var(--color-primary-100)]",
          className
        )}>
          <SelectValue placeholder={placeholder} />
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
              className="flex items-center gap-2"
            >
              <div className="flex items-center gap-2">
                {option.icon && <option.icon className="w-4 h-4" />}
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

interface UnifiedDatePickerFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  variant?: 'default' | 'jalali' | 'range';
  className?: string;
}

export function UnifiedDatePickerField({ 
  label, 
  required, 
  error, 
  description, 
  className,
  ...datePickerProps 
}: UnifiedDatePickerFieldProps) {
  return (
    <FormField label={label} required={required} error={error} description={description}>
      <UnifiedDatePicker
        className={className}
        error={error}
        {...datePickerProps}
      />
    </FormField>
  );
}

// Form Actions Component
interface FormActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function FormActions({ children, align = 'right', className }: FormActionsProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  };

  return (
    <div className={cn("flex items-center gap-3 pt-6 border-t", alignClasses[align], className)}>
      {children}
    </div>
  );
}

// Form Section Component
interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  icon?: LucideIcon;
}

export function FormSection({ 
  title, 
  description, 
  children, 
  className,
  collapsible = false,
  defaultCollapsed = false,
  icon: Icon
}: FormSectionProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed && collapsible);

  return (
    <div className={cn("space-y-4", className)}>
      <div 
        className={cn(
          "space-y-1",
          collapsible && "cursor-pointer hover:bg-[var(--color-bg-secondary)] p-2 rounded-lg transition-colors"
        )}
        onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
      >
        <h3 className="text-base font-medium text-[var(--color-text-primary)] flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-[var(--color-primary-600)]" />}
          {title}
          {collapsible && (
            <span className="ml-auto">
              {collapsed ? '▼' : '▲'}
            </span>
          )}
        </h3>
        {description && (
          <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
        )}
      </div>
      {!collapsed && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Form Wizard Component
interface FormWizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  content: React.ReactNode;
  validation?: () => Promise<boolean>;
  optional?: boolean;
}

interface FormWizardProps {
  steps: FormWizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  className?: string;
  showProgress?: boolean;
  allowSkip?: boolean;
  loading?: boolean;
}

export function FormWizard({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  className,
  showProgress = true,
  allowSkip = false,
  loading = false
}: FormWizardProps) {
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set());

  const handleNext = async () => {
    const current = steps[currentStep];
    
    if (current.validation) {
      const isValid = await current.validation();
      if (!isValid) return;
    }

    setCompletedSteps(prev => new Set([...prev, currentStep]));

    if (currentStep < steps.length - 1) {
      onStepChange(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep || completedSteps.has(stepIndex)) {
      onStepChange(stepIndex);
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.has(stepIndex)) return 'completed';
    if (stepIndex === currentStep) return 'current';
    if (stepIndex < currentStep) return 'completed';
    return 'upcoming';
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress Indicator */}
      {showProgress && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Step {currentStep + 1} of {steps.length}
            </h2>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-[var(--color-bg-secondary)] rounded-full h-2">
            <div 
              className="bg-[var(--color-primary-600)] h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const Icon = step.icon;
              
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center gap-2 cursor-pointer transition-all duration-200",
                    status === 'upcoming' && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handleStepClick(index)}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
                    status === 'completed' && "bg-[var(--color-success-main)] text-white",
                    status === 'current' && "bg-[var(--color-primary-600)] text-white",
                    status === 'upcoming' && "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
                  )}>
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : Icon ? (
                      <Icon className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="text-center">
                    <div className={cn(
                      "text-xs font-medium",
                      status === 'current' && "text-[var(--color-primary-600)]",
                      status === 'completed' && "text-[var(--color-success-main)]",
                      status === 'upcoming' && "text-[var(--color-text-secondary)]"
                    )}>
                      {step.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Step Content */}
      <Card className="border border-[var(--color-border-primary)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--color-text-primary)]">
            {steps[currentStep].icon && (
              <steps[currentStep].icon className="w-5 h-5 text-[var(--color-primary-600)]" />
            )}
            {steps[currentStep].title}
          </CardTitle>
          {steps[currentStep].description && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {steps[currentStep].description}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {steps[currentStep].content}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-primary)]">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0 || loading}
          className="flex items-center gap-2"
        >
          ← Previous
        </Button>

        <div className="flex items-center gap-2">
          {allowSkip && currentStep < steps.length - 1 && steps[currentStep].optional && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onStepChange(currentStep + 1)}
              disabled={loading}
            >
              Skip
            </Button>
          )}
          
          <Button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {currentStep === steps.length - 1 ? 'Complete' : 'Next →'}
          </Button>
        </div>
      </div>
    </div>
  );
}
// Form
 Validation Utilities
export const formValidators = {
  required: (value: any) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return { isValid: false, message: 'This field is required', type: 'error' as const };
    }
    return { isValid: true };
  },

  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { isValid: false, message: 'Please enter a valid email address', type: 'error' as const };
    }
    return { isValid: true, message: 'Valid email address', type: 'success' as const };
  },

  minLength: (min: number) => (value: string) => {
    if (value.length < min) {
      return { isValid: false, message: `Minimum ${min} characters required`, type: 'error' as const };
    }
    return { isValid: true };
  },

  maxLength: (max: number) => (value: string) => {
    if (value.length > max) {
      return { isValid: false, message: `Maximum ${max} characters allowed`, type: 'error' as const };
    }
    return { isValid: true };
  },

  nationalId: (value: string) => {
    // Iranian National ID validation
    if (!/^\d{10}$/.test(value)) {
      return { isValid: false, message: 'National ID must be 10 digits', type: 'error' as const };
    }
    
    const check = parseInt(value[9]);
    const sum = value.slice(0, 9).split('').reduce((acc, digit, index) => {
      return acc + parseInt(digit) * (10 - index);
    }, 0);
    
    const remainder = sum % 11;
    const isValid = remainder < 2 ? check === remainder : check === 11 - remainder;
    
    if (!isValid) {
      return { isValid: false, message: 'Invalid National ID', type: 'error' as const };
    }
    
    return { isValid: true, message: 'Valid National ID', type: 'success' as const };
  },

  phone: (value: string) => {
    const phoneRegex = /^(\+98|0)?9\d{9}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      return { isValid: false, message: 'Please enter a valid phone number', type: 'error' as const };
    }
    return { isValid: true, message: 'Valid phone number', type: 'success' as const };
  },

  combine: (...validators: Array<(value: any) => { isValid: boolean; message?: string; type?: 'error' | 'success' | 'warning' }>) => {
    return (value: any) => {
      for (const validator of validators) {
        const result = validator(value);
        if (!result.isValid) {
          return result;
        }
      }
      return { isValid: true };
    };
  }
};

// Form State Management Hook
interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
}

interface FormConfig<T> {
  initialData: T;
  validators?: Partial<Record<keyof T, (value: any) => { isValid: boolean; message?: string; type?: 'error' | 'success' | 'warning' }>>;
  onSubmit?: (data: T) => Promise<void>;
}

export function useFormState<T extends Record<string, any>>(config: FormConfig<T>) {
  const [state, setState] = React.useState<FormState<T>>({
    data: config.initialData,
    errors: {},
    touched: {},
    isValid: false,
    isSubmitting: false
  });

  const validateField = React.useCallback((field: keyof T, value: any) => {
    const validator = config.validators?.[field];
    if (validator) {
      const result = validator(value);
      return result;
    }
    return { isValid: true };
  }, [config.validators]);

  const setFieldValue = React.useCallback((field: keyof T, value: any) => {
    setState(prev => {
      const newData = { ...prev.data, [field]: value };
      const validation = validateField(field, value);
      const newErrors = { ...prev.errors };
      
      if (!validation.isValid && validation.message) {
        newErrors[field] = validation.message;
      } else {
        delete newErrors[field];
      }

      return {
        ...prev,
        data: newData,
        errors: newErrors,
        touched: { ...prev.touched, [field]: true },
        isValid: Object.keys(newErrors).length === 0
      };
    });
  }, [validateField]);

  const setFieldTouched = React.useCallback((field: keyof T, touched = true) => {
    setState(prev => ({
      ...prev,
      touched: { ...prev.touched, [field]: touched }
    }));
  }, []);

  const validateForm = React.useCallback(() => {
    const errors: Partial<Record<keyof T, string>> = {};
    
    Object.keys(config.initialData).forEach(key => {
      const field = key as keyof T;
      const validation = validateField(field, state.data[field]);
      if (!validation.isValid && validation.message) {
        errors[field] = validation.message;
      }
    });

    setState(prev => ({
      ...prev,
      errors,
      isValid: Object.keys(errors).length === 0
    }));

    return Object.keys(errors).length === 0;
  }, [config.initialData, state.data, validateField]);

  const handleSubmit = React.useCallback(async () => {
    if (!validateForm()) return;

    setState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      await config.onSubmit?.(state.data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [config.onSubmit, state.data, validateForm]);

  const reset = React.useCallback(() => {
    setState({
      data: config.initialData,
      errors: {},
      touched: {},
      isValid: false,
      isSubmitting: false
    });
  }, [config.initialData]);

  return {
    ...state,
    setFieldValue,
    setFieldTouched,
    validateForm,
    handleSubmit,
    reset,
    getFieldProps: (field: keyof T) => ({
      value: state.data[field],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        setFieldValue(field, e.target.value),
      onBlur: () => setFieldTouched(field),
      error: state.touched[field] ? state.errors[field] : undefined
    })
  };
}
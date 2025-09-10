"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/loading-progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  LucideIcon, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Loader2,
  Eye,
  EyeOff,
  Search,
  X,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  Zap
} from 'lucide-react';

// Enhanced Form Field Variants
export type FormFieldVariant = 'compact' | 'comfortable' | 'spacious';
export type FormFieldSize = 'sm' | 'md' | 'lg';
export type ValidationState = 'default' | 'error' | 'success' | 'warning' | 'loading';

// Form Field Configuration
interface FormFieldConfig {
  variant: FormFieldVariant;
  size: FormFieldSize;
  showValidationIcon: boolean;
  realTimeValidation: boolean;
  animateValidation: boolean;
}

const defaultFieldConfig: FormFieldConfig = {
  variant: 'comfortable',
  size: 'md',
  showValidationIcon: true,
  realTimeValidation: true,
  animateValidation: true
};

// Enhanced Form Field Component
interface EnhancedFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  warning?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  config?: Partial<FormFieldConfig>;
  validationState?: ValidationState;
  loading?: boolean;
}

export function EnhancedFormField({ 
  label, 
  required, 
  error, 
  success,
  warning,
  description, 
  children, 
  className,
  config = {},
  validationState = 'default',
  loading = false
}: EnhancedFormFieldProps) {
  const fieldConfig = { ...defaultFieldConfig, ...config };
  
  const variants = {
    compact: 'space-y-1',
    comfortable: 'space-y-2',
    spacious: 'space-y-3'
  };

  const getValidationIcon = () => {
    if (!fieldConfig.showValidationIcon) return null;
    
    switch (validationState) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-[var(--color-error-main)]" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[var(--color-success-main)]" />;
      case 'warning':
        return <Info className="w-4 h-4 text-[var(--color-warning-main)]" />;
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary-600)]" />;
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
    <div className={cn(
      variants[fieldConfig.variant], 
      fieldConfig.animateValidation && "transition-all duration-200",
      className
    )}>
      <Label className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2">
        {label}
        {required && <span className="text-[var(--color-error-main)]">*</span>}
        {getValidationIcon()}
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
      </Label>
      
      <div className="relative">
        {children}
      </div>
      
      {description && (
        <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
          <Info className="w-3 h-3" />
          {description}
        </p>
      )}
      
      {validationMessage && (
        <p className={cn(
          "text-sm flex items-center gap-1 transition-all duration-200",
          validationMessage.type === 'error' && "text-[var(--color-error-main)]",
          validationMessage.type === 'success' && "text-[var(--color-success-main)]",
          validationMessage.type === 'warning' && "text-[var(--color-warning-main)]",
          fieldConfig.animateValidation && "animate-in slide-in-from-top-1"
        )}>
          {getValidationIcon()}
          {validationMessage.message}
        </p>
      )}
    </div>
  );
}

// Enhanced Input with Advanced Features
interface EnhancedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  warning?: string;
  description?: string;
  config?: Partial<FormFieldConfig>;
  size?: FormFieldSize;
  validationState?: ValidationState;
  loading?: boolean;
  showPasswordToggle?: boolean;
  clearable?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  onValidate?: (value: string) => Promise<{ isValid: boolean; message?: string; type?: 'error' | 'success' | 'warning' }>;
  debounceMs?: number;
}

export function EnhancedInput({ 
  label, 
  required, 
  error, 
  success,
  warning,
  description, 
  className,
  config = {},
  size = 'md',
  validationState = 'default',
  loading = false,
  showPasswordToggle = false,
  clearable = false,
  prefix,
  suffix,
  onValidate,
  debounceMs = 300,
  type = 'text',
  value,
  onChange,
  ...props 
}: EnhancedInputProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ message?: string; type?: 'error' | 'success' | 'warning' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const fieldConfig = { ...defaultFieldConfig, ...config };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-3',
    lg: 'h-12 px-4 text-lg'
  };

  const handleValidation = useCallback(async (inputValue: string) => {
    if (!onValidate || !inputValue) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    try {
      const result = await onValidate(inputValue);
      setValidationResult(result);
    } catch (err) {
      setValidationResult({ message: 'Validation failed', type: 'error' });
    } finally {
      setIsValidating(false);
    }
  }, [onValidate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    
    if (fieldConfig.realTimeValidation && onValidate) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      const timer = setTimeout(() => {
        handleValidation(e.target.value);
      }, debounceMs);
      
      setDebounceTimer(timer);
    }
  };

  const handleClear = () => {
    if (onChange) {
      const event = {
        target: { value: '' }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
    setValidationResult(null);
  };

  const currentValidationState = error ? 'error' : success ? 'success' : warning ? 'warning' : 
    isValidating ? 'loading' : validationResult?.type || validationState;
  
  const currentError = error || (validationResult?.type === 'error' ? validationResult.message : undefined);
  const currentSuccess = success || (validationResult?.type === 'success' ? validationResult.message : undefined);
  const currentWarning = warning || (validationResult?.type === 'warning' ? validationResult.message : undefined);

  const inputType = showPasswordToggle && type === 'password' ? (showPassword ? 'text' : 'password') : type;

  return (
    <EnhancedFormField 
      label={label} 
      required={required} 
      error={currentError}
      success={currentSuccess}
      warning={currentWarning}
      description={description}
      config={fieldConfig}
      validationState={currentValidationState}
      loading={loading || isValidating}
    >
      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-3 z-10 text-[var(--color-text-secondary)]">
            {prefix}
          </div>
        )}
        
        <Input
          type={inputType}
          value={value}
          onChange={handleChange}
          className={cn(
            sizes[size],
            "transition-all duration-200 ease-in-out",
            prefix && "pl-10",
            (suffix || showPasswordToggle || clearable || isValidating) && "pr-10",
            currentError && "border-[var(--color-error-main)] focus:border-[var(--color-error-main)] focus:ring-[var(--color-error-light)]",
            currentSuccess && "border-[var(--color-success-main)] focus:border-[var(--color-success-main)] focus:ring-[var(--color-success-light)]",
            currentWarning && "border-[var(--color-warning-main)] focus:border-[var(--color-warning-main)] focus:ring-[var(--color-warning-light)]",
            !currentError && !currentSuccess && !currentWarning && "border-[var(--color-border-primary)] focus:border-[var(--color-primary-600)] focus:ring-[var(--color-primary-100)]",
            className
          )}
          {...props}
        />
        
        <div className="absolute right-3 flex items-center gap-1">
          {isValidating && (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary-600)]" />
          )}
          
          {clearable && value && !isValidating && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={handleClear}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          
          {showPasswordToggle && type === 'password' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
          )}
          
          {suffix && !isValidating && !clearable && (
            <div className="text-[var(--color-text-secondary)]">
              {suffix}
            </div>
          )}
        </div>
      </div>
    </EnhancedFormField>
  );
}

// Enhanced Textarea with Character Count and Auto-resize
interface EnhancedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  warning?: string;
  description?: string;
  config?: Partial<FormFieldConfig>;
  size?: FormFieldSize;
  validationState?: ValidationState;
  loading?: boolean;
  showCharCount?: boolean;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
}

export function EnhancedTextarea({ 
  label, 
  required, 
  error, 
  success,
  warning,
  description, 
  className,
  config = {},
  size = 'md',
  validationState = 'default',
  loading = false,
  showCharCount = false,
  autoResize = false,
  minRows = 3,
  maxRows = 10,
  maxLength,
  value,
  onChange,
  ...props 
}: EnhancedTextareaProps) {
  const [charCount, setCharCount] = useState(0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const fieldConfig = { ...defaultFieldConfig, ...config };

  const sizes = {
    sm: 'min-h-[80px] px-3 py-2 text-sm',
    md: 'min-h-[100px] px-3 py-2',
    lg: 'min-h-[120px] px-4 py-3 text-lg'
  };

  const adjustHeight = useCallback(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
      const minHeight = lineHeight * minRows;
      const maxHeight = lineHeight * maxRows;
      
      const scrollHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [autoResize, minRows, maxRows]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
    onChange?.(e);
    adjustHeight();
  };

  useEffect(() => {
    if (typeof value === 'string') {
      setCharCount(value.length);
    }
    adjustHeight();
  }, [value, adjustHeight]);

  const currentValidationState = error ? 'error' : success ? 'success' : warning ? 'warning' : validationState;

  return (
    <EnhancedFormField 
      label={label} 
      required={required} 
      error={error}
      success={success}
      warning={warning}
      description={description}
      config={fieldConfig}
      validationState={currentValidationState}
      loading={loading}
    >
      <div className="relative">
        <Textarea
          ref={textareaRef}
          className={cn(
            sizes[size],
            "transition-all duration-200 ease-in-out resize-none",
            autoResize && "overflow-hidden",
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
          <div className={cn(
            "absolute bottom-2 right-2 text-xs transition-colors duration-200",
            maxLength && charCount > maxLength * 0.8 
              ? charCount >= maxLength 
                ? "text-[var(--color-error-main)]" 
                : "text-[var(--color-warning-main)]"
              : "text-[var(--color-text-secondary)]"
          )}>
            {charCount}{maxLength && `/${maxLength}`}
          </div>
        )}
      </div>
    </EnhancedFormField>
  );
}

// Enhanced Select with Search and Multi-select
interface EnhancedSelectProps {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  warning?: string;
  description?: string;
  placeholder?: string;
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  options: { value: string; label: string; disabled?: boolean; icon?: LucideIcon; description?: string }[];
  config?: Partial<FormFieldConfig>;
  size?: FormFieldSize;
  validationState?: ValidationState;
  loading?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  clearable?: boolean;
  maxSelections?: number;
}

export function EnhancedSelect({ 
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
  config = {},
  size = 'md',
  validationState = 'default',
  loading = false,
  searchable = false,
  multiple = false,
  clearable = false,
  maxSelections
}: EnhancedSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const fieldConfig = { ...defaultFieldConfig, ...config };

  const sizes = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12'
  };

  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
  const selectedOptions = options.filter(option => selectedValues.includes(option.value));

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : maxSelections && currentValues.length >= maxSelections
          ? currentValues
          : [...currentValues, optionValue];
      onValueChange?.(newValues);
    } else {
      onValueChange?.(optionValue);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onValueChange?.(multiple ? [] : '');
  };

  const currentValidationState = error ? 'error' : success ? 'success' : warning ? 'warning' : validationState;

  return (
    <EnhancedFormField 
      label={label} 
      required={required} 
      error={error}
      success={success}
      warning={warning}
      description={description}
      config={fieldConfig}
      validationState={currentValidationState}
      loading={loading}
    >
      <div className="relative">
        <Select 
          open={isOpen} 
          onOpenChange={setIsOpen}
          value={multiple ? undefined : (value as string)}
          onValueChange={multiple ? undefined : onValueChange}
          disabled={loading}
        >
          <SelectTrigger className={cn(
            sizes[size],
            "transition-all duration-200 ease-in-out",
            error && "border-[var(--color-error-main)] focus:border-[var(--color-error-main)] focus:ring-[var(--color-error-light)]",
            success && "border-[var(--color-success-main)] focus:border-[var(--color-success-main)] focus:ring-[var(--color-success-light)]",
            warning && "border-[var(--color-warning-main)] focus:border-[var(--color-warning-main)] focus:ring-[var(--color-warning-light)]",
            !error && !success && !warning && "border-[var(--color-border-primary)] focus:border-[var(--color-primary-600)] focus:ring-[var(--color-primary-100)]"
          )}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {multiple && selectedOptions.length > 0 ? (
                  <div className="flex items-center gap-1 flex-wrap">
                    {selectedOptions.slice(0, 3).map(option => (
                      <Badge key={option.value} variant="secondary" className="text-xs">
                        {option.label}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(option.value);
                          }}
                        >
                          <X className="w-2 h-2" />
                        </Button>
                      </Badge>
                    ))}
                    {selectedOptions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{selectedOptions.length - 3} more
                      </Badge>
                    )}
                  </div>
                ) : selectedOptions.length === 1 ? (
                  <div className="flex items-center gap-2">
                    {selectedOptions[0].icon && React.createElement(selectedOptions[0].icon, { className: "w-4 h-4" })}
                    <span>{selectedOptions[0].label}</span>
                  </div>
                ) : (
                  <span className="text-[var(--color-text-secondary)]">{placeholder}</span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {clearable && selectedValues.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
            </div>
          </SelectTrigger>
          
          <SelectContent>
            {searchable && (
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-[var(--color-text-secondary)]" />
                  <Input
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-7 text-xs"
                  />
                </div>
              </div>
            )}
            
            {filteredOptions.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              const Icon = option.icon;
              
              return (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    multiple && "pr-8"
                  )}
                  onClick={() => multiple && handleSelect(option.value)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {multiple && (
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelect(option.value)}
                        className="mr-2"
                      />
                    )}
                    {Icon && <Icon className="w-4 h-4" />}
                    <div>
                      <div>{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                </SelectItem>
              );
            })}
            
            {filteredOptions.length === 0 && (
              <div className="p-4 text-center text-sm text-[var(--color-text-secondary)]">
                No options found
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    </EnhancedFormField>
  );
}

// Enhanced Form Wizard with Progress Tracking
interface FormWizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  content: React.ReactNode;
  validation?: () => Promise<boolean>;
  optional?: boolean;
  estimatedTime?: number; // in minutes
}

interface EnhancedFormWizardProps {
  steps: FormWizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  className?: string;
  showProgress?: boolean;
  showTimeEstimate?: boolean;
  allowSkip?: boolean;
  allowStepNavigation?: boolean;
  loading?: boolean;
  autoSave?: boolean;
  onAutoSave?: (stepData: any) => Promise<void>;
}

export function EnhancedFormWizard({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  className,
  showProgress = true,
  showTimeEstimate = false,
  allowSkip = false,
  allowStepNavigation = true,
  loading = false,
  autoSave = false,
  onAutoSave
}: EnhancedFormWizardProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepErrors, setStepErrors] = useState<Record<number, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const totalEstimatedTime = steps.reduce((total, step) => total + (step.estimatedTime || 0), 0);
  const completedTime = steps.slice(0, currentStep).reduce((total, step) => total + (step.estimatedTime || 0), 0);

  const handleNext = async () => {
    const current = steps[currentStep];
    setIsValidating(true);
    
    try {
      if (current.validation) {
        const isValid = await current.validation();
        if (!isValid) {
          setStepErrors(prev => ({ ...prev, [currentStep]: 'Please fix the errors before continuing' }));
          setIsValidating(false);
          return;
        }
      }

      // Auto-save if enabled
      if (autoSave && onAutoSave) {
        setAutoSaveStatus('saving');
        try {
          await onAutoSave({ step: currentStep, data: {} }); // You would pass actual form data here
          setAutoSaveStatus('saved');
        } catch (error) {
          setAutoSaveStatus('error');
        }
      }

      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setStepErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[currentStep];
        return newErrors;
      });

      if (currentStep < steps.length - 1) {
        onStepChange(currentStep + 1);
      } else {
        onComplete();
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (!allowStepNavigation) return;
    
    if (stepIndex <= currentStep || completedSteps.has(stepIndex)) {
      onStepChange(stepIndex);
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepErrors[stepIndex]) return 'error';
    if (completedSteps.has(stepIndex)) return 'completed';
    if (stepIndex === currentStep) return 'current';
    if (stepIndex < currentStep) return 'completed';
    return 'upcoming';
  };

  const getStepIcon = (step: FormWizardStep, index: number, status: string) => {
    if (status === 'error') {
      return <AlertCircle className="w-5 h-5 text-[var(--color-error-main)]" />;
    }
    
    if (status === 'completed') {
      return <CheckCircle2 className="w-5 h-5 text-[var(--color-success-main)]" />;
    }
    
    if (step.icon) {
      const Icon = step.icon;
      return <Icon className="w-5 h-5" />;
    }
    
    return <span className="text-sm font-medium">{index + 1}</span>;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress Header */}
      {showProgress && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Step {currentStep + 1} of {steps.length}
              </h2>
              {showTimeEstimate && totalEstimatedTime > 0 && (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Estimated time: {totalEstimatedTime} minutes
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {autoSave && (
                <div className="flex items-center gap-2 text-sm">
                  {autoSaveStatus === 'saving' && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-[var(--color-text-secondary)]">Saving...</span>
                    </>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[var(--color-success-main)]" />
                      <span className="text-[var(--color-success-main)]">Saved</span>
                    </>
                  )}
                  {autoSaveStatus === 'error' && (
                    <>
                      <AlertCircle className="w-4 h-4 text-[var(--color-error-main)]" />
                      <span className="text-[var(--color-error-main)]">Save failed</span>
                    </>
                  )}
                </div>
              )}
              
              <div className="text-sm text-[var(--color-text-secondary)]">
                {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <Progress 
            value={(currentStep + 1) / steps.length * 100}
            className="w-full"
            color="primary"
            animated
          />

          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center gap-2 transition-all duration-200",
                    allowStepNavigation && (status === 'completed' || index <= currentStep) && "cursor-pointer hover:scale-105",
                    status === 'upcoming' && !allowStepNavigation && "opacity-50"
                  )}
                  onClick={() => handleStepClick(index)}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
                    status === 'completed' && "bg-[var(--color-success-main)] text-white",
                    status === 'current' && "bg-[var(--color-primary-600)] text-white ring-4 ring-[var(--color-primary-100)]",
                    status === 'error' && "bg-[var(--color-error-main)] text-white",
                    status === 'upcoming' && "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-2 border-[var(--color-border-primary)]"
                  )}>
                    {getStepIcon(step, index, status)}
                  </div>
                  
                  <div className="text-center max-w-20">
                    <div className={cn(
                      "text-xs font-medium truncate",
                      status === 'current' && "text-[var(--color-primary-600)]",
                      status === 'completed' && "text-[var(--color-success-main)]",
                      status === 'error' && "text-[var(--color-error-main)]",
                      status === 'upcoming' && "text-[var(--color-text-secondary)]"
                    )}>
                      {step.title}
                    </div>
                    {step.estimatedTime && showTimeEstimate && (
                      <div className="text-xs text-[var(--color-text-tertiary)]">
                        {step.estimatedTime}min
                      </div>
                    )}
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
              React.createElement(steps[currentStep].icon, { className: "w-5 h-5 text-[var(--color-primary-600)]" })
            )}
            {steps[currentStep].title}
            {steps[currentStep].optional && (
              <Badge variant="outline" className="text-xs">Optional</Badge>
            )}
          </CardTitle>
          {steps[currentStep].description && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {steps[currentStep].description}
            </p>
          )}
          {stepErrors[currentStep] && (
            <div className="flex items-center gap-2 p-3 bg-[var(--color-error-light)] border border-[var(--color-error-main)] rounded-lg">
              <AlertCircle className="w-4 h-4 text-[var(--color-error-main)]" />
              <span className="text-sm text-[var(--color-error-main)]">
                {stepErrors[currentStep]}
              </span>
            </div>
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
          disabled={currentStep === 0 || loading || isValidating}
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
              disabled={loading || isValidating}
            >
              Skip
            </Button>
          )}
          
          <Button
            type="button"
            onClick={handleNext}
            disabled={loading || isValidating}
            className="flex items-center gap-2"
          >
            {(loading || isValidating) && <Loader2 className="w-4 h-4 animate-spin" />}
            {currentStep === steps.length - 1 ? 'Complete' : 'Next →'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Dynamic Form Builder
interface FormFieldDefinition {
  id: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number';
  label: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[]; // For select, radio
  validation?: (value: any) => { isValid: boolean; message?: string; type?: 'error' | 'success' | 'warning' };
  dependencies?: string[]; // Field IDs this field depends on
  conditional?: (formData: Record<string, any>) => boolean; // Show/hide based on other fields
  defaultValue?: any;
  props?: Record<string, any>; // Additional props for the field component
}

interface DynamicFormProps {
  fields: FormFieldDefinition[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
  initialData?: Record<string, any>;
  config?: Partial<FormFieldConfig>;
  className?: string;
  submitLabel?: string;
  resetLabel?: string;
  showReset?: boolean;
  loading?: boolean;
}

export function DynamicForm({
  fields,
  onSubmit,
  initialData = {},
  config = {},
  className,
  submitLabel = 'Submit',
  resetLabel = 'Reset',
  showReset = true,
  loading = false
}: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fieldConfig = { ...defaultFieldConfig, ...config };

  const updateField = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    setTouched(prev => ({ ...prev, [fieldId]: true }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateField = (field: FormFieldDefinition, value: any) => {
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return { isValid: false, message: 'This field is required', type: 'error' as const };
    }
    
    if (field.validation) {
      return field.validation(value);
    }
    
    return { isValid: true };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.conditional && !field.conditional(formData)) return;
      
      const value = formData[field.id];
      const validation = validateField(field, value);
      
      if (!validation.isValid && validation.message) {
        newErrors[field.id] = validation.message;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
  };

  const renderField = (field: FormFieldDefinition) => {
    if (field.conditional && !field.conditional(formData)) {
      return null;
    }

    const value = formData[field.id] ?? field.defaultValue ?? '';
    const error = errors[field.id];
    const isTouched = touched[field.id];

    const commonProps = {
      label: field.label,
      required: field.required,
      error: isTouched ? error : undefined,
      description: field.description,
      config: fieldConfig,
      ...field.props
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
        return (
          <EnhancedInput
            key={field.id}
            type={field.type}
            value={value}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={field.placeholder}
            {...commonProps}
          />
        );

      case 'textarea':
        return (
          <EnhancedTextarea
            key={field.id}
            value={value}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={field.placeholder}
            {...commonProps}
          />
        );

      case 'select':
        return (
          <EnhancedSelect
            key={field.id}
            value={value}
            onValueChange={(newValue) => updateField(field.id, newValue)}
            options={field.options || []}
            placeholder={field.placeholder}
            {...commonProps}
          />
        );

      case 'checkbox':
        return (
          <EnhancedFormField key={field.id} {...commonProps}>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={value}
                onCheckedChange={(checked) => updateField(field.id, checked)}
              />
              <Label className="text-sm">{field.label}</Label>
            </div>
          </EnhancedFormField>
        );

      case 'radio':
        return (
          <EnhancedFormField key={field.id} {...commonProps}>
            <RadioGroup
              value={value}
              onValueChange={(newValue) => updateField(field.id, newValue)}
            >
              {field.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} />
                  <Label className="text-sm">{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </EnhancedFormField>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {fields.map(renderField)}
      
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-[var(--color-border-primary)]">
        {showReset && (
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={loading || isSubmitting}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {resetLabel}
          </Button>
        )}
        
        <Button
          type="submit"
          disabled={loading || isSubmitting}
          className="flex items-center gap-2"
        >
          {(loading || isSubmitting) && <Loader2 className="w-4 h-4 animate-spin" />}
          <Save className="w-4 h-4" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

// Form Validation Utilities
export const enhancedFormValidators = {
  required: (message = 'This field is required') => (value: any) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return { isValid: false, message, type: 'error' as const };
    }
    return { isValid: true };
  },

  email: (message = 'Please enter a valid email address') => (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { isValid: false, message, type: 'error' as const };
    }
    return { isValid: true, message: 'Valid email address', type: 'success' as const };
  },

  minLength: (min: number, message?: string) => (value: string) => {
    if (value.length < min) {
      return { 
        isValid: false, 
        message: message || `Minimum ${min} characters required`, 
        type: 'error' as const 
      };
    }
    return { isValid: true };
  },

  maxLength: (max: number, message?: string) => (value: string) => {
    if (value.length > max) {
      return { 
        isValid: false, 
        message: message || `Maximum ${max} characters allowed`, 
        type: 'error' as const 
      };
    }
    return { isValid: true };
  },

  pattern: (regex: RegExp, message = 'Invalid format') => (value: string) => {
    if (!regex.test(value)) {
      return { isValid: false, message, type: 'error' as const };
    }
    return { isValid: true };
  },

  async: (asyncValidator: (value: any) => Promise<{ isValid: boolean; message?: string; type?: 'error' | 'success' | 'warning' }>) => {
    return asyncValidator;
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

export default {
  EnhancedFormField,
  EnhancedInput,
  EnhancedTextarea,
  EnhancedSelect,
  EnhancedFormWizard,
  DynamicForm,
  enhancedFormValidators
};
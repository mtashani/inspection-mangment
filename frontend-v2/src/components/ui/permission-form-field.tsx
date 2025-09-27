'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// Simplified permission form field (middleware handles all permissions)
interface PermissionFormFieldProps {
  label?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}

/**
 * Simple form field wrapper (permission logic moved to middleware)
 */
export function PermissionFormField({
  label,
  description,
  required,
  children,
}: PermissionFormFieldProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

/**
 * Simple input field
 */
export function PermissionInput({
  label,
  description,
  required,
  ...inputProps
}: PermissionFormFieldProps & React.ComponentProps<typeof Input>) {
  return (
    <PermissionFormField
      label={label}
      description={description}
      required={required}
    >
      <Input {...inputProps} />
    </PermissionFormField>
  );
}

/**
 * Simple textarea field
 */
export function PermissionTextarea({
  label,
  description,
  required,
  ...textareaProps
}: PermissionFormFieldProps & React.ComponentProps<typeof Textarea>) {
  return (
    <PermissionFormField
      label={label}
      description={description}
      required={required}
    >
      <Textarea {...textareaProps} />
    </PermissionFormField>
  );
}

/**
 * Simple select field
 */
export function PermissionSelect({
  label,
  description,
  required,
  children,
  ...selectProps
}: PermissionFormFieldProps & React.ComponentProps<typeof Select>) {
  return (
    <PermissionFormField
      label={label}
      description={description}
      required={required}
    >
      <Select {...selectProps}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
    </PermissionFormField>
  );
}

/**
 * Simple checkbox field
 */
export function PermissionCheckbox({
  label,
  description,
  required,
  ...checkboxProps
}: PermissionFormFieldProps & React.ComponentProps<typeof Checkbox>) {
  return (
    <PermissionFormField
      description={description}
      required={required}
    >
      <div className="flex items-center space-x-2">
        <Checkbox {...checkboxProps} />
        {label && (
          <Label htmlFor={checkboxProps.id} className="text-sm font-medium cursor-pointer">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
      </div>
    </PermissionFormField>
  );
}
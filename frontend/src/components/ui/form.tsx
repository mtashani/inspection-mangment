"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    spacing?: 'sm' | 'md' | 'lg'
  }
>(({ className, spacing = 'md', ...props }, ref) => {
  const id = React.useId()
  
  const spacingStyles = {
    sm: { gap: 'var(--space-1)' },
    md: { gap: 'var(--space-2)' }, 
    lg: { gap: 'var(--space-3)' }
  }

  return (
    <FormItemContext.Provider value={{ id }}>
      <div 
        ref={ref} 
        className={cn('flex flex-col', className)}
        style={spacingStyles[spacing]}
        {...props} 
      />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    required?: boolean
    size?: 'sm' | 'md' | 'lg'
  }
>(({ className, required = false, size = 'md', children, ...props }, ref) => {
  const { error, formItemId } = useFormField()
  
  const sizeStyles = {
    sm: { fontSize: 'var(--font-size-xs)' },
    md: { fontSize: 'var(--font-size-sm)' },
    lg: { fontSize: 'var(--font-size-base)' }
  }

  return (
    <Label
      ref={ref}
      className={cn('font-medium', className)}
      style={{
        ...sizeStyles[size],
        color: error ? 'var(--color-error)' : undefined
      }}
      htmlFor={formItemId}
      {...props}
    >
      {children}
      {required && (
        <span className="text-[var(--color-error)] ml-1" aria-label="required">
          *
        </span>
      )}
    </Label>
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={className}
      style={{
        fontSize: 'var(--font-size-sm)',
        color: 'var(--muted-foreground)'
      }}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    variant?: 'error' | 'warning' | 'info'
  }
>(({ className, children, variant = 'error', ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }
  
  const variantStyles = {
    error: { color: 'var(--color-error)' },
    warning: { color: 'var(--color-warning)' },
    info: { color: 'var(--color-info)' }
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn('font-medium', className)}
      style={{
        fontSize: 'var(--font-size-sm)',
        ...(error ? variantStyles.error : variantStyles[variant])
      }}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}

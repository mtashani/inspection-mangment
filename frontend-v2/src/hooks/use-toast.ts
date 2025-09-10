// Toast Hook
// Simple toast implementation using sonner

import { toast as sonnerToast } from 'sonner'

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export function useToast() {
  const toast = ({ title, description, variant = 'default', duration }: ToastProps) => {
    const message = title && description ? `${title}: ${description}` : title || description || ''
    
    if (variant === 'destructive') {
      sonnerToast.error(message, { duration })
    } else {
      sonnerToast.success(message, { duration })
    }
  }

  return { toast }
}
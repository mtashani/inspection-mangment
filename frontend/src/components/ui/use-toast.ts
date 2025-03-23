'use client';

import { toast } from 'sonner';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export const useToast = () => {
  const showToast = ({
    title,
    description,
    variant = 'default',
    duration,
    action,
  }: ToastProps) => {
    const options: {
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
      description?: string;
    } = {
      duration,
    };

    if (action) {
      options.action = {
        label: action.label,
        onClick: action.onClick,
      };
    }

    // Map variants to Sonner methods
    if (variant === 'destructive') {
      toast.error(title, {
        description,
        ...options,
      });
    } else {
      toast(title, {
        description,
        ...options,
      });
    }
  };

  return { toast: showToast };
};
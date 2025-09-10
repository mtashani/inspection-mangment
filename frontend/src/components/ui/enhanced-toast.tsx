"use client";

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Info, 
  X, 
  Undo2,
  RefreshCw,
  ExternalLink,
  Clock,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// Toast types and interfaces
export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'loading';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface ToastAction {
  id: string;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  loading?: boolean;
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
  persistent?: boolean;
  actions?: ToastAction[];
  onDismiss?: () => void;
  onUndo?: () => void;
  progress?: number;
  timestamp?: Date;
  metadata?: any;
}

// Toast context
interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  clearAll: () => void;
  position: ToastPosition;
  setPosition: (position: ToastPosition) => void;
  maxToasts: number;
  setMaxToasts: (max: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast provider component
interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
  defaultDuration?: number;
}

export function ToastProvider({ 
  children, 
  position: initialPosition = 'top-right',
  maxToasts: initialMaxToasts = 5,
  defaultDuration = 5000
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [position, setPosition] = useState<ToastPosition>(initialPosition);
  const [maxToasts, setMaxToasts] = useState(initialMaxToasts);

  const addToast = useCallback((toast: Omit<Toast, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      timestamp: new Date(),
      duration: toast.duration ?? defaultDuration
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Limit number of toasts
      return updated.slice(0, maxToasts);
    });

    // Auto dismiss if not persistent
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [defaultDuration, maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => {
      const toast = prev.find(t => t.id === id);
      if (toast?.onDismiss) {
        toast.onDismiss();
      }
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      updateToast,
      clearAll,
      position,
      setPosition,
      maxToasts,
      setMaxToasts
    }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast container component
function ToastContainer() {
  const { toasts, position } = useToast();

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  if (toasts.length === 0) return null;

  return (
    <div className={cn(
      "fixed z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none",
      positionClasses[position]
    )}>
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          index={index}
          isStacked={toasts.length > 1}
        />
      ))}
    </div>
  );
}

// Individual toast item component
interface ToastItemProps {
  toast: Toast;
  index: number;
  isStacked: boolean;
}

function ToastItem({ toast, index, isStacked }: ToastItemProps) {
  const { removeToast, updateToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Progress bar animation
  useEffect(() => {
    if (toast.duration && toast.duration > 0 && !toast.persistent) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (toast.duration! / 100));
          return Math.max(0, newProgress);
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [toast.duration, toast.persistent]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => removeToast(toast.id), 200);
  };

  const handleAction = (action: ToastAction) => {
    updateToast(toast.id, {
      actions: toast.actions?.map(a => 
        a.id === action.id ? { ...a, loading: true } : a
      )
    });

    action.onClick();
  };

  const handleUndo = () => {
    if (toast.onUndo) {
      toast.onUndo();
      handleDismiss();
    }
  };

  // Toast variant configurations
  const variants = {
    success: {
      icon: CheckCircle2,
      bgColor: 'bg-[var(--color-success-light)]',
      borderColor: 'border-[var(--color-success-main)]',
      textColor: 'text-[var(--color-success-dark)]',
      iconColor: 'text-[var(--color-success-main)]'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-[var(--color-error-light)]',
      borderColor: 'border-[var(--color-error-main)]',
      textColor: 'text-[var(--color-error-dark)]',
      iconColor: 'text-[var(--color-error-main)]'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-[var(--color-warning-light)]',
      borderColor: 'border-[var(--color-warning-main)]',
      textColor: 'text-[var(--color-warning-dark)]',
      iconColor: 'text-[var(--color-warning-main)]'
    },
    info: {
      icon: Info,
      bgColor: 'bg-[var(--color-info-light)]',
      borderColor: 'border-[var(--color-info-main)]',
      textColor: 'text-[var(--color-info-dark)]',
      iconColor: 'text-[var(--color-info-main)]'
    },
    loading: {
      icon: RefreshCw,
      bgColor: 'bg-[var(--color-bg-primary)]',
      borderColor: 'border-[var(--color-border-primary)]',
      textColor: 'text-[var(--color-text-primary)]',
      iconColor: 'text-[var(--color-primary-600)]'
    }
  };

  const config = variants[toast.variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "pointer-events-auto relative overflow-hidden rounded-lg border shadow-lg transition-all duration-300 ease-out",
        config.bgColor,
        config.borderColor,
        isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95",
        isStacked && index > 0 && "scale-95 -translate-y-2",
        "backdrop-blur-sm"
      )}
      style={{
        transform: isStacked && index > 0 
          ? `translateY(-${index * 8}px) scale(${1 - index * 0.05})` 
          : undefined,
        zIndex: 1000 - index
      }}
    >
      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && !toast.persistent && (
        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-30">
          <div 
            className="h-full bg-current transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <Icon className={cn(
              "w-5 h-5",
              config.iconColor,
              toast.variant === 'loading' && "animate-spin"
            )} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className={cn("text-sm font-medium", config.textColor)}>
                  {toast.title}
                </h4>
                
                {toast.description && (
                  <p className={cn("text-sm mt-1 opacity-90", config.textColor)}>
                    {toast.description}
                  </p>
                )}

                {/* Timestamp */}
                {toast.timestamp && (
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="w-3 h-3 opacity-60" />
                    <span className="text-xs opacity-60">
                      {toast.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Dismiss button */}
              {!toast.persistent && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                  onClick={handleDismiss}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Actions */}
            {(toast.actions?.length || toast.onUndo) && (
              <div className="flex items-center gap-2 mt-3">
                {toast.onUndo && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleUndo}
                  >
                    <Undo2 className="w-3 h-3 mr-1" />
                    Undo
                  </Button>
                )}

                {toast.actions?.map(action => (
                  <Button
                    key={action.id}
                    variant={action.variant || 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleAction(action)}
                    disabled={action.loading}
                  >
                    {action.loading && (
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    )}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Progress indicator for custom progress */}
            {typeof toast.progress === 'number' && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs opacity-70 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(toast.progress)}%</span>
                </div>
                <div className="w-full bg-black/10 rounded-full h-1.5">
                  <div 
                    className="bg-current h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${toast.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility functions for common toast types
export const toast = {
  success: (title: string, options?: Partial<Omit<Toast, 'id' | 'variant' | 'timestamp'>>) => {
    const { addToast } = useToast();
    return addToast({ title, variant: 'success', ...options });
  },

  error: (title: string, options?: Partial<Omit<Toast, 'id' | 'variant' | 'timestamp'>>) => {
    const { addToast } = useToast();
    return addToast({ title, variant: 'error', persistent: true, ...options });
  },

  warning: (title: string, options?: Partial<Omit<Toast, 'id' | 'variant' | 'timestamp'>>) => {
    const { addToast } = useToast();
    return addToast({ title, variant: 'warning', ...options });
  },

  info: (title: string, options?: Partial<Omit<Toast, 'id' | 'variant' | 'timestamp'>>) => {
    const { addToast } = useToast();
    return addToast({ title, variant: 'info', ...options });
  },

  loading: (title: string, options?: Partial<Omit<Toast, 'id' | 'variant' | 'timestamp'>>) => {
    const { addToast } = useToast();
    return addToast({ title, variant: 'loading', persistent: true, ...options });
  },

  promise: async <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    const { addToast, updateToast } = useToast();
    
    const toastId = addToast({
      title: loading,
      variant: 'loading',
      persistent: true
    });

    try {
      const data = await promise;
      updateToast(toastId, {
        title: typeof success === 'function' ? success(data) : success,
        variant: 'success',
        persistent: false,
        duration: 5000
      });
      return data;
    } catch (err) {
      updateToast(toastId, {
        title: typeof error === 'function' ? error(err) : error,
        variant: 'error',
        persistent: true
      });
      throw err;
    }
  }
};

// Toast queue management hook
export function useToastQueue() {
  const { toasts, clearAll, maxToasts, setMaxToasts } = useToast();

  const queueStats = {
    total: toasts.length,
    byVariant: toasts.reduce((acc, toast) => {
      acc[toast.variant] = (acc[toast.variant] || 0) + 1;
      return acc;
    }, {} as Record<ToastVariant, number>),
    persistent: toasts.filter(t => t.persistent).length,
    temporary: toasts.filter(t => !t.persistent).length
  };

  return {
    toasts,
    queueStats,
    clearAll,
    maxToasts,
    setMaxToasts
  };
}

// Toast settings component for debugging/admin
export function ToastSettings() {
  const { position, setPosition, maxToasts, setMaxToasts, clearAll } = useToast();
  const { queueStats } = useToastQueue();

  return (
    <div className="p-4 border border-[var(--color-border-primary)] rounded-lg bg-[var(--color-bg-primary)]">
      <h3 className="text-sm font-medium mb-3">Toast Settings</h3>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs text-[var(--color-text-secondary)]">Position</label>
          <select 
            value={position} 
            onChange={(e) => setPosition(e.target.value as ToastPosition)}
            className="w-full mt-1 text-xs border rounded px-2 py-1"
          >
            <option value="top-right">Top Right</option>
            <option value="top-left">Top Left</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="top-center">Top Center</option>
            <option value="bottom-center">Bottom Center</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-[var(--color-text-secondary)]">Max Toasts</label>
          <input 
            type="number" 
            value={maxToasts} 
            onChange={(e) => setMaxToasts(parseInt(e.target.value))}
            className="w-full mt-1 text-xs border rounded px-2 py-1"
            min="1"
            max="10"
          />
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--color-text-secondary)]">Queue Stats</span>
            <Badge variant="outline" className="text-xs">
              {queueStats.total} active
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(queueStats.byVariant).map(([variant, count]) => (
              <div key={variant} className="flex justify-between">
                <span className="capitalize">{variant}:</span>
                <span>{count}</span>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="w-full mt-2 text-xs h-7"
            disabled={queueStats.total === 0}
          >
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
}
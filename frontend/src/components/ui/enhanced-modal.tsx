"use client";

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  AlertTriangle,
  CheckCircle2,
  Info,
  HelpCircle,
  Loader2,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Settings,
  Eye,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// Modal types and interfaces
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'auto';
export type ModalVariant = 'default' | 'confirmation' | 'form' | 'fullscreen' | 'drawer' | 'alert';

export interface ModalAction {
  id: string;
  label: string;
  onClick: () => void | Promise<void>;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  shortcut?: string;
}

export interface Modal {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  variant: ModalVariant;
  size: ModalSize;
  closable?: boolean;
  persistent?: boolean;
  actions?: ModalAction[];
  onClose?: () => void;
  onOpen?: () => void;
  className?: string;
  overlayClassName?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  icon?: LucideIcon;
  badge?: {
    text: string;
    variant: 'default' | 'destructive' | 'outline' | 'secondary';
  };
  loading?: boolean;
  error?: string;
  metadata?: any;
}

// Modal context
interface ModalContextType {
  modals: Modal[];
  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  updateModal: (id: string, updates: Partial<Modal>) => void;
  closeAll: () => void;
  focusedModalId: string | null;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

// Modal provider component
interface ModalProviderProps {
  children: React.ReactNode;
  maxModals?: number;
}

export function ModalProvider({ children, maxModals = 5 }: ModalProviderProps) {
  const [modals, setModals] = useState<Modal[]>([]);
  const [focusedModalId, setFocusedModalId] = useState<string | null>(null);

  const openModal = (modal: Omit<Modal, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newModal: Modal = { ...modal, id };

    setModals(prev => {
      const updated = [...prev, newModal];
      return updated.slice(-maxModals); // Keep only the last maxModals
    });

    setFocusedModalId(id);
    
    if (newModal.onOpen) {
      newModal.onOpen();
    }

    return id;
  };

  const closeModal = (id: string) => {
    setModals(prev => {
      const modal = prev.find(m => m.id === id);
      if (modal?.onClose) {
        modal.onClose();
      }
      const updated = prev.filter(m => m.id !== id);
      
      // Focus the next modal if any
      if (updated.length > 0 && focusedModalId === id) {
        setFocusedModalId(updated[updated.length - 1].id);
      } else if (updated.length === 0) {
        setFocusedModalId(null);
      }
      
      return updated;
    });
  };

  const updateModal = (id: string, updates: Partial<Modal>) => {
    setModals(prev => prev.map(modal => 
      modal.id === id ? { ...modal, ...updates } : modal
    ));
  };

  const closeAll = () => {
    modals.forEach(modal => {
      if (modal.onClose) {
        modal.onClose();
      }
    });
    setModals([]);
    setFocusedModalId(null);
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusedModalId) {
        const modal = modals.find(m => m.id === focusedModalId);
        if (modal && modal.closable !== false) {
          closeModal(focusedModalId);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [focusedModalId, modals]);

  return (
    <ModalContext.Provider value={{
      modals,
      openModal,
      closeModal,
      updateModal,
      closeAll,
      focusedModalId
    }}>
      {children}
      <ModalContainer />
    </ModalContext.Provider>
  );
}

// Hook to use modal
export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

// Modal container component
function ModalContainer() {
  const { modals, focusedModalId } = useModal();

  if (modals.length === 0) return null;

  return (
    <>
      {modals.map((modal, index) => (
        <ModalItem
          key={modal.id}
          modal={modal}
          index={index}
          isFocused={modal.id === focusedModalId}
          totalModals={modals.length}
        />
      ))}
    </>
  );
}

// Individual modal item component
interface ModalItemProps {
  modal: Modal;
  index: number;
  isFocused: boolean;
  totalModals: number;
}

function ModalItem({ modal, index, isFocused, totalModals }: ModalItemProps) {
  const { closeModal, updateModal } = useModal();
  const [isVisible, setIsVisible] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Animation on mount
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Focus management
  useEffect(() => {
    if (isFocused && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0] as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [isFocused]);

  // Cleanup focus on unmount
  useEffect(() => {
    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  const handleClose = () => {
    if (modal.closable === false) return;
    
    setIsVisible(false);
    setTimeout(() => closeModal(modal.id), 200);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !modal.persistent) {
      handleClose();
    }
  };

  const handleAction = async (action: ModalAction) => {
    updateModal(modal.id, {
      actions: modal.actions?.map(a => 
        a.id === action.id ? { ...a, loading: true } : a
      )
    });

    try {
      await action.onClick();
    } finally {
      updateModal(modal.id, {
        actions: modal.actions?.map(a => 
          a.id === action.id ? { ...a, loading: false } : a
        )
      });
    }
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // Size configurations
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
    auto: 'max-w-fit'
  };

  // Variant configurations
  const variantConfigs = {
    default: {
      containerClass: '',
      headerClass: '',
      contentClass: ''
    },
    confirmation: {
      containerClass: 'max-w-md',
      headerClass: 'text-center',
      contentClass: 'text-center'
    },
    form: {
      containerClass: 'max-w-2xl',
      headerClass: '',
      contentClass: 'p-0'
    },
    fullscreen: {
      containerClass: 'max-w-full max-h-full m-0 rounded-none',
      headerClass: '',
      contentClass: 'max-h-[calc(100vh-8rem)] overflow-auto'
    },
    drawer: {
      containerClass: 'max-w-md ml-auto mr-0 h-full rounded-l-lg rounded-r-none',
      headerClass: '',
      contentClass: 'max-h-[calc(100vh-8rem)] overflow-auto'
    },
    alert: {
      containerClass: 'max-w-sm',
      headerClass: 'text-center pb-2',
      contentClass: 'text-center py-4'
    }
  };

  const config = variantConfigs[modal.variant];
  const Icon = modal.icon;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
        modal.variant === 'drawer' && "justify-end p-0",
        modal.variant === 'fullscreen' && "p-0",
        isVisible ? "opacity-100" : "opacity-0",
        modal.overlayClassName
      )}
      style={{ zIndex: 1000 + index }}
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          "relative bg-[var(--color-bg-primary)] rounded-lg shadow-2xl border border-[var(--color-border-primary)] transition-all duration-300 max-h-[90vh] flex flex-col",
          sizeClasses[modal.size],
          config.containerClass,
          isMaximized && "max-w-full max-h-full m-0 rounded-none",
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4",
          !isFocused && totalModals > 1 && "scale-95 opacity-75",
          modal.className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {modal.showHeader !== false && (
          <div className={cn(
            "flex items-center justify-between p-6 border-b border-[var(--color-border-primary)]",
            config.headerClass
          )}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {Icon && (
                <div className="flex-shrink-0">
                  <Icon className="w-5 h-5 text-[var(--color-primary-600)]" />
                </div>
              )}
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)] truncate">
                    {modal.title}
                  </h2>
                  
                  {modal.badge && (
                    <Badge variant={modal.badge.variant} className="text-xs">
                      {modal.badge.text}
                    </Badge>
                  )}
                  
                  {modal.loading && (
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary-600)]" />
                  )}
                </div>
                
                {modal.description && (
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    {modal.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Stack indicator */}
              {totalModals > 1 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {index + 1}/{totalModals}
                </Badge>
              )}

              {/* Maximize button */}
              {modal.variant !== 'fullscreen' && modal.variant !== 'drawer' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={toggleMaximize}
                >
                  {isMaximized ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
              )}

              {/* Close button */}
              {modal.closable !== false && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className={cn(
          "flex-1 overflow-auto",
          modal.showHeader !== false ? "p-6" : "p-6",
          config.contentClass
        )}>
          {modal.error ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-[var(--color-error-main)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--color-error-main)] mb-2">
                Error
              </h3>
              <p className="text-[var(--color-text-secondary)]">{modal.error}</p>
            </div>
          ) : modal.loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-[var(--color-primary-600)] mx-auto mb-4 animate-spin" />
              <p className="text-[var(--color-text-secondary)]">Loading...</p>
            </div>
          ) : (
            modal.content
          )}
        </div>

        {/* Footer */}
        {modal.showFooter !== false && modal.actions && modal.actions.length > 0 && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
            {modal.actions.map(action => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant={action.variant || 'default'}
                  onClick={() => handleAction(action)}
                  disabled={action.disabled || action.loading}
                  className="flex items-center gap-2"
                >
                  {action.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    ActionIcon && <ActionIcon className="w-4 h-4" />
                  )}
                  {action.label}
                  {action.shortcut && (
                    <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-[var(--color-bg-tertiary)] rounded">
                      {action.shortcut}
                    </kbd>
                  )}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Utility functions for common modal types
export const modal = {
  confirm: (options: {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'destructive' | 'default';
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }) => {
    const { openModal } = useModal();
    
    return openModal({
      title: options.title,
      description: options.description,
      variant: 'confirmation',
      size: 'sm',
      icon: options.variant === 'destructive' ? AlertTriangle : HelpCircle,
      content: (
        <div className="py-4">
          <p className="text-[var(--color-text-secondary)]">
            {options.description || 'Are you sure you want to continue?'}
          </p>
        </div>
      ),
      actions: [
        {
          id: 'cancel',
          label: options.cancelLabel || 'Cancel',
          variant: 'outline',
          onClick: () => {
            if (options.onCancel) options.onCancel();
          }
        },
        {
          id: 'confirm',
          label: options.confirmLabel || 'Confirm',
          variant: options.variant || 'default',
          onClick: options.onConfirm
        }
      ]
    });
  },

  alert: (options: {
    title: string;
    description?: string;
    variant?: 'info' | 'success' | 'warning' | 'error';
    onClose?: () => void;
  }) => {
    const { openModal } = useModal();
    
    const icons = {
      info: Info,
      success: CheckCircle2,
      warning: AlertTriangle,
      error: X
    };

    return openModal({
      title: options.title,
      description: options.description,
      variant: 'alert',
      size: 'sm',
      icon: icons[options.variant || 'info'],
      content: (
        <div className="py-2">
          {options.description && (
            <p className="text-[var(--color-text-secondary)]">
              {options.description}
            </p>
          )}
        </div>
      ),
      actions: [
        {
          id: 'ok',
          label: 'OK',
          variant: 'default',
          onClick: () => {
            if (options.onClose) options.onClose();
          }
        }
      ]
    });
  },

  form: (options: {
    title: string;
    description?: string;
    content: React.ReactNode;
    size?: ModalSize;
    onSubmit?: () => void | Promise<void>;
    onCancel?: () => void;
    submitLabel?: string;
    cancelLabel?: string;
  }) => {
    const { openModal } = useModal();
    
    return openModal({
      title: options.title,
      description: options.description,
      variant: 'form',
      size: options.size || 'lg',
      content: options.content,
      actions: [
        ...(options.onCancel ? [{
          id: 'cancel',
          label: options.cancelLabel || 'Cancel',
          variant: 'outline' as const,
          onClick: options.onCancel
        }] : []),
        ...(options.onSubmit ? [{
          id: 'submit',
          label: options.submitLabel || 'Submit',
          variant: 'default' as const,
          onClick: options.onSubmit
        }] : [])
      ]
    });
  }
};

// Modal stack management hook
export function useModalStack() {
  const { modals, closeAll, focusedModalId } = useModal();

  const stackStats = {
    total: modals.length,
    focused: focusedModalId,
    byVariant: modals.reduce((acc, modal) => {
      acc[modal.variant] = (acc[modal.variant] || 0) + 1;
      return acc;
    }, {} as Record<ModalVariant, number>)
  };

  return {
    modals,
    stackStats,
    closeAll,
    focusedModalId
  };
}
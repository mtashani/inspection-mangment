"use client";

import React, { useEffect, useRef, useState, createContext, useContext, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Command, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Enter,
  Escape,
  Tab,
  Shift,
  Ctrl,
  Alt,
  Space,
  Home,
  End,
  PageUp,
  PageDown,
  Keyboard,
  Eye,
  Settings,
  HelpCircle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Keyboard shortcut types
export interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  action: () => void;
  category?: string;
  global?: boolean;
  disabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export interface FocusableElement {
  id: string;
  element: HTMLElement;
  priority?: number;
  group?: string;
  disabled?: boolean;
}

// Keyboard navigation context
interface KeyboardNavigationContextType {
  shortcuts: KeyboardShortcut[];
  registerShortcut: (shortcut: KeyboardShortcut) => () => void;
  unregisterShortcut: (id: string) => void;
  focusableElements: FocusableElement[];
  registerFocusable: (element: FocusableElement) => () => void;
  unregisterFocusable: (id: string) => void;
  currentFocus: string | null;
  setCurrentFocus: (id: string | null) => void;
  isNavigationVisible: boolean;
  setNavigationVisible: (visible: boolean) => void;
  trapFocus: (containerId: string) => void;
  releaseFocusTrap: () => void;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextType | undefined>(undefined);

// Keyboard navigation provider
interface KeyboardNavigationProviderProps {
  children: React.ReactNode;
  showHelp?: boolean;
  enableGlobalShortcuts?: boolean;
}

export function KeyboardNavigationProvider({ 
  children, 
  showHelp = true,
  enableGlobalShortcuts = true 
}: KeyboardNavigationProviderProps) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [focusableElements, setFocusableElements] = useState<FocusableElement[]>([]);
  const [currentFocus, setCurrentFocus] = useState<string | null>(null);
  const [isNavigationVisible, setNavigationVisible] = useState(false);
  const [focusTrapContainer, setFocusTrapContainer] = useState<string | null>(null);
  const pressedKeys = useRef<Set<string>>(new Set());

  // Register keyboard shortcut
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => [...prev.filter(s => s.id !== shortcut.id), shortcut]);
    
    return () => {
      setShortcuts(prev => prev.filter(s => s.id !== shortcut.id));
    };
  }, []);

  // Unregister keyboard shortcut
  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
  }, []);

  // Register focusable element
  const registerFocusable = useCallback((element: FocusableElement) => {
    setFocusableElements(prev => [...prev.filter(e => e.id !== element.id), element]);
    
    return () => {
      setFocusableElements(prev => prev.filter(e => e.id !== element.id));
    };
  }, []);

  // Unregister focusable element
  const unregisterFocusable = useCallback((id: string) => {
    setFocusableElements(prev => prev.filter(e => e.id !== id));
  }, []);

  // Focus trap functionality
  const trapFocus = useCallback((containerId: string) => {
    setFocusTrapContainer(containerId);
  }, []);

  const releaseFocusTrap = useCallback(() => {
    setFocusTrapContainer(null);
  }, []);

  // Key combination checker
  const isKeyCombinationPressed = (keys: string[], pressedKeys: Set<string>) => {
    return keys.every(key => pressedKeys.has(key.toLowerCase()));
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      pressedKeys.current.add(key);

      // Add modifier keys
      if (e.ctrlKey) pressedKeys.current.add('ctrl');
      if (e.shiftKey) pressedKeys.current.add('shift');
      if (e.altKey) pressedKeys.current.add('alt');
      if (e.metaKey) pressedKeys.current.add('meta');

      // Check for shortcut matches
      const matchedShortcut = shortcuts.find(shortcut => 
        !shortcut.disabled && 
        (shortcut.global || enableGlobalShortcuts) &&
        isKeyCombinationPressed(shortcut.keys, pressedKeys.current)
      );

      if (matchedShortcut) {
        if (matchedShortcut.preventDefault) {
          e.preventDefault();
        }
        if (matchedShortcut.stopPropagation) {
          e.stopPropagation();
        }
        matchedShortcut.action();
      }

      // Handle navigation visibility toggle (Ctrl+?)
      if (e.ctrlKey && e.key === '?' && showHelp) {
        e.preventDefault();
        setNavigationVisible(prev => !prev);
      }

      // Handle focus navigation
      handleFocusNavigation(e);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      pressedKeys.current.delete(key);

      // Remove modifier keys
      if (!e.ctrlKey) pressedKeys.current.delete('ctrl');
      if (!e.shiftKey) pressedKeys.current.delete('shift');
      if (!e.altKey) pressedKeys.current.delete('alt');
      if (!e.metaKey) pressedKeys.current.delete('meta');
    };

    const handleFocusNavigation = (e: KeyboardEvent) => {
      if (!focusableElements.length) return;

      const availableElements = focusableElements
        .filter(el => !el.disabled && el.element.offsetParent !== null)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));

      if (!availableElements.length) return;

      const currentIndex = currentFocus 
        ? availableElements.findIndex(el => el.id === currentFocus)
        : -1;

      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowDown':
        case 'Tab':
          if (!e.shiftKey) {
            e.preventDefault();
            nextIndex = (currentIndex + 1) % availableElements.length;
          }
          break;
        case 'ArrowUp':
          if (e.shiftKey && e.key === 'Tab') {
            e.preventDefault();
            nextIndex = currentIndex <= 0 ? availableElements.length - 1 : currentIndex - 1;
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            nextIndex = currentIndex <= 0 ? availableElements.length - 1 : currentIndex - 1;
          }
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = availableElements.length - 1;
          break;
      }

      if (nextIndex !== currentIndex && nextIndex >= 0) {
        const nextElement = availableElements[nextIndex];
        nextElement.element.focus();
        setCurrentFocus(nextElement.id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [shortcuts, focusableElements, currentFocus, enableGlobalShortcuts, showHelp]);

  // Default shortcuts
  useEffect(() => {
    if (enableGlobalShortcuts) {
      const defaultShortcuts: KeyboardShortcut[] = [
        {
          id: 'help',
          keys: ['ctrl', '?'],
          description: 'Show keyboard shortcuts',
          action: () => setNavigationVisible(prev => !prev),
          category: 'Navigation',
          global: true
        },
        {
          id: 'escape',
          keys: ['escape'],
          description: 'Close modals/dialogs',
          action: () => {
            // This would be handled by modal components
          },
          category: 'Navigation',
          global: true
        }
      ];

      defaultShortcuts.forEach(shortcut => {
        registerShortcut(shortcut);
      });

      return () => {
        defaultShortcuts.forEach(shortcut => {
          unregisterShortcut(shortcut.id);
        });
      };
    }
  }, [enableGlobalShortcuts, registerShortcut, unregisterShortcut]);

  return (
    <KeyboardNavigationContext.Provider value={{
      shortcuts,
      registerShortcut,
      unregisterShortcut,
      focusableElements,
      registerFocusable,
      unregisterFocusable,
      currentFocus,
      setCurrentFocus,
      isNavigationVisible,
      setNavigationVisible,
      trapFocus,
      releaseFocusTrap
    }}>
      {children}
      {isNavigationVisible && <KeyboardShortcutsHelp />}
    </KeyboardNavigationContext.Provider>
  );
}

// Hook to use keyboard navigation
export function useKeyboardNavigation() {
  const context = useContext(KeyboardNavigationContext);
  if (!context) {
    throw new Error('useKeyboardNavigation must be used within a KeyboardNavigationProvider');
  }
  return context;
}

// Hook for keyboard shortcuts
export function useKeyboardShortcut(shortcut: Omit<KeyboardShortcut, 'id'> & { id?: string }) {
  const { registerShortcut } = useKeyboardNavigation();
  const id = shortcut.id || Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    const unregister = registerShortcut({ ...shortcut, id });
    return unregister;
  }, [shortcut.keys.join(','), shortcut.disabled, registerShortcut]);
}

// Hook for focusable elements
export function useFocusable(options: Omit<FocusableElement, 'element'>) {
  const { registerFocusable } = useKeyboardNavigation();
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      const unregister = registerFocusable({
        ...options,
        element: elementRef.current
      });
      return unregister;
    }
  }, [options.id, options.priority, options.group, options.disabled, registerFocusable]);

  return elementRef;
}

// Focus trap hook
export function useFocusTrap(containerId: string, active: boolean = true) {
  const { trapFocus, releaseFocusTrap } = useKeyboardNavigation();

  useEffect(() => {
    if (active) {
      trapFocus(containerId);
      return () => releaseFocusTrap();
    }
  }, [active, containerId, trapFocus, releaseFocusTrap]);
}

// Roving tabindex hook
export function useRovingTabindex(items: string[], activeItem: string, onActiveChange: (item: string) => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = items.indexOf(activeItem);
      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = (currentIndex + 1) % items.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = items.length - 1;
          break;
      }

      if (nextIndex !== currentIndex) {
        onActiveChange(items[nextIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, activeItem, onActiveChange]);
}

// Keyboard shortcuts help component
function KeyboardShortcutsHelp() {
  const { shortcuts, setNavigationVisible } = useKeyboardNavigation();

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const formatKeys = (keys: string[]) => {
    return keys.map(key => {
      const keyMap: Record<string, string> = {
        'ctrl': 'Ctrl',
        'shift': 'Shift',
        'alt': 'Alt',
        'meta': 'Cmd',
        'arrowup': '↑',
        'arrowdown': '↓',
        'arrowleft': '←',
        'arrowright': '→',
        'enter': 'Enter',
        'escape': 'Esc',
        'space': 'Space',
        'tab': 'Tab'
      };
      return keyMap[key.toLowerCase()] || key.toUpperCase();
    }).join(' + ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-[var(--color-primary-600)]" />
              Keyboard Shortcuts
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNavigationVisible(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[var(--color-primary-600)]" />
                  {category}
                </h3>
                
                <div className="space-y-2">
                  {categoryShortcuts.map(shortcut => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                    >
                      <span className="text-sm text-[var(--color-text-primary)]">
                        {shortcut.description}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        {formatKeys(shortcut.keys).split(' + ').map((key, index, array) => (
                          <React.Fragment key={index}>
                            <kbd className="px-2 py-1 text-xs bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded shadow-sm font-mono">
                              {key}
                            </kbd>
                            {index < array.length - 1 && (
                              <span className="text-xs text-[var(--color-text-secondary)]">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {Object.keys(groupedShortcuts).length === 0 && (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No keyboard shortcuts available</p>
            </div>
          )}
        </CardContent>

        <div className="px-6 py-4 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
            <span>Press Ctrl + ? to toggle this help</span>
            <Badge variant="outline" className="text-xs">
              {Object.values(groupedShortcuts).flat().length} shortcuts
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Skip links component for accessibility
interface SkipLinksProps {
  links: Array<{
    href: string;
    label: string;
  }>;
}

export function SkipLinks({ links }: SkipLinksProps) {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className="bg-[var(--color-primary-600)] text-white px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] focus:ring-offset-2"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

// Landmark navigation component
export function LandmarkNavigation() {
  const [isVisible, setIsVisible] = useState(false);

  useKeyboardShortcut({
    keys: ['ctrl', 'shift', 'l'],
    description: 'Show landmark navigation',
    action: () => setIsVisible(prev => !prev),
    category: 'Navigation'
  });

  const landmarks = [
    { id: 'main', label: 'Main Content' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'search', label: 'Search' },
    { id: 'footer', label: 'Footer' }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-lg p-4 min-w-[200px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Landmarks</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-1">
        {landmarks.map((landmark, index) => (
          <button
            key={landmark.id}
            className="w-full text-left px-2 py-1 text-sm rounded hover:bg-[var(--color-bg-secondary)] focus:bg-[var(--color-bg-secondary)] focus:outline-none"
            onClick={() => {
              const element = document.getElementById(landmark.id);
              if (element) {
                element.focus();
                element.scrollIntoView({ behavior: 'smooth' });
              }
              setIsVisible(false);
            }}
          >
            <span className="text-xs text-[var(--color-text-secondary)] mr-2">
              {index + 1}
            </span>
            {landmark.label}
          </button>
        ))}
      </div>
    </div>
  );
}
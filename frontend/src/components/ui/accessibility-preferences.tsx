"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Zap, 
  ZapOff, 
  Type, 
  Palette, 
  Monitor,
  Sun,
  Moon,
  Contrast,
  MousePointer,
  Keyboard,
  Settings,
  RotateCcw,
  Save,
  CheckCircle
} from 'lucide-react';

// Accessibility Preferences Types
export interface AccessibilityPreferences {
  // Visual preferences
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  fontSize: number; // 12-24px
  lineHeight: number; // 1.2-2.0
  letterSpacing: number; // 0-0.2em
  
  // Color and theme preferences
  colorScheme: 'light' | 'dark' | 'auto';
  customColors: {
    background: string;
    text: string;
    primary: string;
    error: string;
  };
  
  // Focus and navigation preferences
  focusIndicator: 'default' | 'enhanced' | 'high-contrast';
  keyboardNavigation: boolean;
  skipLinks: boolean;
  
  // Audio preferences
  soundEffects: boolean;
  screenReaderOptimized: boolean;
  
  // Animation preferences
  animationSpeed: 'slow' | 'normal' | 'fast' | 'none';
  parallaxEffects: boolean;
  autoplayMedia: boolean;
  
  // Interaction preferences
  clickDelay: number; // 0-1000ms
  hoverDelay: number; // 0-2000ms
  doubleClickSpeed: number; // 200-800ms
  
  // Content preferences
  simplifiedUI: boolean;
  showDescriptions: boolean;
  verboseLabels: boolean;
}

const defaultPreferences: AccessibilityPreferences = {
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  fontSize: 16,
  lineHeight: 1.5,
  letterSpacing: 0,
  colorScheme: 'auto',
  customColors: {
    background: '#ffffff',
    text: '#000000',
    primary: '#3b82f6',
    error: '#ef4444'
  },
  focusIndicator: 'default',
  keyboardNavigation: true,
  skipLinks: true,
  soundEffects: false,
  screenReaderOptimized: false,
  animationSpeed: 'normal',
  parallaxEffects: true,
  autoplayMedia: false,
  clickDelay: 0,
  hoverDelay: 500,
  doubleClickSpeed: 400,
  simplifiedUI: false,
  showDescriptions: true,
  verboseLabels: false
};

// Accessibility Context
interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void;
  resetPreferences: () => void;
  applyPreferences: () => void;
  isLoading: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

// Accessibility Provider
interface AccessibilityProviderProps {
  children: React.ReactNode;
  storageKey?: string;
}

export function AccessibilityProvider({ 
  children, 
  storageKey = 'accessibility-preferences' 
}: AccessibilityProviderProps) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load accessibility preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  // Save preferences to localStorage
  const savePreferences = (newPreferences: AccessibilityPreferences) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Failed to save accessibility preferences:', error);
    }
  };

  const updatePreference = <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
    applyPreferencesToDOM(newPreferences);
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    savePreferences(defaultPreferences);
    applyPreferencesToDOM(defaultPreferences);
  };

  const applyPreferences = () => {
    applyPreferencesToDOM(preferences);
  };

  // Apply preferences to DOM
  const applyPreferencesToDOM = (prefs: AccessibilityPreferences) => {
    const root = document.documentElement;
    
    // Font size and typography
    root.style.setProperty('--font-size-base', `${prefs.fontSize}px`);
    root.style.setProperty('--line-height-base', prefs.lineHeight.toString());
    root.style.setProperty('--letter-spacing-base', `${prefs.letterSpacing}em`);
    
    // High contrast mode
    if (prefs.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (prefs.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Large text
    if (prefs.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    // Color scheme
    root.setAttribute('data-color-scheme', prefs.colorScheme);
    
    // Custom colors
    root.style.setProperty('--color-bg-custom', prefs.customColors.background);
    root.style.setProperty('--color-text-custom', prefs.customColors.text);
    root.style.setProperty('--color-primary-custom', prefs.customColors.primary);
    root.style.setProperty('--color-error-custom', prefs.customColors.error);
    
    // Focus indicator
    root.setAttribute('data-focus-indicator', prefs.focusIndicator);
    
    // Animation speed
    const animationMultiplier = {
      slow: 2,
      normal: 1,
      fast: 0.5,
      none: 0
    }[prefs.animationSpeed];
    
    root.style.setProperty('--animation-speed-multiplier', animationMultiplier.toString());
    
    // Interaction delays
    root.style.setProperty('--click-delay', `${prefs.clickDelay}ms`);
    root.style.setProperty('--hover-delay', `${prefs.hoverDelay}ms`);
    
    // Simplified UI
    if (prefs.simplifiedUI) {
      root.classList.add('simplified-ui');
    } else {
      root.classList.remove('simplified-ui');
    }
  };

  // Apply preferences on mount
  useEffect(() => {
    if (!isLoading) {
      applyPreferences();
    }
  }, [isLoading, preferences]);

  return (
    <AccessibilityContext.Provider
      value={{
        preferences,
        updatePreference,
        resetPreferences,
        applyPreferences,
        isLoading
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

// Hook to use accessibility preferences
export function useAccessibilityPreferences() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    // Return default values instead of throwing error for Storybook compatibility
    return {
      preferences: defaultPreferences,
      updatePreference: () => {},
      resetPreferences: () => {},
      applyPreferences: () => {},
      isLoading: false
    };
  }
  return context;
}

// Accessibility Settings Panel
interface AccessibilitySettingsProps {
  className?: string;
  showAdvanced?: boolean;
}

export function AccessibilitySettings({ 
  className, 
  showAdvanced = false 
}: AccessibilitySettingsProps) {
  const { preferences, updatePreference, resetPreferences } = useAccessibilityPreferences();
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(showAdvanced);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(JSON.stringify(preferences) !== JSON.stringify(defaultPreferences));
  }, [preferences]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Visual Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Visual Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">High Contrast Mode</Label>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Increases contrast for better visibility
              </p>
            </div>
            <Switch
              checked={preferences.highContrast}
              onCheckedChange={(checked) => updatePreference('highContrast', checked)}
            />
          </div>

          {/* Large Text */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Large Text</Label>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Increases text size throughout the interface
              </p>
            </div>
            <Switch
              checked={preferences.largeText}
              onCheckedChange={(checked) => updatePreference('largeText', checked)}
            />
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Font Size: {preferences.fontSize}px
            </Label>
            <Slider
              value={[preferences.fontSize]}
              onValueChange={([value]) => updatePreference('fontSize', value)}
              min={12}
              max={24}
              step={1}
              className="w-full"
            />
          </div>

          {/* Line Height */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Line Height: {preferences.lineHeight}
            </Label>
            <Slider
              value={[preferences.lineHeight]}
              onValueChange={([value]) => updatePreference('lineHeight', value)}
              min={1.2}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Color Scheme */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Color Scheme</Label>
            <Select
              value={preferences.colorScheme}
              onValueChange={(value: 'light' | 'dark' | 'auto') => 
                updatePreference('colorScheme', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="auto">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Auto
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Motion and Animation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Motion and Animation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Reduce Motion</Label>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Minimizes animations and transitions
              </p>
            </div>
            <Switch
              checked={preferences.reducedMotion}
              onCheckedChange={(checked) => updatePreference('reducedMotion', checked)}
            />
          </div>

          {/* Animation Speed */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Animation Speed</Label>
            <Select
              value={preferences.animationSpeed}
              onValueChange={(value: 'slow' | 'normal' | 'fast' | 'none') => 
                updatePreference('animationSpeed', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="fast">Fast</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Autoplay Media */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Autoplay Media</Label>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Automatically play videos and animations
              </p>
            </div>
            <Switch
              checked={preferences.autoplayMedia}
              onCheckedChange={(checked) => updatePreference('autoplayMedia', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Navigation and Interaction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Navigation and Interaction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Keyboard Navigation */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Enhanced Keyboard Navigation</Label>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Improved keyboard shortcuts and focus indicators
              </p>
            </div>
            <Switch
              checked={preferences.keyboardNavigation}
              onCheckedChange={(checked) => updatePreference('keyboardNavigation', checked)}
            />
          </div>

          {/* Skip Links */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Skip Links</Label>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Show links to skip to main content
              </p>
            </div>
            <Switch
              checked={preferences.skipLinks}
              onCheckedChange={(checked) => updatePreference('skipLinks', checked)}
            />
          </div>

          {/* Focus Indicator */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Focus Indicator Style</Label>
            <Select
              value={preferences.focusIndicator}
              onValueChange={(value: 'default' | 'enhanced' | 'high-contrast') => 
                updatePreference('focusIndicator', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="enhanced">Enhanced</SelectItem>
                <SelectItem value="high-contrast">High Contrast</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audio and Screen Reader */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Audio and Screen Reader
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sound Effects */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Sound Effects</Label>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Play sounds for interactions and notifications
              </p>
            </div>
            <Switch
              checked={preferences.soundEffects}
              onCheckedChange={(checked) => updatePreference('soundEffects', checked)}
            />
          </div>

          {/* Screen Reader Optimized */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Screen Reader Optimized</Label>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Enhanced compatibility with screen readers
              </p>
            </div>
            <Switch
              checked={preferences.screenReaderOptimized}
              onCheckedChange={(checked) => updatePreference('screenReaderOptimized', checked)}
            />
          </div>

          {/* Verbose Labels */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Verbose Labels</Label>
              <p className="text-xs text-[var(--color-text-secondary)]">
                More detailed descriptions for screen readers
              </p>
            </div>
            <Switch
              checked={preferences.verboseLabels}
              onCheckedChange={(checked) => updatePreference('verboseLabels', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      {showAdvancedSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Advanced Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Click Delay */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Click Delay: {preferences.clickDelay}ms
              </Label>
              <Slider
                value={[preferences.clickDelay]}
                onValueChange={([value]) => updatePreference('clickDelay', value)}
                min={0}
                max={1000}
                step={50}
                className="w-full"
              />
            </div>

            {/* Hover Delay */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Hover Delay: {preferences.hoverDelay}ms
              </Label>
              <Slider
                value={[preferences.hoverDelay]}
                onValueChange={([value]) => updatePreference('hoverDelay', value)}
                min={0}
                max={2000}
                step={100}
                className="w-full"
              />
            </div>

            {/* Simplified UI */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Simplified Interface</Label>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Reduces visual complexity and distractions
                </p>
              </div>
              <Switch
                checked={preferences.simplifiedUI}
                onCheckedChange={(checked) => updatePreference('simplifiedUI', checked)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          {showAdvancedSettings ? 'Hide' : 'Show'} Advanced
        </Button>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Changes Applied
            </Badge>
          )}
          
          <Button
            variant="outline"
            onClick={resetPreferences}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}

// Quick Accessibility Toggle
interface QuickAccessibilityToggleProps {
  className?: string;
}

export function QuickAccessibilityToggle({ className }: QuickAccessibilityToggleProps) {
  const { preferences, updatePreference } = useAccessibilityPreferences();
  const [isOpen, setIsOpen] = useState(false);

  const toggles = [
    {
      key: 'highContrast' as const,
      label: 'High Contrast',
      icon: Contrast,
      value: preferences.highContrast
    },
    {
      key: 'reducedMotion' as const,
      label: 'Reduce Motion',
      icon: ZapOff,
      value: preferences.reducedMotion
    },
    {
      key: 'largeText' as const,
      label: 'Large Text',
      icon: Type,
      value: preferences.largeText
    },
    {
      key: 'soundEffects' as const,
      label: 'Sound Effects',
      icon: preferences.soundEffects ? Volume2 : VolumeX,
      value: preferences.soundEffects
    }
  ];

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Eye className="w-4 h-4" />
        Accessibility
      </Button>

      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 w-64 z-50 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quick Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {toggles.map(toggle => {
              const Icon = toggle.icon;
              return (
                <div key={toggle.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <Label className="text-sm">{toggle.label}</Label>
                  </div>
                  <Switch
                    checked={toggle.value}
                    onCheckedChange={(checked) => updatePreference(toggle.key, checked)}
                  />
                </div>
              );
            })}
            
            <Separator />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="w-full"
            >
              More Settings
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default {
  AccessibilityProvider,
  useAccessibilityPreferences,
  AccessibilitySettings,
  QuickAccessibilityToggle
};
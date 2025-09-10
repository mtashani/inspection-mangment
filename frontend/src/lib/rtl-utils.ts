/**
 * RTL Utility Functions
 * 
 * This file contains utility functions for supporting RTL (Right-to-Left) layouts
 * which is necessary for languages like Persian, Arabic, Hebrew, etc.
 */

import { ThemeConfig } from '@/config/design-system';

// Direction-aware margin utilities
export const getMarginStart = (value: string, direction: 'ltr' | 'rtl' = 'ltr') => {
  return direction === 'rtl' ? { marginRight: value } : { marginLeft: value };
};

export const getMarginEnd = (value: string, direction: 'ltr' | 'rtl' = 'ltr') => {
  return direction === 'rtl' ? { marginLeft: value } : { marginRight: value };
};

// Direction-aware padding utilities
export const getPaddingStart = (value: string, direction: 'ltr' | 'rtl' = 'ltr') => {
  return direction === 'rtl' ? { paddingRight: value } : { paddingLeft: value };
};

export const getPaddingEnd = (value: string, direction: 'ltr' | 'rtl' = 'ltr') => {
  return direction === 'rtl' ? { paddingLeft: value } : { paddingRight: value };
};

// Direction-aware border utilities
export const getBorderStart = (value: string, direction: 'ltr' | 'rtl' = 'ltr') => {
  return direction === 'rtl' ? { borderRight: value } : { borderLeft: value };
};

export const getBorderEnd = (value: string, direction: 'ltr' | 'rtl' = 'ltr') => {
  return direction === 'rtl' ? { borderLeft: value } : { borderRight: value };
};

// Direction-aware positioning utilities
export const getStart = (value: string, direction: 'ltr' | 'rtl' = 'ltr') => {
  return direction === 'rtl' ? { right: value } : { left: value };
};

export const getEnd = (value: string, direction: 'ltr' | 'rtl' = 'ltr') => {
  return direction === 'rtl' ? { left: value } : { right: value };
};

// Direction-aware flex utilities
export const getFlexDirection = (direction: 'ltr' | 'rtl' = 'ltr') => {
  return direction === 'rtl' ? 'row-reverse' : 'row';
};

// Direction-aware text alignment
export const getTextAlign = (direction: 'ltr' | 'rtl' = 'ltr') => {
  return direction === 'rtl' ? 'right' : 'left';
};

// Direction-aware transform utilities
export const getRotateDirection = (degrees: number, direction: 'ltr' | 'rtl' = 'ltr') => {
  return direction === 'rtl' ? -degrees : degrees;
};

// Direction-aware CSS classes
export const getRtlClass = (ltrClass: string, rtlClass: string, direction: 'ltr' | 'rtl' = 'ltr') => {
  return direction === 'rtl' ? rtlClass : ltrClass;
};

// Helper to get direction from theme config
export const getDirectionFromTheme = (theme?: ThemeConfig): 'ltr' | 'rtl' => {
  return theme?.direction || 'ltr';
};

// CSS logical properties helper (for modern browsers)
export const getLogicalMargin = (
  top: string, 
  end: string, 
  bottom: string, 
  start: string
) => {
  return {
    marginBlock: `${top} ${bottom}`,
    marginInline: `${start} ${end}`,
  };
};

export const getLogicalPadding = (
  top: string, 
  end: string, 
  bottom: string, 
  start: string
) => {
  return {
    paddingBlock: `${top} ${bottom}`,
    paddingInline: `${start} ${end}`,
  };
};

// RTL-aware icon rotation
export const getIconRotation = (icon: React.ReactNode, direction: 'ltr' | 'rtl' = 'ltr') => {
  if (direction === 'rtl') {
    return {
      transform: 'scaleX(-1)',
    };
  }
  return {};
};

// RTL-aware scroll direction
export const getScrollDirection = (direction: 'ltr' | 'rtl' = 'ltr') => {
  return direction === 'rtl' ? 'rtl' : 'ltr';
};

// Helper to apply RTL styles conditionally
export const applyRtlStyles = (styles: Record<string, any>, direction: 'ltr' | 'rtl' = 'ltr') => {
  if (direction === 'rtl') {
    return {
      ...styles,
      direction: 'rtl',
    };
  }
  return styles;
};
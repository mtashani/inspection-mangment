'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface KeyboardNavigationProps {
  children: React.ReactNode
  onEscape?: () => void
  onEnter?: () => void
  trapFocus?: boolean
  autoFocus?: boolean
  className?: string
}

export function KeyboardNavigation({
  children,
  onEscape,
  onEnter,
  trapFocus = false,
  autoFocus = false,
  className
}: KeyboardNavigationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([])
  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1)

  // Get all focusable elements
  useEffect(() => {
    if (!containerRef.current) return

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    const elements = Array.from(
      containerRef.current.querySelectorAll(focusableSelectors)
    ) as HTMLElement[]

    setFocusableElements(elements)

    // Auto focus first element
    if (autoFocus && elements.length > 0) {
      elements[0].focus()
      setCurrentFocusIndex(0)
    }
  }, [autoFocus])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault()
            onEscape()
          }
          break

        case 'Enter':
          if (onEnter && event.target === containerRef.current) {
            event.preventDefault()
            onEnter()
          }
          break

        case 'Tab':
          if (trapFocus && focusableElements.length > 0) {
            event.preventDefault()
            const nextIndex = event.shiftKey
              ? currentFocusIndex <= 0 ? focusableElements.length - 1 : currentFocusIndex - 1
              : currentFocusIndex >= focusableElements.length - 1 ? 0 : currentFocusIndex + 1

            focusableElements[nextIndex]?.focus()
            setCurrentFocusIndex(nextIndex)
          }
          break

        case 'ArrowDown':
        case 'ArrowUp':
          // Handle arrow key navigation for lists and menus
          if (focusableElements.length > 0) {
            event.preventDefault()
            const nextIndex = event.key === 'ArrowDown'
              ? currentFocusIndex >= focusableElements.length - 1 ? 0 : currentFocusIndex + 1
              : currentFocusIndex <= 0 ? focusableElements.length - 1 : currentFocusIndex - 1

            focusableElements[nextIndex]?.focus()
            setCurrentFocusIndex(nextIndex)
          }
          break
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('keydown', handleKeyDown)
      return () => container.removeEventListener('keydown', handleKeyDown)
    }
  }, [onEscape, onEnter, trapFocus, focusableElements, currentFocusIndex])

  // Track focus changes
  useEffect(() => {
    const handleFocusChange = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      const index = focusableElements.indexOf(target)
      if (index !== -1) {
        setCurrentFocusIndex(index)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('focusin', handleFocusChange)
      return () => container.removeEventListener('focusin', handleFocusChange)
    }
  }, [focusableElements])

  return (
    <div
      ref={containerRef}
      className={cn('focus-within:outline-none', className)}
      tabIndex={-1}
    >
      {children}
    </div>
  )
}

// Hook for managing focus trap
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    // Focus first element
    firstElement?.focus()

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isActive])

  return containerRef
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = [
        event.ctrlKey && 'ctrl',
        event.metaKey && 'meta',
        event.altKey && 'alt',
        event.shiftKey && 'shift',
        event.key.toLowerCase()
      ].filter(Boolean).join('+')

      const handler = shortcuts[key]
      if (handler) {
        event.preventDefault()
        handler()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

export type { KeyboardNavigationProps }
'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface ScreenReaderOnlyProps {
  children: React.ReactNode
  className?: string
}

// Component for screen reader only content
export function ScreenReaderOnly({ children, className }: ScreenReaderOnlyProps) {
  return (
    <span
      className={cn(
        'sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        className
      )}
    >
      {children}
    </span>
  )
}

export interface LiveRegionProps {
  children: React.ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
  className?: string
}

// Live region for dynamic content announcements
export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = false,
  relevant = 'all',
  className
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  )
}

export interface AnnouncementProps {
  message: string
  politeness?: 'polite' | 'assertive'
  clearAfter?: number
}

// Hook for making announcements to screen readers
export function useAnnouncement() {
  const announcementRef = useRef<HTMLDivElement>(null)

  const announce = ({ message, politeness = 'polite', clearAfter = 3000 }: AnnouncementProps) => {
    if (!announcementRef.current) return

    // Clear previous announcement
    announcementRef.current.textContent = ''
    
    // Set new announcement
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.setAttribute('aria-live', politeness)
        announcementRef.current.textContent = message
      }
    }, 100)

    // Clear announcement after specified time
    if (clearAfter > 0) {
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = ''
        }
      }, clearAfter)
    }
  }

  const AnnouncementRegion = () => (
    <div
      ref={announcementRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  )

  return { announce, AnnouncementRegion }
}

export interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

// Skip link for keyboard navigation
export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50',
        'bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      {children}
    </a>
  )
}

export interface DescribedByProps {
  children: React.ReactNode
  description: string
  descriptionId?: string
  className?: string
}

// Component that provides accessible descriptions
export function DescribedBy({
  children,
  description,
  descriptionId,
  className
}: DescribedByProps) {
  const id = descriptionId || `description-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={className}>
      <div aria-describedby={id}>
        {children}
      </div>
      <div id={id} className="sr-only">
        {description}
      </div>
    </div>
  )
}

export interface LabelledByProps {
  children: React.ReactNode
  label: string
  labelId?: string
  className?: string
}

// Component that provides accessible labels
export function LabelledBy({
  children,
  label,
  labelId,
  className
}: LabelledByProps) {
  const id = labelId || `label-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={className}>
      <div id={id} className="sr-only">
        {label}
      </div>
      <div aria-labelledby={id}>
        {children}
      </div>
    </div>
  )
}

// Hook for managing focus announcements
export function useFocusAnnouncement() {
  const { announce } = useAnnouncement()

  const announceFocus = (element: HTMLElement) => {
    const label = element.getAttribute('aria-label') ||
                  element.getAttribute('title') ||
                  element.textContent ||
                  'Interactive element'

    const role = element.getAttribute('role') || element.tagName.toLowerCase()
    
    announce({
      message: `${label}, ${role}`,
      politeness: 'polite'
    })
  }

  useEffect(() => {
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      if (target && target.hasAttribute('data-announce-focus')) {
        announceFocus(target)
      }
    }

    document.addEventListener('focusin', handleFocus)
    return () => document.removeEventListener('focusin', handleFocus)
  }, [])

  return { announceFocus }
}

// Hook for managing loading states announcements
export function useLoadingAnnouncement() {
  const { announce } = useAnnouncement()

  const announceLoading = (isLoading: boolean, loadingMessage = 'Loading', completeMessage = 'Loading complete') => {
    if (isLoading) {
      announce({
        message: loadingMessage,
        politeness: 'assertive',
        clearAfter: 0
      })
    } else {
      announce({
        message: completeMessage,
        politeness: 'polite'
      })
    }
  }

  return { announceLoading }
}

// Hook for managing error announcements
export function useErrorAnnouncement() {
  const { announce } = useAnnouncement()

  const announceError = (error: string) => {
    announce({
      message: `Error: ${error}`,
      politeness: 'assertive'
    })
  }

  const announceSuccess = (message: string) => {
    announce({
      message: `Success: ${message}`,
      politeness: 'polite'
    })
  }

  return { announceError, announceSuccess }
}

export type {
  ScreenReaderOnlyProps,
  LiveRegionProps,
  AnnouncementProps,
  SkipLinkProps,
  DescribedByProps,
  LabelledByProps
}
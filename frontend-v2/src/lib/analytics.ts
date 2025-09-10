// Analytics and user tracking utilities

interface AnalyticsEvent {
  name: string
  properties?: Record<string, unknown>
  timestamp: number
  sessionId: string
  userId?: string
  url: string
}

interface PageView {
  path: string
  title: string
  timestamp: number
  sessionId: string
  userId?: string
  referrer?: string
}

class AnalyticsService {
  private sessionId: string
  private userId?: string
  private isEnabled: boolean
  private isInitialized: boolean = false

  constructor() {
    // Don't generate session ID in constructor to avoid hydration mismatch
    this.sessionId = 'pending-hydration'
    this.isEnabled = this.shouldEnableAnalytics()
    
    // Initialize only on client side after hydration
    if (typeof window !== 'undefined') {
      this.initializeClient()
    }
  }

  private initializeClient(): void {
    if (this.isInitialized) return
    
    // Generate session ID only on client side
    this.sessionId = this.generateSessionId()
    this.isInitialized = true
  }

  private generateSessionId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private shouldEnableAnalytics(): boolean {
    return (
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
    )
  }

  setUserId(userId: string): void {
    this.initializeClient() // Ensure client is initialized
    this.userId = userId
  }

  // Track page views
  trackPageView(path: string, title?: string): void {
    if (!this.isEnabled) return

    this.initializeClient() // Ensure client is initialized

    const pageView: PageView = {
      path,
      title: title || document.title,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      referrer: document.referrer || undefined,
    }

    this.sendPageView(pageView)
  }

  // Track custom events
  trackEvent(name: string, properties?: Record<string, unknown>): void {
    if (!this.isEnabled) return

    this.initializeClient() // Ensure client is initialized

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: typeof window !== 'undefined' ? window.location.href : '',
    }

    this.sendEvent(event)
  }

  // Track user interactions
  trackClick(element: string, properties?: Record<string, unknown>): void {
    this.trackEvent('click', {
      element,
      ...properties,
    })
  }

  trackFormSubmit(formName: string, properties?: Record<string, unknown>): void {
    this.trackEvent('form_submit', {
      form_name: formName,
      ...properties,
    })
  }

  trackSearch(query: string, results?: number): void {
    this.trackEvent('search', {
      query,
      results,
    })
  }

  trackError(error: string, properties?: Record<string, unknown>): void {
    this.trackEvent('error', {
      error,
      ...properties,
    })
  }

  // Track user authentication
  trackLogin(method?: string): void {
    this.trackEvent('login', {
      method: method || 'unknown',
    })
  }

  trackLogout(): void {
    this.trackEvent('logout')
  }

  trackSignup(method?: string): void {
    this.trackEvent('signup', {
      method: method || 'unknown',
    })
  }

  // Track feature usage
  trackFeatureUsage(feature: string, properties?: Record<string, unknown>): void {
    this.trackEvent('feature_usage', {
      feature,
      ...properties,
    })
  }

  private async sendPageView(pageView: PageView): Promise<void> {
    try {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Page view:', pageView)
      }

      const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT
      
      if (!endpoint) {
        this.storeAnalyticsLocally('pageview', pageView)
        return
      }

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'pageview',
          data: pageView,
        }),
      })
    } catch (error) {
      console.warn('Failed to send page view:', error)
      this.storeAnalyticsLocally('pageview', pageView)
    }
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Analytics event:', event)
      }

      const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT
      
      if (!endpoint) {
        this.storeAnalyticsLocally('event', event)
        return
      }

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'event',
          data: event,
        }),
      })
    } catch (error) {
      console.warn('Failed to send analytics event:', error)
      this.storeAnalyticsLocally('event', event)
    }
  }

  private storeAnalyticsLocally(type: string, data: unknown): void {
    if (typeof window === 'undefined') return

    try {
      const key = `analytics_${type}`
      const stored = JSON.parse(localStorage.getItem(key) || '[]')
      stored.push(data)
      
      // Keep only last 100 items
      if (stored.length > 100) {
        stored.splice(0, stored.length - 100)
      }
      
      localStorage.setItem(key, JSON.stringify(stored))
    } catch (error) {
      console.warn('Failed to store analytics locally:', error)
    }
  }

  // Get stored analytics for debugging
  getStoredAnalytics(): { pageviews: PageView[]; events: AnalyticsEvent[] } {
    if (typeof window === 'undefined') {
      return { pageviews: [], events: [] }
    }
    
    try {
      const pageviews = JSON.parse(localStorage.getItem('analytics_pageview') || '[]')
      const events = JSON.parse(localStorage.getItem('analytics_event') || '[]')
      return { pageviews, events }
    } catch {
      return { pageviews: [], events: [] }
    }
  }

  // Clear stored analytics
  clearStoredAnalytics(): void {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem('analytics_pageview')
    localStorage.removeItem('analytics_event')
  }
}

// Export singleton instance
export const analytics = new AnalyticsService()

// React hook for analytics
export function useAnalytics() {
  return {
    trackPageView: analytics.trackPageView.bind(analytics),
    trackEvent: analytics.trackEvent.bind(analytics),
    trackClick: analytics.trackClick.bind(analytics),
    trackFormSubmit: analytics.trackFormSubmit.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackLogin: analytics.trackLogin.bind(analytics),
    trackLogout: analytics.trackLogout.bind(analytics),
    trackSignup: analytics.trackSignup.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics),
  }
}
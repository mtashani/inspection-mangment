import { lazy } from 'react'

// Lazy load heavy components (pages have default exports)
export const LazyDashboard = lazy(() => import('@/app/dashboard/page'))
export const LazyLogin = lazy(() => import('@/app/login/page'))

// Lazy load sidebar components
export const LazyAppSidebar = lazy(() =>
  import('@/components/app-sidebar').then((module) => ({
    default: module.AppSidebar,
  }))
)

// Lazy load query devtools (only in development)
export const LazyReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((module) => ({
    default: module.ReactQueryDevtools,
  }))
)
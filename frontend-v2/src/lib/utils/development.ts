/**
 * Development utilities for handling mock data and development-specific features
 */

/**
 * Check if the application should use mock data
 * This is enabled in development mode when NEXT_PUBLIC_USE_MOCK_DATA is true
 */
export function shouldUseMockData(): boolean {
  return process.env.NODE_ENV === 'development' && 
         process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
}

/**
 * Check if development tools should be enabled
 */
export function shouldEnableDevtools(): boolean {
  return process.env.NODE_ENV === 'development' && 
         process.env.NEXT_PUBLIC_ENABLE_DEVTOOLS === 'true';
}

/**
 * Check if query devtools should be enabled
 */
export function shouldEnableQueryDevtools(): boolean {
  return process.env.NODE_ENV === 'development' && 
         process.env.NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS === 'true';
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
  return process.env.NODE_ENV === 'development' && 
         process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true';
}

/**
 * Log development messages only when debug mode is enabled
 */
export function debugLog(message: string, ...args: unknown[]): void {
  if (isDebugMode()) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Log development info messages
 */
export function devInfo(message: string, ...args: unknown[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.info(`[DEV] ${message}`, ...args);
  }
}

/**
 * Log development warnings
 */
export function devWarn(message: string, ...args: unknown[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[DEV] ${message}`, ...args);
  }
}
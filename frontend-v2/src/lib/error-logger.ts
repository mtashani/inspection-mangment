// Error logging utility for better error tracking and debugging

interface ErrorLogEntry {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  context?: Record<string, unknown>;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 100;

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  logError(error: Error | string, context?: Record<string, unknown>): void {
    const errorEntry: ErrorLogEntry = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      context,
    };

    // Add to local logs
    this.logs.unshift(errorEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Store in localStorage for debugging
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('error_logs', JSON.stringify(this.logs.slice(0, 10)));
      } catch (e) {
        // Ignore localStorage errors
      }
    }

    // Log to console in development (only for non-auth errors to reduce noise)
    if (process.env.NODE_ENV === 'development' && context?.type !== 'authentication') {
      console.group('🚨 Error Logged');
      console.error('Message:', errorEntry.message);
      if (errorEntry.stack) {
        console.error('Stack:', errorEntry.stack);
      }
      if (context) {
        console.error('Context:', context);
      }
      console.groupEnd();
    }
  }

  getRecentLogs(count = 10): ErrorLogEntry[] {
    return this.logs.slice(0, count);
  }

  clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('error_logs');
    }
  }

  // Helper method for authentication errors
  logAuthError(error: Error | string, action: 'login' | 'logout' | 'token_refresh'): void {
    // Only log authentication errors in production or for login/logout actions
    if (process.env.NODE_ENV === 'production' || action === 'login' || action === 'logout') {
      this.logError(error, {
        type: 'authentication',
        action,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Helper method for API errors
  logApiError(error: Error | string, endpoint: string, method: string, status?: number): void {
    this.logError(error, {
      type: 'api',
      endpoint,
      method,
      status,
      timestamp: new Date().toISOString(),
    });
  }
}

export const errorLogger = ErrorLogger.getInstance();

// Export helper functions
export const logError = (error: Error | string, context?: Record<string, unknown>) => {
  errorLogger.logError(error, context);
};

export const logAuthError = (error: Error | string, action: 'login' | 'logout' | 'token_refresh') => {
  errorLogger.logAuthError(error, action);
};

export const logApiError = (error: Error | string, endpoint: string, method: string, status?: number) => {
  errorLogger.logApiError(error, endpoint, method, status);
};
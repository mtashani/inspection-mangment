'use client';

import { useState, useEffect } from 'react';
import { shouldUseMockData, isDebugMode } from '@/lib/utils/development';
import { Badge } from '@/components/ui/badge';

/**
 * Development status indicator component
 * Shows when mock data is being used in development
 */
export function DevStatusIndicator() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render on client side after hydration to prevent SSR mismatch
  if (!mounted || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const useMockData = shouldUseMockData();
  const debugMode = isDebugMode();

  if (!useMockData && !debugMode) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {useMockData && (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
          🔧 Mock Data Mode
        </Badge>
      )}
      {debugMode && (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
          🐛 Debug Mode
        </Badge>
      )}
    </div>
  );
}
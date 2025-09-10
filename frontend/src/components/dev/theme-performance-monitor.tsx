'use client';

import React, { useEffect, useState } from 'react';
import { cssPerformanceMonitor } from '@/utils/css-optimization';

interface PerformanceStats {
  totalUpdates: number;
  totalTime: number;
  updatesPerSecond: number;
  averageUpdateInterval: number;
  recentUpdates: number[];
}

/**
 * Development component for monitoring theme performance
 * Only renders in development mode
 */
export function ThemePerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    const interval = setInterval(() => {
      setStats(cssPerformanceMonitor.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-xs z-50"
        style={{
          fontSize: 'var(--font-size-xs)',
          padding: 'var(--space-1) var(--space-3)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--primary)',
          color: 'var(--primary-foreground)'
        }}
      >
        Theme Perf
      </button>
    );
  }

  return (
    <div 
      className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-sm"
      style={{
        backgroundColor: 'var(--card)',
        color: 'var(--card-foreground)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        fontSize: 'var(--font-size-xs)',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 
          className="font-semibold"
          style={{ fontSize: 'var(--font-size-sm)' }}
        >
          Theme Performance
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
          style={{ color: 'var(--muted-foreground)' }}
        >
          ×
        </button>
      </div>
      
      {stats && (
        <div className="space-y-1">
          <div>
            <strong>Total Updates:</strong> {stats.totalUpdates}
          </div>
          <div>
            <strong>Updates/sec:</strong> {stats.updatesPerSecond.toFixed(2)}
          </div>
          <div>
            <strong>Avg Interval:</strong> {stats.averageUpdateInterval.toFixed(2)}ms
          </div>
          <div>
            <strong>Total Time:</strong> {(stats.totalTime / 1000).toFixed(2)}s
          </div>
          
          {stats.recentUpdates.length > 0 && (
            <div>
              <strong>Recent Updates:</strong>
              <div className="text-xs mt-1">
                {stats.recentUpdates.slice(-5).map((time, index) => (
                  <div key={index}>
                    {new Date(time).toLocaleTimeString()}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => cssPerformanceMonitor.reset()}
              className="text-xs px-2 py-1 bg-gray-100 rounded"
              style={{
                backgroundColor: 'var(--muted)',
                color: 'var(--muted-foreground)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-1) var(--space-2)'
              }}
            >
              Reset Stats
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for monitoring component re-renders
 */
export function useRenderMonitor(componentName: string) {
  const renderCount = React.useRef(0);
  const lastRenderTime = React.useRef(Date.now());

  React.useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Render #${renderCount.current}, ${timeSinceLastRender}ms since last render`);
    }
  });

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current
  };
}
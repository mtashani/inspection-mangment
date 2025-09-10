"use client";

import React, { 
  memo, 
  useMemo, 
  useCallback, 
  lazy, 
  Suspense, 
  forwardRef,
  useRef,
  useEffect,
  useState
} from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>();
  const renderCount = useRef(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;
  });

  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      
      // Log performance in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
      }
      
      // Report to performance monitoring service in production
      if (process.env.NODE_ENV === 'production' && renderTime > 16) {
        // Report slow renders (>16ms for 60fps)
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    }
  });

  return {
    renderCount: renderCount.current,
    markRenderStart: () => {
      renderStartTime.current = performance.now();
    }
  };
}

// Memoized component wrapper with performance monitoring
export function withPerformanceMonitoring<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  const MemoizedComponent = memo(Component);
  
  return forwardRef<any, T>((props, ref) => {
    usePerformanceMonitor(componentName);
    return <MemoizedComponent {...props} ref={ref} />;
  });
}

// Optimized List Component with virtualization
interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

export function OptimizedList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5,
  className,
  onScroll
}: OptimizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Optimized Image Component with lazy loading
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  placeholder?: string;
  blurDataURL?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = memo(forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({ 
    src, 
    alt, 
    width, 
    height, 
    placeholder, 
    blurDataURL, 
    priority = false,
    onLoad,
    onError,
    className,
    ...props 
  }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const imgRef = useRef<HTMLImageElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
      if (priority || !imgRef.current) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { rootMargin: '50px' }
      );

      observer.observe(imgRef.current);
      return () => observer.disconnect();
    }, [priority]);

    const handleLoad = useCallback(() => {
      setIsLoaded(true);
      onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
      setHasError(true);
      onError?.();
    }, [onError]);

    return (
      <div
        ref={imgRef}
        className={cn("relative overflow-hidden", className)}
        style={{ width, height }}
      >
        {/* Placeholder */}
        {!isLoaded && !hasError && (
          <div
            className="absolute inset-0 bg-[var(--color-bg-secondary)] flex items-center justify-center"
            style={{
              backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {placeholder || <Loader2 className="w-6 h-6 animate-spin text-[var(--color-text-secondary)]" />}
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 bg-[var(--color-bg-secondary)] flex items-center justify-center">
            <span className="text-sm text-[var(--color-text-secondary)]">Failed to load</span>
          </div>
        )}

        {/* Actual image */}
        {isInView && (
          <img
            ref={ref}
            src={src}
            alt={alt}
            width={width}
            height={height}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            loading={priority ? "eager" : "lazy"}
            {...props}
          />
        )}
      </div>
    );
  }
));

OptimizedImage.displayName = 'OptimizedImage';

// Debounced Input Component
interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export const DebouncedInput = memo(({ 
  value, 
  onChange, 
  debounceMs = 300, 
  ...props 
}: DebouncedInputProps) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  }, [onChange, debounceMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <input
      {...props}
      value={localValue}
      onChange={handleChange}
    />
  );
});

DebouncedInput.displayName = 'DebouncedInput';

// Memoized Complex Component
interface ComplexComponentProps {
  data: any[];
  filters: Record<string, any>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onItemClick: (item: any) => void;
  className?: string;
}

export const MemoizedComplexComponent = memo(({
  data,
  filters,
  sortBy,
  sortOrder,
  onItemClick,
  className
}: ComplexComponentProps) => {
  // Expensive computation memoized
  const processedData = useMemo(() => {
    let filtered = data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return item[key]?.toString().toLowerCase().includes(value.toLowerCase());
      });
    });

    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [data, filters, sortBy, sortOrder]);

  // Memoized click handler
  const handleItemClick = useCallback((item: any) => {
    onItemClick(item);
  }, [onItemClick]);

  return (
    <div className={className}>
      {processedData.map(item => (
        <MemoizedItem
          key={item.id}
          item={item}
          onClick={handleItemClick}
        />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.data === nextProps.data &&
    JSON.stringify(prevProps.filters) === JSON.stringify(nextProps.filters) &&
    prevProps.sortBy === nextProps.sortBy &&
    prevProps.sortOrder === nextProps.sortOrder &&
    prevProps.onItemClick === nextProps.onItemClick
  );
});

MemoizedComplexComponent.displayName = 'MemoizedComplexComponent';

// Memoized Item Component
interface ItemProps {
  item: any;
  onClick: (item: any) => void;
}

const MemoizedItem = memo(({ item, onClick }: ItemProps) => {
  const handleClick = useCallback(() => {
    onClick(item);
  }, [item, onClick]);

  return (
    <div
      className="p-4 border-b border-[var(--color-border-primary)] hover:bg-[var(--color-bg-secondary)] cursor-pointer"
      onClick={handleClick}
    >
      <h3 className="font-medium">{item.title}</h3>
      <p className="text-sm text-[var(--color-text-secondary)]">{item.description}</p>
    </div>
  );
});

MemoizedItem.displayName = 'MemoizedItem';

// Lazy Loading Wrapper
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function LazyWrapper({ children, fallback, className }: LazyWrapperProps) {
  return (
    <Suspense
      fallback={
        fallback || (
          <div className={cn("flex items-center justify-center p-8", className)}>
            <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary-600)]" />
          </div>
        )
      }
    >
      {children}
    </Suspense>
  );
}

// Code Splitting Examples
export const LazyDashboard = lazy(() => import('./dashboard-layout'));
export const LazyDataTable = lazy(() => import('./enhanced-data-table'));
export const LazyFormWizard = lazy(() => import('./enhanced-form-system'));
export const LazyChartComponents = lazy(() => import('./interactive-charts'));

// Performance Utilities
export const performanceUtils = {
  // Measure component render time
  measureRender: (componentName: string, renderFn: () => void) => {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    console.log(`${componentName} render time: ${(end - start).toFixed(2)}ms`);
  },

  // Debounce function
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Memoize expensive calculations
  memoize: <T extends (...args: any[]) => any>(fn: T): T => {
    const cache = new Map();
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  // Check if component should update
  shallowEqual: (obj1: any, obj2: any): boolean => {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (let key of keys1) {
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }

    return true;
  }
};

// Bundle Size Analyzer (Development only)
export const bundleAnalyzer = {
  logComponentSize: (componentName: string, component: React.ComponentType) => {
    if (process.env.NODE_ENV === 'development') {
      // This would integrate with webpack-bundle-analyzer or similar
      console.log(`Component ${componentName} loaded`);
    }
  },

  // Track lazy loading
  trackLazyLoad: (componentName: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Lazy component ${componentName} loaded`);
    }
  }
};

// React DevTools Profiler Integration
export function ProfilerWrapper({ 
  id, 
  children, 
  onRender 
}: { 
  id: string; 
  children: React.ReactNode;
  onRender?: (id: string, phase: string, actualDuration: number) => void;
}) {
  const handleRender = useCallback((
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Profiler ${id} - ${phase}: ${actualDuration.toFixed(2)}ms`);
    }
    onRender?.(id, phase, actualDuration);
  }, [onRender]);

  return (
    <React.Profiler id={id} onRender={handleRender}>
      {children}
    </React.Profiler>
  );
}

export default {
  usePerformanceMonitor,
  withPerformanceMonitoring,
  OptimizedList,
  OptimizedImage,
  DebouncedInput,
  MemoizedComplexComponent,
  LazyWrapper,
  ProfilerWrapper,
  performanceUtils,
  bundleAnalyzer
};
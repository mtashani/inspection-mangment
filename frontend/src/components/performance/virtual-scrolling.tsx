"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface VirtualScrollingProps<T> {
  items: T[];
  itemHeight: number | ((item: T, index: number) => number);
  renderItem: (
    item: T,
    index: number,
    style: React.CSSProperties
  ) => React.ReactNode;
  containerHeight: number;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  className?: string;
  itemKey?: (item: T, index: number) => string | number;
}

export function VirtualScrolling<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight,
  overscan = 5,
  onScroll,
  onEndReached,
  endReachedThreshold = 0.8,
  className,
  itemKey = (_, index) => index,
}: VirtualScrollingProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate item heights and positions
  const itemMetrics = useMemo(() => {
    const heights: number[] = [];
    const positions: number[] = [];
    let totalHeight = 0;

    items.forEach((item, index) => {
      const height =
        typeof itemHeight === "function" ? itemHeight(item, index) : itemHeight;
      heights[index] = height;
      positions[index] = totalHeight;
      totalHeight += height;
    });

    return { heights, positions, totalHeight };
  }, [items, itemHeight]);

  // Find visible range
  const visibleRange = useMemo(() => {
    if (items.length === 0) {
      return { start: 0, end: 0 };
    }

    const { positions, heights } = itemMetrics;
    const viewportTop = scrollTop;
    const viewportBottom = scrollTop + containerHeight;

    // Binary search for start index
    let start = 0;
    let end = items.length - 1;
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const itemTop = positions[mid];
      const itemBottom = itemTop + heights[mid];

      if (itemBottom <= viewportTop) {
        start = mid + 1;
      } else if (itemTop >= viewportBottom) {
        end = mid - 1;
      } else {
        // Found first visible item
        start = mid;
        break;
      }
    }

    // Find end index
    let endIndex = start;
    while (endIndex < items.length && positions[endIndex] < viewportBottom) {
      endIndex++;
    }

    // Apply overscan
    const startWithOverscan = Math.max(0, start - overscan);
    const endWithOverscan = Math.min(items.length - 1, endIndex + overscan);

    return { start: startWithOverscan, end: endWithOverscan };
  }, [scrollTop, containerHeight, items.length, itemMetrics, overscan]);

  // Handle scroll
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = event.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);

      // Check if end reached
      if (onEndReached) {
        const { scrollHeight, clientHeight } = event.currentTarget;
        const scrollPercentage = (newScrollTop + clientHeight) / scrollHeight;

        if (scrollPercentage >= endReachedThreshold) {
          onEndReached();
        }
      }
    },
    [onScroll, onEndReached, endReachedThreshold]
  );

  // Render visible items
  const visibleItems = useMemo(() => {
    const items_to_render = [];

    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (i >= items.length) break;

      const item = items[i];
      const top = itemMetrics.positions[i];
      const height = itemMetrics.heights[i];

      const style: React.CSSProperties = {
        position: "absolute",
        top,
        left: 0,
        right: 0,
        height,
        zIndex: 1,
      };

      items_to_render.push({
        key: itemKey(item, i),
        index: i,
        item,
        style,
        element: renderItem(item, i, style),
      });
    }

    return items_to_render;
  }, [visibleRange, items, itemMetrics, renderItem, itemKey]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total height container */}
      <div
        ref={scrollElementRef}
        style={{ height: itemMetrics.totalHeight, position: "relative" }}
      >
        {/* Visible items */}
        {visibleItems.map(({ key, element }) => (
          <div key={key}>{element}</div>
        ))}
      </div>
    </div>
  );
}

// Hook for virtual scrolling with infinite loading
export function useVirtualScrolling<T>({
  initialItems = [],
  loadMore,
  hasMore = true,
  isLoading = false,
}: {
  initialItems?: T[];
  loadMore: () => Promise<T[]>;
  hasMore?: boolean;
  isLoading?: boolean;
}) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const handleLoadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || loading) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const newItems = await loadMore();
      setItems((prev) => [...prev, ...newItems]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more items"
      );
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [loadMore, hasMore, loading]);

  const reset = useCallback(() => {
    setItems(initialItems);
    setError(null);
    setLoading(false);
    loadingRef.current = false;
  }, [initialItems]);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore: handleLoadMore,
    reset,
  };
}

// Virtual table component for tabular data
interface VirtualTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    header: string;
    width?: number;
    render?: (value: T[keyof T], item: T, index: number) => React.ReactNode;
  }>;
  rowHeight?: number;
  headerHeight?: number;
  containerHeight: number;
  onRowClick?: (item: T, index: number) => void;
  className?: string;
}

export function VirtualTable<T extends Record<string, unknown>>({
  data,
  columns,
  rowHeight = 50,
  headerHeight = 40,
  containerHeight,
  onRowClick,
  className,
}: VirtualTableProps<T>) {
  const contentHeight = containerHeight - headerHeight;

  const renderRow = useCallback(
    (item: T, index: number, style: React.CSSProperties) => {
      return (
        <div
          style={style}
          className={cn(
            "flex items-center border-b border-gray-200 hover:bg-gray-50 transition-colors",
            onRowClick && "cursor-pointer"
          )}
          onClick={() => onRowClick?.(item, index)}
        >
          {columns.map((column) => {
            const value = item[column.key];
            const content = column.render
              ? column.render(value, item, index)
              : String(value);

            return (
              <div
                key={String(column.key)}
                className="px-4 py-2 truncate"
                style={{
                  width: column.width || `${100 / columns.length}%`,
                  minWidth: column.width || 100,
                }}
              >
                {content}
              </div>
            );
          })}
        </div>
      );
    },
    [columns, onRowClick]
  );

  return (
    <div
      className={cn(
        "border border-gray-200 rounded-lg overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div
        className="flex bg-gray-50 border-b border-gray-200 font-medium"
        style={{ height: headerHeight }}
      >
        {columns.map((column) => (
          <div
            key={String(column.key)}
            className="px-4 py-2 truncate"
            style={{
              width: column.width || `${100 / columns.length}%`,
              minWidth: column.width || 100,
            }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Virtual scrolling content */}
      <VirtualScrolling
        items={data}
        itemHeight={rowHeight}
        renderItem={renderRow}
        containerHeight={contentHeight}
        itemKey={(_, index) => index}
      />
    </div>
  );
}

// Performance monitoring hook
export function useVirtualScrollingPerformance() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    visibleItems: 0,
    totalItems: 0,
    scrollPosition: 0,
    fps: 0,
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderStartRef = useRef(0);

  const startRender = useCallback(() => {
    renderStartRef.current = performance.now();
  }, []);

  const endRender = useCallback(
    (visibleItems: number, totalItems: number, scrollPosition: number) => {
      const renderTime = performance.now() - renderStartRef.current;

      // Calculate FPS
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        frameCountRef.current = 0;
        lastTimeRef.current = now;

        setMetrics({
          renderTime,
          visibleItems,
          totalItems,
          scrollPosition,
          fps,
        });
      } else {
        setMetrics((prev) => ({
          ...prev,
          renderTime,
          visibleItems,
          totalItems,
          scrollPosition,
        }));
      }
    },
    []
  );

  return {
    metrics,
    startRender,
    endRender,
  };
}

export type { VirtualScrollingProps };

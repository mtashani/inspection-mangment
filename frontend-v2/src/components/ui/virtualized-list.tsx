'use client'

import React, { 
  forwardRef, 
  useCallback, 
  useEffect, 
  useImperativeHandle, 
  useMemo, 
  useRef, 
  useState 
} from 'react'
import { FixedSizeList as List, VariableSizeList, ListChildComponentProps } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import { cn } from '@/lib/utils'

// Types for virtualized list
export interface VirtualizedListItem {
  id: string | number
  height?: number
}

export interface VirtualizedListProps<T extends VirtualizedListItem> {
  items: T[]
  renderItem: (props: VirtualizedListRenderProps<T>) => React.ReactNode
  height: number
  itemHeight?: number | ((index: number) => number)
  className?: string
  overscan?: number
  hasNextPage?: boolean
  isNextPageLoading?: boolean
  loadNextPage?: () => Promise<void>
  threshold?: number
  onScroll?: (scrollTop: number) => void
  scrollToIndex?: number
  scrollToAlignment?: 'auto' | 'smart' | 'center' | 'end' | 'start'
}

export interface VirtualizedListRenderProps<T> {
  item: T
  index: number
  style: React.CSSProperties
  isScrolling?: boolean
}

export interface VirtualizedListRef {
  scrollTo: (scrollTop: number) => void
  scrollToItem: (index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start') => void
  getScrollPosition: () => number
}

// Hook for managing scroll position restoration
export function useScrollRestoration(key: string) {
  const [scrollPosition, setScrollPosition] = useState(0)
  
  useEffect(() => {
    const saved = sessionStorage.getItem(`scroll-${key}`)
    if (saved) {
      setScrollPosition(parseInt(saved, 10))
    }
  }, [key])
  
  const saveScrollPosition = useCallback((position: number) => {
    setScrollPosition(position)
    sessionStorage.setItem(`scroll-${key}`, position.toString())
  }, [key])
  
  return { scrollPosition, saveScrollPosition }
}

// Memoized item renderer to prevent unnecessary re-renders
const MemoizedItemRenderer = React.memo(<T extends VirtualizedListItem>({
  index,
  style,
  data,
  isScrolling
}: ListChildComponentProps & { data: { items: T[], renderItem: (props: VirtualizedListRenderProps<T>) => React.ReactNode } }) => {
  const { items, renderItem } = data
  const item = items[index]
  
  if (!item) {
    return (
      <div style={style} className="flex items-center justify-center p-4">
        <div className="animate-pulse bg-muted rounded h-16 w-full" />
      </div>
    )
  }
  
  return (
    <div style={style}>
      {renderItem({ item, index, style: {}, isScrolling })}
    </div>
  )
})

MemoizedItemRenderer.displayName = 'MemoizedItemRenderer'

// Main virtualized list component
export const VirtualizedList = forwardRef(<T extends VirtualizedListItem>(
  {
    items,
    renderItem,
    height,
    itemHeight = 100,
    className,
    overscan = 5,
    hasNextPage = false,
    isNextPageLoading = false,
    loadNextPage,
    threshold = 15,
    onScroll,
    scrollToIndex,
    scrollToAlignment = 'auto'
  }: VirtualizedListProps<T>,
  ref: React.Ref<VirtualizedListRef>
) => {
  const listRef = useRef<any>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  
  // Determine if we need variable or fixed size list
  const isVariableSize = typeof itemHeight === 'function'
  
  // Memoize item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    items,
    renderItem
  }), [items, renderItem])
  
  // Handle infinite loading
  const itemCount = hasNextPage ? items.length + 1 : items.length
  const isItemLoaded = useCallback((index: number) => {
    return !!items[index]
  }, [items])
  
  const loadMoreItems = useCallback(async () => {
    if (loadNextPage && !isNextPageLoading) {
      await loadNextPage()
    }
  }, [loadNextPage, isNextPageLoading])
  
  // Scroll handlers
  const handleScroll = useCallback((props: { scrollTop: number }) => {
    onScroll?.(props.scrollTop)
  }, [onScroll])
  
  const handleScrollStart = useCallback(() => {
    setIsScrolling(true)
  }, [])
  
  const handleScrollStop = useCallback(() => {
    setIsScrolling(false)
  }, [])
  
  // Expose scroll methods via ref
  useImperativeHandle(ref, () => ({
    scrollTo: (scrollTop: number) => {
      listRef.current?.scrollTo(scrollTop)
    },
    scrollToItem: (index: number, align = 'auto') => {
      listRef.current?.scrollToItem(index, align)
    },
    getScrollPosition: () => {
      // This would need to be tracked via onScroll callback
      return 0
    }
  }), [])
  
  // Scroll to specific index when requested
  useEffect(() => {
    if (scrollToIndex !== undefined && listRef.current) {
      listRef.current.scrollToItem(scrollToIndex, scrollToAlignment)
    }
  }, [scrollToIndex, scrollToAlignment])
  
  // Render loading item for infinite scroll
  const renderLoadingItem = useCallback((props: ListChildComponentProps) => (
    <div style={props.style} className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
    </div>
  ), [])
  
  // Enhanced item renderer that handles loading states
  const enhancedItemRenderer = useCallback((props: ListChildComponentProps) => {
    const { index } = props
    
    // Show loading item if we're at the end and loading more
    if (index >= items.length) {
      return renderLoadingItem(props)
    }
    
    return (
      <MemoizedItemRenderer 
        {...props} 
        data={itemData as any}
        isScrolling={isScrolling}
      />
    )
  }, [items.length, itemData, isScrolling, renderLoadingItem])
  
  if (loadNextPage) {
    // Use infinite loader for paginated data
    return (
      <div className={cn("w-full", className)}>
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
          threshold={threshold}
        >
          {({ onItemsRendered, ref: infiniteRef }: unknown) => (
            isVariableSize ? (
              <VariableSizeList
                ref={(list) => {
                  listRef.current = list
                  infiniteRef(list)
                }}
                height={height}
                itemCount={itemCount}
                itemSize={itemHeight as (index: number) => number}
                itemData={itemData}
                onItemsRendered={onItemsRendered}
                onScroll={handleScroll}
                onScrollStart={handleScrollStart}
                onScrollStop={handleScrollStop}
                overscanCount={overscan}
                className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
              >
                {enhancedItemRenderer}
              </VariableSizeList>
            ) : (
              <List
                ref={(list) => {
                  listRef.current = list
                  infiniteRef(list)
                }}
                height={height}
                itemCount={itemCount}
                itemSize={itemHeight as number}
                itemData={itemData}
                onItemsRendered={onItemsRendered}
                onScroll={handleScroll}
                onScrollStart={handleScrollStart}
                onScrollStop={handleScrollStop}
                overscanCount={overscan}
                className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
              >
                {enhancedItemRenderer}
              </List>
            )
          )}
        </InfiniteLoader>
      </div>
    )
  }
  
  // Regular virtualized list without infinite loading
  return (
    <div className={cn("w-full", className)}>
      {isVariableSize ? (
        <VariableSizeList
          ref={listRef}
          height={height}
          itemCount={items.length}
          itemSize={itemHeight as (index: number) => number}
          itemData={itemData}
          onScroll={handleScroll}
          onScrollStart={handleScrollStart}
          onScrollStop={handleScrollStop}
          overscanCount={overscan}
          className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        >
          {MemoizedItemRenderer}
        </VariableSizeList>
      ) : (
        <List
          ref={listRef}
          height={height}
          itemCount={items.length}
          itemSize={itemHeight as number}
          itemData={itemData}
          onScroll={handleScroll}
          onScrollStart={handleScrollStart}
          onScrollStop={handleScrollStop}
          overscanCount={overscan}
          className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        >
          {MemoizedItemRenderer}
        </List>
      )}
    </div>
  )
})

VirtualizedList.displayName = 'VirtualizedList'

// Hook for dynamic item height calculation
export function useDynamicItemHeight<T extends VirtualizedListItem>(
  items: T[],
  estimatedHeight: number = 100
) {
  const heightCache = useRef<Map<number, number>>(new Map())
  const [, forceUpdate] = useState({})
  
  const getItemHeight = useCallback((index: number) => {
    return heightCache.current.get(index) ?? estimatedHeight
  }, [estimatedHeight])
  
  const setItemHeight = useCallback((index: number, height: number) => {
    if (heightCache.current.get(index) !== height) {
      heightCache.current.set(index, height)
      forceUpdate({})
    }
  }, [])
  
  const resetHeights = useCallback(() => {
    heightCache.current.clear()
    forceUpdate({})
  }, [])
  
  // Clear cache when items change significantly
  useEffect(() => {
    const currentSize = heightCache.current.size
    if (currentSize > items.length * 1.5) {
      resetHeights()
    }
  }, [items.length, resetHeights])
  
  return {
    getItemHeight,
    setItemHeight,
    resetHeights
  }
}

// Performance optimization hook
export function useVirtualizedListOptimization<T extends VirtualizedListItem>(
  items: T[],
  dependencies: React.DependencyList = []
) {
  // Memoize items to prevent unnecessary re-renders
  const memoizedItems = useMemo(() => items, [items, ...dependencies])
  
  // Track if items have actually changed
  const previousItemsRef = useRef<T[]>([])
  const itemsChanged = useMemo(() => {
    const changed = previousItemsRef.current !== items
    previousItemsRef.current = items
    return changed
  }, [items])
  
  return {
    items: memoizedItems,
    itemsChanged
  }
}
# URL State Management Implementation

This document describes the comprehensive URL state management implementation for the Maintenance Events system.

## Overview

The URL state management system provides:

1. **URL Synchronization** - State is automatically synchronized with URL parameters
2. **Browser Navigation** - Proper handling of back/forward buttons
3. **State Persistence** - State is preserved across page refreshes and navigation
4. **Filter Management** - Advanced filtering with URL state integration
5. **Scroll Restoration** - Scroll positions are maintained during navigation

## Architecture

### Core Components

1. **URLStateProvider** (`src/components/providers/url-state-provider.tsx`)
   - Provides context for URL state management
   - Handles localStorage persistence
   - Manages state restoration on page load

2. **URL State Utilities** (`src/lib/utils/url-state.ts`)
   - Core hooks for URL state synchronization
   - Debounced URL updates
   - State serialization/deserialization

3. **Browser Navigation** (`src/lib/utils/browser-navigation.ts`)
   - Browser back/forward button handling
   - Navigation state tracking
   - Scroll position restoration

4. **Maintenance Events URL State** (`src/lib/utils/maintenance-events-url-state.ts`)
   - Specific configurations for maintenance events pages
   - URL state schemas and validation
   - Helper utilities for URL generation

5. **Comprehensive State Management** (`src/hooks/use-url-state-management.ts`)
   - High-level hook combining all functionality
   - Filter-specific state management
   - Navigation helpers

## Implementation Details

### Events Overview Page

The Events Overview page (`/maintenance-events`) supports the following URL parameters:

- `search` - Search term for filtering events
- `status` - Event status filter (Planned, InProgress, Completed, etc.)
- `eventType` - Event type filter (Overhaul, Inspection, Repair, etc.)
- `dateFrom` - Start date for date range filtering
- `dateTo` - End date for date range filtering

Example URL: `/maintenance-events?search=pump&status=InProgress&eventType=Overhaul`

### Event Details Page

The Event Details page (`/maintenance-events/[eventId]`) supports:

- `tab` - Active tab (direct-inspections, sub-event-{id})
- `search` - Search term within inspections
- `inspectionStatus` - Filter inspections by status
- `equipmentTag` - Filter by equipment tag

Example URL: `/maintenance-events/123?tab=sub-event-456&search=valve&inspectionStatus=InProgress`

### State Persistence

State is automatically persisted to localStorage with the following keys:

- `maintenance-events-events-overview` - Events overview filters
- `maintenance-events-event-details-{eventId}` - Event details state
- `maintenance-events-{pathname}` - General page state

State includes:
- Filter values
- Timestamp for expiration (24 hours)
- Current pathname for validation

### Browser Navigation

The system handles:

1. **Back/Forward Buttons** - State is restored from URL parameters
2. **Page Refresh** - State is restored from localStorage if available
3. **Direct URL Access** - State is initialized from URL parameters
4. **Navigation Between Pages** - State is saved before navigation

### Scroll Restoration

Scroll positions are automatically saved and restored:

- Saved before navigation events
- Restored after page load
- Keyed by page and state for accuracy
- Cleaned up automatically

## Usage Examples

### Basic URL State Management

```typescript
import { useURLState } from '@/lib/utils/url-state'
import { eventsOverviewURLConfig } from '@/lib/utils/maintenance-events-url-state'

function MyComponent() {
  const [state, updateState, resetState] = useURLState(eventsOverviewURLConfig)
  
  // Update search filter
  const handleSearch = (search: string) => {
    updateState({ search })
  }
  
  // Clear all filters
  const handleClear = () => {
    resetState()
  }
  
  return (
    <div>
      <input 
        value={state.search || ''} 
        onChange={(e) => handleSearch(e.target.value)} 
      />
      <button onClick={handleClear}>Clear</button>
    </div>
  )
}
```

### Comprehensive State Management

```typescript
import { useFilterStateManagement } from '@/hooks/use-url-state-management'
import { eventsOverviewURLConfig } from '@/lib/utils/maintenance-events-url-state'

function EventsContainer() {
  const {
    state: filters,
    updateState: updateFilters,
    clearFilters,
    hasActiveFilters,
    getCurrentURL,
    navigateToPath
  } = useFilterStateManagement({
    ...eventsOverviewURLConfig,
    persistenceKey: 'events-overview',
    restoreScroll: true,
    handleNavigation: true
  })
  
  // Check if filters are active
  if (hasActiveFilters()) {
    console.log('Filters are active:', filters)
  }
  
  // Navigate with state
  const goToEventDetails = (eventId: string) => {
    navigateToPath(`/maintenance-events/${eventId}`, {
      tab: 'direct-inspections'
    })
  }
  
  return <div>...</div>
}
```

### Browser Navigation Handling

```typescript
import { useBrowserNavigation } from '@/lib/utils/browser-navigation'

function NavigationAwareComponent() {
  const { 
    canGoBack, 
    canGoForward, 
    navigateBack, 
    navigateForward 
  } = useBrowserNavigation({
    onBack: () => console.log('User went back'),
    onForward: () => console.log('User went forward'),
    onStateChange: (state) => console.log('Navigation state changed:', state)
  })
  
  return (
    <div>
      <button onClick={navigateBack} disabled={!canGoBack}>
        Back
      </button>
      <button onClick={navigateForward} disabled={!canGoForward}>
        Forward
      </button>
    </div>
  )
}
```

## Testing

A comprehensive test component is available at `/maintenance-events/url-state-test` that provides:

1. **Current State Display** - Shows URL parameters and state objects
2. **Persistence Testing** - Test saving/loading state to localStorage
3. **Navigation Testing** - Test browser navigation functionality
4. **Filter Testing** - Test filter state management

## Configuration

### URL State Configuration

Each page defines its URL state configuration:

```typescript
export const myPageURLConfig: URLStateConfig<MyState> = {
  serialize: (state) => {
    // Convert state to URL-safe strings
    return URLStateUtils.serializeFilters(state)
  },
  
  deserialize: (params) => {
    // Convert URL params back to state
    return URLStateUtils.deserializeFilters(params, {
      search: 'string',
      status: 'string',
      count: 'number',
      enabled: 'boolean'
    })
  },
  
  defaultState: {
    search: '',
    status: undefined,
    count: 10,
    enabled: true
  },
  
  options: {
    replace: true,      // Use replaceState instead of pushState
    scroll: false,      // Don't scroll to top on URL changes
    debounceMs: 300     // Debounce URL updates
  }
}
```

### Provider Configuration

The URLStateProvider is configured in the root layout:

```typescript
<URLStateProvider 
  debug={process.env.NODE_ENV === 'development'}
  storagePrefix="maintenance-events"
>
  {children}
</URLStateProvider>
```

## Performance Considerations

1. **Debouncing** - URL updates are debounced to prevent excessive history entries
2. **Selective Updates** - Only updates URL when state actually changes
3. **Efficient Serialization** - Only non-default values are included in URL
4. **Memory Management** - Old state entries are automatically cleaned up
5. **Lazy Loading** - State restoration happens only when needed

## Browser Compatibility

The implementation supports:

- Modern browsers with History API support
- Graceful degradation for older browsers
- Server-side rendering compatibility
- Progressive enhancement approach

## Troubleshooting

### Common Issues

1. **State Not Persisting**
   - Check localStorage is available
   - Verify URLStateProvider is properly configured
   - Check for storage quota limits

2. **URL Not Updating**
   - Verify debounce settings
   - Check for serialization errors
   - Ensure state actually changed

3. **Navigation Issues**
   - Check browser History API support
   - Verify navigation event handlers
   - Check for conflicting navigation code

### Debug Mode

Enable debug mode in development:

```typescript
<URLStateProvider debug={true}>
```

This will log:
- State changes
- URL updates
- Persistence operations
- Navigation events

## Future Enhancements

Potential improvements:

1. **State Compression** - Compress large state objects
2. **Cross-Tab Sync** - Synchronize state across browser tabs
3. **State Validation** - Runtime validation of state objects
4. **Analytics Integration** - Track state changes for analytics
5. **Performance Monitoring** - Monitor state management performance
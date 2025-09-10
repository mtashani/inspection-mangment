# Design Document: Enhanced Daily Reports Integration

## Overview

This design document outlines the technical approach for integrating the existing Enhanced Daily Reports frontend components with the backend API system, while addressing identified UI/UX issues and implementing proper data flow, error handling, and performance optimizations.

## Current State Analysis

### ✅ Implemented Components

- `EnhancedDailyReportsPage` - Main page component with mock data
- `MaintenanceEventGroup` - Event display with hierarchical structure
- `FilterAndSearchPanel` - Filtering interface with multiple criteria
- `InspectionPlanningModal` - Modal for creating inspection plans
- `EventStatusIndicator` - Status visualization component
- `ToastNotifications` - User feedback system
- `LoadingSkeletons` - Loading state components

### ❌ Missing Integration

- Backend API connectivity (currently using mock data)
- Real-time data updates
- Proper error handling for API failures
- Performance optimizations for large datasets
- Mobile responsive design improvements

## Architecture Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Enhanced Daily Reports Page                                │
│  ├── MaintenanceEventGroup                                  │
│  ├── FilterAndSearchPanel                                   │
│  ├── InspectionPlanningModal                               │
│  ├── EventStatusIndicator                                   │
│  └── EventStatistics                                        │
├─────────────────────────────────────────────────────────────┤
│                    API Integration Layer                    │
├─────────────────────────────────────────────────────────────┤
│  ├── Enhanced Maintenance API Service                       │
│  ├── Real-time WebSocket Connection                        │
│  ├── Error Handling & Retry Logic                          │
│  ├── Caching & State Management                            │
│  └── Performance Optimization                              │
├─────────────────────────────────────────────────────────────┤
│                    Backend Layer                            │
├─────────────────────────────────────────────────────────────┤
│  ├── Enhanced Daily Reports API Endpoints                   │
│  ├── Maintenance Event Management Service                   │
│  ├── Inspection Planning Service                           │
│  ├── Statistics & Analytics Service                        │
│  └── Real-time Notification Service                        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
Frontend Component → API Service → Backend Endpoint → Database
       ↓                ↓              ↓              ↓
   State Update ← Response Handler ← API Response ← Query Result
       ↓
   UI Update
```

## Backend API Design

### New API Endpoints

#### 1. Enhanced Daily Reports Endpoints

```typescript
// Get filtered maintenance events with enhanced data
GET /api/v1/maintenance/events/enhanced
Query Parameters:
- dateFrom: string (ISO date)
- dateTo: string (ISO date)
- status: MaintenanceEventStatus[]
- inspectors: string[]
- departments: string[]
- equipmentTag: string
- requesters: string[]
- page: number
- limit: number

Response: {
  events: EnhancedMaintenanceEvent[]
  totalCount: number
  summary: DailyReportsSummary
  pagination: PaginationInfo
}
```

```typescript
// Get daily reports summary statistics
GET / api / v1 / maintenance / daily - reports / summary;
Response: {
  activeInspections: number;
  completedInspections: number;
  activeMaintenanceEvents: number;
  completedMaintenanceEvents: number;
  reportsThisMonth: number;
  activeInspectors: number;
  overdueItems: number;
  upcomingDeadlines: number;
}
```

```typescript
// Get event statistics with breakdown
GET /api/v1/maintenance/events/{eventId}/enhanced-statistics
Response: {
  eventId: string
  statistics: EventStatistics
  requesterBreakdown: RequesterBreakdown[]
  equipmentStatusBreakdown: EquipmentStatusBreakdown
  progressHistory: ProgressHistoryItem[]
}
```

#### 2. Real-time Updates Endpoints

```typescript
// WebSocket connection for real-time updates
WS /api/v1/maintenance/events/live-updates
Messages:
- event_updated: { eventId, changes }
- inspection_status_changed: { inspectionId, status }
- new_event_created: { event }
- statistics_updated: { summary }
```

#### 3. Enhanced Search and Autocomplete

```typescript
// Equipment tag autocomplete
GET /api/v1/equipment/tags/search?q={query}
Response: {
  suggestions: string[]
  totalMatches: number
}

// Inspector search with availability
GET /api/v1/inspectors/search?q={query}&available=true
Response: {
  inspectors: InspectorInfo[]
  availability: InspectorAvailability[]
}
```

### Backend Service Enhancements

#### 1. Enhanced Maintenance Event Service

```python
class EnhancedMaintenanceEventService:
    def get_filtered_events(
        self,
        filters: FilterOptions,
        pagination: PaginationOptions
    ) -> EnhancedEventResponse:
        """Get maintenance events with enhanced data and filtering"""

    def get_event_statistics(self, event_id: str) -> EventStatistics:
        """Calculate comprehensive event statistics"""

    def get_daily_reports_summary(self) -> DailyReportsSummary:
        """Calculate dashboard summary statistics"""

    def update_event_status(
        self,
        event_id: str,
        status: MaintenanceEventStatus,
        user_id: str
    ) -> EnhancedMaintenanceEvent:
        """Update event status with validation and notifications"""
```

#### 2. Real-time Notification Service

```python
class RealTimeNotificationService:
    def notify_event_updated(self, event_id: str, changes: dict):
        """Notify connected clients of event updates"""

    def notify_statistics_changed(self, summary: DailyReportsSummary):
        """Notify clients of summary statistics changes"""

    def subscribe_to_events(self, user_id: str, event_ids: list):
        """Subscribe user to specific event updates"""
```

## Frontend Integration Design

### 1. API Service Layer

```typescript
// Enhanced Maintenance API Service
class EnhancedMaintenanceApiService {
  private baseUrl = "/api/v1/maintenance";
  private wsConnection: WebSocket | null = null;

  async getFilteredEvents(
    filters: FilterOptions,
    pagination: PaginationOptions
  ): Promise<EnhancedEventResponse> {
    // Implementation with error handling and retry logic
  }

  async getDailyReportsSummary(): Promise<DailyReportsSummary> {
    // Implementation with caching
  }

  async updateEventStatus(
    eventId: string,
    status: MaintenanceEventStatus
  ): Promise<EnhancedMaintenanceEvent> {
    // Implementation with optimistic updates
  }

  connectRealTime(callbacks: RealTimeCallbacks): void {
    // WebSocket connection management
  }

  disconnectRealTime(): void {
    // Cleanup WebSocket connection
  }
}
```

### 2. Enhanced State Management

```typescript
// Enhanced maintenance state hook
function useEnhancedMaintenance() {
  const [state, setState] = useState<EnhancedMaintenanceState>({
    events: [],
    summary: null,
    loading: false,
    error: null,
    filters: {},
    pagination: { page: 1, limit: 20 },
  });

  const [realTimeConnection, setRealTimeConnection] =
    useState<WebSocket | null>(null);

  // API integration methods
  const loadEvents = useCallback(
    async (showLoading = true) => {
      // Real API implementation
    },
    [state.filters, state.pagination]
  );

  const updateFilters = useCallback((newFilters: FilterOptions) => {
    // Update filters and reload data
  }, []);

  const connectRealTime = useCallback(() => {
    // Establish WebSocket connection
  }, []);

  return {
    ...state,
    loadEvents,
    updateFilters,
    connectRealTime,
    // ... other methods
  };
}
```

### 3. Error Handling Strategy

```typescript
// Centralized error handling
class ApiErrorHandler {
  static handle(error: ApiError, context: string): ErrorResponse {
    switch (error.status) {
      case 422:
        return {
          type: "validation",
          message: "Please check your input and try again",
          details: error.details,
        };
      case 500:
        return {
          type: "server",
          message: "Server error occurred. Please try again later",
          retryable: true,
        };
      case 404:
        return {
          type: "not_found",
          message: "The requested resource was not found",
          retryable: false,
        };
      default:
        return {
          type: "unknown",
          message: "An unexpected error occurred",
          retryable: true,
        };
    }
  }
}
```

## UI/UX Improvements Design

### 1. Visual Design Enhancements

```scss
// Enhanced styling for better visual hierarchy
.maintenance-event-card {
  // Improved contrast and spacing
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &.overdue {
    border-left: 4px solid var(--error-color);
    background-color: var(--error-background);
  }

  .progress-bar {
    height: 8px;
    background-color: var(--progress-background);
    border-radius: 4px;

    .progress-fill {
      background: linear-gradient(
        90deg,
        var(--success-color),
        var(--warning-color)
      );
      border-radius: 4px;
      transition: width 0.3s ease;
    }
  }
}

.status-badge {
  &.completed {
    background-color: var(--success-color);
  }
  &.in-progress {
    background-color: var(--warning-color);
  }
  &.overdue {
    background-color: var(--error-color);
  }
  &.planned {
    background-color: var(--info-color);
  }
}
```

### 2. Responsive Design Implementation

```typescript
// Responsive layout hook
function useResponsiveLayout() {
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setScreenSize("mobile");
      else if (width < 1024) setScreenSize("tablet");
      else setScreenSize("desktop");
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    screenSize,
    isMobile: screenSize === "mobile",
    isTablet: screenSize === "tablet",
    isDesktop: screenSize === "desktop",
  };
}
```

### 3. Loading States and Skeletons

```typescript
// Enhanced loading skeleton component
const MaintenanceEventSkeleton: React.FC = () => (
  <Card className="animate-pulse">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2 w-3/4" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
);
```

## Performance Optimization Design

### 1. Virtual Scrolling Implementation

```typescript
// Virtual scrolling for large datasets
function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight,
    }));
  }, [items, itemHeight, containerHeight, scrollTop]);

  return {
    visibleItems,
    totalHeight: items.length * itemHeight,
    onScroll: (e: React.UIEvent) => setScrollTop(e.currentTarget.scrollTop),
  };
}
```

### 2. Caching Strategy

```typescript
// Intelligent caching system
class DataCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl = this.TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

## Database Schema Enhancements

### Enhanced Maintenance Event Model

```python
class EnhancedMaintenanceEvent(SQLModel, table=True):
    # Existing fields...

    # New fields for enhanced functionality
    completion_percentage: Optional[float] = Field(default=0.0)
    category: Optional[str] = Field(default=None)
    last_status_change: Optional[datetime] = Field(default=None)
    status_change_reason: Optional[str] = Field(default=None)

    # Relationships
    statistics: Optional["EventStatistics"] = Relationship(back_populates="event")
    requester_breakdown: List["RequesterBreakdown"] = Relationship(back_populates="event")
```

### New Statistics Models

```python
class EventStatistics(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: str = Field(foreign_key="maintenanceevent.id")
    total_planned_inspections: int = Field(default=0)
    active_inspections: int = Field(default=0)
    completed_inspections: int = Field(default=0)
    first_time_inspections_count: int = Field(default=0)
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    event: Optional[EnhancedMaintenanceEvent] = Relationship(back_populates="statistics")

class RequesterBreakdown(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: str = Field(foreign_key="maintenanceevent.id")
    requester: str
    department: str
    planned_count: int = Field(default=0)
    active_count: int = Field(default=0)
    completed_count: int = Field(default=0)
    total_count: int = Field(default=0)

    # Relationships
    event: Optional[EnhancedMaintenanceEvent] = Relationship(back_populates="requester_breakdown")
```

## Testing Strategy

### 1. Integration Testing

```python
# Backend integration tests
class TestEnhancedDailyReportsIntegration:
    def test_get_filtered_events_with_real_data(self):
        """Test filtering with actual database data"""

    def test_real_time_updates_propagation(self):
        """Test WebSocket notifications"""

    def test_statistics_calculation_accuracy(self):
        """Test statistics calculations with real data"""

    def test_performance_with_large_datasets(self):
        """Test performance with 1000+ events"""
```

### 2. Frontend Integration Testing

```typescript
// Frontend integration tests
describe("Enhanced Daily Reports Integration", () => {
  test("loads real data from API", async () => {
    // Test actual API integration
  });

  test("handles API errors gracefully", async () => {
    // Test error handling
  });

  test("updates UI in real-time", async () => {
    // Test WebSocket integration
  });

  test("maintains performance with large datasets", async () => {
    // Test virtual scrolling and performance
  });
});
```

## Deployment and Monitoring

### 1. Performance Monitoring

```typescript
// Performance monitoring setup
class PerformanceMonitor {
  static trackPageLoad(pageName: string): void {
    const startTime = performance.now();

    window.addEventListener("load", () => {
      const loadTime = performance.now() - startTime;
      this.sendMetric("page_load_time", loadTime, { page: pageName });
    });
  }

  static trackApiCall(
    endpoint: string,
    duration: number,
    success: boolean
  ): void {
    this.sendMetric("api_call_duration", duration, {
      endpoint,
      success: success.toString(),
    });
  }
}
```

### 2. Error Tracking

```typescript
// Error tracking and reporting
class ErrorTracker {
  static trackError(error: Error, context: string): void {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Send to monitoring service
    this.sendErrorReport(errorInfo);
  }
}
```

This design provides a comprehensive approach to integrating the existing Enhanced Daily Reports components with proper backend connectivity, addressing UI/UX issues, and implementing performance optimizations and error handling.

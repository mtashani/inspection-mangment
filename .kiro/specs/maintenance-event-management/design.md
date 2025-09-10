# Design Document

## Overview

This design document outlines the comprehensive enhancement of the Maintenance Event Management system to support hierarchical event structures, inspection planning, equipment tracking, and enhanced reporting capabilities. The system will integrate with existing inspection workflows while providing improved UX through better data organization and status tracking.

## Architecture

### System Components

The system follows a domain-driven design approach with clear separation between:

1. **Maintenance Domain**: Manages events, sub-events, and planning
2. **Inspection Domain**: Handles inspection workflows and daily reports
3. **Equipment Domain**: Manages equipment associations and status
4. **Reporting Domain**: Provides analytics and status reporting

### Data Flow

```
Maintenance Event → Sub-Events (optional) → Planned Inspections → Active Inspections → Daily Reports
                                        ↓
                                   Equipment Status Updates
```

## Components and Interfaces

### Backend Components

#### 1. Enhanced Maintenance Event Models

**MaintenanceEvent Model Extensions:**
- Add `event_category` field to distinguish simple vs complex events
- Add `planned_inspections` relationship for inspection planning
- Add `completion_statistics` computed property
- Add `requester_breakdown` computed property

**New InspectionPlan Model:**
```python
class InspectionPlan(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    maintenance_event_id: Optional[int] = Field(foreign_key="maintenance_events.id")
    maintenance_sub_event_id: Optional[int] = Field(foreign_key="maintenance_sub_events.id")
    equipment_tag: str
    requester: str  # Department or person requesting inspection
    priority: InspectionPriority
    description: Optional[str] = None
    status: InspectionPlanStatus = Field(default=InspectionPlanStatus.Planned)
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

**New Enums:**
```python
class InspectionPlanStatus(str, Enum):
    Planned = "Planned"
    InProgress = "InProgress"  # When actual inspection starts
    Completed = "Completed"
    Cancelled = "Cancelled"

class MaintenanceEventCategory(str, Enum):
    Simple = "Simple"  # Direct inspections (Normal Interval)
    Complex = "Complex"  # Has sub-events (Overhaul)
```

#### 2. Enhanced Inspection Model

**Inspection Model Extensions:**
- Add `inspection_plan_id` foreign key to link with planning
- Enhance `requesting_department` to store specific requester info
- Add validation to prevent multiple active inspections per equipment
- Add service method to determine if inspection is first-time for equipment

#### 3. First-Time Inspection Detection Service

**InspectionHistoryService:**
```python
class InspectionHistoryService:
    @staticmethod
    def is_first_time_inspection(equipment_tag: str, session: Session) -> bool:
        """Determine if this is the first inspection for equipment"""
        existing_inspections = session.exec(
            select(Inspection).where(
                Inspection.equipment.has(Equipment.tag == equipment_tag)
            )
        ).all()
        return len(existing_inspections) == 0
    
    @staticmethod
    def get_equipment_inspection_count(equipment_tag: str, session: Session) -> int:
        """Get total number of inspections for equipment"""
        return len(session.exec(
            select(Inspection).where(
                Inspection.equipment.has(Equipment.tag == equipment_tag)
            )
        ).all())
```

#### 4. New API Endpoints

**Inspection Planning Endpoints:**
```
POST /api/v1/maintenance/events/{event_id}/inspections/plan
GET /api/v1/maintenance/events/{event_id}/inspections/planned
PUT /api/v1/maintenance/inspections/plan/{plan_id}
DELETE /api/v1/maintenance/inspections/plan/{plan_id}
```

**Enhanced Reporting Endpoints:**
```
GET /api/v1/maintenance/events/{event_id}/statistics
GET /api/v1/maintenance/events/{event_id}/requester-breakdown
GET /api/v1/maintenance/events/{event_id}/equipment-status
```

**Filtering and Search Endpoints:**
```
GET /api/v1/maintenance/events/{event_id}/inspections?date_from=&date_to=&status=&inspector=&equipment_tag=
GET /api/v1/maintenance/inspections/search?q={equipment_tag}&event_id=&status=
GET /api/v1/maintenance/events/{event_id}/daily-reports?date_from=&date_to=&inspector=
```

### Frontend Components

#### 1. Enhanced Daily Reports Page Structure

**New Hierarchical Component Structure:**
```
EnhancedDailyReportsPage
├── MaintenanceEventGroup
│   ├── MaintenanceEventHeader
│   ├── SubEventsList (if complex event)
│   │   └── SubEventGroup
│   │       ├── PlannedInspectionsList
│   │       ├── ActiveInspectionsList
│   │       └── CompletedInspectionsList
│   └── DirectInspectionsList (if simple event)
└── MaintenanceEventStatistics
```

#### 2. New Components

**MaintenanceEventGroup Component:**
- Displays event header with status, dates, and progress
- Shows sub-events in expandable/collapsible format
- Displays inspection statistics and equipment status
- Provides action buttons for event management

**InspectionPlanningModal Component:**
- Form for adding equipment to event/sub-event planning
- Equipment tag selection with validation
- Requester selection/input
- Priority and date setting

**EventStatusIndicator Component:**
- Visual status indicator (Planning/In Progress/Completed)
- Progress bar showing completion percentage
- Status change controls for authorized users

**FilterAndSearchPanel Component:**
- Date range picker for inspection filtering
- Status dropdown filter (Planned/In Progress/Completed)
- Inspector multi-select filter
- Equipment tag search with autocomplete
- Requester filter dropdown
- Clear all filters button

#### 3. Enhanced Data Types

**Frontend Type Extensions:**
```typescript
interface EnhancedMaintenanceEvent extends MaintenanceEvent {
  category: 'Simple' | 'Complex'
  plannedInspections: InspectionPlan[]
  activeInspections: Inspection[]
  completedInspections: Inspection[]
  statistics: EventStatistics
  requesterBreakdown: RequesterBreakdown[]
}

interface InspectionPlan {
  id: string
  equipmentTag: string
  requester: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  status: 'Planned' | 'InProgress' | 'Completed' | 'Cancelled'
  description?: string
  plannedStartDate?: string
  plannedEndDate?: string
}

interface EventStatistics {
  totalPlannedInspections: number
  activeInspections: number
  completedInspections: number
  firstTimeInspectionsCount: number  // Calculated by system
  equipmentStatusBreakdown: {
    planned: number
    underInspection: number
    completed: number
  }
}

interface FilterOptions {
  dateRange?: {
    from: string
    to: string
  }
  status?: InspectionStatus[]
  inspectors?: string[]
  equipmentTag?: string
  requester?: string[]
}
```

## Data Models

### Database Schema Changes

#### New Tables

**inspection_plans:**
```sql
CREATE TABLE inspection_plans (
    id SERIAL PRIMARY KEY,
    maintenance_event_id INTEGER REFERENCES maintenance_events(id),
    maintenance_sub_event_id INTEGER REFERENCES maintenance_sub_events(id),
    equipment_tag VARCHAR(100) NOT NULL,
    requester VARCHAR(200) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Planned',
    planned_start_date DATE,
    planned_end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_event_or_sub_event CHECK (
        (maintenance_event_id IS NOT NULL AND maintenance_sub_event_id IS NULL) OR
        (maintenance_event_id IS NULL AND maintenance_sub_event_id IS NOT NULL)
    )
);
```

#### Modified Tables

**maintenance_events:**
- Add `event_category` ENUM('Simple', 'Complex') DEFAULT 'Simple'

**inspections:**
- Add `inspection_plan_id` INTEGER REFERENCES inspection_plans(id)
- Add `requester_details` JSONB for storing detailed requester information

### Data Relationships

```
MaintenanceEvent (1) → (0..n) MaintenanceSubEvent
MaintenanceEvent (1) → (0..n) InspectionPlan (for Simple events)
MaintenanceSubEvent (1) → (0..n) InspectionPlan (for Complex events)
InspectionPlan (1) → (0..1) Inspection (when inspection starts)
Inspection (1) → (0..n) DailyReport
```

## Error Handling

### Business Logic Validations

1. **Equipment Inspection Constraint:**
   - Prevent creating new inspection if equipment has active inspection
   - Validate equipment exists before creating inspection plan
   - Check equipment is not already planned in same event/sub-event

2. **Event Status Transitions:**
   - Only allow status changes following valid workflow
   - Prevent deletion of events with active inspections
   - Validate date ranges for events and sub-events

3. **Inspection Plan Validations:**
   - Ensure either event_id or sub_event_id is provided (not both)
   - Validate requester information is complete
   - Check planned dates are within event/sub-event timeframe

4. **First-Time Inspection Detection:**
   - System automatically determines if inspection is first-time by checking inspection history
   - Service method queries previous inspections for same equipment
   - No user input required for this determination

### Error Response Format

```typescript
interface ApiError {
  error: string
  message: string
  details?: {
    field?: string
    constraint?: string
    suggestion?: string
  }
}
```

### Frontend Error Handling

- Toast notifications for user actions
- Form validation with inline error messages
- Graceful degradation for network issues
- Retry mechanisms for failed API calls

## Testing Strategy

### Backend Testing

1. **Unit Tests:**
   - Model validation tests
   - Business logic service tests
   - API endpoint tests with various scenarios

2. **Integration Tests:**
   - Database constraint testing
   - Cross-domain service integration
   - API workflow testing

3. **Test Scenarios:**
   - Creating simple vs complex events
   - Planning inspections for different event types
   - Status transition workflows
   - Equipment constraint validations
   - Requester breakdown calculations

### Frontend Testing

1. **Component Tests:**
   - MaintenanceEventGroup rendering
   - InspectionPlanningModal functionality
   - Status indicator behavior

2. **Integration Tests:**
   - API integration with mock data
   - User workflow testing
   - Error handling scenarios

3. **E2E Tests:**
   - Complete maintenance event lifecycle
   - Inspection planning and execution
   - Reporting and statistics viewing

### Test Data

**Sample Maintenance Events:**
- Normal Interval 2025 (Simple event with direct inspections)
- Overhaul 2025 (Complex event with sub-events: GTU6, GTU7, etc.)
- Emergency Repair (Simple event with high priority inspections)

**Sample Equipment:**
- Various equipment tags with different inspection histories
- Equipment with active vs completed inspections
- First-time inspection equipment

## Implementation Considerations

### Performance Optimizations

1. **Database Queries:**
   - Use eager loading for related data
   - Implement pagination for large datasets
   - Add database indexes for frequently queried fields

2. **Frontend Optimizations:**
   - Implement virtual scrolling for large lists
   - Use React.memo for expensive components
   - Implement proper loading states
   - Debounce search inputs to reduce API calls
   - Cache filter options and search results

### Security Considerations

1. **Authorization:**
   - Role-based access for event management
   - Department-based inspection visibility
   - Audit logging for status changes

2. **Data Validation:**
   - Server-side validation for all inputs
   - SQL injection prevention
   - XSS protection for user-generated content

### Scalability Considerations

1. **Database Design:**
   - Proper indexing strategy
   - Archiving strategy for completed events
   - Partitioning for large tables

2. **API Design:**
   - Pagination for all list endpoints
   - Filtering and sorting capabilities
   - Caching strategy for statistics

### Migration Strategy

1. **Database Migration:**
   - Create new tables with proper constraints
   - Migrate existing data to new structure
   - Update foreign key relationships

2. **Frontend Migration:**
   - Gradual component replacement
   - Feature flags for new functionality
   - Backward compatibility during transition

### Monitoring and Logging

1. **Application Monitoring:**
   - API response time tracking
   - Error rate monitoring
   - User action analytics

2. **Business Metrics:**
   - Event completion rates
   - Inspection planning accuracy
   - Equipment utilization statistics
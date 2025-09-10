# Design Document

## Overview

This design document outlines the enhancement of the equipment model and restructuring of the inspection workflow to support maintenance event management and daily reporting. The solution introduces a comprehensive Equipment model, MaintenanceEvent system, enhanced Inspection workflow, and simplified DailyReport structure while removing obsolete model classes.

## Architecture

### Core Components

1. **Equipment Management Layer**: Enhanced Equipment model with comprehensive specifications
2. **Maintenance Event Layer**: New MaintenanceEvent and MaintenanceSubEvent models for organizing maintenance activities
3. **Inspection Workflow Layer**: Enhanced Inspection model with event association and department tracking
4. **Daily Reporting Layer**: Simplified DailyReport model focused on inspection progress tracking
5. **Data Migration Layer**: Migration strategy for removing obsolete models

### Data Flow

```
MaintenanceEvent Creation → SubEvent Creation (optional) → Inspection Registration → Daily Reports → Final Report → Event Completion
```

## Components and Interfaces

### 1. Enhanced Equipment Model

**Location**: `backend/app/domains/equipment/models/equipment.py`

**Key Changes**:
- Add TAG field as unique identifier
- Add train, equipment_type fields
- Enhance operating parameters (pressure, temperature)
- Add inspection_interval_months
- Add p_and_id and data_sheet_path references
- Add inspections relationship

**New Fields**:
```python
tag: str = Field(unique=True, index=True)  # Replaces equipment_code
train: Optional[str] = None
equipment_type: str
# Enhanced existing fields with proper validation
```

### 2. Maintenance Event Management

**Location**: `backend/app/domains/maintenance/models/event.py` (new domain)

**MaintenanceEvent Model**:
- Manages high-level maintenance activities
- Supports event types (routine, overhaul, custom)
- Tracks overall event status and timeline
- Contains multiple inspections

**MaintenanceSubEvent Model**:
- Handles complex maintenance scenarios (e.g., overhaul sub-events)
- Hierarchical relationship with parent events
- Specific to overhaul types (total overhaul, train-specific overhauls)

### 3. Enhanced Inspection Model

**Location**: `backend/app/domains/inspection/models/inspection.py`

**Key Enhancements**:
- Add maintenance_event_id foreign key (optional)
- Add requesting_department with predefined refinery departments
- Enhance status tracking with proper workflow states
- Add final_report field for completion documentation
- Remove obsolete relationships (tasks, findings)

**Department Enum**:
```python
class RefineryDepartment(str, Enum):
    Operations = "Operations"
    Inspection = "Inspection" 
    Maintenance = "Maintenance"
    Engineering = "Engineering"
    Safety = "Safety"
    QualityControl = "QualityControl"
```

### 4. Simplified Daily Report Model

**Location**: `backend/app/domains/daily_report/models/report.py`

**Key Changes**:
- Add inspection_id foreign key (required)
- Add inspectors list (many-to-many relationship)
- Simplify to focus on daily progress tracking
- Remove complex sub-models (InspectionLog, SafetyObservation, PersonnelLog)
- Keep essential fields: date, description, inspectors, attachments

### 5. New Enums and Supporting Models

**RefinerDepartment Enum**: Predefined list of refinery departments
**MaintenanceEventType Enum**: Types of maintenance events
**MaintenanceEventStatus Enum**: Event lifecycle states

## Data Models

### Equipment Model (Enhanced)

```python
class Equipment(SQLModel, table=True):
    __tablename__ = "equipment"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tag: str = Field(unique=True, index=True)  # Primary identifier
    description: Optional[str] = None
    unit: str
    train: Optional[str] = None
    equipment_type: str
    
    # Installation and specifications
    installation_date: Optional[date] = None
    operating_pressure: Optional[float] = None
    operating_temperature: Optional[float] = None
    material: Optional[str] = None
    
    # Maintenance scheduling
    inspection_interval_months: Optional[int] = None
    
    # Documentation references
    p_and_id: Optional[str] = None
    data_sheet_path: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    inspections: List["Inspection"] = Relationship(back_populates="equipment")
```

### MaintenanceEvent Model (New)

```python
class MaintenanceEvent(SQLModel, table=True):
    __tablename__ = "maintenance_events"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    event_number: str = Field(unique=True, index=True)
    title: str
    description: Optional[str] = None
    event_type: MaintenanceEventType
    status: MaintenanceEventStatus = Field(default=MaintenanceEventStatus.Planned)
    
    # Timeline
    planned_start_date: date
    planned_end_date: date
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    
    # Relationships
    sub_events: List["MaintenanceSubEvent"] = Relationship(back_populates="parent_event")
    inspections: List["Inspection"] = Relationship(back_populates="maintenance_event")
```

### Enhanced Inspection Model

```python
class Inspection(SQLModel, table=True):
    __tablename__ = "inspections"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    inspection_number: str = Field(unique=True, index=True)
    title: str
    description: Optional[str] = None
    
    # Timeline
    start_date: date
    end_date: Optional[date] = None
    status: InspectionStatus = Field(default=InspectionStatus.InProgress)
    
    # Associations
    equipment_id: int = Field(foreign_key="equipment.id")
    maintenance_event_id: Optional[int] = Field(foreign_key="maintenance_events.id")
    requesting_department: RefineryDepartment
    
    # Final documentation
    final_report: Optional[str] = None
    
    # Relationships
    equipment: Equipment = Relationship(back_populates="inspections")
    maintenance_event: Optional[MaintenanceEvent] = Relationship(back_populates="inspections")
    daily_reports: List["DailyReport"] = Relationship(back_populates="inspection")
```

### Simplified DailyReport Model

```python
class DailyReport(SQLModel, table=True):
    __tablename__ = "daily_reports"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    inspection_id: int = Field(foreign_key="inspections.id")
    report_date: date
    description: str
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    inspection: Inspection = Relationship(back_populates="daily_reports")
    inspectors: List["Inspector"] = Relationship(
        back_populates="daily_reports",
        link_model="DailyReportInspector"
    )
```

## Error Handling

### Validation Rules

1. **Equipment TAG Uniqueness**: Enforce unique TAG constraints with proper error messages
2. **Inspection Timeline Validation**: Ensure end_date >= start_date when provided
3. **Event Association Validation**: Validate that inspections can only be associated with active maintenance events
4. **Department Validation**: Ensure requesting_department is from predefined enum values
5. **Status Transition Validation**: Implement proper state machine for inspection status changes

### Error Response Format

```python
{
    "error": "ValidationError",
    "message": "Equipment TAG must be unique",
    "field": "tag",
    "code": "DUPLICATE_TAG"
}
```

## Testing Strategy

### Unit Tests

1. **Model Validation Tests**:
   - Equipment TAG uniqueness
   - Inspection timeline validation
   - Enum value validation
   - Relationship integrity

2. **Business Logic Tests**:
   - Maintenance event workflow
   - Inspection status transitions
   - Daily report association validation

### Integration Tests

1. **Database Migration Tests**:
   - Verify data preservation during model removal
   - Test foreign key constraint updates
   - Validate relationship mappings

2. **API Endpoint Tests**:
   - Equipment CRUD operations
   - Maintenance event management
   - Inspection workflow operations
   - Daily report submission

### Migration Testing

1. **Data Migration Validation**:
   - Verify existing equipment data maps correctly to new structure
   - Ensure inspection data integrity during model changes
   - Test removal of obsolete model data

2. **Rollback Testing**:
   - Verify ability to rollback migrations if needed
   - Test data recovery procedures

## Migration Strategy

### Phase 1: Model Creation
- Create new MaintenanceEvent and MaintenanceSubEvent models
- Enhance Equipment model with new fields
- Create new enums and supporting structures

### Phase 2: Inspection Model Enhancement
- Add new fields to Inspection model
- Create relationships with Equipment and MaintenanceEvent
- Migrate existing inspection data

### Phase 3: Daily Report Simplification
- Simplify DailyReport model
- Create new inspector relationship
- Migrate essential daily report data

### Phase 4: Model Cleanup
- Remove obsolete model classes:
  - MaintenanceRecord, SparePart, EquipmentCategory, EquipmentStatus
  - EquipmentCondition, MaintenanceType, InspectionTask, InspectionFinding
  - InspectionSchedule, FindingSeverity, InspectionPriority, InspectionLog
  - SafetyObservation, PersonnelLog, DailyReportInspector, ReportStatus
  - WeatherCondition, InspectionType, WorkType, SafetyRating
- Clean up unused enum imports
- Update API endpoints and services

### Data Preservation Strategy

1. **Critical Data Backup**: Create backup of all existing data before migration
2. **Selective Migration**: Migrate essential data from removed models to new structure
3. **Archive Strategy**: Archive removed model data in separate tables for historical reference
4. **Validation Checkpoints**: Implement validation at each migration phase
# Requirements Document: Maintenance Events & Daily Reports System

## Introduction

This specification addresses the creation of a new comprehensive Maintenance Events & Daily Reports system in frontend-v2. This system replaces the old Enhanced Daily Reports page with a modern, hierarchical navigation structure that provides better organization and context for maintenance events, inspections, and daily reports.

The goal is to create a new "Maintenance Events" page in frontend-v2 with a completely redesigned two-level navigation structure:

**Level 1 - Maintenance Events Overview**: Dashboard showing maintenance events with summary statistics
**Level 2 - Event Details**: Detailed view with tabs for sub-events and inspections, containing daily reports

### Key Changes:
1. **Name Change**: From "Enhanced Daily Reports" to "Maintenance Events" - better reflecting the primary content
2. **Two-Level Architecture**: Maintenance events overview → Event details with tabbed interface
3. **Real Backend Integration**: Replace mock data with actual backend API calls
4. **Enhanced Navigation**: Hierarchical structure (Events → Sub-events → Inspections → Daily Reports)
5. **Design Consistency**: Maintain the new frontend-v2 design system and styling

### Current System Status:
- ✅ Backend APIs for maintenance events (`/api/v1/maintenance/events`)
- ✅ Backend APIs for inspections (`/api/v1/inspections`)
- ✅ Backend APIs for daily reports (`/api/v1/daily-reports`)
- ✅ New frontend-v2 infrastructure with shadcn/ui components
- ❌ Two-level Daily Reports page structure in frontend-v2
- ❌ Real backend integration for hierarchical data display
- ❌ Tabbed interface for sub-events and inspections

## Requirements

### Requirement 1: Two-Level Page Architecture

**User Story:** As a maintenance manager, I want to navigate through maintenance events in a hierarchical structure, so that I can efficiently find and manage daily reports within their proper context.

#### Acceptance Criteria

1. WHEN I navigate to `/maintenance-events` in frontend-v2 THEN the system SHALL display the Maintenance Events Overview page (Level 1)
2. WHEN I click on a maintenance event THEN the system SHALL navigate to `/maintenance-events/{event_id}` (Level 2)
3. WHEN on Level 1 THEN the system SHALL show a list of maintenance events with summary cards
4. WHEN on Level 2 THEN the system SHALL show event details at the top and tabbed content below
5. WHEN the page loads THEN the system SHALL show "Maintenance Events" as the page title
6. WHEN I access any page THEN the system SHALL use the new frontend-v2 design system and components

### Requirement 2: Events Overview Page (Level 1)

**User Story:** As a maintenance manager, I want to see an overview of all maintenance events with key statistics, so that I can quickly assess the current state and navigate to specific events.

#### Acceptance Criteria

1. WHEN the Events Overview page loads THEN the system SHALL fetch maintenance events from `/api/v1/maintenance/events`
2. WHEN displaying events THEN the system SHALL show event cards with title, status, dates, and sub-events count
3. WHEN showing summary statistics THEN the system SHALL display dashboard cards with key metrics (active events, completed events, overdue items, etc.)
4. WHEN I apply global search THEN the system SHALL filter events by event number, title, or equipment tag
5. WHEN I apply status filters THEN the system SHALL show only events matching the selected status
6. WHEN I click on an event card THEN the system SHALL navigate to the Event Details page
7. IF the backend API is unavailable THEN the system SHALL display appropriate error messages with retry options
8. WHEN data is being loaded THEN the system SHALL show loading skeletons using shadcn/ui components

### Requirement 3: Event Details Page (Level 2)

**User Story:** As a maintenance manager, I want to view detailed information about a specific maintenance event with organized tabs for sub-events and inspections, so that I can manage all related activities efficiently.

#### Acceptance Criteria

1. WHEN the Event Details page loads THEN the system SHALL fetch event details from `/api/v1/maintenance/events/{event_id}`
2. WHEN displaying event information THEN the system SHALL show event details at the top (title, status, dates, description)
3. WHEN the event has sub-events THEN the system SHALL display tabs for each sub-event plus a "Direct Inspections" tab
4. WHEN the event has no sub-events THEN the system SHALL display only the "Inspections" tab
5. WHEN I click on a tab THEN the system SHALL show the list of inspections for that sub-event or direct inspections
6. WHEN displaying inspections THEN the system SHALL show them as expandable cards with daily reports nested inside
7. WHEN I expand an inspection THEN the system SHALL show the list of daily reports for that inspection
8. WHEN tabs have content THEN the system SHALL display badge numbers indicating the count of inspections in each tab

### Requirement 4: Tabbed Interface and Navigation

**User Story:** As a maintenance manager, I want to navigate between sub-events and inspections using tabs, so that I can organize and access related information efficiently.

#### Acceptance Criteria

1. WHEN displaying tabs THEN the system SHALL use shadcn/ui Tabs component with horizontal orientation
2. WHEN a tab contains inspections THEN the system SHALL show a badge with the count of inspections
3. WHEN I click on a tab THEN the system SHALL switch to show inspections for that sub-event
4. WHEN inspections are loading THEN the system SHALL show loading skeletons within the tab content
5. WHEN a tab has no inspections THEN the system SHALL show an empty state message
6. WHEN tabs overflow on mobile THEN the system SHALL provide horizontal scrolling
7. WHEN the active tab changes THEN the system SHALL update the URL to maintain state on refresh

### Requirement 5: Inspection and Daily Reports Display

**User Story:** As a maintenance manager, I want to view inspections as expandable cards with nested daily reports, so that I can see the hierarchical relationship and manage reports efficiently.

#### Acceptance Criteria

1. WHEN displaying inspections THEN the system SHALL show them as cards with sticky headers containing inspection details
2. WHEN an inspection card is collapsed THEN the system SHALL show inspection summary (number, title, status, equipment tag)
3. WHEN I click on an inspection card THEN the system SHALL expand to show the list of daily reports
4. WHEN displaying daily reports THEN the system SHALL show them as compact cards within the expanded inspection
5. WHEN I create a new daily report THEN the system SHALL show a create button within the inspection card
6. WHEN inspection status changes THEN the system SHALL update the visual indicators (colors, badges)
7. WHEN daily reports are loading THEN the system SHALL show loading indicators within the inspection card

### Requirement 6: Search and Filtering System

**User Story:** As a maintenance manager, I want to search and filter at both the events level and within specific events, so that I can quickly find relevant information at the appropriate scope.

#### Acceptance Criteria

1. WHEN on Events Overview page THEN the system SHALL provide global search by event number, title, or equipment tag
2. WHEN on Event Details page THEN the system SHALL provide scoped search within that event's inspections
3. WHEN I enter a search query on Event Details THEN the system SHALL highlight matching inspections and daily reports
4. WHEN search results are found THEN the system SHALL use visual highlighting (background color, badges)
5. WHEN I apply filters THEN the system SHALL show filter indicators on relevant tabs and cards
6. WHEN I clear search/filters THEN the system SHALL reset highlighting and show all items
7. WHEN search is active THEN the system SHALL update the URL to maintain search state on refresh

### Requirement 7: Visual Indicators and Highlighting

**User Story:** As a maintenance manager, I want clear visual indicators for status, counts, and search results, so that I can quickly identify important information and navigate efficiently.

#### Acceptance Criteria

1. WHEN displaying tabs THEN the system SHALL show numeric badges indicating the count of inspections in each tab
2. WHEN search is active THEN the system SHALL highlight matching text in inspection titles and equipment tags
3. WHEN inspections have different statuses THEN the system SHALL use color-coded headers (green for completed, yellow for in-progress, red for overdue)
4. WHEN an inspection has daily reports THEN the system SHALL show a badge with the count of reports
5. WHEN items are overdue THEN the system SHALL use visual indicators (red borders, warning icons)
6. WHEN hovering over cards THEN the system SHALL provide subtle hover effects for better interactivity
7. WHEN tabs are active THEN the system SHALL use clear visual distinction for the selected tab

### Requirement 8: CRUD Operations and Data Management

**User Story:** As a maintenance manager, I want to create, edit, and delete daily reports within the context of their inspections, so that I can maintain accurate records efficiently.

#### Acceptance Criteria

1. WHEN I click "Create Report" within an inspection THEN the system SHALL open a modal with the inspection context pre-filled
2. WHEN I create a daily report THEN the system SHALL call `POST /api/v1/daily-reports` and refresh the inspection data
3. WHEN I edit a daily report THEN the system SHALL call `PUT /api/v1/daily-reports/{id}` with updated data
4. WHEN I delete a daily report THEN the system SHALL show confirmation dialog and call `DELETE /api/v1/daily-reports/{id}`
5. WHEN CRUD operations complete THEN the system SHALL update the UI optimistically and show success notifications
6. WHEN operations fail THEN the system SHALL show error messages and revert optimistic updates
7. WHEN data changes THEN the system SHALL update badge counts and visual indicators accordingly

### Requirement 9: Layout and Navigation Integration

**User Story:** As a user, I want the Maintenance Events page to have consistent layout with sidebar and navigation bar like other pages in the system, so that I have a familiar and consistent user experience.

#### Acceptance Criteria

1. WHEN the Maintenance Events page loads THEN the system SHALL display the standard sidebar navigation
2. WHEN the page renders THEN the system SHALL show the top navigation bar with user menu and system controls
3. WHEN I navigate between Events Overview and Event Details THEN the system SHALL maintain the sidebar and navigation bar
4. WHEN on mobile devices THEN the system SHALL provide collapsible sidebar functionality
5. WHEN the sidebar is collapsed THEN the system SHALL adjust the main content area accordingly
6. WHEN I use breadcrumb navigation THEN the system SHALL show the current location (Maintenance Events > Event Name)
7. WHEN the page layout renders THEN the system SHALL follow the same layout patterns as other pages in frontend-v2

### Requirement 10: Design System Consistency

**User Story:** As a user, I want the Daily Reports page to have consistent design, spacing, and visual hierarchy with other pages in the system, so that I have a familiar and professional user experience.

#### Acceptance Criteria

1. WHEN displaying components THEN the system SHALL use only shadcn/ui components and design tokens
2. WHEN applying spacing THEN the system SHALL use standard Tailwind spacing classes (p-4, gap-4, space-y-4, etc.)
3. WHEN showing cards THEN the system SHALL use the standard Card component with consistent padding and borders
4. WHEN displaying text THEN the system SHALL use semantic typography classes (text-lg, font-semibold, text-muted-foreground)
5. WHEN using colors THEN the system SHALL use CSS variables (hsl(var(--primary)), hsl(var(--muted-foreground)))
6. WHEN creating layouts THEN the system SHALL follow the grid system patterns (grid gap-4 md:grid-cols-2 lg:grid-cols-4)
7. WHEN showing interactive elements THEN the system SHALL use consistent hover states and transitions
8. WHEN the page renders THEN the system SHALL maintain visual hierarchy with proper heading levels and content structure

### Requirement 11: Performance and Responsive Design

**User Story:** As a user, I want the Daily Reports page to perform well and work on all devices, so that I can access information efficiently regardless of my device.

#### Acceptance Criteria

1. WHEN using the page on mobile THEN the system SHALL provide touch-friendly interactions and responsive layout
2. WHEN loading large lists THEN the system SHALL use efficient rendering techniques (virtualization if needed)
3. WHEN data is cached THEN the system SHALL use TanStack Query for optimal performance and state management
4. WHEN navigating between pages THEN the system SHALL maintain smooth transitions and preserve scroll positions
5. WHEN network is slow THEN the system SHALL show appropriate loading states and allow progressive loading
6. WHEN the page renders THEN the system SHALL follow accessibility guidelines for screen readers and keyboard navigation
# PSV Management System Implementation Plan

## 1. Database Schema Updates

### New Tables Required
1. PSVs Table
   ```sql
   CREATE TABLE psvs (
     id SERIAL PRIMARY KEY,
     tag TEXT NOT NULL,
     location TEXT NOT NULL,
     unit TEXT,
     pop_pressure FLOAT NOT NULL,
     type TEXT NOT NULL,  -- (open bonnet, pilot, etc.)
     test_medium TEXT NOT NULL, -- (air, water, nitrogen, steam)
     max_leakage FLOAT,
     calibration_interval INTEGER NOT NULL, -- in months
     created_at TIMESTAMP DEFAULT NOW()
   )
   ```

2. PSV Calibrations Table
   ```sql
   CREATE TABLE psv_calibrations (
     id SERIAL PRIMARY KEY,
     psv_id INTEGER REFERENCES psvs(id),
     calibration_date DATE NOT NULL,
     work_performed TEXT[], -- (cleaning, calibration, repair)
     test_medium TEXT NOT NULL,
     work_order_number TEXT,
     inspector_id INTEGER REFERENCES inspectors(id),
     operator_id INTEGER REFERENCES users(id),
     approver_id INTEGER REFERENCES users(id),
     initial_pop_pressure FLOAT,
     final_pop_pressure FLOAT,
     initial_leakage FLOAT,
     final_leakage FLOAT,
     workshop_entry_pressure FLOAT,
     workshop_exit_pressure FLOAT,
     created_at TIMESTAMP DEFAULT NOW()
   )
   ```

## 2. Backend API Routes

### PSV Management Routes
1. GET /api/psvs
   - List all PSVs with pagination and filtering
   - Include summary statistics in response

2. GET /api/psvs/{id}
   - Get detailed PSV information
   - Include calibration history

3. POST /api/psvs
   - Create new PSV

4. PUT /api/psvs/{id}
   - Update PSV information

### PSV Calibration Routes
1. GET /api/psvs/{id}/calibrations
   - List calibration history for specific PSV

2. POST /api/psvs/{id}/calibrations
   - Add new calibration record

3. GET /api/psv-analytics
   - Get monthly calibration statistics
   - Include historical tracking data

## 3. Frontend Implementation

### A. PSV Dashboard Page (/psvs)
1. Summary Statistics Section
   - Total PSVs counter
   - Currently under calibration counter
   - Out of calibration counter
   - Due next month counter
   - Never calibrated counter
   - Each with regular and spare counts

2. PSV List Table
   - Implement using existing data-table component
   - Columns:
     * PSV Tag
     * Location/Unit
     * Last Calibration Date
     * Next Calibration Date
     * Calibration Count
     * Pop Pressure
     * Type
     * Test Medium
     * Max Leakage
   - Features:
     * Column selection
     * Filtering per column
     * Color coding toggle button
     * Pagination
     * Sorting

### B. PSV Details Page (/psvs/[id])
1. PSV Information Section
   - Display all PSV details
   - Edit capability

2. Calibration History Section
   - Table showing all calibration records
   - Columns:
     * Calibration Date
     * Work Performed
     * Test Medium
     * Work Order
     * Personnel Information
     * Pressure Readings
     * Leakage Values

3. New Calibration Dialog
   - Form fields for all calibration data
   - Validation
   - Save functionality

### C. PSV Analytics Page (/psv-analytics)
1. Monthly Calibration Charts
   - Bar charts showing:
     * Total PSVs due for calibration
     * PSVs calibrated
     * PSVs remaining
   - Historical tracking
   - Color coding for status
   - Auto-generation on month-end

## 4. Implementation Phases

### Phase 1: Core Infrastructure
1. Database schema updates
2. Basic API endpoints
3. PSV dashboard page with list view

### Phase 2: PSV Details
1. Individual PSV page
2. Calibration history view
3. New calibration form

### Phase 3: Analytics
1. Monthly statistics calculation
2. Analytics page with charts
3. Automated report generation

### Phase 4: Enhancements
1. Color coding system
2. Advanced filtering
3. Export functionality
4. Notification system for upcoming calibrations

## 5. Technical Considerations

1. Use existing components:
   - data-table for lists
   - dialog for forms
   - card for summary stats

2. Data Refresh Strategy:
   - Real-time updates for calibration entries
   - Daily cache for analytics
   - Monthly generation of reports

3. Color Coding Scheme:
   - Red (Dark): Never calibrated
   - Red: Calibration overdue
   - Orange/Yellow: Due next month
   - White: In compliance
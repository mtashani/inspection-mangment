# PSV System Upgrade Plan

## 1. Database Schema Changes

### PSV Table
- Tag Number (string, Primary Key)
- Unique No (string)
- Status (enum: "Spare", "Main")
- Frequency (integer, months)
- Last Calibration Date (datetime)
- Expire Date (datetime, calculated)
- Unit (string)
- Train (string)
- Type of PSV (string)
- Serial No (string)
- SET Pressure (float, Barg)
- CDTP (float, Barg)
- Back Pressure (float, Barg)
- NPS (string)
- Inlet Size (string)
- Inlet Rating (string)
- Outlet Size (string)
- Outlet Rating (string)
- P&ID (string)
- Line Number (string)
- Service (string)  // Used for Level 4 CoF calculation
- Data Sheet No (string)
- Manufacturer (string)

### Calibration Table
- ID (Primary Key)
- Tag Number (Foreign Key to PSV)
- Calibration Date (datetime)
- Work Maintenance (enum: ["Adjust", "Cleaning", "Lapping"])
- Change Parts (text)
- Test Medium (enum: ["Nitrogen", "Air", "Steam", "Water"])
- Inspector (string)
- Test Operator (string)
- General Condition (text)
- Approved By (string)
- Work NO (string)
- Pre Repair Pop Test (float, nullable) // For Level 2+ RBI
- Pre Repair Leak Test (float, nullable) // For Level 2+ RBI
- Post Repair Pop Test (float)
- Post Repair Leak Test (float)

// Level 3 Assessment Fields (1-5 scale)
- Body Condition Score (integer, 1-5)
- Body Condition Notes (text)
- Internal Parts Score (integer, 1-5)
- Internal Parts Notes (text)
- Seat Plug Condition Score (integer, 1-5)
- Seat Plug Notes (text)

### RBI Configuration Table
- ID (Primary Key)
- Level (integer, 1-4)
- Name (string)
- Description (text)
- Active (boolean)
- Settings (JSON)
  - Fixed interval (for Level 1)
  - Pop test thresholds
  - Leak test thresholds
  - Parameter weights
  - Risk matrix configuration
  - Service risk categories (Level 4)

### Service Risk Categories Table (Level 4)
- ID (Primary Key)
- Service Type (string)
- CoF Score (integer, 1-5)  // Consequence of Failure score based on API 581
- Description (text)
- Notes (text)

## 2. Frontend Components

### PSV Management Views
1. PSV List View
   - Enhanced data table with RBI status indicators
   - Filterable by all fields
   - Export functionality
   - Bulk actions

2. PSV Detail View
   - Basic information
   - Calibration history
   - RBI assessment history
   - Risk trends
   - Maintenance history

3. Calibration Data Entry Form
   - Dynamic fields based on RBI level
   - Pre-repair test data (Level 2+)
   - Post-repair test data
   - Level 3 assessment inputs (1-5 scale):
     - Body condition assessment
     - Internal parts assessment
     - Seat/plug condition assessment
   - Validation rules

4. RBI Configuration Dashboard
   - Level selection
   - Threshold configuration
   - Weight configuration
   - Risk matrix setup
   - Service risk category configuration (Level 4)

### New Components Needed
1. `RiskMatrixVisualization.tsx`
   - Visual representation of risk levels (5x5 matrix per API 581)
   - Interactive cells
   - Color coding

2. `RBIConfigurationForm.tsx`
   - Multi-step configuration wizard
   - Parameter weight inputs
   - Threshold setting inputs
   - Service risk category management

3. `CalibrationAssessment.tsx`
   - Pre/post repair test comparisons
   - Trend visualization
   - Risk calculation display
   - Condition assessment form (1-5 scale)

4. `ServiceRiskManager.tsx`
   - Service type configuration
   - CoF score assignment
   - Risk category management

## 3. RBI Implementation

### Level 1 (Fixed Interval)
- Simple time-based calculation
- Configuration for default intervals
- Override capabilities

### Level 2 (Test Results Based)
1. Data Collection
   - Pre-repair test results
   - Post-repair test results
   - Historical trends

2. Calculations
   - Deviation from setpoint
   - Leak rate changes
   - Time-based degradation rate

3. Risk Assessment
   - Score normalization (1-5)
   - Weighted calculations
   - Risk matrix mapping

### Level 3 (Enhanced Assessment)
1. Condition Assessment (PoF Calculation)
   - Body condition evaluation (1-5 scale)
   - Internal parts evaluation (1-5 scale)
   - Seat/plug condition assessment (1-5 scale)
   
2. Scoring System
   - Detailed scoring criteria for each level (1-5)
   - Weighted impact calculation
   - Final PoF score calculation

3. Risk Calculation
   - Combined assessment scores
   - Integration with Level 2 calculations
   - Final risk matrix mapping

### Level 4 (API 581 Based Assessment)
1. PoF Calculation
   - Uses Level 3 assessment methodology
   - Incorporates historical data

2. CoF Calculation (API 581)
   - Service-based consequence evaluation
   - Pre-configured risk categories (1-5)
   - Based on fluid properties and potential impact

3. Risk Matrix
   - 5x5 matrix per API 581
   - PoF on one axis (from Level 3)
   - CoF on other axis (from service category)
   - Final risk category determination

## 4. API Endpoints

### PSV Management
- `GET /api/psv` - List all PSVs
- `GET /api/psv/{tag}` - Get PSV details
- `POST /api/psv` - Create new PSV
- `PUT /api/psv/{tag}` - Update PSV
- `DELETE /api/psv/{tag}` - Delete PSV

### Calibration
- `GET /api/calibration/{tag}` - Get calibration history
- `POST /api/calibration` - Record new calibration
- `PUT /api/calibration/{id}` - Update calibration
- `DELETE /api/calibration/{id}` - Delete calibration

### RBI Configuration
- `GET /api/rbi/config` - Get RBI configuration
- `PUT /api/rbi/config` - Update RBI configuration
- `POST /api/rbi/calculate/{tag}` - Calculate next calibration date
- `GET /api/rbi/history/{tag}` - Get RBI calculation history

### Service Risk Categories
- `GET /api/service-risk` - List all service risk categories
- `POST /api/service-risk` - Create new service risk category
- `PUT /api/service-risk/{id}` - Update service risk category
- `DELETE /api/service-risk/{id}` - Delete service risk category

## 5. Implementation Phases

### Phase 1: Core Infrastructure
1. Database schema updates
2. Basic API endpoints
3. Updated PSV list and detail views
4. Level 1 RBI implementation

### Phase 2: Enhanced RBI
1. Level 2 RBI implementation
2. Pre/post repair test tracking
3. Risk calculation engine
4. Configuration interface

### Phase 3: Advanced Features
1. Level 3 condition assessment implementation
2. Service risk category management
3. API 581 based risk assessment
4. Risk matrix visualization

### Phase 4: Optimization
1. Performance tuning
2. User experience improvements
3. Batch processing capabilities
4. Advanced filtering and search

## 6. Testing Strategy

### Unit Tests
- RBI calculation functions
- Risk assessment algorithms
- Data validation logic

### Integration Tests
- API endpoints
- Database operations
- RBI workflow

### End-to-End Tests
- Complete calibration workflow
- Configuration changes
- Risk assessment process

## 7. Documentation Requirements

1. User Documentation
   - RBI level explanations
   - Configuration guide
   - Data entry procedures
   - Scoring criteria guidelines
   - API 581 risk assessment methodology

2. Technical Documentation
   - API specifications
   - Database schema
   - Calculation methods
   - Risk matrix implementation

3. Maintenance Documentation
   - Backup procedures
   - Troubleshooting guides
   - Update processes
# Requirements Document

## Introduction

This document outlines the requirements for a Risk-Based Inspection (RBI) Calculation System for refinery equipment. The system will calculate next inspection dates based on qualitative RBI methodology using configurable scoring tables and multi-level calculation approaches. The system integrates with existing inspection report data and provides adaptive fallback mechanisms when complete data is not available.

## Requirements

### Requirement 1: Multi-Level RBI Calculation System

**User Story:** As a maintenance planner, I want the system to support multiple RBI calculation levels (Level 1, 2, 3) so that I can get inspection schedules regardless of data availability.

#### Acceptance Criteria

1. WHEN the system is configured THEN it SHALL support three distinct RBI calculation levels
2. WHEN Level 3 is requested AND sufficient data is available THEN the system SHALL perform fully quantitative RBI calculations
3. WHEN Level 2 is requested AND sufficient data is available THEN the system SHALL perform semi-quantitative RBI calculations using scoring tables
4. WHEN Level 1 is requested THEN the system SHALL perform static calculations using fixed intervals from equipment master data
5. WHEN a higher level cannot be calculated due to insufficient data THEN the system SHALL automatically fallback to the next available level
6. WHEN fallback occurs THEN the system SHALL apply conservative safety factors to compensate for reduced accuracy

### Requirement 2: Configurable Scoring Tables

**User Story:** As a system administrator, I want to configure scoring tables for PoF and CoF parameters so that the RBI calculations reflect our specific operational conditions and standards.

#### Acceptance Criteria

1. WHEN the admin accesses configuration THEN the system SHALL provide interfaces to modify PoF scoring tables
2. WHEN the admin accesses configuration THEN the system SHALL provide interfaces to modify CoF scoring tables for Safety, Environmental, and Economic consequences
3. WHEN scoring tables are updated THEN the system SHALL validate the configuration for completeness and consistency
4. WHEN new fluid types are added THEN the system SHALL allow configuration of their safety and environmental impact scores
5. WHEN scoring table changes are saved THEN the system SHALL apply changes to future calculations without affecting historical results
6. WHEN invalid scoring configurations are detected THEN the system SHALL prevent saving and display clear error messages

### Requirement 3: Equipment Data Integration

**User Story:** As a RBI analyst, I want the system to automatically extract relevant data from equipment master data and inspection reports so that calculations are based on current and historical information.

#### Acceptance Criteria

1. WHEN equipment data is requested THEN the system SHALL retrieve basic equipment information including type, age, service conditions, and design parameters
2. WHEN inspection report data is needed THEN the system SHALL extract relevant RBI parameters from the latest and historical inspection reports
3. WHEN thickness measurement data exists THEN the system SHALL calculate corrosion rates from historical thickness trends
4. WHEN coating condition data is available THEN the system SHALL incorporate coating quality assessments into PoF calculations
5. WHEN damage mechanism observations exist THEN the system SHALL factor active damage mechanisms into risk calculations
6. WHEN data quality is insufficient THEN the system SHALL flag data quality issues and suggest improvements

### Requirement 4: Probability of Failure (PoF) Calculation

**User Story:** As a RBI analyst, I want the system to calculate equipment failure probability based on multiple factors so that inspection intervals reflect actual equipment condition and risk.

#### Acceptance Criteria

1. WHEN PoF calculation is performed THEN the system SHALL consider corrosion rate, equipment age, active damage mechanisms, coating quality, and inspection coverage
2. WHEN corrosion rate data is available THEN the system SHALL apply appropriate scoring based on configured rate ranges
3. WHEN equipment age is known THEN the system SHALL factor age-related degradation into PoF scoring
4. WHEN multiple damage mechanisms are active THEN the system SHALL increase PoF scores accordingly
5. WHEN coating condition is poor THEN the system SHALL increase PoF scores to reflect higher corrosion risk
6. WHEN inspection coverage is inadequate THEN the system SHALL increase PoF scores due to higher uncertainty

### Requirement 5: Consequence of Failure (CoF) Calculation

**User Story:** As a RBI analyst, I want the system to calculate failure consequences across safety, environmental, and economic dimensions so that high-consequence equipment receives appropriate inspection priority.

#### Acceptance Criteria

1. WHEN CoF calculation is performed THEN the system SHALL calculate separate scores for Safety, Environmental, and Economic consequences
2. WHEN safety consequences are calculated THEN the system SHALL consider equipment location, operating pressure, and fluid hazard level
3. WHEN environmental consequences are calculated THEN the system SHALL consider fluid type, inventory size, and containment system effectiveness
4. WHEN economic consequences are calculated THEN the system SHALL consider production impact, repair costs, and downtime duration
5. WHEN multiple consequence types are calculated THEN the system SHALL combine them using configurable weighting factors
6. WHEN consequence calculations are complete THEN the system SHALL categorize overall CoF as Low, Medium, or High

### Requirement 6: Risk Matrix and Inspection Interval Determination

**User Story:** As a maintenance planner, I want the system to determine inspection intervals based on risk matrix results so that inspection schedules are optimized for risk management.

#### Acceptance Criteria

1. WHEN PoF and CoF calculations are complete THEN the system SHALL apply a configurable risk matrix to determine overall risk level
2. WHEN risk level is determined THEN the system SHALL assign base inspection intervals according to configured schedules
3. WHEN risk level is Low THEN the system SHALL assign longer inspection intervals (e.g., 36 months)
4. WHEN risk level is High or Very High THEN the system SHALL assign shorter inspection intervals (e.g., 6-12 months)
5. WHEN fallback has occurred THEN the system SHALL apply conservative adjustment factors to reduce inspection intervals
6. WHEN next inspection date is calculated THEN the system SHALL add the interval to the last inspection date

### Requirement 7: Data Quality Assessment and Intelligent Completion

**User Story:** As a RBI analyst, I want the system to assess data quality and intelligently estimate missing parameters so that calculations can proceed even with incomplete data.

#### Acceptance Criteria

1. WHEN data is extracted THEN the system SHALL assess completeness, accuracy, and timeliness of each parameter
2. WHEN critical data is missing THEN the system SHALL attempt intelligent estimation based on equipment type, service conditions, and historical patterns
3. WHEN corrosion rate is unknown THEN the system SHALL estimate based on service type, equipment age, and industry standards
4. WHEN coating condition is unknown THEN the system SHALL estimate based on equipment age, service severity, and maintenance history
5. WHEN data estimation is performed THEN the system SHALL clearly flag estimated values and reduce confidence scores accordingly
6. WHEN data quality is poor THEN the system SHALL provide specific recommendations for data improvement

### Requirement 8: Learning and Adaptation System

**User Story:** As a RBI analyst, I want the system to learn from inspection results and improve prediction accuracy so that future calculations become more reliable over time.

#### Acceptance Criteria

1. WHEN inspection results are available THEN the system SHALL compare actual findings with predicted risk levels
2. WHEN predictions are consistently over-conservative THEN the system SHALL suggest parameter adjustments to reduce conservatism
3. WHEN predictions are consistently under-conservative THEN the system SHALL automatically apply more conservative factors
4. WHEN equipment families show similar patterns THEN the system SHALL learn and apply these patterns to similar equipment
5. WHEN service-specific degradation patterns are identified THEN the system SHALL adjust scoring tables for that service type
6. WHEN learning adjustments are made THEN the system SHALL track and report on prediction accuracy improvements

### Requirement 9: Comprehensive Reporting and Audit Trail

**User Story:** As a maintenance manager, I want detailed reports on RBI calculations and decisions so that I can understand the basis for inspection schedules and demonstrate compliance.

#### Acceptance Criteria

1. WHEN RBI calculation is complete THEN the system SHALL generate a detailed calculation report showing all input parameters, scores, and decision logic
2. WHEN fallback occurs THEN the system SHALL document the reason for fallback and any adjustments applied
3. WHEN data estimation is used THEN the system SHALL clearly identify estimated parameters and their impact on results
4. WHEN calculation reports are generated THEN they SHALL include confidence scores and data quality assessments
5. WHEN historical calculations exist THEN the system SHALL provide trend analysis showing how risk assessments have changed over time
6. WHEN audit trail is requested THEN the system SHALL provide complete history of all calculations, parameter changes, and system adjustments

### Requirement 10: System Configuration and Administration

**User Story:** As a system administrator, I want comprehensive configuration capabilities so that the RBI system can be tailored to our specific operational requirements and standards.

#### Acceptance Criteria

1. WHEN system configuration is accessed THEN the admin SHALL be able to modify all scoring tables, weighting factors, and calculation parameters
2. WHEN new equipment types are added THEN the admin SHALL be able to configure specific RBI parameters and default values
3. WHEN new fluid types are introduced THEN the admin SHALL be able to define their hazard characteristics and scoring values
4. WHEN inspection interval schedules need adjustment THEN the admin SHALL be able to modify base intervals for each risk level
5. WHEN fallback safety factors require tuning THEN the admin SHALL be able to adjust conservative multipliers
6. WHEN configuration changes are made THEN the system SHALL validate changes and prevent invalid configurations from being saved
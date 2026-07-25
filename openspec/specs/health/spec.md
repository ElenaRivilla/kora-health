# health Specification

## Purpose
TBD - created by archiving change define-initial-specs. Update Purpose after archive.
## Requirements
### Requirement: Health Metrics Tracking
The system SHALL store and display the following health metrics for the user: weight, BMI, body fat percentage, muscle mass, heart rate, heart rate variability (HRV), blood oxygen saturation (SpO2), sleep, daily steps, distance traveled, active calories, resting calories, and VO2 max.

#### Scenario: Metrics available after sync
- **WHEN** health data has been synchronized for the user
- **THEN** the user can view current values for each supported metric

### Requirement: Health Metrics History and Evolution
The system SHALL keep a historical record of each health metric and SHALL present that history as charts showing evolution over time.

#### Scenario: Viewing metric history
- **WHEN** the user opens the history view for a given metric
- **THEN** the system displays a chart of that metric's values over time built from stored historical records

### Requirement: Health Data Ingestion
The system SHALL accept health metric data submitted by the mobile client and persist it against the corresponding user.

#### Scenario: New metric values received
- **WHEN** the mobile client submits new health metric values for the user
- **THEN** the system stores the values and associates them with the correct metric type, timestamp, and user


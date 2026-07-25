# healthkit-integration Specification

## Purpose
TBD - created by archiving change define-initial-specs. Update Purpose after archive.
## Requirements
### Requirement: HealthKit Access Restricted to Mobile Client
The system SHALL access Apple HealthKit exclusively from the Flutter mobile application. The backend SHALL NOT access HealthKit directly, under any circumstance.

#### Scenario: Backend has no HealthKit access path
- **WHEN** the backend needs health data originating from HealthKit
- **THEN** it obtains that data only through requests submitted by the Flutter client, never through a direct HealthKit connection

### Requirement: HealthKit Data Flow
The system SHALL move HealthKit data through the fixed path: HealthKit device data is read by the Flutter app, sent to the backend API over HTTP, and persisted in PostgreSQL.

#### Scenario: HealthKit reading reaches storage
- **WHEN** the Flutter app reads a new value from HealthKit
- **THEN** the app sends that value to the backend API, and the backend persists it in PostgreSQL

### Requirement: User-Controlled HealthKit Sync
The system SHALL only read HealthKit data when the user has enabled HealthKit synchronization for their account.

#### Scenario: Sync disabled
- **WHEN** a user has not enabled HealthKit synchronization
- **THEN** the Flutter app does not read or send HealthKit data on that user's behalf


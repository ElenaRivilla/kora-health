## ADDED Requirements

### Requirement: Single Fixed Development User
Until real authentication exists, the system SHALL operate against a single, fixed, pre-seeded user, and SHALL attribute every API request to that user without requiring credentials.

#### Scenario: Request attributed to the seeded user
- **WHEN** any client request reaches the backend
- **THEN** the backend processes it as belonging to the fixed seeded user, without checking for credentials

### Requirement: Temporary Scope
This capability SHALL be replaced in full once a real authentication capability (login, credentials, multi-user identity) is introduced; it SHALL NOT be extended with additional users or credential handling.

#### Scenario: Real authentication introduced
- **WHEN** a real authentication capability is added to the system
- **THEN** this fixed-user behavior is removed rather than combined with real login

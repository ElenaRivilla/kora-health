## ADDED Requirements

### Requirement: Daily Water Goal
The system SHALL allow the user to configure a daily water intake goal.

#### Scenario: Goal configured
- **WHEN** the user sets a daily water goal
- **THEN** the system stores the goal and uses it to track progress for subsequent days

### Requirement: Quick Water Logging
The system SHALL allow the user to log a water intake entry with a minimal number of interactions.

#### Scenario: Quick log entry
- **WHEN** the user logs a water intake entry
- **THEN** the system records the amount against the current day's total immediately

### Requirement: Water History and Statistics
The system SHALL keep a history of daily water intake and SHALL provide statistics derived from that history.

#### Scenario: Viewing water history
- **WHEN** the user opens the water history view
- **THEN** the system displays past daily totals and summary statistics

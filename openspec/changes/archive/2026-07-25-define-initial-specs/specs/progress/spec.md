## ADDED Requirements

### Requirement: Aggregated Evolution View
The system SHALL present the user's evolution across weight, body composition, nutrition, and sports/workout performance by aggregating data from the `health`, `nutrition-log`, `nutrition-goals`, and `workouts` capabilities.

#### Scenario: Viewing overall evolution
- **WHEN** the user opens the progress view
- **THEN** the system displays evolution data for weight, body composition, nutrition, and workouts over a selectable time range

### Requirement: Trends and Comparisons
The system SHALL compute trends over the user's historical data and SHALL allow comparison between different time periods.

#### Scenario: Comparing two periods
- **WHEN** the user selects two time periods to compare
- **THEN** the system displays the trend and difference between the two periods for the selected metric

### Requirement: Progress Reports
The system SHALL generate reports summarizing the user's progress over a selected time range.

#### Scenario: Report generated
- **WHEN** the user requests a progress report for a time range
- **THEN** the system produces a report covering the relevant metrics for that range

### Requirement: AI-Generated Progress Summaries
The system SHALL use AI to generate personalized summaries and recommendations based on the user's aggregated progress data.

#### Scenario: Summary generated
- **WHEN** the user requests a progress summary
- **THEN** the system returns an AI-generated summary and recommendations based on the user's recent progress data

# workouts Specification

## Purpose
TBD - created by archiving change define-initial-specs. Update Purpose after archive.
## Requirements
### Requirement: Exercise Creation
The system SHALL allow the user to create custom exercises to use in routines and workout logs.

#### Scenario: Custom exercise created
- **WHEN** the user creates a new exercise with a name
- **THEN** the system stores the exercise and makes it available for use in routines and logged workouts

### Requirement: Routine Creation
The system SHALL allow the user to create a routine composed of one or more exercises.

#### Scenario: Routine created
- **WHEN** the user creates a routine and adds exercises to it
- **THEN** the system stores the routine with its exercises for later use when logging a workout

### Requirement: Workout Logging
The system SHALL allow the user to log a workout session recording, for each exercise performed, the sets, repetitions, weight used, and rest time.

#### Scenario: Workout logged
- **WHEN** the user logs a workout session with sets, repetitions, weight, and rest time for an exercise
- **THEN** the system stores the session as part of that user's workout history

### Requirement: Personal Records Tracking
The system SHALL detect and track personal records (PRs) per exercise based on logged workout data.

#### Scenario: New PR detected
- **WHEN** a logged set for an exercise exceeds the user's previous best for that exercise
- **THEN** the system records it as a new personal record for that exercise

### Requirement: Workout History and Progression Statistics
The system SHALL keep a history of logged workouts and SHALL provide progression statistics per exercise over time.

#### Scenario: Viewing exercise progression
- **WHEN** the user opens the progression view for an exercise
- **THEN** the system displays that exercise's historical performance and progression statistics


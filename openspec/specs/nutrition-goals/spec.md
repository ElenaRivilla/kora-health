# nutrition-goals Specification

## Purpose
TBD - created by archiving change define-initial-specs. Update Purpose after archive.
## Requirements
### Requirement: Configurable Daily Nutrition Targets
The system SHALL allow the user to configure daily targets for calories, protein, carbohydrates, fat, fiber, sugar, and sodium.

#### Scenario: Targets saved
- **WHEN** the user sets a daily calorie and macronutrient target
- **THEN** the system stores the targets and uses them to evaluate subsequent days

### Requirement: Daily Nutrition Score
The system SHALL calculate a daily nutrition score based on the quality of the user's logged food intake for that day, compared against the user's configured targets.

#### Scenario: Score available after logging
- **WHEN** the user has logged meals for the current day
- **THEN** the system computes a nutrition score for that day

### Requirement: AI Explanation and Recommendations for Nutrition Score
The system SHALL use AI to explain the reasoning behind a given day's nutrition score and to offer recommendations for improvement.

#### Scenario: Explanation requested
- **WHEN** the user requests an explanation for a day's nutrition score
- **THEN** the system returns an AI-generated explanation and at least one recommendation based on that day's logged intake


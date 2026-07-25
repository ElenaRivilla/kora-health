# nutrition-log Specification

## Purpose
TBD - created by archiving change define-initial-specs. Update Purpose after archive.
## Requirements
### Requirement: Daily Meal Diary
The system SHALL allow the user to record entries under breakfast, lunch, dinner, and snack for each day, and each meal entry SHALL be able to contain one or more foods.

#### Scenario: Logging a meal with multiple foods
- **WHEN** the user adds two foods to today's lunch entry
- **THEN** the system stores both foods under lunch for that day and both are retrievable when the diary is viewed

### Requirement: Manual Food Entry
The system SHALL allow the user to add a food to a meal by manually specifying the food and its quantity.

#### Scenario: Manual entry accepted
- **WHEN** the user selects a food and enters a quantity manually
- **THEN** the system adds that food entry to the selected meal

### Requirement: Photo-Based Meal Logging
The system SHALL allow the user to log a meal by taking or uploading a photograph, and SHALL use AI to detect the foods present in that photograph.

#### Scenario: Foods detected from photo
- **WHEN** the user submits a meal photo
- **THEN** the system returns a list of detected foods for the user to confirm before they are added to the meal

### Requirement: Automatic Nutritional Calculation
For every logged food entry, the system SHALL automatically calculate calories, protein, carbohydrates, fat, fiber, sugar, and sodium.

#### Scenario: Nutrients calculated on entry
- **WHEN** a food entry is added to a meal, whether manually or via photo detection
- **THEN** the system calculates and stores calories, protein, carbohydrates, fat, fiber, sugar, and sodium for that entry


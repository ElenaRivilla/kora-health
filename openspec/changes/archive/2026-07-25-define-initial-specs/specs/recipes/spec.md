## ADDED Requirements

### Requirement: Save Custom Recipe
The system SHALL allow the user to create and save a recipe composed of one or more foods with their quantities.

#### Scenario: Recipe saved
- **WHEN** the user creates a recipe with a name and a list of foods with quantities
- **THEN** the system stores the recipe under that user's account for later reuse

### Requirement: Reuse Saved Recipe
The system SHALL allow the user to add a saved recipe to a meal in the nutrition diary as a single action, applying all of its foods and quantities.

#### Scenario: Adding a saved recipe to a meal
- **WHEN** the user selects a saved recipe to add to today's dinner
- **THEN** the system adds all the recipe's foods, with their quantities, to that meal entry

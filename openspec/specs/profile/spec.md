# profile Specification

## Purpose
TBD - created by archiving change define-initial-specs. Update Purpose after archive.
## Requirements
### Requirement: Personal Data Management
The system SHALL allow the user to view and edit their personal data.

#### Scenario: Personal data updated
- **WHEN** the user edits their personal data and saves
- **THEN** the system persists the updated values against the user's account

### Requirement: Goals and Activity Level Configuration
The system SHALL allow the user to configure their goals and activity level.

#### Scenario: Activity level set
- **WHEN** the user selects an activity level and a goal
- **THEN** the system stores these settings and makes them available to other capabilities that depend on them (e.g. `nutrition-goals`)

### Requirement: Calorie and Macronutrient Configuration
The system SHALL allow the user to configure their calorie and macronutrient settings from their profile.

#### Scenario: Configuration updated from profile
- **WHEN** the user updates their calorie or macronutrient configuration in the profile
- **THEN** the system persists the change and it is reflected in `nutrition-goals`

### Requirement: HealthKit Sync Preference
The system SHALL allow the user to enable or disable HealthKit synchronization from their profile.

#### Scenario: Sync toggled off
- **WHEN** the user disables HealthKit synchronization in their profile
- **THEN** the system stores the preference so that `healthkit-integration` stops reading HealthKit data for that user

### Requirement: Notifications and Preferences
The system SHALL allow the user to configure notification and general preference settings.

#### Scenario: Notification preference changed
- **WHEN** the user disables a notification category
- **THEN** the system stops sending notifications of that category to the user

### Requirement: Account Management
The system SHALL allow the user to manage their account, including account-level settings tied to their identity in the system.

#### Scenario: Account settings viewed
- **WHEN** the user opens account settings
- **THEN** the system displays the account information tied to their identity


## ADDED Requirements

### Requirement: Image-Based Food Recognition
The system SHALL use AI to recognize foods present in an image submitted by the user and SHALL estimate the quantity of each recognized food.

#### Scenario: Foods and quantities returned
- **WHEN** an image of a meal is submitted for recognition
- **THEN** the system returns a list of recognized foods, each with an estimated quantity

### Requirement: Nutrition Score Explanation and Recommendations
The system SHALL use AI to explain a user's nutrition score and generate dietary recommendations based on their logged intake.

#### Scenario: Explanation with recommendations
- **WHEN** a request for nutrition score explanation is received for a given day
- **THEN** the system returns an explanation of the score together with at least one dietary recommendation

### Requirement: Sports Recommendations
The system SHALL use AI to generate sports/training recommendations based on the user's workout history and goals.

#### Scenario: Recommendation generated
- **WHEN** a request for a sports recommendation is received for a user
- **THEN** the system returns a recommendation informed by that user's workout history and goals

### Requirement: Trend Analysis and Personalized Summaries
The system SHALL use AI to analyze trends in the user's data and generate personalized summaries.

#### Scenario: Trend summary generated
- **WHEN** a request for a trend summary is received for a user
- **THEN** the system returns an AI-generated summary describing notable trends in that user's data

### Requirement: Contextual Question Answering
The system SHALL allow the user to ask free-form questions and SHALL answer them using the full context of that user's stored data.

#### Scenario: Question answered with user context
- **WHEN** the user asks a question about their own data
- **THEN** the system generates an answer using that user's relevant stored data as context

### Requirement: AI Processing Handled by Backend
The system SHALL process all AI requests on the backend, which SHALL forward the request (image, question, or context) to the corresponding AI provider and return the response to the client.

#### Scenario: Client never calls AI provider directly
- **WHEN** the Flutter client needs an AI-powered result
- **THEN** it sends the required images, questions, or context to the backend, and the backend is the component that communicates with the AI provider

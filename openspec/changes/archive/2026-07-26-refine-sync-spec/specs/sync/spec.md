## MODIFIED Requirements

### Requirement: Local Offline Storage
The system SHALL store locally, for every capability that produces user data (health, nutrition-log, nutrition-goals, water-tracking, recipes, workouts, profile), a rolling window of the most recent 90 days of that user's data, enabling the app to remain usable without network connectivity.

#### Scenario: Data available offline
- **WHEN** the device has no network connectivity
- **THEN** the user can view previously synchronized data from the last 90 days and continue creating new entries locally

#### Scenario: Data outside the local window requested offline
- **WHEN** the user requests data older than 90 days while the device has no network connectivity
- **THEN** the system indicates that data is not available offline instead of showing incomplete or incorrect results

### Requirement: Local-Remote Synchronization
The system SHALL attempt to synchronize every locally created or modified entry, across all data-producing capabilities, to the backend immediately after it is written.

#### Scenario: Entry synced immediately when online
- **WHEN** the user creates or edits an entry while the device has network connectivity
- **THEN** the system sends that entry to the backend right away and marks it as synced once the backend confirms receipt

#### Scenario: Offline entries synced on reconnect
- **WHEN** connectivity is restored after entries were created while offline
- **THEN** the system's automatic retry sends the pending local entries to the backend and they become part of the remote record

## ADDED Requirements

### Requirement: Initial Remote Sync on Sign-In
The system SHALL download the most recent 90 days of the user's data, across all data-producing capabilities, from the backend into local storage when the user signs in on a device whose local cache is empty or stale.

#### Scenario: Fresh install populates local cache
- **WHEN** the user signs in on a device with an empty local cache (fresh install or reinstall)
- **THEN** the system downloads the last 90 days of that user's data from the backend into local storage before treating the app as ready for offline-first use

### Requirement: Offline Change Queue and Retry
The system SHALL persist, in a local queue, any entry that fails to synchronize to the backend, and SHALL retry sending it automatically until it succeeds, surviving app restarts.

#### Scenario: Failed sync is queued and retried on reconnect
- **WHEN** an entry fails to synchronize because the device has no network connectivity
- **THEN** the entry remains in the local queue and the system automatically retries sending it once connectivity is restored, without requiring user action

#### Scenario: Queue survives app restart
- **WHEN** the app is restarted while entries are still pending in the local queue
- **THEN** the system resumes retrying those pending entries after restart

### Requirement: Idempotent Synchronization
The system SHALL assign each locally created entry a client-generated unique identifier and SHALL use that identifier to prevent the backend from creating a duplicate record when a synchronization attempt is retried.

#### Scenario: Retried sync does not create a duplicate
- **WHEN** the system retries sending an entry whose client-generated identifier the backend already has a record for
- **THEN** the backend recognizes the identifier and does not create a second record for that entry

# Delta for post-merge-console

## ADDED Requirements

### Requirement: Pipeline board

The console SHALL list post-merge runs for the fictional FieldClear repositories, including promoted, awaiting-approval, and held outcomes.

#### Scenario: Reviewer opens the board

- **WHEN** a reviewer opens the board
- **THEN** they see seeded runs with repo, merge request, current stage, risk, and status

#### Scenario: Filter has no rows

- **WHEN** a reviewer selects a status filter that matches nothing
- **THEN** the board says no runs match and the other filters remain available

### Requirement: Simulated merge

The console SHALL start a full post-merge loop from one control, without a GitLab token or network call.

#### Scenario: Simulate merge

- **WHEN** a reviewer starts a simulated merge
- **THEN** a new run plays SAST, dependencies, staging deploy, smoke tests, and release notes with logs and tool calls
- **AND** the run stops at a human approval gate when risk is medium

#### Scenario: Approve

- **WHEN** a reviewer approves a run that is waiting
- **THEN** the agent promotes the run and records the approver in the decision

#### Scenario: Request changes

- **WHEN** a reviewer requests changes at the gate
- **THEN** the run is not promoted and the decision says production was not run

### Requirement: Agent decision log

Each stage SHALL show the agent's reason, the tool calls it made, and the risk it assigned.

#### Scenario: Held historical run

- **WHEN** a reviewer opens the run held for a reachable critical dependency
- **THEN** staging and later stages are not started
- **AND** the dependency stage explains why the advisory was reachable

### Requirement: Recording route

The app SHALL include a route that can be screen-recorded as an approximately three minute walkthrough of the loop.

#### Scenario: Demo route

- **WHEN** a reviewer starts the demo route
- **THEN** narration advances across the board and the live merge
- **AND** the approval beat waits until the reviewer approves or requests changes

### Requirement: Offline operation

The demo SHALL run with no paid API and no GitLab credential.

#### Scenario: Fresh browser

- **WHEN** the app is built and opened with no environment secrets
- **THEN** the board, the simulated merge, and the demo route still function

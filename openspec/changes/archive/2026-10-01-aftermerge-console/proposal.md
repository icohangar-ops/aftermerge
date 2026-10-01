# Change: AfterMerge console

## Why

GitLab's Life After Code hackathon asks for an agent that owns work after the code is written. A reviewer needs to see that loop, including a hold and a human gate, without a GitLab token.

## What Changes

- Next.js console with a pipeline board and a run timeline
- In-browser agent player for SAST, dependencies, staging, smoke, release notes, approval, and promote
- Seeded FieldClear runs that show auto-promote, a waiting gate, and a critical hold
- A `/demo` route timed for a three minute recording
- Architecture notes for a real GitLab webhook and CI mapping

## Capabilities

### New Capabilities

- `post-merge-console`: board, simulated merge, agent log, approval gate, demo route

### Modified Capabilities

- None

## Impact

- New application. No existing product is wrapped.
- No secrets, database, or external API.

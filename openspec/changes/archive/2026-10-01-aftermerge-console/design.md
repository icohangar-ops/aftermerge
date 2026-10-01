# Design: AfterMerge console

## Context

Path A demo for a fictional mechanical-contractor SaaS. Judges should understand the post-merge policy in one sitting.

## Goals / Non-Goals

Goals:

- One click plays the full agent loop with visible reasons
- Historical runs make the policy obvious before the click
- The recording route stays on one URL

Non-goals:

- Live GitLab, scanners, or a model API
- Auth and persistence beyond localStorage

## Decisions

- Client-side event player. Events are logs, tool calls, stage updates, and run updates. The approval gate is a pause, not a timer.
- Scripted reasoning instead of an LLM so the demo is offline and the decision text is stable.
- Dark slate and cyan surfaces, shadcn primitives for buttons, badges, cards, and scroll areas.
- Demo advisories are prefixed `DEMO-` so they cannot be confused with published CVEs.

## Risks / Trade-offs

- A reload cannot resume timers. Interrupted live runs are marked held.
- Pausing the demo narration does not freeze the player. The recording path is to let it run.

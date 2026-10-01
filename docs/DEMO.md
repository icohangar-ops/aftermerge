# AfterMerge demo recording

Three-minute screen recording for the GitLab Life After Code hackathon. The route is the teleprompter. This file is the shot list.

**Save the take as `docs/aftermerge-demo.mp4`.** That file is not in the repo yet. Commit it after you record. Git LFS is already tracking `docs/aftermerge-demo.mp4` (see `.gitattributes`).

```bash
npm install
npm run dev
```

Open [http://localhost:3000/demo](http://localhost:3000/demo). Record the browser window, not the whole desktop.

## Setup

- Viewport about 1440×900 or 1920×1080. Zoom 100%.
- Use a fresh tab so an old simulated run is not already in flight. If the header says **Watch AM-…**, let that run finish or clear site data for localhost, then reload `/demo`.
- Start the screen recorder, then click **Start 3-minute demo**. One click later: **Approve promote** when the gate appears.
- Leave the narration bar on screen. Read it, or let a viewer read it. Do not talk over a different story.
- Stop the recording on the close card, after the clock passes about 3:00.
- Optional second take: from the board, open **AM-1838** (invoice PDF, held) if you want a still of the critical hold. Do not splice it into the timed route unless you cut something else.

## Shot list

Times are from the moment you press **Start**. The approval beat waits for your click, so the ending slides by a second or two.

| Clock | Beat | On screen | You do |
| --- | --- | --- | --- |
| 0:00 | Open | Title card. Northline Mechanical · FieldClear. Seven stages. | Nothing. Read the bar. |
| 0:18 | Board | Pipeline board. Promoted, waiting, and held rows. | Nothing. The held row is the invoice-pdf merge. The waiting row is photo closeout. |
| 0:38 | Merge | Same board. Narration names `fieldclear/compliance-portal`. | Nothing. The player starts the merge itself at the next beat. |
| 0:48 | SAST | Live run. Semgrep, `DEMO-SAST-084`, follow-up `#902`. Risk moves to medium. | Nothing. |
| 1:16 | Dependencies | Gemnasium, `DEMO-GHSA-fxp-4411`, fixture-only waiver. | Nothing. |
| 1:36 | Staging and smoke | Staging health 200. Playwright. First 429 fails, retry passes. Dry-run writes nothing. | Nothing. |
| 2:00 | Release notes | Notes for field ops. Dry-run stays on the first night. | Nothing. |
| 2:16 | Approval | Amber gate. **Approve promote** and **Request changes**. | Click **Approve promote** once. For a “the agent stopped” ending, click **Request changes** instead. |
| ~2:20 | Promote | Production promote. Decision names Dana Okonkwo. | Nothing. |
| ~2:34 | Close | Path A / Life After Code close card. | Hold to about 2:52. Stop recording. |

Narration, in order:

1. AfterMerge is a post-merge agent for Northline Mechanical. FieldClear's code is merged. The agent takes it from here: security, dependencies, staging, smoke, release notes, a human gate, then production.
2. This is the pipeline board. Every row is a merged merge request. Some were promoted. One is waiting on a person. One was held because a critical dependency was actually reachable. The agent writes down why.
3. I'll simulate a merge on fieldclear/compliance-portal. Nightly refrigerant log sync. No GitLab token — this is the same loop a webhook would start.
4. Semgrep runs the GitLab SAST ruleset. It finds a medium hit: on retry, the portal client logs a four-character token prefix. The agent checks production log level, decides the prefix is not a credential, files follow-up issue 902, and continues. Risk stays medium. That means no auto-promote.
5. Gemnasium flags a high advisory in fast-xml-parser. The agent traces the call path. It is only in a fixture script, not the sync job. The production npm graph is clean. Waiver recorded. Staging is next.
6. Staging deploys to FieldClear staging. Health check is green. Playwright runs three smokes. The state-portal mock returns 429 on the first retry test. The agent reruns that test once. It passes. The dry-run asserts that no refrigerant quantity was written.
7. The agent drafts release notes for field ops. Dry-run stays on for the first production night. No migration. The debug-log follow-up is in the notes. Then policy stops the line.
8. Medium risk. A person has to approve. Dana Okonkwo owns field operations. This is the gate. Approve to promote — or request changes and the agent will not ship.
9. Approved. The agent promotes compliance-portal to production, records the approver, and closes the run. The decision log is the audit trail.
10. That is Life After Code: an agent that owns the lifecycle after the merge. Path A — a new demo, not a wrapper around an existing product. The stages map onto GitLab CI jobs and a merge webhook.

## What the take must show

- The board has more than one outcome (promoted, waiting, held).
- The live merge writes a reason, not only a green check: waiver plus follow-up, then a waiver on a dev-only advisory, then a smoke retry.
- The agent stops at medium risk until a person clicks.
- Promote happens only after that click.
- The close card says Path A and Life After Code.

Findings on screen use `DEMO-` ids. They are simulated.

## Commit the video

Git LFS is configured for the path below. From the repo root, after the file exists:

```bash
git add docs/aftermerge-demo.mp4 docs/DEMO.md
git commit -m "Add the AfterMerge demo recording"
git push
```

If `git lfs` is not installed on the machine that commits the file, install it first so the mp4 is stored as an LFS object instead of a normal blob. Do not commit a different filename. The placeholder path is `docs/aftermerge-demo.mp4`.

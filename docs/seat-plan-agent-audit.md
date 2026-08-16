# Agent-run seat-plan audit

This is the repeatable operator guide for invoking the repository
`maintain-seat-plans` skill. The audit is read-only: it creates ignored evidence
under `seat-plan-work/` and never updates the reviewed baseline unless the user
later gives explicit approval.

## Prerequisites

1. Run `npm run build:maintenance` on the branch to be audited. Normal builds
   intentionally omit the developer-only maintenance panel.
2. Open `chrome://extensions`, enable **Developer mode**, load `dist/` as the
   unpacked NLB Seat Helper extension, and click **Reload** after each build.
3. Open `https://www.nlb.gov.sg/seatbooking/` in Chrome, sign in, refresh the
   page, and wait until the extension shows the signed-in account and catalog.
4. Keep Chrome available for browser control and allow normal file downloads.
5. Ensure local Node.js/npm and network access to NLB map-image URLs work.

When fresh live URL discovery is required, schedule the run for **12:01 SGT**
if the current normal-account rules release tomorrow at 12:00. The preferred
first probe is tomorrow's first valid interval, typically 10:00, followed only
when necessary by today's last valid full interval, typically 19:00. Use the
release time and area hours returned by `GetAccountInfo`; privileged accounts
or branches with different hours require corresponding times.

No cookie permission, password access, GPS permission, DevTools console,
Apple Events permission, or **Allow JavaScript from Apple Events** setting is
required. The agent uses the visible, confirmation-gated extension control and
the tab's existing same-origin NLB session. If browser control cannot access
the tab or accept a prompt, the fallback is for the user to click **Seat-plan
maintenance → Export audit catalog** and tell the agent where the
sanitized JSON was downloaded.

## Prompt: run a full audit

```text
Use $maintain-seat-plans to run a complete live, read-only audit of the current
NLB branch, area, seat, reviewed seat-plan URL, map image, fingerprint, and
annotation configuration. Use the signed-in Chrome Seat Booking tab and the
visible Seat-plan maintenance export. Generate the candidate snapshot, JSON
drift report, and HTML report under seat-plan-work, inspect the complete report,
and give me a summary with a clickable HTML report. Use the routine catalog
export; do not run targeted URL discovery unless the report identifies a map
association that needs it. Treat requested discovery failures as incomplete
evidence. Do not update the reviewed baseline or annotation definitions.
```

The agent should click the visible routine export, accept its confirmation,
locate the new sanitized download, verify that it is a `catalog` export, run
the deterministic full-audit command, and report clean, drift, or incomplete.
This export makes one `GetAccountInfo` request and zero
`SearchAvailableAreas` calls. Map downloads stay sequential.

Before clicking, the agent records the existing matching downloads and the
start time. It clicks **Export audit catalog** exactly once. A browser
timeout is not permission to retry: the agent checks the visible export status
and waits for one new file. If the user handles a confirmation, the agent stops
browser interaction and waits for that run to finish. No audit task may start a
second export. Observing multiple new JSON files must be reported. Any fresh
URL investigation is a separate selected-library action with at most two
sequential branch-level searches and should normally be run at 12:01 SGT for
tomorrow's release. An omitted area remains incomplete evidence and does not
authorize an automatic retry.

## Prompt: prepare drifted annotations

Use this only after reviewing the first report:

```text
Use $maintain-seat-plans to prepare proposal-only annotation review packets for
every annotation-affecting area in the latest drift report. Inspect every
generated comparison and give me a clickable annotation-review index plus a
summary of automatic proposals and items requiring manual work. Do not change
annotation definitions, fingerprints, inventory, or the reviewed baseline.
```

Generated transforms, OCR, and computer-vision output are suggestions. A later
prompt must explicitly approve specific definition and baseline updates before
the agent may apply them.

## Subagents and models

The skill does not require subagents. A capable orchestrator can complete the
flow alone, which keeps the live browser capture and sequential requests easy
to audit. When the active Codex runtime exposes subagents and the user asks for
them, independent visual packet checks and deterministic verification can be
delegated; live NLB discovery, final synthesis, and approval decisions remain
with the orchestrator.

The skill cannot enable a model that the current Codex runtime does not expose.
Start the task with the desired orchestrator model, then request only the
subagent model overrides available in that session. If Luna is not listed by
the runtime, use the inherited orchestrator model or another available model
instead.

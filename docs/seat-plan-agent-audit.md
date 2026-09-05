# Agent-run seat-plan audit

This is the repeatable operator guide for invoking the repository
`maintain-seat-plans` skill. The audit is read-only: it creates ignored evidence
under `seat-plan-work/` and never updates the reviewed baseline unless the user
later gives explicit approval.

## Closure-aware reporting

The following notices were supplied from the NLB chatbot on 1 September 2026:

| Library | Reported closure or reopening notice |
| --- | --- |
| Orchard Library | Closed until the second half of 2026 |
| Cheng San Library | Closed until the first half of 2027 |
| Marine Parade Library | Closed until mid-2027 |
| Queenstown Library | Closed from 31 August 2026 until late 2028 |
| Ang Mo Kio Library | Closed from 1 August 2026; planned reopening on 20 November 2026 at AMK Hub |

Treat these as user-reported, point-in-time notices until rechecked against
NLB's [Our Libraries and Locations](https://www.nlb.gov.sg/main/visit-us/our-libraries-and-locations) page or a
dated authoritative response. A branch remaining in `GetAccountInfo` does not
prove that it is open or bookable. A notice guides investigation but does not
suppress structural drift or authorize baseline mutation. Confirmed catalog
removal must remain drift until a maintainer explicitly rejects, suspends, or
retires it; archive reviewed evidence before removing active configuration.
After a confirmed reopening, treat reappearance as new drift and refresh the
catalog, maps, fingerprints, and availability before restoring seats.

The reviewed seat-plan baseline currently includes Queenstown only among these
five libraries, with two annotated areas and 50 seats. The holiday test guide
also records the recurring NLB notice that libraries close at 5.00pm on the
eves of Christmas, New Year, and Chinese New Year and close on public holidays;
see the [official NLB operating-hours wording](https://reference.nlb.gov.sg/contact-us/).
The maintained operational-status overlay is
[`branch-inventory.md`](branch-inventory.md); keep it separate from the
generated seat-plan inventory. Machine-readable sources and context are in
[`data/branch-status.json`](data/branch-status.json); retirement records are in
[`data/seat-plan-retirements.json`](data/seat-plan-retirements.json).

## Prerequisites

1. Run `npm run build:maintenance` on the branch to be audited. Normal builds
   intentionally omit the developer-only maintenance panel. After reloading,
   confirm Chrome shows **Library Seats SG - for NLB (Maintenance)** and a `-maintenance`
   display version.
2. Open `chrome://extensions`, enable **Developer mode**, load `dist/` as the
   unpacked Library Seats SG - for NLB extension, and click **Reload** after each build.
3. In Codex **Settings → Computer use → Google Chrome**, add
   `https://www.nlb.gov.sg` to the site permissions and allow browsing. Restart
   Chrome after changing this permission. Full CDP access is not required.
4. Open `https://www.nlb.gov.sg/seatbooking/` in Chrome, sign in, refresh the
   page, and wait until the extension shows the signed-in account and catalog.
5. Keep Chrome available for browser control and allow normal file downloads.
6. Ensure local Node.js/npm and network access to NLB map-image URLs work.

The **Seat-plan maintenance** section may be collapsed when the prompt is
submitted; browser control can expand it. The important prerequisites are the
active extension session and Chrome permission to access the NLB origin.

When fresh live URL discovery is required, schedule the run for **12:01 SGT**
if the current normal-account rules release tomorrow at 12:00. The preferred
first probe is tomorrow's first valid interval, typically 10:00, followed only
when necessary by today's last valid full interval, typically 19:00. Use the
release time and area hours returned by `GetAccountInfo`; privileged accounts
or branches with different hours require corresponding times.

No cookie permission, password access, GPS permission, full CDP access,
DevTools console, Apple Events permission, or **Allow JavaScript from Apple
Events** setting is required. The agent uses the visible, confirmation-gated
extension control and the tab's existing same-origin NLB session. If browser
control cannot access the tab or accept a prompt, the fallback is for the user
to click **Seat-plan maintenance → Export audit catalog** and tell the agent
where the sanitized JSON was downloaded.

## Prompt: run a full audit

```text
Use $maintain-seat-plans to run a complete live, read-only audit of the current
NLB branch, area, seat, reviewed seat-plan URL, map image, fingerprint, and
annotation configuration. Use the signed-in Chrome Seat Booking tab and the
visible Seat-plan maintenance export. Generate the candidate snapshot, JSON
drift report, and HTML report under seat-plan-work, inspect the complete report,
and give me a summary with a clickable HTML report. For every drift, include
the investigation checklist, linked operational context, allowed dispositions,
and concrete baseline/archive/annotation/documentation actions. Use the routine catalog
export; do not run targeted URL discovery unless the report identifies a map
association that needs it or a reviewed map path cannot be downloaded. Empty
routine observed map URLs are unobserved evidence, not drift. Treat requested
discovery failures as incomplete evidence. Handle the native export confirmation in the same browser operation
as the single click; do not ask me to watch or interact with Chrome unless
browser control is unavailable. Do not update the reviewed baseline or
annotation definitions.
```

The agent should click the visible routine export, accept its confirmation,
locate the new sanitized download, verify that it is a `catalog` export, run
the deterministic full-audit command, and report clean, drift, or incomplete.
This export makes one `GetAccountInfo` request and zero
`SearchAvailableAreas` calls. Record the raw catalog's branch, area, and seat
counts before running capture. Map downloads stay sequential.

Include any applicable planned closure or reopening notice separately in the
summary. Do not interpret catalog presence as evidence that the branch is
operational, and do not call explained drift clean until the baseline is
actually reconciled.

The routine catalog derives branch, area, and seat identities from
`GetAccountInfo`; it does not promote booking `mapUrls` into area associations.
Candidate capture downloads every reviewed definition path even when
`observedMapUrls` is empty. An empty routine value therefore does not trigger
targeted discovery or map-URL drift. Availability-scoped seat codes returned by
an optional targeted probe are evidence only when first observed; they do not
create baseline-enrichment drift.

Before clicking, the agent records the existing matching downloads and the
start time. Because `window.confirm()` blocks completion of the click handler,
the agent must arm dialog handling first, start the **Export audit catalog**
click without awaiting it, and accept the confirmation in that same browser-tool
operation. It must then end the browser operation without awaiting the click or
a browser download event. The Blob download may already exist on disk without
emitting that event, so waiting can add a false two-minute timeout. The agent
checks Downloads immediately and polls files created after the start time for
at most 15 seconds, stopping as soon as exactly one file exists. The agent
clicks exactly once, and the user should leave Chrome untouched unless the
agent explicitly hands over control. A browser timeout is not permission to
retry: the agent checks the visible export status and the filesystem.
If the user is asked to handle a confirmation, the agent stops browser input
and waits for that run to finish. No audit task may start a second export.
Observing multiple new JSON files must be reported. Any fresh URL investigation
is a separate selected-library action with at most two sequential branch-level
searches and should normally be run at 12:01 SGT for tomorrow's release. An
omitted area remains incomplete evidence and does not authorize an automatic
retry.

The HTML report links the candidate snapshot, JSON drift report, reviewed
baseline, fingerprint configuration, annotation index, and inventory. It shows
observed versus configured branch, area, and seat counts; explicit branch and
area additions/removals; the number of reviewed seat-plan images checked; every
changed or missing image; and annotation coverage.
For each drift it also shows matching branch-status sources, evidence checks,
allowed dispositions, and concrete catalog-baseline, archive, annotation,
fingerprint, inventory, test, and documentation actions. A whole removed branch
is one hierarchical event with affected area and seat totals.

Candidate capture may supplement an omitted reviewed area so its known map path
can still be fingerprinted; these areas are marked `catalogState: "absent"`
and `seatSource: "reviewed-annotation"`. Therefore, report raw downloaded-catalog counts
separately from candidate counts and use the raw catalog when concluding that a
branch or area was removed.

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

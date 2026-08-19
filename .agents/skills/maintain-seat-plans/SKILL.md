---
name: maintain-seat-plans
description: Audit and maintain NLB seat-plan annotations using sanitized catalog snapshots, image fingerprints, drift reports, visual overlays, and deterministic verification. Use when a branch, area, seat identity, map URL, map image, hotspot, annotation baseline, or seat-plan inventory may have changed or when adding a new clickable seat plan.
---

# Maintain Seat Plans

Maintain annotations as reviewed evidence, never as runtime inference. Read
[`docs/seat-plan-maintenance.md`](../../../docs/seat-plan-maintenance.md)
completely before changing a baseline or definition.

## Full live audit

1. Protect unrelated work and inspect the current branch and diff.
2. Confirm the prerequisites in the maintenance document. Build with
   `npm run build:maintenance`, reload that unpacked build, and use Chrome
   browser control when a signed-in NLB Seat Booking tab is already open.
   Before exporting, confirm `chrome://extensions` identifies it as **NLB Seat
   Helper (Maintenance)** with a `-maintenance` display version. Confirm Codex
   Chrome computer-use permissions allow browsing `https://www.nlb.gov.sg`;
   after changing that permission, restart Chrome and reopen the signed-in tab.
   Full CDP access is unnecessary. The maintenance section may begin collapsed.
3. Record the matching files already present in Downloads and the start time.
   Expand **Seat-plan maintenance**. Arm handling for the native confirmation
   before clicking: start the **Export audit catalog** click without awaiting
   its completion, then detect and accept `window.confirm()` in the same
   browser-tool operation. After acceptance, end that browser operation; do not
   await a browser `download` event or the original click promise. Blob-backed
   extension downloads may not emit a controllable download event even though
   the file is already on disk, causing a false two-minute wait. Click exactly
   once. This routine path refreshes
   `GetAccountInfo` once and makes zero `SearchAvailableAreas` requests. Do not
   inject JavaScript or read cookies. A browser click or dialog timeout is
   ambiguous and is not evidence that the click failed: inspect visible status
   and Downloads rather than clicking again. Tell the user to leave Chrome
   untouched during the attempt. Ask for manual help only when browser control
   cannot accept the dialog; once the user takes over, stop browser input and
   wait for that single run to finish.
4. Check Downloads immediately after accepting the confirmation, then poll the
   filesystem briefly (at most 15 seconds) for files created after the recorded
   start time. Locate exactly one new download. If none appears, inspect the
   visible export status and ask the user for help rather than retrying. If more
   than one appears, report the duplicated run and do not choose one silently.
   Require `exportMetadata.mode` to be `catalog` and record its extension version.
5. Run `npm run seat-plans:verify`, then run
   `npm run seat-plans:full-audit -- --catalog <downloaded-json>`. This refreshes
   map bytes sequentially and creates an ignored candidate, JSON drift report,
   and HTML report under `seat-plan-work/`. Treat empty routine
   `observedMapUrls` as unobserved evidence, not a changed association; the
   reviewed definition path is still downloaded and fingerprinted.
6. Read the complete report and inspect every reported area. Exit code `2`
   means drift was reported; exit code `3` means evidence is incomplete. These
   are report outcomes, not permission to change the baseline.
7. Confirm the HTML report links its candidate, JSON report, reviewed baseline,
   fingerprint configuration, annotation index, and inventory. Summarize
   observed versus configured branch, area, and seat counts; branch/area
   additions or removals; images checked, changed, or missing; annotation
   coverage; drift; and unresolved evidence. Return the HTML report as a
   clickable local file. The capture downloads the reviewed map path for every
   known area and compares fresh bytes and metadata; it does not need a live
   availability response to validate an existing map.

## Optional targeted URL discovery

Use this only when the routine audit finds a new area without a reviewed path,
cannot download a reviewed path, reports a conflicting non-empty authoritative
association, or the user explicitly requests fresh URL association evidence.
Do not run discovery merely because a routine `GetAccountInfo` export has empty
`observedMapUrls`; booking `mapUrls` are not area-association evidence.
Select one library and click **Discover selected library maps** once. The
maintenance build refreshes `GetAccountInfo`, then makes at most two sequential
branch-level `SearchAvailableAreas` requests with no `AreaId`. The response is
still parsed by exact returned `areaId`; omitted areas remain incomplete
evidence and are never treated as removed.

Prefer starting at **12:01 Singapore time** for a normal account whose
configured next-day release is 12:00. The first probe uses the most widely
applicable earliest interval tomorrow (typically 10:00). Only if branch areas
remain unresolved does it use the most widely applicable latest full interval
today (typically 19:00). Respect the current configured release time and actual
area hours rather than hardcoding these examples. Run another library only as
a separate, deliberate operation.

## Prepare annotation proposals

Only enter this mode after the user explicitly asks to prepare drifted
annotations. Run `npm run seat-plans:prepare-drift -- --report <drift.json>`.
Open the generated annotation-review index and inspect every comparison at
source resolution. Area lifecycle changes and preparation failures remain
manual-review items. Generated coordinates, OCR, and computer-vision results
are proposals only.

Changing definitions, the reviewed baseline, fingerprints, or inventory is a
separate approval boundary. After approval, confirm every seat identity and
rectangle, make the smallest reviewed edits, regenerate artifacts, and run
`seat-plans:verify`, the independent annotation test, the complete test suite,
typecheck, and build.

## Optional delegation

The workflow works with one agent and does not require subagents. If the active
Codex runtime exposes subagents and the user requests delegation, the
orchestrator may assign independent visual packet reviews or deterministic
verification to them. Keep the live browser export, sequential NLB requests,
final synthesis, and approval boundary with the orchestrator. Use only model
overrides exposed by the current runtime; this skill must not require a model
that is unavailable in the session.

## Guardrails

- Preserve sequential NLB requests and the existing page-session model.
- Never parallelize live NLB discovery or map-image downloads.
- Routine audit export must make zero `SearchAvailableAreas` requests.
- Do not classify routine URL omission or first-observed availability-scoped
  seat codes as baseline drift.
- Initiate a targeted branch export at most once per deliberate operation. Its
  strict budget is one `GetAccountInfo` refresh plus at most two sequential
  branch-level searches; HTTP retry is not used for these maintenance probes.
- Never retry merely because browser control timed out while a confirmation
  dialog or export handler was active.
- Do not read cookies, store authentication state, or retain personal account
  or booking data.
- Do not accept unchanged dimensions as proof that artwork is unchanged.
- Do not update a fingerprint merely to make verification pass.
- Require manual ordering review for range and hybrid plans.
- Keep clickable seats disabled when map, fingerprint, catalog, geometry, or
  coverage evidence is ambiguous.
- Keep expected-seat tests independent of the definition under test.

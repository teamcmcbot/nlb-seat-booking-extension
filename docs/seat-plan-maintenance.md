# Seat-plan maintenance

NLB can change branches, areas, seat identities, and map artwork without
notice. This workflow detects that drift before stale coordinates are treated
as clickable seats and prepares review material for annotation updates.

## Operational closure and revamp status

The following notices were supplied from the NLB chatbot on 1 September 2026
and are retained here as point-in-time, user-reported operational evidence:

| Library | Reported closure or reopening notice |
| --- | --- |
| Orchard Library | Closed until the second half of 2026 |
| Cheng San Library | Closed until the first half of 2027 |
| Marine Parade Library | Closed until mid-2027 |
| Queenstown Library | Closed from 31 August 2026 until late 2028 |
| Ang Mo Kio Library | Closed from 1 August 2026; planned reopening on 20 November 2026 at AMK Hub |

Re-check current branch status on NLB's [Our Libraries and Locations](https://www.nlb.gov.sg/main/visit-us/our-libraries-and-locations) page. These
notices are not yet captured as a dated NLB API closure contract, so they guide
investigation but never suppress drift or authorize baseline mutation by
themselves.

As of 5 September 2026, Queenstown's two areas and 50 annotated seats are
retired from the active baseline and preserved in the retirement ledger. A
routine catalog audit may still list a closed branch because catalog identity
and operational opening status are separate evidence. Report the closure separately, do not run live
booking tests or targeted map discovery for a known closed branch solely
because it remains in the catalog, and perform a fresh catalog, map, and
availability review after a confirmed reopening before re-enabling seats.

NLB's public library pages also state that libraries close at 5.00pm on the
eves of Christmas, New Year, and Chinese New Year and close on public holidays;
see the [official NLB operating-hours wording](https://reference.nlb.gov.sg/contact-us/). Treat this as an operational
hours check separate from seat-plan identity and image-fingerprint evidence.

## Sources of evidence

Use each source only for the evidence it can provide:

| Source | Reliable maintenance evidence | Limitation |
| --- | --- | --- |
| `GetAccountInfo` | Current branch, area, and complete seat identity catalog | No seat coordinates; booking `mapUrls` are not area-association evidence |
| `SearchAvailableAreas` | Exact-area map discovery and booking seat codes | Date- and interval-scoped results are not proof that a seat was removed |
| Map image bytes | Artwork revision, dimensions, MIME type, and byte length | Labels and seat geometry still require visual review |
| Annotation definitions | Reviewed seat-to-rectangle assignments | Valid only for the fingerprinted map revision and catalog |

Never retain raw account payloads. The maintenance export includes only
normalized branch, area, seat, disabled, and map identity fields. It excludes
user IDs, bookings, quotas, availability slots, cookies, and authentication
state.

## Tracked artifacts

- `docs/data/seat-plan-baseline.json` is the machine-readable point-in-time
  accepted catalog baseline. It records area and seat identities for accepted
  catalog state; areas with `annotationStatus: "implemented"` additionally
  carry reviewed map metadata and exact SHA-256 evidence. Accepted new areas
  may remain `missing` until annotation review is complete.
- `src/data/seatPlanFingerprints.ts` is generated from the baseline and bundled
  into the extension for runtime verification.
- `docs/seat-plan-inventory.md` is generated from the baseline for human
  review.
- `docs/branch-inventory.md` is a manually maintained operational-status
  overlay for closures, renovations, reopenings, and special hours. It must
  not be used to derive seat-plan geometry or baseline counts.
- `docs/data/branch-status.json` links tracked operational notices to reviewable
  sources. The audit attaches matching context and actions without suppressing
  structural drift.
- `docs/data/seat-plan-retirements.json` is the discoverable ledger for
  explicitly accepted retired branch, area, or seat-plan evidence. Git history
  remains the complete backup.
- `.cache/seat-plans/` is an ignored content-addressed image cache. Preserve it
  locally when comparing an old image with a replacement.
- `seat-plan-work/` is an ignored directory for generated review packets.

SHA-256 is authoritative for byte identity. `ETag` and `Last-Modified` are
retained only as diagnostic hints. A future decoded-pixel or perceptual hash
may help classify re-encoding and visual similarity, but must not authorize a
map automatically.

## Prerequisites for a complete audit

A full live audit of the current catalog and refreshed image fingerprints
requires all of the following. Fresh URL association is an optional targeted
step, not a routine prerequisite:

| Prerequisite | Why it is needed | How to confirm it |
| --- | --- | --- |
| Current maintenance build | Normal release builds intentionally omit developer controls. | Run `npm run build:maintenance`, reload the unpacked extension from `dist/`, and confirm Chrome displays **Library Seats SG - for NLB (Maintenance)** with a `-maintenance` display version before refreshing the NLB tab. |
| Chrome Developer mode | Chrome requires it to load or reload this unpacked extension. | `chrome://extensions` shows **Developer mode** enabled and Library Seats SG - for NLB loaded from `dist/`. |
| Chrome browser-control site permission | The audit agent must be able to claim and operate the existing NLB tab. | In Codex **Settings → Computer use → Google Chrome**, add `https://www.nlb.gov.sg`, allow browsing, then restart Chrome after changing the permission. Full CDP access is not required. |
| Active NLB Seat Booking session | `GetAccountInfo` and `SearchAvailableAreas` use the tab's same-origin session. | The extension header reports a signed-in account and its refresh action succeeds. |
| Normal Seat Booking tab | The content script and maintenance event exist only on the configured NLB route. | Open `https://www.nlb.gov.sg/seatbooking/` and wait for the extension catalog to load. |
| Visible maintenance control | The export exists only in a maintenance build. | Expand **Seat-plan maintenance** and confirm **Export audit catalog** is enabled. |
| Download access | The export is delivered as a sanitized JSON download. | Allow the confirmation prompts and retain the downloaded `nlb-seat-plan-catalog-YYYY-MM-DD.json`. |
| Node.js, npm, and NLB image access | The capture, audit, and verification scripts run locally; `--refresh` retrieves current map bytes. | `npm ci` succeeds and the capture command can reach NLB's seat-plan image URLs. |
| Reviewed baseline in the worktree | Drift is measured against the committed point-in-time evidence. | `npm run seat-plans:verify` succeeds before the live audit. |

No cookie permission, cookie export, GPS permission, password access, or
**Allow JavaScript from Apple Events** setting is required. The extension and
scripts must not read browser cookies; authenticated API requests continue to
use `credentials: "include"` in the NLB tab.

For agent-assisted audits, browser control can expand the visible maintenance
section, click the export button, and accept its confirmation dialog. A
person only needs to intervene if browser control cannot access the Chrome tab,
the NLB session is signed out, Chrome blocks the download, or the extension has
not been reloaded. No DevTools injection is part of the normal flow. After the
sanitized file is downloaded, the agent can run capture, drift audit,
verification, and visual packet preparation without further access to
credentials. Granting permission to update the reviewed baseline is a separate
decision and is not required for an audit.

The section may be collapsed before the audit prompt is submitted. Access to
the NLB origin and an active extension session matter; pre-expanding the
section does not.

### Single-run rule and dialog recovery

A complete audit initiates exactly one routine catalog export. Before clicking,
record the matching files already in Downloads and the audit start time. Click
**Export audit catalog** once only. The dialog confirms the sanitized download
and states the request budget: one `GetAccountInfo` refresh and zero
`SearchAvailableAreas` calls.

For browser-controlled audits, handle the blocking native confirmation and the
click as one operation: arm dialog handling first, start the click without
awaiting its completion, then accept `window.confirm()`. End the browser
operation after accepting the confirmation. Do not await a browser download
event or the original click promise: the extension uses a Blob-backed anchor
download, which may already be on disk without emitting a download event that
browser control can observe. Waiting for that event can add a false two-minute
delay. The person using Chrome should leave the tab untouched unless the agent
explicitly asks for manual control.

Check Downloads immediately after confirmation acceptance and poll files
created after the recorded start time for at most 15 seconds. Stop as soon as
exactly one matching catalog exists. This filesystem evidence is authoritative
for completion; do not keep waiting for the browser operation after the file is
present.

A browser-control timeout while clicking or accepting a dialog is ambiguous:
the page event handler may still be active. It must never trigger another click.
Inspect the visible export status and wait for one new download instead. If the
person using Chrome accepts or dismisses either dialog, the agent must stop
interacting with the tab until that one run either downloads a file or visibly
returns to idle. Agent and person must not both retry the control.

If no new JSON appears, stop and ask for help; do not retry. If multiple new
JSON files appear, report the duplicate runs and do not choose one silently.
The synchronous in-page single-flight guard prevents a second export handler
from starting while the first is active, including while its dialog is open.

### Recommended optional live-discovery window

Live URL discovery is availability-sensitive and is not needed to check known
map files, dimensions, metadata, or fingerprints. Use it only when the audit
needs fresh map-to-area association evidence. For a normal account whose
current `GetAccountInfo` rules release tomorrow at 12:00 Singapore time, start
the maintenance run at **12:01 SGT**. The one-minute offset avoids the exact
release boundary while reducing the chance that people or automated booking
clients have already taken every seat in a small area.

For one selected library, the preferred bounded probes are:

1. tomorrow's first valid interval, typically 10:00; then
2. only if the first response contains no exact-area `areaMapUrls`, today's
   last valid full interval, typically 19:00.

Treat 10:00 and 19:00 as common examples, not universal constants. The code
selects the earliest tomorrow interval and latest today interval that cover the
most areas in the selected branch, based on each area's current hours and slot
rules. Also use the release time returned by the account rules: for example,
start at 11:01 when privileged booking is released at 11:00. An unresolved
area remains incomplete evidence; do not repeat the operation merely to chase
an availability-scoped omission.

The export embeds the extension version and whether targeted discovery was used.
Do not reuse a
discovery export produced by a build that predates exact-area response
scoping: a multi-area response could have associated a neighboring map with
the requested area. Regenerate it with the current build instead.

## Capture a current catalog

Build and reload the maintenance extension, then open the normal Seat Booking page
and wait for the extension catalog to load:

```text
https://www.nlb.gov.sg/seatbooking/
```

Expand **Seat-plan maintenance**, click **Export audit catalog**, and accept
the confirmation. Click once; apply the single-run and dialog-recovery rules.
The extension refreshes `GetAccountInfo` and downloads
`nlb-seat-plan-catalog-YYYY-MM-DD.json`. It makes no availability searches.
Canceling the prompt makes no API calls or download.

The reviewed `mapPath` in each annotation definition is the source of truth
for an already known area. Candidate capture downloads that file again and
records current dimensions, SHA-256, byte length, content type, ETag, and
Last-Modified. A changed image at an unchanged URL is therefore detected.
`GetAccountInfo` remains authoritative for the complete current branch, area,
and seat catalog and can expose newly added branches or areas. Record raw
catalog branch, area, and seat counts before capture: when a catalog omits a
reviewed area, candidate capture retains that definition so its reviewed map
path can still be fingerprinted, which means candidate counts alone must not
be used as proof that the raw catalog still contains the branch or area.

Routine `observedMapUrls` are allowed to be empty. The normalizer ignores the
generic `mapUrls` field found on bookings, and the audit treats URL absence as
unobserved rather than removed. It compares map associations only for an exact
area successfully returned by a deliberate targeted branch discovery.

If a new area has no map URL, or fresh association evidence is specifically
required, select one library and use **Discover selected library maps** as a
separate operation. It refreshes `GetAccountInfo` and makes at most two
sequential branch-level searches without `AreaId`. Each returned area record
is still matched by exact `areaId`; omitted areas are listed in
`mapDiscovery.failed`. The export mode is `targeted-discovery`, and a non-empty
failure list makes the resulting report incomplete.

For a complete audit, run the wrapper that captures a candidate without
overwriting the reviewed baseline and produces both machine-readable and HTML
reports:

```bash
npm run seat-plans:full-audit -- \
  --catalog /path/to/nlb-seat-plan-catalog-YYYY-MM-DD.json
```

Outputs are written beneath an ignored timestamped directory in
`seat-plan-work/`: `candidate.json`, `drift.json`, and `report.html`. Exit code
`0` means clean, `2` means drift was found, and `3` means requested targeted
discovery evidence is incomplete. The report is still generated for codes `2`
and `3`. The HTML links the generated evidence and reviewed configuration,
compares observed branch, area, and seat counts with the current baseline, and
lists branch/area lifecycle changes, changed or missing map images, and missing
annotation coverage. Every drift item includes evidence checks, allowed
dispositions, operational context when tracked, and concrete resolution steps.
Known or explained drift remains exit code `2` until reviewed state is actually
reconciled.

The lower-level candidate command remains available:

```bash
npm run seat-plans:capture -- \
  --catalog /path/to/nlb-seat-plan-catalog-YYYY-MM-DD.json \
  --output /tmp/seat-plan-candidate.json
```

The command downloads maps sequentially and refreshes every image by default;
`--cache-only` is intended only for offline tooling development. If
`GetAccountInfo` omits a known map URL, the candidate still checks the reviewed
definition path, and that omission is not drift. Use optional targeted branch
discovery only if the reviewed path cannot be downloaded, a new area has no
reviewed path, or non-empty authoritative evidence conflicts with the reviewed
association. Do not run parallel live API or map discovery requests.

For a reviewed definition absent from the raw catalog, candidate capture marks
`catalogState: "absent"` and `seatSource: "reviewed-annotation"`. Those seats
are retained only for annotation/image review and never count as current raw
catalog evidence.

A directly guessed image URL can establish that an asset exists, but cannot by
itself establish that NLB currently associates that asset with the requested
area. Keep the reviewed baseline unchanged until exact-area API evidence and a
human review agree.

## Audit drift

Compare the candidate with the committed baseline:

```bash
npm run seat-plans:audit -- \
  --snapshot /tmp/seat-plan-candidate.json \
  --output /tmp/seat-plan-drift.json \
  --html /tmp/seat-plan-drift.html
```

Exit code `0` means no differences. Exit code `2` means the report contains
changes requiring review. Exit code `3` means requested targeted discovery did
not return one or more areas; do not interpret missing availability-scoped
evidence as clean or as a removal.

| Change | Required action |
| --- | --- |
| First capture of stable IDs, disabled flags, or authoritative map URLs | Review as baseline enrichment; the JSON report retains the details |
| Availability-scoped seat code first appears or disappears | Treat as transient discovery evidence, not baseline drift |
| Existing name/code/disabled metadata changes | Confirm the identity match before updating the baseline |
| Map URL changes but image SHA-256 is unchanged | Review the new path and update the definition/baseline |
| SHA-256 changes at the same dimensions | Treat the clickable layer as invalid; compare images and every hotspot |
| Image dimensions change | Re-project or recreate hotspots, then review every coordinate |
| Seat renamed with the same stable ID | Confirm the printed label and update the hotspot seat name |
| Seat added or removed | Update coverage and geometry; verify the complete area catalog |
| Branch added | Confirm live identity and opening status, accept catalog state with annotation pending, then create reviewed definitions and independent tests |
| Branch removed | Confirm complete evidence, review linked operational sources, then reject, suspend, or retire; archive before removing active configuration |
| Area added | Accept the catalog area with annotation pending; discover and annotate only from exact reviewed evidence |
| Area removed | Confirm the parent branch remains and the result is not availability-scoped; archive before suspension or retirement |

Range and hybrid plans always require manual verification of endpoint order
and arrow direction. OCR must not decide those assignments.

See the maintenance skill's
[`drift-actions.md`](../.agents/skills/maintain-seat-plans/references/drift-actions.md)
for the complete branch, area, seat, metadata, and map decision matrix.

### Archive before removal

Generate a read-only proposal for a reported removal:

```bash
npm run seat-plans:archive-proposal -- \
  --report /path/to/drift.json \
  --branch <branch-id>
```

Use `--area <branch-id:area-id>` for an area. The proposal includes the
reviewed catalog areas, seats, image metadata, fingerprints represented by the
baseline, annotation definitions, operational context, and acceptance
checklist. It does not change the baseline, runtime index, fingerprints,
inventory, tests, or retirement ledger.

After explicit approval, append the reviewed evidence to
`docs/data/seat-plan-retirements.json`, remove the retired item from active
configuration, regenerate artifacts, update documentation, and rerun the full
verification workflow.

### Simulate Ang Mo Kio reopening

Run the deterministic future scenario without browser or network access:

```bash
npm run seat-plans:simulate-amk-reopening
```

The generated report is prominently labelled simulation. It assumes
Queenstown has already been retired from the accepted baseline and adds a
synthetic Ang Mo Kio branch with one placeholder area and placeholder seats on
20 November 2026. The output tests report behavior only; real branch IDs,
areas, seats, map evidence, opening status, and annotations must come from a
fresh live audit. The simulated report therefore shows AMK onboarding drift
without re-reporting the already resolved Queenstown removal.

## Prepare an annotation update

Prepare all annotation-affecting drift in one proposal-only review index:

```bash
npm run seat-plans:prepare-drift -- \
  --report /path/to/drift.json
```

The command writes an ignored `annotation-review/index.html`, links all area
comparison packets it could prepare, and lists lifecycle or failed cases that
still require manual handling. It does not edit annotation definitions or the
reviewed baseline.

To prepare one known area directly, generate an ignored review packet:

Generate an ignored review packet:

```bash
npm run seat-plans:prepare -- \
  --branch <branch-id> \
  --area <area-id> \
  --snapshot /tmp/seat-plan-candidate.json
```

For a known translation or scale, add `--scale-x`, `--scale-y`,
`--translate-x`, and `--translate-y`. Without overrides, the proposal scales
coordinates by the old and new image dimensions.

The packet contains the current image, the cached baseline image when
available, old-coordinate and proposed SVG overlays, proposal JSON, changed
seat lists, and map fingerprints. If the old content-addressed image is unavailable, recover it
from a trusted build artifact or review history; a digest alone cannot recreate
the image.

For a small layout change, image registration may be used to propose
translated or scaled rectangles. OCR or shape detection may propose new
labels. Generated coordinates remain drafts: inspect every rectangle at source
resolution and confirm every seat name against the sanitized catalog.

## Accept a reviewed update

1. Record the reviewed disposition. For removal, approve and retain an archive
   proposal before changing active configuration.
2. Update, add, suspend, or retire the definition under `src/data/seatPlans/`
   and its runtime index entry.
3. Add an independent expected-seat fixture. Do not derive the fixture from
   the definition being tested.
4. Put the reviewed candidate at `docs/data/seat-plan-baseline.json` or, only
   after approved archive and lifecycle decisions, run capture with the
   sanitized catalog and `--accept-catalog`. Catalog-backed baseline overwrite
   is rejected without that explicit flag.
5. Regenerate fingerprints and inventory with `npm run seat-plans:capture`.
6. Update branch inventory, retirement records, drift action documentation,
   and aggregate counts as applicable.
7. Run `npm run seat-plans:verify`, `npm test`, `npm run typecheck`, and
   `npm run build` for the normal release artifact.
8. Inspect the generated overlay, smoke-test the area in Chrome, and run a
   fresh audit. Exit code `0` must come from reconciliation, not suppression.

`seat-plans:verify` permits catalog areas explicitly marked pending annotation.
It requires one-to-one coverage for every active implemented definition,
dimensions, SHA-256, complete seat names, inventory counts, current generated
artifacts, and no active definition for a retired branch or area.

## Runtime failure behavior

The picker fetches the image once with the existing page session, hashes those
exact bytes with Web Crypto, and renders them from an in-memory object URL.
Clickable hotspots are enabled only after path, dimensions, SHA-256, geometry,
seat identity, and coverage validation pass. A mismatch disables the complete
clickable layer and leaves seat-number search available.

Do not implement runtime OCR, coordinate inference, or automatic acceptance of
new artwork.

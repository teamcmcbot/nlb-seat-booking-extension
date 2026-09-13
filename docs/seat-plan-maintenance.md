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

## Anonymous automated collection

The standalone collector uses a fresh, non-persistent Playwright Chromium
context. It requires neither an extension nor NLB sign-in. Install once:

```bash
npm ci
npx playwright install chromium
```

For a routine collection and complete deterministic audit:

```bash
npm run seat-plans:verify
npm run seat-plans:ci
```

On Linux without a desktop, install browser OS dependencies with
`npx playwright install --with-deps chromium` and run
`xvfb-run --auto-servernum npm run seat-plans:ci`. Headed Chromium is the
default: a headless Chrome probe did not initialize NLB on 12 September 2026,
while fresh headed Chrome and Chromium received HTTP 200 with
`accountInfo: null`. This is point-in-time evidence, not a guarantee of access
from every network or future NLB deployment. GitHub-hosted network access was verified on 13 September 2026; see the
hosted validation record below. Future access can still change.

To generate only the catalog, or deliberately discover one branch:

```bash
npm run seat-plans:collect -- --output seat-plan-work/my-run/catalog.json
npm run seat-plans:collect -- --output seat-plan-work/my-discovery/catalog.json --branch 2
```

Choose a new output filename for every run. `--channel chrome` uses an installed
Chrome browser with a fresh context; `--headless` is available for explicit
compatibility experiments. Neither option attaches to a personal browser
profile. No cookies are read or exported, no authentication state is saved,
and no raw payload, browser trace, screenshot, or HAR is written. Collection
requires an explicit `accountInfo: null` and validates the complete known
`settings.menus.branchMenus[].areas[].seats[]` structure before normalization.
Malformed identities, missing arrays, empty seat collections, duplicates, or
lost seat records fail collection rather than suggesting removals. Empty branch
menus and facility-2 meeting rooms are excluded by the existing extension
parser; `collectionScope` records their IDs and raw menu counts separately
from the normalized seat-catalog counts. Structural plausibility checks in
the audit remain necessary; an anonymous catalog cannot prove operational
opening status or completeness merely by returning HTTP 200.

The collector reuses the page's one native startup `GetAccountInfo` response.
It does not perform an additional refresh. Routine mode allows zero
`SearchAvailableAreas` requests. An explicit `--branch` uses the existing
Singapore-time discovery planner for at most two sequential branch-level
`OffsiteMode` searches, without `AreaId`, accepting only exact returned area
associations. It does not simulate account privileges. Availability-scoped
omissions remain incomplete evidence. NLB API writes and login navigation are blocked. The browser may load NLB
resources and the site's normal AWS WAF initialization script and validation
requests; these are additional setup traffic beyond the catalog/search
budget. Access or CAPTCHA failures stop the run instead of invoking login or
challenge-bypass logic.

Standalone exports retain schema 1 and mode `catalog` or `targeted-discovery`,
with `source: "anonymous-browser"`, collector version, repository version,
Git source revision, modified-worktree flag, and `anonymous: true`. They do
not pretend to come from an installed extension. The full-audit wrapper
validates compatible producer provenance; existing extension exports continue
to use the extension-version check.

### GitHub workflow and review artifacts

`.github/workflows/seat-plan-audit.yml` runs daily at 12:05 SGT and supports
manual dispatch. Leave the optional branch input empty for routine audits;
use a numeric branch ID only for deliberate targeted discovery. Scheduling
does not require the next-day availability release window. Scheduled jobs may
be delayed; overlapping audit runs are serialized. The workflow uses read-only
repository permissions and no NLB credentials or account secrets.

The workflow installs Chromium and uses Xvfb, verifies the reviewed baseline,
collects the anonymous catalog, refreshes map bytes sequentially, and runs the
existing drift audit. Exit codes are `0` clean, `2` drift, `3` incomplete, and
`1` collection/capture failure. Non-clean outcomes fail the job, while its
artifact step still preserves the generated evidence. No issue, PR, baseline,
fingerprint, retirement, or annotation is automatically created or changed.

`seat-plans:ci` writes a fresh timestamped directory under `seat-plan-work/`
and produces `seat-plan-audit.tar.gz`. Extract the entire archive before
opening the report; repository-relative links resolve to included reviewed
configuration. Only allowlisted sanitized results, reviewed configuration,
and referenced map bytes are packaged. `image-index.json` distinguishes
current and reviewed image evidence; a null path means old artwork was not
available on that runner. A digest cannot reconstruct an old image. Artifacts
are retained for 30 days; retain a reviewed artifact separately if it is
needed beyond that window. The workflow does not persist browser profiles or
upload the ignored image cache wholesale.

Catalog generation, fingerprint comparison, and report generation require no
LLM. Use the skill for investigation and visual review when drift is found.
Acceptance remains a separate reviewed change. The visible extension export
below remains a manual fallback when standalone collection cannot reach NLB.

### Retrieve a scheduled report and follow up

Open the repository's **Actions → Seat-plan audit → specific run**. The run's
summary shows status, catalog counts, images checked, and total changes.
Download its `seat-plan-audit-<run-id>-<attempt>` artifact and extract the
contained `seat-plan-audit.tar.gz` in a fresh ignored directory. The bundle's
README identifies the HTML report path. It includes `catalog.json` (sanitized
source evidence, never the original account response), `candidate.json`,
`drift.json`, `summary.md`, reviewed configuration, and available referenced
map images. A failed collection may have only a failure summary and reviewed
configuration; setup failures or cancellation can prevent artifact creation.

When asking the maintenance skill to investigate, supply the run URL or the
extracted report path. It should inspect the latest completed run including
failures, not silently select an older successful run. Record the run ID,
attempt, timestamp, producer revision, and status. Check the report's included
baseline against the current worktree before preparing changes; later accepted
changes may already resolve old findings. Do not re-collect merely to read an
existing report. An expired artifact or failed collection is missing evidence.

Pushover notifications, AWS integration, and Terraform provisioning are deferred.
The workflow requires no AWS role, SSM parameter, or notification environment.
Results are available in the GitHub Actions job summary and downloadable artifact.
GitHub's own Actions notifications depend on your account notification settings.

No GitHub issue or maintenance agent is automatically invoked. Drift, incomplete
evidence, or collection failure produces a failed audit run. Each audit compares
with the committed reviewed baseline, so unresolved findings recur on later runs.
Follow-up investigation and accepted changes remain manual using the maintenance
skill.

### Local validation on 12 September 2026

Fresh headed Playwright Chromium on macOS, normal `/seatbooking/` route,
`accountInfo: null`, no extension or personal browser profile:

- Catalog: 22 seat branches, 81 areas, 2,030 seats; raw menu counts were 35
  branches and 87 areas, with exclusions recorded in `collectionScope`.
- Targeted Jurong discovery: one startup account call and one tomorrow-at-10:00
  `OffsiteMode` search returned all five seat-area map associations.
- Full targeted audit: 81 fresh map downloads, zero changed or missing images,
  and five map-URL enrichment findings. No baseline was accepted or changed.
- Routine end-to-end audit: one startup account call, zero availability
  searches, 81 fresh map downloads, zero changes, exit code 0 (clean).
- Automated checks: 43 test files and 316 tests passed, plus typecheck, build,
  reviewed-baseline verification, and diff checks. The failure-artifact path
  was also exercised without contacting NLB.
- Portable artifact generated successfully; all HTML report links resolved
  inside the extracted bundle.
- This local test did not establish hosted-runner access; the separate
  successful hosted validation on 13 September 2026 is recorded below.

## Prerequisites for the extension export fallback

The extension-based path for a live catalog and refreshed image fingerprints
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

### GitHub-hosted validation on 13 September 2026

[Run 34736694335, attempt 1](https://github.com/teamcmcbot/nlb-seat-booking-extension/actions/runs/34736694335)
passed on Ubuntu with headed Chromium under Xvfb, at revision
`8fae82978f28384cb0ba338144c07dfec3ce751b`. The anonymous catalog captured at
03:56:53 UTC contained 22 seat branches, 81 areas, and 2,030 seats, using one
GetAccountInfo and zero SearchAvailableAreas requests. All 81 map images were
checked, with zero drift or missing evidence. The uploaded artifact was
downloaded and its report links and all 162 current/reviewed image references
verified against SHA-256. The included baseline matched the worktree. The
temporary feature-branch push trigger was removed after validation.

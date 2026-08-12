# Seat-plan maintenance

NLB can change branches, areas, seat identities, and map artwork without
notice. This workflow detects that drift before stale coordinates are treated
as clickable seats and prepares review material for annotation updates.

## Sources of evidence

Use each source only for the evidence it can provide:

| Source | Reliable maintenance evidence | Limitation |
| --- | --- | --- |
| `GetAccountInfo` | Current branch, area, and complete seat identity catalog; some map URLs | No seat coordinates; map URLs may be absent |
| `SearchAvailableAreas` | Exact-area map discovery and booking seat codes | Date- and interval-scoped results are not proof that a seat was removed |
| Map image bytes | Artwork revision, dimensions, MIME type, and byte length | Labels and seat geometry still require visual review |
| Annotation definitions | Reviewed seat-to-rectangle assignments | Valid only for the fingerprinted map revision and catalog |

Never retain raw account payloads. The maintenance export includes only
normalized branch, area, seat, disabled, and map identity fields. It excludes
user IDs, bookings, quotas, availability slots, cookies, and authentication
state.

## Tracked artifacts

- `docs/data/seat-plan-baseline.json` is the machine-readable point-in-time
  baseline. It records area metadata, seat identities, map metadata, and the
  raw image SHA-256.
- `src/data/seatPlanFingerprints.ts` is generated from the baseline and bundled
  into the extension for runtime verification.
- `docs/seat-plan-inventory.md` is generated from the baseline for human
  review.
- `.cache/seat-plans/` is an ignored content-addressed image cache. Preserve it
  locally when comparing an old image with a replacement.
- `seat-plan-work/` is an ignored directory for generated review packets.

SHA-256 is authoritative for byte identity. `ETag` and `Last-Modified` are
retained only as diagnostic hints. A future decoded-pixel or perceptual hash
may help classify re-encoding and visual similarity, but must not authorize a
map automatically.

## Capture a current catalog

Build and reload the unpacked extension, then open the normal Seat Booking page
and wait for the extension catalog to load:

```text
https://www.nlb.gov.sg/seatbooking/
```

In that tab's DevTools console, run:

```js
window.dispatchEvent(
  new Event("nlb-seat-helper:export-seat-plan-catalog"),
);
```

The event is handled entirely inside the extension and does not add a query
parameter or make a maintenance request to NLB. Confirm the export when
prompted. The extension then downloads a sanitized JSON file. Canceling the
prompt does nothing.

When a complete map-URL and booking-code refresh is required, use the explicit
discovery form instead:

```js
window.dispatchEvent(
  new CustomEvent("nlb-seat-helper:export-seat-plan-catalog", {
    detail: { discoverMaps: true },
  }),
);
```

After a second confirmation, the extension probes every area with at most one
`SearchAvailableAreas` request in flight. This may make one request per area
and take several minutes. The downloaded catalog includes a discovery summary,
all map URLs observed for each exact area, and booking seat codes observed in
the selected probe interval. A missing booking code is not evidence that a
seat was removed: date- and interval-scoped search results may contain only
currently available seats.

Capture a candidate baseline without overwriting the reviewed baseline:

```bash
npm run seat-plans:capture -- \
  --catalog /path/to/nlb-seat-plan-catalog-YYYY-MM-DD.json \
  --output /tmp/seat-plan-candidate.json \
  --refresh
```

The command downloads maps sequentially and refreshes every image by default;
`--cache-only` is intended only for offline tooling development. If
`GetAccountInfo` omits a map URL,
use the existing exact-area map-discovery behavior to produce a sanitized
catalog with that URL before concluding that the map was removed. Do not run
parallel live API or map discovery requests.

## Audit drift

Compare the candidate with the committed baseline:

```bash
npm run seat-plans:audit -- \
  --snapshot /tmp/seat-plan-candidate.json \
  --output /tmp/seat-plan-drift.json
```

Exit code `0` means no differences. Exit code `2` means the report contains
changes requiring review.

| Change | Required action |
| --- | --- |
| First capture of stable IDs, codes, disabled flags, or map URLs | Review as baseline enrichment; the JSON report retains the details |
| Existing name/code/disabled metadata changes | Confirm the identity match before updating the baseline |
| Map URL changes but image SHA-256 is unchanged | Review the new path and update the definition/baseline |
| SHA-256 changes at the same dimensions | Treat the clickable layer as invalid; compare images and every hotspot |
| Image dimensions change | Re-project or recreate hotspots, then review every coordinate |
| Seat renamed with the same stable ID | Confirm the printed label and update the hotspot seat name |
| Seat added or removed | Update coverage and geometry; verify the complete area catalog |
| Branch or area added | Create a new definition and independent expected-seat test |
| Branch or area removed | Remove only after confirming the complete catalog source |

Range and hybrid plans always require manual verification of endpoint order
and arrow direction. OCR must not decide those assignments.

## Prepare an annotation update

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

1. Update or add the definition under `src/data/seatPlans/`.
2. Add an independent expected-seat fixture. Do not derive the fixture from
   the definition being tested.
3. Put the reviewed candidate at `docs/data/seat-plan-baseline.json` or rerun
   capture without `--output` using the sanitized catalog.
4. Regenerate fingerprints and inventory with `npm run seat-plans:capture`.
5. Run `npm run seat-plans:verify`, `npm test`, `npm run typecheck`, and
   `npm run build`.
6. Inspect the generated overlay and smoke-test the area in Chrome.

`seat-plans:verify` checks one-to-one baseline/definition coverage, dimensions,
SHA-256 format, complete seat-name coverage, inventory counts, and whether the
generated fingerprint and inventory files are current.

## Runtime failure behavior

The picker fetches the image once with the existing page session, hashes those
exact bytes with Web Crypto, and renders them from an in-memory object URL.
Clickable hotspots are enabled only after path, dimensions, SHA-256, geometry,
seat identity, and coverage validation pass. A mismatch disables the complete
clickable layer and leaves seat-number search available.

Do not implement runtime OCR, coordinate inference, or automatic acceptance of
new artwork.

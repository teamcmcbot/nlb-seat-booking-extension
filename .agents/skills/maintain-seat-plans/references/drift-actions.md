# Seat-plan drift actions

Read this reference whenever a seat-plan audit reports drift. Detection is
read-only. Validate evidence, choose a disposition, preserve anything leaving
active configuration, apply the smallest reviewed update, and rerun the audit.

## Evidence gates

Before accepting a structural removal or addition:

1. Confirm the export has recognized maintenance provenance and came from the
   routine complete `GetAccountInfo` path.
2. Confirm global branch, area, and seat totals are plausible and that branch,
   area, and seat identities are not duplicated or malformed.
3. Do not use date- or interval-scoped availability omissions as catalog
   removal evidence.
4. Re-check matching closure or reopening context against the linked official
   NLB location page or another dated authoritative response.
5. If evidence remains uncertain, keep drift unresolved or mark it incomplete;
   do not update the baseline to silence the report.

## Lifecycle changes

| Drift | Investigation | Resolution |
| --- | --- | --- |
| Branch added | Confirm stable ID, code, official name, opening status, all areas, and seats. | Accept catalog state with annotations pending, then discover exact maps only where needed and create reviewed definitions and independent tests. |
| Branch removed | Confirm complete catalog and dated closure, relocation, or API evidence. | Reject, suspend, or retire. Archive all affected area, seat, map, fingerprint, and hotspot evidence before updating active baseline, definitions, fingerprints, inventory, tests, and branch documentation. |
| Branch ID changed | Treat as removal plus addition; investigate possible migration. | Never transfer annotations automatically. Revalidate every area, seat, map, and hotspot. |
| Area added | Confirm parent branch, stable area ID, name, floor, and complete seats. | Accept the catalog area with annotation pending; create clickable coverage only after exact map and geometry review. |
| Area removed | Confirm the branch remains and the omission is from complete catalog evidence. | Reject, suspend, or retire the area. Archive its reviewed evidence before removing active references. |
| Area ID changed | Treat as removal plus addition. | Revalidate from scratch; matching names are only investigative hints. |

A whole-branch removal is one hierarchical event. Report affected area and seat
counts under it rather than emitting every child as unrelated removal drift.

### Temporary closures without structural drift

If a branch or area is reported temporarily closed but remains unchanged in the
complete catalog, there is no seat-plan identity drift to accept. Keep the
operational notice and holiday/closure test coverage separate. Do not change
map fingerprints or hotspots solely from the notice. If product behavior must
hide or disable a still-present closed branch, treat that as a separately
reviewed runtime-status feature.

If the branch or area is also absent from the complete catalog, report removal
drift. A short closure may justify `suspended`; a long rebuild may justify
`retired`. Both require archive evidence before active configuration is
removed.

## Seat changes

| Drift | Investigation | Resolution |
| --- | --- | --- |
| Seat added | Confirm complete area catalog and an explicit printed map label. | Keep complete clickable coverage failed closed until reviewed geometry or a deliberate partial-coverage decision is accepted. |
| Seat removed | Distinguish absence from `disabled: true`; inspect the current map. | Preserve old identity and hotspot in lifecycle history, then remove active coverage and update baseline and independent fixture. |
| Same ID, new name | Confirm continuity using the ID and printed label. | Update `seatName` and independent fixture. |
| Same name, new ID | Confirm the new stable ID repeatedly. | Update `expectedSeatId`; otherwise classify as removal plus addition. |
| Disabled flag changed | Confirm current catalog state. | Update metadata; retain geometry only while runtime selection remains disabled for disabled seats. |
| Seat code changed | Determine whether it is availability-scoped. | Treat availability codes as informational, not stable identity or geometry evidence. |
| Duplicate ID or name | Identity is ambiguous. | Mark evidence incomplete and do not mutate reviewed state. |

## Metadata and map changes

| Drift | Resolution |
| --- | --- |
| Branch name/code or area name/floor | Match by stable IDs, confirm complete catalog evidence, and update metadata. Review geometry only if map or seats also changed. |
| Routine map URL omitted | Treat as unobserved, not removal. |
| Exact-area path changed, same SHA-256 | Review association, then update path and baseline. |
| SHA-256 changed at same dimensions | Keep clickable seats disabled and inspect every hotspot at source resolution. |
| Dimensions changed | Re-project only as a proposal and manually verify every coordinate, label, range direction, and coverage rule. |
| Map missing or download failed | Mark evidence incomplete; do not update the fingerprint. |

## Applying an accepted decision

For removal, create an archive proposal first. After approval, append a
discoverable entry to `docs/data/seat-plan-retirements.json`, remove retired or
suspended definitions from the runtime index, reconcile the accepted baseline,
regenerate fingerprints and inventory, update aggregate and independent tests,
and update operational documentation.

For additions, the catalog entity may be accepted with `annotationStatus:
"missing"`. The verifier must permit catalog areas without definitions while
still requiring every `implemented` area to have exactly one definition and
fingerprint.

Finish with `npm run seat-plans:verify`, `npm test`, `npm run typecheck`,
`npm run build`, and another audit. Exit code `0` must reflect actual
reconciliation, not a suppression list.

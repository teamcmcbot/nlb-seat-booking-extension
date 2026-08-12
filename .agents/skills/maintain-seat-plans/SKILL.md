---
name: maintain-seat-plans
description: Audit and maintain NLB seat-plan annotations using sanitized catalog snapshots, image fingerprints, drift reports, visual overlays, and deterministic verification. Use when a branch, area, seat identity, map URL, map image, hotspot, annotation baseline, or seat-plan inventory may have changed or when adding a new clickable seat plan.
---

# Maintain Seat Plans

Maintain annotations as reviewed evidence, never as runtime inference. Read
[`docs/seat-plan-maintenance.md`](../../../docs/seat-plan-maintenance.md)
completely before changing a baseline or definition.

## Workflow

1. Protect unrelated work and inspect the current branch and diff.
2. Obtain a current sanitized catalog export. Use the documented sequential
   discovery form when complete per-area map URL evidence is required. Never
   save or commit a raw `GetAccountInfo` response.
3. Run `npm run seat-plans:capture` to a candidate output and then
   `npm run seat-plans:audit` against the committed baseline.
4. Read the complete drift report. Do not infer seat removal from
   availability-scoped search results.
5. For every changed area, run `npm run seat-plans:prepare` and inspect the
   source-resolution image and hotspot overlay.
6. Classify metadata-only, path-only, image, dimension, seat identity, and
   area lifecycle changes according to the maintenance document.
7. Update annotation definitions only after confirming every seat identity and
   rectangle. Treat computer-vision transforms and OCR as proposals.
8. Regenerate the reviewed baseline, fingerprint module, and inventory.
9. Run `npm run seat-plans:verify`, the relevant independent annotation test,
   the complete test suite, typecheck, and build.
10. Report which live catalog/date/map evidence was checked and which visual
    cases still require a person.

## Guardrails

- Preserve sequential NLB requests and the existing page-session model.
- Do not read cookies, store authentication state, or retain personal account
  or booking data.
- Do not accept unchanged dimensions as proof that artwork is unchanged.
- Do not update a fingerprint merely to make verification pass.
- Require manual ordering review for range and hybrid plans.
- Keep clickable seats disabled when map, fingerprint, catalog, geometry, or
  coverage evidence is ambiguous.
- Keep expected-seat tests independent of the definition under test.

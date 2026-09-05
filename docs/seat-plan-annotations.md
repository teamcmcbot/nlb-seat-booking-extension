# Seat-plan annotations

NLB seat-plan images do not expose seat coordinates through the observed API.
The extension can therefore make a plan clickable only after a maintainer has
reviewed an annotation tied to an exact map revision.

See [`seat-plan-maintenance.md`](seat-plan-maintenance.md) for drift capture,
fingerprinting, work-packet generation, and acceptance. The generated
[`seat-plan-inventory.md`](seat-plan-inventory.md) lists the current baseline.
Operational branch closures, renovations, reopenings, and special-hours notes
are tracked separately in [`branch-inventory.md`](branch-inventory.md). They do
not mutate annotations by themselves, but confirmed structural drift can lead
to an explicitly reviewed suspension or retirement after archive evidence is
prepared.

## Safety model

An annotation is enabled only when all of these match:

- branch ID;
- area ID;
- complete map path, including its revision query when present;
- source-image width and height;
- SHA-256 of the exact image bytes rendered by the picker;
- non-overlapping, in-bounds hotspot geometry;
- exactly one current catalog seat for every annotated seat name;
- optional expected seat IDs; and
- all current catalog seats when the definition declares complete coverage.

Any failed check disables the complete clickable layer for that plan. The
image and seat-number search remain available. A hotspot changes only the
account's local favourite list; it never represents availability or booking
authority.

When exactly one reviewed definition exists for the selected branch and area,
the picker starts from that definition's map path rather than trusting the
order of maps in a live multi-area response. The normal path, dimensions, and
SHA-256 checks still apply before any hotspot is enabled. Unreviewed areas use
only map paths discovered on their exact area record.

## Adding a labelled plan

1. Capture and audit the current sanitized catalog and image fingerprint using
   the maintenance workflow. Do not start from a map image alone.
2. Confirm that every seat being annotated has an explicit, unambiguous label
   on the image. Leave range-only sections for the separately reviewed range
   implementation.
3. Add source-pixel rectangles under `src/data/seatPlans/`. Use one seat name
   per rectangle and keep rectangles from overlapping. When the artwork uses
   presentation-only zero padding that differs from the live catalog (for
   example, printed `ES01` versus catalog `ES1`), store the exact catalog seat
   name while retaining the hotspot over the printed label.
4. Use `coverage: "complete"` only when every current catalog seat is mapped.
   Otherwise use `coverage: "partial"` and document the omitted region.
5. Add the definition to `src/data/seatPlans/index.ts`, then update the reviewed
   baseline and regenerate the fingerprint module and inventory.
6. Add a service test that resolves the definition against a sanitized list of
   the area's catalog seats and verifies every intended seat name.
7. Run `npm run seat-plans:verify`, `npm test`, `npm run typecheck`,
   `npm run build`, and a live Chrome smoke test before release.

OCR or image processing may suggest labels and rectangles during authoring,
but every shipped coordinate and seat assignment must be checked by a person.
The extension must not infer or generate hotspot identities at runtime.

For a reviewed range-only run, `mappingBasis: "range-order"` records that the
hotspots follow the printed endpoints and arrow direction. A hybrid plan uses
`mappingBasis: "hybrid-range-order"` when individually labelled seats are
combined with such a reviewed range. The picker tells users when this mapping
basis applies; assignments remain static and revision-locked rather than being
inferred at runtime.

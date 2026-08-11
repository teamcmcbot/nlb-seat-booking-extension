# Seat-plan annotations

NLB seat-plan images do not expose seat coordinates through the observed API.
The extension can therefore make a plan clickable only after a maintainer has
reviewed an annotation tied to an exact map revision.

See [`seat-plan-inventory.md`](seat-plan-inventory.md) for the audited list of
83 current areas, their map revisions and dimensions, label type, and current
annotation status.

## Safety model

An annotation is enabled only when all of these match:

- branch ID;
- area ID;
- complete map path, including its revision query when present;
- source-image width and height;
- non-overlapping, in-bounds hotspot geometry;
- exactly one current catalog seat for every annotated seat name;
- optional expected seat IDs; and
- all current catalog seats when the definition declares complete coverage.

Any failed check disables the complete clickable layer for that plan. The
image and seat-number search remain available. A hotspot changes only the
account's local favourite list; it never represents availability or booking
authority.

## Adding a labelled plan

1. Record the branch ID, area ID, exact `-sp` filename, query string, and the
   image's natural pixel dimensions from the current NLB response.
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
5. Add the definition to `src/data/seatPlans/index.ts`.
6. Add a service test that resolves the definition against a sanitized list of
   the area's catalog seats and verifies every intended seat name.
7. Run `npm test`, `npm run typecheck`, `npm run build`, and a live Chrome smoke
   test before release.

OCR or image processing may suggest labels and rectangles during authoring,
but every shipped coordinate and seat assignment must be checked by a person.
The extension must not infer or generate hotspot identities at runtime.

For a reviewed range-only run, `mappingBasis: "range-order"` records that the
hotspots follow the printed endpoints and arrow direction. A hybrid plan uses
`mappingBasis: "hybrid-range-order"` when individually labelled seats are
combined with such a reviewed range. The picker tells users when this mapping
basis applies; assignments remain static and revision-locked rather than being
inferred at runtime.

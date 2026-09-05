# Branch inventory

This is a manually maintained operational-status overlay for library branches.
It is intentionally separate from the generated
[`seat-plan-inventory.md`](seat-plan-inventory.md), which records reviewed map,
seat, fingerprint, and annotation evidence only.

## Status and evidence

Operational notices last recorded: **1 September 2026**. Queenstown's
seat-plan retirement was recorded: **5 September 2026**.

The notices below were supplied from the NLB chatbot and are user-reported,
point-in-time operational evidence. They are not a captured NLB API closure
contract and must be rechecked against NLB's [Our Libraries and
Locations](https://www.nlb.gov.sg/main/visit-us/our-libraries-and-locations)
page or another dated authoritative notice before being treated as current
operational truth.

The machine-readable operational context used by the drift report is
[`data/branch-status.json`](data/branch-status.json). It links each notice to
the official NLB directory, this inventory, and the dated chatbot record. These
notes guide investigation but never suppress catalog drift or authorize a
baseline change.

| Library | Reported status | Reviewed seat-plan coverage |
| --- | --- | --- |
| Orchard Library | Closed until the second half of 2026 | None |
| Cheng San Library | Closed until the first half of 2027 | None |
| Marine Parade Library | Closed until mid-2027 | None |
| Queenstown Library | Closed from 31 August 2026 until late 2028 | Retired 5 September 2026; 2 areas, 50 seats archived |
| Ang Mo Kio Library | Closed from 1 August 2026; planned reopening on 20 November 2026 at AMK Hub | None |

NLB library pages also commonly state that libraries close at 5.00pm on the
eves of Christmas, New Year, and Chinese New Year and close on public holidays.
See the [official NLB operating-hours wording](https://reference.nlb.gov.sg/contact-us/).
Treat this as a date-specific operating-hours test input, separate from the
seat-plan baseline and image fingerprints.

## Maintenance rules

- A closure notice alone does not change the baseline. When a complete catalog
  also detects structural removal, the report remains drift until a maintainer
  explicitly rejects, suspends, or retires the affected configuration.
- A branch remaining in `GetAccountInfo` does not prove that it is open or
  bookable; catalog identity and operational status are separate evidence.
- Do not run live booking tests or targeted map discovery for a known closed
  branch solely because it remains in the catalog.
- Archive reviewed catalog, map, fingerprint, seat, and hotspot evidence before
  removing a suspended or retired plan from active configuration.
- After a confirmed reopening, treat reappearance as new drift and refresh the
  catalog, maps, fingerprints, and date-specific availability before restoring
  selectable seats. Never reactivate old hotspots automatically.
- Keep closure notices and reopening evidence in this file rather than adding
  temporary status fields to the generated seat-plan inventory.

Queenstown's long renovation was accepted as a retirement on 5 September 2026.
Its two areas and 50 seats remain preserved in the retirement ledger, while no
Queenstown plan remains in the active baseline or runtime annotation index.

## Interpreting the 1 September 2026 audit

The raw downloaded catalog actually contained **22 branches, 81 areas, and
2,030 seats**, with no Queenstown branch. The generated audit candidate then
re-added the two missing reviewed Queenstown areas from the annotation
inventory so their known map paths could still be fingerprinted. This made the
candidate totals appear as **23 branches, 83 areas, and 2,080 seats** and
masked the branch/area removal from the current drift comparison.

The audit's 100 review items were therefore a secondary artifact of that
fallback: the synthesized Queenstown areas contained the 50 reviewed seat
names but no current catalog seat IDs or `disabled` fields. They were not a
reliable representation of the raw `GetAccountInfo` catalog.

The lifecycle-aware audit now preserves that distinction:

- Raw catalog coverage is reported as **22/81/2,030** while the supplemented
  annotation-audit candidate remains **23/83/2,080**.
- Queenstown is reported once as a removed branch affecting two areas and 50
  seats, rather than as 100 synthetic seat metadata changes.
- The report attaches the tracked renovation notice and recommends validating
  the complete export, producing an archive proposal, then choosing `rejected`,
  `suspended`, or `retired`.
- The report remains drift until the accepted baseline and active annotation
  configuration are reconciled. A known explanation is not a clean result.

After the retirement was applied, the accepted baseline is **22 branches, 81
areas, and 2,030 seats**. The Queenstown notice remains an operational record,
but an identical catalog no longer produces a Queenstown drift event.

## Simulated Ang Mo Kio reopening

Run `npm run seat-plans:simulate-amk-reopening` to generate a deterministic,
clearly labelled future scenario under `seat-plan-work/simulations/`. The
fixture assumes Queenstown remains absent and a synthetic Ang Mo Kio branch,
placeholder area, and placeholder seats appear on 20 November 2026. It is not
live NLB evidence and must never supply real IDs, counts, maps, or annotations.

The simulated report should show Ang Mo Kio as `branch-added`, attach the
planned AMK Hub reopening notice, and recommend confirming live branch/area/
seat identities, accepting the catalog branch with annotation pending, using
targeted map discovery only if needed, and creating new reviewed annotations
and independent tests. Because Queenstown's retirement has been applied, the
simulation does not emit a second Queenstown removal event.

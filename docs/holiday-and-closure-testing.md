# Holiday and Early-Closure Testing

Status: full-day closure handling implemented; partial-day, exception, and
planned-revamp live testing still required.

This document records the extension's current behavior, holiday-related fields
observed in NLB's current web client, and the tests still required for
partial-day closures, area-specific exceptions, and planned branch closures.

## 12 September 2026 hours review

**Ordinary area hours are supported; complete public-holiday parity is not yet
established.** Code review of version 1.4.1 confirms each area's own
`GetAccountInfo` hours and booking interval generate its timeline. There is no
single timetable for all branches, and no extension-imposed 20:00 cutoff.

The rendered [NLB library directory](https://www.nlb.gov.sg/main/visit-us/our-libraries-and-locations)
was checked on 12 September 2026. The named holiday eves are Christmas, New
Year, and Chinese New Year. Its public-access notices distinguish:

| Location | Published access distinction |
| --- | --- |
| Choa Chu Kang | Main library 11:00–21:00; Multimedia and Study Zone 09:00–22:00, including public holidays and the three named holiday eves. |
| Bukit Batok | Main library 11:00–21:00, with early access 09:00–11:00; Level 2 Multimedia and Study Zone 09:00–22:00 including those holidays/eves. |
| Punggol | Main library 10:00–21:00; Level 3 Study Zone via Lift Lobby B 09:00–22:00 including those holidays/eves. |
| Clementi, Harbourfront, Yishun | Main library 11:00–21:00, early access 09:00–11:00, and staff-assisted services from 11:00; normal holiday/eve closure notices still apply. |

These are dated public-access observations, not API booking-window fixtures.
Do not generalize a holiday exception to every area in the branch, or assume
that early access alone means public-holiday access. NLB's
[Choa Chu Kang fact sheet, dated 24 November 2025](https://www.nlb.gov.sg/main/main/-/media/NLBMedia/Documents/Visit-Us/Libraries/CCKPL/Choa-Chu-Kang-Library-Fact-Sheet.pdf)
also describes separate gated access to its Study and Multimedia Zone.

The maintainer's 12 September comparison found booking starts from 09:00 to
20:00 in both the extension and NLB site for Choa Chu Kang's study area. For
one-hour slots, the final 20:00 start ends at 21:00. Illustrative API hours
09:00–21:00 generate exactly those starts; the exact current raw hours were
not captured here, so this is consistent with the implementation but does not
prove the field value or explain NLB's access/booking difference. Do not infer
that the remaining hour is walk-in-only or requires on-site booking.

The day's sanitized maintenance catalog contains seat identities and map
metadata, but no operating hours, holiday settings, or availability. The clean
seat-plan audit is not a holiday or operating-hours verification.

The maintainer also supplied an NLB chatbot operating-hours summary on
12 September, now recorded in the [branch inventory](branch-inventory.md#nlb-chatbot-operating-hours-summary-12-september-2026).
It lists the ordinary 10:00/11:00 opening groups, early access at four
libraries, Clementi's reported 13 July 2026 effective date, and the three
holiday-inclusive study-zone exceptions. This supports prioritizing those
zones for testing, but does not establish the `ignoreHolidays` API contract.
Its normal-hours list includes branches under renovation and must not override
their current closure notices.

### Authority at each stage

| Stage | Current behavior and limitation |
| --- | --- |
| Initial timeline | Generate complete slots inside the selected area's API hours. Today uses the undated account matrix; an applicable normalized holiday overrides it with closed cells. Future availability requires a date-specific check. |
| Manual refresh/check | Today refreshes account data and uses its matrix, falling back to sequential exact-interval searches when the matrix is unusable. Future dates use exact-interval searches. An applicable holiday blocks scans; no public-directory hours are imported. |
| Map discovery | Metadata only; it cannot extend hours, exempt an area from a holiday, or make cells available. Normal UI discovery is skipped for a known holiday; optional maintenance probes have a separate metadata-only budget. |
| Booking preflight/submission | Refresh account data, recheck the holiday, preserve current-day false matrix values, and check the exact selected blocks. `bookings/Book` remains final authority. Server validation does not fix an open holiday area that the UI already prevents users from selecting. |

### What remains unverified

An applicable holiday with no recognized branch exclusion closes every area
in that branch in the extension. `ignoreHolidays` is not normalized or applied.
Consequently, the Choa Chu Kang, Bukit Batok, and Punggol zones above may be
incorrectly shown as closed if NLB permits holiday seat reservations there.
Public access is verified; holiday reservation support still needs same-area
API and official booking-UI evidence. Do not remove the ordinary holiday guard:
the National Day matrix anomaly below is evidence that it is necessary.

Prioritize a read-only comparison for those zones and an ordinary area in each
branch on a released holiday date. Record the exact area ID, API hours,
interval length, holiday/exclusion/exception fields, official UI starts and
ends, and bounded sequential exact-interval responses. Compare the final
reservable interval with the advertised access end. Repeat on a holiday eve
around 17:00 and for a 09:00 early-access area on an ordinary date. No real
booking or cancellation is authorized solely for these tests.

This review changes documentation only. It does not establish live holiday,
holiday-eve, or extended-hours booking parity and does not enable exemptions.

## Planned Deepavali verification: 6-9 November 2026

Decision recorded 12 September: defer runtime changes and gather the missing
holiday/area-exception evidence first. Preserve the existing full-day guard.

[MOM's 2026 holiday announcement](https://www.mom.gov.sg/newsroom/press-releases/2025/0616-public-holidays-for-2026)
lists Deepavali on Sunday, 8 November, and Monday, 9 November as a public
holiday. MOM's [holiday calendar](https://www.mom.gov.sg/employment-practices/public-holidays)
also explains the Monday entitlement where Sunday is the employee's rest day.
Verify NLB's own closure settings for both dates; employment entitlement is
not an area-specific booking contract.

Plan reminders for **12:05 Singapore time (UTC+08:00)**, allowing five minutes
after the currently observed normal-account next-day release:

| Check date | Released dates to compare | Purpose |
| --- | --- | --- |
| Friday, 6 November | Today and Saturday, 7 November | Establish ordinary-day reference and inspect Deepavali eve's next-day hours. |
| Saturday, 7 November | Today's eve and Sunday, 8 November | Compare the eve's current-day matrix with Friday's evidence; inspect holiday settings and next-day ordinary/extended-area behavior. |
| Sunday, 8 November | Today's Deepavali and Monday, 9 November | Check whether holiday metadata correctly overrides today's matrix and how the observed Monday holiday is represented. |
| Monday, 9 November | Today's observed holiday and Tuesday, 10 November | Verify Monday's behavior and the return to ordinary availability without extending the configured booking window. |

Confirm the account's actual release time and advance-booking rules on each
run. Friday does not release Sunday for a normal one-day account. Do not
assume 7 November closes at 17:00: Deepavali eve is not among NLB's standard
published Christmas, New Year and Chinese New Year early-closing eves.
This campaign cannot replace a later verified test of one of those eves.

Compare an ordinary area with Choa Chu Kang, Bukit Batok and Punggol study
zones. Record exact branch/area IDs, area opening/closing times and interval,
`settings.holidays`, `excludedBranches`, any area `ignoreHolidays`, the official
booking UI's starts/ends, today's matrix, and bounded sequential date-specific
checks. Missing fields and conflicting results must remain explicit unknowns.
Use the same areas across days, and distinguish physical access from booking.

An active signed-in NLB tab is needed for the live comparison. These are
reminders and read-only evidence checks; they do not authorize bookings,
cancellations, runtime changes, or baseline acceptance. Sanitize all retained
evidence. The seat-plan maintenance export alone does not contain the hours
or holiday settings needed for this investigation.

## Known planned closures and revamps

The following point-in-time notices were supplied from the NLB chatbot on
1 September 2026. They are operational evidence to verify, not a captured
`GetAccountInfo` holiday record or a reviewed seat-plan baseline:

| Library | Reported closure or reopening notice |
| --- | --- |
| Orchard Library | Closed until the second half of 2026 |
| Cheng San Library | Closed until the first half of 2027 |
| Marine Parade Library | Closed until mid-2027 |
| Queenstown Library | Closed from 31 August 2026 until late 2028 |
| Ang Mo Kio Library | Closed from 1 August 2026; planned reopening on 20 November 2026 at AMK Hub |

Re-check these notices against NLB's [Our Libraries and Locations](https://www.nlb.gov.sg/main/visit-us/our-libraries-and-locations) page before
using them as current operational truth. The public directory is the preferred
source for branch opening information, while the chatbot wording remains
user-reported and currently undated beyond the report date above.

The extension does not automatically consume this table. A validated NLB
closure signal or separately reviewed implementation is required before planned
revamp dates can affect runtime availability.

The reviewed seat-plan baseline currently contains no active plan for these
five libraries. Queenstown's two areas and 50 annotated seats were retired on
5 September 2026 and preserved in the retirement ledger. The other four
libraries do not currently have reviewed seat-plan definitions. A branch's presence in the
Seat Booking catalog is not proof that it is open or bookable, and a planned
closure must not by itself remove a baseline or alter seat geometry.

NLB branch pages also commonly state that libraries close at 5.00pm on the
eves of Christmas, New Year, and Chinese New Year and close on public holidays;
for example, see the [official NLB operating-hours wording](https://reference.nlb.gov.sg/contact-us/). This is a date-specific operating
hours rule to test separately from a full-day `settings.holidays` closure.

## Why this needs live testing

Normal area records provide opening and closing times, but a public holiday or
holiday eve may change the real operating hours for a particular date. Some
areas may also remain available when the rest of a branch is closed.

The authoritative behavior may be applied by:

- `GetAccountInfo` settings and branch/area metadata;
- `SearchAvailableAreas` for the requested date and interval; or
- the final `bookings/Book` validation.

We should not infer special opening hours without confirming which response is
authoritative.

## Signals observed in the current NLB client

The current NLB web client references the following data:

- `settings.holidays`, containing holiday date ranges and
  `excludedBranches`;
- branch opening-day metadata;
- branch dwell-time rules with `weeklyMaxDwellMinutes` and
  `holidayMaxDwellMinutes`;
- an area-level `ignoreHolidays` flag; and
- booking-level `areaIgnoreHolidays`.

NLB labels an `ignoreHolidays` area as an extended-hours zone that may remain
available on public holidays.

The `settings.holidays` shape has now been captured on 8 and 9 August 2026 for
National Day. The live 9 August response incorrectly marked 17,688 of 21,065
current-day seat/time entries available while libraries were closed. This
confirms that an applicable holiday must override `hasAvailableSlots`.

The specific full-day example is:

```json
"holidays": [
  {
    "name": "NationalDay2026",
    "startTime": "2026-08-09T00:00:00",
    "endTime": "2026-08-09T00:00:00",
    "excludedBranches": []
  }
]
```

The empty `excludedBranches` array is interpreted as no branch exemptions, so
the holiday applies to every normalized branch in the catalog. We have not yet
captured a non-empty array, so its item shape is not confirmed to be branch
IDs. The current parser accepts primitive numbers or strings and compares them
case-insensitively to both the branch ID and branch code. This supports a
numeric-ID list and a code list provisionally; it is not evidence that NLB
accepts both forms. Object entries are currently ignored by normalization,
which intentionally leaves the closure applied rather than risking an
unverified branch exemption.

Non-empty branch exclusions, a holiday eve, and an extended-hours area have
not yet been captured and compared.

## Current extension behavior

The extension currently:

1. Calculates the selectable date range from `advanceBookingDays`, the booking
   release time, and whether today's last normal start time has passed.
2. Builds intervals from the selected area's normal `openingTime`,
   `closingTime`, and booking interval.
3. Removes elapsed intervals when the selected date is today.
4. Uses `GetAccountInfo` → `seats[].hasAvailableSlots` for today's reference
   availability. If the refreshed selected area has zero entries matching its
   remaining generated timeline, it rejects the observed overnight `01:00`
   placeholder and treats those cells as unknown.
   On initial load or page refresh, a restored area with valid favourites
   automatically validates the freshly loaded matrix once; a matching holiday
   closes the timeline before any fallback search.
5. Calls `SearchAvailableAreas` once for each generated interval when the
   selected date is tomorrow or another future date, and for today's remaining
   intervals only when the refreshed current-day matrix is unusable. A holiday
   closure prevents both paths. Closing the seat picker runs this same path
   only when the final favourite-seat identity set differs from its opening
   snapshot and still contains a seat; an unchanged or empty final set skips
   it. The main Favourite seats **Manage** → **Done** flow uses the same
   comparison and refresh rule.
   Changing the library, area, or date also runs the path after the resulting
   selection settles when that area has at least one favourite.
6. Makes one map-discovery `SearchAvailableAreas` call when the selected area
   has no cached map; that response does not change timeline availability.
   Routine maintenance export makes no availability probe. Optional targeted
   library discovery first probes the first released future date, even when it
   is a holiday, and falls back once to today's latest remaining interval when
   branch areas remain unresolved. These metadata probes never make a holiday
   timeline selectable.
7. Refreshes `GetAccountInfo` and preflights selected booking blocks with
   exact `SearchAvailableAreas` calls immediately before booking. A preflight
   may reject a selection but cannot turn a current-day false matrix value
   into true.
8. Relies on `bookings/Book` as the final server-side validation.
9. Normalizes validated holiday start/end calendar dates as an inclusive
   full-day range and exempts a branch whose ID or code is listed in
   `excludedBranches`.
10. Keeps closed dates in the released date range for inspection, renders
    their normal intervals as grey non-interactive cells, skips map discovery
    and availability scans, and rechecks the holiday after the booking-time
    account refresh.

It does **not** currently:

- apply `holidayMaxDwellMinutes`;
- change opening or closing time for a holiday eve;
- treat `ignoreHolidays` areas differently; or
- skip intervals that are inside normal hours but outside special-day hours.

### Consequences on special dates

On a full holiday, an ordinary branch remains selectable if the date is inside
the released advance-booking window, but every normal interval is rendered as
a grey closed cell. Favourite seats remain visible, while the cells cannot be
selected or booked. Holiday handling does not extend the range to the next
open but unreleased calendar day.

The captured account payload did not contain `ignoreHolidays`. The extension
therefore closes those areas as well rather than letting uncertain
availability override a confirmed branch closure. A verified exception model
is still needed before an extended-hours area can remain available.

### Revisit trigger for half-days

This full-day rule must be revisited when a future holiday-eve or half-day
capture provides all of the following:

- the same branch and area captured before and after the special date;
- a holiday record whose clock values differ from midnight, or a separate
  date-specific opening-hours field;
- matching `SearchAvailableAreas` responses before, at, and after the alleged
  closing time; and
- confirmation that `bookings/Book` accepts only the verified operating window.

Until that evidence exists, changing the clock interpretation would risk
turning an uncertain closure into selectable green cells.

On a future early-closure day, the extension may make unnecessary calls for
intervals after the special closing time. Those cells should not become green
unless NLB reports them as available, but the UI does not currently label them
as "closed". For an early closure today, the extension depends on NLB's
current-day matrix to mark those times unavailable.

## Is the day after a holiday selectable?

The extension treats `advanceBookingDays` as calendar days; it does not skip
closed dates to find the next open date.

With `advanceBookingDays: 1`:

- On the day before a holiday, the day after the holiday is two calendar days
  away and is not selectable.
- On the holiday itself, the following day can become selectable when it is
  within the released one-day booking window.
- Before the configured release time, the next day's availability may not yet
  be released.

This behavior should remain unchanged unless live NLB responses demonstrate
that `advanceBookingDays` means open-library days rather than calendar days.

## Live test matrix

Capture results for the same library and area where possible.

| Scenario | What to inspect | Expected extension behavior |
| --- | --- | --- |
| Ordinary weekday | Normal metadata, today's matrix, and future interval responses | Existing timeline behavior |
| Holiday eve with early closure | Area hours, today's matrix, dwell limits, and future responses before/after closure | No selectable green cells after actual closure |
| Full holiday, ordinary area | Holiday record, branch exclusion, today's matrix, and future interval responses | Date remains inspectable and every interval is explicitly closed/unavailable |
| Planned renovation closure | Dated NLB closure notice, branch catalog presence, holiday/closure settings, and date-specific responses | Treat the branch as operationally closed for the affected dates; do not infer openness from catalog presence or remove its seat-plan baseline automatically |
| Planned reopening after renovation | Confirmed reopening notice, refreshed branch/area catalog, map image, and exact availability response | Re-audit before restoring selectable seats or accepting the old annotation baseline as current |
| Full holiday, `ignoreHolidays` area | Area flag, today's matrix, and future interval responses | Only genuinely operating intervals selectable |
| Holiday excluded for one branch | `excludedBranches` and two branch responses | Excluded branch follows normal behavior if NLB intends that exception |
| Holiday followed by an open day | Date range before and after release time | Follows confirmed `advanceBookingDays` semantics |
| Failed or ambiguous API response | Status and payload | Fail closed; never make an uncertain interval selectable |

## Data to capture

For each scenario, record:

### `GetAccountInfo`

- current server/client datetime;
- `advanceBookingDays`;
- booking release times;
- `settings.holidays`;
- any known planned closure or reopening notice, including its source and
  effective dates;
- relevant branch code and holiday exclusions;
- branch dwell-time configuration;
- area ID, facility ID/code, normal opening/closing times, and
  `ignoreHolidays`; and
- relevant seats' `hasAvailableSlots` entries for a current-day test; and
- the selected date's quota.

For an overnight reliability test, also record repeated sanitized samples
before midnight and at regular intervals after midnight until the complete
current-day matrix returns. Compare the same area with
`SearchSeatAvailability` and one exact `SearchAvailableAreas` interval. The
14 August comparison found the same placeholder in `SearchSeatAvailability`
and usable exact-area results in `SearchAvailableAreas`; repeat the comparison
to identify NLB's recovery time without assuming a fixed cutoff.

### `SearchAvailableAreas`

For a future-date test, capture one interval before, at, and after the expected
closure:

- request branch, area, date, start time, and duration;
- HTTP status;
- whether the area is returned;
- returned start/end time;
- `ignoreHolidays`;
- available-seat count and seat list; and
- any error code or message.

### Booking validation

Do not create a test booking solely to probe a closed interval. If a normal
user booking is attempted during planned testing, record the `bookings/Book`
response and whether quota changes only after success.

Remove user ID, booking references, and other account-specific information
before storing fixtures in the repository.

## Proposed implementation after verification

Remaining implementation after the other fields are confirmed:

1. Normalize verified dwell limits and `ignoreHolidays`.
2. Generate only the intervals inside verified date-specific operating hours.
3. Preserve confirmed extended-hours-area access on full holidays.
4. Keep `SearchAvailableAreas` and `bookings/Book` as server-side safeguards.
5. Fail closed whenever holiday metadata and availability responses conflict.

## Acceptance criteria

Holiday support is complete only when:

- a fully closed ordinary area cannot show a selectable interval;
- an early closure produces no API calls or selectable cells after closure;
- a planned renovation closure is not treated as open merely because its
  branch or seat plan remains in the catalog;
- a planned reopening triggers a fresh catalog, map, and availability review
  before seats become selectable;
- an extended-hours area remains usable only for its confirmed hours;
- branch-specific holiday exclusions are respected;
- the next open date follows NLB's actual advance-booking semantics;
- ambiguous or failed checks never enable booking; and
- ordinary-day behavior remains unchanged.

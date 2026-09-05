# Holiday and Early-Closure Testing

Status: full-day closure handling implemented; partial-day, exception, and
planned-revamp live testing still required.

This document records the extension's current behavior, holiday-related fields
observed in NLB's current web client, and the tests still required for
partial-day closures, area-specific exceptions, and planned branch closures.

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

The reviewed seat-plan baseline currently contains Queenstown only among these
five libraries: two areas and 50 annotated seats. The other four libraries do
not currently have reviewed seat-plan definitions. A branch's presence in the
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

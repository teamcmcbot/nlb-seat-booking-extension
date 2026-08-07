# Holiday and Early-Closure Testing

Status: investigation and live testing still required.

This document records the extension's current behavior, holiday-related fields
observed in NLB's current web client, and the tests required before explicit
holiday support is implemented.

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

These fields have been observed in the web client but have not yet been
captured and compared across a real holiday, holiday eve, ordinary weekday,
and extended-hours area.

## Current extension behavior

The extension currently:

1. Calculates the selectable date range from `advanceBookingDays`, the booking
   release time, and whether today's last normal start time has passed.
2. Builds intervals from the selected area's normal `openingTime`,
   `closingTime`, and booking interval.
3. Removes elapsed intervals when the selected date is today.
4. Uses `GetAccountInfo` → `seats[].hasAvailableSlots` for today's reference
   availability. The matrix has times but no calendar date.
5. Calls `SearchAvailableAreas` once for each generated interval when the
   selected date is tomorrow or another future date.
6. Makes one map-discovery `SearchAvailableAreas` call when the selected area
   has no cached map; that response does not change timeline availability.
7. Refreshes `GetAccountInfo` and preflights selected booking blocks with
   exact `SearchAvailableAreas` calls immediately before booking. A preflight
   may reject a selection but cannot turn a current-day false matrix value
   into true.
8. Relies on `bookings/Book` as the final server-side validation.

It does **not** currently:

- exclude a date because it appears in `settings.holidays`;
- apply branch holiday exclusions;
- apply `holidayMaxDwellMinutes`;
- change opening or closing time for a holiday eve;
- treat `ignoreHolidays` areas differently; or
- skip intervals that are inside normal hours but outside special-day hours.

### Consequences on special dates

On a full holiday, the date may remain selectable if it is inside the normal
advance-booking window. For today, the extension renders NLB's current-day
`hasAvailableSlots` matrix. For a future holiday, it generates the area's
normal intervals and asks `SearchAvailableAreas` about each one.

Expected safe outcomes are:

- NLB returns no available seats, so the cells appear red;
- NLB omits the closed area; or
- NLB rejects the request and the scan is marked incomplete.

An extended-hours area may still return availability. This must be verified
against `ignoreHolidays`.

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
| Full holiday, ordinary area | Holiday record, branch exclusion, today's matrix, and future interval responses | Date disabled or every interval explicitly closed/unavailable |
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
- relevant branch code and holiday exclusions;
- branch dwell-time configuration;
- area ID, facility ID/code, normal opening/closing times, and
  `ignoreHolidays`; and
- relevant seats' `hasAvailableSlots` entries for a current-day test; and
- the selected date's quota.

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

Once the authoritative fields are confirmed:

1. Normalize holiday ranges, excluded branches, dwell limits, and
   `ignoreHolidays`.
2. Compute date availability for the selected branch and area.
3. Disable fully closed dates when NLB provides enough information to do so.
4. Generate only the intervals inside date-specific operating hours.
5. Label special closures separately from ordinary seat unavailability.
6. Keep `SearchAvailableAreas` and `bookings/Book` as server-side safeguards.
7. Fail closed whenever holiday metadata and availability responses conflict.

## Acceptance criteria

Holiday support is complete only when:

- a fully closed ordinary area cannot show a selectable interval;
- an early closure produces no API calls or selectable cells after closure;
- an extended-hours area remains usable only for its confirmed hours;
- branch-specific holiday exclusions are respected;
- the next open date follows NLB's actual advance-booking semantics;
- ambiguous or failed checks never enable booking; and
- ordinary-day behavior remains unchanged.

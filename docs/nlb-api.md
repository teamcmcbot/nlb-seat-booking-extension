# NLB Seat Booking API Notes

Status: unofficial, reverse-engineered integration notes.

This document describes the NLB Seat Booking HTTP endpoints used by NLB Seat
Helper, the response fields consumed by the extension, and behavior observed
while testing. It is not official NLB documentation and is not a promise that
the endpoints or fields will remain stable.

The notes are based on:

- the extension source through version `1.1.0`;
- a `GetAccountInfo` response captured on 30 July 2026;
- booking-state observations made on 31 July 2026; and
- successful availability and booking requests made during extension testing.

All times in the captured data are interpreted in Singapore time
(`Asia/Singapore`, UTC+08:00). Examples in this repository are sanitized.

## API overview

| Purpose | Method | Endpoint |
| --- | --- | --- |
| Account, quotas, bookings, branches, areas, seats, and rules | `GET` | `/seatbooking/api/accounts/GetAccountInfo` |
| Full current seat/time reference matrix used by NLB's availability page | `GET` | `/seatbooking/api/seatAvailability/SearchSeatAvailability` |
| Available seats for one interval | `GET` | `/seatbooking/api/areas/SearchAvailableAreas` |
| Create one booking | `POST` | `/seatbooking/api/bookings/Book` |
| Cancel one complete booking | `PATCH` | `/seatbooking/api/bookings/Cancel` |
| End the Seat Booking application session | `POST` | `/seatbooking/api/logout` |
| End the central NLB sign-in session | `GET` | `https://signin.nlb.gov.sg/authenticate/oidc/logout` |

The extension runs as a content script on `https://www.nlb.gov.sg/seatbooking/`
and sends same-origin requests with:

```http
Accept: application/json, text/plain, */*
```

It sets `credentials: "include"`, which makes the browser use the signed-in
NLB session already associated with the tab. The extension does not read or
store NLB cookies.

## Sign-in and sign-out lifecycle

Sign-in uses NLB's authorization-code flow and redirects back to:

```text
https://www.nlb.gov.sg/seatbooking/?code={one-time-code}&state={state}
```

The extension does not exchange or persist that code. NLB's Seat Booking page
establishes the application session, after which the extension detects the
account through `GetAccountInfo`. Because that processing may still be in
progress when the content script starts, the extension uses a short bounded
retry after an expected authentication return.

Sign-out is a two-step operation:

```http
POST https://www.nlb.gov.sg/seatbooking/api/logout
Content-Type: application/json

{
  "Mode": "OffsiteMode"
}
```

The `Mode` field is required. Omitting it can cause the endpoint to reject an
otherwise valid signed-in session with `401 Unauthorized`.

After a successful response, the browser navigates to:

```text
https://signin.nlb.gov.sg/authenticate/oidc/logout?service=https%3A%2F%2Fwww.nlb.gov.sg%2Fseatbooking%2F
```

NLB clears the central sign-in session and redirects to the Seat Booking page.
The extension then starts in its signed-out state. It does not manipulate
cookies directly.

`POST /bookings/Book` additionally sends:

```http
Content-Type: application/json
```

## Reliability and compatibility rules

- HTTP responses outside the `2xx` range are treated as errors.
- `GetAccountInfo` must return JSON. A non-JSON response is treated as a likely
  expired or redirected session.
- `401` and `403` from `GetAccountInfo` are shown as a missing NLB session.
- `SearchAvailableAreas` requests time out after six seconds.
- A `429` or `5xx` `SearchAvailableAreas` response is retried once after
  approximately 600 milliseconds.
- Future-date timeline calls and booking-preflight calls run sequentially
  rather than concurrently.
- A failed interval never becomes selectable. Successful intervals from the
  same future-date scan remain usable, while the overall scan is marked
  incomplete.
- Booking requests run sequentially and are not automatically retried. An
  automatic retry could create a duplicate booking when the server completed
  the first request but the response was lost.

## `GET /accounts/GetAccountInfo`

### Request

```http
GET https://www.nlb.gov.sg/seatbooking/api/accounts/GetAccountInfo
Accept: application/json, text/plain, */*
Cookie: supplied by Chrome through credentials: "include"
```

There is no request body.

### Response status and sign-in state

The observed top-level object contains:

```ts
interface GetAccountInfoResponse {
  accountInfo: AccountInfo | null;
  action: unknown;
  branchId: number | string | null;
  settings: Settings;
  // Additional fields may be present.
}
```

`accountInfo: null` means the catalog may still be available but the extension
does not consider the user signed in. A non-null `accountInfo` with a non-empty
`userId` becomes the active account session.

A machine-readable compatibility schema for the subset consumed by the
extension is available at
[`schemas/get-account-info.consumed.schema.json`](schemas/get-account-info.consumed.schema.json).
It deliberately allows unknown fields because the NLB response is larger than
the extension's data model.

See
[`examples/get-account-info.sanitized.json`](examples/get-account-info.sanitized.json)
for a complete sanitized example.

### Account schema

```ts
interface AccountInfo {
  userId: string;
  allowAdvanceBooking?: boolean;
  dailyBookingQuotas?: BookingQuota[];
  advancedBookingQuotas?: AdvancedBookingQuota[];
  bookings?: Booking[];
}

interface BookingQuota {
  name: string;
  code: string;
  quotaInMinutes: number;
  remainingQuotaInMinutes: number;
}

interface AdvancedBookingQuota {
  bookingDateTime: string;
  advancedDailyBookingQuotas: BookingQuota[];
}
```

#### Account fields used by the extension

| Field | Use |
| --- | --- |
| `userId` | Displays `Connected to {userId}` and establishes that account data exists. |
| `allowAdvanceBooking` | Chooses the privileged release time when true and configured. |
| `dailyBookingQuotas` | Supplies today's remaining and total quota. |
| `advancedBookingQuotas[].bookingDateTime` | Associates advanced quota with a calendar date using the first ten characters (`YYYY-MM-DD`). |
| `advancedBookingQuotas[].advancedDailyBookingQuotas` | Supplies quota for the corresponding advanced date. |
| `bookings` | Identifies intervals already occupied by the signed-in account. |

The preferred quota is the item whose `code` is `StudyArea`,
case-insensitively. If it is absent, the extension falls back to the first
quota item.

Quota values remain in minutes internally. The UI formats them as `4h`,
`1h 30m`, `30m`, or `0h`.

### Existing booking schema

The raw response contains more booking information than the extension keeps:

```ts
interface Booking {
  bookingId: number | string;
  bookingRefId?: string | null;
  bookingTimeslotInMinutes?: number;
  branchId: number | string;
  facilityId?: number | string | null;
  lastAction: string;
  actions?: string[];
  seat: string;
  area: string;
  areaInformation?: unknown;
  areaIgnoreHolidays?: boolean;
  floor?: number | string | null;
  branchName?: string;
  startTime: string;
  endTime: string;
  areaImageUrls?: string[];
  mapUrls?: string[];
  infoJson?: unknown;
  canCancelStatus?: boolean;
  canCheckInStatus?: boolean;
  canExtendStatus?: boolean;
}
```

#### Booking fields used by the extension

| Field | Use |
| --- | --- |
| `bookingId` | Stable cancellation identity; its original string/number type is preserved for the request. |
| `branchId` | Part of matching a booking to the selected branch. |
| `facilityId` | Helps disambiguate areas and facilities. |
| `floor` | Helps disambiguate an area when its display name differs slightly. |
| `seat` | Matches the displayed seat name, such as `S377`. |
| `area` | Matches the selected area name after punctuation and case normalization. |
| `startTime`, `endTime` | Determines whether a displayed interval overlaps the booking. |
| `lastAction` | Determines whether the extension treats the booking as active. |
| `canCancelStatus` | Required together with `lastAction: "Book"` and a future start time before cancellation is enabled. |

The extension currently considers a booking inactive when `lastAction`
contains `cancel`, case-insensitively:

```ts
active = !/cancel/i.test(lastAction);
```

Consequently, `AutoPartialCancel` is treated as canceled and no longer blocks
another interval. A booking whose `lastAction` remains `Book` is treated as
active, even if other server fields appear stale or contradictory.

The extension does not use `actions`, `canCheckInStatus`, or
`canExtendStatus` for conflict decisions. Cancellation eligibility is stricter
than active-booking detection and requires all of:

```ts
booking.bookingId !== undefined &&
booking.lastAction === "Book" &&
booking.canCancelStatus === true &&
Date.now() < new Date(booking.startTime).getTime()
```

Consequently, a checked-in booking can remain purple as an active booking but
cannot be selected for this pre-start cancellation flow.

### Settings and catalog schema

```ts
interface Settings {
  system: SystemSettings;
  holidays?: Holiday[];
  menus: {
    branchMenus: Branch[];
    cancelReasons?: CancellationReason[];
  };
}

interface Holiday {
  name: string;
  startTime: string;
  endTime: string;
  excludedBranches: unknown[];
}

interface CancellationReason {
  code: string;
  name: string;
  description?: string;
  order?: number;
}

interface SystemSettings {
  advanceBookingDays?: number;
  bookingReleaseTime?: string;
  privilegeUserBookingReleaseTime?: string;
  checkInStartTimeInMinutes?: number;
  checkInEndTimeInMinutes?: number;
  quotaDeductionBlockMinutes?: number;
}

interface Branch {
  id: number | string;
  name: string;
  code?: string;
  areas: Area[];
}

interface Area {
  id: number | string;
  name: string;
  floor?: number | string;
  facilityId: number | string;
  facilityCode?: string;
  openingTime?: string;
  closingTime?: string;
  bookingTimeslotInMinutes?: number;
  minBookingMinutes?: number;
  maxBookingMinutes?: number;
  areaMapUrls?: string[];
  mapUrls?: string[];
  seats: Seat[];
}

interface Seat {
  id: number | string;
  name: string;
  code?: string;
  seatCode?: string;
  disabled?: boolean;
  isDisabled?: boolean;
  hasAvailableSlots?: Array<{
    time: string;
    isAvail: boolean;
  }>;
}
```

#### System fields used by the extension

| Field | Default | Use |
| --- | ---: | --- |
| `advanceBookingDays` | `1` | Calculates the furthest selectable calendar date. |
| `bookingReleaseTime` | no restriction when absent | Determines when the normal advanced date becomes available. |
| `privilegeUserBookingReleaseTime` | normal release time | Used when `allowAdvanceBooking` is true. |

### Holiday closures

Two point-in-time `GetAccountInfo` captures around National Day 2026 returned:

```json
{
  "name": "NationalDay2026",
  "startTime": "2026-08-09T00:00:00",
  "endTime": "2026-08-09T00:00:00",
  "excludedBranches": []
}
```

On 9 August, the current-day seat matrix incorrectly marked 17,688 of 21,065
entries available even though libraries were closed. This establishes that
`hasAvailableSlots` cannot override an applicable holiday record.

The extension validates each timestamp's calendar-date portion and treats the
start and end dates as an inclusive range of full local closed days. Equal
midnight values represent one whole day, not a zero-length closure. A branch
is exempt when its normalized ID or code appears in `excludedBranches`.
Malformed or reversed holiday records are not normalized.

This is a date-closure contract only. The timestamps are not used to infer an
early closing time; no live holiday-eve response has yet established that
meaning.

The only observed `excludedBranches` value is the empty array in the example
above. The extension interprets that as no exemptions, applying the closure to
all branches. No non-empty example has established whether NLB sends branch
IDs, branch codes, or objects. The current parser provisionally consumes
primitive number/string values and matches them against both normalized branch
IDs and branch codes. Unsupported object entries are ignored and do not create
an exemption; this is a fail-closed compatibility behavior that must be
revisited when a branch-specific closure is captured.

When a half-day example is captured, revisit this normalization before adding
time-specific behavior. Compare the same branch and area immediately before,
at, and after the suspected closing time, and retain `SearchAvailableAreas`
and `bookings/Book` as the authorities for the actual operating window.

### Observed next-day release behavior

The captured configuration contains:

```json
{
  "advanceBookingDays": 1,
  "bookingReleaseTime": "2020-01-01T12:00:00+08:00",
  "privilegeUserBookingReleaseTime": "2020-01-01T11:00:00+08:00"
}
```

Only the time portion is used. For a normal account with
`allowAdvanceBooking: false`, the extension currently calculates:

| Current time | Furthest selectable date |
| --- | --- |
| Before 12:00 | Today |
| At or after 12:00 | Tomorrow |

This matches the behavior observed in the NLB calendar on 31 July 2026:
tomorrow was not selectable before noon and became selectable at/after noon.

For an account with `allowAdvanceBooking: true`, the extension uses
`privilegeUserBookingReleaseTime` when it is present. With the captured
configuration, that would make tomorrow selectable from 11:00.

The rule is configuration-driven rather than a hardcoded noon check. If NLB
changes either release-time field or `advanceBookingDays`, the extension uses
the new values returned by `GetAccountInfo`.

`checkInStartTimeInMinutes`, `checkInEndTimeInMinutes`, and other system fields
are currently documented but not enforced by the extension.

### Seat-booking cancellation reasons

Seat-booking reasons are read from:

```text
settings.menus.cancelReasons
```

`settings.menus.visitBookingCancelReasons` is a separate list and is not used
for seat cancellation. The extension displays each valid reason's `name` and
sends its `code`. `ChangeOfPlan` is selected initially when present; otherwise
the first valid server-provided reason is used. One selected reason applies to
all bookings in a cancellation run.

#### Area fields used by the extension

| Field | Default | Use |
| --- | ---: | --- |
| `id` | required | Availability query and booking request. |
| `name` | required | Area selector and booking-location matching. |
| `branchId` or parent branch `id` | required | Library grouping and availability query. |
| `facilityId` | optional | Areas with value `2` are excluded. |
| `facilityCode` | optional | Metadata and future quota/facility matching. |
| `floor` | optional | Booking-location matching. |
| `openingTime` | required for a timeline | First generated interval. |
| `closingTime` | required for a timeline | Stops intervals that would end after closing. |
| `bookingTimeslotInMinutes` | `60` | Size and spacing of timeline intervals. |
| `minBookingMinutes` | `60` | Minimum duration and today's last possible start. |
| `maxBookingMinutes` | `240` | Maximum duration and adjacent-slot merge limit. |
| `areaMapUrls` or `mapUrls` | empty list | Seat-plan discovery; filenames containing `-sp` are preferred. |
| `seats` | empty list | Favourite management and availability matching. |

Discussion rooms and paid facilities observed as `facilityId: 2` are removed
while the catalog is normalized. They never appear in the extension selectors.

#### Seat fields used by the extension

| Field | Use |
| --- | --- |
| `id` or `seatId` | Stable favourite and selection identity. |
| `name` or `seatName` | Display, search, booking matching, and range hints. |
| `code` or `seatCode` | Booking identifier when the account/catalog response supplies it. |
| `disabled` or `isDisabled` | Preserved in the normalized model. |
| `hasAvailableSlots[].time` | Matches current-day timeline cells by local `HH:mm` time. |
| `hasAvailableSlots[].isAvail` | Initial current-day availability; false values cannot be upgraded by booking search. |

The catalog capture did not always include a booking-ready seat code. The
extension therefore obtains `code`/`seatCode` during exact booking preflight
after the user confirms a selection.

Seat names are sorted with numeric-aware comparison. Favourite-seat range
hints are derived at runtime; they are not hardcoded. Numeric sequences such
as `S35` to `S59`, letter sequences such as `S48A` to `S48O`, and up to three
missing values are described explicitly.

### Availability-matrix scope

`hasAvailableSlots` entries contain a local time and availability flag, but no
calendar date. In the captured response, they matched the full current-day
seat/time matrix returned by NLB's seat-availability page. The extension
therefore treats them as current-day reference data only.

They must not be reused for tomorrow or another future date. When a future
date is selected, the extension asks `SearchAvailableAreas` about each exact
date/time interval instead.

## `GET /seatAvailability/SearchSeatAvailability`

NLB's public Seat Availability page uses this endpoint to obtain a full
current seat/time reference matrix. In a point-in-time comparison, its values
matched `GetAccountInfo` →
`settings.menus.branchMenus[].areas[].seats[].hasAvailableSlots` for all 2,103
comparable seats, with no differences.

Neither observed response supplied all booking-ready seat codes or area map
URLs. The extension therefore does not call this endpoint: `GetAccountInfo`
already supplies the same current-day matrix together with account, catalog,
quota, and booking data. This avoids a redundant request.

This endpoint and the embedded `hasAvailableSlots` matrix should be treated as
reference availability, not as the final authority for creating a booking.
The public NLB availability page itself labels its display as reference-only,
and `bookings/Book` remains the server-side authority.

## `GET /areas/SearchAvailableAreas`

This endpoint answers booking availability for one area and one exact
interval. It is used for future-date timeline checks, one-time map discovery,
and selected-block preflight. Its result does not upgrade a current-day
`hasAvailableSlots` false value.

### Query parameters

| Parameter | Example | Meaning |
| --- | --- | --- |
| `Mode` | `OffsiteMode` | Booking mode used by the public off-site flow. |
| `BranchId` | `2` | Selected branch/library identifier. |
| `AreaId` | `43` | Selected area identifier. |
| `StartTime` | `2026-07-31T13:00` | Local start datetime without an explicit UTC offset. |
| `DurationInMinutes` | `60` | Length of the interval being checked. |

Example:

```http
GET /seatbooking/api/areas/SearchAvailableAreas?Mode=OffsiteMode&BranchId=2&AreaId=43&StartTime=2026-07-31T13%3A00&DurationInMinutes=60
```

### Mode and browser location

The observed NLB client chooses `OnsiteModeGps` only after its browser
geolocation polling places the user inside the selected branch's configured
geofence. The on-site state is branch-specific and expires according to the
configured on-site timeout. Otherwise it uses `OffsiteMode`.

Point-in-time tests returned identical `SearchAvailableAreas` payloads for
`OffsiteMode` and `OnsiteModeGps`, but that does not establish that the modes
are interchangeable for every branch, date, or server rule. Sending
`OnsiteModeGps` without the corresponding verified geolocation state would
misrepresent the client context. The extension therefore continues to use
`OffsiteMode`; it does not request location permission or use browser GPS.

### Call pattern

For an area open from 10:00 to 20:30 with a 60-minute interval, the extension
generates starts at 10:00 through 19:00. On a future date that is ten
availability calls. Today uses the `GetAccountInfo` slot matrix and one account
refresh instead.

For today, it removes every start that is not strictly later than the current
time. At 12:00, the displayed matrix begins at 13:00. Past cells are not
generated, cannot appear green, and cannot be selected.

The timeline represents every generated interval. Users select booking times
directly from the returned green cells; there is no separate Start or Duration
filter.

### Accepted response contract

We do not currently have a sanitized raw wire fixture for this endpoint in the
repository. The extension intentionally accepts several casing and nesting
variants because the NLB response has varied during testing.

The parser recursively looks up to twelve levels deep for collections named,
case- and punctuation-insensitively:

- `seat`
- `seats`
- `seatList`
- `availableSeats`

Inside one of those collections it recognizes:

```ts
interface AvailableSeatIdentity {
  id?: string | number;       // or seatId
  code?: string | number;     // or seatCode
  name?: string | number;     // or seatName
}
```

At least one identity field is used to match catalog seats. A booking-ready
identity requires `code`/`seatCode` plus either ID or name.

The parser also looks for `areaMapUrls` or `mapUrls`. It prefers maps attached
to the requested area ID; a single unambiguous map collection is accepted as
a fallback.

The following is an **illustrative minimal shape accepted by the parser**, not
a claim that NLB always returns this exact envelope:

```json
{
  "areas": [
    {
      "id": 43,
      "areaMapUrls": [
        "jrl-3-studyareaescalator-fp.png",
        "jrl-3-studyareaescalator-sp-full.png?t=20221130"
      ],
      "availableSeats": [
        {
          "id": 741,
          "name": "S377",
          "code": "JRL.3.StudyAreaEscalator.377"
        }
      ]
    }
  ]
}
```

Do not use this illustrative response as a strict mock of the NLB server.
Capture and sanitize a real response before tightening the parser or writing
an authoritative response schema.

## `POST /bookings/Book`

This endpoint submits exactly one planned booking.

### Request body

```ts
interface BookRequest {
  areaId: string;
  seatCode: string;
  startTime: string;
  durationInMinutes: number;
  mode: "OffsiteMode";
}
```

Example:

```json
{
  "areaId": "43",
  "seatCode": "JRL.3.StudyAreaEscalator.377",
  "startTime": "2026-07-31T13:00",
  "durationInMinutes": 120,
  "mode": "OffsiteMode"
}
```

`seatCode` is the NLB booking identifier, not merely the visible name such as
`S377`. This is why a green interval cannot be booked until the extension has
obtained the seat code from catalog data or the exact booking preflight.

### Accepted response contract

The booking client requires a non-null JSON object. It treats the response as
failed when either of these fields is explicitly false:

```ts
interface BookResponse {
  success?: boolean;
  isPreferredSeat?: boolean;
  message?: string;
  // Other server fields are currently ignored.
}
```

An HTTP error also fails the booking. When `message` is absent, the extension
shows a generic message that the seat is no longer available.

A successful booking causes `GetAccountInfo` to be fetched again so quota and
existing-booking state can be refreshed.

## `PATCH /bookings/Cancel`

This endpoint cancels one complete booking identified by `bookingId`. It does
not cancel an individual timeline cell inside a multi-hour booking.

### Request body

```ts
interface CancelRequest {
  mode: "OffsiteMode";
  bookingId: number | string;
  CancelReason: string;
}
```

Observed successful request:

```json
{
  "mode": "OffsiteMode",
  "bookingId": 1000002,
  "CancelReason": "ChangeOfPlan"
}
```

The property casing is intentional: `mode` is lower-case while
`CancelReason` begins with capitals. The extension preserves the booking ID's
observed primitive type instead of converting a numeric ID to a string.

Requests use `credentials: "include"`, JSON content headers, and run
sequentially. They are not retried automatically because a lost response may
hide a completed cancellation.

### Observed successful response and reconciliation

One successful response contained a refreshed `accountInfo`, top-level
`action: "ManualFullCancel"`, and the affected booking changed to:

```json
{
  "lastAction": "ManualFullCancel",
  "actions": ["Book", "ManualFullCancel"],
  "canCancelStatus": false
}
```

Complete success and business-error schemas are not confirmed. A `2xx`
response without an explicit `success: false` is therefore provisional. After
the run, the extension fetches `GetAccountInfo` again:

- a missing or inactive booking confirms cancellation;
- a booking that remains active is reported as uncertain; and
- a request that appeared to fail but is inactive in the refreshed account is
  reconciled as cancelled.

No automatic retry is made for failed or uncertain results. Those bookings
remain selected for review; only bookings confirmed missing or inactive are
removed from the cancellation selection.

## Booking lifecycle observations

### Confirmed from captured responses

The same booking entry changes over time through fields such as:

- `lastAction`
- `actions`
- `canCancelStatus`
- `canCheckInStatus`
- `canExtendStatus`

One observed unchecked booking changed from:

```json
{
  "lastAction": "Book",
  "actions": ["Book"],
  "canCancelStatus": true,
  "canCheckInStatus": true
}
```

to:

```json
{
  "lastAction": "AutoPartialCancel",
  "actions": ["Book", "AutoPartialCancel"],
  "canCancelStatus": false,
  "canCheckInStatus": false
}
```

The captured system configuration included:

```json
{
  "checkInStartTimeInMinutes": 15,
  "checkInEndTimeInMinutes": 14
}
```

An unchecked 10:00 booking was observed as `AutoPartialCancel` at
approximately 10:14.

### Observed anomaly on 31 July 2026

At approximately 11:37, an unchecked 11:00–12:00 booking still reported:

```json
{
  "lastAction": "Book",
  "actions": ["Book"],
  "canCancelStatus": true,
  "canCheckInStatus": true
}
```

This was inconsistent with the earlier 10:00 booking and the apparent
14-minute check-in window.

### What is inferred, not proven

It is plausible that NLB performs automatic cancellation asynchronously,
possibly through a scheduled or queued backend process. The delayed entry may
indicate a late or failed backend update. The API responses alone do not prove:

- that a batch job exists;
- its schedule or retry behavior;
- whether `canCheckInStatus: true` remained operational;
- whether quota was restored despite the stale action; or
- whether the record eventually reconciled.

Until more samples are captured, documentation and code should refer to this
as an observed delayed/stale booking state rather than a confirmed batch-job
failure.

### Current extension consequence

Because `lastAction: "Book"` does not contain `cancel`, the extension treats
the stale booking as active and blocks overlapping new selections. This is the
safe behavior: it avoids attempting a second booking while the server still
claims that the first booking is active.

The extension does not reinterpret a stale booking as canceled. A stale
booking whose start time has passed remains purple and non-cancelable even if
`canCancelStatus` is unexpectedly true. NLB remains authoritative.

## Seat-plan image URLs

Map filenames from `areaMapUrls` or `mapUrls` are resolved against:

```text
https://www.nlb.gov.sg/seatbooking/img/areas/{filename}
```

Absolute URLs and paths containing `..` are rejected. If several maps exist,
the extension prefers the filename containing `-sp`, which represents the
seat plan in the observed data.

The observed API does not provide seat coordinates. Clickable seats therefore
come from reviewed extension annotations tied to an exact branch, area, map
revision, source-image size, and SHA-256 of the fetched bytes. The API does not
provide this digest; the maintenance capture computes it from the resolved map
asset. Each annotation must resolve to one current catalog seat before the
overlay is enabled. These hotspots modify local favourites only and are not an
availability or booking authority.

## Privacy and safe fixture capture

Never commit a raw `GetAccountInfo` response without sanitizing it. Remove or
replace:

- `name`
- `userId`
- `email`
- `accountId`
- `bookingId`
- `bookingRefId`
- any QR/check-in token or account-specific URL

Preserve structural fields needed to reproduce behavior, including time
boundaries, action names, facility/area identifiers, and quota values.

When capturing availability, store one successful response and representative
`4xx`, `429`, and `5xx` errors if they occur naturally. Do not create a booking
solely to obtain an error fixture.

## Known unknowns

- Holiday-eve and other partial-day opening-hour authority.
- The observed identifier shape inside a non-empty `excludedBranches` array.
- Whether an extended-hours area supplies `ignoreHolidays` consistently in
  account or availability responses.
- Exact raw availability response schema across every branch/facility type.
- Complete successful and failed booking and cancellation response schemas.
- Automatic cancellation scheduling and reconciliation behavior.
- Whether server times always omit an offset and must always be interpreted as
  Singapore local time.
- Whether `advanceBookingDays` always counts calendar days.

See
[`holiday-and-closure-testing.md`](holiday-and-closure-testing.md) for the
holiday investigation plan.

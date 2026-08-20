# Feature reference

This document records the detailed user-visible capabilities and safeguards in
Library Seats SG - for NLB v1.3.1. The shorter project overview and normal usage
steps remain in the repository [`README`](../README.md).

## Account and quota

- Signs in through NLB's official authentication page directly from the
  extension header.
- Signs out of both Seat Booking and the central NLB session from the
  extension header.
- Detects the completed sign-in automatically after NLB redirects back to the
  Seat Booking page.
- Keeps catalog and availability features accessible while signed out, using
  a permanent Guest profile that is separate from signed-in accounts.
- Shows the in-memory masked account identifier in a distinct monospace style,
  for example **Signed in as A*******Z**, with the stable **Profile 1** label
  presented as a separate badge so account switchers can verify the active
  account without exposing the complete NLB user ID.
- Offers a choice to copy Guest favourites into each signed-in account or keep
  them separate. Accounts that copy are prompted again for newly added Guest
  favourites; **Keep separate** remains a persistent opt-out. Copying never
  deletes Guest data.
- Refreshes the signed-in account from the header after login without
  reloading the NLB page.
- Shows remaining versus total Study Area quota for the selected date.
- Refreshes account quota and booking information after a booking run.
- Formats quota in hours and minutes, including `0h` when exhausted.

## Settings and local data

- Keeps Settings available from the header while the workspace is expanded or
  collapsed and while signed in or signed out.
- Shows the installed version, independent-project disclaimer, privacy and
  session explanation, and project support links.
- Shows only Guest while signed out, and only Guest plus the current account
  while signed in. Other saved account profiles and their counts stay hidden.
- Lets the current account switch between offering new Guest favourites and
  always keeping Guest separate.
- Provides separately confirmed actions to clear Guest, clear the current
  profile, or clear all extension-local data.
- Includes a non-destructive action to reset the current interface and refresh
  account/catalog data from NLB.
- Shows a first-use disclosure explaining how the existing NLB session is
  used; dismissing it without acknowledgement causes it to return on reload.

## Libraries, areas, dates, and times

- Extracts the current library, area, seat, and booking rules from NLB's
  `GetAccountInfo` response.
- Excludes `facilityId: 2` discussion rooms and breakout rooms.
- Remembers the last selected library and area separately for each NLB
  account in Chrome storage.
- When switching libraries, automatically selects the first area in that
  library containing a saved favourite seat; libraries without favourites
  keep the explicit area choice.
- Respects NLB's configured advance-booking days and release time.
- Treats each validated `settings.holidays` range as inclusive full local
  calendar days, except for branches listed in `excludedBranches`.
- Keeps a released holiday date selectable for inspection, renders its
  favourite-seat timeline as grey closed cells, and never lets the current-day
  seat matrix override the closure.
- Uses each area's opening time, closing time, booking interval, and minimum
  and maximum booking durations.
- Removes elapsed same-day slots. For example, at 12pm only slots beginning
  after 12pm are displayed and checked.

## Favourite seats and seat plans

- Stores favourite seats per account and area in Chrome storage.
- Resolves active current or future bookings against the catalog and adds any
  missing booked seats to that account's favourites, so booked seats remain
  visible even when they were not selected manually.
- Provides seat-number search so large areas do not need to render every seat.
- Keeps the seat plan visible while favourite seats are browsed or managed.
- Prioritizes seats booked by the user and available seats after a scan, while
  keeping rows stationary as timeline cells are selected.
- Grows to fit short favourite lists, uses up to the remaining browser height
  for longer lists, and scrolls only that list when more seats are available
  than can fit.
- Displays the reviewed `-sp` map for an annotated branch and area. For an
  unreviewed area, it uses only `areaMapUrls` attached to that exact area in
  the NLB response.
- Opens a full-screen seat picker with the enlarged plan and searchable
  favourite-seat controls side by side, while keeping the normal panel slim.
- Provides 100%, 125%, 150%, 175%, and 200% map zoom levels, with visible
  scrollbar tracks outside the map and mouse, touch, trackpad, or wheel
  navigation.
- Allows dragging the map background to pan while keeping annotated seats
  clickable; selecting a seat from the sidebar centers it in the map.
- Uses a high-contrast Done button and scales the favourite star to each seat
  hotspot so markers remain consistent across differently sized maps.
- Adds 2,080 verified clickable hotspots across all 83 inventoried plans,
  including range-order mappings for the two plans without individual labels.
- Verifies the exact rendered image bytes against a reviewed SHA-256 and falls
  back to seat-number search whenever the path, image, dimensions, or catalog
  seats no longer match.
- Tracks the current 83-area baseline, map fingerprints, seat identities, and
  visual label classification in the [seat-plan inventory](seat-plan-inventory.md).
- Provides repeatable capture, drift-audit, overlay, and verification commands
  documented in [seat-plan maintenance](seat-plan-maintenance.md).
- Provides an agent-run operator guide with exact audit and annotation-prep
  prompts in the [agent-run seat-plan audit](seat-plan-agent-audit.md).
- Keeps seat-plan maintenance controls out of normal release builds. A
  dedicated `npm run build:maintenance` build can export a freshly refreshed,
  sanitized catalog with zero availability searches. Chrome identifies that
  build as **Library Seats SG - for NLB (Maintenance)** with a `-maintenance`
  display version and developer-only description.
- Supports optional selected-library map discovery with at most two sequential
  branch-level availability probes. Returned records remain exact-area scoped
  and availability omissions are treated as incomplete evidence.

## Availability

- Shows today's favourite-seat availability immediately from the
  `hasAvailableSlots` matrix returned by `GetAccountInfo`.
- Overrides every current-day matrix value to closed when the selected branch
  is covered by `settings.holidays`.
- Shows closed holiday intervals as non-interactive grey cells for both today
  and future dates; they cannot be selected or booked.
- Refreshes today's matrix with one account request. If the refreshed selected
  area has zero entries matching its remaining daytime timeline, it reuses the
  future-date exact-interval scanner instead of trusting out-of-hours data.
- Retains exact interval checks for future dates, whose date-specific
  availability is not represented by the current-day matrix.
- Loads and caches the selected area's map with one metadata request without
  allowing that response to make unavailable cells selectable.
- Stops an individual request after six seconds.
- Retries a transient `429` or `5xx` response once after a short delay.
- Keeps successful interval results when another interval fails and marks the
  scan as incomplete.
- Revalidates selected booking blocks and obtains NLB's internal seat code
  immediately before booking.

### Timeline legend

- Green: available and selectable.
- Blue with a check mark: selected for a new booking.
- Purple: already booked by the signed-in user.
- Dark purple with a check mark: complete booking selected for cancellation.
- Amber: available, but blocked by another booking at the same time.
- Red: unavailable.

## Booking

- Limits selected intervals to the remaining quota for the selected date.
- Prevents selecting multiple seats for overlapping times.
- Prevents selecting times that overlap an active existing booking.
- Ignores canceled bookings such as `AutoPartialCancel` when checking
  conflicts.
- Supports selections across different favourite seats and non-consecutive
  times.
- Can combine adjacent intervals for the same seat into a continuous booking
  or submit every interval separately.
- Opens an immediate confirmation overlay with the seat and time summary before
  any booking requests are sent.
- Requires both the refreshed reference matrix and the exact booking preflight
  to accept a current-day selection; preflight may disable but never enable a
  timeline cell.
- Sends confirmed requests sequentially to NLB's `bookings/Book` endpoint.
- Displays pending, booking, successful, and failed status for every request.
- Lets users dismiss completed booking status manually and automatically
  clears an entirely successful run after 12 seconds. Failed results remain
  visible.
- Refreshes the displayed availability after booking, including rerunning
  date-specific interval checks for a future date.

## Cancellation

- Makes an upcoming purple booking selectable only while NLB reports
  `lastAction: "Book"`, `canCancelStatus: true`, and its start time is still in
  the future.
- Selects a multi-hour booking atomically by booking ID: clicking any purple
  interval selects every visible interval in that booking and sends one
  cancellation request.
- Prevents green booking selections and purple cancellation selections from
  being mixed.
- Lets the user review each complete booking and choose an NLB cancellation
  reason, defaulting to **Decided not to visit this library**.
- Sends cancellation requests sequentially without automatic retries, then
  reconciles them against a fresh account response.
- Keeps failed or uncertain cancellations selected for review and clears only
  bookings confirmed missing or inactive.
- Refreshes today's account matrix or reruns future-date interval checks after
  cancellation.
- Keeps checked-in, started, canceled, completed, or otherwise non-cancelable
  purple bookings visible but noninteractive.

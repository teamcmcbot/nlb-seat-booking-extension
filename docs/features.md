# Feature reference

This document records the detailed user-visible capabilities and safeguards in
Library Seats SG - for NLB v1.4.1. The shorter project overview and normal usage
steps remain in the repository [`README`](../README.md).

## Account and quota

- Opens its workspace automatically on matching NLB Seat Booking pages, so no
  separate extension tab is required.
- Signs in through NLB's official authentication page directly from the
  extension header.
- Signs out of both Seat Booking and the central NLB session from the
  extension header.
- Detects the completed sign-in automatically after NLB redirects back to the
  Seat Booking page.
- Keeps catalog and availability features accessible while signed out, using
  a permanent Guest profile that is separate from signed-in accounts.
- Keeps signed-out green availability view-only and labels the booking area
  with a sign-in requirement instead of treating absent account quota as an
  error.
- Shows the in-memory masked account identifier in a distinct monospace style,
  for example **Signed in as A*******Z**, with the stable **Profile 1** label
  presented as a separate badge so account switchers can verify the active
  account without exposing the complete NLB user ID.
- Provides an account-specific **Sync favourite seats** toggle, enabled by
  default. Newly added signed-out favourites are copied automatically after
  sign-in when enabled; disabling sync keeps the lists separate. Copying never
  deletes Guest data, and removals are not synchronized in either direction.
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
- Lets the current account turn automatic one-way syncing of newly added
  signed-out favourites on or off.
- Lets the user choose whether the booking panel defaults to combining
  adjacent hours or booking every interval separately, with an in-Settings
  explanation of both modes.
- Provides separately confirmed actions to clear Guest, clear the current
  profile, or clear all extension-local data.
- Includes a non-destructive action to reset the current interface and refresh
  account/catalog data from NLB.
- Shows a first-use disclosure explaining how the existing NLB session is
  used; dismissing it without acknowledgement causes it to return on reload.

## Libraries, areas, dates, and times

- Lets users choose the library, area, and date from the extension workspace
  before reviewing seat availability.
- Collapses a complete library, area, and date into an editable summary with
  the selected-date quota in its footer. **Edit** restores the normal controls
  and native date input; **Done** returns to the compact view.
- Extracts the current library, area, seat, and booking rules from NLB's
  `GetAccountInfo` response.
- Excludes `facilityId: 2` discussion rooms and breakout rooms.
- Remembers the last selected library and the last area within each library
  separately for each NLB account in extension-local storage.
- When switching libraries, restores that library's last area; if none is
  stored, it selects the first area in NLB catalog order.
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

- Stores favourite seats per account and area in extension-local storage.
- Resolves active current or future bookings against the catalog and adds any
  missing booked seats to that account's favourites, so booked seats remain
  visible even when they were not selected manually.
- Provides seat-number search so large areas do not need to render every seat.
- Keeps the seat plan visible while favourite seats are browsed or managed.
- Prioritizes seats booked by the user and available seats after a scan, while
  keeping rows stationary as timeline cells are selected.
- Keeps the expanded workspace at the available browser height, grows short
  lists naturally, and makes longer favourite lists the primary scroll region.
  On short viewports, the workspace itself scrolls while the booking summary
  stays usable without covering the favourite seats.
- Keeps a visible scrollbar indicator beside an overflowing favourite list,
  including where Chrome or macOS would normally hide the native scrollbar.
- Reserves a fixed post-favourites action region so booking, cancellation,
  errors, and status details do not change the favourite list's visible
  height. Variable details scroll inside that region.
- Places the timeline Legend immediately after Favourite seats and opens its
  explanation as a dismissible popover that does not consume layout height.
- Displays the reviewed `-sp` map for an annotated branch and area. For an
  unreviewed area, it uses only `areaMapUrls` attached to that exact area in
  the NLB response.
- Opens a full-screen seat picker with the enlarged plan and searchable
  favourite-seat controls side by side, while keeping the normal panel slim.
- Highlights the matching map seat with a temporary high-contrast preview when
  a favourite seat is hovered or keyboard-focused in the picker sidebar.
- Uses a transparent map-center hover treatment with white contrast and green
  inner strokes, while the sidebar uses a light green hover state that preserves
  the existing favourite-seat meaning.
- Provides 100%, 125%, 150%, 175%, and 200% map zoom levels, with visible
  scrollbar tracks outside the map and mouse, touch, trackpad, or wheel
  navigation.
- Allows dragging the map background to pan while keeping annotated seats
  clickable; selecting a seat from the sidebar centers it in the map.
- Uses a high-contrast Done button and scales the favourite star to each seat
  hotspot so markers remain consistent across differently sized maps.
- Snapshots the selected seat identities when the picker opens. **Done**, ×,
  outside click, and Escape refresh availability only when the final set is
  different and still contains at least one seat; changing seats and then
  restoring the exact opening set does not refresh or clear the previously
  displayed availability.
- Uses the same snapshot behavior for the main Favourite seats **Manage**
  interface: **Done** refreshes a changed, non-empty final set and preserves
  availability when the final set is unchanged.
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

- On initial load or page refresh, automatically checks availability once when
  the restored library and area still contain at least one valid favourite
  seat. It uses the freshly loaded account matrix for today and the normal
  exact-interval scanner when date-specific checks are required.
- Automatically checks the resulting selection after the library, area, or
  date changes when that area contains at least one favourite seat. Changes
  that leave no specific area or no favourites do not make a request.
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
- Defaults to combining adjacent intervals unless the installation-wide
  Settings preference chooses separate requests; the booking panel can still
  override the default for each selection.
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
- Adds **Go to My Bookings** followed by an accessible × dismissal control to
  both completed Booking Status and Cancellation Status. Navigation opens
  NLB's `/seatbooking/mybookings` page.
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

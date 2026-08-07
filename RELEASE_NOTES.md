# NLB Seat Helper v1.1.0

This release adds safe, account-aware cancellation for upcoming NLB seat
bookings.

## Highlights

- Makes eligible purple bookings selectable for cancellation while preserving
  non-cancelable, started, and checked-in bookings as read-only purple cells.
- Selects and cancels multi-hour bookings atomically by booking ID, regardless
  of how many timeline cells they cover.
- Prevents green booking selections and purple cancellation selections from
  being mixed.
- Loads NLB's seat cancellation reasons and defaults to **Decided not to visit
  this library**, while allowing another reason to be selected.
- Revalidates the signed-in account and every selected booking immediately
  before cancellation.
- Sends cancellation requests sequentially without automatic retries and
  reconciles uncertain responses against fresh account data.
- Automatically adds uniquely matched active booked seats to the correct
  account's favourites, including seats not previously selected manually.
- Refreshes account and seat availability after both booking and cancellation;
  future dates rerun their exact interval searches.
- Documents the cancellation endpoint, eligibility rules, response
  reconciliation, multi-hour behavior, and automatic-favourite matching.

## Installation

Download `nlb-seat-helper.zip` from this release's Assets, extract it, and load
the extracted folder through Chrome's **Load unpacked** extension option. Do
not use GitHub's automatically generated source-code archives.

# NLB Seat Helper v1.0.3

This release adds account controls to the extension and keeps each NLB
account's local preferences separate.

## Highlights

- Adds **Sign in** beside the signed-out status in the extension header.
- Adds **Sign out** beside the active account in the extension header.
- Uses NLB's official sign-in and central sign-out pages; the extension never
  reads or stores passwords, cookies, or authentication tokens.
- Waits for NLB to finish establishing the account session after redirecting
  back to Seat Booking, removing the need to manually refresh the extension.
- Refreshes the account automatically when the Seat Booking tab becomes
  visible or regains focus.
- Detects `reload=true` on Seat Booking home, account, booking-details, and
  my-bookings routes, including client-side navigation, and reloads account
  and session data.
- Keeps the seat availability workspace expandable and usable while signed
  out, with the account refresh control still available.
- Keeps header actions aligned by truncating only an unusually long account
  name while preserving the full name as a hover tooltip.
- Shows the selected date in the Favourite seats heading so availability is
  not mistaken for another day's results.
- Stores favourite seats and the last selected library and area separately for
  each NLB user ID.
- Migrates existing favourites and preferences to the first account used after
  updating.
- Verifies that the signed-in account has not changed immediately before
  submitting a booking.
- Shows current-day availability immediately from NLB's account seat matrix,
  retains exact interval searches for tomorrow and other future dates, loads
  maps once per area, and uses a conservative exact preflight before booking.
  Exact searches can reject a current-day matrix result but never upgrade a
  current-day false cell.

## Installation

Download `nlb-seat-helper.zip` from this release's Assets, extract it, and load
the extracted folder through Chrome's **Load unpacked** extension option. Do
not use GitHub's automatically generated source-code archives.

# Settings and local data

Library Seats SG keeps favourite seats and a small set of preferences in the
current Chrome profile. Open **Settings** from the gear button in the extension
header to review or remove that information.

## What appears in Settings

- When signed out, Settings shows only **Guest**. Account-specific profiles are
  hidden.
- When signed in, Settings shows **Guest** and only the current account, using
  its neutral Profile N label and masked account identifier.
- Profiles belonging to other accounts are never listed in Settings. This
  avoids exposing their existence, favourite counts, or saved-area status to
  another person using the same browser.

Hiding profiles prevents casual disclosure in the interface, but it is not an
authentication boundary. People sharing one Chrome profile also share its
extension storage. Use separate Chrome profiles or Chrome Guest mode on a
shared computer.

## Booking default

Choose which adjacent-hour option should be selected whenever a new booking
selection is started:

- **Combine adjacent hours** merges consecutive selected intervals for the
  same seat into fewer booking requests, up to the area's maximum booking
  duration. This is the default when no preference has been saved.
- **Book each hour separately** submits each selected interval as an independent
  reservation.

The information tooltip beside the section title gives a concrete comparison:
a 2pm–6pm selection can become one 4-hour booking when combined, or four
independent 1-hour bookings when separated. It opens on pointer hover or
keyboard/touch focus. This preference only chooses the initial option; it can
still be changed in the booking panel before every booking.

The preference applies to this installation of Library Seats SG rather than
one NLB account. **Clear all local data** resets it to **Combine adjacent
hours**.

## Sync favourite seats

The account-specific toggle is enabled by default. When on, favourite seats
added while signed out are copied automatically into the current account after
sign-in. When off, the signed-out Guest list and account list stay separate.

Syncing is one-way and additive. Turning it off does not remove seats already
copied. Removing a favourite from Guest never removes it from an account, and
removing one from an account never removes the Guest copy. The information
tooltip explains these boundaries without taking permanent space in the
dialog.

## Local-data actions

### Clear Guest

Removes Guest favourite seats and the Guest's last selected library and area.
It does not change any signed-in account profile, sign out of NLB, or cancel a
booking.

Use it when seats saved while signed out are no longer wanted or before leaving
a shared browser where only Guest data was used.

### Clear profile

Available only for the account currently signed in. It removes that account's
favourite seats and last selected library and area while retaining its neutral
Profile N identity and Guest-favourites copy preference. It does not sign out
or change bookings held by NLB. Seats referenced by active bookings may be
added to favourites again after account refresh.

Use it to reset the current account's saved seat preferences without affecting
Guest or another account.

### Reset current view and refresh from NLB

Deletes no saved favourites or preferences. It discards temporary interface
state, including current availability results and unsubmitted selections, then
reloads account and catalog information from NLB.

Use it when the view appears stale, after changing account or booking state
elsewhere, or when recovering from an NLB response error.

### Clear all local data

Removes all data owned by Library Seats SG from `chrome.storage.local`,
including Guest data, every saved account profile, favourite seats, saved
areas, profile metadata, favourite-sync choices, the default booking mode, and the
disclosure acknowledgement. It also removes the short-lived pending sign-in
marker from the current Seat Booking tab.

It does not sign out of NLB, cancel bookings, or delete information held by
NLB. If an NLB account remains signed in, the extension can create a fresh
empty local profile for that session when it refreshes.

On a shared or public computer, use this order:

1. Sign out using the extension's **Sign out** button.
2. Open **Settings** while signed out.
3. Select **Clear all local data** and confirm.
4. Close the browser when finished.

## Data that is not stored persistently

Bookings, quotas, availability results, selected booking or cancellation
cells, account details, and seat-plan images remain in memory rather than
`chrome.storage.local`. Refreshing or closing the Seat Booking tab normally
discards that temporary state.

See the [Privacy Policy](../PRIVACY.md) for the complete information inventory
and retention policy.

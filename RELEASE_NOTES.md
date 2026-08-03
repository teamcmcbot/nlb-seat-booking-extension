# NLB Seat Helper v1.0.1

This release improves the helper's compact layout and makes the booking flow
clearer and more predictable.

## Highlights

- Keeps the seat plan visible while browsing and managing favourite seats.
- Uses a responsive favourite-seat list that grows with the browser viewport,
  scrolls internally for long lists, and avoids empty space for short lists.
- Removes the redundant Start and Duration controls; booking times are selected
  directly from the availability timeline.
- Keeps seat rows stationary while selecting consecutive timeline cells.
- Adds a header refresh action that detects a newly signed-in NLB session
  without reloading the whole page.
- Shows the selected date's remaining quota in the main controls.
- Opens booking confirmation in a focused overlay with the complete seat and
  time summary.
- Adds a manual Dismiss action for booking results and automatically clears a
  fully successful run after 12 seconds. Failed results remain visible.

## Installation

Download `nlb-seat-helper.zip` from this release's Assets, extract it, and load
the extracted folder through Chrome's **Load unpacked** extension option. Do
not use GitHub's automatically generated source-code archives.

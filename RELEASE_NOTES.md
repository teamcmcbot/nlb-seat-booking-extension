# NLB Seat Helper v1.1.1

This patch release prevents NLB's incorrect current-day availability matrix
from making seats appear bookable while a library is closed for a configured
holiday.

## Highlights

- Treats validated `settings.holidays` start/end values as inclusive full
  local calendar dates.
- Respects branch exemptions listed by branch ID or code in
  `excludedBranches`.
- Keeps a released holiday date selectable for inspection without exposing the
  next unreleased calendar day.
- Renders favourite-seat holiday intervals as grey, non-interactive closed
  cells while skipping availability scans and map discovery.
- Rechecks holiday settings after the booking-time account refresh.
- Adds regression coverage for National Day, booking release time, calendar
  boundaries, branch exclusions, and malformed holiday ranges.
- Leaves partial-day holiday-eve hours and extended-hours-area exceptions
  pending further live API evidence.

## Installation

Download `nlb-seat-helper.zip` from this release's Assets, extract it, and load
the extracted folder through Chrome's **Load unpacked** extension option. Do
not use GitHub's automatically generated source-code archives.

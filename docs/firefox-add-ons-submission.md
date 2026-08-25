# Firefox Add-ons submission sheet

## Product fields

- Name: **Library Seats SG - for NLB**
- Version: **1.4.0**
- Permanent ID: **library-seats-sg@teamcmcbot.github.io**
- Platform: **Firefox Desktop only**
- Minimum Firefox: **140**
- Category: **Other**
- License: **MIT License**
- Experimental: **No**
- Homepage: `https://github.com/teamcmcbot/nlb-seat-booking-extension`
- Support: `https://github.com/teamcmcbot/nlb-seat-booking-extension/issues`
- Privacy: `https://github.com/teamcmcbot/nlb-seat-booking-extension/blob/main/PRIVACY.md`

## Summary

Save favourite NLB seats, check availability, and review bookings or
cancellations before sending them to NLB.

## Description

Library Seats SG adds a clear workspace to Singapore's NLB Seat Booking site.
Save favourite seats, compare availability across the day, use reviewed
interactive seat plans, and prepare multiple non-overlapping sessions. Every
booking and cancellation is shown for confirmation before it is sent to NLB.

You sign in through NLB. The extension uses the NLB session already active in
the tab and does not ask for passwords or directly read cookies. It has no
advertising, analytics, tracking, or developer-operated server.

Library Seats SG is an independent project and is not affiliated with,
endorsed by, sponsored by, or supported by the National Library Board
Singapore.

## Reviewer notes

The extension runs only on `https://www.nlb.gov.sg/seatbooking/*`. No reviewer
credentials are supplied or required to inspect the signed-out interface.

1. Install the submitted package in Firefox Desktop 140 or newer.
2. Open `https://www.nlb.gov.sg/seatbooking/`.
3. The signed-out workspace and Sign in control appear automatically.
4. Open Settings to inspect the privacy/session disclosure and local-data
   controls.

Signed-in availability and booking features require the reviewer's own NLB
account. Do not make or cancel a real booking solely for review. Source is
bundled because Vite compiles and minifies React/TypeScript. Extract the source
archive and follow `AMO_BUILD.md`; `npm ci` and `npm run package:firefox`
reproduce the submitted files, apart from ZIP container timestamps.

The linter's two `UNSAFE_VAR_ASSIGNMENT` warnings originate in React DOM 18.3.1
compiled code; repository source contains no `innerHTML` or
`dangerouslySetInnerHTML`. Its Android warning is inapplicable because the
listing is Firefox Desktop only. The repository's strict lint wrapper allows
only those exact warnings and fails on any additional finding.

## Upload files

- Add-on: `nlb-seat-helper-firefox.zip`
- Source code: `nlb-seat-helper-firefox-source.zip`

Do not upload `nlb-seat-helper.zip` to AMO and do not upload GitHub's generated
source archive as reviewer source.

## Pre-submission checklist

- Confirm package, lockfile, and manifest all say 1.4.0.
- Run the complete automated validation documented in `docs/releasing.md`.
- Complete and record the Firefox and Chrome smoke tests.
- Verify every screenshot against Firefox and remove personal information.
- Confirm desktop-only targeting, category, licence, privacy URL, and support
  URL in the live AMO form.
- Confirm the three required data categories and no optional telemetry.
- Upload the built and reviewer-source ZIPs.
- Review AMO's permissions and consent summary before submitting.
- Submit only with explicit maintainer authorization.

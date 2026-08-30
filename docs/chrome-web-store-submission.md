# Chrome Web Store submission sheet

Status: ready-to-paste draft for Library Seats SG - for NLB v1.4.1, reviewed
20 August 2026. Recheck the dashboard labels and the exact uploaded ZIP at
submission time.

This sheet contains operational submission values. The supporting research and
risk decisions are in [`chrome-web-store-publication.md`](chrome-web-store-publication.md),
and the detailed data-category mapping is in
[`chrome-web-store-privacy-declarations.md`](chrome-web-store-privacy-declarations.md).

## Listing

**Title**

```text
Library Seats SG - for NLB
```

**Summary — 108 characters**

```text
Find favourite seats, check availability, and book multiple NLB sessions with clear review and confirmation.
```

**Category**

```text
Productivity
```

**Language**

```text
English (United Kingdom)
```

**Detailed description**

```text
Spend less time searching for a seat and more time using the library.

Library Seats SG opens on the NLB Seat Booking page and adds a clearer workspace for planning your visit. Choose a library, area, and date; use the seat picker to locate seats and save favourites; then check or refresh availability before booking.

Key features:

• Opens automatically on NLB Seat Booking pages.
• Choose a library, area, and date from one workspace.
• Save favourite seats separately for each local profile.
• Find seats by number and, where available, choose them from an interactive plan.
• Check or refresh availability across the selected day.
• Select multiple non-overlapping time blocks in one planning view, including separate sessions with a break.
• Review every booking before it is sent to NLB.
• See booking success and upcoming sessions, and cancel eligible bookings with confirmation.
• Respect quota, duration, opening-hour, closure, and availability information returned by NLB.

Privacy:

• Free, with no advertising or behavioural analytics.
• Uses the NLB session already signed in on the current tab.
• Does not request or store your NLB password.
• Does not directly read or store authentication cookies.
• Does not send account or booking data to the extension developer.
• Stores only local favourites, preferences, and pseudonymous profile data.

Requirements:

• Google Chrome.
• Access to the NLB Seat Booking website.
• An NLB account for booking and account-specific features.

Library Seats SG is an independent extension and is not affiliated with, endorsed by, sponsored by, or supported by the National Library Board Singapore. NLB remains the final authority for availability, quotas, bookings, cancellations, and account access. Because the extension relies on an unofficial integration, NLB website changes may temporarily affect functionality.
```

## Public URLs

These URLs are stable once the Phase 4 and Phase 5 files are merged to `main`.
Open each in a signed-out browser before submission.

| Dashboard field | URL |
| --- | --- |
| Homepage | `https://github.com/teamcmcbot/nlb-seat-booking-extension` |
| Privacy policy | `https://github.com/teamcmcbot/nlb-seat-booking-extension/blob/main/PRIVACY.md` |
| Support | `https://github.com/teamcmcbot/nlb-seat-booking-extension/issues` |

The public developer contact email is configured and verified at publisher
account level rather than embedded in the extension listing copy. GitHub Issues
is the public product-support route; private vulnerability reports use GitHub's
security-advisory form.

## Privacy practices

**Single purpose**

```text
Library Seats SG provides a clearer interface on the NLB Seat Booking website for viewing seat availability, saving favourite seats, and reviewing and managing the user's own NLB seat bookings.
```

**`storage` permission justification**

```text
Used only to keep favourite-seat selections, the last selected library and area, the default adjacent-hour booking mode, first-use acknowledgement, and pseudonymous local profile preferences in chrome.storage.local. Account details, bookings, quotas, availability, credentials, and cookies are not persistently stored by the extension.
```

**NLB site-access justification**

```text
The content script runs only on https://www.nlb.gov.sg/seatbooking/* so it can add the Library Seats SG interface, retrieve the user's NLB account, catalog, booking, quota, and availability information using the existing same-origin NLB session, and submit only booking or cancellation actions the user has reviewed and confirmed.
```

**Remote code**

Select **No**.

```text
All executable JavaScript and CSS is included in the extension package. NLB API responses and seat-plan images are treated only as data and are not executed as code.
```

**Data categories**

Select the closest current dashboard equivalents for:

- personally identifiable information or account identifiers;
- authentication information, conservatively, because authenticated requests
  use the existing NLB session even though extension code does not read or
  store credentials, cookies, or tokens;
- website content; and
- user activity.

Do not select location, financial/payment information, health information,
personal communications, or an overall “handles no user data” answer.

Certify only the declarations matching the exact build:

- data is used only for the disclosed seat-booking purpose;
- data is not sold;
- data is not used or transferred for unrelated purposes;
- data is not used for advertising, creditworthiness, or lending;
- no developer-operated service or human receives the data; and
- necessary extension-to-NLB requests use HTTPS.

The privacy policy contains the Chrome Web Store Limited Use disclosure.

## Other dashboard answers

| Field | Answer |
| --- | --- |
| In-app purchases | No |
| Advertising | No |
| Analytics or telemetry | No |
| Remote executable code | No |
| Initial visibility | Private — trusted testers |
| Initial public region after testing | Singapore only |
| Publishing mode | Deferred publishing |

Private trusted-tester releases still undergo Chrome Web Store policy review.
Do not upload a separate duplicate beta listing unless its name ends in
**BETA** and its description explicitly identifies it as a beta-testing build.

## Reviewer instructions

```text
Library Seats SG - for NLB is a Manifest V3 content-script extension that runs only on https://www.nlb.gov.sg/seatbooking/*.

Signed-out review:
1. Install the extension and open https://www.nlb.gov.sg/seatbooking/.
2. The Library Seats SG panel appears on the page without requiring an account.
3. Choose a library, a specific area, and a date.
4. Open the seat picker to search the plan and save Guest favourite seats.
5. Signed-out users can inspect the interface, browse the catalog supplied by NLB, use Check or Refresh where available, open Settings, read the privacy/session disclosure, and use the local-data deletion controls.

Account-gated features:
• NLB controls account eligibility and authentication. The developer cannot provide or share an NLB test account.
• If the reviewer has an authorised NLB account, use the extension's Sign in button and complete authentication only on NLB's official page.
• After sign-in, the header shows a masked account identifier and an opaque local Profile N label. Settings lists that profile without persisting the raw NLB user ID.
• Availability refresh, quota, current bookings, booking confirmation, and cancellation confirmation require the reviewer's own active NLB session and data returned by NLB.

Safety and network behavior:
• The extension never asks for an NLB password and does not directly read cookies or authentication tokens.
• Same-origin NLB requests use the session Chrome already attaches to the Seat Booking tab.
• Booking and cancellation requests require explicit confirmation. Please do not complete a real booking or cancellation solely for review unless using an authorised account and intending that action.
• No account, booking, availability, or usage data is sent to the extension developer. There is no developer backend, analytics, advertising, payment, or remote executable code.
```

## Submission-time checks

- [ ] Merge the intended release to `main` and verify all three public URLs
  while signed out of GitHub.
- [ ] Verify the developer contact email and two-step verification in the
  publisher account.
- [ ] Upload the freshly packaged `nlb-seat-helper.zip`, not GitHub's source
  archive.
- [ ] Confirm the uploaded version and summary match `public/manifest.json`.
- [ ] Upload the reviewed 128×128 icon, 440×280 promo tile, and the five
  recommended screenshots: `store-overview.png`, `store-seat-picker.png`,
  `booking-flow-01-selection.png`, `booking-flow-02-confirmation.png`, and
  `booking-flow-04-upcoming.png` from `assets/chrome-web-store/`.
- [ ] Confirm the 1.4.1 workspace captures show the compact selection summary,
  fixed post-favourites action region, and current compact booking-mode UI;
  reject any capture that still shows the superseded large radio cards.
- [ ] Keep `booking-flow-03-success.png` as an approved alternate because the
  Chrome Web Store listing accepts at most five screenshots.
- [ ] Approve or recapture the visible masked profile, booking date, seat
  names, and booking status; confirm no raw account ID, booking reference,
  credentials, cookie, or API response appears.
- [ ] Confirm NLB seat-plan material appears only inside the approved authentic
  feature screenshots and not in standalone promotional artwork.
- [ ] Compare every privacy checkbox against the exact ZIP and `PRIVACY.md`.
- [ ] Save a dated screenshot or export of the final dashboard declarations.
- [ ] Select private trusted testers and deferred publishing for the first
  submission.

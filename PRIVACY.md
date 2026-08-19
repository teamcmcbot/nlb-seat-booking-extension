# Privacy Policy for StudySeat SG - for NLB

Effective date: 20 August 2026

StudySeat SG - for NLB ("StudySeat SG", "the extension") is a free,
independent Chrome extension maintained by the StudySeat SG project. It works
only on the National Library Board Singapore (NLB) Seat Booking website.

StudySeat SG is not affiliated with, endorsed by, sponsored by, or supported
by NLB. "NLB" is used only to identify the service with which the extension
works.

This policy explains the information the extension handles, why it is needed,
where it goes, and how users can delete it. In this policy, "handle" includes
information processed only on the user's device; it does not mean that the
developer receives that information.

## Summary

- StudySeat SG has no developer-operated server, advertising, analytics, or
  tracking.
- The developer does not receive users' NLB account information, bookings,
  favourites, browsing activity, or extension usage data.
- The extension does not ask for an NLB password, request Chrome cookie
  permission, or read browser cookies directly.
- The extension uses the NLB session already active in the Seat Booking tab.
  Chrome attaches that session to same-origin NLB requests.
- Favourite seats, saved areas, and pseudonymous profile preferences are kept
  in `chrome.storage.local` on the user's device.
- Account, booking, quota, catalog, and availability information is processed
  in memory and is not persistently stored by the extension.
- Booking and cancellation requests are sent only to NLB after the user
  reviews and confirms them.

## Information handled by the extension

### Information received from NLB

When the NLB Seat Booking page is open, the extension may retrieve and process:

- the current NLB account identifier and signed-in state;
- account quota and current or upcoming booking details;
- library, area, seat, operating-hour, holiday, and booking-rule information;
- seat and time-slot availability; and
- seat-plan image URLs and images supplied by NLB.

This information is used only to show the extension interface, associate the
current session with the correct local profile, display availability and
bookings, validate requested actions, and reconcile results from NLB.

The complete NLB account identifier is used transiently in memory. It is
combined with a random installation-local secret to derive a pseudonymous
profile identifier. The complete identifier is not written to Chrome storage
or rendered in the page by the extension. The interface may show a masked
version that preserves the first and last character and replaces the middle
characters with asterisks.

### Information created by the user

The extension handles choices made in its interface, including:

- favourite seats;
- the last selected library and area;
- dates, seats, and time slots selected for review;
- booking and cancellation confirmations and an NLB cancellation reason;
- Guest-favourite copy preferences; and
- acknowledgement of the first-use privacy and session disclosure.

Dates, time slots, booking confirmations, cancellation choices, and
cancellation reasons are kept in memory only, except when sent to NLB to carry
out an action the user confirmed.

### Authentication and session handling

StudySeat SG does not collect an NLB password or authentication token and does
not read cookies directly. Requests to NLB use `credentials: "include"`, which
allows Chrome to attach the existing same-origin NLB session automatically.

When the user starts sign-in, the extension stores a timestamp-only pending
sign-in marker in the NLB page's `sessionStorage`. It contains no account
identifier or credential, expires after five minutes, and is removed after
sign-in completes, on sign-out, when all extension data is cleared, or when
the page session ends.

## Information stored on the device

StudySeat SG uses the Chrome `storage` permission only for
`chrome.storage.local`. It may store:

- a random 256-bit installation-local secret used to derive pseudonymous
  profile identifiers;
- pseudonymous profile identifiers, their stable Profile N display order, and
  the last active local profile;
- Guest and per-profile favourite-seat records, including NLB library, area,
  and seat identifiers, codes, and names;
- the last selected library and area for Guest and each profile;
- each profile's Guest-favourite copy decision and the favourite identities
  already acknowledged by that decision;
- the storage schema version; and
- whether the first-use privacy and session disclosure was acknowledged.

This local information is not sent to the developer, an analytics provider,
an advertising provider, or any other third party by extension code. It is
not stored using Chrome's synced-storage service.

Account details, bookings, quotas, availability results, and seat-plan images
are not written to `chrome.storage.local` by the extension. Chrome, the NLB
website, or the browser cache may independently retain information under their
own settings and policies.

## How information is used

Information is handled only when necessary to provide the extension's single
purpose: helping a user view NLB study-seat availability and manage their own
NLB study-seat bookings.

StudySeat SG uses information to:

- display libraries, areas, seats, rules, availability, quota, and bookings;
- keep Guest and signed-in account preferences separate;
- show which account profile is currently active;
- remember favourite seats and the last selected area;
- check quota, availability, conflicts, and NLB booking rules;
- submit a booking or cancellation only after confirmation; and
- refresh and reconcile the result reported by NLB.

The information is not used for advertising, profiling, credit decisions,
sale, unrelated product development, or behavioural analytics.

## Sharing and transfers

Extension code sends information only to NLB over HTTPS when required for the
feature the user is using. For example, selected seat and time information is
sent to NLB when a booking is confirmed, and a booking identifier and reason
are sent to NLB when a cancellation is confirmed.

The extension does not sell user data or transfer it to the developer, data
brokers, advertisers, analytics services, or unrelated third parties. The
developer cannot allow staff or other people to inspect information that the
developer never receives.

Project, privacy, support, and security links open GitHub only after the user
chooses them. Visiting GitHub is governed by GitHub's own privacy policy; the
extension does not automatically send local profile or NLB account data with
those links.

## Retention and deletion

Information held only in memory normally disappears when the Seat Booking tab
is refreshed or closed. The pending sign-in marker expires after five minutes
and also ends with the page session.

Information in `chrome.storage.local` remains until the user removes it, the
extension is uninstalled, or Chrome clears the extension's storage.

The extension's Settings screen provides separately confirmed controls to:

- clear Guest favourites and its saved area;
- clear favourites and the saved area for the current profile while retaining
  its stable Profile N identity;
- delete an inactive profile and its Guest-copy choice; or
- clear all data owned by StudySeat SG.

Clearing extension data does not sign the user out of NLB, cancel a booking,
or delete information held by NLB. Users can also remove all extension-local
data by uninstalling StudySeat SG through Chrome.

An unpacked/manual installation and a Chrome Web Store installation are
separate Chrome extension installations. Their local favourites and settings
do not automatically transfer between them.

## Security

StudySeat SG limits its content script to
`https://www.nlb.gov.sg/seatbooking/*`, requests only Chrome's `storage`
permission, and packages all executable code with the extension. It does not
load remote executable code.

NLB requests use HTTPS and are made sequentially where required to reduce
duplicate-action and service-load risk. Malformed, failed, timed-out, or
ambiguous availability is treated as unavailable rather than bookable.

No software can promise absolute security. Please do not include NLB account
identifiers, booking references, cookies, raw account responses, or personal
screenshots in a public support report.

## Chrome Web Store Limited Use

StudySeat SG's use and transfer of user information complies with the Chrome
Web Store User Data Policy, including its Limited Use requirements. The
extension handles user information only as necessary to provide or improve
its disclosed, user-facing seat-booking purpose. It does not use or transfer
user information for personalised advertising, unrelated purposes, or sale to
third parties.

## NLB and browser services

NLB controls its accounts, authentication, availability, bookings,
cancellations, website, APIs, and records. Information held by NLB is governed
by NLB's own terms and privacy practices. Chrome and the Chrome Web Store may
process installation or browser information independently under Google's
policies. This policy covers only information handled by StudySeat SG code.

## Changes to this policy

This policy will be updated when the extension's information-handling
practices change. Material changes will be disclosed in the extension or its
Chrome Web Store listing before or when the changed practice takes effect, as
required. The effective date at the top records the latest revision.

## Contact

For privacy questions, open a
[GitHub issue](https://github.com/teamcmcbot/nlb-seat-booking-extension/issues).
GitHub issues are public, so do not post personal, account, booking, or
authentication information there. If a question cannot be discussed publicly,
open an issue requesting a private contact method without including the
sensitive details.

For a vulnerability or another report that should remain private, use
[GitHub's private security advisory form](https://github.com/teamcmcbot/nlb-seat-booking-extension/security/advisories/new).

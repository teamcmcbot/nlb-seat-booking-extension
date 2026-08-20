# Chrome Web Store publication plan

Status: working research and implementation roadmap, 20 August 2026.

Public product name: **Library Seats SG - for NLB**.

A basic exact-name web and Chrome Web Store-index search on 20 August 2026 did
not surface an obvious exact match for **Library Seats SG**. The individual
words are descriptive, so this is a clear product name rather than a strongly
distinctive trade mark. The search is not formal trade-mark clearance. IPOS
recommends a Similar Mark Search in its Digital Hub before applying to register
a mark. See
[IPOS search guidance](https://ask.gov.sg/ipos/questions/clnnxj575001n4i0xnr68nc6d).

This document records the publication research, current repository audit,
legal and policy risks, proposed store copy, and staged engineering work for a
public Chrome Web Store release. It is practical project guidance, not legal
advice.

## Recommended release position

The extension is technically well-positioned for Chrome Web Store review. It
is a Manifest V3 content script limited to the NLB Seat Booking path, requests
only Chrome's `storage` permission, contains no remote executable code, has no
developer backend, and does not directly read or store NLB cookies or
passwords.

Before a public release, the project should still complete the following:

1. publish an accurate privacy policy and matching Chrome Web Store privacy
   declarations;
2. replace raw NLB user IDs in persistent storage with opaque profiles and use
   only a first/last-character masked identifier in the UI;
3. add understandable Settings, disclosure, support, and data-deletion flows;
4. make a conscious risk decision about NLB seat-plan images and promotional
   screenshots;
5. finish the store listing, reviewer instructions, and required promotional
   artwork; and
6. run a private trusted-tester release before a Singapore-only public launch.

Requesting written guidance from NLB remains the lowest-risk approach, but an
unanswered request does not technically prevent submission to the Chrome Web
Store. Publishing without an answer is a project risk decision. The existence
of unofficial extensions for services such as YouTube and Reddit shows that
third-party integrations are common; it does not establish that any particular
use of another service's APIs, name, or artwork is authorised. Chrome can also
act on a later intellectual-property or impersonation complaint.

## Branding and independence

### Public name

Use **Library Seats SG - for NLB**, subject to normal availability and
trade-mark checks for the independent `Library Seats SG` brand.

This name describes the task directly, includes a Singapore cue, and retains
`NLB` as a compatibility and discovery term. Placing “for NLB” after the
independent name helps distinguish the product from NLB itself.

Singapore's Trade Marks Act includes an exception for honest use of a mark to
indicate the intended purpose of goods or services. That supports careful
referential wording such as “for NLB,” but does not remove the need to avoid
confusion or passing off. See the
[Trade Marks Act, section 28](https://sso.agc.gov.sg/Act-Rev/TMA1998/Published?DocDate=20211231&ProvIds=pr28-).

Chrome prohibits representing an extension as authorised, endorsed, or
produced by another organisation when that is not true. See Chrome's
[Impersonation and Intellectual Property policy](https://developer.chrome.com/docs/webstore/program-policies/impersonation-and-intellectual-property).

Use this short disclosure in the listing, README, Settings/About screen, and
first-use information:

> Library Seats SG is an independent extension and is not affiliated with,
> endorsed by, sponsored by, or supported by the National Library Board
> Singapore. “NLB” is used only to identify the service with which the
> extension works.

Do not use the NLB logo, an NLB-like publisher name, or words such as
“official,” “authorised,” or “approved.” The current original book-and-seat
icon can remain.

## NLB integration and legal risk

### Signed-in session and unofficial endpoints

The extension uses the user's active NLB session to retrieve their own account,
quota, booking, catalog, and availability information. Booking and cancellation
requests are sent only after confirmation. It does not ask for or expose the
user's credentials.

This is materially safer than collecting credentials or bypassing access
controls, but it does not conclusively establish that NLB permits a third-party
client to call the underlying endpoints. Under Singapore's Computer Misuse Act,
the important question is whether access is “without authority.” The user is
authorised to use their own account, while NLB remains the party controlling
its systems and the permitted means of access. See the
[Computer Misuse Act](https://sso.agc.gov.sg/Act/CMA1993?WholeDoc=1).

The public build must continue to:

- avoid CAPTCHA, rate-limit, quota, geofence, and access-control bypasses;
- keep searches sequential and bounded;
- prevent concurrent duplicate scans and submissions;
- require immediate confirmation for bookings and cancellations;
- avoid automatic booking and cancellation retries;
- never support another person's credentials or account; and
- describe the integration as unofficial and subject to NLB changes.

Public distribution multiplies request volume. Before launch, document and
test maximum request counts for a normal refresh, a future-day scan, booking
preflight, map discovery, and cancellation reconciliation.

### Seat-plan images

The extension currently fetches NLB seat-plan images at runtime rather than
packaging or rehosting them. This lowers copying and distribution exposure but
does not conclusively answer whether displaying them inside an independent
interface is permitted.

NLB pages located during research state that images and other materials are
protected and that uses beyond private research or study can require
permission. One NLB Digital Library terms page expressly restricts
reproduction, display, framing, and use of its name. Those pages may not be the
specific contract governing Seat Booking, so they indicate NLB's general
rights posture rather than proving the exact Seat Booking terms. See the
[NLB terms example](https://exhibitions.nlb.gov.sg/terms-of-use/) and an
[NLB rights statement example](https://www.nlb.gov.sg/main/article-detail?cmsuuid=30b994ae-c76e-47f3-9d21-b1b0aeb23c37).

There are three practical release choices:

1. **Permission obtained:** retain runtime maps and use only the promotional
   reproductions covered by the permission.
2. **Runtime use accepted, marketing use uncertain:** retain runtime maps but
   exclude NLB maps, logos, and interface artwork from store assets.
3. **Risk-minimised release:** disable NLB map images in the public build and
   retain seat-number search, favourite lists, and independently created
   non-derivative visuals.

Phase 0 working decision: use option 2. Keep runtime maps because they are a
core part of the current experience, do not bundle or rehost them, and exclude
NLB maps, logos, and underlying interface artwork from public store assets
unless the project later obtains permission. This is a reversible risk choice,
not a legal conclusion.

A disclaimer does not itself grant copyright or trade-mark permission. The
project should record its chosen risk position before public submission.

NLB lists `enquiry@nlb.gov.sg` for general enquiries. A permission request, if
made, should ask to be routed to the Seat Booking product owner and the
relevant legal, IP, and information-security teams. See
[NLB contact information](https://curiocity.nlb.gov.sg/contact-us/).

## Chrome Web Store requirements

Chrome requires a registered developer account and a one-time registration
fee. The contact email must be verified, and two-step verification is required
to publish or update extensions. Use a stable publisher and add a backup admin
for a team-owned project. See
[developer registration](https://developer.chrome.com/docs/webstore/register),
[account setup](https://developer.chrome.com/docs/webstore/set-up-account/),
and [publisher ownership](https://developer.chrome.com/docs/webstore/share-ownership).

### Package and listing inventory

| Item | Requirement or recommendation | Current state |
| --- | --- | --- |
| Upload ZIP | `manifest.json` at the archive root | Packaging script supports this |
| Manifest | MV3, accurate name, description, version, icons | Public name present; 132-character description still pending |
| Store icon | 128×128 PNG in the package | Present and correctly padded |
| Screenshots | 1–5 at 1280×800 or 640×400 | Two correct-size images; NLB IP review needed |
| Small promo tile | 440×280 | Missing |
| Marquee image | 1400×560 | Optional and missing |
| Summary | Plain text, no more than 132 characters | Draft below |
| Detailed description | Accurate user-facing overview | Draft below |
| Category | Productivity | Recommended |
| Initial distribution | Private trusted testers | Recommended |
| Public regions | Singapore | Recommended initially |
| Privacy policy URL | Public, direct, and continuously accessible | `PRIVACY.md` prepared; URL becomes live after merge |
| Homepage URL | Public product or repository page | Repository can be used |
| Support URL | Stable support page | GitHub Issues/template recommended |
| Reviewer instructions | Explain signed-out and account-gated features | Missing |
| In-app purchases | None | Declare none |

Chrome's image guidance requires a 128×128 PNG icon, at least one screenshot,
and a 440×280 small promotional image; it recommends up to five current
screenshots. See [Supplying Images](https://developer.chrome.com/docs/webstore/images)
and [Creating a great listing](https://developer.chrome.com/docs/webstore/best-listing).

Private, unlisted, and public items all undergo policy review. Start with
trusted testers, then submit a Singapore-only public release using deferred
publishing. See
[distribution options](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution).

Chrome says most reviews complete within a few days but may take a few weeks,
with new developers, new extensions, broad access, and hard-to-review changes
receiving closer examination. See the
[Chrome Web Store review process](https://developer.chrome.com/docs/webstore/review-process).

### Proposed store assets

Use only sanitised or approved examples. Never show real user IDs, booking
references, account responses, or dates connected to real bookings.

Suggested screenshot sequence:

1. favourite-seat availability timeline;
2. selecting non-overlapping time slots;
3. booking confirmation before submission;
4. cancellation confirmation and reason selection; and
5. privacy, Settings, and local-data controls.

If NLB promotional-image rights remain uncertain, omit NLB maps and the
underlying NLB interface. Show seat-number search and original timeline UI.

The 440×280 promo tile should use the original Library Seats SG icon and an
abstract timeline or seat motif. It should contain little or no text and no NLB
logo or seat plan. A 1400×560 marquee image can use the same independent visual
system.

## Proposed Chrome Web Store copy

### Title

> Library Seats SG - for NLB

### Summary

> Compare favourite-seat availability, choose time slots, and manage your own NLB seat bookings in one clear view.

### Description

> Spend less time checking seats and more time studying.
>
> Library Seats SG adds a clearer seat-booking workspace to the NLB Seat Booking
> page. Save the seats you prefer, compare their availability across the day,
> and review bookings or cancellations before anything is submitted.
>
> Key features:
>
> - Save favourite seats separately for each local profile.
> - Compare seat availability across the selected day.
> - Find seats by number and, where available, choose them from an interactive
>   plan.
> - Select non-overlapping seats and time slots in one planning view.
> - Review every booking before it is sent to NLB.
> - View upcoming bookings and cancel eligible bookings with confirmation.
> - Respect quota, duration, opening-hour, holiday, and availability
>   information returned by NLB.
>
> Privacy:
>
> - Free, with no advertising or behavioural analytics.
> - Uses the NLB session already signed in on the current tab.
> - Does not request or store your NLB password.
> - Does not directly read or store authentication cookies.
> - Does not send account or booking data to the extension developer.
> - Stores only local favourites, preferences, and pseudonymous profile data.
>
> Requirements:
>
> - Google Chrome.
> - Access to the NLB Seat Booking website.
> - An NLB account for booking and account-specific features.
>
> Library Seats SG is an independent extension and is not affiliated with,
> endorsed by, sponsored by, or supported by the National Library Board
> Singapore. NLB remains the final authority for availability, quotas,
> bookings, cancellations, and account access. Because the extension relies on
> an unofficial integration, NLB website changes may temporarily affect
> functionality.

Avoid keyword repetition, superlatives, and claims such as “official,” “best,”
or “guaranteed.” Chrome requires current and accurate metadata and prohibits
keyword spam. See the
[Listing Requirements](https://developer.chrome.com/docs/webstore/program-policies/listing-requirements).

### Dashboard declarations

Single purpose:

> This extension provides a clearer interface for users to view seat
> availability and manage their own seat bookings on the NLB Seat
> Booking website.

`storage` permission:

> Used only to save favourite-seat selections, the last selected library and
> area, first-use acknowledgement, and pseudonymous local profile data in the
> user's Chrome profile. Account details, booking records, quotas, and
> availability results are not persistently stored.

NLB site access:

> The extension runs only on the NLB Seat Booking path so it can display its
> interface, retrieve account and availability information using the tab's
> existing NLB session, and submit only booking or cancellation actions that
> the user explicitly reviews and confirms.

Remote code:

> No. All executable logic is packaged with the extension. Remote NLB
> responses and images are data, not executable code.

## Privacy disclosures

Chrome treats locally processed information as user data. Login functionality,
account identifiers, authentication information, website/API responses, and
website content can require disclosure even when the developer never receives
them. See the
[Chrome user-data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
and [privacy fields guide](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy).

The dashboard definitions should be reviewed at submission time. Based on the
current behavior, conservatively consider declaring:

- personally identifiable information or account identifiers;
- authentication information, because authenticated NLB requests are made;
- website content, including account, booking, catalog, and availability
  responses; and
- user activity related to seat, booking, and cancellation choices.

Do not declare that the extension handles “no data.” The correct distinction is
that the developer does not receive the data.

### Privacy policy content

The public privacy policy should identify the publisher and a public
support/privacy contact method,
carry an effective date, and describe:

- every category of information processed;
- what is kept only in memory;
- what is stored in Chrome local or page session storage;
- that the NLB session cookie is automatically attached by Chrome but is not
  directly read or persisted by the extension;
- that data is sent only to NLB over HTTPS for disclosed features;
- that the developer operates no collection server and uses no advertising or
  behavioural analytics;
- retention, individual-profile deletion, and full deletion;
- support and privacy contacts;
- material-policy change notification; and
- compliance with the Chrome Web Store User Data Policy, including Limited
  Use requirements.

Singapore's PDPC describes notification, consent, purpose limitation,
protection, retention, access/correction, accountability, and breach handling
as core data-protection obligations. Whether every obligation applies to the
publisher's exact legal structure requires separate advice, but the release
should follow these principles. See the
[PDPC data-protection obligations](https://www.pdpc.gov.sg/overview-of-pdpa/the-legislation/personal-data-protection-act/data-protection-obligations).

Suggested in-product disclosure:

> This independent extension uses your signed-in NLB session to retrieve
> account, booking, quota, seat, and availability information. It sends booking
> or cancellation requests only after you confirm them. Data is not sent to
> the extension developer.

## Current local-storage behavior

The current schema-1 implementation has a permanent Guest profile and opaque
local profiles for signed-in accounts.

The `studySeat...` strings below are stable legacy storage keys retained across
the public rename. They are not user-facing product names and must not be
renamed without a tested storage migration, because doing so would orphan
existing favourites, preferences, and profile metadata.

| Situation | Profile identifier used | Favourite key | Preference key |
| --- | --- | --- | --- |
| Fresh install or signed out | `guest` internally | `studySeatGuestFavourites` | `studySeatGuestSelection` |
| Signed in as user 1 | Installation-local HMAC-derived ID | `studySeatProfile:<opaque ID>:favourites` | `studySeatProfile:<opaque ID>:selection` |
| Signed in as user 2 or later | A distinct HMAC-derived ID | Separate opaque profile key | Separate opaque profile key |

`studySeatLastActiveProfile` stores only an opaque profile ID. A stable
`studySeatProfileOrder` supports neutral Profile 1, Profile 2, and Profile 3
labels without account names.

The important consequences are:

1. There is no literal `undefined` profile key.
2. Signed-out favourites and preferences always belong to Guest.
3. Signing in never silently moves Guest data. When Guest has favourites, an
   account chooses whether to copy them or keep them separate. A profile that
   copied is prompted again only for newly added Guest favourites, while Keep
   separate remains a persistent opt-out.
4. Copying merges without deleting Guest favourites.
5. Switching from user 1 to user 2 keeps their opaque favourites and
   preferences separate.
6. Account details, bookings, quotas, availability, selections, map bytes, and
   booking progress are not kept in Chrome local storage.
7. The sign-in workflow stores only a short-lived timestamp in the NLB tab's
   `sessionStorage`.

The raw NLB ID exists only transiently in account-session memory. HMAC
derivation uses a random installation-local 256-bit secret that is never sent
by extension code. The UI derives a masked indicator that preserves the first
and last character and replaces every middle character with `*`.

A sanitised illustrative snapshot covering fresh signed-out, one-account,
multiple-account, malformed, and schema-1 opaque states is stored in
[`examples/chrome-storage-profiles.sanitized.json`](examples/chrome-storage-profiles.sanitized.json).
The values are invented fixtures, not raw browser exports.

## Current request-count ceilings

These ceilings describe explicit application API calls, not ordinary browser
requests for page assets. Let:

- `S` be the number of exact timeline intervals checked;
- `B` be the number of planned booking requests after the user's adjacent-slot
  grouping choice; and
- `C` be the number of complete bookings selected for cancellation.

Each `SearchAvailableAreas` call can be retried once only for HTTP `429` or
`5xx`, so one logical search has a ceiling of two HTTP requests. Account,
booking, and cancellation requests are not automatically retried.

| User or lifecycle action | `GetAccountInfo` | `SearchAvailableAreas` HTTP maximum | Mutation HTTP maximum |
| --- | ---: | ---: | ---: |
| Normal page start or header refresh | 1 | 0, excluding independent map discovery | 0 |
| Return from a pending sign-in | Up to 6 bounded attempts | 0, excluding independent map discovery | 0 |
| Automatic map metadata discovery for one selected area | 0 | 2 once per area per mounted workspace | 0 |
| Future-date availability scan | 0 | `2S` | 0 |
| Current-day refresh with usable matrix | 1 | 0 | 0 |
| Current-day refresh with unusable matrix | 1 | `2S` | 0 |
| Confirmed booking run | 2 | `2B + 2S` worst case | `B` booking requests |
| Confirmed cancellation run | 2 | `2S` worst case | `C` cancellation requests |
| Maintainer-only selected-branch discovery | 1 | 2 raw, non-retried probes | 0 |

For booking, the first account request refreshes account, quota, catalog, and
the current-day reference matrix. Each planned booking receives one exact
preflight search before sequential submission. A second account request
reconciles the completed run. The final `2S` applies only when the selected
date needs an exact post-mutation availability scan; a usable current-day
matrix needs no additional availability search.

For cancellation, one account request verifies eligibility before sequential
non-retried cancellation requests and another reconciles the result. The final
availability scan follows the same `2S` condition.

The map ceiling covers metadata discovery only. Rendering a plan also fetches
the image bytes from NLB; browser caching and whether both preview and verified
picker render are used determine the number of image requests. No image bytes
are persisted by the extension.

## Implemented profile-storage model

### Profiles

- Maintain one permanent **Guest** profile for favourites and preferences
  created while signed out.
- Maintain one separate opaque local profile for every observed NLB account.
- Do not persist or display the raw NLB user ID.
- Generate neutral local labels such as **Profile 1**, **Profile 2**, and
  **Profile 3**. Mark the active one as **Current account** while signed in.
- Store counts and only the minimum metadata needed to manage profiles. Do not
  store account names merely to make the Settings screen friendlier.
- Derive the stable opaque profile key locally, for example with an HMAC of the
  NLB user ID using an installation-local secret. Never send the secret,
  derived key, or user ID to the developer.

### Guest-to-account transition

Do not silently move Guest data into the first account. When a user signs in
and Guest has data, offer an explicit one-time choice:

- **Copy Guest favourites to this account**; or
- **Keep Guest favourites separate**.

Copying is safer and more understandable than moving. The user can delete the
Guest profile later from Settings.

### Migration from the current schema

Implement a versioned, deterministic migration:

1. create an installation-local profile-key secret;
2. enumerate current account-scoped keys;
3. derive an opaque key from each encoded raw user ID;
4. copy validated favourites and preferences to the new schema;
5. preserve the old last-active relationship using only the opaque key;
6. migrate unscoped legacy data into the permanent Guest profile;
7. verify the new records before removing raw-ID keys; and
8. store a schema version so the migration is not repeated.

Migration must be covered by fixtures for fresh signed-out users, one account,
multiple accounts, partially migrated legacy data, malformed values, and
interrupted migration. It must fail without deleting the source data.

## Settings design

Add a gear button in the extension header that opens a keyboard-accessible
Settings dialog or panel. It should remain available when signed out and when
the main workspace is collapsed.

### About

- Library Seats SG name, icon, and installed version;
- short feature explanation;
- independent-project disclaimer;
- links to privacy policy, source code, support, licence, and security contact;
- “Unofficial integration; NLB remains the final booking authority”; and
- a concise explanation of the signed-in session behavior.

### Saved profiles and local data

Display:

- Guest, including favourite count and whether it has a saved area;
- Current account/Profile N when signed in;
- other opaque saved profiles, using neutral labels and counts; and
- a plain-language list of what is and is not stored.

Do not reveal the raw NLB user ID in the Settings UI, tooltips, accessible
labels, DOM attributes, or storage-key names.

Provide the following separate actions:

1. **Clear Guest data** — removes Guest favourites and its last area.
2. **Clear this profile** — when signed in, removes only the current account's
   favourites and last area.
3. **Delete saved Profile N** — removes one inactive opaque profile after a
   confirmation showing its favourite count.
4. **Clear all Library Seats SG data** — removes Guest, all account profiles,
   profile metadata, acknowledgement/settings data, and the short-lived
   sign-in marker.

Every destructive action should state exactly what it affects, require a
confirmation, update the visible UI immediately, and remain recoverable only
through the user's own exported backup if export/import is later added.

### Cache terminology

The current production extension has no meaningful persistent availability or
image cache to clear. Availability, catalog responses, bookings, selected
cells, and fetched map blobs live in memory and disappear when the page is
reloaded.

Do not add a misleading generic **Clear cache** button. If useful, provide
**Reset current view and refresh from NLB**, explaining that it discards
temporary in-memory state and reloads current account/catalog information. It
must not delete favourites or preferences.

### Additional settings

Keep the first release small. Reasonable settings are:

- acknowledgement/disclosure status;
- default adjacent-slot booking mode, if users genuinely need it;
- map zoom preference only if it is intentionally persisted; and
- optional export/import of favourites after the core deletion model is
  stable.

Do not add analytics, advertising, or settings that require broader Chrome
permissions for the initial public release.

## Actionable engineering roadmap

Each phase should be implemented and browser-tested independently. Account and
storage changes require documentation updates and a release version bump when
they become release-bound.

### Phase 0 — decisions and baselines

- [x] Complete a basic name search and adopt **Library Seats SG - for NLB** as the
  public name; formal similar-mark clearance remains separate.
- [x] Choose runtime-only seat-plan use and exclude NLB material from store
  assets as the reversible working risk position.
- [x] Capture sanitised fixtures for every current storage state without real
  user IDs.
- [x] Write tests that lock down the current Guest, first-sign-in migration,
  last-active signed-out, and multi-account behavior before changing it.
- [x] Record request-count ceilings for refresh, availability, preflight, map,
  booking, and cancellation flows.

Acceptance: the present behavior and migration inputs are reproducible without
using personal account data.

### Phase 1 — central storage service and deletion primitives

- [x] Define a versioned storage schema and typed storage inventory.
- [x] Centralise all storage keys and validation in one service.
- [x] Add read-only profile inventory helpers.
- [x] Add separately tested deletion helpers for Guest, one profile, and all
  extension data.
- [x] Add tests proving one-profile deletion cannot affect another profile.
- [x] Add tests proving malformed storage is ignored and never upgraded into
  valid data.

Acceptance: deletion can be tested at the service layer before any Settings UI
is exposed.

Implementation status (2026-08-19): `profileStorage.ts` owns the schema-1 and
legacy migration keys, validators, opaque inventory, and whitelist-based
deletion helpers. Inventory contains only Guest and opaque profile IDs. The
deletion helpers are intentionally not wired to UI until Phase 3.

Before Phase 2, library switching was also corrected so a selected library
automatically uses its first catalog-valid favourite area. Startup applies
the same fallback to an empty or obsolete saved area, while a library without
valid favourites continues to require an explicit area choice.

### Phase 2 — opaque profile migration

- [x] Introduce installation-local opaque account profile keys.
- [x] Migrate raw-ID account keys and `lastActiveNlbUserId` without losing
  favourites or preferences.
- [x] Keep Guest permanently separate.
- [x] Replace automatic legacy-to-first-account migration with the explicit
  Guest copy choice.
- [x] Remove the raw NLB user ID from persistent storage after verified
  migration.
- [x] Remove the full user ID from the panel title, tooltip, accessible name,
  and other rendered markup.
- [x] Document rollback and interrupted-migration behavior.

Acceptance: user 1, user 2, user 3, and Guest remain isolated across sign-in,
sign-out, reload, upgrade, and deletion; no raw user ID appears in
`chrome.storage.local` or rendered UI.

Implementation status (2026-08-19): schema 1 derives stable profile IDs with
HMAC-SHA-256 using a random installation-local 256-bit secret. Migration
writes and verifies opaque targets before removing legacy keys, commits the
schema version last, and reuses the same secret and targets when resuming.
Signed-out operation now always uses Guest. Copy decisions remember which
Guest favourite identities were acknowledged, so later additions can be
offered without repeatedly prompting for the same seats; Keep separate is a
persistent opt-out. The header and Settings use stable Profile N labels plus a
masked first/last-character account indicator. Complete raw NLB IDs remain
only in transient account-session memory for derivation and same-session
safety checks.

### Phase 3 — Settings and disclosure UI

- [x] Add the header Settings button and accessible dialog focus management.
- [x] Add About, disclaimer, version, privacy, source, support, and security
  links.
- [x] Show Guest and opaque saved-profile summaries.
- [x] Implement Clear Guest, Clear current profile, Delete Profile N, and Clear
  all actions with precise confirmation text.
- [x] Add Reset current view and refresh from NLB if testing shows it is useful.
- [x] Add a first-use privacy/session disclosure and acknowledgement.
- [x] Add an explicit Guest-to-current-account copy flow.
- [ ] Test keyboard navigation, screen readers, 200% zoom, reduced motion, and
  narrow windows.

Acceptance: users can understand and remove every persistent record without
knowing Chrome storage internals.

Implementation status (2026-08-20): Settings is available in every header
state and inventories Guest plus opaque Profile N records. Current-profile
clearing retains its identity, inactive deletion removes the complete profile,
and clear-all also removes the disclosure acknowledgement and pending sign-in
marker without signing out or mutating bookings. The dialog implements focus
entry, focus trapping, Escape handling, trigger restoration, background
inertness, narrow-window layout, and no motion-dependent interaction. Manual
Chrome verification at keyboard, screen-reader, and 200% zoom settings remains
the final Phase 3 gate.

### Phase 4 — public documentation and policy files

- [x] Add `PRIVACY.md` with the verified data inventory, retention, deletion,
  contact, and Limited Use disclosures.
- [x] Add a Chrome Web Store privacy-declaration worksheet matching the
  current implementation.
- [x] Add end-user terms and the independence/warranty disclaimer.
- [x] Add a code `LICENSE` and a `NOTICE` excluding NLB materials and marks.
- [x] Add `SECURITY.md` with a private vulnerability contact.
- [x] Add support issue templates warning users not to post IDs, booking
  references, raw account responses, cookies, or personal screenshots.
- [x] Rewrite the README opening for end users.
- [x] Move the long technical feature inventory into documentation.
- [x] Document Chrome Web Store installation first and manual installation as
  a developer/advanced fallback.
- [x] Explain that favourites from an unpacked installation do not
  automatically migrate to the separately installed Web Store item.

Acceptance: Store declarations, privacy policy, README, and observed build
behavior agree exactly.

Phase 4A implementation status (2026-08-20): the standalone privacy policy
documents transient NLB account and website data, local preferences, the
timestamp-only sign-in marker, NLB-only HTTPS transfers, retention, deletion,
and the absence of a developer backend, analytics, or advertising. Settings
links directly to the default-branch policy. The README now leads with the
target audience and planned Store installation, while the declaration
worksheet records conservative dashboard answers that must be rechecked
against the exact upload at submission time.

Phase 4B implementation status (2026-08-20): end-user terms now state the
independent and unofficial integration, user responsibilities, NLB's final
authority, compatibility limits, and warranty/liability boundaries subject to
applicable law. Original project code uses the MIT License; `NOTICE` expressly
excludes NLB and other third-party marks and materials. The security policy
provides private reporting without authorising NLB testing, and GitHub issue
forms require reporters to remove account, booking, authentication, and raw
response data. The exhaustive capability inventory now lives in
`docs/features.md`, leaving the README focused on prospective users,
installation, normal usage, privacy, and contributor entry points.

### Phase 5 — store listing assets and submission

- [x] Update the manifest and installed interface name to **Library Seats SG - for
  NLB**.
- [ ] Finalise the 132-character manifest description.
- [ ] Generate one 440×280 small promo tile.
- [ ] Generate up to five sanitised 1280×800 screenshots.
- [ ] Optionally generate a 1400×560 marquee image.
- [ ] Create stable homepage, privacy, and support URLs.
- [ ] Complete single-purpose, permission, data-use, Limited Use, remote-code,
  and no-purchase declarations.
- [ ] Write reviewer instructions for signed-out behavior and account-gated
  features without sharing a personal account.
- [ ] Package and verify the ZIP from an up-to-date branch.
- [ ] Submit first to private trusted testers with deferred publishing.

Acceptance: a Web Store-installed build passes the relevant Chrome smoke-test
matrix and the listing contains no personal or unapproved third-party
material.

### Phase 6 — controlled public launch

- [ ] Publish initially in Singapore only.
- [ ] Confirm automatic update behavior and current version display.
- [ ] Monitor support, policy emails, NLB compatibility, request failures, and
  uninstall feedback.
- [ ] Maintain an emergency process to disable or patch a broken integration.
- [ ] Reassess localisation into Chinese, Malay, and Tamil only when ongoing
  support in those languages is available.

## README direction

The root README should serve users first and contributors second. Recommended
order:

1. product name, one-sentence value, and independence disclosure;
2. Chrome Web Store install button;
3. three-step “How it works”;
4. a short benefits list for students, working adults, and frequent library
   users;
5. approved screenshots;
6. “Your account stays with NLB” privacy explanation;
7. limitations and unofficial-integration notice;
8. support and local-data deletion;
9. manual/developer installation; and
10. links to architecture, API, testing, and maintenance documentation.

Suggested opening:

> # Library Seats SG - for NLB
>
> A free Chrome extension that makes it easier to find and manage library seats
> on the NLB Seat Booking website.
>
> Save the seats you like, compare availability across the day, and review
> bookings or cancellations in one clear view. You still sign in through NLB,
> and NLB remains in control of every booking.
>
> Library Seats SG is an independent project and is not affiliated with or
> endorsed by the National Library Board Singapore.

Suggested privacy block:

> ## Your account stays with NLB
>
> The extension does not ask for your NLB password and does not read browser
> cookies directly. It uses the NLB session already open in the Seat Booking
> tab. Account and booking information stays in your browser and is sent only
> to NLB when required for the feature you are using.

## Definition of public-release readiness

The extension is ready for public submission when:

- branding is independent and the NLB/map risk decision is recorded;
- no raw NLB user ID is persisted or unnecessarily displayed;
- Guest and every account profile are isolated, explainable, and individually
  deletable;
- privacy, terms, licence, notice, security, and support documents are live;
- Chrome dashboard declarations match the verified implementation;
- required artwork is sanitised and correctly sized;
- automated validation and packaging pass;
- trusted-tester installation and relevant live NLB smoke tests pass; and
- remaining unverified legal or integration risks are accepted consciously by
  the publisher.

# Chrome Web Store privacy declarations

Status: submission worksheet based on Library Seats SG - for NLB v1.3.1 behavior,
reviewed 20 August 2026.

This worksheet maps the extension's actual behavior to the Chrome Web Store
Privacy practices tab. Dashboard wording can change; verify the available
labels again immediately before every submission. Answers must remain
consistent with [`PRIVACY.md`](../PRIVACY.md), the store listing, the manifest,
and the submitted build.

Official references:

- [Fill out the privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/)
- [Chrome Web Store User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
- [Chrome Web Store program policies](https://developer.chrome.com/docs/webstore/program-policies/policies)
- [Disclosure requirements](https://developer.chrome.com/docs/webstore/program-policies/disclosure-requirements)

## Single purpose

Suggested answer:

> Library Seats SG provides a clearer interface on the NLB Seat Booking website
> for viewing seat availability, saving favourite seats, and reviewing
> and managing the user's own NLB seat bookings.

Do not broaden this to general browsing, automation, analytics, or unrelated
NLB services.

## Permission and site-access justification

### `storage`

Suggested answer:

> Used only to keep favourite-seat selections, the last selected library and
> area, first-use acknowledgement, and pseudonymous local profile preferences
> in `chrome.storage.local`. Account details, bookings, quotas, availability,
> credentials, and cookies are not persistently stored by the extension.

### NLB Seat Booking site access

Suggested answer:

> The content script runs only on `https://www.nlb.gov.sg/seatbooking/*` so it
> can add the Library Seats SG interface, retrieve the user's NLB account, catalog,
> booking, quota, and availability information using the existing same-origin
> NLB session, and submit only booking or cancellation actions the user has
> reviewed and confirmed.

### Remote code

Suggested answer: **No**.

> All executable JavaScript and CSS is included in the extension package. NLB
> API responses and seat-plan images are treated only as data and are not
> executed as code.

## User-data categories

Chrome's FAQ says locally processed or locally stored information must still
be disclosed. Do not choose an overall "handles no user data" answer.

Use the closest dashboard categories available at submission time:

| Dashboard category | Recommended selection | Current handling and justification |
| --- | --- | --- |
| Personally identifiable information / account identifiers | Yes | The NLB account identifier is processed transiently to derive an opaque local profile ID and masked display. The complete value is not persisted or sent to the developer. |
| Authentication information | Yes, conservatively | The extension has sign-in functionality and makes authenticated same-origin NLB requests. Chrome attaches the existing NLB session; extension code does not read or store the password, cookie, or token. If the dashboard definition explicitly excludes this behavior, record that definition before changing the answer. |
| Website content | Yes | The extension processes NLB account, catalog, rules, booking, quota, availability, and seat-plan responses to render its interface. |
| User activity | Yes | Favourite-seat choices, saved areas, requested dates/times, confirmations, and signed-out favourite sync choices are user interactions necessary for the feature. Only the documented preferences are persisted locally. |
| Location | No | The extension does not request or read device location and continues to use NLB's offsite mode. |
| Financial and payment information | No | No payments or financial information are handled. |
| Health information | No | No health information is handled. |
| Personal communications | No | No email, chat, or other personal communications are read. |

If the dashboard provides more granular options, select every option that
reasonably covers the data above and explain that it remains on-device or is
exchanged only with NLB. Overlooking locally processed data is a larger policy
risk than accurately disclosing it.

## Collection, sharing, and usage certifications

Based on the current build, certify only statements equivalent to all of the
following:

- user information is used only for the extension's disclosed single purpose;
- information is not sold to third parties;
- information is not used or transferred for purposes unrelated to the
  extension's single purpose;
- information is not used or transferred to determine creditworthiness or for
  lending;
- information is not used for personalised, retargeted, or interest-based
  advertising;
- the developer does not allow humans to read user information because the
  extension sends none of it to a developer-operated service; and
- information sent between the extension and NLB uses HTTPS.

The developer operates no collection backend. Information is either stored
locally on the user's device, held transiently in the tab, or sent directly to
NLB as necessary for the feature.

## Privacy policy URL

After `PRIVACY.md` is merged to the default branch, use:

```text
https://github.com/teamcmcbot/nlb-seat-booking-extension/blob/main/PRIVACY.md
```

Confirm the URL is publicly accessible in a signed-out browser before
submission. A repository Markdown page is suitable for pre-release testing;
replace it with a stable project-site URL later if the project creates one.

## Pre-submission consistency check

- [ ] Re-audit the exact ZIP being uploaded, not only the source branch.
- [ ] Re-check the manifest permissions, host match, and remote-code answer.
- [ ] Compare every dashboard checkbox with `PRIVACY.md` and the store copy.
- [ ] Confirm the privacy URL works while signed out of GitHub.
- [ ] Confirm Settings opens the same privacy policy.
- [ ] Confirm no analytics, advertising, telemetry, or developer backend was
  added.
- [ ] Confirm material information-handling changes are prominently disclosed
  to existing users.
- [ ] Save a dated screenshot or export of the submitted declarations for the
  release record.

# Firefox Add-ons data declarations

This worksheet maps version 1.4.0 to Mozilla's built-in data-consent manifest
categories. It must be re-reviewed if NLB integration, persistence, analytics,
or network destinations change.

## Required categories

| Manifest category | Why it is required | Storage and transfer |
| --- | --- | --- |
| `authenticationInfo` | The content script observes signed-in state and a current NLB account identifier so it can use the existing NLB session and select the correct opaque local profile. | The raw identifier is held transiently, is not persisted, and is sent only to NLB as part of same-origin authenticated requests the browser performs. It is never sent to the developer. |
| `websiteActivity` | The extension processes the current NLB Seat Booking route and user-confirmed booking or cancellation actions. | Route and action state stays in memory except for the documented local preferences. Confirmed actions go only to NLB. |
| `websiteContent` | The extension reads NLB account, catalog, availability, booking, rule, and seat-plan responses needed to render the workspace. | Operational responses stay in memory. Favourite seats and last area are stored locally. Nothing is sent to a developer service. |

## Categories not declared

The extension declares no optional data collection and no
`technicalAndInteraction` telemetry. It has no analytics, advertising,
developer-operated backend, crash reporter, or remote executable code.

The raw NLB account identifier is personal information processed locally, as
fully disclosed in the privacy policy. The manifest does not separately declare
`personallyIdentifyingInfo` because extension code does not collect or transmit
that identifier to the developer or another non-NLB recipient. Recheck this
interpretation against the live AMO form at submission time and choose the more
conservative declaration if Mozilla's form wording has changed.

## Store answers

- Data collection required for core functionality: **Yes**, the three manifest
  categories above.
- Optional data collection: **None**.
- Data sold, shared for advertising, or used for profiling: **No**.
- Developer receives user data: **No**.
- Data sent to the site the extension operates on: **Yes, NLB only**, when
  necessary to retrieve data or perform a user-confirmed action.
- Privacy policy URL:
  `https://github.com/teamcmcbot/nlb-seat-booking-extension/blob/main/PRIVACY.md`

The word “collection” in Mozilla UI may include local processing. Listing and
reviewer text must therefore explain both the declared categories and the fact
that no user data is sent to the developer.

# Chrome Web Store assets

These are the listing assets for Library Seats SG - for NLB. The promo
tile is wholly original project artwork. The feature screenshots intentionally
show the extension running on NLB's Seat Booking page, including the runtime
seat plan, because the combined map-and-availability experience is a core
product feature.

The current workspace and booking-flow PNGs are the reviewed 1.4.1 listing
set. The workspace overview and four booking-flow images were recaptured,
edited, and approved individually after the compact selection summary and
fixed post-favourites region were implemented. `store-seat-picker.png` is
intentionally unchanged because the relevant seat-picker UI did not change.
Raw booking-flow captures and dated pre-recapture backups are retained in the
repository for traceability.

The screenshot decision is a conscious, limited-use risk position rather than
a conclusion that NLB has licensed its maps for promotional reproduction. NLB
material remains inside authentic product screenshots; it is not extracted,
packaged, rehosted, or reused in the promo tile.

## Upload assets

| File | Dimensions | Purpose |
| --- | --- | --- |
| `small-promo-tile.png` | 440×280 | Required small promotional tile |
| `store-overview.png` | 1280×800 | Introductory overview: automatic launch, library/area/date selection, favourites, and availability refresh |
| `store-seat-picker.png` | 1280×800 | Enlarged seat picker showing seat lookup and saving a seat to favourites |
| `booking-flow-01-selection.png` | 1280×800 | Two selected sessions, with the fixed booking action region and compact booking-mode control visible |
| `booking-flow-02-confirmation.png` | 1280×800 | Confirmation dialog showing both booking requests before submission |
| `booking-flow-03-success.png` | 1280×800 | Successful booking status for both sessions |
| `booking-flow-04-upcoming.png` | 1280×800 | Upcoming bookings showing the 11am–1pm session and lunch break before 2pm–4pm |

Chrome permits up to five listing screenshots. The recommended v1.4.1 upload
sequence is `store-overview.png`, `store-seat-picker.png`,
`booking-flow-01-selection.png`, `booking-flow-02-confirmation.png`, and
`booking-flow-04-upcoming.png`. `booking-flow-03-success.png` is retained as an
alternate when showing the in-extension success status is more useful than the
final My Bookings view. `settings-and-privacy.png` remains a historical
reference rather than a recommended feature screenshot.

The older files under the repository-level `screenshots/` directory are
historical documentation references and should not be uploaded because they
use the previous product name.

The six feature screenshots are deterministic composites of authenticated UI
captures. They preserve the approved masked account label, feature-specific
library, area, date, seat, booking-status, and real extension controls while
adding explanatory captions, limited background treatment, and the approved
pointer or focus treatments. Before public upload, confirm that the approved
masked-profile and booking details remain acceptable. Never publish a raw
account identifier, booking reference, credential, cookie, or unsanitised
account response.

## Small promo tile provenance

The small promo tile was generated with Codex's built-in image-generation tool
on 20 August 2026 using `assets/icon-master.png` as the only reference. The
generated source was resized to the required 440×280 dimensions without adding
text or third-party material.

Final prompt:

```text
Use case: ads-marketing
Asset type: Chrome Web Store small promotional tile, designed for a final 440×280 full-bleed crop
Primary request: create a clean, polished promotional graphic for the Library Seats SG Chrome extension using the supplied original icon as the central brand element
Input images: Image 1 is the project's original icon and must remain recognizable and unchanged in its core book, chair, and checkmark design
Scene/backdrop: saturated deep navy-to-emerald gradient with subtle abstract seat-availability timeline bars and a restrained curved book-page motif
Style/medium: premium flat-to-soft-3D digital brand artwork, crisp edges, professional Chrome Web Store presentation
Composition/framing: landscape 11:7 composition; icon large and clearly readable, slightly left of center; abstract timeline motifs balanced on the right; full bleed with well-defined edges; safe margins for cropping
Color palette: preserve the icon's navy, orange, and mint; backdrop in deep navy and rich emerald; high contrast
Constraints: no text; no letters; no NLB logo; no library website interface; no screenshots; no seat-plan map; no people; no misleading awards or badges; no watermark; keep the supplied icon's identity consistent; simple enough to remain legible at half size
Avoid: white or pale-gray background, clutter, photorealism, extra logos, generic stock imagery
```

## Pre-upload review

- Confirm each raster file still has the dimensions listed above.
- Review assets at 50% size for legibility.
- Confirm the listing title, screenshots, icon, and promo tile use consistent
  Library Seats SG branding.
- Confirm the visible masked profile, date, seat names, and booking status are
  acceptable for publication; otherwise recapture from a clean demo or Guest
  state.
- Keep NLB seat-plan material confined to authentic feature screenshots and
  out of the icon, promo tile, and any optional marquee image.

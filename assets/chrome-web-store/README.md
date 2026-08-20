# Chrome Web Store assets

These are the Phase 5 listing assets for Library Seats SG - for NLB. The promo
tile is wholly original project artwork. The feature screenshots intentionally
show the extension running on NLB's Seat Booking page, including the runtime
seat plan, because the combined map-and-availability experience is a core
product feature.

The screenshot decision is a conscious, limited-use risk position rather than
a conclusion that NLB has licensed its maps for promotional reproduction. NLB
material remains inside authentic product screenshots; it is not extracted,
packaged, rehosted, or reused in the promo tile.

## Upload assets

| File | Dimensions | Purpose |
| --- | --- | --- |
| `small-promo-tile.png` | 440×280 | Required small promotional tile |
| `store-overview.png` | 1280×800 | Authentic current extension overview with the integrated seat plan and availability timeline |
| `store-seat-picker.png` | 1280×800 | Authentic current interactive seat picker with seat-number search |
| `settings-and-privacy.png` | 640×400 | Authentic Settings capture showing the booking default and its explanatory tooltip, cropped before any account profile data |

The older files under the repository-level `screenshots/` directory are
historical documentation references. Do not upload them because they use the
previous product name.

The overview and seat-picker captures were taken while signed out. They show
Guest favourite seat numbers, but no account label, profile number, raw account
ID, booking reference, credentials, cookie, or API response. The Settings
capture was taken from an active session but is cropped above Local data, so it
does not expose the account label, masked username, profile number, favourites,
or saved-area status. The publisher must still approve the Guest preference-
level details in the two feature captures before upload or recapture those
views from a clean Guest state.

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
- Confirm the visible Guest favourite-seat numbers are acceptable for
  publication; otherwise recapture from a clean Guest state.
- Keep NLB seat-plan material confined to authentic feature screenshots and
  out of the icon, promo tile, and any optional marquee image.

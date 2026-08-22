---
name: chrome-web-store-screenshots
description: Create or refine Chrome Web Store screenshots from existing extension UI captures with deterministic blur, captions, arrows, pointer placement, and visual QA.
metadata:
  short-description: Annotate extension screenshots for Chrome Web Store listings
---

# Chrome Web Store screenshots

Use this skill when preparing promotional or instructional screenshots of the
Library Seats SG extension for a Chrome Web Store listing. The screenshots
should make the extension's workflow obvious while preserving the real UI and
avoiding misleading visual edits.

## Non-negotiable source rules

- Inspect every source screenshot before editing.
- Back up all originals before replacing any working image.
- Preserve the extension UI exactly: text, seat numbers, dialogs, controls,
  account masking, and layout must not be redrawn or invented.
- Use deterministic compositing or browser-based rendering for existing UI.
  Do not use generative image editing to alter application screenshots.
- Do not commit, push, or publish screenshots unless the user explicitly asks.

## Canvas and output quality

- Default output size is `1280 × 800`.
- Preserve the source aspect ratio. Avoid arbitrary cropping or resizing.
- Render at 1× scale with crisp text and controls.
- Export a valid image format matching the file extension.
- Verify the final dimensions and file type after rendering.

## Visual focus and blur

- Treat the extension panel as the primary subject unless the requested step
  explicitly targets the NLB website.
- Keep the primary subject sharp and unchanged.
- Use only subtle background blur, normally equivalent to a 3–5 px blur.
- Never blur the caption, arrow, extension panel, dialog, or the specific UI
  target being explained.
- Blur is configured per screenshot:
  - `subtle`: blur secondary background content while keeping the target sharp.
  - `none`: keep the entire screenshot sharp when the website itself is the
    instructional target.
- Do not apply a blanket blur when an arrow points to the NLB website. Keep the
  target area and any connected context readable.

## Captions

- Write captions as short, numbered instructions in sentence case.
- Position each caption relative to its target and the available negative
  space. Do not reuse one fixed lower-left position for every screenshot.
- Prefer a central, visually balanced location near the subject while keeping
  the caption outside the main subject and away from important controls.
- Keep the caption close enough to the target that the relationship is obvious.
- Center-align text inside the caption card.
- Prefer one line; wrap to two lines only when necessary.

Recommended styling at 1280 × 800:

- Font: system sans-serif (`-apple-system`, `BlinkMacSystemFont`, or
  `Segoe UI`).
- Weight: semibold.
- Size: approximately `20–24px`.
- Text: `#FFFFFF`.
- Card: dark navy/charcoal, approximately `rgba(17, 24, 39, 0.92)`.
- Border radius: `10–14px`.
- Horizontal padding: `20–28px`.

## Zoomed focus insets

Use a zoomed inset when an important UI region is small, low-contrast, or
positioned near the edge of the primary subject.

- Capture the inset from the original screenshot; do not redraw or recreate
  the UI.
- Enlarge the target region approximately `1.4×–1.7×`.
- Prefer a rounded rectangular inset when text, rows, or multiple controls
  must remain readable. Use a circular lens only when the target is compact.
- Place the inset in open negative space, normally over the blurred secondary
  background, without covering the original extension panel or target.
- Keep the full target context visible in the inset, including its heading when
  it helps explain the feature.
- Use a subtle dark or green outline, rounded corners, and a restrained shadow.
- Do not add arrows or a pointer solely to connect the inset to its source;
  the duplicated sharp crop should make the relationship clear.
- Validate that the inset text is sharp, legible, and not clipped.

## Arrows

- Point to the exact interactive element, not a nearby label or general area.
- End each arrow inside the target's visible bounds.
- Use a thick, rounded amber arrow:
  - color approximately `#F59E0B`;
  - stroke width `6–8px`;
  - arrowhead approximately `18–24px`;
  - rounded line caps and joins.
- Prefer curved or routed Bézier paths when a straight line would cross seat
  numbers, dialogs, buttons, or other important UI.
- Keep each connector in an open corridor and route around the primary subject
  rather than through it.
- For separate targets, use separate arrowheads or a clearly branched arrow.
- Recheck every endpoint visually after rendering.

## Mouse pointer

- Show the pointer only when it demonstrates a hover or interaction.
- For hover screenshots, place it directly on or immediately beside the target.
- Hide it for screenshots where it provides no instructional value.
- Use a standard black pointer with a subtle white outline or shadow,
  approximately `16–20px` at 1280 × 800.
- The pointer tip, not its body, must land on the intended control. Keep the
  body small enough that it does not obscure the control label.
- Never leave the pointer floating over unrelated controls.

## Per-screenshot configuration

Create an explicit configuration for every output. At minimum define:

- source and output paths;
- caption text;
- one or more target regions;
- caption placement or candidate safe area;
- `backgroundBlur: subtle | none`;
- pointer visibility and target, if applicable.

Example:

```json
{
  "source": "booking-flow-01-selection.png",
  "output": "booking-flow-01-selection.png",
  "caption": "1. Book multiple sessions together",
  "target": {
    "type": "multiple",
    "regions": [
      { "x": 932, "y": 480, "width": 80, "height": 30 },
      { "x": 1040, "y": 480, "width": 90, "height": 30 }
    ]
  },
  "captionPlacement": "center-left-near-target",
  "backgroundBlur": "subtle",
  "pointer": "hidden"
}
```

## Booking-workflow targets

When preparing the four booking workflow screenshots:

- Flow 01: identify both separate groups of blue selected-hour boxes. Use
  multiple accurate arrow targets; a single arrow to the general panel is not
  sufficient.
- Flow 02: point to the confirmation dialog and, when useful, the primary
  “Confirm and book” action.
- Flow 03: point to the extension's booking-status section.
- Flow 03 may use a zoomed focus inset for the Booking status section instead
  of an arrow. Keep the original status section visible and sharp as well.
- Flow 04: caption the NLB “My Bookings” destination and point specifically to
  the “My Bookings” tab, not the “Upcoming” tab. Use `backgroundBlur: none` for
  this screenshot unless the user requests a different treatment.

## Validation before handoff

Before replacing the working images:

- Review all screenshots together for consistent visual language.
- Confirm captions are balanced, central where possible, and close to their
  targets.
- Confirm arrows terminate at the intended controls.
- Confirm primary extension content remains sharp and legible.
- Confirm blur is limited to the intended secondary regions.
- Confirm the pointer is intentional or absent.
- Confirm every output is `1280 × 800` and has the expected file type.
- Show the completed images to the user for visual approval before any commit
  or push.

# NLB Seat Helper v1.3.0

This release makes it easier to choose favourite seats while referring to the
NLB seat plan.

It also introduces proactive maintenance and runtime fingerprinting for NLB
map and seat-catalog changes.

## Highlights

- Replaces the image-only full-screen viewer with a responsive seat picker.
- Keeps the enlarged seat plan visible beside seat-number search and favourite
  controls.
- Uses a light-green, high-contrast Done button and scales map favourite stars
  relative to each seat hotspot.
- Lets users add or remove favourites without repeatedly closing the plan.
- Keeps each sidebar seat result at a compact fixed height and scrolls the
  result list when it exceeds the available panel height.
- Keeps the existing compact right-side panel at its normal width.
- Adds 100%, 125%, 150%, 175%, and 200% zoom controls to the interactive plan,
  with scrollbar tracks outside the map and mouse, touch, trackpad, or wheel
  navigation.
- Centers a seat in the map when it is selected from the sidebar and supports
  dragging the map background to pan without interfering with seat clicks.
- Labels the booking timeline color explanation as **Legend**.
- Adds 2,080 reviewed pointer- and keyboard-accessible hotspots across all 83
  inventoried plans, including explicit range-order handling for the one range
  and one hybrid plan.
- Validates the exact map revision, image dimensions, geometry, catalog seat
  identities, SHA-256 fingerprint, and full coverage before enabling a
  clickable layer.
- Retains seat-number search as the reliable fallback for unmapped or changed
  NLB plans.
- Adds an audited inventory of all 83 current branch/area plans, including
  seat counts, map metadata, visual label type, fingerprint, and annotation
  status.
- Adds a confirmation-gated, extension-local sanitized catalog export without
  changing the NLB URL, plus sequential map capture, drift auditing, generated
  inventory/fingerprints, static verification, and visual annotation work
  packets.
- Adds an explicitly confirmed full-discovery export that probes all areas
  sequentially to refresh map URLs and observed booking seat codes.
- Matches Woodlands Zone A seats S1–S9 to the artwork labels S01–S09 while
  retaining the live catalog identities used by favourite-seat selection.
- Adds a repository maintenance skill and detailed workflow for safely updating
  added, removed, renamed, or visually moved seats.

## Installation

Download `nlb-seat-helper.zip` from this release's Assets, extract it, and load
the extracted folder through Chrome's **Load unpacked** extension option. Do
not use GitHub's automatically generated source-code archives.

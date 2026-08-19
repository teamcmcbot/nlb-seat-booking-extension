# NLB Seat Helper v1.3.1

This patch improves switching between libraries with saved favourite seats
and prepares local profile storage for the public-release Settings work.

It includes all seat-picker and seat-plan maintenance improvements introduced
in v1.3.0.

## Highlights

- Automatically selects the first area containing a valid saved favourite
  when switching to a library, while retaining the explicit area choice for a
  library without favourites.
- Recovers an empty or obsolete saved area using the same favourite-area
  fallback when the extension starts.
- Migrates raw account-key suffixes to installation-local HMAC-derived opaque
  profiles, verifies targets before deleting legacy keys, and resumes safely
  after an interrupted migration.
- Gives signed-out favourites a permanent Guest profile and asks each account
  whether to copy those favourites or keep them separate. Profiles that copy
  are prompted again only for newly added Guest favourites.
- Removes the raw NLB user ID from persistent extension storage, visible
  header text, tooltips, and accessibility labels.
- Shows stable neutral account labels such as **Profile 1 · Signed in** for
  users who switch between multiple accounts.
- Centralizes local-profile storage validation, inventory, and scoped deletion
  primitives ahead of the Settings UI.
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
- Keeps developer maintenance controls out of normal release builds and adds a
  dedicated maintenance build with embedded extension provenance and clearly
  marked Chrome name, description, and display version.
- Makes the routine audit export refresh `GetAccountInfo` once with zero
  `SearchAvailableAreas` calls, using reviewed map paths to refresh every known
  image and fingerprint directly.
- Adds optional selected-library URL discovery with at most two sequential
  branch-level searches and exact-area response association.
- Rejects NLB's observed all-false post-midnight `01:00` placeholder and reuses
  the bounded future-date interval scanner for today's otherwise-unknown
  timeline without overriding valid false matrix values.
- Invalidates date-less availability and refreshes account state once when the
  Singapore calendar date rolls over.
- Adds one-command candidate capture plus JSON/HTML drift reporting, with a
  distinct incomplete-evidence outcome when exact-area discovery fails.
- Adds proposal-only batch preparation and an HTML review index for every
  annotation-affecting drifted area without changing the reviewed baseline.
- Prevents multi-area availability responses from assigning a neighboring
  area's seat plan or seat identities to the requested area, and keeps a
  reviewed area's expected map path subject to its existing fingerprint check.
- Matches Woodlands Zone A seats S1–S9 to the artwork labels S01–S09 while
  retaining the live catalog identities used by favourite-seat selection.
- Adds a repository maintenance skill and detailed workflow for safely updating
  added, removed, renamed, or visually moved seats.
- Documents the signed-in Chrome, unpacked-build, download, network, reusable
  agent prompts, and optional subagent boundaries for a complete seat-plan
  audit. DevTools and Apple Events permissions are not required.
- Adds store-style README artwork captured from the current availability panel
  and interactive seat picker, with signed-in account identifiers removed.
- Documents the Chrome `https://www.nlb.gov.sg` computer-use permission needed
  for an agent to claim the existing signed-in tab; full CDP access remains
  unnecessary.

## Known limitations

- NLB was confirmed to return a placeholder shortly after midnight and a
  normal matrix after 08:00 SGT; the exact recovery time between those points
  remains unknown.

## Installation

Download `nlb-seat-helper.zip` from this release's Assets, extract it, and load
the extracted folder through Chrome's **Load unpacked** extension option. Do
not use GitHub's automatically generated source-code archives.

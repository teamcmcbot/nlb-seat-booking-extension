# Library Seats SG - for NLB v1.3.1

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
- Gives signed-out favourites a permanent Guest profile and an account-specific
  sync toggle. Sync is enabled by default and automatically copies newly added
  signed-out favourites into the account without removing the Guest copy.
- Removes the complete raw NLB user ID from persistent extension storage,
  visible markup, tooltips, and accessibility labels.
- Shows an in-memory first/last-character masked identifier in the natural
  **Signed in as A*******Z** order, with the stable **Profile N** label rendered
  as a separate badge for users who switch between accounts.
- Adds an accessible Settings dialog with first-use session/privacy
  disclosure, project links, opaque profile summaries, favourite-sync preference
  controls, and a reset-and-refresh recovery action.
- Adds separately confirmed controls for clearing Guest, clearing the current
  profile without changing its identity, and clearing all extension-local
  data.
- Hides account-specific profiles while signed out and hides every inactive
  account while signed in, preventing their labels, favourite counts, and
  saved-area status from being exposed through Settings on a shared browser.
- Adds a user-facing Settings guide covering every reset and deletion action
  and the safe sign-out-then-clear sequence for public computers.
- Adds an installation-wide booking default in Settings, with an accessible
  information control explaining combined versus separate adjacent-hour
  requests. New installations default to combining adjacent hours while the
  booking panel retains its per-selection override.
- Adopts the public product name **Library Seats SG - for NLB** and moves the
  masked current-account indicator onto a compact second header row while
  keeping all account and utility buttons together on the first row.
- Replaces the generic manifest description with the final 123-character
  Chrome Web Store summary covering favourites, availability, bookings, and
  cancellations.
- Adds a third-party-material-free 440×280 promotional tile, authentic current
  signed-out 1280×800 overview and 200%-zoom interactive seat-picker captures,
  and a privacy-safe 640×400 Settings capture for the Chrome Web Store listing.
- Highlights the current signed-in profile in Settings with a labelled,
  green-accented card.
- Adds a standalone privacy policy and Chrome Web Store declaration worksheet
  covering transient NLB data, local preferences, retention, deletion, and
  Limited Use commitments.
- Rewrites the README introduction for frequent seat-booking users, puts the
  planned Chrome Web Store installation first, and explains that unpacked
  installation data will not migrate automatically.
- Moves the exhaustive capability inventory into `docs/features.md` so the
  README remains useful to prospective users while technical behavior stays
  documented.
- Points the in-extension Privacy link at the default-branch privacy policy.
- Adds end-user Terms of Use, an MIT code licence, a notice excluding NLB and
  third-party marks and materials, and a security policy with explicit safe
  research boundaries.
- Adds privacy-safe GitHub bug and feature templates and direct Terms and
  License links in Settings.
- Includes the project licence, NLB-material notice, and runtime dependency
  notices in every unpacked build and packaged release.
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

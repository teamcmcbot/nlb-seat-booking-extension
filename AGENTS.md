# Contributor and Agent Guide

This file applies to the entire repository. It describes how contributors and
coding agents should understand, change, test, and release Library Seats SG -
for NLB.

## Project overview

Library Seats SG - for NLB is a Manifest V3 Chrome extension injected into:

```text
https://www.nlb.gov.sg/seatbooking/*
```

It adds a React interface over NLB's existing Seat Booking website. It uses the
tab's NLB session through same-origin requests with `credentials: "include"`.
It must never collect credentials, read cookies directly, or persist
authentication tokens.

The project uses React, TypeScript, Vite, and Chrome local storage. Vite builds
one content-script bundle and one stylesheet into `dist/`. The distributable
artifact is `nlb-seat-helper.zip`.

Important paths:

| Path | Responsibility |
| --- | --- |
| `src/api/` | Same-origin account, availability, and booking requests. |
| `src/models/` | Normalized application types. |
| `src/services/` | Parsing, rules, persistence, authentication, conflicts, and booking plans. |
| `src/components/SeatAssistant.tsx` | Seat selection, availability, map, confirmation, and booking UI. |
| `src/content/App.tsx` | Extension shell, account lifecycle, route detection, and header controls. |
| `src/content/styles.css` | Extension UI styles. |
| `public/manifest.json` | Chrome manifest and extension version. |
| `docs/` | API, architecture, testing, schemas, examples, and release documentation. |
| `scripts/package-extension.mjs` | Production ZIP validation and packaging. |

Read `README.md`, `docs/extension-architecture.md`, and `docs/nlb-api.md`
before changing account, availability, or booking behavior.

## Integration invariants

NLB's APIs are unofficial and reverse-engineered. Preserve these safety rules:

- Treat all network payloads as `unknown` and normalize only validated fields.
- Send NLB requests with the existing page session. Do not add cookie
  permissions or handle passwords, authorization codes, or tokens.
- Treat `GetAccountInfo` → `seats[].hasAvailableSlots` as current-day
  reference availability only; the entries contain no calendar date.
- Use date-specific `SearchAvailableAreas` checks for tomorrow and other
  future dates.
- A map-discovery response may supply `areaMapUrls`, but must not alter the
  availability timeline.
- Refresh account data and run exact selected-block preflight before booking.
  Preflight may reject a current-day selection but must never upgrade a false
  current-day matrix value.
- Treat `bookings/Book` as the final booking authority.
- Enable cancellation only for a booking with an ID, exact `lastAction:
  "Book"`, `canCancelStatus: true`, and a start time later than the current
  time.
- Cancel complete bookings by booking ID. Never imply that one timeline cell
  can be removed from a multi-hour booking.
- Do not automatically retry cancellation requests. Reconcile uncertain
  results through a fresh `GetAccountInfo` response.
- Fail closed: malformed, timed-out, failed, or ambiguous availability must
  not become selectable.
- Keep NLB requests sequential where documented to reduce service load and
  avoid duplicate booking risk.
- Continue to use `OffsiteMode` unless a separately reviewed implementation
  genuinely verifies NLB's branch-specific GPS/geofence state. Do not claim
  `OnsiteModeGps` merely by changing a query parameter.
- Keep favourites and branch/area preferences isolated by NLB `userId`.
- Only one NLB account can own the browser session at a time; “multiple
  account support” means preserving separate local profiles across account
  switches, not simultaneous authenticated sessions.

Never commit raw account or API responses, credentials, booking references,
user IDs, cookies, or other unredacted personal data. A product screenshot is
not raw account data: explicitly approved screenshots may retain feature data
such as library, area, date, seat, and time when the UI already masks account
identity and no credentials, cookies, full user IDs, booking reference
numbers, or other sensitive identifiers are visible. Sanitize fixtures before
adding them under `docs/examples/`.

## Documentation guidelines

Documentation is part of the implementation, not a follow-up task. Update it
in the same branch whenever behavior or an observed API contract changes.

- Update `README.md` for installation steps, user-visible behavior, privacy,
  permissions, and normal usage.
- Update `docs/extension-architecture.md` for state ownership, data flow,
  persistence, navigation handling, matching, and failure behavior.
- Update `docs/nlb-api.md` for endpoints, parameters, request bodies, observed
  response fields, mode behavior, and authority boundaries.
- Update `docs/schemas/` when the extension starts consuming a new response
  field. Keep schemas permissive of unrelated server fields.
- Update sanitized examples only when they improve understanding of a consumed
  contract. Clearly distinguish observed payloads from illustrative shapes.
- Update `docs/holiday-and-closure-testing.md` when date or availability logic
  changes, even if explicit holiday support remains unfinished.
- Update `RELEASE_NOTES.md` for every release-bound change and
  `docs/releasing.md` when the release process or current release command
  changes.

State evidence carefully. Label reverse-engineered behavior as observed,
point-in-time, inferred, or unverified as appropriate. Do not present an
illustrative JSON shape as an authoritative server contract.

When availability behavior changes, document all four stages separately:

1. initial timeline source;
2. manual refresh/check behavior;
3. map discovery; and
4. booking-time preflight and final submission.

## Seat-plan maintenance

Before adding, removing, renaming, or moving seat-plan annotations, follow
`docs/seat-plan-maintenance.md` and use the repository `maintain-seat-plans`
skill. Run `npm run seat-plans:audit` against a freshly sanitized catalog and
`npm run seat-plans:verify` before handoff. Never commit raw account responses,
the ignored image cache, generated work packets, or unreviewed OCR/computer-
vision output. A changed or missing image fingerprint must fail closed until a
person verifies every affected hotspot.

For a complete live audit, check the prerequisites documented in
`docs/seat-plan-maintenance.md`. The NLB tab must have the latest unpacked
build and an active Seat Booking session. Prefer browser control of the visible,
confirmation-gated **Seat-plan maintenance** export; do not inject JavaScript.
If browser control cannot reach the tab or dialog, ask the user to click the
same visible control. Apple Events permission is unnecessary. Auditing never
authorizes changing the reviewed baseline.

## Change workflow

### 1. Orient and protect existing work

Before editing:

```bash
git status --short --branch
git diff
```

Preserve unrelated user changes. Do not reset, overwrite, or reformat files
outside the requested scope.

### 2. Create a branch

Do not develop directly on `main`. Start from the intended base and use a
descriptive branch. Codex-created branches should use the `codex/` prefix:

```bash
git switch main
git pull --ff-only
git switch -c codex/<short-change-name>
```

Do not switch branches over uncommitted user changes unless it is known to be
safe. Never force-push or rewrite shared history without explicit approval.

### 3. Implement the smallest coherent change

- Follow the existing API/service/component separation.
- Keep account and network state in memory unless persistence is explicitly
  required.
- Store only the minimum local data needed for favourites and preferences.
- Avoid unrelated cleanup during a feature or bug fix.
- Update relevant documentation and release notes with the code.

### 4. Bump the version for release-bound work

Use semantic versioning:

- patch: bug fixes and compatible refinements;
- minor: new backward-compatible features; and
- major: incompatible behavior or storage/API changes requiring migration.

Keep these versions identical:

- `package.json`;
- `package-lock.json`; and
- `public/manifest.json`.

Do not create a second version bump for additional fixes in the same
unreleased branch. Documentation-only work does not require a version bump
unless it is being included as a new release.

Update the version heading and contents in `RELEASE_NOTES.md`, and keep
version-specific commands in `docs/releasing.md` current.

### 5. Run automated validation

At minimum, run:

```bash
npm ci
npm run typecheck
npm run build
git diff --check
```

Use `npm install` instead of `npm ci` only when intentionally changing
dependencies or the lockfile.

For release-bound work, also run:

```bash
npm run package
unzip -t nlb-seat-helper.zip
unzip -l nlb-seat-helper.zip
```

Confirm the archive root contains `manifest.json`, `content.js`, and
`content.css`. `dist/` and `nlb-seat-helper.zip` are generated and ignored;
do not commit them.

### 6. Test locally with the user

Build first, then ask the user to reload the unpacked extension from `dist/`
at `chrome://extensions` and refresh the NLB Seat Booking tab.

Choose smoke tests relevant to the change. For account or availability work,
check:

- signed-out rendering, refresh, and minimize/maximize behavior;
- sign-in redirect, automatic return detection, and session refresh;
- sign-out from both the Seat Booking and central NLB sessions;
- switching between accounts and restoring each account's favourites and
  branch/area preference;
- `reload=true` handling on home, account, booking-details, and my-bookings
  routes;
- today's immediate `hasAvailableSlots` timeline and one-request refresh;
- tomorrow/future date-specific availability checks;
- area-map loading and area changes;
- stale availability being rejected during preflight; and
- quota, existing-booking conflict, and timeline selection behavior.

Inspect DevTools requests and console errors when diagnosing integration
issues. Do not make a real booking, cancel a booking, or alter account data
solely for testing unless the user explicitly agrees to that action.

Record the tested browser, route, account state, date case, and result in the
handoff or pull request. If live testing cannot be completed, state that
clearly; automated checks are not a substitute for testing against NLB.

### 7. Commit and push the branch

After automated checks pass and the user confirms the local smoke test:

```bash
git status --short
git diff --check
git add <intentional-files>
git commit -m "<concise change summary>"
git push -u origin <branch-name>
```

Review the staged diff before committing. Do not include secrets, unredacted
captured personal data, generated build output, or unrelated user changes.
Explicitly approved UI-masked product screenshots may be included when they
pass the screenshot privacy check above.

### 8. Review and merge to `main`

Open a pull request or provide the pushed branch for review. Include:

- user-visible behavior changed;
- API or storage assumptions;
- documentation updated;
- automated checks run;
- local smoke tests completed; and
- known gaps or unverified live scenarios.

Merge only after the user/reviewer approves the behavior. Prefer the
repository's normal merge strategy and do not bypass required checks. Confirm
the merged `main` contains the intended version and release notes.

### 9. Package and release from `main`

From the merged, up-to-date `main`:

```bash
git switch main
git pull --ff-only
npm ci
npm run package
unzip -t nlb-seat-helper.zip
```

Follow `docs/releasing.md` to create and push the version tag and publish the
GitHub release with `nlb-seat-helper.zip` as the release asset. Do not upload
GitHub's generated source archive as the installable extension.

Tagging, pushing, merging, and publishing a release change remote state. Do
not perform those actions unless the user has explicitly authorized them.

### 10. Verify the published release

- Confirm the GitHub release is marked as the latest release.
- Download the published ZIP and run `unzip -t` on that downloaded asset.
- Confirm the archive version matches the Git tag and release title.
- Load the downloaded artifact as an unpacked extension and repeat the critical
  smoke test.
- Report the branch, commit, tag, release URL, tests, and any remaining known
  limitations.

## Definition of done

A change is complete when:

- the requested behavior is implemented without unrelated changes;
- privacy and API safety invariants remain intact;
- relevant documentation and schemas are updated;
- typecheck, build, and diff checks pass;
- release-bound changes package successfully;
- the user has completed the relevant local Chrome smoke test;
- changes are committed and pushed when requested; and
- merge and release occur only after explicit approval.

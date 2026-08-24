# Packaging and releasing Chrome and Firefox builds

The project has one source tree and version, but separate Chrome/GitHub and
Firefox Add-ons (AMO) artifacts.

## Before packaging

1. Make sure `main` contains the intended release.
2. Update the version in all three:
   - `package.json`
   - `package-lock.json`
   - `public/manifest.json`
3. Make sure the three versions are identical.
4. Install the locked dependencies with `npm ci`.
5. Run the regression suite with `npm test`.

## Build the Chrome/GitHub release asset

Run:

```bash
npm run package
```

This command:

1. runs the TypeScript checks;
2. creates the production extension in `dist/`;
3. copies the project licence, NLB-material notice, and third-party runtime
   notices into `dist/`;
4. verifies that `manifest.json`, `content.js`, `content.css`, `LICENSE.txt`,
   `NOTICE.txt`, and `THIRD_PARTY_NOTICES.txt` exist;
5. verifies that the package and extension versions match; and
6. creates `nlb-seat-helper.zip` with `manifest.json` at the archive root.

Validate the archive before uploading:

```bash
unzip -t nlb-seat-helper.zip
unzip -l nlb-seat-helper.zip
```

The archive root must contain:

```text
manifest.json
content.js
content.css
LICENSE.txt
NOTICE.txt
THIRD_PARTY_NOTICES.txt
```

## Build the Firefox Add-ons artifacts

Run:

```bash
npm run package:firefox
npm run package:firefox-source
unzip -t nlb-seat-helper-firefox.zip
unzip -t nlb-seat-helper-firefox-source.zip
unzip -l nlb-seat-helper-firefox.zip
unzip -l nlb-seat-helper-firefox-source.zip
```

`nlb-seat-helper-firefox.zip` is the built AMO upload. The Firefox lint wrapper
fails for every unreviewed error, notice, or warning. The three allowed warnings
and their rationale are documented in the Firefox publication plan.

`nlb-seat-helper-firefox-source.zip` contains the exact source and locked build
inputs required by Mozilla reviewers. Extract it into an empty directory and
follow `AMO_BUILD.md` before each submission. Confirm the rebuilt extension
files match the intended AMO package; ZIP hashes may differ because archive
timestamps differ.

The unsigned Firefox package is not a general Firefox install download. AMO
signs approved packages, so publish the signed AMO listing rather than adding
the unsigned ZIP to a GitHub release.

## Publish

For version `1.4.0`:

```bash
git tag v1.4.0
git push origin v1.4.0
gh release create v1.4.0 nlb-seat-helper.zip \
  --repo teamcmcbot/nlb-seat-booking-extension \
  --title "Library Seats SG - for NLB v1.4.0" \
  --notes-file RELEASE_NOTES.md
```

Use a stable asset name, `nlb-seat-helper.zip`, for every release. GitHub
allows the same asset name on different releases, and it gives users a clear
choice that is distinct from GitHub's automatic source archives.

## Verify

After publishing:

1. Open the public release page.
2. Confirm the release is marked **Latest**.
3. Download `nlb-seat-helper.zip` from **Assets**.
4. Confirm the downloaded archive passes `unzip -t`.
5. Load the extracted directory in Chrome and run a smoke test on the NLB Seat
   Booking page.
6. Confirm the AMO listing shows the same version, then install Mozilla's signed
   build and repeat the critical Firefox smoke test.

Do not ask users to download GitHub's automatically generated **Source code**
ZIP or tarball. Those archives contain the project source, not the built
extension.

Uploading to AMO, tagging, pushing, and publishing releases are remote-state
changes and require explicit maintainer authorization.

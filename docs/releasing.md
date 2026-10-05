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

The Firefox package is the unsigned AMO submission artifact, not a replacement
for Mozilla's signed AMO distribution. Attach both Firefox artifacts to the
GitHub release for reproducibility, while directing users to the signed AMO
listing for normal Firefox installation.

## Update the browser stores

Complete these steps only after the tagged GitHub release artifacts have been
verified. Store review and publication are separate remote-state changes and
require maintainer authorization and access to the existing publisher
accounts.

### Chrome Web Store

Update the existing item; do not create a second listing for a routine version
update.

1. Open the extension in the
   [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
2. Confirm `public/manifest.json` and the ZIP both contain a version higher
   than the currently published version.
3. On **Package**, choose **Upload new package** and upload
   `nlb-seat-helper.zip`. The ZIP must contain the complete extension, with
   `manifest.json` at its root.
4. Review **Store listing**, **Privacy practices**, and **Distribution**. Update
   them whenever the release changes user-visible behavior, permissions, data
   handling, countries, visibility, or testing channel.
5. Select **Submit for review**. Choose deferred publishing if the approved
   version must wait for a coordinated release; otherwise allow publication
   after approval.
6. After publication, confirm the listing shows the intended version. In a
   clean Chrome profile, install or update the store build and repeat the
   critical smoke tests. Existing users remain on the prior version until the
   update is published and Chrome's update cycle reaches them.

See Google's official
[update instructions](https://developer.chrome.com/docs/webstore/update/).

### Firefox Add-ons (AMO)

Upload the version from the existing AMO add-on page so Mozilla recognizes it
as an update rather than a separate add-on.

1. Open **Developer Hub → My Add-ons** on
   [addons.mozilla.org](https://addons.mozilla.org/developers/) and select the
   existing Library Seats SG add-on.
2. Choose to upload a new version and provide
   `nlb-seat-helper-firefox.zip`.
3. Review the validator output. The repository lint permits only the three
   reviewed warnings documented in
   [Firefox Add-ons publication](firefox-add-ons-publication.md); investigate
   any additional AMO finding before continuing.
4. When asked whether source code is required, answer yes for the bundled and
   minified build, then upload `nlb-seat-helper-firefox-source.zip`. Include the
   build and reviewer information from
   [Firefox Add-ons submission](firefox-add-ons-submission.md).
5. Enter version-specific release notes, keep the platform set to Firefox
   Desktop, and submit the version.
6. After Mozilla signs and approves the version, confirm the AMO listing shows
   the intended version. Install the signed listing build in Firefox Desktop
   140 or newer and repeat the critical smoke tests. AMO-listed installations
   receive approved higher versions through Firefox's normal update checks.

See Mozilla's official
[add-on submission and update instructions](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)
and [source-code submission guidance](https://extensionworkshop.com/documentation/publish/source-code-submission/).

## Publish

For version `1.5.0`:

```bash
git tag v1.5.0
git push origin v1.5.0
gh release create v1.5.0 \
  nlb-seat-helper.zip \
  nlb-seat-helper-firefox.zip \
  nlb-seat-helper-firefox-source.zip \
  --repo teamcmcbot/nlb-seat-booking-extension \
  --title "Library Seats SG - for NLB v1.5.0" \
  --notes-file /tmp/release-notes-v1.5.0.md
```

`RELEASE_NOTES.md` is the cumulative repository changelog. Create a
version-specific notes file containing only the current release section and
pass that file to `gh release create` or `gh release edit`; individual GitHub
release pages should not repeat earlier versions' notes. Use stable asset
names for all three packages. GitHub allows the same names on different
releases, and they remain distinct from GitHub's automatically generated
source archives.

## Verify

After publishing:

1. Open the public release page.
2. Confirm the release is marked **Latest**.
3. Download `nlb-seat-helper.zip`, `nlb-seat-helper-firefox.zip`, and
   `nlb-seat-helper-firefox-source.zip` from **Assets**.
4. Confirm each downloaded archive passes `unzip -t`.
5. Load the extracted directory in Chrome and run a smoke test on the NLB Seat
   Booking page, including automatic availability triggers, unchanged and
   changed favourite snapshots, signed-out view-only cells, and both completed
   status action headers.
6. Confirm the AMO listing shows the same version, then install Mozilla's signed
   build and repeat the critical Firefox smoke test, including immediate map
   rendering on the first picker opening.

Do not ask users to download GitHub's automatically generated **Source code**
ZIP or tarball. Those archives contain the project source, not the built
extension.

Uploading to AMO, tagging, pushing, and publishing releases are remote-state
changes and require explicit maintainer authorization.

## Maintenance workflow changes

The anonymous seat-plan workflow is repository tooling and does not require a
new installable extension version when runtime behavior is unchanged. Run the
collector tests, full test suite, typecheck, build, and `seat-plans:verify`.
Validate a fresh anonymous collection and full audit locally, then run the
workflow on GitHub after the branch is approved and published. Local browser
success does not establish access from a hosted runner.

The daily schedule becomes active on the default branch. Manual dispatch
supports an optional numeric branch ID for bounded URL discovery. No NLB
credentials are configured. Publishing/merging the workflow requires the usual
remote-state authorization. Audit artifacts and baseline updates are separate
from extension release assets; the workflow never publishes a release.

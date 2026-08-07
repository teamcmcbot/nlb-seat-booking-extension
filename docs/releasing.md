# Creating a GitHub Release

GitHub Releases provide a versioned, built ZIP that non-developers can install
without cloning the repository or running npm.

## Before packaging

1. Make sure `main` contains the intended release.
2. Update the version in both:
   - `package.json`
   - `public/manifest.json`
3. Make sure the two versions are identical.
4. Install the locked dependencies with `npm ci`.

## Build the release asset

Run:

```bash
npm run package
```

This command:

1. runs the TypeScript checks;
2. creates the production extension in `dist/`;
3. verifies that `manifest.json`, `content.js`, and `content.css` exist;
4. verifies that the package and extension versions match; and
5. creates `nlb-seat-helper.zip` with `manifest.json` at the archive root.

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
```

## Publish

For version `1.1.0`:

```bash
git tag v1.1.0
git push origin v1.1.0
gh release create v1.1.0 nlb-seat-helper.zip \
  --repo teamcmcbot/nlb-seat-booking-extension \
  --title "NLB Seat Helper v1.1.0" \
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

Do not ask users to download GitHub's automatically generated **Source code**
ZIP or tarball. Those archives contain the project source, not the built
extension.

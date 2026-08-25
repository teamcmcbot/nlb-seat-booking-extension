import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputPath = join(projectRoot, "nlb-seat-helper-firefox-source.zip");
const sourceEntries = [
  "AMO_BUILD.md",
  "LICENSE",
  "NOTICE",
  "THIRD_PARTY_NOTICES",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "vite.config.ts",
  "docs/examples/chrome-storage-profiles.sanitized.json",
  "public",
  "src",
  "scripts/copy-release-notices.mjs",
  "scripts/lint-firefox.mjs",
  "scripts/package-firefox-source.mjs",
];

for (const entry of sourceEntries) {
  if (!existsSync(join(projectRoot, entry))) {
    throw new Error(`Firefox source package is missing ${entry}.`);
  }
}

const packageJson = JSON.parse(
  readFileSync(join(projectRoot, "package.json"), "utf8"),
);
const manifest = JSON.parse(
  readFileSync(join(projectRoot, "public/manifest.json"), "utf8"),
);

if (packageJson.version !== manifest.version) {
  throw new Error(
    `Version mismatch: package.json is ${packageJson.version}, ` +
      `but manifest.json is ${manifest.version}.`,
  );
}

rmSync(outputPath, { force: true });
execFileSync("zip", ["-q", "-r", outputPath, ...sourceEntries], {
  cwd: projectRoot,
  stdio: "inherit",
});

console.log(
  `Created nlb-seat-helper-firefox-source.zip for version ${manifest.version}.`,
);

import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const executable = join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "web-ext.cmd" : "web-ext",
);
const output = execFileSync(
  executable,
  ["lint", "--source-dir", "dist", "--output", "json", "--boring"],
  {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  },
);
const report = JSON.parse(output);
const warnings = Array.isArray(report.warnings) ? report.warnings : [];
const expectedWarnings = warnings.filter(
  (warning) =>
    (warning.code === "KEY_FIREFOX_ANDROID_UNSUPPORTED_BY_MIN_VERSION" &&
      warning.file === "manifest.json") ||
    (warning.code === "UNSAFE_VAR_ASSIGNMENT" &&
      warning.file === "content.js"),
);
const reactWarnings = expectedWarnings.filter(
  (warning) => warning.code === "UNSAFE_VAR_ASSIGNMENT",
);
const androidWarnings = expectedWarnings.filter(
  (warning) =>
    warning.code === "KEY_FIREFOX_ANDROID_UNSUPPORTED_BY_MIN_VERSION",
);

if (
  report.summary?.errors !== 0 ||
  report.summary?.notices !== 0 ||
  warnings.length !== 3 ||
  expectedWarnings.length !== 3 ||
  reactWarnings.length !== 2 ||
  androidWarnings.length !== 1
) {
  console.error(JSON.stringify(report, null, 2));
  throw new Error("Firefox lint reported an unexpected error, notice, or warning.");
}

console.log(
  "Firefox lint passed with the three reviewed warnings: two React DOM " +
    "innerHTML implementation warnings and one desktop-only Android minimum-version warning.",
);

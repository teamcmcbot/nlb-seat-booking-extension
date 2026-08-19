import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { REPO_ROOT, parseArgs, readJson } from "./seat-plan-tools.mjs";

const args = parseArgs(process.argv.slice(2));
if (!args.catalog) {
  throw new Error(
    "Usage: npm run seat-plans:full-audit -- --catalog <sanitized-export.json> [--output <directory>]",
  );
}

const stamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
const outputDir = path.resolve(REPO_ROOT, args.output || `seat-plan-work/audit-${stamp}`);
const catalogPath = path.resolve(REPO_ROOT, args.catalog);
const catalog = await readJson(catalogPath);
const packageMetadata = await readJson(path.join(REPO_ROOT, "package.json"));
const acceptedModes = new Set(["catalog", "targeted-discovery"]);
if (!acceptedModes.has(catalog.exportMetadata?.mode)) {
  throw new Error("The catalog is not a recognized sanitized maintenance export.");
}
if (catalog.exportMetadata.extensionVersion !== packageMetadata.version) {
  throw new Error(
    `Catalog extension version ${catalog.exportMetadata.extensionVersion ?? "missing"} does not match this worktree (${packageMetadata.version}). Reload the current build and export again.`,
  );
}
if (
  catalog.exportMetadata.mode === "targeted-discovery" &&
  (catalog.mapDiscovery?.requested !== true || catalog.mapDiscovery?.scope !== "branch")
) {
  throw new Error("The targeted-discovery export lacks its branch discovery report.");
}
const candidatePath = path.join(outputDir, "candidate.json");
const reportPath = path.join(outputDir, "drift.json");
const htmlPath = path.join(outputDir, "report.html");
await mkdir(outputDir, { recursive: true });

await runNode([
  "scripts/seat-plan-capture.mjs",
  "--catalog", catalogPath,
  "--output", candidatePath,
]);
const auditExit = await runNode([
  "scripts/seat-plan-audit.mjs",
  "--snapshot", candidatePath,
  "--output", reportPath,
  "--html", htmlPath,
], new Set([0, 2, 3]));

console.log(`Candidate: ${path.relative(REPO_ROOT, candidatePath)}`);
console.log(`JSON report: ${path.relative(REPO_ROOT, reportPath)}`);
console.log(`HTML report: ${path.relative(REPO_ROOT, htmlPath)}`);
process.exitCode = auditExit;

function runNode(argv, accepted = new Set([0])) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, argv, {
      cwd: REPO_ROOT,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Seat-plan command terminated by ${signal}.`));
      } else if (!accepted.has(code)) {
        reject(new Error(`Seat-plan command failed with exit code ${code}.`));
      } else {
        resolve(code);
      }
    });
  });
}

import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { REPO_ROOT, parseArgs, readJson, writeJson } from "./seat-plan-tools.mjs";

const args = parseArgs(process.argv.slice(2));
if (!args.report) {
  throw new Error(
    "Usage: npm run seat-plans:prepare-drift -- --report <drift.json> [--snapshot <candidate.json>] [--output <directory>]",
  );
}
const reportPath = path.resolve(REPO_ROOT, args.report);
const report = await readJson(reportPath);
const snapshotPath = path.resolve(
  REPO_ROOT,
  args.snapshot || report.snapshot || "",
);
const outputDir = path.resolve(
  REPO_ROOT,
  args.output || path.join(path.dirname(reportPath), "annotation-review"),
);
await mkdir(outputDir, { recursive: true });

const annotationTypes = new Set([
  "branch-added", "branch-removed", "area-added", "area-removed", "map-path", "image-width", "image-height",
  "image-sha256", "seat-added", "seat-removed", "seat-name", "seat-id",
]);
const affected = [...new Set(
  report.changes
    .filter((change) => annotationTypes.has(change.type))
    .map((change) => change.key),
)].sort();
const results = [];

for (const key of affected) {
  const [branchId, areaId] = key.split(":");
  const types = [...new Set(report.changes.filter((change) => change.key === key).map((change) => change.type))];
  if (types.includes("branch-added") || types.includes("branch-removed")) {
    const change = report.changes.find((candidate) => candidate.key === key && types.includes(candidate.type));
    results.push({
      key,
      status: "manual",
      types,
      reason: change?.actionPlan?.resolution?.join(" ") ?? "Branch lifecycle changes require catalog, operational-status, archive, and annotation review.",
    });
    continue;
  }
  if (types.includes("area-added") || types.includes("area-removed")) {
    results.push({ key, status: "manual", types, reason: "Area lifecycle changes require catalog and annotation-design review." });
    continue;
  }
  const areaDir = path.join(outputDir, `${branchId}-${areaId}`);
  try {
    await runNode([
      "scripts/seat-plan-prepare.mjs",
      "--branch", branchId,
      "--area", areaId,
      "--snapshot", snapshotPath,
      "--output", areaDir,
    ]);
    results.push({
      key,
      status: "prepared",
      types,
      comparison: path.relative(outputDir, path.join(areaDir, "comparison.html")),
    });
  } catch (error) {
    results.push({ key, status: "manual", types, reason: error.message });
  }
}

const manifest = {
  schemaVersion: 1,
  proposalOnly: true,
  sourceReport: path.relative(REPO_ROOT, reportPath),
  snapshot: path.relative(REPO_ROOT, snapshotPath),
  generatedAt: new Date().toISOString(),
  results,
};
await writeJson(path.join(outputDir, "manifest.json"), manifest);
await writeFile(path.join(outputDir, "index.html"), renderIndex(manifest));
console.log(`Prepared annotation review index: ${path.relative(REPO_ROOT, path.join(outputDir, "index.html"))}`);
if (results.some(({ status }) => status === "manual")) {
  process.exitCode = 3;
}

function runNode(argv) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, argv, { cwd: REPO_ROOT, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) reject(new Error(`Preparation terminated by ${signal}.`));
      else if (code !== 0) reject(new Error(`Preparation failed with exit code ${code}.`));
      else resolve();
    });
  });
}

function renderIndex(manifest) {
  const rows = manifest.results.map((result) => {
    const review = result.comparison
      ? `<a href="${escapeHtml(result.comparison)}">Open comparison</a>`
      : escapeHtml(result.reason ?? "Manual review required.");
    return `<tr><td>${escapeHtml(result.key)}</td><td>${escapeHtml(result.status)}</td><td>${escapeHtml(result.types.join(", "))}</td><td>${review}</td></tr>`;
  }).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Seat-plan annotation review</title><style>body{max-width:1100px;margin:32px auto;padding:0 20px;font:15px/1.5 system-ui;color:#183128}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #cfdad5;text-align:left;vertical-align:top}th{background:#f4f7f5}.note{padding:12px;border-left:4px solid #b27800;background:#fff7df}</style></head><body><h1>Seat-plan annotation review</h1><p class="note">Generated overlays and coordinates are proposals only. No reviewed baseline or annotation definition was changed.</p>${rows ? `<table><thead><tr><th>Area</th><th>Status</th><th>Drift</th><th>Review</th></tr></thead><tbody>${rows}</tbody></table>` : "<p>No annotation-affecting drift requires preparation.</p>"}</body></html>\n`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
